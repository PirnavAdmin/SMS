import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSubdomain, setActiveTenantIdentifier, clearActiveTenantIdentifier, detectTenant } from '../utils/subdomain';
import { apiClient } from '../api/client';
import { AlertTriangle, Building2, ShieldAlert } from 'lucide-react';
import { applySchoolBranding } from '../utils/brandingUtils';

export interface TenantInfo {
  id: string;
  identifier: string;
  companyName: string;
  primaryColor: string;
  logoUrl: string;
  isActive: boolean;
}

interface TenantContextType {
  tenant: TenantInfo | null;
  isLoading: boolean;
  isResolved: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
  switchTenant: (identifier: string) => Promise<void>;
  clearTenant: () => void;
}

const defaultTenantContext: TenantContextType = {
  tenant: null,
  isLoading: true,
  isResolved: false,
  error: null,
  refreshTenant: async () => {},
  switchTenant: async () => {},
  clearTenant: () => {}
};

const TenantContext = createContext<TenantContextType>(defaultTenantContext);

export const useTenant = () => useContext(TenantContext);

/**
 * Applies dynamic CSS variables for company branding
 */
export const applyTenantBranding = (primaryColor?: string) => {
  if (typeof document === 'undefined') return;
  const color = primaryColor && primaryColor.startsWith('#') ? primaryColor : '#0284c7';
  
  // Set root CSS properties used across Tailwind and custom UI styles
  document.documentElement.style.setProperty('--tenant-primary', color);
  document.documentElement.style.setProperty('--color-primary', color);
  document.documentElement.style.setProperty('--primary', color);

  // Synchronize school default theme storage key for ThemeContext compatibility
  try {
    const existing = localStorage.getItem('school_default_theme');
    const parsed = existing ? JSON.parse(existing) : {};
    localStorage.setItem(
      'school_default_theme',
      JSON.stringify({ ...parsed, primary: color, updatedAt: new Date().toISOString() })
    );
  } catch {}
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResolved, setIsResolved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadTenant = useCallback(async (customIdentifier?: string) => {
    setIsLoading(true);
    setError(null);

    const identifier = customIdentifier || getSubdomain();

    if (!identifier) {
      setTenant(null);
      setIsResolved(false);
      setIsLoading(false);
      return;
    }

    try {
      // Query tenant discovery endpoint with X-Tenant-ID header
      const data = await apiClient<any>(`/api/tenant/info/${encodeURIComponent(identifier)}`, {
        headers: { 'X-Tenant-ID': identifier }
      });

      if (data && data.isResolved) {
        const customSchoolName = localStorage.getItem('school_name');
        const resolvedName = (customSchoolName && !customSchoolName.toLowerCase().includes('pirnav'))
          ? customSchoolName
          : (data.companyName && !data.companyName.toLowerCase().includes('pirnav') ? data.companyName : (customSchoolName || 'Campus Portal'));

        const customLogo = localStorage.getItem('tenant_school_logo') || localStorage.getItem('school_logo');
        const resolvedLogo = customLogo !== null && customLogo !== undefined
          ? customLogo
          : (data.logoUrl && !data.logoUrl.toLowerCase().includes('pirnav') ? data.logoUrl : '');

        const tenantData: TenantInfo = {
          id: data.id,
          identifier: data.identifier,
          companyName: resolvedName,
          primaryColor: data.primaryColor || '#0284c7',
          logoUrl: resolvedLogo,
          isActive: data.isActive !== false
        };

        setTenant(tenantData);
        setIsResolved(true);

        // 1. Apply Dynamic CSS Primary Color
        applyTenantBranding(tenantData.primaryColor);

        // 2. Set dynamic document title and favicon
        applySchoolBranding(resolvedName, resolvedLogo);
      } else {
        setTenant(null);
        setIsResolved(false);
      }
    } catch (err: any) {
      console.warn('[TenantProvider] Could not load tenant info:', err?.message || err);
      // Fallback: create client representation with cached school name
      const cachedName = localStorage.getItem('school_name') || (identifier === 'default' ? 'Campus Portal' : identifier);
      const cachedLogo = localStorage.getItem('tenant_school_logo') || localStorage.getItem('school_logo') || '';
      const fallbackTenant: TenantInfo = {
        id: identifier,
        identifier: identifier,
        companyName: cachedName,
        primaryColor: '#0284c7',
        logoUrl: cachedLogo,
        isActive: true
      };
      setTenant(fallbackTenant);
      setIsResolved(true);
      applyTenantBranding(fallbackTenant.primaryColor);
      applySchoolBranding(cachedName, cachedLogo);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenant();

    // Listen to inactive tenant event from axios / fetch interceptor
    const handleInactive = (e: any) => {
      const msg = e.detail?.message || 'Company tenant account is currently deactivated.';
      setError(msg);
      setTenant((prev) => (prev ? { ...prev, isActive: false } : null));
    };

    window.addEventListener('tenant_inactive_detected', handleInactive);
    return () => {
      window.removeEventListener('tenant_inactive_detected', handleInactive);
    };
  }, [loadTenant]);

  const switchTenant = async (identifier: string) => {
    setActiveTenantIdentifier(identifier);
    await loadTenant(identifier);
  };

  const clearTenant = () => {
    clearActiveTenantIdentifier();
    setTenant(null);
    setIsResolved(false);
    applyTenantBranding('#0284c7');
  };

  // Guard screen for inactive/deactivated client companies
  if (!isLoading && tenant && !tenant.isActive) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-rose-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Company Account Suspended</h2>
          <p className="text-sm text-slate-300">
            The account for <strong className="text-white">{tenant.companyName}</strong> ({tenant.identifier}) is currently inactive or deactivated.
          </p>
          <div className="p-3 bg-slate-900/60 rounded-xl text-xs text-slate-400 border border-slate-700/50 text-left">
            <p><strong>Tenant ID:</strong> {tenant.id}</p>
            <p><strong>Subdomain:</strong> {tenant.identifier}</p>
            <p><strong>Status:</strong> Inactive / Suspended</p>
          </div>
          <p className="text-xs text-slate-400">
            Please contact your system Super Administrator to re-activate service.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider
      value={{
        tenant,
        isLoading,
        isResolved,
        error,
        refreshTenant: () => loadTenant(),
        switchTenant,
        clearTenant
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};
