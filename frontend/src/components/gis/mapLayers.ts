export type TileProviderKey = "satellite" | "osm";

export interface TileProviderConfig {
  key: TileProviderKey;
  label: string;
  icon: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
}

export const MAP_TILE_PROVIDERS: Record<TileProviderKey, TileProviderConfig> = {
  satellite: {
    key: "satellite",
    label: "Esri Satellite (Terrain)",
    icon: "🛰️",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
    maxZoom: 18,
  },
  osm: {
    key: "osm",
    label: "OpenStreetMap",
    icon: "🗺️",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ["a", "b", "c"],
  },
};

export const DEFAULT_TILE_PROVIDER: TileProviderKey = "satellite";
