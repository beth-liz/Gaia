import React, { useEffect, useState, useRef } from 'react';
import type { Incident } from '../../types';
import { Sparkles, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { getImageUrl } from '@/utils/imageUrl';
import { api } from '@/services/api';
import { CameraDetectionViewer } from '@/components/common/CameraDetectionViewer';

interface Props {
  incident: Incident;
  onUpdate?: (silent?: boolean) => void;
}

// Module-level guard: track incident IDs that have already completed an automatic analysis attempt
// in the current browser session. This survives component remounts and prevents infinite retry loops
// when the server returns 200 with no detections (e.g. image path not found on server disk).
const autoAnalyzedIncidents = new Set<number>();

export const AIAssessmentCard: React.FC<Props> = ({ incident, onUpdate }) => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const triggeredRef = useRef(false);
  
  // If the user is a villager, we only show it when it's NOT pending.
  const isVillager = user?.role === 'villager';
  
  const aiStatus = incident.ai_status || "Pending";
  const rawImages = (incident.images && incident.images.length > 0)
    ? incident.images 
    : (incident.photo_url ? [incident.photo_url] : []);
  
  // Deduplicate unique original images
  const uniqueOriginalImages = React.useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const img of rawImages) {
      if (!img) continue;
      const norm = img.replace(/\\/g, '/').trim();
      if (!seen.has(norm)) {
        seen.add(norm);
        list.push(img);
      }
    }
    return list;
  }, [rawImages]);

  const rawAiResults = incident.ai_results || [];

  // Map each unique original image to its AI detection (if any)
  const pairedResults = React.useMemo(() => {
    const matchedDetections = new Set<any>();

    return uniqueOriginalImages.map((origImg, idx) => {
      const origNorm = origImg.replace(/\\/g, '/').toLowerCase();
      const origBase = origNorm.split('/').pop() || origNorm;

      // Find matching detection by path or filename
      const match = rawAiResults.find((r: any) => {
        if (!r.image_path) return false;
        const detNorm = String(r.image_path).replace(/\\/g, '/').toLowerCase();
        const detBase = detNorm.split('/').pop() || detNorm;
        return detNorm === origNorm || detBase === origBase;
      });

      if (match) {
        matchedDetections.add(match);
      }

      return {
        imagePath: origImg,
        detection: match || null,
        idx
      };
    });
  }, [uniqueOriginalImages, rawAiResults]);

  const isPending = aiStatus === "Pending";
  const isFailed = aiStatus === "Failed";
  const isPartiallyComplete = aiStatus === "Partially Completed";
  const isComplete = aiStatus === "Analysis Complete";

  const hasResults = pairedResults.some(p => p.detection !== null);

  // Keep a stable ref to onUpdate to prevent recreating interval timers on every parent render
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Trigger analysis. When isManual is true, allows explicit user-driven re-analysis.
  const triggerAnalysis = async (isManual = false) => {
    if (isAnalyzing || !incident.id) return;
    if (!isManual && autoAnalyzedIncidents.has(incident.id)) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    autoAnalyzedIncidents.add(incident.id);
    try {
      await api.analyzeIncidentEvidence(incident.id);
      // Silent refresh preserves the workspace view without triggering full-page loading replacement
      if (onUpdateRef.current) onUpdateRef.current(true);
    } catch (err: any) {
      console.error("AI Evidence Analysis error:", err);
      setAnalysisError(err.message || "Failed to complete AI analysis.");
      if (onUpdateRef.current) onUpdateRef.current(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    // Only auto-trigger if this incident has not already been auto-analyzed in this session
    if (
      isPending &&
      !hasResults &&
      !triggeredRef.current &&
      !autoAnalyzedIncidents.has(incident.id) &&
      uniqueOriginalImages.length > 0
    ) {
      triggeredRef.current = true;
      triggerAnalysis(false);
    }
  }, [incident.id, isPending, hasResults, uniqueOriginalImages.length]);

  useEffect(() => {
    if (isPending && !isAnalyzing) {
      const interval = setInterval(() => {
        if (onUpdateRef.current) {
          onUpdateRef.current(true);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isPending, isAnalyzing]);

  if (isVillager && isPending) {
    return null; // completely hidden from villager during processing
  }

  let totalAnimals = 0;
  const speciesCounts: Record<string, number> = {};
  let imagesWithAnalysis = 0;
  
  for (const item of pairedResults) {
    if (item.detection) {
      imagesWithAnalysis += 1;
      if (item.detection.confidence > 0) {
        totalAnimals += item.detection.count || 0;
        const sp = item.detection.normalized_species || "Unknown";
        speciesCounts[sp] = (speciesCounts[sp] || 0) + (item.detection.count || 0);
      }
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[800px]">
      <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-xl">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">
            AI Wildlife Analysis
          </h3>
        </div>
        <div>
          {isPending && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">
              Processing
            </span>
          )}
          {isComplete && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Analysis Complete
            </span>
          )}
          {isPartiallyComplete && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Partially Completed
            </span>
          )}
          {isFailed && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5">
              <XCircle className="w-3 h-3" /> Analysis Failed
            </span>
          )}
        </div>
      </div>

      <div className="overflow-y-auto p-6 space-y-8">
        
        {/* SUMMARY SECTION */}
        {(isComplete || isPartiallyComplete || hasResults) && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-4">Incident AI Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="text-[10px] uppercase font-bold text-emerald-600/70 mb-1">Images Analyzed</div>
                        <div className="text-xl font-black text-emerald-950">{imagesWithAnalysis} of {uniqueOriginalImages.length}</div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-bold text-emerald-600/70 mb-1">Total Animals</div>
                        <div className="text-xl font-black text-emerald-950">{totalAnimals}</div>
                    </div>
                    <div className="col-span-2">
                        <div className="text-[10px] uppercase font-bold text-emerald-600/70 mb-1">Species Breakdown</div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(speciesCounts).map(([sp, cnt]) => (
                                <span key={sp} className="bg-white border border-emerald-200 px-2 py-1 rounded-md text-xs font-bold text-emerald-800 shadow-sm">
                                    {sp} &times; {cnt}
                                </span>
                            ))}
                            {Object.keys(speciesCounts).length === 0 && (
                                <span className="text-sm font-medium text-slate-500">No animals detected</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* IMAGES COMPARISON GRID - Exactly 1 pair per unique evidence image */}
        {(isComplete || isPartiallyComplete || hasResults) && pairedResults.length > 0 ? (
            <div className="space-y-6">
                {pairedResults.map(({ imagePath, detection, idx }) => {
                    const imgUrl = getImageUrl(imagePath);
                    return (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                            
                            {/* ORIGINAL EVIDENCE */}
                            <div className="flex-1 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col">
                                <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Original Evidence {idx + 1}</h5>
                                </div>
                                <div className="bg-slate-950 flex items-center justify-center min-h-[320px] p-2 flex-1">
                                    <img src={imgUrl} alt={`Original Evidence ${idx + 1}`} className="max-w-full max-h-[420px] object-contain rounded-md" />
                                </div>
                            </div>
                            
                            {/* ANALYZED EVIDENCE USING STANDARDIZED VIEWER */}
                            <div className="flex-1 flex flex-col">
                                <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-700">AI Analyzed Overlay</h5>
                                    {detection && detection.confidence > 0 && (
                                        <span className="text-[10px] font-bold bg-emerald-200/50 text-emerald-800 px-2 py-0.5 rounded-full">
                                            Count: {detection.count}
                                        </span>
                                    )}
                                </div>
                                <div className="bg-slate-950 flex-1 flex flex-col min-h-[320px]">
                                    {detection ? (
                                        <CameraDetectionViewer
                                            imagePath={detection.image_path || imagePath}
                                            detections={detection.bounding_boxes}
                                            species={detection.normalized_species}
                                            confidence={detection.confidence}
                                            animalCount={detection.count}
                                            maxHeight="420px"
                                            showInspector={true}
                                            className="border-0 rounded-none shadow-none bg-transparent"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                                            No analysis result available for this image
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
             <div className="flex flex-col items-center justify-center py-10 space-y-4">
                {isPending ? (
                    <div className="text-center space-y-4">
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
                        <p className="text-sm font-bold text-emerald-900">
                            {isAnalyzing ? "Running MegaDetector + SpeciesNet Analysis..." : `Processing ${uniqueOriginalImages.length || 1} image(s)...`}
                        </p>
                        <p className="text-xs text-emerald-700/70">AI is analyzing the incident evidence in the background.</p>
                        {analysisError && (
                            <p className="text-xs text-red-600 font-medium">{analysisError}</p>
                        )}
                        <button
                            onClick={() => triggerAnalysis(true)}
                            disabled={isAnalyzing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                            {isAnalyzing ? 'Analyzing Evidence...' : 'Trigger Analysis Now'}
                        </button>
                    </div>
                ) : (
                    <div className="text-center space-y-4">
                        <XCircle className="w-10 h-10 text-red-600 mx-auto" />
                        <p className="text-sm font-bold text-red-900">Analysis could not be completed.</p>
                        {analysisError && (
                            <p className="text-xs text-red-600 max-w-sm mx-auto">{analysisError}</p>
                        )}
                        <button
                            onClick={() => triggerAnalysis(true)}
                            disabled={isAnalyzing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                            {isAnalyzing ? 'Retrying Analysis...' : 'Retry AI Analysis'}
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
      
      {/* FOOTER */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-between items-center shrink-0">
         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Model: MegaDetector + SpeciesNet</span>
         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gaia Intelligence</span>
      </div>
    </div>
  );
};
