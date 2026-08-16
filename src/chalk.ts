import { mulberry32 } from "./prng.js";

export interface ChalkTexture {
  coreDash: string;
  powderDash: string;
  edgeDash: string;
  coreOpacity: string;
  powderOpacity: string;
  edgeOpacity: string;
  edgeX: string;
  edgeY: string;
}

function between(rand: () => number, min: number, max: number): number {
  return min + (max - min) * rand();
}

function dash(
  rand: () => number,
  minMark: number,
  maxMark: number,
  minGap: number,
  maxGap: number,
): string {
  const firstMark = between(rand, minMark, maxMark);
  const firstGap = between(rand, minGap, maxGap);
  const secondMark = between(rand, minMark * 0.35, maxMark * 0.8);
  const secondGap = between(rand, minGap * 0.7, maxGap * 1.25);
  return [firstMark, firstGap, secondMark, secondGap]
    .map((value) => value.toFixed(2))
    .join(" ");
}

export function chalkTexture(seed: number, layer: number, frame: number): ChalkTexture {
  const rand = mulberry32(seed + layer * 1009 + frame * 31337);
  return {
    coreDash: dash(rand, 18, 38, 1.5, 6),
    powderDash: dash(rand, 4, 14, 3, 12),
    edgeDash: dash(rand, 8, 24, 5, 18),
    coreOpacity: between(rand, 0.82, 0.96).toFixed(2),
    powderOpacity: between(rand, 0.18, 0.38).toFixed(2),
    edgeOpacity: between(rand, 0.12, 0.28).toFixed(2),
    edgeX: between(rand, -0.65, 0.65).toFixed(2),
    edgeY: between(rand, -0.65, 0.65).toFixed(2),
  };
}
