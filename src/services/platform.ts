/**
 * Platform Adapter
 * Single abstraction boundary between Web and future Capacitor/mobile behavior.
 */

export function isNativeMobileApp(): boolean {
  // Safe check for Capacitor without importing @capacitor/core yet
  const win = window as any;
  if (win?.Capacitor?.isNativePlatform) {
    return win.Capacitor.isNativePlatform();
  }
  return false;
}

/**
 * Returns the base URL for API requests.
 * In a web context, this usually returns an empty string (relative paths).
 * In a native mobile context, it will return the configured absolute URL.
 */
export function getApiBaseUrl(): string {
  if (isNativeMobileApp()) {
    // Return VITE_API_BASE_URL if set, otherwise fallback to production URL
    return import.meta.env.VITE_API_BASE_URL || 'https://medexam.net';
  }
  // For web, use relative URLs (same origin)
  return '';
}

/**
 * Wraps a relative API path with the correct base URL depending on the platform.
 */
export function resolveApiPath(path: string): string {
  const baseUrl = getApiBaseUrl();
  // Ensure we don't double slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Remove trailing slash from base url if present
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBase}${cleanPath}`;
}
