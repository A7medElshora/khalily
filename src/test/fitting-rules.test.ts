import { describe, expect, it } from "vitest";
import { categoryForFashn, preferredCameraFacing, validateGarmentImage } from "@/lib/fitting-rules";

describe("fitting room product and camera rules", () => {
  it("sends tops to the FASHN tops category", () => {
    expect(categoryForFashn("tops")).toBe("tops");
  });

  it("sends bottoms to the FASHN bottoms category", () => {
    expect(categoryForFashn("bottoms")).toBe("bottoms");
  });

  it("sends one-piece garments to the FASHN one-pieces category", () => {
    expect(categoryForFashn("one-pieces")).toBe("one-pieces");
  });

  it("prefers the rear-facing camera on phones and the front-facing camera elsewhere", () => {
    expect(preferredCameraFacing(true)).toBe("environment");
    expect(preferredCameraFacing(false)).toBe("user");
  });

  it("accepts the requested store image formats and flags oversized images", () => {
    expect(validateGarmentImage({ type: "image/webp", size: 300_000, name: "coat.webp" }).supported).toBe(true);
    expect(validateGarmentImage({ type: "image/jpeg", size: 26 * 1024 * 1024, name: "coat.jpg" }).tooLarge).toBe(true);
  });
});