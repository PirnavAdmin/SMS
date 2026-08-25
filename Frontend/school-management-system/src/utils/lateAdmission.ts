import { AcademicYearFeeSchedule, FeeScheduleTerm } from '../types';
import { normalizeToISODate } from '../context/DataContext';

export interface FeeItemInput {
  feeHeadId?: string;
  feeHeadName: string;
  amount: number;
  frequency?: string;
  category?: string;
  isMandatory?: boolean;
}

export interface CalculatedFeeItem {
  feeHeadId?: string;
  name: string;
  originalAmount: number;
  adjustedAmount: number;
  isApplicable: boolean;
  frequency: string;
  remarks?: string;
}

export interface LateAdmissionCalculationResult {
  isLateAdmissionApplied: boolean;
  totalOriginalAmount: number;
  totalAdjustedAmount: number;
  applicableTerms: FeeScheduleTerm[];
  applicableMonthIndices: number[]; // 0 to 11 (0=April, 11=March)
  items: CalculatedFeeItem[];
}

/**
 * Filter terms for late admission.
 * RULE (Section 5 & 9):
 * If admissionDate > term.endDate -> NOT applicable (completed).
 * If admissionDate <= term.endDate -> IS applicable (current / remaining).
 */
export function getApplicableTermsForLateAdmission(
  admissionDate: string,
  terms: FeeScheduleTerm[]
): FeeScheduleTerm[] {
  const admIso = normalizeToISODate(admissionDate);
  if (!admIso) return terms;

  const filtered = terms.filter((term) => {
    const termEndIso = normalizeToISODate(term.endDate);
    if (!termEndIso) return true;
    return admIso <= termEndIso;
  });

  return filtered.length > 0 ? filtered : [terms[terms.length - 1]];
}

/**
 * Filter month indices for late admission (Monthly mode).
 * RULE (Section 10):
 * Generate fees from the student's admission month through Academic Year end (March).
 */
export function getApplicableMonthIndicesForLateAdmission(
  admissionDate: string,
  ayStartYear: number = 2026
): number[] {
  const admIso = normalizeToISODate(admissionDate);
  if (!admIso) return Array.from({ length: 12 }, (_, i) => i);

  const admDateObj = new Date(admIso);
  const admYear = admDateObj.getFullYear();
  const admMonth = admDateObj.getMonth(); // 0 = Jan, 3 = Apr, 7 = Aug

  let startIdx = 0;
  if (admYear === ayStartYear) {
    startIdx = admMonth >= 3 ? admMonth - 3 : 0;
  } else if (admYear > ayStartYear) {
    startIdx = admMonth <= 2 ? admMonth + 9 : 11;
  }

  return Array.from({ length: 12 }, (_, i) => i).filter((idx) => idx >= startIdx);
}

/**
 * Master shared helper for Late Admission calculation across Admission Preview,
 * Student Fee Assignment, and Student Fee Ledger.
 */
export function calculateLateAdmissionFees(params: {
  feeItems: FeeItemInput[];
  admissionDate: string;
  isLateAdmission: boolean;
  feeCalculationMethod?: string;
  schedule?: AcademicYearFeeSchedule | null;
  academicYear?: string;
}): LateAdmissionCalculationResult {
  const {
    feeItems,
    admissionDate,
    isLateAdmission,
    feeCalculationMethod = 'Term-wise',
    schedule,
    academicYear = '2026-2027'
  } = params;

  const ayStartYear = parseInt(academicYear.split('-')[0], 10) || 2026;
  const ayEndYear = parseInt(academicYear.split('-')[1], 10) || ayStartYear + 1;

  // Build terms list from schedule or default 4 terms
  const terms: FeeScheduleTerm[] =
    schedule && schedule.terms && schedule.terms.length > 0
      ? schedule.terms
      : [
          {
            id: `T1-${academicYear}`,
            termName: 'Term 1',
            startDate: `${ayStartYear}-04-01`,
            endDate: `${ayStartYear}-06-30`,
            dueDate: `${ayStartYear}-04-15`,
            sequence: 1,
            status: 'Active'
          },
          {
            id: `T2-${academicYear}`,
            termName: 'Term 2',
            startDate: `${ayStartYear}-07-01`,
            endDate: `${ayStartYear}-09-30`,
            dueDate: `${ayStartYear}-07-15`,
            sequence: 2,
            status: 'Active'
          },
          {
            id: `T3-${academicYear}`,
            termName: 'Term 3',
            startDate: `${ayStartYear}-10-01`,
            endDate: `${ayStartYear}-12-31`,
            dueDate: `${ayStartYear}-10-15`,
            sequence: 3,
            status: 'Active'
          },
          {
            id: `T4-${academicYear}`,
            termName: 'Term 4',
            startDate: `${ayEndYear}-01-01`,
            endDate: `${ayEndYear}-03-31`,
            dueDate: `${ayEndYear}-01-15`,
            sequence: 4,
            status: 'Active'
          }
        ];

  const totalTermsCount = terms.length || 4;
  const applicableTerms = isLateAdmission && admissionDate
    ? getApplicableTermsForLateAdmission(admissionDate, terms)
    : terms;

  const applicableMonthIndices = isLateAdmission && admissionDate
    ? getApplicableMonthIndicesForLateAdmission(admissionDate, ayStartYear)
    : Array.from({ length: 12 }, (_, i) => i);

  let totalOriginalAmount = 0;
  let totalAdjustedAmount = 0;

  const items: CalculatedFeeItem[] = feeItems.map((item) => {
    const originalAmount = item.amount;
    const freq = (item.frequency || 'Annual').trim();
    let adjustedAmount = originalAmount;
    let remarks: string | undefined = undefined;

    totalOriginalAmount += originalAmount;

    // MASTER SWITCH CHECK (Section 1 & 11)
    if (isLateAdmission && admissionDate) {
      if (freq === 'Quarterly' || freq === 'Term-wise') {
        if (feeCalculationMethod === 'Monthly') {
          const standardMonthly = Math.floor(originalAmount / 12);
          adjustedAmount = standardMonthly * applicableMonthIndices.length;
          remarks = `Late Admission (Monthly: ${applicableMonthIndices.length} Months)`;
        } else {
          // Term-wise: Eliminate completed terms (admissionDate > term.endDate)
          const standardTermFee = Math.floor(originalAmount / totalTermsCount);
          adjustedAmount = standardTermFee * applicableTerms.length;
          if (applicableTerms.length < totalTermsCount) {
            remarks = `Late Admission (Remaining Terms: ${applicableTerms.length} of ${totalTermsCount})`;
          }
        }
      } else if (freq === 'Monthly') {
        if (feeCalculationMethod === 'Term-wise' || feeCalculationMethod === 'Remaining Terms') {
          const termMonthMap: Record<number, number[]> = {
            1: [0, 1, 2],
            2: [3, 4, 5],
            3: [6, 7, 8],
            4: [9, 10, 11]
          };
          let termMonthIndices: number[] = [];
          applicableTerms.forEach((t) => {
            const seq = t.sequence || 1;
            if (termMonthMap[seq]) termMonthIndices.push(...termMonthMap[seq]);
          });
          const activeMonthsCount = applicableMonthIndices.filter((idx) => termMonthIndices.includes(idx)).length;
          const standardMonthly = Math.floor(originalAmount / 12);
          adjustedAmount = standardMonthly * activeMonthsCount;
          remarks = `Late Admission (${activeMonthsCount} Months)`;
        } else {
          // Monthly: Apply from admission month through AY end
          const standardMonthly = Math.floor(originalAmount / 12);
          adjustedAmount = standardMonthly * applicableMonthIndices.length;
          if (applicableMonthIndices.length < 12) {
            remarks = `Late Admission (Monthly: ${applicableMonthIndices.length} Months)`;
          }
        }
      } else {
        // Annual, One Time, One Term: DO NOT PRORATE OR REDUCE (Section 13, 14, 15)
        adjustedAmount = originalAmount;
      }
    }

    totalAdjustedAmount += adjustedAmount;

    return {
      feeHeadId: item.feeHeadId,
      name: item.feeHeadName,
      originalAmount,
      adjustedAmount,
      isApplicable: item.isMandatory !== false,
      frequency: freq,
      remarks
    };
  });

  return {
    isLateAdmissionApplied: isLateAdmission && Boolean(admissionDate),
    totalOriginalAmount,
    totalAdjustedAmount,
    applicableTerms,
    applicableMonthIndices,
    items
  };
}
