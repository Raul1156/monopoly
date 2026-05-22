/**
 * Resolves the backend base URL (without /api) and the SignalR hub URL.
 * Works correctly in both local development (localhost) and remote deployments (EC2).
 *
 * Logic:
 *  - If VITE_API_URL is set and does NOT point to localhost, use it as-is.
 *  - If VITE_API_URL is unset or points to localhost, but the page is loaded from
 *    a remote host, derive the URL from window.location.hostname automatically.
 *  - Otherwise fall back to localhost:5000 for local development.
 */

function isLocalhostUrl(url: string): boolean {
  return url.includes('localhost') || url.includes('127.0.0.1');
}

function getHostname(): string {
  return typeof window !== 'undefined' ? window.location.hostname : 'localhost';
}

function isRemoteHost(): boolean {
  const h = getHostname();
  return h !== 'localhost' && h !== '127.0.0.1';
}

/**
 * Returns the full API base URL, e.g. "http://32.194.172.210:5000/api"
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;

  // Env var is set and is NOT a localhost URL → use it directly
  if (envUrl && !isLocalhostUrl(envUrl)) {
    return envUrl;
  }

  // We're on a remote host but env var is either unset or points to localhost
  if (isRemoteHost()) {
    return `http://${getHostname()}:5000/api`;
  }

  // Local development
  return envUrl || 'http://localhost:5000/api';
}

/**
 * Returns the backend origin URL without /api, e.g. "http://32.194.172.210:5000"
 */
export function getBackendBaseUrl(): string {
  return getApiBaseUrl().replace(/\/?api\/?$/, '');
}

/**
 * Returns the SignalR hub URL, e.g. "http://32.194.172.210:5000/hubs/game"
 */
export function getHubUrl(): string {
  return `${getBackendBaseUrl()}/hubs/game`;
}
