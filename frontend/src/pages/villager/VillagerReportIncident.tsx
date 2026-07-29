import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { MapPin, Camera, Phone, Calendar, Clock, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VillagerReportIncident: React.FC = () => {
  const navigate = useNavigate();

  const [animal, setAnimal] = useState("Wild Elephant");
  const [location, setLocation] = useState("");
  const [villageId, setVillageId] = useState<number | "">("");
  const [severity, setSeverity] = useState("High");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("/images/elephant1.jpg");
  const [contactNumber, setContactNumber] = useState("");
  const [dateReported, setDateReported] = useState(new Date().toISOString().split("T")[0]);
  const [timeReported, setTimeReported] = useState(new Date().toTimeString().split(" ")[0].substring(0, 5));

  const [villages, setVillages] = useState<any[]>([]);
  const [isLoadingVillages, setIsLoadingVillages] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    const fetchVillages = async () => {
      try {
        const data = await api.getVillages();
        setVillages(data);
        if (data.length > 0) setVillageId(data[0].id);
      } catch (err) {
        console.error("Failed to load villages", err);
      } finally {
        setIsLoadingVillages(false);
      }
    };
    fetchVillages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!villageId) {
      alert("Please select your village.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.createIncident({
        animal,
        location,
        village_id: Number(villageId),
        severity,
        description,
        photo_url: photoUrl,
        contact_number: contactNumber,
        date_reported: dateReported,
        time_reported: timeReported,
      });

      setSuccessMsg(true);
      setTimeout(() => {
        navigate("/villager/my-reports");
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to submit incident report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white/80 p-6 rounded-3xl border border-emerald-950/10 shadow-sm">
        <h1 className="text-2xl font-bold text-emerald-950 tracking-tight">Report Wildlife Incident</h1>
        <p className="text-xs text-emerald-900/70 mt-1">Directly notify Range Forest Officers & field guards in your sector</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          Incident report submitted successfully! Redirecting to My Reports...
        </div>
      )}

      <form onSubmit={handleSubmit} className="gaia-card p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-2">Animal Type</label>
            <select
              value={animal}
              onChange={(e) => setAnimal(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-sm font-semibold focus:ring-2 focus:ring-emerald-800"
            >
              <option value="Wild Elephant">Wild Elephant</option>
              <option value="Tiger / Leopard">Tiger / Leopard</option>
              <option value="Wild Boar">Wild Boar</option>
              <option value="Bison / Gaur">Bison / Gaur</option>
              <option value="Venomous Snake">Venomous Snake</option>
              <option value="Other Wild Animal">Other Wild Animal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-2">Severity Level</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-sm font-semibold focus:ring-2 focus:ring-emerald-800"
            >
              <option value="Low">Low (Sighting near boundary)</option>
              <option value="Medium">Medium (Animal near agricultural crop)</option>
              <option value="High">High (Animal inside village human settlement)</option>
              <option value="Critical">Critical (Immediate danger to human life / property)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-2">Location / Landmark</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Near Plantation Gate Sector 4"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-sm focus:ring-2 focus:ring-emerald-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-2">Village Sector (Loaded from DB)</label>
            <select
              required
              value={villageId}
              onChange={(e) => setVillageId(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-sm focus:ring-2 focus:ring-emerald-800 font-semibold"
            >
              {isLoadingVillages ? (
                <option>Loading Villages...</option>
              ) : (
                villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.village_name} ({v.district})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1.5">Contact Phone</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="9876543210"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-xs focus:ring-2 focus:ring-emerald-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1.5">Date Sighted</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={dateReported}
                onChange={(e) => setDateReported(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-xs focus:ring-2 focus:ring-emerald-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1.5">Time Sighted</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="time"
                required
                value={timeReported}
                onChange={(e) => setTimeReported(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-xs focus:ring-2 focus:ring-emerald-800"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-2">Description & Movement Behavior</label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe animal count, direction of movement, any crop damage..."
            className="w-full p-4 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-sm focus:ring-2 focus:ring-emerald-800"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-2">Photo URL / Image Reference</label>
          <div className="relative">
            <Camera className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="/images/elephant1.jpg"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-xs focus:ring-2 focus:ring-emerald-800"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold shadow-xl shadow-emerald-950/20 transition-all hover:scale-[1.01]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
              Submitting Incident Report...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-amber-300" />
              Submit Incident Report
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default VillagerReportIncident;
