import { API_BASE } from "@/services/api";

/**
 * Normalizes image paths to a fully-qualified URL using the configured backend API_BASE.
 * 
 * Handles:
 * - Paths starting with '/static/...' -> `${API_BASE}/static/...`
 * - Paths starting with 'static/...'  -> `${API_BASE}/static/...`
 * - Already absolute URLs ('http://...', 'https://...') -> preserved untouched
 * - Avoids double-slashes between base URL and path (e.g. `http://...//static/...`)
 * - Gracefully handles null, undefined, and empty string inputs -> returns empty string
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path || typeof path !== "string" || !path.trim()) {
    return "";
  }

  const trimmed = path.trim();

  // If already absolute URL, return as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  // Strip trailing slashes from base URL
  const base = API_BASE.replace(/\/+$/, "");

  // If path is a test image identifier (e.g., 'deer/deer_1.jpg', 'blank.jpg') and not a static upload
  if (!trimmed.startsWith("/static/") && !trimmed.startsWith("static/")) {
    const token = typeof window !== "undefined" ? localStorage.getItem("gaia_token") : "";
    const cleanImage = trimmed.replace(/^\/+/, "");
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : "";
    return `${base}/api/cameras/test-images/preview?image=${encodeURIComponent(cleanImage)}${tokenParam}`;
  }

  // Ensure static path starts with exactly one leading slash
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  return `${base}${cleanPath}`;
}
