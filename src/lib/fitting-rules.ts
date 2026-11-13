import type { GarmentCategory } from "./fitting-types";

export function categoryForFashn(category: GarmentCategory): GarmentCategory {
  return category;
}

export function preferredCameraFacing(isMobile: boolean): "environment" | "user" {
  return isMobile ? "environment" : "user";
}

export function validateGarmentImage(file: Pick<File, "type" | "size" | "name">) {
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  const allowed = ["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    ["jpg", "jpeg", "png", "webp"].includes(extension ?? "");

  return {
    supported: allowed,
    tooLarge: file.size > 25 * 1024 * 1024,
    needsReview: file.size < 180 * 1024,
  };
}