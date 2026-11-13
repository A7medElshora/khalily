export type GarmentCategory = "tops" | "bottoms" | "one-pieces";

export interface GarmentProduct {
  id: string;
  name: string;
  description: string;
  category: GarmentCategory;
  collection: string;
  price: number;
  discount_price: number | null;
  colors: string[];
  sizes: string[];
  stock_qty: number;
  imageUrl: string;
  isDemo?: boolean;
  liveOverlayUrl?: string | null;
  hasAiReference?: boolean;
}

export interface PosePoint {
  x: number;
  y: number;
  visibility: number;
}

export type PoseLandmarks = PosePoint[];