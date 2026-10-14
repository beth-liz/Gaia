import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { 
    CheckCircle2, XCircle, Clock, ShieldCheck, 
    Camera, Image as ImageIcon, Check, X, ShieldAlert, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SafeImage } from '@/components/common/SafeImage';
import { CameraDetectionViewer } from '@/components/common/CameraDetectionViewer';

const CameraDetectionsReviewPage: React.FC = () => {
    const { user } = useAuth();
    const [detections, setDetections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [selectedDetection, setSelectedDetection] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const loadDetections = async () => {
        try {
            setLoading(true);
            const data = await api.getCameraDetections();
            setDetections(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load detections');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetections();
    }, []);

    const openModal = async (id: number) => {
        try {
            const data = await api.getCameraDetectionById(id);
            setSelectedDetection(data);
            setRejectReason("");
            setIsModalOpen(true);
        } catch (err: any) {
            alert(err.message || "Failed to load details");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedDetection(null);
    };

    const handleAccept = async () => {
        if (!selectedDetection) return;
        try {
            setActionLoading(true);
            const res = await api.acceptCameraDetection(selectedDetection.id);
            alert(`Accepted! Created incident: ${res.incident_reference_id}`);
            closeModal();
            loadDetections();
        } catch (err: any) {
            alert(err.message || "Failed to accept detection");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedDetection) return;
        if (!rejectReason.trim()) {
            alert("Please provide a reason for rejecting this detection.");
            return;
        }
        try {
            setActionLoading(true);
            await api.rejectCameraDetection(selectedDetection.id, rejectReason);
            closeModal();
            loadDetections();
        } catch (err: any) {
            alert(err.message || "Failed to reject detection");
        } finally {
            setActionLoading(false);
        }
    };

    const pendingCount = detections.filter(d => d.status === 'PENDING_REVIEW').length;
    const acceptedCount = detections.filter(d => d.status === 'ACCEPTED').length;
    const rejectedCount = detections.filter(d => d.status === 'REJECTED').length;

    const filteredDetections = detections.filter(d => statusFilter === 'ALL' || d.status === statusFilter);

    return (
        <div className="space-y-8 pb-12 bg-slate-50 min-h-screen">
            {/* Premium Header */}
            <div className="bg-slate-900 text-white p-8 rounded-b-3xl shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400 via-amber-900 to-slate-900"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldAlert className="w-8 h-8 text-amber-400" />
                            <h1 className="text-3xl font-black tracking-tight">Wildlife Detection Centre</h1>
                        </div>
                        <p className="text-slate-300 max-w-2xl">
                            Review AI-identified wildlife events and convert verified threats into official Gaia incidents.
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="px-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-slate-700" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Detections</div>
                        <div className="text-3xl font-black text-slate-900">{detections.length}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('PENDING_REVIEW')}>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-amber-600 uppercase tracking-wider">Pending Review</div>
                        <div className="text-3xl font-black text-slate-900">{pendingCount}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('ACCEPTED')}>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Accepted (Incidents)</div>
                        <div className="text-3xl font-black text-slate-900">{acceptedCount}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('REJECTED')}>
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-red-600 uppercase tracking-wider">Rejected</div>
                        <div className="text-3xl font-black text-slate-900">{rejectedCount}</div>
                    </div>
                </div>
            </div>

            {/* Filter and List */}
            <div className="px-8">
                <div className="mb-6 flex gap-2">
                    <button onClick={() => setStatusFilter('ALL')} className={`px-4 py-2 rounded-lg font-bold text-sm ${statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>All</button>
                    <button onClick={() => setStatusFilter('PENDING_REVIEW')} className={`px-4 py-2 rounded-lg font-bold text-sm ${statusFilter === 'PENDING_REVIEW' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Pending</button>
                    <button onClick={() => setStatusFilter('ACCEPTED')} className={`px-4 py-2 rounded-lg font-bold text-sm ${statusFilter === 'ACCEPTED' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Accepted</button>
                    <button onClick={() => setStatusFilter('REJECTED')} className={`px-4 py-2 rounded-lg font-bold text-sm ${statusFilter === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Rejected</button>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <ShieldCheck className="w-10 h-10 text-emerald-500 animate-pulse mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-700">Loading detections...</h3>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl font-medium flex items-center gap-3">
                        <XCircle className="w-6 h-6" />
                        {error}
                    </div>
                ) : filteredDetections.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center flex flex-col items-center justify-center text-slate-500 font-medium">
                        <CheckCircle2 className="w-12 h-12 text-emerald-300 mb-3" />
                        No detections found for the current filter.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredDetections.map(det => (
                            <div 
                                key={det.id}
                                onClick={() => openModal(det.id)}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden flex flex-col"
                            >
                                <div className="h-48 bg-slate-900 relative">
                                    {det.image_path ? (
                                        <SafeImage src={det.image_path} alt="Detection" className="w-full h-full object-cover opacity-80" showRetry={false} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageIcon className="w-10 h-10" /></div>
                                    )}
                                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                                            det.status === 'PENDING_REVIEW' ? 'bg-amber-500 text-white shadow-md' :
                                            det.status === 'ACCEPTED' ? 'bg-emerald-500 text-white shadow-md' :
                                            'bg-red-500 text-white shadow-md'
                                        }`}>
                                            {det.status.replace("_", " ")}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-4 pt-12">
                                        <h4 className="text-white font-black text-lg">{det.species || 'Unknown Wildlife'}</h4>
                                        <p className="text-emerald-400 font-bold text-xs">{det.confidence ? (det.confidence * 100).toFixed(1) + '%' : 'N/A'} Confidence</p>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col gap-3 text-sm">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-bold">Detection ID</span>
                                        <span className="font-medium text-slate-900">{det.event_code}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-bold">Time</span>
                                        <span className="font-medium text-slate-900">{new Date(det.detected_at).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-bold">Station</span>
                                        <span className="font-medium text-slate-900">{det.station_name || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* DETAIL MODAL OVERLAY */}
            {isModalOpen && selectedDetection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 bg-slate-900/80 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        
                        {/* Header */}
                        <div className="bg-slate-900 text-white p-5 sm:p-6 shrink-0 flex justify-between items-center border-b border-slate-800">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <ShieldAlert className="w-6 h-6 text-emerald-400" />
                                    <h2 className="text-2xl font-black">Detection {selectedDetection.event_code}</h2>
                                    <span className={`ml-3 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                        selectedDetection.status === 'PENDING_REVIEW' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                        selectedDetection.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                        'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}>
                                        {selectedDetection.status.replace("_", " ")}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-sm font-medium ml-9">Reported by {selectedDetection.camera_name} ({selectedDetection.station_name})</p>
                            </div>
                            <button onClick={closeModal} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Split Body */}
                        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                            
                            {/* Left: Image & AI Boxes */}
                            <div className="flex-1 bg-slate-100 flex flex-col overflow-y-auto border-r border-slate-200 p-6 sm:p-8 relative">
                                <CameraDetectionViewer
                                    imagePath={selectedDetection.image_path}
                                    detections={selectedDetection.ai_result}
                                    species={selectedDetection.species}
                                    confidence={selectedDetection.confidence}
                                    animalCount={selectedDetection.animal_count}
                                    maxHeight="580px"
                                    showInspector={true}
                                />
                            </div>

                            {/* Right: Details & Review Actions */}
                            <div className="w-full lg:w-96 bg-white flex flex-col shrink-0 overflow-y-auto">
                                <div className="p-6">
                                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Analysis Results</h3>
                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-bold">Species</span>
                                            <span className="font-black text-slate-900 text-lg">{selectedDetection.species}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-bold">Confidence</span>
                                            <span className="font-medium text-slate-900">{selectedDetection.confidence ? (selectedDetection.confidence * 100).toFixed(1) + '%' : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-bold">Est. Count</span>
                                            <span className="font-medium text-slate-900">{selectedDetection.animal_count}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-bold">Detected</span>
                                            <span className="font-medium text-slate-900">{new Date(selectedDetection.detected_at).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Action Area */}
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                                        {selectedDetection.status === 'PENDING_REVIEW' ? (
                                            <>
                                                <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/> Head Officer Review</h3>
                                                <p className="text-xs text-slate-500 mb-4 font-medium">Verify this AI detection. Accepting will create an official Gaia Incident.</p>
                                                
                                                <div className="space-y-3">
                                                    <button 
                                                        disabled={actionLoading}
                                                        onClick={handleAccept}
                                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                                                    >
                                                        {actionLoading ? 'PROCESSING...' : <><Check className="w-5 h-5"/> ACCEPT & CREATE INCIDENT</>}
                                                    </button>
                                                    
                                                    <div className="pt-3 border-t border-slate-200">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Rejection reason (required)..." 
                                                            value={rejectReason}
                                                            onChange={e => setRejectReason(e.target.value)}
                                                            className="w-full text-sm rounded-lg border-slate-300 focus:ring-red-500 focus:border-red-500 mb-2"
                                                        />
                                                        <button 
                                                            disabled={actionLoading || !rejectReason.trim()}
                                                            onClick={handleReject}
                                                            className="w-full py-2 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                                                        >
                                                            <X className="w-4 h-4"/> REJECT FALSE POSITIVE
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        ) : selectedDetection.status === 'ACCEPTED' ? (
                                            <div className="text-center">
                                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                                                <h3 className="font-black text-slate-900 text-lg">Verified Detection</h3>
                                                <p className="text-slate-500 text-sm mt-1 mb-4">This detection was accepted and converted to an official incident.</p>
                                                {selectedDetection.incident_reference_id && (
                                                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 font-black flex items-center justify-center gap-2">
                                                        {selectedDetection.incident_reference_id}
                                                        {user?.role !== 'Villager' && (
                                                            <Link to="/officer/incidents" className="text-emerald-600 hover:text-emerald-900"><ExternalLink className="w-4 h-4" /></Link>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="mt-4 text-xs font-bold text-slate-400">
                                                    Reviewed by: {selectedDetection.reviewed_by}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                                                <h3 className="font-black text-slate-900 text-lg">Rejected</h3>
                                                <p className="text-red-600 font-bold text-sm mt-2 p-2 bg-red-50 rounded border border-red-100">
                                                    "{selectedDetection.rejection_reason}"
                                                </p>
                                                <div className="mt-4 text-xs font-bold text-slate-400">
                                                    Reviewed by: {selectedDetection.reviewed_by}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CameraDetectionsReviewPage;
