import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { 
    CheckCircle2, XCircle, Clock, ShieldCheck, 
    Camera, Image as ImageIcon, Check, X, ShieldAlert, ExternalLink,
    Search, Calendar, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SafeImage } from '@/components/common/SafeImage';
import { CameraDetectionViewer } from '@/components/common/CameraDetectionViewer';

export const CameraIncidentsPage: React.FC = () => {
    const { user } = useAuth();
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    
    // Detail / Action modal
    const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Rejection state
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [isConfirmingReject, setIsConfirmingReject] = useState(false);
    
    // Filters & Search
    const [statusFilter, setStatusFilter] = useState<string>('PENDING_REVIEW');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const loadCandidates = async () => {
        try {
            setLoading(true);
            const data = await api.getCameraDetections();
            // Client-side safeguard: only include candidates with valid, non-empty image_path
            const validData = Array.isArray(data) ? data.filter((d: any) => d && typeof d.image_path === 'string' && d.image_path.trim().length > 0) : [];
            setCandidates(validData);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load camera incident candidates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCandidates();
    }, []);

    const openModal = async (id: number) => {
        try {
            const data = await api.getCameraDetectionById(id);
            setSelectedCandidate(data);
            setRejectReason("");
            setIsConfirmingReject(false);
            setIsModalOpen(true);
        } catch (err: any) {
            alert(err.message || "Failed to load candidate details");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedCandidate(null);
        setIsConfirmingReject(false);
        setRejectReason("");
    };

    const handleAccept = async () => {
        if (!selectedCandidate) return;
        try {
            setActionLoading(true);
            const res = await api.acceptCameraDetection(selectedCandidate.id);
            setActionMessage({
                type: 'success',
                text: `Successfully accepted! Official Gaia Incident created: ${res.incident_reference_id}`
            });
            closeModal();
            loadCandidates();
        } catch (err: any) {
            alert(err.message || "Failed to accept camera incident candidate");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedCandidate) return;
        if (!rejectReason.trim()) {
            alert("A valid rejection reason is mandatory.");
            return;
        }
        try {
            setActionLoading(true);
            await api.rejectCameraDetection(selectedCandidate.id, rejectReason.trim());
            setActionMessage({
                type: 'success',
                text: `Candidate ${selectedCandidate.event_code} has been marked as REJECTED.`
            });
            closeModal();
            loadCandidates();
        } catch (err: any) {
            alert(err.message || "Failed to reject candidate");
        } finally {
            setActionLoading(false);
        }
    };

    // Metric counts
    const pendingCount = candidates.filter(c => c.status === 'PENDING_REVIEW').length;
    const acceptedCount = candidates.filter(c => c.status === 'ACCEPTED').length;
    const rejectedCount = candidates.filter(c => c.status === 'REJECTED').length;
    const totalCount = candidates.length;

    // Filtered list
    const filteredCandidates = candidates.filter(c => {
        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        const matchesSearch = !searchQuery.trim() ||
            (c.event_code && c.event_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.species && c.species.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.camera_name && c.camera_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.station_name && c.station_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.incident_reference_id && c.incident_reference_id.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const canReview = user?.role === 'Range Forest Officer' || user?.role === 'Officer';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-950/10 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-900 text-amber-300 shadow-md shrink-0">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-extrabold text-emerald-950 tracking-tight">Camera Incident Review Queue</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                                {candidates.length} Candidates
                            </span>
                        </div>
                        <p className="text-xs text-emerald-800/70 font-medium mt-0.5">
                            {canReview
                                ? "Authorised Range Forest Officer review portal. Verify AI-generated camera observations. Accepting creates an official Gaia Incident; rejecting prevents incident creation."
                                : "Authorised Range Forest Officer review portal (View Only for Admin). Verify AI-generated camera observations and track incident candidate review outcomes."}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadCandidates}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-950/20 font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Refresh Queue</span>
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {actionMessage && (
                <div>
                    <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                            <span>{actionMessage.text}</span>
                        </div>
                        <button onClick={() => setActionMessage(null)} className="text-emerald-900 text-base font-black">✕</button>
                    </div>
                </div>
            )}

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div 
                    onClick={() => setStatusFilter('PENDING_REVIEW')}
                    className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center gap-4 cursor-pointer hover:border-amber-400 transition-colors"
                >
                    <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Awaiting Review</div>
                        <div className="text-2xl font-black text-slate-900">{pendingCount}</div>
                    </div>
                </div>

                <div 
                    onClick={() => setStatusFilter('ACCEPTED')}
                    className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-4 cursor-pointer hover:border-emerald-300 transition-colors"
                >
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Accepted (Incidents)</div>
                        <div className="text-2xl font-black text-slate-900">{acceptedCount}</div>
                    </div>
                </div>

                <div 
                    onClick={() => setStatusFilter('REJECTED')}
                    className="bg-white p-5 rounded-2xl border border-red-100 shadow-xs flex items-center gap-4 cursor-pointer hover:border-red-300 transition-colors"
                >
                    <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Rejected Decisions</div>
                        <div className="text-2xl font-black text-slate-900">{rejectedCount}</div>
                    </div>
                </div>

                <div 
                    onClick={() => setStatusFilter('ALL')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 cursor-pointer hover:border-slate-400 transition-colors"
                >
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-slate-700" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Candidates</div>
                        <div className="text-2xl font-black text-slate-900">{totalCount}</div>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={() => setStatusFilter('PENDING_REVIEW')} 
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors ${statusFilter === 'PENDING_REVIEW' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                    >
                        Pending Review ({pendingCount})
                    </button>
                    <button 
                        onClick={() => setStatusFilter('ACCEPTED')} 
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors ${statusFilter === 'ACCEPTED' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                    >
                        Accepted Incidents ({acceptedCount})
                    </button>
                    <button 
                        onClick={() => setStatusFilter('REJECTED')} 
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors ${statusFilter === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                    >
                        Rejected ({rejectedCount})
                    </button>
                    <button 
                        onClick={() => setStatusFilter('ALL')} 
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors ${statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                    >
                        All Candidates ({totalCount})
                    </button>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search candidate ID, species, incident ref..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:ring-amber-500 focus:border-amber-500 shadow-xs"
                    />
                </div>
            </div>

            {/* Candidates Listing */}
            <div>
                {loading ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-xs">
                        <Clock className="w-12 h-12 text-amber-500 animate-pulse mx-auto mb-3" />
                        <h3 className="text-base font-black text-slate-700">Loading incident review queue...</h3>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl font-medium flex items-center gap-3">
                        <XCircle className="w-6 h-6 shrink-0" />
                        <span>{error}</span>
                    </div>
                ) : filteredCandidates.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-16 text-center flex flex-col items-center justify-center text-slate-500 font-medium">
                        <CheckCircle2 className="w-12 h-12 text-emerald-300 mb-3" />
                        <h4 className="text-base font-black text-slate-800">Queue is Clear</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">No camera incident candidates currently match the selected filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredCandidates.map(c => (
                            <div 
                                key={c.id}
                                onClick={() => openModal(c.id)}
                                className="group bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl hover:border-amber-300 transition-all cursor-pointer overflow-hidden flex flex-col"
                            >
                                <div className="h-48 bg-slate-900 relative">
                                    {c.image_path ? (
                                        <SafeImage 
                                            src={c.image_path} 
                                            alt={c.species || "Candidate Evidence"} 
                                            className="w-full h-full object-cover opacity-85 group-hover:opacity-95 transition-opacity" 
                                            showRetry={false} 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                                            <ImageIcon className="w-10 h-10 opacity-40" />
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shadow-md ${
                                            c.status === 'PENDING_REVIEW' ? 'bg-amber-500 text-white animate-pulse' :
                                            c.status === 'ACCEPTED' ? 'bg-emerald-500 text-white' :
                                            'bg-red-500 text-white'
                                        }`}>
                                            {c.status === 'PENDING_REVIEW' && <Clock className="w-3 h-3" />}
                                            {c.status.replace("_", " ")}
                                        </span>
                                    </div>

                                    {/* Species & Confidence Banner */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-4 pt-10">
                                        <h4 className="text-white font-black text-lg">{c.species || 'Unknown Wildlife'}</h4>
                                        <div className="flex items-center gap-3 text-xs mt-0.5">
                                            <span className="text-emerald-400 font-bold">
                                                {c.confidence ? (c.confidence * 100).toFixed(1) + '%' : 'N/A'} Confidence
                                            </span>
                                            <span className="text-slate-300 font-semibold">•</span>
                                            <span className="text-slate-200 font-semibold">Count: {c.animal_count}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col gap-2.5 text-xs">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Candidate ID</span>
                                        <span className="font-mono font-black text-slate-900">{c.event_code}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Camera</span>
                                        <span className="font-bold text-slate-800">{c.camera_name || 'Camera Source'}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Station Scope</span>
                                        <span className="font-semibold text-slate-700">{c.station_name || 'HQ Range'}</span>
                                    </div>

                                    {c.incident_reference_id && (
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 bg-emerald-50/60 p-2 rounded-lg">
                                            <span className="text-emerald-800 font-bold text-[10px] uppercase">Official Incident</span>
                                            <span className="font-black text-emerald-900 font-mono">{c.incident_reference_id}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-1 text-slate-500">
                                        <span className="flex items-center gap-1 font-medium">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            {new Date(c.detected_at).toLocaleString()}
                                        </span>
                                        <span className="text-amber-700 font-black group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                            {c.status === 'PENDING_REVIEW' ? 'Review Candidate →' : 'View Decision Audit →'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Official Review & Action Modal */}
            {isModalOpen && selectedCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
                        
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white p-5 sm:p-6 shrink-0 flex justify-between items-center border-b border-slate-800">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <ShieldAlert className="w-6 h-6 text-amber-400" />
                                    <h2 className="text-xl font-black">Review Candidate {selectedCandidate.event_code}</h2>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                        selectedCandidate.status === 'PENDING_REVIEW' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                        selectedCandidate.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                        'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}>
                                        {selectedCandidate.status.replace("_", " ")}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-xs font-medium ml-9">
                                    Camera: {selectedCandidate.camera_name} • Station: {selectedCandidate.station_name}
                                </p>
                            </div>
                            <button 
                                onClick={closeModal} 
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                            {/* Left: Aspect-Locked Canvas with Bounding Boxes */}
                            <div className="flex-1 bg-slate-100 flex flex-col overflow-y-auto border-r border-slate-200 p-6 sm:p-8 relative">
                                <CameraDetectionViewer
                                    imagePath={selectedCandidate.image_path}
                                    detections={selectedCandidate.ai_result}
                                    species={selectedCandidate.species}
                                    confidence={selectedCandidate.confidence}
                                    animalCount={selectedCandidate.animal_count}
                                    maxHeight="520px"
                                    showInspector={true}
                                />
                            </div>

                            {/* Right: Review Decision Workspace */}
                            <div className="w-full lg:w-96 bg-white flex flex-col shrink-0 overflow-y-auto p-6 space-y-6">
                                <div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
                                        Observation Evidence
                                    </h3>
                                    <div className="space-y-3 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-bold">Identified Species</span>
                                            <span className="font-black text-slate-900 text-sm">{selectedCandidate.species}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-bold">Species Classification Conf</span>
                                            <span className="font-bold text-emerald-600">
                                                {selectedCandidate.confidence ? (selectedCandidate.confidence * 100).toFixed(1) + '%' : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-bold">Total Animals Detected</span>
                                            <span className="font-extrabold text-slate-900">{selectedCandidate.animal_count}</span>
                                        </div>
                                        {selectedCandidate.ai_result && Array.isArray(selectedCandidate.ai_result) && selectedCandidate.ai_result.length > 0 && (
                                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Detections Breakdown</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(() => {
                                                        const counts: Record<string, number> = {};
                                                        let uncertain = 0;
                                                        selectedCandidate.ai_result.forEach((box: any) => {
                                                            if (box.is_uncertain || box.normalized_species === "Other / Unknown" || (box.species_confidence !== undefined && box.species_confidence < 0.50)) {
                                                                uncertain += 1;
                                                            } else {
                                                                const sp = box.normalized_species || "Animal";
                                                                counts[sp] = (counts[sp] || 0) + 1;
                                                            }
                                                        });
                                                        return (
                                                            <>
                                                                {Object.entries(counts).map(([sp, cnt]) => (
                                                                    <span key={sp} className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-900 font-bold text-[11px] border border-emerald-200">
                                                                        {sp}: {cnt}
                                                                    </span>
                                                                ))}
                                                                {uncertain > 0 && (
                                                                    <span className="px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900 font-bold text-[11px] border border-amber-200">
                                                                        Uncertain Species: {uncertain}
                                                                    </span>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-bold">Captured At</span>
                                            <span className="font-medium text-slate-700">{new Date(selectedCandidate.detected_at).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-bold">Station</span>
                                            <span className="font-medium text-slate-700">{selectedCandidate.station_name}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Review Decision Box */}
                                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                                    {selectedCandidate.status === 'PENDING_REVIEW' ? (
                                        canReview ? (
                                            <>
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                        Range Officer Decision
                                                    </h4>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                                        Verify wildlife sighting authenticity. Accepting automatically creates an official Gaia Incident.
                                                    </p>
                                                </div>

                                                {!isConfirmingReject ? (
                                                    <div className="space-y-3 pt-1">
                                                        <button
                                                            disabled={actionLoading}
                                                            onClick={handleAccept}
                                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                                        >
                                                            {actionLoading ? 'Creating Incident...' : (
                                                                <>
                                                                    <Check className="w-4 h-4" />
                                                                    ACCEPT & CREATE INCIDENT
                                                                </>
                                                            )}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => setIsConfirmingReject(true)}
                                                            className="w-full py-2.5 bg-white hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-1.5"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            Reject Candidate...
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3 pt-2 border-t border-slate-200 animate-in fade-in duration-150">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase text-red-700 block mb-1">
                                                                Rejection Remarks (Mandatory)
                                                            </label>
                                                            <textarea
                                                                rows={3}
                                                                placeholder="State why this observation is rejected (e.g., False positive, stray livestock, harmless sighting)..."
                                                                value={rejectReason}
                                                                onChange={(e) => setRejectReason(e.target.value)}
                                                                className="w-full text-xs rounded-xl border border-red-300 p-2.5 focus:ring-red-500 focus:border-red-500"
                                                            />
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsConfirmingReject(false)}
                                                                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={actionLoading || !rejectReason.trim()}
                                                                onClick={handleReject}
                                                                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl disabled:opacity-50 shadow-sm"
                                                            >
                                                                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-center py-4 space-y-2.5">
                                                <Clock className="w-8 h-8 text-amber-500 mx-auto" />
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                                        Awaiting Officer Review
                                                    </h4>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                                                        This candidate observation is pending review by the authorized Range Forest Officer assigned to <strong>{selectedCandidate.station_name || 'the monitoring station'}</strong>.
                                                    </p>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                                                    Admins have read-only audit access to camera incident candidates.
                                                </div>
                                            </div>
                                        )
                                    ) : selectedCandidate.status === 'ACCEPTED' ? (
                                        <div className="text-center py-2 space-y-3">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900">Candidate Accepted</h4>
                                                <p className="text-xs text-slate-500 mt-0.5">Official Gaia Incident is active in the operations workflow.</p>
                                            </div>

                                            {selectedCandidate.incident_reference_id && (
                                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 font-black text-emerald-900 text-xs flex items-center justify-between">
                                                    <span>{selectedCandidate.incident_reference_id}</span>
                                                    {user?.role !== 'Villager' && (
                                                        <Link 
                                                            to={`/officer/incidents/${selectedCandidate.incident_id || ''}`}
                                                            className="text-emerald-700 hover:text-emerald-950 font-bold flex items-center gap-1 text-[11px]"
                                                        >
                                                            Open Incident <ExternalLink className="w-3.5 h-3.5" />
                                                        </Link>
                                                    )}
                                                </div>
                                            )}

                                            <div className="text-[11px] text-slate-400">
                                                Reviewed by <strong>{selectedCandidate.reviewed_by}</strong> on {selectedCandidate.reviewed_at ? new Date(selectedCandidate.reviewed_at).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-2 space-y-3">
                                            <XCircle className="w-10 h-10 text-red-500 mx-auto" />
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900">Candidate Rejected</h4>
                                                <p className="text-xs text-slate-500 mt-0.5">No official incident was generated.</p>
                                            </div>

                                            {selectedCandidate.rejection_reason && (
                                                <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-left text-xs">
                                                    <span className="text-[10px] font-bold text-red-600 uppercase block mb-1">Rejection Reason</span>
                                                    "{selectedCandidate.rejection_reason}"
                                                </div>
                                            )}

                                            <div className="text-[11px] text-slate-400">
                                                Reviewed by <strong>{selectedCandidate.reviewed_by}</strong> on {selectedCandidate.reviewed_at ? new Date(selectedCandidate.reviewed_at).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default CameraIncidentsPage;
