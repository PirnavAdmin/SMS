import fs from 'fs';
import path from 'path';
import { test, expect } from '../../fixtures/test-fixtures';

const casesPath = path.resolve(__dirname, '../../data/form-validation-cases.json');
const datasets = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));

test.describe('Data-Driven: Form & Payload Boundary Validation (JSON) @ddt @regression', () => {
  for (const item of datasets.admissionValidationCases) {
    test(`[${item.caseId}] ${item.description} @ddt @api`, async ({ adminApi, apiClient }) => {
      test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable');
      test.skip(!adminApi.getToken(), 'Admin token not available');

      const res = await adminApi.post('/api/admissions', item.payload);
      if (res.ok()) {
        const body = await res.json().catch(() => null);
        const createdId = body?.data?.id;
        if (createdId) {
          await adminApi.delete(`/api/admissions/${createdId}`).catch(() => {});
        }
      }
      expect(res.status()).toBeGreaterThanOrEqual(item.expectStatusMin);
      expect(res.status()).toBeLessThanOrEqual(item.expectStatusMax);
    });
  }

  for (const item of datasets.feeHeadValidationCases) {
    test(`[${item.caseId}] ${item.description} @ddt @api`, async ({ adminApi, apiClient }) => {
      test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable');
      test.skip(!adminApi.getToken(), 'Admin token not available');

      const res = await adminApi.post(item.endpoint, item.payload);
      expect(res.status()).toBe(item.expectedStatus);
    });
  }

  for (const item of datasets.academicYearValidationCases) {
    test(`[${item.caseId}] ${item.description} @ddt @api`, async ({ adminApi, apiClient }) => {
      test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable');
      test.skip(!adminApi.getToken(), 'Admin token not available');

      const res = await adminApi.post('/api/academic-years', item.payload);
      expect(res.status()).toBe(item.expectedStatus);
    });
  }
});
