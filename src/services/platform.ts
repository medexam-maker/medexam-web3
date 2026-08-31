import { Capacitor } from '@capacitor/core';

/**
 * Platform Adapter
 * Single abstraction boundary between Web and future Capacitor/mobile behavior.
 */

export function isNativeMobileApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Returns the base URL for API requests.
 * In a web context, this usually returns an empty string (relative paths).
 * In a native mobile context, it will return the configured absolute URL.
 */
export function getApiBaseUrl(): string {
  if (isNativeMobileApp()) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!baseUrl) {
      throw new Error("CRITICAL: VITE_API_BASE_URL is missing or empty in Native Capacitor build.");
    }
    return baseUrl;
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
