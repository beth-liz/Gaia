import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { 
    CheckCircle2, XCircle, Clock, ShieldCheck, 
    Camera, Image as ImageIcon, ShieldAlert, ExternalLink,
    MapPin, Calendar, Eye, Search, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SafeImage } from '@/components/common/SafeImage';
import { CameraDetectionViewer } from '@/components/common/CameraDetectionViewer';

export const CameraDetectionsPage: React.FC = () => {
    const { user } = useAuth();
    const [detections, setDetections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Modal state for monitoring details
    const [selectedDetection, setSelectedDetection] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Filters & Search
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [speciesFilter, setSpeciesFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Station-based organization
    const [stations, setStations] = useState<any[]>([]);
    const [selectedStationId, setSelectedStationId] = useState<string>('ALL');

    const loadDetections = async () => {
        try {
            setLoading(true);
            const [data, stList] = await Promise.all([
                api.getCameraDetections(),
                api.getMonitoringStations().catch(() => [])
            ]);
            // Client-side safeguard: only include detections with valid, non-empty image_path
            const validData = Array.isArray(data) ? data.filter((d: any) => d && typeof d.image_path === 'string' && d.image_path.trim().length > 0) : [];
            setDetections(validData);
            setStations(stList || []);
            setError(null);
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
            setIsModalOpen(true);
        } catch (err: any) {
            alert(err.message || "Failed to load detection details");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedDetection(null);
    };

    // Filtered by station first (or all)
    const stationDetections = detections.filter(d => {
        if (selectedStationId === 'ALL') return true;
        return String(d.monitoring_station_id) === String(selectedStationId);
    });

    // Metrics based on selected station scope
    const totalDetections = stationDetections.length;
    const pendingCount = stationDetections.filter(d => d.status === 'PENDING_REVIEW').length;
    const acceptedCount = stationDetections.filter(d => d.status === 'ACCEPTED').length;
    const rejectedCount = stationDetections.filter(d => d.status === 'REJECTED').length;

    // Available species list for filtering
    const speciesList = Array.from(new Set(stationDetections.map(d => d.species).filter(Boolean)));

    // Filtered list
    const filteredDetections = stationDetections.filter(d => {
        const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
        const matchesSpecies = speciesFilter === 'ALL' || d.species === speciesFilter;
        const matchesSearch = !searchQuery.trim() || 
            (d.event_code && d.event_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (d.species && d.species.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (d.camera_name && d.camera_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (d.station_name && d.station_name.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSpecies && matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Standard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-950/10 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-900 text-amber-300 shadow-md shrink-0">
                        <Camera className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-extrabold text-emerald-950 tracking-tight">Camera Detections Log</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                                {totalDetections} Detections
                            </span>
                        </div>
                        <p className="text-xs text-emerald-800/70 font-medium mt-0.5">
                            Continuous AI wildlife sensing feed. Monitor camera observations, species classifications, and approximate animal counts across surveillance stations.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadDetections}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-950/20 font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Refresh Feed</span>
                    </button>
                    <Link
                        to={user?.role === 'Admin' ? '/admin/camera-incidents' : '/officer/camera-incidents'}
                        className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95"
                    >
                        <ShieldAlert className="w-4 h-4 text-emerald-200" />
                        <span>Incident Review ({pendingCount})</span>
                    </Link>
                </div>
            </div>

            {/* Station Selector Bar */}
            {user?.role === 'Admin' && stations.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Camera className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                            <span className="text-xs font-black uppercase text-emerald-950 block">Filter By Monitoring Station</span>
                            <span className="text-[11px] text-emerald-800/70 font-medium">Select a station to view its camera detections</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedStationId}
                            onChange={(e) => {
                                setSelectedStationId(e.target.value);
                            }}
                            className="bg-emerald-50/50 border border-emerald-950/20 text-emerald-950 font-bold text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer min-w-[240px]"
                        >
                            <option value="ALL">All Monitoring Stations ({detections.length} detections)</option>
                            {stations.map(st => {
                                const stDetCount = detections.filter(d => d.monitoring_station_id === st.id).length;
                                return (
                                    <option key={st.id} value={st.id}>
                                        {st.station_name} {st.district_name ? `(${st.district_name})` : ''} — {stDetCount} {stDetCount === 1 ? 'detection' : 'detections'}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
            )}

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-emerald-950/10 shadow-xs flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-slate-700" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Detections</div>
                        <div className="text-2xl font-black text-slate-900">{totalDetections}</div>
                    </div>
                </div>

                <div 
                    onClick={() => setStatusFilter('PENDING_REVIEW')}
                    className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs flex items-center gap-4 cursor-pointer hover:border-amber-300 transition-colors"
                >
                    <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending Review</div>
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
                        <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Rejected Records</div>
                        <div className="text-2xl font-black text-slate-900">{rejectedCount}</div>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={() => setStatusFilter('ALL')} 
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors ${statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                    >
                        All Status
                    </button>
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
                        Accepted ({acceptedCount})
                    </button>
                    <button 
                        onClick={() => setStatusFilter('REJECTED')} 
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors ${statusFilter === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                    >
                        Rejected ({rejectedCount})
                    </button>

                    {speciesList.length > 0 && (
                        <select
                            value={speciesFilter}
                            onChange={(e) => setSpeciesFilter(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 shadow-xs focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="ALL">All Species</option>
                            {speciesList.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search detection ID, camera, species..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:ring-emerald-500 focus:border-emerald-500 shadow-xs"
                    />
                </div>
            </div>

            {/* Detections Monitoring Feed */}
            <div>
                {loading ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-xs">
                        <ShieldCheck className="w-12 h-12 text-emerald-500 animate-pulse mx-auto mb-3" />
                        <h3 className="text-base font-black text-slate-700">Loading camera detection feed...</h3>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl font-medium flex items-center gap-3">
                        <XCircle className="w-6 h-6 shrink-0" />
                        <span>{error}</span>
                    </div>
                ) : filteredDetections.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-16 text-center flex flex-col items-center justify-center text-slate-500 font-medium">
                        <Camera className="w-12 h-12 text-slate-300 mb-3" />
                        <h4 className="text-base font-black text-slate-800">No detections found</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">No camera detection records match your current filter and search criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredDetections.map(det => (
                            <div 
                                key={det.id}
                                onClick={() => openModal(det.id)}
                                className="group bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all cursor-pointer overflow-hidden flex flex-col"
                            >
                                <div className="h-48 bg-slate-900 relative">
                                    {det.image_path ? (
                                        <SafeImage 
                                            src={det.image_path} 
                                            alt={det.species || "Detection"} 
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
                                            det.status === 'PENDING_REVIEW' ? 'bg-amber-500 text-white' :
                                            det.status === 'ACCEPTED' ? 'bg-emerald-500 text-white' :
                                            'bg-red-500 text-white'
                                        }`}>
                                            {det.status.replace("_", " ")}
                                        </span>
                                    </div>

                                    {/* Species & Confidence Banner */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-4 pt-10">
                                        <h4 className="text-white font-black text-lg">{det.species || 'Unknown Wildlife'}</h4>
                                        <div className="flex items-center gap-3 text-xs mt-0.5">
                                            <span className="text-emerald-400 font-bold">
                                                {det.confidence ? (det.confidence * 100).toFixed(1) + '%' : 'N/A'} Confidence
                                            </span>
                                            <span className="text-slate-300 font-semibold">•</span>
                                            <span className="text-slate-200 font-semibold">Count: {det.animal_count}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col gap-2.5 text-xs">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Event ID</span>
                                        <span className="font-mono font-black text-slate-900">{det.event_code}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Camera</span>
                                        <span className="font-bold text-slate-800">{det.camera_name || 'Camera Source'}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Station</span>
                                        <span className="font-semibold text-slate-700">{det.station_name || 'HQ Range'}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1 text-slate-500">
                                        <span className="flex items-center gap-1 font-medium">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            {new Date(det.detected_at).toLocaleString()}
                                        </span>
                                        <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                            <Eye className="w-3.5 h-3.5" /> Inspect Details
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Read-Only Inspection Modal (No Accept/Reject Actions) */}
            {isModalOpen && selectedDetection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
                        
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white p-5 sm:p-6 shrink-0 flex justify-between items-center border-b border-slate-800">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <Camera className="w-6 h-6 text-emerald-400" />
                                    <h2 className="text-xl font-black">Detection Observation {selectedDetection.event_code}</h2>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                        selectedDetection.status === 'PENDING_REVIEW' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                        selectedDetection.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                        'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}>
                                        {selectedDetection.status.replace("_", " ")}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-xs font-medium ml-9">
                                    Reported by {selectedDetection.camera_name} • {selectedDetection.station_name}
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
                            {/* Left: Aspect-Locked Bounding Box Canvas */}
                            <div className="flex-1 bg-slate-100 flex flex-col overflow-y-auto border-r border-slate-200 p-6 sm:p-8 relative">
                                <CameraDetectionViewer
                                    imagePath={selectedDetection.image_path}
                                    detections={selectedDetection.ai_result}
                                    species={selectedDetection.species}
                                    confidence={selectedDetection.confidence}
                                    animalCount={selectedDetection.animal_count}
                                    maxHeight="520px"
                                    showInspector={true}
                                />
                            </div>

                            {/* Right: Monitoring Details Panel (Strictly Read-Only) */}
                            <div className="w-full lg:w-96 bg-white flex flex-col shrink-0 overflow-y-auto p-6 space-y-6">
                                <div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                                        Detection Metadata
                                    </h3>
                                    <div className="space-y-3.5 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-bold">Identified Species</span>
                                            <span className="font-black text-slate-900 text-sm">{selectedDetection.species}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-bold">Species Classification Conf</span>
                                            <span className="font-bold text-emerald-600">
                                                {selectedDetection.confidence ? (selectedDetection.confidence * 100).toFixed(1) + '%' : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-bold">Total Animals Detected</span>
                                            <span className="font-extrabold text-slate-900">{selectedDetection.animal_count}</span>
                                        </div>
                                        {selectedDetection.ai_result && Array.isArray(selectedDetection.ai_result) && selectedDetection.ai_result.length > 0 && (
                                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Detections Breakdown</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(() => {
                                                        const counts: Record<string, number> = {};
                                                        let uncertain = 0;
                                                        selectedDetection.ai_result.forEach((box: any) => {
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
                                            <span className="text-slate-500 font-bold">Observation Time</span>
                                            <span className="font-medium text-slate-700">{new Date(selectedDetection.detected_at).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-bold">Location</span>
                                            <span className="font-medium text-slate-700 flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                {selectedDetection.station_name}
                                            </span>
                                        </div>
                                        {selectedDetection.latitude && selectedDetection.longitude && (
                                            <div className="flex justify-between items-center font-mono">
                                                <span className="text-slate-500 font-sans font-bold">GPS Coordinates</span>
                                                <span className="text-slate-700 font-semibold text-[11px]">
                                                    {selectedDetection.latitude.toFixed(5)}, {selectedDetection.longitude.toFixed(5)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Review Status & Provenance Card */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Review Status</h4>
                                    
                                    {selectedDetection.status === 'PENDING_REVIEW' ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-amber-700 font-bold">
                                                <Clock className="w-4 h-4 text-amber-600" />
                                                <span>Awaiting Official Review</span>
                                            </div>
                                            <p className="text-slate-500 text-[11px] leading-relaxed">
                                                Incident acceptance and rejection operations are handled in the designated Camera Incidents review queue.
                                            </p>
                                            <Link
                                                to={user?.role === 'Admin' ? '/admin/camera-incidents' : '/officer/camera-incidents'}
                                                className="block w-full py-2.5 text-center bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-xs transition-colors"
                                            >
                                                Go to Camera Incidents Review
                                            </Link>
                                        </div>
                                    ) : selectedDetection.status === 'ACCEPTED' ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-emerald-700 font-bold">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                <span>Accepted & Linked to Incident</span>
                                            </div>
                                            {selectedDetection.incident_reference_id && (
                                                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 font-black text-emerald-900 flex items-center justify-between">
                                                    <span>{selectedDetection.incident_reference_id}</span>
                                                    {user?.role !== 'Villager' && (
                                                        <Link 
                                                            to={`/officer/incidents/${selectedDetection.incident_id || ''}`} 
                                                            className="text-emerald-700 hover:text-emerald-900"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                </div>
                                            )}
                                            {selectedDetection.reviewed_by && (
                                                <span className="text-[10px] text-slate-400 block">
                                                    Verified by: {selectedDetection.reviewed_by}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-red-700 font-bold">
                                                <XCircle className="w-4 h-4 text-red-600" />
                                                <span>Rejected Candidate</span>
                                            </div>
                                            {selectedDetection.rejection_reason && (
                                                <p className="p-2.5 bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium text-[11px]">
                                                    "{selectedDetection.rejection_reason}"
                                                </p>
                                            )}
                                            {selectedDetection.reviewed_by && (
                                                <span className="text-[10px] text-slate-400 block">
                                                    Reviewed by: {selectedDetection.reviewed_by}
                                                </span>
                                            )}
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

export default CameraDetectionsPage;
