import fs from 'fs';
import path from 'path';
import { test, expect } from '../../fixtures/test-fixtures';

const calcPath = path.resolve(__dirname, '../../data/fee-calculations.json');
const feeDatasets = JSON.parse(fs.readFileSync(calcPath, 'utf-8'));

function computeNetInstallment(
  annualAmount: number,
  terms: number,
  discountMode: string,
  discountValue: number
): { netTotal: number; perTermAmount: number } {
  let discount = 0;
  if (discountMode === 'Percentage') {
    discount = (annualAmount * discountValue) / 100;
  } else if (discountMode === 'Flat') {
    discount = discountValue;
  }
  const netTotal = Math.max(0, Number((annualAmount - discount).toFixed(2)));
  const perTermAmount = Number((netTotal / Math.max(1, terms)).toFixed(2));
  return { netTotal, perTermAmount };
}

function computeBalanceStatus(totalDue: number, payments: number[]): { paid: number; balance: number; status: string } {
  const paid = payments.reduce((acc, p) => acc + p, 0);
  const balance = Math.max(0, totalDue - paid);
  const status = balance === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Pending';
  return { paid, balance, status };
}

test.describe('Data-Driven: Fee Schedule & Payment Calculations (JSON) @ddt @regression', () => {
  for (const tc of feeDatasets.termInstallmentCases) {
    test(`[${tc.caseId}] ${tc.terms} term(s), ${tc.discountMode} discount @ddt`, async () => {
      const result = computeNetInstallment(tc.annualAmount, tc.terms, tc.discountMode, tc.discountValue);
      expect(result.netTotal).toBe(tc.expectedNetTotal);
      expect(result.perTermAmount).toBe(tc.expectedPerTermAmount);
    });
  }

  for (const pc of feeDatasets.partialPaymentCases) {
    test(`[${pc.caseId}] partial/full payment balance verification @ddt`, async () => {
      const result = computeBalanceStatus(pc.totalDue, pc.payments);
      expect(result.paid).toBe(pc.expectedPaid);
      expect(result.balance).toBe(pc.expectedBalance);
      expect(result.status).toBe(pc.expectedStatus);
    });
  }
});
