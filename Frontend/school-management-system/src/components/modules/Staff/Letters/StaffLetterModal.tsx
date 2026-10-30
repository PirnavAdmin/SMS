import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  Award,
  CheckCircle2,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Edit3,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  Building2,
  User,
  Sparkles,
  Search,
  ChevronDown,
  Check,
  Upload,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { Staff } from '../../../../types';
import { StaffLetterPayload, StaffLetterType, GeneratedStaffLetterRecord } from '../../../../types/staffLetter';
import { useData } from '../../../../context/DataContext';
import { useToast } from '../../../../context/ToastContext';
import { PrintableStaffLetter } from './PrintableStaffLetter';
import {
  calculateSalaryBreakdown,
  getDefaultLetterPayload,
  getEmptyLetterPayload,
  getStaffRealAddress,
  saveStaffLetterRecord,
  getStoredStaffLetters,
  DEFAULT_OFFER_TERMS
} from '../../../../utils/staffLetterTemplates';
import {
  fetchGlobalLetterSettingsApi,
  saveGlobalLetterSettingsApi,
  createOrSaveStaffLetterApi,
  fetchStaffLettersApi
} from '../../../../api/staffLetters';
import { validateSearchQuery } from '../../../../utils/validation';

interface StaffLetterModalProps {
  staff?: Staff;
  initialType?: StaffLetterType;
  isOpen: boolean;
  onClose: () => void;
  existingRecord?: GeneratedStaffLetterRecord;
  readOnly?: boolean;
  onNavigate?: (module: string) => void;
  existingLetters?: GeneratedStaffLetterRecord[];
}

export const StaffLetterModal: React.FC<StaffLetterModalProps> = ({
  staff,
  initialType = 'offer',
  isOpen,
  onClose,
  existingRecord,
  readOnly = false,
  onNavigate,
  existingLetters,
}) => {
  const { staff: allStaff = [], schoolProfile, updateStaff } = useData();
  const { addToast } = useToast();

  const effectiveStaffList = useMemo(() => {
    if (allStaff && allStaff.length > 0) return allStaff;
    return [staff].filter(Boolean) as Staff[];
  }, [allStaff, staff]);

  const [currentStaff, setCurrentStaff] = useState<Staff | undefined>(() => {
    if (staff) return staff;
    if (existingRecord) {
      return (allStaff && allStaff.length > 0 ? allStaff : []).find(
        (s) => s.id === existingRecord.staffId || s.empId === existingRecord.staffEmpId
      );
    }
    return undefined;
  });
  const [staffCategoryFilter, setStaffCategoryFilter] = useState<'all' | 'teaching' | 'non-teaching'>('all');
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');
  const [staffSearchError, setStaffSearchError] = useState<string | undefined>(undefined);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  const isCustomSignatureModifiedRef = useRef(false);

  useEffect(() => {
    if (staff) {
      if (staff.id !== currentStaff?.id || staff.empId !== currentStaff?.empId) {
        setCurrentStaff(staff);
      }
    }
  }, [staff]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target as Node)) {
        setIsEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isTeaching = (s: Staff) => {
    const cat = (s.employeeCategory || (s as any).category || (s as any).staffCategory || '').toLowerCase();
    const role = (s.role || '').toLowerCase();
    const des = (s.designation || '').toLowerCase();
    const dept = (s.department || '').toLowerCase();

    if (cat.includes('non-teaching') || cat.includes('non teaching')) return false;
    if (
      role.includes('driver') ||
      role.includes('conductor') ||
      role.includes('attendant') ||
      role.includes('security') ||
      role.includes('peon') ||
      role.includes('accountant') ||
      des.includes('driver') ||
      des.includes('conductor') ||
      des.includes('attendant') ||
      des.includes('security') ||
      des.includes('peon') ||
      des.includes('accountant')
    ) {
      return false;
    }

    return (
      cat.includes('teach') ||
      role === 'teacher' ||
      role === 'principal' ||
      role === 'vice principal' ||
      role === 'vice-principal' ||
      role === 'hod' ||
      des.includes('teacher') ||
      des.includes('principal') ||
      des.includes('faculty') ||
      des.includes('lecturer') ||
      des.includes('instructor') ||
      des.includes('professor') ||
      dept.includes('academic') ||
      dept.includes('teach')
    );
  };

  const [issuedLetters, setIssuedLetters] = useState<GeneratedStaffLetterRecord[]>(() => {
    if (existingLetters && existingLetters.length > 0) return existingLetters;
    return getStoredStaffLetters();
  });

  useEffect(() => {
    if (existingLetters && existingLetters.length > 0) {
      setIssuedLetters(existingLetters);
    }
  }, [existingLetters]);

  useEffect(() => {
    let isMounted = true;
    const handleLettersUpdated = () => {
      setIssuedLetters(getStoredStaffLetters());
    };
    window.addEventListener('staff_letters_updated', handleLettersUpdated);

    fetchStaffLettersApi()
      .then((res) => {
        if (isMounted && res?.data && Array.isArray(res.data)) {
          setIssuedLetters(res.data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      window.removeEventListener('staff_letters_updated', handleLettersUpdated);
    };
  }, []);

  const isLetterReleasedForStaff = useCallback(
    (s: Staff, type: StaffLetterType) => {
      // When viewing/editing an existing record, don't filter out its own target staff
      if (
        existingRecord &&
        (String(s.id) === String(existingRecord.staffId) ||
          String(s.empId) === String(existingRecord.staffEmpId))
      ) {
        return false;
      }

      const sId = String(s.id || '').trim().toLowerCase();
      const sEmpId = String(s.empId || '').trim().toLowerCase();
      const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();

      // Check letters registry
      const hasRegistryLetter = issuedLetters.some((l) => {
        const lType = (l.letterType || '').toLowerCase();
        if (lType !== type.toLowerCase()) return false;
        const lStatus = (l.status || '').toLowerCase();
        if (lStatus && lStatus !== 'issued') return false;

        const lStaffId = String(l.staffId || '').trim().toLowerCase();
        const lStaffEmpId = String(l.staffEmpId || '').trim().toLowerCase();
        const lStaffName = String(l.staffName || '').trim().toLowerCase();

        const matchesId = sId && (lStaffId === sId || lStaffEmpId === sId);
        const matchesEmpId = sEmpId && (lStaffId === sEmpId || lStaffEmpId === sEmpId);
        const matchesName = sFullName && lStaffName && sFullName === lStaffName && sFullName.length > 2;

        return matchesId || matchesEmpId || matchesName;
      });

      if (hasRegistryLetter) return true;

      // Check staff documents array if present
      if (s.documents && Array.isArray(s.documents)) {
        if (type === 'offer') {
          const hasOfferDoc = s.documents.some((d) =>
            d.type === 'Appointment Letter' ||
            (d.title && d.title.toLowerCase().includes('offer'))
          );
          if (hasOfferDoc) return true;
        } else if (type === 'relieving') {
          const hasRelievingDoc = s.documents.some((d) =>
            d.title && d.title.toLowerCase().includes('relieving')
          );
          if (hasRelievingDoc) return true;
        }
      }

      return false;
    },
    [issuedLetters, existingRecord]
  );

  const getGlobalSignature = () => {
    return (schoolProfile as any)?.signature || (schoolProfile as any)?.principalSignature || '';
  };

  const [activeType, setActiveType] = useState<StaffLetterType>(
    existingRecord ? existingRecord.letterType : initialType
  );
  const [activeView, setActiveView] = useState<'preview' | 'edit'>(existingRecord || readOnly ? 'preview' : 'edit');

  const [payload, setPayload] = useState<StaffLetterPayload>(() => {
    const globalSig = getGlobalSignature();
    if (existingRecord) {
      const pl = { ...existingRecord.payload };
      if (!pl.signatureImageUrl && globalSig) pl.signatureImageUrl = globalSig;
      return pl;
    }
    if (currentStaff || staff) {
      const defaultPl = getDefaultLetterPayload(initialType, currentStaff || staff, schoolProfile);
      if (!defaultPl.signatureImageUrl && globalSig) defaultPl.signatureImageUrl = globalSig;
      return defaultPl;
    }
    const emptyPl = getEmptyLetterPayload(initialType, schoolProfile);
    if (!emptyPl.signatureImageUrl && globalSig) emptyPl.signatureImageUrl = globalSig;
    return emptyPl;
  });

  // Filter out employees who already have a released letter of the currently active type
  const eligibleStaffList = useMemo(() => {
    return effectiveStaffList.filter((s) => {
      if (activeType === 'offer' && isLetterReleasedForStaff(s, 'offer')) return false;
      if (activeType === 'relieving' && isLetterReleasedForStaff(s, 'relieving')) return false;
      return true;
    });
  }, [effectiveStaffList, activeType, isLetterReleasedForStaff]);

  const filteredStaffList = useMemo(() => {
    if (staffSearchError) return [];
    return eligibleStaffList.filter((s) => {
      if (staffCategoryFilter === 'teaching' && !isTeaching(s)) return false;
      if (staffCategoryFilter === 'non-teaching' && isTeaching(s)) return false;

      if (staffSearchQuery.trim()) {
        const q = staffSearchQuery.toLowerCase().trim();
        const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
        const empId = (s.empId || s.id || '').toLowerCase();
        return fullName.includes(q) || empId.includes(q);
      }

      return true;
    });
  }, [eligibleStaffList, staffCategoryFilter, staffSearchQuery, staffSearchError]);

  const lastInitKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      lastInitKeyRef.current = null;
      hasInitializedRef.current = false;
      isCustomSignatureModifiedRef.current = false;
      return;
    }

    const currentKey = existingRecord
      ? `rec_${existingRecord.id}`
      : staff
      ? `staff_${staff.id || staff.empId}`
      : `open_${initialType}`;

    // Guard: Prevent re-initialization from re-renders (e.g. signature changes, toasts) while modal is open
    if (lastInitKeyRef.current === currentKey) {
      return;
    }

    lastInitKeyRef.current = currentKey;
    hasInitializedRef.current = true;

        if (existingRecord) {
      setActiveType(existingRecord.letterType);
      setActiveView('preview');
      const targetStaff = staff || (existingRecord ? effectiveStaffList.find(
        (s) => s.id === existingRecord.staffId || s.empId === existingRecord.staffEmpId
      ) : undefined) || currentStaff;
      const basePayload = getDefaultLetterPayload(existingRecord.letterType, targetStaff, schoolProfile);
      const existingPl = existingRecord.payload || {};
      setPayload({
        ...basePayload,
        ...existingPl,
        refNo: existingRecord.letterNumber || (existingPl as any)?.refNo || basePayload.refNo,
        issueDate: existingRecord.issueDate || (existingPl as any)?.issueDate || basePayload.issueDate,
        candidateName: existingRecord.staffName || (existingPl as any)?.candidateName || basePayload.candidateName,
        designation: existingRecord.designation || (existingPl as any)?.designation || basePayload.designation,
        department: existingRecord.department || (existingPl as any)?.department || basePayload.department,
        branch: existingRecord.branch || (existingPl as any)?.branch || basePayload.branch,
      });
      if (staff) {
        setCurrentStaff(staff);
      } else if (targetStaff) {
        setCurrentStaff(targetStaff);
      }
    } else if (staff) {
      setCurrentStaff(staff);
      setActiveType(initialType);
      setActiveView('edit');
      const defaultPl = getDefaultLetterPayload(initialType, staff, schoolProfile);
      const globalSig = getGlobalSignature();
      if (!defaultPl.signatureImageUrl && globalSig) {
        defaultPl.signatureImageUrl = globalSig;
      }
      setPayload(defaultPl);

      const isMock = (name?: string | null) => {
        if (!name) return true;
        const norm = name.trim().toLowerCase();
        return norm === '' || norm === 'dr. eleanor vance' || norm === 'eleanor vance';
      };

      // Sync fresh global settings from backend database
      fetchGlobalLetterSettingsApi()
        .then((res) => {
          if (res?.data) {
            const s = res.data;
            const validName = s.signatoryName && !isMock(s.signatoryName) ? s.signatoryName : '';
            setPayload((prev) => ({
              ...prev,
              authorizedSignatoryName: validName || prev.authorizedSignatoryName,
              authorizedSignatoryTitle: s.signatoryTitle || prev.authorizedSignatoryTitle,
              probationMonths: s.probationMonths || prev.probationMonths,
              noticePeriodDays: s.noticePeriodDays || prev.noticePeriodDays,
              signatureImageUrl: isCustomSignatureModifiedRef.current
                ? prev.signatureImageUrl
                : (prev.signatureImageUrl || s.signatureImageUrl || ''),
              customTerms: (prev.customTerms && prev.customTerms.length > 0) ? prev.customTerms : (s.masterTerms || prev.customTerms || []),
            }));
          }
        })
        .catch(() => {});
    } else {
      const isMock = (name?: string | null) => {
        if (!name) return true;
        const norm = name.trim().toLowerCase();
        return norm === '' || norm === 'dr. eleanor vance' || norm === 'eleanor vance';
      };

      // Initial state when opened without specific staff:
      // Opens in Configure ('edit') tab, initially showing "-- Select Employee --"
      setCurrentStaff(undefined);
      setActiveType(initialType);
      setActiveView('edit');
      const emptyPl = getEmptyLetterPayload(initialType, schoolProfile);
      const globalSig = getGlobalSignature();
      if (!emptyPl.signatureImageUrl && globalSig) {
        emptyPl.signatureImageUrl = globalSig;
      }
      setPayload(emptyPl);

      // Sync fresh global settings from backend database
      fetchGlobalLetterSettingsApi()
        .then((res) => {
          if (res?.data) {
            const s = res.data;
            const validName = s.signatoryName && !isMock(s.signatoryName) ? s.signatoryName : '';
            setPayload((prev) => ({
              ...prev,
              authorizedSignatoryName: prev.authorizedSignatoryName || validName || '',
              authorizedSignatoryTitle: prev.authorizedSignatoryTitle || s.signatoryTitle || '',
              probationMonths: prev.probationMonths || s.probationMonths || 0,
              noticePeriodDays: prev.noticePeriodDays || s.noticePeriodDays || 0,
              signatureImageUrl: isCustomSignatureModifiedRef.current
                ? prev.signatureImageUrl
                : (prev.signatureImageUrl || s.signatureImageUrl || ''),
              customTerms: (prev.customTerms && prev.customTerms.length > 0) ? prev.customTerms : (s.masterTerms || []),
            }));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, existingRecord, staff, initialType]);



  const handleStaffSelect = (selectedId: string) => {
    if (!selectedId) {
      setCurrentStaff(undefined);
      const emptyPl = getEmptyLetterPayload(activeType, schoolProfile);
      if (payload.signatureImageUrl) emptyPl.signatureImageUrl = payload.signatureImageUrl;
      if (payload.authorizedSignatoryName) emptyPl.authorizedSignatoryName = payload.authorizedSignatoryName;
      if (payload.authorizedSignatoryTitle) emptyPl.authorizedSignatoryTitle = payload.authorizedSignatoryTitle;
      setPayload(emptyPl);
      return;
    }

    const found = effectiveStaffList.find(
      (s) => String(s.id) === String(selectedId) || String(s.empId) === String(selectedId)
    ) || allStaff.find(
      (s) => String(s.id) === String(selectedId) || String(s.empId) === String(selectedId)
    );

    if (found) {
      setCurrentStaff(found);

      // Keep category filter aligned with selected staff member
      const isFoundTeaching = isTeaching(found);
      if (staffCategoryFilter === 'teaching' && !isFoundTeaching) {
        setStaffCategoryFilter('non-teaching');
      } else if (staffCategoryFilter === 'non-teaching' && isFoundTeaching) {
        setStaffCategoryFilter('teaching');
      }

      const globalSig = getGlobalSignature();
      const pl = getDefaultLetterPayload(activeType, found, schoolProfile);
      if (payload.signatureImageUrl) pl.signatureImageUrl = payload.signatureImageUrl;
      else if (globalSig) pl.signatureImageUrl = globalSig;
      if (payload.authorizedSignatoryName) pl.authorizedSignatoryName = payload.authorizedSignatoryName;
      if (payload.authorizedSignatoryTitle) pl.authorizedSignatoryTitle = payload.authorizedSignatoryTitle;
      if (payload.probationMonths) pl.probationMonths = payload.probationMonths;
      if (payload.noticePeriodDays) pl.noticePeriodDays = payload.noticePeriodDays;
      if (payload.customTerms && payload.customTerms.length > 0) pl.customTerms = payload.customTerms;
      setPayload(pl);
    }
  };

  const handleCategoryFilterChange = (newCat: 'all' | 'teaching' | 'non-teaching') => {
    setStaffCategoryFilter(newCat);
  };

  // When activeType changes and not existing record, recalculate default payload
  const handleTypeChange = (newType: StaffLetterType) => {
    setActiveType(newType);
    if (!existingRecord) {
      const globalSig = getGlobalSignature();
      if (currentStaff && isLetterReleasedForStaff(currentStaff, newType)) {
        setCurrentStaff(undefined);
        const emptyPl = getEmptyLetterPayload(newType, schoolProfile);
        if (payload.signatureImageUrl) emptyPl.signatureImageUrl = payload.signatureImageUrl;
        else if (globalSig) emptyPl.signatureImageUrl = globalSig;
        if (payload.authorizedSignatoryName) emptyPl.authorizedSignatoryName = payload.authorizedSignatoryName;
        if (payload.authorizedSignatoryTitle) emptyPl.authorizedSignatoryTitle = payload.authorizedSignatoryTitle;
        if (payload.probationMonths) emptyPl.probationMonths = payload.probationMonths;
        if (payload.noticePeriodDays) emptyPl.noticePeriodDays = payload.noticePeriodDays;
        if (payload.customTerms && payload.customTerms.length > 0) emptyPl.customTerms = payload.customTerms;
        setPayload(emptyPl);
        addToast(
          'info',
          'Letter Already Released',
          `${currentStaff.firstName} ${currentStaff.lastName} already has a released ${newType === 'offer' ? 'Offer' : 'Relieving'} Letter. Please select another employee.`
        );
      } else {
        const pl = getDefaultLetterPayload(newType, currentStaff, schoolProfile);
        if (payload.signatureImageUrl) pl.signatureImageUrl = payload.signatureImageUrl;
        else if (globalSig) pl.signatureImageUrl = globalSig;
        if (payload.authorizedSignatoryName) pl.authorizedSignatoryName = payload.authorizedSignatoryName;
        if (payload.authorizedSignatoryTitle) pl.authorizedSignatoryTitle = payload.authorizedSignatoryTitle;
        if (payload.probationMonths) pl.probationMonths = payload.probationMonths;
        if (payload.noticePeriodDays) pl.noticePeriodDays = payload.noticePeriodDays;
        if (payload.customTerms && payload.customTerms.length > 0) pl.customTerms = payload.customTerms;
        setPayload(pl);
      }
    }
  };

  const handleSalaryChange = (newMonthly: number) => {
    const breakdown = calculateSalaryBreakdown(newMonthly);
    setPayload((prev) => ({
      ...prev,
      salaryBreakdown: breakdown,
    }));
  };

  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    if (isPrinting) return;
    setIsPrinting(true);

    const printElement = document.getElementById('staff-letter-printable-area');
    if (!printElement) {
      window.print();
      setIsPrinting(false);
      return;
    }

    // Remove any previous print iframe
    const prevFrame = document.getElementById('staff-letter-print-frame');
    if (prevFrame) prevFrame.remove();

    // Create an off-screen iframe with standard desktop dimensions to ensure full layout rendering
    const iframe = document.createElement('iframe');
    iframe.id = 'staff-letter-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1024px';
    iframe.style.height = '1400px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      window.print();
      setIsPrinting(false);
      return;
    }

    const docTypeLabel =
      activeType === 'offer'
        ? 'Offer Letter'
        : activeType === 'relieving'
        ? 'Relieving Letter'
        : 'Experience Certificate';
    const docTitle = `${payload.refNo ? `${payload.refNo} - ` : ''}${payload.candidateName || 'Staff'} - ${docTypeLabel}`;

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${docTitle}</title>
        </head>
        <body>
          <div id="print-root">${printElement.innerHTML}</div>
        </body>
      </html>
    `);

    // Extract all compiled CSS rules from document.styleSheets into the iframe
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        if (sheet.cssRules) {
          const style = iframeDoc.createElement('style');
          let cssText = '';
          for (let j = 0; j < sheet.cssRules.length; j++) {
            const ruleText = sheet.cssRules[j].cssText;
            if (!ruleText.includes('visibility: hidden')) {
              cssText += ruleText + '\n';
            }
          }
          style.textContent = cssText;
          iframeDoc.head.appendChild(style);
        }
      } catch (e) {
        if (sheet.href) {
          const link = iframeDoc.createElement('link');
          link.rel = 'stylesheet';
          link.href = sheet.href;
          iframeDoc.head.appendChild(link);
        }
      }
    }

    // Also copy all <link rel="stylesheet"> elements (Google Fonts, etc.)
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      iframeDoc.head.appendChild(link.cloneNode(true));
    });

    // Inject dedicated, guaranteed-visible print styles
    const printStyle = iframeDoc.createElement('style');
    printStyle.textContent = `
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      @media print {
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
        visibility: visible !important;
        opacity: 1 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #0f172a !important;
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
      }
      #print-root {
        width: 100% !important;
        max-width: 800px !important;
        margin: 0 auto !important;
        padding: 0 !important;
        background: #ffffff !important;
        display: block !important;
      }
      .printable-staff-letter {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 auto !important;
        max-width: 800px !important;
        width: 100% !important;
        min-height: auto !important;
        height: auto !important;
        color: #0f172a !important;
        background: #ffffff !important;
        display: block !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .no-print, .print\:hidden {
        display: none !important;
      }
    `;
    iframeDoc.head.appendChild(printStyle);
    iframeDoc.close();

    const triggerIframePrint = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print failed:', e);
          window.print();
        } finally {
          setIsPrinting(false);
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 2000);
        }
      }, 250);
    };

    // Wait for images (school logo, signatures) inside the letter to finish loading
    const images = Array.from(iframeDoc.getElementsByTagName('img'));
    if (images.length === 0) {
      triggerIframePrint();
    } else {
      let loaded = 0;
      let finished = false;
      const onImageDone = () => {
        loaded++;
        if (loaded >= images.length && !finished) {
          finished = true;
          triggerIframePrint();
        }
      };

      images.forEach((img) => {
        if (img.complete && img.naturalHeight !== 0) {
          onImageDone();
        } else {
          img.onload = onImageDone;
          img.onerror = onImageDone;
        }
      });

      // Fallback timeout in case an image hangs
      setTimeout(() => {
        if (!finished) {
          finished = true;
          triggerIframePrint();
        }
      }, 1500);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPrinting, payload, activeType]);

  const handleSaveAndIssue = () => {
    if (!currentStaff && !staff && !payload.candidateName?.trim()) {
      addToast('error', 'Select Employee', 'Please select an employee before issuing the letter.');
      return;
    }
    if (!payload.authorizedSignatoryName?.trim()) {
      addToast('error', 'Mandatory Field Missing', 'Authorized Signatory Name is required.');
      return;
    }
    if (!payload.authorizedSignatoryTitle?.trim()) {
      addToast('error', 'Mandatory Field Missing', 'Authorized Signatory Designation / Title is required.');
      return;
    }
    if (!payload.signatureImageUrl?.trim()) {
      addToast('error', 'Mandatory Field Missing', 'Authorized Signatory Signature / Official Stamp Image is required.');
      return;
    }
    const targetStaff = currentStaff || staff || ({ id: '', empId: payload.empId || '' } as Staff);
    const recordId = existingRecord ? existingRecord.id : `LTR-${Date.now()}-${targetStaff.id || targetStaff.empId || '01'}`;
    const newRecord: GeneratedStaffLetterRecord = {
      id: recordId,
      letterNumber: payload.refNo,
      letterType: activeType,
      staffId: targetStaff.id || '',
      staffEmpId: targetStaff.empId || '',
      staffName: payload.candidateName,
      designation: payload.designation,
      department: payload.department,
      branch: payload.branch,
      issueDate: payload.issueDate,
      generatedBy: 'Institutional HR Administration',
      status: 'Issued',
      payload: payload,
    };

    saveStaffLetterRecord(newRecord);
    createOrSaveStaffLetterApi(newRecord).catch((err) => {
      console.warn('Backend staff letter sync error:', err);
    });
    window.dispatchEvent(new Event('staff_letters_updated'));

    // Also link into staff documents array if updateStaff is available
    if (updateStaff && targetStaff.id) {
      const docTitle =
        activeType === 'offer'
          ? `Offer & Appointment Letter (${payload.refNo})`
          : activeType === 'relieving'
          ? `Relieving Order & Clearance (${payload.refNo})`
          : `Service & Experience Certificate (${payload.refNo})`;

      const existingDocs = targetStaff.documents || [];
      const isAlreadyInDocs = existingDocs.some((d) => d.documentNumber === payload.refNo);

      if (!isAlreadyInDocs) {
        const newDoc = {
          id: `DOC-LTR-${Date.now()}`,
          title: docTitle,
          type: activeType === 'offer' ? 'Appointment Letter' : 'Experience Certificate',
          fileUrl: '',
          uploadedDate: payload.issueDate,
          documentNumber: payload.refNo,
          verificationStatus: 'Verified' as const,
          category: 'Institutional Letters',
        };
        updateStaff(targetStaff.id, {
          documents: [newDoc, ...existingDocs],
        });
      }
    }

    addToast(
      'success',
      `${activeType === 'offer' ? 'Offer Letter' : activeType === 'relieving' ? 'Relieving Letter' : 'Experience Certificate'} Issued`,
      `Successfully generated official document (Ref: ${payload.refNo}) for ${payload.candidateName}.`
    );

    // Close modal and redirect to letters management screen
    onClose();
    if (onNavigate) {
      onNavigate('staff-letters');
    }
    window.dispatchEvent(new CustomEvent('navigate_module', { detail: 'staff-letters' }));
  };

  if (!isOpen) return null;

  const isViewMode = readOnly || !!existingRecord;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:w-full print:max-w-none print:h-auto print:bg-white">
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 no-print print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 shadow-xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2 whitespace-nowrap">
                {isViewMode
                  ? (activeType === 'offer'
                      ? 'Official Offer Letter'
                      : activeType === 'relieving'
                      ? 'Official Relieving Letter'
                      : 'Official Experience Certificate')
                  : (activeType === 'offer'
                      ? 'Generate Offer Letter'
                      : activeType === 'relieving'
                      ? 'Generate Relieving Letter'
                      : 'Generate Experience Certificate')}
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {activeType === 'experience' ? 'CERTIFICATE' : `${activeType.toUpperCase()} LETTER`}
                </span>
              </h2>

              {isViewMode && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="hidden sm:inline">•</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{payload.candidateName}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{payload.refNo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {!isViewMode && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveView('edit')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'edit'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Configure
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('preview')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'preview'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
              </div>
            )}

            {/* Print Icon Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              title="Print / PDF Document"
              className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all cursor-pointer flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPrinting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-bar: Letter Type Switcher & Save (Only when generating new document) */}
        {!isViewMode && (
          <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar no-print print:hidden">
            <div className="flex items-center gap-2">
              {[
                { id: 'offer', label: 'Offer & Appointment Letter', icon: FileText },
                { id: 'relieving', label: 'Relieving Order & Clearance', icon: ShieldCheck },
                { id: 'experience', label: 'Service & Experience Certificate', icon: Award },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => handleTypeChange(tab.id as StaffLetterType)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-[#0088cc] dark:text-sky-400 shadow-xs border border-sky-300 dark:border-sky-800 font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSaveAndIssue}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Save & Issue Record
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar print:p-0 print:overflow-visible">
          {activeView === 'preview' || isViewMode ? (
            <div className="flex justify-center pb-8 print:pb-0">
              <div id="staff-letter-printable-area" className="w-full">
                <PrintableStaffLetter
                  type={activeType}
                  payload={payload}
                  schoolProfile={schoolProfile}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="max-w-3xl mx-auto space-y-4 pb-8 text-xs no-print">
              {/* Target Employee Switcher */}
              {!readOnly && !existingRecord && effectiveStaffList.length > 0 && (
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-sky-200/80 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-sky-600" /> Target Employee Selection
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold">Auto-fills employee records & salary</span>
                  </div>

                  {/* Single Searchable Dropdown */}
                  <div className="relative w-full" ref={employeeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                        isEmployeeDropdownOpen
                          ? 'border-sky-500 ring-2 ring-sky-500/20'
                          : !currentStaff
                          ? 'border-sky-300 dark:border-sky-700 bg-sky-50/20 dark:bg-sky-950/20'
                          : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      {currentStaff ? (
                        <div className="flex items-center gap-2.5 truncate min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400 font-black text-xs shrink-0">
                            {currentStaff.firstName ? currentStaff.firstName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-slate-900 dark:text-white font-black truncate">
                              {`${currentStaff.firstName || ''} ${currentStaff.lastName || ''}`.trim() || 'Staff Member'}
                            </span>
                            {(currentStaff.empId || currentStaff.id) && (
                              <span className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-200/60 dark:border-sky-800/60 shrink-0">
                                {currentStaff.empId || currentStaff.id}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 font-normal truncate hidden sm:inline">
                              • {currentStaff.designation || currentStaff.role || (isTeaching(currentStaff) ? 'Teaching Staff' : 'Non-Teaching Staff')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 truncate min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-xs shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-slate-600 dark:text-slate-300 font-bold truncate">
                              -- Select Employee --
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal truncate hidden sm:inline">
                              (Choose employee from staff directory)
                            </span>
                          </div>
                        </div>
                      )}
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-2 ${isEmployeeDropdownOpen ? 'rotate-180 text-sky-600' : ''}`} />
                    </button>

                    {/* Searchable Dropdown Popover */}
                    {isEmployeeDropdownOpen && (
                      <div className="absolute left-0 top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                        {/* Category Filter Pills */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => handleCategoryFilterChange('all')}
                            className={`flex-1 py-1.5 rounded-md transition-all text-center cursor-pointer ${
                              staffCategoryFilter === 'all'
                                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-black shadow-2xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            All Staff ({eligibleStaffList.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCategoryFilterChange('teaching')}
                            className={`flex-1 py-1.5 rounded-md transition-all text-center cursor-pointer ${
                              staffCategoryFilter === 'teaching'
                                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-black shadow-2xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            Teaching Staff
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCategoryFilterChange('non-teaching')}
                            className={`flex-1 py-1.5 rounded-md transition-all text-center cursor-pointer ${
                              staffCategoryFilter === 'non-teaching'
                                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-black shadow-2xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            Non-Teaching Staff
                          </button>
                        </div>

                        {/* Search Input inside Dropdown */}
                        <div>
                          <div className="relative flex items-center">
                            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                              staffSearchError ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'
                            }`} />
                            <input
                              type="text"
                              maxLength={50}
                              autoFocus
                              placeholder="Search by name, employee ID, role..."
                              value={staffSearchQuery}
                              onChange={(e) => {
                                const val = e.target.value;
                                setStaffSearchQuery(val);
                                if (!val) {
                                  setStaffSearchError(undefined);
                                } else {
                                  const validation = validateSearchQuery(val);
                                  setStaffSearchError(validation.isValid ? undefined : validation.error);
                                }
                              }}
                              className={`w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border transition-all text-slate-900 dark:text-white outline-none placeholder:text-slate-400 ${
                                staffSearchError
                                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                              }`}
                            />
                            {staffSearchQuery && (
                              <button
                                type="button"
                                onClick={() => {
                                  setStaffSearchQuery('');
                                  setStaffSearchError(undefined);
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                                title="Clear search"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {staffSearchError && (
                            <p className="mt-1.5 text-[11px] font-bold text-rose-500 flex items-center gap-1 animate-in fade-in">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{staffSearchError}</span>
                            </p>
                          )}
                        </div>

                        {/* Staff List */}
                        <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1">
                          {/* Option to clear / unselect employee */}
                          <button
                            type="button"
                            onClick={() => {
                              handleStaffSelect('');
                              setIsEmployeeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              !currentStaff
                                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-black border border-sky-200/60 dark:border-sky-800/60'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xs">
                                <User className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-semibold">-- Select Employee --</span>
                            </div>
                            {!currentStaff && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 ml-2" />}
                          </button>

                          {filteredStaffList.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 font-medium">
                              {staffSearchError
                                ? 'Please enter a valid search term'
                                : staffSearchQuery
                                ? `No staff found matching "${staffSearchQuery}"`
                                : 'No staff available in selected category'}
                            </div>
                          ) : (
                            filteredStaffList.map((s) => {
                              const isSelected = String(currentStaff?.id) === String(s.id) || String(currentStaff?.empId) === String(s.empId);
                              return (
                                <button
                                  key={s.id || s.empId}
                                  type="button"
                                  onClick={() => {
                                    handleStaffSelect(s.id || s.empId || '');
                                    setIsEmployeeDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                    isSelected
                                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-black border border-sky-200/60 dark:border-sky-800/60'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 truncate min-w-0">
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 ${
                                      isSelected
                                        ? 'bg-sky-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}>
                                      {s.firstName ? s.firstName.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="truncate">
                                      <div className="truncate font-extrabold text-slate-900 dark:text-white">
                                        {s.firstName} {s.lastName || ''}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono font-normal">
                                        {s.empId || s.id} {s.designation || s.role ? `• ${s.designation || s.role}` : ''}
                                      </div>
                                    </div>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 ml-2" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* General Reference & Metadata */}
              <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 border-slate-100 dark:border-slate-800">
                  <FileText className="w-4 h-4 text-sky-600" /> Reference & Header Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Reference Number <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. OFF/2026/..."
                      value={payload.refNo}
                      onChange={(e) => setPayload({ ...payload, refNo: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-900 dark:text-white outline-none placeholder:font-normal placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Issue Date <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="date"
                      value={payload.issueDate}
                      onChange={(e) => setPayload({ ...payload, issueDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Campus / Branch <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      value={payload.branch}
                      onChange={(e) => setPayload({ ...payload, branch: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Employee Information */}
              <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 border-slate-100 dark:border-slate-800">
                  <User className="w-4 h-4 text-sky-600" /> Employee & Role Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Full Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      value={payload.candidateName}
                      onChange={(e) => setPayload({ ...payload, candidateName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={payload.empId || ''}
                      onChange={(e) => setPayload({ ...payload, empId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Designation <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      value={payload.designation}
                      onChange={(e) => setPayload({ ...payload, designation: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Department <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      value={payload.department}
                      onChange={(e) => setPayload({ ...payload, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Residential / Present Address
                    </label>
                    <input
                      type="text"
                      placeholder="Staff address from staff directory..."
                      value={payload.address || ''}
                      onChange={(e) => setPayload({ ...payload, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Offer-Specific Terms & Salary */}
              {activeType === 'offer' && (
                <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 border-slate-100 dark:border-slate-800">
                    <IndianRupee className="w-4 h-4 text-emerald-600" /> Compensation & Appointment Terms
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                        Gross Monthly Salary (₹)
                      </label>
                      <input
                        type="number"
                        value={payload.salaryBreakdown?.grossMonthly || 0}
                        onChange={(e) => handleSalaryChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                        Joining Date <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="date"
                        value={payload.joiningDate}
                        onChange={(e) => setPayload({ ...payload, joiningDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                        Probation Period (Months) <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 6"
                        value={payload.probationMonths || ''}
                        onChange={(e) => setPayload({ ...payload, probationMonths: e.target.value === '' ? 0 : parseInt(e.target.value, 10) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                        Notice Period (Days) <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 30"
                        value={payload.noticePeriodDays || ''}
                        onChange={(e) => setPayload({ ...payload, noticePeriodDays: e.target.value === '' ? 0 : parseInt(e.target.value, 10) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Relieving-Specific Terms */}
              {(activeType === 'relieving' || activeType === 'experience') && (
                <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 border-slate-100 dark:border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-rose-600" /> Relieving & Service Assessment
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                        Date of Joining <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="date"
                        value={payload.joiningDate}
                        onChange={(e) => setPayload({ ...payload, joiningDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                        Relieving Date / Last Working Date <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="date"
                        value={payload.relievingDate || payload.issueDate}
                        onChange={(e) => setPayload({ ...payload, relievingDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                        Conduct & Performance Rating
                      </label>
                      <select
                        value={payload.conductRating || 'Exemplary'}
                        onChange={(e) => setPayload({ ...payload, conductRating: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="Exemplary">Exemplary</option>
                        <option value="Very Good">Very Good</option>
                        <option value="Good">Good</option>
                        <option value="Satisfactory">Satisfactory</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={payload.noDuesCleared ?? true}
                          onChange={(e) => setPayload({ ...payload, noDuesCleared: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>No Dues & Asset Clearance Completed</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Signatory Settings */}
              <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 border-slate-100 dark:border-slate-800">
                  <Building2 className="w-4 h-4 text-sky-600" /> Authorized Signatory
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Signatory Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      value={payload.authorizedSignatoryName}
                      onChange={(e) => setPayload({ ...payload, authorizedSignatoryName: e.target.value })}
                      placeholder="Enter Authorized Signatory Full Name"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Signatory Designation / Title <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      value={payload.authorizedSignatoryTitle}
                      onChange={(e) => setPayload({ ...payload, authorizedSignatoryTitle: e.target.value })}
                      placeholder="Enter Signatory Title & Designation"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                {/* Digital Signature / Stamp Upload */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1.5">
                    Authorized Signatory Signature / Official Stamp Image <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-24 h-14 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                      {payload.signatureImageUrl ? (
                        <img
                          key={payload.signatureImageUrl}
                          src={payload.signatureImageUrl}
                          alt="Signature Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-slate-400">
                          <ImageIcon className="w-5 h-5 mx-auto stroke-1" />
                          <span className="text-[9px] font-bold block mt-0.5">No Signature</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 text-center sm:text-left">
                      <p className="text-[11px] text-slate-500">
                        Upload authorized digital signature or official seal (PNG, JPG, WEBP, max 5MB). Replaces the default seal placeholder on this letter.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <label className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          {payload.signatureImageUrl ? 'Change Signature' : 'Upload Signature'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="hidden"
                            onClick={(e) => {
                              (e.target as HTMLInputElement).value = '';
                            }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (!file.type.startsWith('image/')) {
                                addToast('error', 'Invalid File', 'Please select an image file (PNG, JPG, WEBP, SVG).');
                                e.target.value = '';
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                addToast('error', 'File Too Large', 'Signature image must be under 5MB.');
                                e.target.value = '';
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const result = ev.target?.result as string;
                                if (result) {
                                  isCustomSignatureModifiedRef.current = true;
                                  setPayload((prev) => ({ ...prev, signatureImageUrl: result }));
                                  addToast('success', 'Signature Loaded', 'Signature applied successfully.');
                                  e.target.value = '';
                                  try {
                                    const newSettings = {
                                      signatureImageUrl: result,
                                      signatoryName: payload.authorizedSignatoryName || '',
                                      signatoryTitle: payload.authorizedSignatoryTitle || '',
                                      probationMonths: payload.probationMonths ?? 0,
                                      noticePeriodDays: payload.noticePeriodDays ?? 30,
                                    };
                                    window.dispatchEvent(new CustomEvent('global_signature_updated', { detail: result }));
                                    saveGlobalLetterSettingsApi(newSettings).catch(() => {});
                                  } catch (err) {}
                                  addToast('success', 'Signature Loaded', 'Signature applied and saved globally.');
                                }
                              };
                              reader.readAsDataURL(file);
                              e.target.value = '';
                            }}
                          />
                        </label>

                        {payload.signatureImageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              isCustomSignatureModifiedRef.current = true;
                              setPayload((prev) => ({ ...prev, signatureImageUrl: '' }));
                              try {
                                const newSettings = {
                                  signatureImageUrl: '',
                                  signatoryName: payload.authorizedSignatoryName || '',
                                  signatoryTitle: payload.authorizedSignatoryTitle || '',
                                  probationMonths: payload.probationMonths ?? 0,
                                  noticePeriodDays: payload.noticePeriodDays ?? 30,
                                };
                                window.dispatchEvent(new CustomEvent('global_signature_updated', { detail: '' }));
                                saveGlobalLetterSettingsApi(newSettings).catch(() => {});
                              } catch (err) {}
                              addToast('info', 'Signature Removed', 'Custom signature removed.');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-900 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Hidden printable letter so printing from configure tab still prints only the letter document */}
            <div id="staff-letter-printable-area" className="hidden">
              <PrintableStaffLetter
                type={activeType}
                payload={payload}
                schoolProfile={schoolProfile}
              />
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};
