/**
 * Multi-Tenant Subdomain and Tenant Detection Utility
 * Extracts client company tenant identifier from subdomain, query string, or local storage.
 */

// Host prefixes or domains that do not represent a client tenant
const RESERVED_SUBDOMAINS = new Set([
  'localhost',
  '127',
  'www',
  'api',
  'app',
  'portal',
  'admin',
  'superadmin',
  'mail',
  'smtp',
  'ftp',
  'staging',
  'test',
  'dev'
]);

export interface DetectedTenantInfo {
  identifier: string | null;
  source: 'subdomain' | 'query' | 'storage' | 'none';
}

/**
 * Detects the active tenant identifier based on:
 * 1. URL search parameter (?tenant=xyz or ?company=xyz) - highest priority for dev/testing
 * 2. Hostname subdomain (e.g., acme.sms.portal, school1.mysas.com, demo.localhost)
 * 3. LocalStorage cached tenant identifier
 */
export const detectTenant = (): DetectedTenantInfo => {
  if (typeof window === 'undefined') {
    return { identifier: null, source: 'none' };
  }

  // 1. Query parameter override (e.g. http://localhost:5173/?tenant=alpha)
  try {
    const params = new URLSearchParams(window.location.search);
    const queryTenant = params.get('tenant') || params.get('company') || params.get('subdomain');
    if (queryTenant && queryTenant.trim()) {
      const clean = queryTenant.trim().toLowerCase();
      localStorage.setItem('active_tenant_identifier', clean);
      return { identifier: clean, source: 'query' };
    }
  } catch {}

  // 2. Subdomain extraction from window.location.hostname
  const hostname = window.location.hostname.toLowerCase();
  
  // IP address check (e.g., 127.0.0.1, 192.168.1.10)
  const isIpAddress = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);

  if (!isIpAddress) {
    const parts = hostname.split('.');

    // Case: subdomain.localhost (e.g., "school1.localhost")
    if (parts.length === 2 && parts[1] === 'localhost') {
      const sub = parts[0];
      if (!RESERVED_SUBDOMAINS.has(sub)) {
        return { identifier: sub, source: 'subdomain' };
      }
    }

    // Case: subdomain.domain.com or subdomain.sms.portal
    if (parts.length >= 3) {
      const sub = parts[0];
      if (!RESERVED_SUBDOMAINS.has(sub)) {
        return { identifier: sub, source: 'subdomain' };
      }
    }
  }

  // 3. Cached identifier from localStorage
  const stored = localStorage.getItem('active_tenant_identifier');
  if (stored && stored.trim() && stored !== 'null' && stored !== 'undefined') {
    return { identifier: stored.trim().toLowerCase(), source: 'storage' };
  }

  return { identifier: null, source: 'none' };
};

/**
 * Quick accessor for current tenant identifier slug
 */
export const getSubdomain = (): string | null => {
  return detectTenant().identifier;
};

/**
 * Sets or overrides the active tenant identifier manually
 */
export const setActiveTenantIdentifier = (identifier: string) => {
  if (!identifier) {
    localStorage.removeItem('active_tenant_identifier');
  } else {
    localStorage.setItem('active_tenant_identifier', identifier.trim().toLowerCase());
  }
};

/**
 * Clears the active tenant override
 */
export const clearActiveTenantIdentifier = () => {
  localStorage.removeItem('active_tenant_identifier');
};
