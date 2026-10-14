export interface BoundingBoxCoord {
  // Can be [x, y, width, height] normalized (MegaDetector standard)
  // or [ymin, xmin, ymax, xmax] legacy
  bbox?: number[];
  confidence?: number;
  species_confidence?: number;
  raw_species?: string;
  normalized_species?: string;
  is_uncertain?: boolean;
}

export interface NormalizedBox {
  left: number;   // 0 to 100 (%)
  top: number;    // 0 to 100 (%)
  width: number;  // 0 to 100 (%)
  height: number; // 0 to 100 (%)
  label: string;
  confidence: number;
  rawConfidence: number;
  isUncertain: boolean;
}

/**
 * Normalizes any detection format into a guaranteed [0, 100]% CSS coordinate object.
 * MegaDetector standard convention: [x_min, y_min, width, height] in range [0, 1].
 */
export function normalizeBoundingBox(det: BoundingBoxCoord): NormalizedBox | null {
  if (!det || !Array.isArray(det.bbox) || det.bbox.length < 4) {
    return null;
  }

  const [a, b, c, d] = det.bbox;

  // Check for NaN or non-numbers
  if ([a, b, c, d].some(v => typeof v !== "number" || isNaN(v))) {
    return null;
  }

  let x: number;
  let y: number;
  let w: number;
  let h: number;

  // Check if it's already in normalized [0, 1] range vs pixel coordinates
  const isNormalized = [a, b, c, d].every(v => v >= 0 && v <= 1.5);

  if (isNormalized) {
    // MegaDetector format: [x, y, width, height]
    x = a;
    y = b;
    w = c;
    h = d;
  } else {
    // If somehow pixel coordinates or out-of-range, clamp to 0..1
    return null;
  }

  // Guard against inverted or negative dimensions
  if (w <= 0 || h <= 0) {
    return null;
  }

  // Clamp within 0..1 to prevent overlay escape
  const clampedX = Math.max(0, Math.min(1, x));
  const clampedY = Math.max(0, Math.min(1, y));
  const clampedW = Math.max(0, Math.min(1 - clampedX, w));
  const clampedH = Math.max(0, Math.min(1 - clampedY, h));

  const isUncertain = det.is_uncertain === true || det.normalized_species === "Other / Unknown" || (det.species_confidence !== undefined && det.species_confidence < 0.50);
  const label = isUncertain 
    ? "Animal (Species Uncertain)" 
    : (det.normalized_species || "Animal");
  
  // For uncertain species, confidence display defaults to detector confidence (how sure we are it's an animal)
  const conf = isUncertain && det.confidence !== undefined
    ? det.confidence
    : (det.species_confidence !== undefined && det.species_confidence > 0
        ? det.species_confidence
        : (det.confidence !== undefined ? det.confidence : 0));

  return {
    left: clampedX * 100,
    top: clampedY * 100,
    width: clampedW * 100,
    height: clampedH * 100,
    label,
    confidence: Math.round(conf * 100),
    rawConfidence: conf,
    isUncertain
  };
}
