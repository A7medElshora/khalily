import type { PoseLandmarks } from "./fitting-types";

type Point = { x: number; y: number };

function pointAt(points: PoseLandmarks, index: number, width: number, height: number): Point | null {
  const point = points[index];
  if (!point || point.visibility < 0.25) return null;
  return { x: point.x * width, y: point.y * height };
}

function drawTriangle(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  source: [Point, Point, Point],
  destination: [Point, Point, Point],
) {
  const a = source[0];
  const b = source[1];
  const c = source[2];
  const u = destination[0];
  const v = destination[1];
  const w = destination[2];
  if (!a || !b || !c || !u || !v || !w) return;
  const denominator = a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y);
  if (Math.abs(denominator) < 0.001) return;

  const transform = {
    a: (u.x * (b.y - c.y) + v.x * (c.y - a.y) + w.x * (a.y - b.y)) / denominator,
    b: (u.y * (b.y - c.y) + v.y * (c.y - a.y) + w.y * (a.y - b.y)) / denominator,
    c: (u.x * (c.x - b.x) + v.x * (a.x - c.x) + w.x * (b.x - a.x)) / denominator,
    d: (u.y * (c.x - b.x) + v.y * (a.x - c.x) + w.y * (b.x - a.x)) / denominator,
    e: (u.x * (b.x * c.y - c.x * b.y) + v.x * (c.x * a.y - a.x * c.y) + w.x * (a.x * b.y - b.x * a.y)) / denominator,
    f: (u.y * (b.x * c.y - c.x * b.y) + v.y * (c.x * a.y - a.x * c.y) + w.y * (a.x * b.y - b.x * a.y)) / denominator,
  };

  context.save();
  context.beginPath();
  context.moveTo(u.x, u.y);
  context.lineTo(v.x, v.y);
  context.lineTo(w.x, w.y);
  context.closePath();
  context.clip();
  context.transform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f);
  context.drawImage(image, 0, 0);
  context.restore();
}

function mapGarmentPoint(x: number, y: number, quad: [Point, Point, Point, Point]): Point {
  const [topLeft, topRight, bottomLeft, bottomRight] = quad;
  const left = { x: topLeft.x + (bottomLeft.x - topLeft.x) * y, y: topLeft.y + (bottomLeft.y - topLeft.y) * y };
  const right = { x: topRight.x + (bottomRight.x - topRight.x) * y, y: topRight.y + (bottomRight.y - topRight.y) * y };
  return { x: left.x + (right.x - left.x) * x, y: left.y + (right.y - left.y) * x };
}

function drawArmOcclusion(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  points: PoseLandmarks,
  width: number,
  height: number,
  shoulderWidth: number,
) {
  const arms = [[11, 13, 15], [12, 14, 16]];
  for (const arm of arms) {
    const shoulderIndex = arm[0];
    const elbowIndex = arm[1];
    const wristIndex = arm[2];
    if (shoulderIndex === undefined || elbowIndex === undefined || wristIndex === undefined) continue;
    const shoulder = pointAt(points, shoulderIndex, width, height);
    const elbow = pointAt(points, elbowIndex, width, height);
    const wrist = pointAt(points, wristIndex, width, height);
    if (!shoulder || !elbow || !wrist) continue;

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = Math.max(shoulderWidth * 0.22, 12);
    context.beginPath();
    context.moveTo(shoulder.x, shoulder.y);
    context.lineTo(elbow.x, elbow.y);
    context.lineTo(wrist.x, wrist.y);
    context.clip();
    context.drawImage(video, 0, 0, width, height);
    context.restore();
  }
}

/** 2D cloth warp: perspective-style triangle mesh from shoulder/hip landmarks; no fabric simulation. */
export class ClothingOverlayRenderer {
  draw(canvas: HTMLCanvasElement, video: HTMLVideoElement, garment: HTMLImageElement, points: PoseLandmarks) {
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height || garment.naturalWidth === 0) return false;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const context = canvas.getContext("2d");
    if (!context) return false;
    context.clearRect(0, 0, width, height);

    const leftShoulder = pointAt(points, 11, width, height);
    const rightShoulder = pointAt(points, 12, width, height);
    const leftHip = pointAt(points, 23, width, height);
    const rightHip = pointAt(points, 24, width, height);
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return false;

    const center = (left: Point, right: Point): Point => ({ x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 });
    const shoulderCenter = center(leftShoulder, rightShoulder);
    const hipCenter = center(leftHip, rightHip);
    const torsoLength = Math.hypot(hipCenter.x - shoulderCenter.x, hipCenter.y - shoulderCenter.y);
    const shoulderWidth = Math.hypot(rightShoulder.x - leftShoulder.x, rightShoulder.y - leftShoulder.y);
    const hipWidth = Math.hypot(rightHip.x - leftHip.x, rightHip.y - leftHip.y);
    const angle = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x);
    const axisX = { x: Math.cos(angle), y: Math.sin(angle) };
    const axisY = { x: -Math.sin(angle), y: Math.cos(angle) };
    const top = { x: shoulderCenter.x - axisY.x * torsoLength * 0.08, y: shoulderCenter.y - axisY.y * torsoLength * 0.08 };
    const bottom = { x: hipCenter.x + axisY.x * torsoLength * 0.12, y: hipCenter.y + axisY.y * torsoLength * 0.12 };
    const topHalf = shoulderWidth * 0.91;
    const bottomHalf = Math.max(hipWidth * 0.76, shoulderWidth * 0.65);
    const quad: [Point, Point, Point, Point] = [
      { x: top.x - axisX.x * topHalf, y: top.y - axisX.y * topHalf },
      { x: top.x + axisX.x * topHalf, y: top.y + axisX.y * topHalf },
      { x: bottom.x - axisX.x * bottomHalf, y: bottom.y - axisX.y * bottomHalf },
      { x: bottom.x + axisX.x * bottomHalf, y: bottom.y + axisX.y * bottomHalf },
    ];

    const columns = 8;
    const rows = 10;
    const cellWidth = garment.naturalWidth / columns;
    const cellHeight = garment.naturalHeight / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x0 = column / columns;
        const x1 = (column + 1) / columns;
        const y0 = row / rows;
        const y1 = (row + 1) / rows;
        const tl = mapGarmentPoint(x0, y0, quad);
        const tr = mapGarmentPoint(x1, y0, quad);
        const bl = mapGarmentPoint(x0, y1, quad);
        const br = mapGarmentPoint(x1, y1, quad);
        const sx = column * cellWidth;
        const sy = row * cellHeight;
        const a = (x: number, y: number): Point => ({ x, y });
        drawTriangle(context, garment, [a(sx, sy), a(sx + cellWidth, sy), a(sx, sy + cellHeight)], [tl, tr, bl]);
        drawTriangle(context, garment, [a(sx + cellWidth, sy), a(sx + cellWidth, sy + cellHeight), a(sx, sy + cellHeight)], [tr, br, bl]);
      }
    }

    drawArmOcclusion(context, video, points, width, height, shoulderWidth);
    return true;
  }
}