import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import type { AnimalSpecies, Incident } from "@/types";
import { LocationPickerMap } from "./LocationPickerMap";
import {
  Upload,
  X,
  CheckCircle2,
  Calendar,
  Clock,
  CloudSun,
  ShieldAlert,
  Loader2,
  ArrowRight,
  FileText,
} from "lucide-react";

interface CreateIncidentFormProps {
  onSuccessRedirectPath: string;
}

export const CreateIncidentForm: React.FC<CreateIncidentFormProps> = ({
  onSuccessRedirectPath,
}) => {
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [speciesList, setSpeciesList] = useState<AnimalSpecies[]>([]);
  const [loadingSpecies, setLoadingSpecies] = useState(true);

  // Section 1: Incident Info
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentCategory, setIncidentCategory] = useState("Wildlife Sighting");
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<number | string>("");
  const [customAnimalType, setCustomAnimalType] = useState("");
  const [severity, setSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [description, setDescription] = useState("");

  // Section 2: Location
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [villageName, setVillageName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [stateName, setStateName] = useState("");

  // Section 3: Additional Details
  const now = new Date();
  const [dateReported, setDateReported] = useState(now.toISOString().split("T")[0]);
  const [timeReported, setTimeReported] = useState(now.toTimeString().slice(0, 5));
  const [weather, setWeather] = useState("Sunny");
  const [peopleInjured, setPeopleInjured] = useState(false);
  const [livestockDamage, setLivestockDamage] = useState(false);
  const [propertyDamage, setPropertyDamage] = useState(false);
  const [cropDamage, setCropDamage] = useState(false);

  // Section 4: Image Upload
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Form Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success Screen State
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        setLoadingSpecies(true);
        const data = await api.getAnimalSpecies(true); // active only
        setSpeciesList(data);
        if (data.length > 0) {
          setSelectedSpeciesId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load species for incident form", err);
      } finally {
        setLoadingSpecies(false);
      }
    };
    fetchSpecies();
  }, []);

  const handleLocationSelect = (
    lat: number,
    lng: number,
    details?: { address?: string; village?: string; district?: string; state?: string }
  ) => {
    setLatitude(lat);
    setLongitude(lng);
    if (details?.address) setAddress(details.address);
    if (details?.village) setVillageName(details.village);
    if (details?.district) setDistrictName(details.district);
    if (details?.state) setStateName(details.state);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (imageFiles.length + files.length > 5) {
      setErrorMessage("Maximum 5 images allowed per incident report.");
      return;
    }

    const updatedFiles = [...imageFiles, ...files].slice(0, 5);
    setImageFiles(updatedFiles);

    const newPreviews = updatedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
    setErrorMessage(null);
  };

  const removeImage = (index: number) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(updatedFiles);
    setImagePreviews(updatedFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage("Please enter a detailed description of the incident.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Upload images if any selected
      let uploadedUrls: string[] = [];
      if (imageFiles.length > 0) {
        setIsUploadingImages(true);
        const formData = new FormData();
        imageFiles.forEach((file) => formData.append("files", file));
        uploadedUrls = await api.uploadIncidentImages(formData);
        setIsUploadingImages(false);
      }

      // 2. Resolve Animal Name
      let animalNameStr = "Unknown";
      let speciesIdNum: number | undefined = undefined;

      if (selectedSpeciesId && selectedSpeciesId !== "other") {
        const spec = speciesList.find((s) => s.id === Number(selectedSpeciesId));
        if (spec) {
          animalNameStr = spec.animal_name;
          speciesIdNum = spec.id;
        }
      } else if (customAnimalType.trim()) {
        animalNameStr = customAnimalType.trim();
      }

      const payload = {
        incident_title: incidentTitle.trim() || `${animalNameStr} Sighting at ${address || "Sector Range"}`,
        incident_category: incidentCategory,
        animal_species_id: speciesIdNum,
        animal_type: animalNameStr,
        severity,
        description: description.trim(),
        latitude,
        longitude,
        location: address || `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`,
        address,
        weather,
        people_injured: peopleInjured,
        livestock_damage: livestockDamage,
        property_damage: propertyDamage,
        crop_damage: cropDamage,
        date_reported: dateReported,
        time_reported: timeReported,
        images: uploadedUrls,
      };

      const result = await api.createIncident(payload);
      setSubmittedIncident(result);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit incident report.");
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
    }
  };

  // SUCCESS SCREEN
  if (submittedIncident) {
    return (
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-8 sm:p-12 text-center space-y-6 shadow-xl animate-in fade-in zoom-in duration-300 max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto border-4 border-emerald-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-700" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
            Status: {submittedIncident.incident_status || "Pending Review"}
          </span>
          <h2 className="text-2xl font-black text-emerald-950 tracking-tight">Incident Submitted Successfully</h2>
          <p className="text-xs text-emerald-800/70 font-semibold">
            Your wildlife incident report has been dispatched to Gaia Operations Command.
          </p>
        </div>

        {/* Reference ID Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-950/10 inline-block space-y-1">
          <span className="text-[10px] font-black text-emerald-800/70 uppercase tracking-widest block">Reference Tracking ID</span>
          <span className="text-2xl font-black text-emerald-950 font-mono tracking-wider block">{submittedIncident.reference_id}</span>
        </div>

        <div className="text-xs text-left bg-emerald-50/50 p-4 rounded-2xl border border-emerald-950/5 space-y-2">
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-emerald-800/70 font-semibold">Animal Species:</span>
            <span className="font-bold text-emerald-950">{submittedIncident.animal_species_name || submittedIncident.animal_type}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-emerald-800/70 font-semibold">Category & Severity:</span>
            <span className="font-bold text-emerald-950">{submittedIncident.incident_category} ({submittedIncident.severity})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-800/70 font-semibold">Field Location:</span>
            <span className="font-bold text-emerald-950 truncate max-w-xs">{submittedIncident.location}</span>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setSubmittedIncident(null);
              setDescription("");
              setImageFiles([]);
              setImagePreviews([]);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs border border-gray-200 transition-all"
          >
            Report Another Incident
          </button>
          <button
            onClick={() => navigate(onSuccessRedirectPath)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            View My Reports <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto" autoComplete="off">
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 text-xl font-bold">×</button>
        </div>
      )}

      {/* SECTION 1: Incident Information */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-emerald-950/10 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-sm shrink-0">
            1
          </div>
          <div>
            <h3 className="text-base font-extrabold text-emerald-950">Section 1: Incident Information</h3>
            <p className="text-xs text-emerald-800/70 font-medium">Specify wildlife sighting type, animal detected, and severity level</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Incident Title</label>
            <input
              type="text"
              placeholder="e.g. Lone Wild Elephant Herd Sighting near Farm"
              value={incidentTitle}
              onChange={(e) => setIncidentTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Incident Category *</label>
            <select
              value={incidentCategory}
              onChange={(e) => setIncidentCategory(e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
            >
              <option value="Wildlife Sighting">Wildlife Sighting</option>
              <option value="Human Wildlife Conflict">Human Wildlife Conflict</option>
              <option value="Crop Damage">Crop Damage</option>
              <option value="Property Damage">Property Damage</option>
              <option value="Animal Attack">Animal Attack</option>
              <option value="Road Crossing">Road Crossing</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Animal Detected *</label>
            {loadingSpecies ? (
              <div className="py-2 text-xs text-emerald-800/70 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-800" />
                Loading species database...
              </div>
            ) : (
              <select
                value={selectedSpeciesId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "other") {
                    setSelectedSpeciesId("other");
                  } else {
                    setSelectedSpeciesId(Number(val));
                  }
                }}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-bold"
              >
                {speciesList.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.animal_name} ({spec.scientific_name || spec.category})
                  </option>
                ))}
                <option value="other">Other / Custom Animal</option>
              </select>
            )}

            {selectedSpeciesId === "other" && (
              <input
                type="text"
                placeholder="Specify Custom Animal Name"
                value={customAnimalType}
                onChange={(e) => setCustomAnimalType(e.target.value)}
                className="w-full mt-2 px-4 py-2 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Severity Level *</label>
            <div className="grid grid-cols-4 gap-2">
              {(["Low", "Medium", "High", "Critical"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSeverity(lvl)}
                  className={`py-2 rounded-xl text-xs font-black transition-all border ${
                    severity === lvl
                      ? lvl === "Critical"
                        ? "bg-red-600 text-white border-red-700 shadow-md"
                        : lvl === "High"
                        ? "bg-amber-500 text-white border-amber-600 shadow-md"
                        : lvl === "Medium"
                        ? "bg-yellow-500 text-white border-yellow-600 shadow-md"
                        : "bg-emerald-700 text-white border-emerald-800 shadow-md"
                      : "bg-emerald-50/50 text-emerald-950 border-emerald-950/10 hover:bg-emerald-100"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Incident Description *</label>
          <textarea
            rows={6}
            required
            placeholder="Provide comprehensive details of the sighting or conflict (e.g. number of animals, movement direction, proximity to residential structures, actions taken)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[180px] p-4 text-xs rounded-2xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-medium leading-relaxed"
          />
        </div>
      </div>

      {/* SECTION 2: Location (Leaflet & GPS) */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 border-b border-emerald-950/10 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-sm shrink-0">
            2
          </div>
          <div>
            <h3 className="text-base font-extrabold text-emerald-950">Section 2: Incident Field Location</h3>
            <p className="text-xs text-emerald-800/70 font-medium">Use GPS geolocation or select exact coordinates on interactive map</p>
          </div>
        </div>

        <LocationPickerMap
          latitude={latitude}
          longitude={longitude}
          address={address}
          onLocationSelect={handleLocationSelect}
        />

        {(villageName || districtName || stateName) && (
          <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-950/10 text-xs flex flex-wrap items-center gap-2 text-emerald-950 font-bold">
            <span className="text-emerald-800/70 font-semibold">Location Hierarchy:</span>
            {villageName && <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900">Village: {villageName}</span>}
            {districtName && <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900">District: {districtName}</span>}
            {stateName && <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900">State: {stateName}</span>}
          </div>
        )}
      </div>

      {/* SECTION 3: Additional Details */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-emerald-950/10 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-sm shrink-0">
            3
          </div>
          <div>
            <h3 className="text-base font-extrabold text-emerald-950">Section 3: Additional Field Details</h3>
            <p className="text-xs text-emerald-800/70 font-medium">Record date, time, weather, and impact flags</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Date Reported</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={dateReported}
                onChange={(e) => setDateReported(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none text-emerald-950 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Time Reported</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="time"
                value={timeReported}
                onChange={(e) => setTimeReported(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none text-emerald-950 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Weather Condition</label>
            <div className="relative">
              <CloudSun className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none text-emerald-950 font-bold"
              >
                <option value="Sunny">Sunny</option>
                <option value="Rainy">Rainy</option>
                <option value="Cloudy">Cloudy</option>
                <option value="Foggy">Foggy</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>
        </div>

        {/* Impact Toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-950/10 flex flex-col justify-between space-y-2">
            <span className="text-xs font-bold text-emerald-950">People Injured?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPeopleInjured(true)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${peopleInjured ? "bg-red-600 text-white" : "bg-white text-emerald-950 border border-emerald-950/10"}`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setPeopleInjured(false)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${!peopleInjured ? "bg-emerald-900 text-white" : "bg-white text-emerald-950 border border-emerald-950/10"}`}
              >
                No
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-950/10 flex flex-col justify-between space-y-2">
            <span className="text-xs font-bold text-emerald-950">Livestock Affected?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLivestockDamage(true)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${livestockDamage ? "bg-amber-600 text-white" : "bg-white text-emerald-950 border border-emerald-950/10"}`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setLivestockDamage(false)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${!livestockDamage ? "bg-emerald-900 text-white" : "bg-white text-emerald-950 border border-emerald-950/10"}`}
              >
                No
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-950/10 flex flex-col justify-between space-y-2">
            <span className="text-xs font-bold text-emerald-950">Property Damage?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPropertyDamage(true)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${propertyDamage ? "bg-amber-600 text-white" : "bg-white text-emerald-950 border border-emerald-950/10"}`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setPropertyDamage(false)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${!propertyDamage ? "bg-emerald-900 text-white" : "bg-white text-emerald-950 border border-emerald-950/10"}`}
              >
                No
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-950/10 flex flex-col justify-between space-y-2">
            <span className="text-xs font-bold text-emerald-950">Crop Damage?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCropDamage(true)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${cropDamage ? "bg-amber-600 text-white" : "bg-white text-emerald-950 border border-emerald-950/10"}`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setCropDamage(false)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${!cropDamage ? "bg-emerald-900 text-white" : "bg-white text-emerald-950 border border-emerald-950/10"}`}
              >
                No
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Image Upload */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 border-b border-emerald-950/10 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-sm shrink-0">
            4
          </div>
          <div>
            <h3 className="text-base font-extrabold text-emerald-950">Section 4: Incident Photos (Up to 5)</h3>
            <p className="text-xs text-emerald-800/70 font-medium">Attach field photographs of wildlife, animal tracks, or damage</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border border-emerald-950/10 shadow-xs group">
              <img src={preview} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {imageFiles.length < 5 && (
            <div>
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl bg-emerald-50/60 hover:bg-emerald-100 border-2 border-dashed border-emerald-950/20 text-emerald-900 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Upload className="w-5 h-5 text-emerald-700" />
                <span className="text-[10px] font-bold">Add Photo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: Submit Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(onSuccessRedirectPath)}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs border border-gray-200 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploadingImages}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
        >
          {isSubmitting || isUploadingImages ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              Submitting Incident...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-amber-300" />
              Submit Incident Report
            </>
          )}
        </button>
      </div>
    </form>
  );
};
