import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { 
    Video, Activity, AlertCircle, Camera, CheckCircle2, 
    XCircle, MapPin, Zap, BrainCircuit, ShieldAlert, X, Image as ImageIcon, 
    Crosshair, List, Radio, Cpu, Sparkles, RefreshCw, ShieldCheck, Plus, Loader2
} from 'lucide-react';
import { SafeImage } from '@/components/common/SafeImage';
import { CameraDetectionViewer } from '@/components/common/CameraDetectionViewer';

const CamerasPage: React.FC = () => {
    const { user } = useAuth();
    const [cameras, setCameras] = useState<any[]>([]);
    const [stationName, setStationName] = useState('Loading...');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [selectedCamera, setSelectedCamera] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Add Camera Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [stations, setStations] = useState<any[]>([]);
    const [selectedStationId, setSelectedStationId] = useState<string>('ALL');
    const [addFormData, setAddFormData] = useState({
        camera_name: '',
        camera_code: '',
        monitoring_station_id: 0,
        location_name: '',
        latitude: '',
        longitude: '',
        status: 'Active'
    });
    const [userManuallyEditedCoords, setUserManuallyEditedCoords] = useState(false);
    const [isAddingCamera, setIsAddingCamera] = useState(false);
    const [addCameraError, setAddCameraError] = useState<string | null>(null);
    const [addCameraSuccess, setAddCameraSuccess] = useState<string | null>(null);

    // Capture state
    const [recentCaptures, setRecentCaptures] = useState<any[]>([]);
    const [testImages, setTestImages] = useState<string[]>([]);
    
    // Simulation Workflow State
    const [simulationChoice, setSimulationChoice] = useState<'AUTOMATIC' | 'MANUAL'>('AUTOMATIC');
    // Active selection & capture source-of-truth states
    const [selectedHistoricalCapture, setSelectedHistoricalCapture] = useState<any | null>(null);
    const [selectedManualImage, setSelectedManualImage] = useState<string | null>(null);
    const [simulationCapture, setSimulationCapture] = useState<any | null>(null);

    // Track active simulation ID to prevent stale or race condition updates
    const activeSimulationIdRef = useRef<string | null>(null);

    const [simulationStage, setSimulationStage] = useState<'IDLE' | 'MOTION' | 'CAPTURING' | 'AI_MEGA' | 'AI_SPECIES' | 'RESULTS' | 'FAILED'>('IDLE');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [cameraShutterFlash, setCameraShutterFlash] = useState<boolean>(false);
    const [timelineLogs, setTimelineLogs] = useState<{time: string, msg: string, type: 'info' | 'success' | 'error' | 'ai' | 'sensor'}[]>([]);

    // Determine the active display record or preview image according to strict precedence:
    // 1. Historical capture explicitly selected by user
    // 2. Completed or in-progress simulation capture (from backend)
    // 3. Staged manual test image selection (for immediate preview)
    const activeRecord = selectedHistoricalCapture || simulationCapture;
    const activePreviewImage = activeRecord?.image_path || (simulationChoice === 'MANUAL' ? selectedManualImage : null);

    const logsEndRef = useRef<HTMLDivElement>(null);

    const refreshCameras = async () => {
        try {
            setLoading(true);
            if (user?.role === 'Admin') {
                const data = await api.getAllCameras();
                setCameras(data);
                setStationName('All Monitoring Stations (HQ)');
            } else if (user?.station_id) {
                const data = await api.getCamerasForStation(user.station_id);
                setCameras(data);
                if (data.length > 0) {
                    try {
                        const stationRes = await api.getStationById(user.station_id);
                        setStationName(stationRes.station_name);
                    } catch (e) {
                        setStationName('Assigned Station');
                    }
                }
            } else {
                setError('No monitoring station assigned to your officer account.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load remote cameras.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshCameras();
        // Load monitoring stations for Add Camera modal
        api.getMonitoringStations().then(stList => {
            setStations(stList || []);
        }).catch(err => {
            console.error("Failed to load monitoring stations for Add Camera modal", err);
        });
    }, [user]);

    useEffect(() => {
        const fetchTestImages = async () => {
            try {
                const data = await api.getAvailableTestImages();
                setTestImages(data.images || []);
            } catch (err) {
                console.error("Failed to load test images", err);
            }
        };
        fetchTestImages();
    }, []);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [timelineLogs]);

    const openCameraModal = async (camera: any) => {
        setSelectedCamera(camera);
        setIsModalOpen(true);
        setSimulationStage('IDLE');
        setIsSubmitting(false);
        setCameraShutterFlash(false);
        setTimelineLogs([]);
        
        // Strict requirement: Empty initial feed when opening camera or switching cameras
        // Do NOT auto-load latest capture or older detections
        setSelectedHistoricalCapture(null);
        setSelectedManualImage(null);
        setSimulationCapture(null);
        setSimulationChoice('AUTOMATIC');
        activeSimulationIdRef.current = null;
        
        try {
            const captures = await api.getCameraCaptures(camera.id);
            setRecentCaptures(captures);
        } catch (err) {
            console.error("Failed to load recent captures", err);
        }
    };

    const closeModal = () => {
        if (isSubmitting) return; // Prevent closing mid-simulation
        setIsModalOpen(false);
        setSelectedCamera(null);
        setSelectedHistoricalCapture(null);
        setSelectedManualImage(null);
        setSimulationCapture(null);
        activeSimulationIdRef.current = null;
    };

    const addLog = (msg: string, type: 'info' | 'success' | 'error' | 'ai' | 'sensor' = 'info') => {
        setTimelineLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
    };

    const startSimulation = async () => {
        if (!selectedCamera || isSubmitting) return;

        let targetImage: string | undefined = undefined;
        if (simulationChoice === 'MANUAL') {
            if (!selectedManualImage) {
                const defaultImg = testImages[0] || 'tiger/tiger_1.jpg';
                setSelectedManualImage(defaultImg);
                targetImage = defaultImg;
            } else {
                targetImage = selectedManualImage;
            }
        } else {
            targetImage = 'AUTOMATIC';
        }

        // Generate unique simulation run ID to prevent race conditions
        const currentSimId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        activeSimulationIdRef.current = currentSimId;

        // Reset previous simulation and historical state for fresh run
        setSelectedHistoricalCapture(null);
        setSimulationCapture(null);

        setIsSubmitting(true);
        setCameraShutterFlash(false);
        setTimelineLogs([]);

        // Stage 1: PIR Motion detection (~2 seconds)
        setSimulationStage('MOTION');
        addLog(`PIR Sensor Trigger: Movement registered within camera monitoring zone.`, 'sensor');
        addLog(`Camera ${selectedCamera.camera_code} telemetry: Optical wake signal sent.`, 'info');

        await new Promise(r => setTimeout(r, 2000));
        if (activeSimulationIdRef.current !== currentSimId) return;

        // Stage 2: Camera capture initiated with electronic shutter flash (~2 seconds)
        setSimulationStage('CAPTURING');
        setCameraShutterFlash(true);
        addLog(`Camera shutter engaged. Storing raw capture buffer...`, 'info');

        setTimeout(() => setCameraShutterFlash(false), 500);

        try {
            // Trigger backend atomic simulation: creates capture, stores file, executes MegaDetector + SpeciesNet
            let newlyCapturedData: any = null;
            const capturePromise = api.simulateCameraCapture(selectedCamera.id, targetImage).then(res => {
                if (activeSimulationIdRef.current === currentSimId) {
                    newlyCapturedData = res;
                    // If capture returned while in stages 3 or 4, update simulationCapture
                    setSimulationCapture(res);
                }
                return res;
            });

            // Wait for shutter frame to register (~2.0 seconds total for Stage 2)
            await new Promise(r => setTimeout(r, 2000));
            if (activeSimulationIdRef.current !== currentSimId) return;

            // Stage 3: MegaDetector analysis (~2.0 seconds)
            setSimulationStage('AI_MEGA');
            addLog(`MegaDetector v5a analysing image frame for animal candidates...`, 'ai');
            addLog(`Scanning candidate bounding boxes at detector threshold >= 0.20`, 'ai');
            await new Promise(r => setTimeout(r, 2000));
            if (activeSimulationIdRef.current !== currentSimId) return;

            // Stage 4: SpeciesNet classification (~2.0 seconds)
            setSimulationStage('AI_SPECIES');
            addLog(`SpeciesNet v4.0.3a classifying detected animal regions...`, 'ai');
            addLog(`Evaluating species classifications at confidence threshold >= 0.50`, 'ai');
            await new Promise(r => setTimeout(r, 2000));
            if (activeSimulationIdRef.current !== currentSimId) return;

            // Await real backend response (if backend inference is still computing, wait for it)
            const completedCapture = newlyCapturedData || await capturePromise;
            if (activeSimulationIdRef.current !== currentSimId) return;

            // Stage 5: Results Reveal
            if (completedCapture.ai_result?.processing_status === 'FAILED') {
                setSimulationStage('FAILED');
                addLog(`AI inference failed: ${completedCapture.ai_result.failure_reason || 'Unknown pipeline error'}`, 'error');
                setSimulationCapture(completedCapture);
            } else {
                setSimulationStage('RESULTS');
                const animCount = completedCapture.ai_result?.animal_count ?? 0;
                const speciesName = completedCapture.ai_result?.overall_species ?? 'Unknown';

                if (animCount > 0) {
                    addLog(`Detection complete: ${animCount} animal${animCount > 1 ? 's' : ''} detected (${speciesName}).`, 'success');
                    if (completedCapture.ai_result?.detection_event) {
                        addLog(`Surveillance event ${completedCapture.ai_result.detection_event.event_code} routed to Station Incident Queue.`, 'success');
                    }
                } else {
                    addLog(`Zero wildlife detected. Frame catalogued as clear observation.`, 'info');
                }
                setSimulationCapture(completedCapture);
            }

            // Refresh recent captures history
            api.getCameraCaptures(selectedCamera.id).then(caps => {
                if (activeSimulationIdRef.current === currentSimId) {
                    setRecentCaptures(caps);
                    const updated = caps.find((c: any) => c.id === completedCapture.id);
                    if (updated) setSimulationCapture(updated);
                }
            }).catch(console.error);

        } catch (err: any) {
            if (activeSimulationIdRef.current === currentSimId) {
                setSimulationStage('FAILED');
                addLog(`Simulation request failed: ${err.message || 'Network error'}`, 'error');
            }
        } finally {
            if (activeSimulationIdRef.current === currentSimId) {
                setIsSubmitting(false);
            }
        }
    };

    const isCameraActive = (cam: any) => (cam?.status || '').toUpperCase() === 'ACTIVE';

    const canAddCamera = user?.role === 'Admin' || user?.role === 'Range Forest Officer' || user?.role === 'Officer';

    const openAddCameraModal = () => {
        // Find default station ID
        let initialStationId = 0;
        if (user?.role !== 'Admin' && user?.station_id) {
            initialStationId = user.station_id;
        } else if (stations.length > 0) {
            initialStationId = stations[0].id;
        }

        const selectedSt = stations.find(s => s.id === initialStationId);
        setAddFormData({
            camera_name: '',
            camera_code: '',
            monitoring_station_id: initialStationId,
            location_name: selectedSt ? `${selectedSt.station_name} Sector` : '',
            latitude: selectedSt?.latitude ? String(selectedSt.latitude) : '',
            longitude: selectedSt?.longitude ? String(selectedSt.longitude) : '',
            status: 'Active'
        });
        setUserManuallyEditedCoords(false);
        setAddCameraError(null);
        setAddCameraSuccess(null);
        setIsAddModalOpen(true);
    };

    const handleStationChange = (newStationId: number) => {
        const found = stations.find(s => s.id === newStationId);
        setAddFormData(prev => ({
            ...prev,
            monitoring_station_id: newStationId,
            location_name: prev.location_name && !prev.location_name.includes('Sector') ? prev.location_name : (found ? `${found.station_name} Sector` : prev.location_name),
            // Only update lat/long with default station coordinates if the user has NOT manually typed their own coordinates
            latitude: userManuallyEditedCoords ? prev.latitude : (found?.latitude ? String(found.latitude) : prev.latitude),
            longitude: userManuallyEditedCoords ? prev.longitude : (found?.longitude ? String(found.longitude) : prev.longitude),
        }));
    };

    const handleAddCameraSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddCameraError(null);
        setAddCameraSuccess(null);

        // Client-side validations
        if (!addFormData.camera_name.trim()) {
            setAddCameraError("Camera name is required.");
            return;
        }
        if (!addFormData.camera_code.trim()) {
            setAddCameraError("Camera hardware code is required.");
            return;
        }
        if (!addFormData.monitoring_station_id) {
            setAddCameraError("Please select a valid monitoring station.");
            return;
        }

        const latNum = parseFloat(addFormData.latitude);
        const lngNum = parseFloat(addFormData.longitude);

        if (isNaN(latNum) || latNum < -90 || latNum > 90) {
            setAddCameraError("Valid latitude between -90.0000 and 90.0000 is required.");
            return;
        }
        if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
            setAddCameraError("Valid longitude between -180.0000 and 180.0000 is required.");
            return;
        }

        try {
            setIsAddingCamera(true);
            const created = await api.createCamera({
                camera_name: addFormData.camera_name.trim(),
                camera_code: addFormData.camera_code.trim().toUpperCase(),
                monitoring_station_id: Number(addFormData.monitoring_station_id),
                location_name: addFormData.location_name.trim() || undefined,
                latitude: latNum,
                longitude: lngNum,
                status: addFormData.status
            });

            setAddCameraSuccess(`Camera ${created.camera_code} (${created.camera_name}) registered successfully!`);
            await refreshCameras();
            setTimeout(() => {
                setIsAddModalOpen(false);
                setAddCameraSuccess(null);
            }, 1200);
        } catch (err: any) {
            setAddCameraError(err.message || "Failed to create camera.");
        } finally {
            setIsAddingCamera(false);
        }
    };

    const filteredCameras = cameras.filter(c => {
        if (selectedStationId === 'ALL') return true;
        return String(c.monitoring_station_id) === String(selectedStationId);
    });

    const activeCount = filteredCameras.filter(c => isCameraActive(c)).length;
    const inactiveCount = filteredCameras.filter(c => (c.status || '').toUpperCase() === 'INACTIVE').length;
    const maintenanceCount = filteredCameras.filter(c => (c.status || '').toUpperCase() === 'MAINTENANCE').length;

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
                            <h1 className="text-xl font-extrabold text-emerald-950 tracking-tight">Camera Surveillance</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                                {filteredCameras.length} Cameras
                            </span>
                        </div>
                        <p className="text-xs text-emerald-800/70 font-medium mt-0.5">
                            Gaia Remote Wildlife Sensing Console. Monitor field cameras, review camera captures, and test edge AI wildlife detection pipeline for {stationName}.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {canAddCamera && (
                        <button
                            onClick={openAddCameraModal}
                            className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Camera</span>
                        </button>
                    )}
                    <button
                        onClick={refreshCameras}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-950/20 font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Station Selector Bar */}
            {user?.role === 'Admin' && stations.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Radio className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                            <span className="text-xs font-black uppercase text-emerald-950 block">Filter By Monitoring Station</span>
                            <span className="text-[11px] text-emerald-800/70 font-medium">Select a station to focus camera telemetry</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedStationId}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedStationId(val);
                                if (val === 'ALL') {
                                    setStationName('All Monitoring Stations (HQ)');
                                } else {
                                    const st = stations.find(s => String(s.id) === String(val));
                                    setStationName(st ? st.station_name : 'Selected Station');
                                }
                            }}
                            className="bg-emerald-50/50 border border-emerald-950/20 text-emerald-950 font-bold text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer min-w-[240px]"
                        >
                            <option value="ALL">All Monitoring Stations ({cameras.length} cameras)</option>
                            {stations.map(st => {
                                const stCamCount = cameras.filter(c => c.monitoring_station_id === st.id).length;
                                return (
                                    <option key={st.id} value={st.id}>
                                        {st.station_name} {st.district_name ? `(${st.district_name})` : ''} — {stCamCount} {stCamCount === 1 ? 'camera' : 'cameras'}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-emerald-950/10 shadow-xs flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Video className="w-5 h-5 text-slate-700" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Units</div>
                        <div className="text-2xl font-black text-slate-900">{filteredCameras.length}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Active</div>
                        <div className="text-2xl font-black text-slate-900">{activeCount}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-xs flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                        <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Offline</div>
                        <div className="text-2xl font-black text-slate-900">{inactiveCount}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Maintenance</div>
                        <div className="text-2xl font-black text-slate-900">{maintenanceCount}</div>
                    </div>
                </div>
            </div>

            {/* Camera Grid / States */}
            <div>
                {loading ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-emerald-950/10 shadow-xs">
                        <Activity className="w-10 h-10 text-emerald-600 animate-pulse mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-emerald-950">Connecting to telemetry network...</h3>
                        <p className="text-xs text-slate-400 mt-1">Polling optical camera feeds and station statuses</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl font-medium flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <XCircle className="w-6 h-6 shrink-0" />
                            <div>
                                <div className="font-bold">Access Alert</div>
                                <div className="text-sm">{error}</div>
                            </div>
                        </div>
                        <button
                            onClick={refreshCameras}
                            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                        >
                            Retry
                        </button>
                    </div>
                ) : filteredCameras.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-emerald-950/10 shadow-xs">
                        <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-800">No Cameras Found</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            {selectedStationId === 'ALL'
                                ? "No cameras have been registered in the system yet."
                                : "No cameras are registered under the selected monitoring station."}
                        </p>
                        {canAddCamera && (
                            <button
                                onClick={openAddCameraModal}
                                className="mt-4 inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Camera</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCameras.map(camera => {
                            const active = isCameraActive(camera);
                            return (
                                <div 
                                    key={camera.id}
                                    onClick={() => openCameraModal(camera)}
                                    className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all cursor-pointer overflow-hidden flex flex-col"
                                >
                                    <div className="h-32 bg-slate-900 relative flex items-center justify-center overflow-hidden">
                                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500 to-transparent"></div>
                                        <Camera className="w-12 h-12 text-slate-700 group-hover:text-emerald-400 transition-colors z-10" />
                                        <div className="absolute top-3 right-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                                                active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                (camera.status || '').toUpperCase() === 'INACTIVE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-current'}`} />
                                                {camera.status}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-500 flex items-center gap-1">
                                            <Radio className="w-3 h-3 text-emerald-500" />
                                            <span>CAM-ID #{camera.id}</span>
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">{camera.camera_name}</h3>
                                        <p className="text-xs font-bold text-slate-400 mb-4">{camera.camera_code}</p>
                                        
                                        <div className="mt-auto space-y-2.5">
                                            <div className="flex items-start gap-2 text-sm text-slate-600">
                                                <MapPin className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                                                <span className="line-clamp-2">{camera.location_name || camera.location || 'Surveillance Sector'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                                <Crosshair className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                                                <span>{camera.latitude?.toFixed(5) || '11.6050'}, {camera.longitude?.toFixed(5) || '76.0820'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FULL-SCREEN CAMERA MONITORING CONSOLE MODAL */}
            {isModalOpen && selectedCamera && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl w-full max-w-[96vw] 2xl:max-w-7xl h-[94vh] flex flex-col overflow-hidden border border-slate-800">
                        
                        {/* Top Console Bar */}
                        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isCameraActive(selectedCamera) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                                    <Video className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-black text-white">{selectedCamera.camera_name}</h2>
                                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${isCameraActive(selectedCamera) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400'}`}>
                                            {selectedCamera.status}
                                        </span>
                                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 text-[10px] font-mono rounded">
                                            {selectedCamera.camera_code}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-400 mt-0.5">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                            {selectedCamera.location_name || selectedCamera.location || 'Station Sector'}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1 font-mono">
                                            <Crosshair className="w-3.5 h-3.5 text-emerald-500" />
                                            {selectedCamera.latitude}, {selectedCamera.longitude}
                                        </span>
                                        <span>•</span>
                                        <span className="text-emerald-400/90 font-medium">Station: {selectedCamera.station_name || stationName}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
                                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                    <span>Simulated Edge IoT Node</span>
                                </div>
                                <button 
                                    onClick={closeModal} 
                                    disabled={isSubmitting}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
                                    title="Close console"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Main Split Layout */}
                        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                            
                            {/* Left Viewport: Screen, Radar, Shutter, Laser Scanner & Detections */}
                            <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto border-r border-slate-800/80 p-5 sm:p-6 space-y-6">
                                
                                {/* Viewport Container with Tactical HUD Styling */}
                                <div data-testid="optical-feed-container" className="relative rounded-2xl overflow-hidden bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col shrink-0 min-h-[500px] h-[520px]">
                                    
                                    {/* Viewport Header */}
                                    <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex justify-between items-center text-xs shrink-0 select-none">
                                        <div className="flex items-center gap-2 font-mono text-slate-400">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span>OPTICAL FEED TELEMETRY</span>
                                            <span className="text-slate-600">|</span>
                                            <span className="text-emerald-400">FPS: 30 (SIM)</span>
                                        </div>
                                        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                                            <span>MD v5a.0.1</span>
                                            <span>•</span>
                                            <span>SpeciesNet v4.0.3a</span>
                                        </div>
                                    </div>

                                    {/* Stage Display Area: Structured full-height dedicated viewport */}
                                    <div className="relative w-full flex-1 flex items-center justify-center bg-slate-950 overflow-hidden select-none min-h-0">
                                        
                                        {/* Camera Shutter Flash overlay */}
                                        {cameraShutterFlash && (
                                            <div className="absolute inset-0 z-50 bg-white animate-shutter-flash pointer-events-none" />
                                        )}

                                        {/* STAGE 1: PIR SENSOR MOTION DETECTION */}
                                        {simulationStage === 'MOTION' && (
                                            <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
                                                {/* Background Feed Frame if available */}
                                                {activePreviewImage && (
                                                    <div className="relative flex items-center justify-center w-full h-full max-h-[460px] overflow-hidden rounded-xl border border-amber-500/30 bg-slate-950">
                                                        <SafeImage 
                                                            src={activePreviewImage} 
                                                            alt="Sensor Monitoring Frame" 
                                                            className="w-auto h-auto max-w-full max-h-[450px] block object-contain mx-auto opacity-40 filter contrast-125 brightness-75"
                                                        />
                                                    </div>
                                                )}

                                                {/* High-tech Multi-ring Radar System Overlaid */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-5 z-10">
                                                    <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-full border border-amber-500/50 flex items-center justify-center bg-amber-950/40 backdrop-blur-xs shadow-[0_0_35px_rgba(245,158,11,0.2)]">
                                                        {/* Outer crosshairs */}
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <div className="w-full h-px bg-amber-500/30" />
                                                            <div className="h-full w-px bg-amber-500/30 absolute" />
                                                        </div>
                                                        {/* Rotating Radar Sweep Beam */}
                                                        <div className="absolute inset-0 rounded-full border-t-2 border-amber-400 animate-radar-sweep pointer-events-none" />
                                                        {/* Concentric rings */}
                                                        <div className="absolute inset-3 rounded-full border border-amber-500/30" />
                                                        <div className="absolute inset-8 rounded-full border border-dashed border-amber-500/30 animate-pulse" />
                                                        <div className="absolute inset-14 rounded-full border border-amber-500/25" />
                                                        {/* Pulsing Center Node with Ping Ripple */}
                                                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-500/30 border border-amber-400 flex items-center justify-center animate-pulse-ring">
                                                            <Radio className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300 animate-pulse" />
                                                        </div>
                                                        {/* Simulated Target Blip */}
                                                        <div className="absolute top-8 right-10 w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                                                        <div className="absolute top-8 right-10 w-3 h-3 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b]" />
                                                    </div>

                                                    <div className="space-y-1.5 max-w-md bg-slate-950/80 backdrop-blur-md p-3 rounded-xl border border-amber-500/30 shadow-xl">
                                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono text-[11px] font-black tracking-widest uppercase shadow-sm">
                                                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                                            PIR MOTION TRIP ACTIVATED
                                                        </div>
                                                        <h3 className="text-lg font-bold text-white tracking-tight">Thermal Sensor Disturbance</h3>
                                                        <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                                                            PIR sensor registered thermal movement within surveillance sector. Waking edge camera system & engaging optical sensor array...
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* STAGE 2: OPTICAL FRAME CAPTURE & BUFFERING */}
                                        {simulationStage === 'CAPTURING' && (
                                            <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
                                                {/* Background Feed Frame if available */}
                                                {activePreviewImage && (
                                                    <div className="relative flex items-center justify-center w-full h-full max-h-[460px] overflow-hidden rounded-xl border border-emerald-500/30 bg-slate-950">
                                                        <SafeImage 
                                                            src={activePreviewImage} 
                                                            alt="Frame Capture" 
                                                            className="w-auto h-auto max-w-full max-h-[450px] block object-contain mx-auto opacity-60 filter contrast-110"
                                                        />
                                                    </div>
                                                )}

                                                {/* High-tech Camera Aperture Iris Mechanism Overlaid */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-5 z-10">
                                                    <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-full border-2 border-emerald-500/50 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.25)]">
                                                        {/* Rotating Aperture Blades Ring */}
                                                        <div className="absolute inset-2 rounded-full border border-dashed border-emerald-400/40 animate-aperture-rotate pointer-events-none" />
                                                        <div className="absolute inset-6 rounded-full border border-emerald-500/30" />
                                                        {/* Corner Viewfinder Reticles */}
                                                        <div className="absolute -inset-2 border-t-2 border-l-2 border-emerald-400 w-6 h-6 rounded-tl-lg animate-corner-bracket" />
                                                        <div className="absolute -inset-2 top-auto border-b-2 border-l-2 border-emerald-400 w-6 h-6 rounded-bl-lg animate-corner-bracket" />
                                                        <div className="absolute -inset-2 left-auto border-t-2 border-r-2 border-emerald-400 w-6 h-6 rounded-tr-lg animate-corner-bracket" />
                                                        <div className="absolute -inset-2 left-auto top-auto border-b-2 border-r-2 border-emerald-400 w-6 h-6 rounded-br-lg animate-corner-bracket" />
                                                        
                                                        {/* Center Camera Icon with Shutter Trigger */}
                                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/30 border border-emerald-400/60 flex items-center justify-center shadow-lg">
                                                            <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300 animate-bounce" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5 max-w-md bg-slate-950/80 backdrop-blur-md p-3 rounded-xl border border-emerald-500/30 shadow-xl">
                                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono text-[11px] font-black tracking-widest uppercase shadow-sm">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                            OPTICAL FRAME EXPOSURE
                                                        </div>
                                                        <h3 className="text-lg font-bold text-white tracking-tight">Securing Surveillance Frame</h3>
                                                        <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                                                            Fast electronic shutter triggered. Writing raw optical sensor payload to edge buffer and dispatching to AI detection pipeline...
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* STAGE 3: MEGADETECTOR V5A CANDIDATE SCANNING */}
                                        {simulationStage === 'AI_MEGA' && (
                                            <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
                                                {activePreviewImage ? (
                                                    <div className="relative flex items-center justify-center w-full h-full max-h-[460px] overflow-hidden rounded-xl border border-blue-500/40 shadow-2xl bg-slate-950">
                                                        <SafeImage 
                                                            src={activePreviewImage} 
                                                            alt="MegaDetector Analysis Frame" 
                                                            className="w-auto h-auto max-w-full max-h-[450px] block object-contain mx-auto"
                                                        />
                                                        {/* Scanning Laser Beam with Glow */}
                                                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_16px_#38bdf8] animate-scan-line pointer-events-none" />
                                                        
                                                        {/* Simulated Candidate Detection Reticles during scan */}
                                                        <div className="absolute inset-8 border border-dashed border-cyan-400/60 rounded-lg pointer-events-none animate-pulse">
                                                            <div className="absolute -top-3 left-2 bg-blue-600 text-white font-mono text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                                                                SCANNING CANDIDATES
                                                            </div>
                                                        </div>

                                                        {/* Viewfinder Corner Overlays */}
                                                        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
                                                        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
                                                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
                                                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-80 flex flex-col items-center justify-center gap-4">
                                                        <div className="w-24 h-24 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shadow-lg">
                                                            <Cpu className="w-12 h-12 text-blue-400 animate-pulse" />
                                                        </div>
                                                        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="w-full h-full bg-blue-500 animate-pulse" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Tactical HUD Status Card */}
                                                <div className="absolute bottom-3 inset-x-4 p-2.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-blue-500/30 text-center space-y-0.5 z-20 shadow-xl">
                                                    <div className="inline-flex items-center gap-2 text-xs font-mono font-black text-cyan-400 uppercase tracking-wider">
                                                        <Cpu className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                                                        Stage 3 — MegaDetector v5a Processing
                                                    </div>
                                                    <p className="text-[11px] text-slate-300 font-mono">
                                                        Scanning full image array for animal candidates & computing normalized bounding box coordinates...
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* STAGE 4: SPECIESNET V4 TAXONOMY CLASSIFICATION */}
                                        {simulationStage === 'AI_SPECIES' && (
                                            <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
                                                {activePreviewImage ? (
                                                    <div className="relative flex items-center justify-center w-full h-full max-h-[460px] overflow-hidden rounded-xl border border-purple-500/40 shadow-2xl bg-slate-950">
                                                        <SafeImage 
                                                            src={activePreviewImage} 
                                                            alt="SpeciesNet Classification Frame" 
                                                            className="w-auto h-auto max-w-full max-h-[450px] block object-contain mx-auto"
                                                        />
                                                        {/* Dual Bi-directional Neural Scanner Line */}
                                                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_18px_#c084fc] animate-scan-line pointer-events-none" />
                                                        
                                                        {/* Simulated Crop Neural Inspection Box */}
                                                        <div className="absolute inset-12 border-2 border-purple-400/80 rounded-lg pointer-events-none animate-pulse shadow-[0_0_20px_rgba(192,132,252,0.2)]">
                                                            <div className="absolute -top-3.5 left-2 bg-purple-600 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded shadow flex items-center gap-1">
                                                                <BrainCircuit className="w-3 h-3" />
                                                                NEURAL TAXONOMY CROPS
                                                            </div>
                                                        </div>

                                                        {/* High-tech Corner Brackets */}
                                                        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-purple-400 pointer-events-none" />
                                                        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-purple-400 pointer-events-none" />
                                                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-purple-400 pointer-events-none" />
                                                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-purple-400 pointer-events-none" />
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-80 flex flex-col items-center justify-center gap-4">
                                                        <div className="w-24 h-24 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shadow-lg">
                                                            <BrainCircuit className="w-12 h-12 text-purple-400 animate-pulse" />
                                                        </div>
                                                        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="w-full h-full bg-purple-500 animate-pulse" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Tactical HUD Status Card */}
                                                <div className="absolute bottom-3 inset-x-4 p-2.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-purple-500/30 text-center space-y-0.5 z-20 shadow-xl">
                                                    <div className="inline-flex items-center gap-2 text-xs font-mono font-black text-purple-300 uppercase tracking-wider">
                                                        <Sparkles className="w-3.5 h-3.5 animate-pulse text-purple-400" />
                                                        Stage 4 — SpeciesNet v4.0.3a Classification
                                                    </div>
                                                    <p className="text-[11px] text-slate-300 font-mono">
                                                        Cropping candidate regions & evaluating taxonomic hierarchy (Kingdom &rarr; Phylum &rarr; Class &rarr; Species)...
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* STAGE 5 / IDLE PREVIEW: Full Viewport with Bounding Boxes */}
                                        {(simulationStage === 'RESULTS' || (simulationStage === 'IDLE' && (activeRecord || activePreviewImage))) && (
                                            <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
                                                <CameraDetectionViewer
                                                    imagePath={activeRecord?.image_path || activePreviewImage}
                                                    detections={activeRecord?.ai_result?.detections}
                                                    species={activeRecord?.ai_result?.overall_species}
                                                    confidence={activeRecord?.ai_result?.overall_confidence}
                                                    animalCount={activeRecord?.ai_result?.animal_count}
                                                    maxHeight="460px"
                                                    showInspector={false}
                                                    className="w-full h-full border-0 rounded-none bg-transparent"
                                                />
                                            </div>
                                        )}

                                        {/* STAGE F: PROCESSING FAILURE */}
                                        {simulationStage === 'FAILED' && (
                                            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                                                <div className="w-20 h-20 rounded-3xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                                                    <AlertCircle className="w-10 h-10 text-red-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-base font-bold text-white">AI Inference Error</h3>
                                                    <p className="text-xs text-red-400 max-w-md">
                                                        {activeRecord?.ai_result?.failure_reason || 'Could not complete AI pipeline analysis on camera capture.'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={startSimulation}
                                                    disabled={isSubmitting}
                                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" /> Retry Processing
                                                </button>
                                            </div>
                                        )}

                                        {/* Professional Standby Placeholder when camera is opened and awaiting selection/simulation */}
                                        {simulationStage === 'IDLE' && !activeRecord && !activePreviewImage && (
                                            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 select-none">
                                                <div className="relative w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
                                                    <div className="absolute inset-2 rounded-2xl border border-dashed border-slate-700/60 animate-pulse" />
                                                    <Video className="w-9 h-9 text-slate-500" />
                                                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500/30 border border-emerald-400 flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5 max-w-sm">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 font-mono text-[10px] font-bold tracking-wider uppercase">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                        Camera Ready • Telemetry Online
                                                    </div>
                                                    <h4 className="text-sm font-bold text-white tracking-tight">Optical Feed Telemetry Standby</h4>
                                                    <p className="text-xs text-slate-400 leading-relaxed">
                                                        Awaiting image selection. Choose a test image for immediate optical preview or start simulation to trigger telemetry capture.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Active Simulation Sequential Progress Indicators */}
                                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
                                    <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                                        <span>Pipeline Execution Sequence</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded ${isSubmitting ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                                            {isSubmitting ? 'EXECUTING' : 'READY'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {/* Step 1 */}
                                        <div className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
                                            simulationStage === 'MOTION' ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/50' :
                                            ['CAPTURING', 'AI_MEGA', 'AI_SPECIES', 'RESULTS'].includes(simulationStage) ? 'bg-slate-800/80 border-emerald-500/40 text-emerald-400' :
                                            'bg-slate-950/60 border-slate-800 text-slate-500'
                                        }`}>
                                            <div className="flex items-center gap-1.5 font-bold">
                                                <Radio className="w-3.5 h-3.5 shrink-0" />
                                                <span>1. PIR Motion</span>
                                            </div>
                                            <div className="text-[10px] opacity-80 mt-0.5">Sensor Trigger</div>
                                        </div>

                                        {/* Step 2 */}
                                        <div className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
                                            simulationStage === 'CAPTURING' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/50' :
                                            ['AI_MEGA', 'AI_SPECIES', 'RESULTS'].includes(simulationStage) ? 'bg-slate-800/80 border-emerald-500/40 text-emerald-400' :
                                            'bg-slate-950/60 border-slate-800 text-slate-500'
                                        }`}>
                                            <div className="flex items-center gap-1.5 font-bold">
                                                <Camera className="w-3.5 h-3.5 shrink-0" />
                                                <span>2. Frame Capture</span>
                                            </div>
                                            <div className="text-[10px] opacity-80 mt-0.5">Shutter & Save</div>
                                        </div>

                                        {/* Step 3 */}
                                        <div className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
                                            simulationStage === 'AI_MEGA' ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-md ring-1 ring-blue-500/50' :
                                            ['AI_SPECIES', 'RESULTS'].includes(simulationStage) ? 'bg-slate-800/80 border-emerald-500/40 text-emerald-400' :
                                            'bg-slate-950/60 border-slate-800 text-slate-500'
                                        }`}>
                                            <div className="flex items-center gap-1.5 font-bold">
                                                <Cpu className="w-3.5 h-3.5 shrink-0" />
                                                <span>3. MegaDetector</span>
                                            </div>
                                            <div className="text-[10px] opacity-80 mt-0.5">Animal Boxes</div>
                                        </div>

                                        {/* Step 4 */}
                                        <div className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
                                            simulationStage === 'AI_SPECIES' ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md ring-1 ring-purple-500/50' :
                                            simulationStage === 'RESULTS' ? 'bg-slate-800/80 border-emerald-500/40 text-emerald-400' :
                                            'bg-slate-950/60 border-slate-800 text-slate-500'
                                        }`}>
                                            <div className="flex items-center gap-1.5 font-bold">
                                                <BrainCircuit className="w-3.5 h-3.5 shrink-0" />
                                                <span>4. SpeciesNet</span>
                                            </div>
                                            <div className="text-[10px] opacity-80 mt-0.5">Taxonomy Classification</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Results Metric Cards */}
                                {activeRecord?.ai_result && (
                                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                            <div className="font-bold text-sm text-white flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                                Verified AI Inference Telemetry
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-400">
                                                ID: CAP-{activeRecord.id}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase">Total Animals</div>
                                                <div className="text-xl font-black text-white mt-0.5">
                                                    {activeRecord.ai_result.animal_count ?? 0}
                                                </div>
                                            </div>
                                            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase">Identified Species</div>
                                                <div className="text-sm font-bold text-emerald-400 mt-0.5 truncate">
                                                    {activeRecord.ai_result.overall_species || 'No Animal'}
                                                </div>
                                            </div>
                                            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase">Species Confidence</div>
                                                <div className="text-sm font-mono font-bold text-white mt-0.5">
                                                    {activeRecord.ai_result.overall_confidence 
                                                        ? `${(activeRecord.ai_result.overall_confidence * 100).toFixed(1)}%` 
                                                        : 'N/A'}
                                                </div>
                                            </div>
                                            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase">Processing State</div>
                                                <div className={`text-xs font-bold mt-0.5 uppercase ${
                                                    activeRecord.ai_result.processing_status === 'COMPLETED' ? 'text-emerald-400' : 'text-red-400'
                                                }`}>
                                                    {activeRecord.ai_result.processing_status}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Incident Candidate Routing Notification */}
                                        {activeRecord.ai_result.detection_event ? (
                                            <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                                                    <div>
                                                        <span className="font-bold text-white">Actionable Wildlife Event Created: </span>
                                                        <span className="font-mono text-emerald-300">{activeRecord.ai_result.detection_event.event_code}</span>
                                                    </div>
                                                </div>
                                                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono rounded font-bold uppercase">
                                                    {activeRecord.ai_result.detection_event.status.replace("_", " ")}
                                                </span>
                                            </div>
                                        ) : activeRecord.ai_result.animal_count === 0 ? (
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
                                                <span>No wildlife identified. Camera detection candidate correctly suppressed.</span>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>

                            {/* Right Panel: Simulation Controls, Console Logs & Capture History */}
                            <div className="w-full lg:w-96 bg-slate-900 flex flex-col border-t lg:border-t-0 shrink-0">
                                
                                {/* Simulation Trigger Deck */}
                                <div className="p-5 border-b border-slate-800 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-emerald-400" />
                                            Simulation Controls
                                        </h3>
                                        <span className="text-[10px] font-mono text-slate-500 uppercase">Station Mode</span>
                                    </div>

                                    {/* Two-Choice Selector: Automatic vs Manual */}
                                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSimulationChoice('AUTOMATIC');
                                                // When switching to AUTOMATIC, if not currently viewing a historical capture, clear manual staged image
                                                if (!selectedHistoricalCapture) {
                                                    setSelectedManualImage(null);
                                                    setSimulationStage('IDLE');
                                                }
                                            }}
                                            disabled={isSubmitting}
                                            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                simulationChoice === 'AUTOMATIC' 
                                                    ? 'bg-emerald-600 text-white shadow' 
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            <BrainCircuit className="w-3.5 h-3.5" />
                                            <span>Automatic</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSimulationChoice('MANUAL');
                                                setSelectedHistoricalCapture(null);
                                                setSimulationStage('IDLE');
                                                // Immediately provide image preview if none selected yet
                                                if (!selectedManualImage && testImages.length > 0) {
                                                    setSelectedManualImage(testImages[0]);
                                                }
                                            }}
                                            disabled={isSubmitting}
                                            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                simulationChoice === 'MANUAL' 
                                                    ? 'bg-emerald-600 text-white shadow' 
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            <span>Select Image</span>
                                        </button>
                                    </div>

                                    {/* Manual Selector Dropdown */}
                                    {simulationChoice === 'MANUAL' && (
                                        <div className="space-y-1.5 animate-in fade-in duration-150">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase">Available Test Image</label>
                                            <select
                                                value={selectedManualImage || (testImages[0] || '')}
                                                onChange={e => {
                                                    const chosen = e.target.value;
                                                    setSelectedManualImage(chosen);
                                                    setSelectedHistoricalCapture(null);
                                                    setSimulationCapture(null);
                                                    setSimulationStage('IDLE');
                                                }}
                                                disabled={isSubmitting}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                                            >
                                                {testImages.map(img => (
                                                    <option key={img} value={img}>{img}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Single Action Simulation Button */}
                                    <button
                                        onClick={startSimulation}
                                        disabled={isSubmitting}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>ANALYSING SURVEILLANCE...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                <span>SIMULATE MOTION & CAPTURE</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Console Telemetry Logs */}
                                <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col h-48 overflow-hidden">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1.5">
                                            <Activity className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Camera Activity Stream</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-slate-600">LIVE FEED</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[11px] select-text">
                                        {timelineLogs.length === 0 ? (
                                            <div className="text-slate-600 italic py-6 text-center text-xs">
                                                Camera standing by. Awaiting motion sensor trigger.
                                            </div>
                                        ) : (
                                            timelineLogs.map((log, idx) => (
                                                <div key={idx} className="flex items-start gap-2 leading-tight">
                                                    <span className="text-slate-600 shrink-0 text-[10px]">[{log.time}]</span>
                                                    <span className={`
                                                        ${log.type === 'error' ? 'text-red-400' : 
                                                          log.type === 'success' ? 'text-emerald-400 font-bold' : 
                                                          log.type === 'sensor' ? 'text-amber-300 font-bold' :
                                                          log.type === 'ai' ? 'text-cyan-300' : 'text-slate-300'}
                                                    `}>{log.msg}</span>
                                                </div>
                                            ))
                                        )}
                                        <div ref={logsEndRef} />
                                    </div>
                                </div>

                                {/* Recent Captures List */}
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                            <List className="w-4 h-4 text-slate-400" />
                                            <span>Recent Captures ({recentCaptures.length})</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                                        {recentCaptures.length === 0 ? (
                                            <div className="text-center py-10 text-slate-500 text-xs italic">
                                                No saved captures for this camera.
                                            </div>
                                        ) : (
                                            recentCaptures.map(cap => {
                                                const isSelected = activeRecord?.id === cap.id;
                                                return (
                                                    <div 
                                                        key={cap.id}
                                                        onClick={() => {
                                                            if (isSubmitting) return;
                                                            // Cancel any lingering simulation id so in-flight responses won't overwrite historical inspect
                                                            activeSimulationIdRef.current = null;
                                                            setSelectedHistoricalCapture(cap);
                                                            setSimulationCapture(null);
                                                            setSelectedManualImage(null);
                                                            setSimulationStage('RESULTS');
                                                        }}
                                                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                                                            isSelected 
                                                                ? 'border-emerald-500 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/40' 
                                                                : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                                                        }`}
                                                    >
                                                        <div className="w-14 h-14 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
                                                            <SafeImage src={cap.image_path} className="w-full h-full object-cover" alt="thumb" showRetry={false} />
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            <div className="text-[10px] font-mono text-slate-500 truncate">
                                                                {new Date(cap.captured_at).toLocaleString()}
                                                            </div>
                                                            <div className="text-xs font-bold text-white truncate mt-0.5">
                                                                {cap.ai_result?.overall_species && cap.ai_result.overall_species !== 'None'
                                                                    ? cap.ai_result.overall_species 
                                                                    : (cap.ai_result?.animal_count === 0 ? 'Clear Observation (No Wildlife)' : 'Camera Capture')}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-mono text-emerald-400">
                                                                    Count: {cap.ai_result?.animal_count ?? 0}
                                                                </span>
                                                                {cap.ai_result?.detection_event && (
                                                                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-mono rounded">
                                                                        INCIDENT
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>
                </div>
            )}

            {/* ADD CAMERA MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <Camera className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">Register New Camera Unit</h3>
                                    <p className="text-xs text-slate-400">Add an optical field camera to monitoring network</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body / Form */}
                        <form onSubmit={handleAddCameraSubmit} className="p-6 space-y-4">
                            {addCameraError && (
                                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
                                    <XCircle className="w-4 h-4 shrink-0" />
                                    <span>{addCameraError}</span>
                                </div>
                            )}

                            {addCameraSuccess && (
                                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>{addCameraSuccess}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Camera Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Kurichiat Sector Alpha"
                                        value={addFormData.camera_name}
                                        onChange={(e) => setAddFormData(prev => ({ ...prev, camera_name: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Camera Code *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. CAM-KUR-003"
                                        value={addFormData.camera_code}
                                        onChange={(e) => setAddFormData(prev => ({ ...prev, camera_code: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs uppercase font-mono focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    Monitoring Station *
                                </label>
                                {user?.role === 'Admin' ? (
                                    <select
                                        value={addFormData.monitoring_station_id}
                                        onChange={(e) => handleStationChange(Number(e.target.value))}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
                                    >
                                        <option value={0} disabled>Select Station...</option>
                                        {stations.map(st => (
                                            <option key={st.id} value={st.id}>
                                                {st.station_name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-between">
                                        <span>{stations.find(s => s.id === user?.station_id)?.station_name || stationName}</span>
                                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">Assigned</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    Location / Sector Description
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Riverbed Crossing Post"
                                    value={addFormData.location_name}
                                    onChange={(e) => setAddFormData(prev => ({ ...prev, location_name: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Latitude (-90 to 90) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        required
                                        placeholder="11.7200"
                                        value={addFormData.latitude}
                                        onChange={(e) => {
                                            setUserManuallyEditedCoords(true);
                                            setAddFormData(prev => ({ ...prev, latitude: e.target.value }));
                                        }}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Longitude (-180 to 180) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        required
                                        placeholder="76.2800"
                                        value={addFormData.longitude}
                                        onChange={(e) => {
                                            setUserManuallyEditedCoords(true);
                                            setAddFormData(prev => ({ ...prev, longitude: e.target.value }));
                                        }}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    Initial Status
                                </label>
                                <select
                                    value={addFormData.status}
                                    onChange={(e) => setAddFormData(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Maintenance">Maintenance</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAddingCamera}
                                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isAddingCamera ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Registering...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Add Camera</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CamerasPage;
