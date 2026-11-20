import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ApplicationDraft,
  fetchActiveDraftApi,
  fetchAllDraftsApi,
  saveDraftApi,
  deleteDraftApi,
  deleteActiveDraftApi
} from '../api/applicationDrafts';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseApplicationDraftOptions<T> {
  formType: string;
  draftKey?: string;
  debounceMs?: number;
  isDataEmpty?: (data: T) => boolean;
  onDraftRestored?: (draft: ApplicationDraft<T>) => void;
  branch?: string;
  academicYear?: string;
}

export function useApplicationDraft<T extends Record<string, any>>({
  formType,
  draftKey = 'default',
  debounceMs = 1200,
  isDataEmpty,
  onDraftRestored,
  branch,
  academicYear
}: UseApplicationDraftOptions<T>) {
  const [activeDraft, setActiveDraft] = useState<ApplicationDraft<T> | null>(null);
  const [allDrafts, setAllDrafts] = useState<ApplicationDraft<T>[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState<boolean>(true);
  const [draftBannerVisible, setDraftBannerVisible] = useState<boolean>(false);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);

  const localStorageKey = `app_draft_${formType}_${draftKey}`;
  const latestPendingDataRef = useRef<{ formData: T; currentStep?: number; applicantName?: string } | null>(null);

  // References to keep track of current state without unnecessary re-renders
  const activeDraftRef = useRef<ApplicationDraft<T> | null>(null);
  activeDraftRef.current = activeDraft;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestoringRef = useRef<boolean>(false);
  const lastSavedJsonRef = useRef<string>('');

  // Synchronously restore from localStorage on initial mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(localStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.formData && hasMeaningfulData(parsed.formData)) {
          setActiveDraft(parsed);
          setLastSavedAt(new Date(parsed.updatedAt || new Date()));
          if (onDraftRestored && !isRestoringRef.current) {
            isRestoringRef.current = true;
            lastSavedJsonRef.current = JSON.stringify(parsed.formData);
            onDraftRestored(parsed);
            setIsDraftRestored(true);
            setTimeout(() => {
              isRestoringRef.current = false;
            }, 300);
          }
        }
      }
    } catch {}
  }, [localStorageKey]);

  // Helper to check if payload has meaningful data to draft
  const hasMeaningfulData = useCallback(
    (data: T): boolean => {
      if (!data) return false;
      if (isDataEmpty) return !isDataEmpty(data);

      return Object.entries(data).some(([key, val]) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'string') {
          const trimmed = val.trim();
          return trimmed !== '' && !['select', 'unassigned', 'day scholar', 'cash', 'none'].includes(trimmed.toLowerCase());
        }
        if (typeof val === 'number') return val > 0;
        if (typeof val === 'boolean') return val === true;
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'object') return Object.keys(val).length > 0;
        return false;
      });
    },
    [isDataEmpty]
  );

  // Load active draft and pending drafts on mount from server
  const loadDraftsFromServer = useCallback(async () => {
    setIsLoadingDraft(true);
    try {
      const [activeRes, allRes] = await Promise.all([
        fetchActiveDraftApi<T>(formType, draftKey).catch(() => ({ success: false, data: null })),
        fetchAllDraftsApi<T>(formType).catch(() => ({ success: false, data: [] }))
      ]);

      if (allRes && allRes.success && Array.isArray(allRes.data)) {
        setAllDrafts(allRes.data);
      }

      if (activeRes && activeRes.success && activeRes.data) {
        const draft = activeRes.data;
        setActiveDraft(draft);
        setLastSavedAt(new Date(draft.updatedAt || draft.createdAt));
        setSaveStatus('saved');
        setDraftBannerVisible(true);

        if (draft.formData) {
          isRestoringRef.current = true;
          lastSavedJsonRef.current = JSON.stringify(draft.formData);
          if (onDraftRestored) {
            onDraftRestored(draft);
          }
          setIsDraftRestored(true);
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 300);
        }
      }
    } catch (err) {
      console.warn(`[Draft] Failed to load draft for ${formType}:`, err);
    } finally {
      setIsLoadingDraft(false);
    }
  }, [formType, draftKey, onDraftRestored]);

  useEffect(() => {
    loadDraftsFromServer();
  }, [loadDraftsFromServer]);

  // Save draft to server
  const saveDraft = useCallback(
    async (
      formData: T,
      options?: {
        currentStep?: number;
        applicantName?: string;
        immediate?: boolean;
        manual?: boolean;
      }
    ): Promise<ApplicationDraft<T> | null> => {
      if (isRestoringRef.current) return null;

      if (!hasMeaningfulData(formData)) {
        return null;
      }

      const jsonString = JSON.stringify(formData);
      if (!options?.manual && jsonString === lastSavedJsonRef.current) {
        // Nothing changed since last save
        return activeDraftRef.current;
      }

      setSaveStatus('saving');

      try {
        const payload = {
          id: activeDraftRef.current?.id,
          formType,
          draftKey,
          applicantName: options?.applicantName || activeDraftRef.current?.applicantName,
          branch,
          academicYear,
          currentStep: options?.currentStep ?? activeDraftRef.current?.currentStep ?? 1,
          formData
        };

        const res = await saveDraftApi<T>(payload);
        if (res && res.success && res.data) {
          setActiveDraft(res.data);
          lastSavedJsonRef.current = jsonString;
          setLastSavedAt(new Date(res.data.updatedAt || new Date()));
          setSaveStatus('saved');
          setDraftBannerVisible(true);

          // Update in allDrafts list
          setAllDrafts(prev => {
            const idx = prev.findIndex(d => d.id === res.data.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = res.data;
              return updated;
            }
            return [res.data, ...prev];
          });

          return res.data;
        } else {
          setSaveStatus('error');
          return null;
        }
      } catch (err) {
        console.error(`[Draft] Error saving draft for ${formType}:`, err);
        setSaveStatus('error');
        return null;
      }
    },
    [formType, draftKey, branch, academicYear, hasMeaningfulData]
  );

  // Trigger debounced auto-save on form data change
  const triggerAutoSave = useCallback(
    (formData: T, currentStep?: number, applicantName?: string) => {
      if (isRestoringRef.current) return;
      if (!hasMeaningfulData(formData)) return;

      latestPendingDataRef.current = { formData, currentStep, applicantName };

      // Immediate synchronous persistence to localStorage so data is NEVER lost when switching screens
      try {
        localStorage.setItem(
          localStorageKey,
          JSON.stringify({
            id: activeDraftRef.current?.id,
            formType,
            draftKey,
            applicantName,
            currentStep,
            formData,
            updatedAt: new Date().toISOString()
          })
        );
      } catch {}

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        saveDraft(formData, { currentStep, applicantName });
      }, debounceMs);
    },
    [debounceMs, hasMeaningfulData, localStorageKey, saveDraft, formType, draftKey]
  );

  // Cleanup auto-save timer and flush pending data on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (latestPendingDataRef.current && hasMeaningfulData(latestPendingDataRef.current.formData)) {
        try {
          localStorage.setItem(
            localStorageKey,
            JSON.stringify({
              id: activeDraftRef.current?.id,
              formType,
              draftKey,
              applicantName: latestPendingDataRef.current.applicantName,
              currentStep: latestPendingDataRef.current.currentStep,
              formData: latestPendingDataRef.current.formData,
              updatedAt: new Date().toISOString()
            })
          );
        } catch {}
        saveDraft(latestPendingDataRef.current.formData, {
          currentStep: latestPendingDataRef.current.currentStep,
          applicantName: latestPendingDataRef.current.applicantName,
          immediate: true
        }).catch(() => {});
      }
    };
  }, [hasMeaningfulData, localStorageKey, saveDraft, formType, draftKey]);

  // Discard draft completely from database and local storage
  const discardDraft = useCallback(
    async (draftId?: number): Promise<boolean> => {
      const targetId = draftId || activeDraftRef.current?.id;
      setSaveStatus('idle');
      latestPendingDataRef.current = null;

      try {
        localStorage.removeItem(localStorageKey);
      } catch {}

      try {
        if (targetId) {
          await deleteDraftApi(targetId);
        } else {
          await deleteActiveDraftApi(formType, draftKey);
        }

        setActiveDraft(null);
        setDraftBannerVisible(false);
        setIsDraftRestored(false);
        lastSavedJsonRef.current = '';

        setAllDrafts(prev => prev.filter(d => (targetId ? d.id !== targetId : true)));
        return true;
      } catch (err) {
        console.error(`[Draft] Failed to discard draft:`, err);
        return false;
      }
    },
    [formType, draftKey, localStorageKey]
  );

  // Clear draft after successful submission
  const completeDraft = useCallback(
    async (draftId?: number) => {
      const targetId = draftId || activeDraftRef.current?.id;
      latestPendingDataRef.current = null;

      try {
        localStorage.removeItem(localStorageKey);
      } catch {}

      if (targetId) {
        try {
          await deleteDraftApi(targetId);
        } catch {}
      } else {
        try {
          await deleteActiveDraftApi(formType, draftKey);
        } catch {}
      }
      setActiveDraft(null);
      setDraftBannerVisible(false);
      setIsDraftRestored(false);
      lastSavedJsonRef.current = '';
    },
    [formType, draftKey, localStorageKey]
  );

  return {
    activeDraft,
    allDrafts,
    saveStatus,
    lastSavedAt,
    isLoadingDraft,
    draftBannerVisible,
    isDraftRestored,
    setDraftBannerVisible,
    saveDraft,
    triggerAutoSave,
    discardDraft,
    completeDraft,
    refreshDrafts: loadDraftsFromServer
  };
}
