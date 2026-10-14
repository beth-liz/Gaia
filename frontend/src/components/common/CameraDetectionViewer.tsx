import React, { useState } from "react";
import { SafeImage } from "./SafeImage";
import { normalizeBoundingBox } from "@/utils/bboxUtils";
import type { BoundingBoxCoord, NormalizedBox } from "@/utils/bboxUtils";
import { ShieldAlert, Crosshair, Info } from "lucide-react";

interface CameraDetectionViewerProps {
  imagePath: string | null | undefined;
  detections?: BoundingBoxCoord[] | null;
  species?: string | null;
  confidence?: number | null;
  animalCount?: number | null;
  className?: string;
  maxHeight?: string;
  showInspector?: boolean;
}

export const CameraDetectionViewer: React.FC<CameraDetectionViewerProps> = ({
  imagePath,
  detections = [],
  species,
  confidence,
  animalCount,
  className = "",
  maxHeight = "550px",
  showInspector = true,
}) => {
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Normalize valid bounding boxes
  const normalizedBoxes: { box: NormalizedBox; raw: BoundingBoxCoord; index: number }[] = [];
  if (Array.isArray(detections)) {
    detections.forEach((det, idx) => {
      const norm = normalizeBoundingBox(det);
      if (norm) {
        normalizedBoxes.push({ box: norm, raw: det, index: idx });
      }
    });
  }

  const selectedItem = selectedBoxIndex !== null ? normalizedBoxes.find(b => b.index === selectedBoxIndex) : null;

  return (
    <div 
      className={`flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-md border border-slate-800 ${className}`}
      style={maxHeight ? { minHeight: maxHeight, height: '100%' } : { height: '100%' }}
    >
      {/* Viewer Canvas Area */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 overflow-hidden select-none"
        style={maxHeight ? { minHeight: maxHeight } : undefined}
      >
        {/* Aspect-Ratio Locked Container */}
        <div 
          className="relative inline-flex items-center justify-center max-w-full max-h-full"
          style={maxHeight ? { maxHeight } : undefined}
        >
          <SafeImage
            src={imagePath}
            alt={species ? `${species} Detection` : "Camera Observation"}
            className="w-auto h-auto max-w-full max-h-full block object-contain mx-auto rounded-xl shadow-2xl transition-opacity duration-300"
            style={{ maxHeight, height: 'auto', opacity: imageLoaded ? 1 : 0.8 }}
            fallbackClassName="w-full h-full min-h-[340px]"
            onLoad={() => setImageLoaded(true)}
          />

          {/* Precision Overlay: active only when image is confirmed loaded and boxes exist */}
          {imageLoaded && normalizedBoxes.map(({ box, index }) => {
            const isSelected = selectedBoxIndex === index;
            // Prevent label clipping: if box is near top (top < 10%), flip badge to inside top of the box
            const isNearTop = box.top < 8;

            const isUncertain = box.isUncertain;

            return (
              <div
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBoxIndex(isSelected ? null : index);
                }}
                className={`absolute transition-all cursor-pointer group ${
                  isSelected
                    ? "border-2 border-amber-400 bg-amber-400/25 z-30 shadow-lg ring-2 ring-amber-400/50"
                    : isUncertain
                    ? "border-2 border-dashed border-amber-300/80 bg-amber-400/10 hover:bg-amber-400/20 z-20 hover:border-amber-300"
                    : "border-2 border-emerald-400 bg-emerald-400/15 hover:bg-emerald-400/25 z-20 hover:border-emerald-300"
                }`}
                style={{
                  top: `${box.top}%`,
                  left: `${box.left}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                }}
                role="button"
                tabIndex={0}
                aria-label={`${box.label} detected with ${box.confidence}% confidence`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedBoxIndex(isSelected ? null : index);
                  }
                }}
              >
                {/* Species & Confidence Badge */}
                <div
                  className={`absolute text-[10px] sm:text-[11px] font-black tracking-wide px-2 py-0.5 whitespace-nowrap shadow-md pointer-events-auto rounded-md transition-all ${
                    isNearTop ? "top-1 left-1" : "-top-6 left-0"
                  } ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 ring-1 ring-amber-400"
                      : isUncertain
                      ? "bg-amber-600/90 text-white group-hover:bg-amber-500"
                      : "bg-emerald-600 text-white group-hover:bg-emerald-500"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Crosshair className="w-2.5 h-2.5 shrink-0" />
                    <span>{box.label}</span>
                    <span className="opacity-90 font-medium">({box.confidence}%)</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Structured Detection Bar & Inspector */}
      {showInspector && (
        <div className="bg-slate-900 border-t border-slate-800 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Summary statistics */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">AI Verification</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                Species: <strong className="text-white">{species || "Unknown"}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                Count: <strong className="text-white">{animalCount ?? normalizedBoxes.length}</strong>
              </span>
              {confidence !== undefined && confidence !== null && confidence > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                  Confidence: <strong className="text-emerald-400">{(confidence * 100).toFixed(1)}%</strong>
                </span>
              )}
            </div>

            {/* Hint / selection state */}
            {normalizedBoxes.length > 0 && (
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Info className="w-3 h-3 text-emerald-400" />
                <span>{selectedItem ? `Inspecting box #${selectedItem.index + 1}` : "Click any box to inspect details"}</span>
              </div>
            )}
          </div>

          {/* Selected Detection Detail Drawer */}
          {selectedItem && (
            <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-amber-500/30 text-xs text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in duration-150">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Detection Box</span>
                <span className="font-bold text-amber-300">Object #{selectedItem.index + 1}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Classification</span>
                <span className={`font-black ${selectedItem.box.isUncertain ? "text-amber-400" : "text-white"}`}>
                  {selectedItem.box.label}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Species Conf</span>
                <span className="font-black text-emerald-400">
                  {selectedItem.raw.species_confidence !== undefined 
                    ? `${(selectedItem.raw.species_confidence * 100).toFixed(1)}%` 
                    : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Animal Detector Conf</span>
                <span className="font-bold text-slate-200">
                  {selectedItem.raw.confidence ? `${(selectedItem.raw.confidence * 100).toFixed(1)}%` : "N/A"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
