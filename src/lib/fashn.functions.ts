import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { GarmentCategory } from "./fitting-types";
import { categoryForFashn } from "./fitting-rules";

const dataUriSchema = z.string()
  .max(16_000_000)
  .regex(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/);

const apiBase = "https://api.fashn.ai/v1";

async function fashnRequest(path: string, init: RequestInit = {}) {
  const apiKey = process.env["FASHN_API_KEY"];
  if (!apiKey) throw new Error("FASHN is not configured yet. Add the FASHN API key in the secure settings.");
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`FASHN request failed (${response.status}): ${detail.slice(0, 500)}`);
  }
  return response.json() as Promise<Record<string, unknown>>;
}

function outputUrls(value: unknown) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === "string");
  return [];
}

export const getPublicCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return [];
  const publicClient = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
  const { data, error } = await publicClient.rpc("list_public_products");
  if (error || !data?.length) return [];

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return Promise.all(data.map(async (product) => {
    const path = product.catalog_path;
    const { data: signed } = await supabaseAdmin.storage.from("product-catalog").createSignedUrl(path, 60 * 20);
    return {
      ...product,
      imageUrl: signed?.signedUrl ?? "",
      liveOverlayUrl: null,
      hasAiReference: false,
    };
  }));
});

export const startAiTryOn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    productId: z.string().uuid(),
    customerImage: dataUriSchema,
    consent: z.literal(true),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: product, error } = await context.supabase
      .from("products")
      .select("id, store_id, category, ai_reference_path, active")
      .eq("id", data.productId)
      .eq("active", true)
      .maybeSingle();
    if (error || !product?.ai_reference_path) throw new Error("This item does not have an AI reference image ready.");

    const { data: garment, error: imageError } = await context.supabase.storage
      .from("ai-references").download(product.ai_reference_path);
    if (imageError || !garment) throw new Error("The AI reference image could not be opened.");
    if (garment.size > 10 * 1024 * 1024) throw new Error("The AI reference image is too large to process.");
    const bytes = new Uint8Array(await garment.arrayBuffer());
    let binary = "";
    for (let index = 0; index < bytes.length; index += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    }
    const mimeType = garment.type === "image/png" ? "png" : garment.type === "image/webp" ? "webp" : "jpeg";
    const garmentImage = `data:image/${mimeType};base64,${btoa(binary)}`;
    const result = await fashnRequest("/run", {
      method: "POST",
      body: JSON.stringify({
        model_name: "tryon-v1.6",
        inputs: {
          model_image: data.customerImage,
          garment_image: garmentImage,
          category: categoryForFashn(product.category as GarmentCategory),
          mode: "balanced",
          num_samples: 1,
        },
      }),
    });
    const predictionId = typeof result.id === "string" ? result.id : "";
    if (!predictionId) throw new Error("FASHN did not return a prediction identifier.");

    const { data: job, error: jobError } = await context.supabase.from("ai_tryon_jobs").insert({
      store_id: product.store_id,
      product_id: product.id,
      created_by: context.userId,
      prediction_id: predictionId,
      status: typeof result.status === "string" ? result.status : "starting",
    }).select("id").single();
    if (jobError) throw new Error("The try-on was submitted but its status could not be saved.");
    return { jobId: job.id, predictionId };
  });

export const pollAiTryOn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: job, error } = await context.supabase
      .from("ai_tryon_jobs")
      .select("id, prediction_id, status")
      .eq("id", data.jobId)
      .maybeSingle();
    if (error || !job) throw new Error("Try-on job was not found for this store.");
    if (job.status === "completed") return { status: "completed", output: null };

    const result = await fashnRequest(`/status/${encodeURIComponent(job.prediction_id)}`);
    const status = typeof result.status === "string" ? result.status : "processing";
    const urls = outputUrls(result.output);
    const finished = status === "completed" || status === "failed";
    await context.supabase.from("ai_tryon_jobs").update({
      status,
      error_message: typeof result.error === "string" ? result.error.slice(0, 500) : null,
      ...(finished ? { completed_at: new Date().toISOString() } : {}),
    }).eq("id", job.id);
    return {
      status,
      output: status === "completed" ? urls[0] ?? null : null,
      error: status === "failed" ? (typeof result.error === "string" ? result.error : "The provider could not complete this try-on.") : null,
    };
  });

export const removeProductBackground = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ image: dataUriSchema }).parse(input))
  .handler(async ({ data }) => {
    const prediction = await fashnRequest("/run", {
      method: "POST",
      body: JSON.stringify({ model_name: "background-remove", inputs: { image: data.image } }),
    });
    const predictionId = typeof prediction.id === "string" ? prediction.id : "";
    if (!predictionId) throw new Error("The image service did not return a processing identifier.");

    const deadline = Date.now() + 75_000;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 2_500));
      const status = await fashnRequest(`/status/${encodeURIComponent(predictionId)}`);
      if (status.status === "failed") throw new Error("The image service could not remove this background.");
      if (status.status !== "completed") continue;
      const outputUrl = outputUrls(status.output)[0];
      if (!outputUrl) throw new Error("The image service returned no processed image.");
      const outputResponse = await fetch(outputUrl);
      if (!outputResponse.ok) throw new Error("The processed image could not be downloaded.");
      const blob = await outputResponse.blob();
      if (blob.size > 10 * 1024 * 1024) throw new Error("The processed image is too large to save.");
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = "";
      for (let index = 0; index < bytes.length; index += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
      }
      return { image: `data:${blob.type || "image/png"};base64,${btoa(binary)}` };
    }
    throw new Error("Image processing took too long. Try again with a smaller photo.");
  });