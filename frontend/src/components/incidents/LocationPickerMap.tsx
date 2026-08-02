import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, MapPin, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// Fix Leaflet marker icon asset paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  address: string;
  onLocationSelect: (lat: number, lng: number, addressDetails?: { address?: string; village?: string; district?: string; state?: string }) => void;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  latitude,
  longitude,
  address,
  onLocationSelect,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [geoErrorMsg, setGeoErrorMsg] = useState<string | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Default Kerala Center
  const defaultLat = 10.8505;
  const defaultLng = 76.2711;

  const activeLat = latitude || defaultLat;
  const activeLng = longitude || defaultLng;

  // Perform reverse geocoding via Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (!res.ok) throw new Error("Geocoding failed");
      const data = await res.json();

      const addr = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const details = data.address || {};

      const village = details.village || details.suburb || details.town || details.neighbourhood || "";
      const district = details.state_district || details.county || details.city || "Wayanad";
      const state = details.state || "Kerala";

      onLocationSelect(lat, lng, {
        address: addr,
        village,
        district,
        state,
      });
    } catch {
      // Fallback
      onLocationSelect(lat, lng, {
        address: address || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      });
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([activeLat, activeLng], latitude ? 14 : 9);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([activeLat, activeLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
    } else {
      if (markerRef.current) {
        markerRef.current.setLatLng([activeLat, activeLng]);
      }
    }
  }, []);

  // Sync Map view when coordinates change from outside
  useEffect(() => {
    if (mapInstanceRef.current && latitude && longitude) {
      mapInstanceRef.current.setView([latitude, longitude], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      }
    }
  }, [latitude, longitude]);

  // GPS Current Location Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setGeoStatus("loading");
    setGeoErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setGeoStatus("success");
        reverseGeocode(lat, lng);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
        }
      },
      (error) => {
        setGeoStatus("error");
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoErrorMsg("Location permission was denied. Please allow location access in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoErrorMsg("Location information is currently unavailable.");
            break;
          case error.TIMEOUT:
            setGeoErrorMsg("GPS location request timed out.");
            break;
          default:
            setGeoErrorMsg("An unknown error occurred while retrieving GPS location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Geolocation Controls & Success/Error Banners */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-950/10">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">Option 1: Device GPS Location</h4>
          <p className="text-[11px] text-emerald-800/70 font-medium">Acquire exact field coordinates automatically from device sensor</p>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={geoStatus === "loading"}
          className="px-4 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 disabled:opacity-70"
        >
          {geoStatus === "loading" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              Capturing GPS...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 text-amber-300" />
              Use My Current Location
            </>
          )}
        </button>
      </div>

      {geoStatus === "success" && (
        <div className="p-3.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Current Location Captured Successfully! Coordinates & address updated.</span>
        </div>
      )}

      {geoStatus === "error" && geoErrorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{geoErrorMsg}</span>
        </div>
      )}

      {/* Option 2: Leaflet Interactive Map Picker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">Option 2: Choose On Interactive Map</h4>
          <span className="text-[11px] text-emerald-800/70 font-semibold">Click map or drag marker to set location</span>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-emerald-950/15 shadow-sm">
          <div ref={mapContainerRef} className="w-full h-72 z-0" />
          {isReverseGeocoding && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-bold text-emerald-900 border border-emerald-950/10 shadow-md flex items-center gap-2 z-10">
              <Loader2 className="w-3.5 h-3.5 text-emerald-800 animate-spin" />
              Resolving Address...
            </div>
          )}
        </div>
      </div>

      {/* Read-Only Coordinates & Address Display */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1">Latitude (Read-Only)</label>
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              readOnly
              value={latitude ? latitude.toFixed(6) : "Not Selected"}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-emerald-50/60 border border-emerald-950/15 text-emerald-950 font-bold focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1">Longitude (Read-Only)</label>
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              readOnly
              value={longitude ? longitude.toFixed(6) : "Not Selected"}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-emerald-50/60 border border-emerald-950/15 text-emerald-950 font-bold focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1">Detected Address</label>
          <input
            type="text"
            readOnly
            value={address || "Click map or use GPS to populate address"}
            className="w-full px-3 py-2 text-xs rounded-xl bg-emerald-50/60 border border-emerald-950/15 text-emerald-950 font-semibold truncate focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
