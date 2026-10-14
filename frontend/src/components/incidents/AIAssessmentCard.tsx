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

export const AIAssessmentCard: React.FC<Props> = ({ incident, onUpdate }) => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const triggeredRef = useRef(false);
  
  // If the user is a villager, we only show it when it's NOT pending.
  const isVillager = user?.role === 'villager';
  
  const aiStatus = incident.ai_status || "Pending";
  const images = incident.images || [];
  const aiResults = incident.ai_results || [];

  const isPending = aiStatus === "Pending";
  const isFailed = aiStatus === "Failed";
  const isPartiallyComplete = aiStatus === "Partially Completed";
  const isComplete = aiStatus === "Analysis Complete";

  const hasResults = aiResults.length > 0;

  // Auto-trigger analysis once if incident has images, status is Pending, and no AI records exist yet
  const triggerAnalysis = async () => {
    if (isAnalyzing || !incident.id) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      await api.analyzeIncidentEvidence(incident.id);
      if (onUpdate) onUpdate(false);
    } catch (err: any) {
      console.error("AI Evidence Analysis error:", err);
      setAnalysisError(err.message || "Failed to complete AI analysis.");
      if (onUpdate) onUpdate(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (isPending && !hasResults && !triggeredRef.current && (images.length > 0 || incident.photo_url)) {
      triggeredRef.current = true;
      triggerAnalysis();
    }
  }, [incident.id, isPending, hasResults, images.length, incident.photo_url]);

  useEffect(() => {
    if (isPending && onUpdate) {
      const interval = setInterval(() => {
        onUpdate(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isPending, onUpdate]);

  if (isVillager && isPending) {
    return null; // completely hidden from villager during processing
  }

  let totalAnimals = 0;
  let speciesCounts: Record<string, number> = {};
  
  if (hasResults) {
    for (const r of aiResults) {
        if (r.confidence > 0) {
            totalAnimals += r.count || 0;
            const sp = r.normalized_species || "Unknown";
            speciesCounts[sp] = (speciesCounts[sp] || 0) + (r.count || 0);
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
        {(isComplete || isPartiallyComplete) && hasResults && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-4">Incident AI Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="text-[10px] uppercase font-bold text-emerald-600/70 mb-1">Images Analyzed</div>
                        <div className="text-xl font-black text-emerald-950">{aiResults.length}</div>
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

        {/* IMAGES COMPARISON GRID */}
        {(isComplete || isPartiallyComplete) && hasResults ? (
            <div className="space-y-6">
                {aiResults.map((res: any, idx: number) => {
                    const imgUrl = getImageUrl(res.image_path);
                    return (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                            
                            {/* ORIGINAL EVIDENCE */}
                            <div className="flex-1 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col">
                                <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Original Evidence {idx + 1}</h5>
                                </div>
                                <div className="bg-slate-950 flex items-center justify-center min-h-[320px] p-2 flex-1">
                                    <img src={imgUrl} alt="Original Evidence" className="max-w-full max-h-[420px] object-contain rounded-md" />
                                </div>
                            </div>
                            
                            {/* ANALYZED EVIDENCE USING STANDARDIZED VIEWER */}
                            <div className="flex-1 flex flex-col">
                                <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-700">AI Analyzed Overlay</h5>
                                    {res.confidence > 0 && (
                                        <span className="text-[10px] font-bold bg-emerald-200/50 text-emerald-800 px-2 py-0.5 rounded-full">
                                            Count: {res.count}
                                        </span>
                                    )}
                                </div>
                                <div className="bg-slate-950 flex-1 flex flex-col">
                                    <CameraDetectionViewer
                                        imagePath={res.image_path}
                                        detections={res.bounding_boxes}
                                        species={res.normalized_species}
                                        confidence={res.confidence}
                                        animalCount={res.count}
                                        maxHeight="420px"
                                        showInspector={true}
                                        className="border-0 rounded-none shadow-none bg-transparent"
                                    />
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
                            {isAnalyzing ? "Running MegaDetector + SpeciesNet Analysis..." : `Processing ${images.length || 1} image(s)...`}
                        </p>
                        <p className="text-xs text-emerald-700/70">AI is analyzing the incident evidence in the background.</p>
                        {analysisError && (
                            <p className="text-xs text-red-600 font-medium">{analysisError}</p>
                        )}
                        <button
                            onClick={triggerAnalysis}
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
                            onClick={triggerAnalysis}
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
