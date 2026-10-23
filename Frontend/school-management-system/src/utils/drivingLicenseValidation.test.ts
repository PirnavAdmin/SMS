import {
  DRIVING_LICENCE_ERROR_MESSAGE,
  VALID_INDIAN_DL_STATE_CODES,
  normalizeDrivingLicense,
  sanitizeDrivingLicenseInput,
  parseDrivingLicense,
  validateDrivingLicense,
} from './validation';
import { createDriverApi, updateDriverApi } from '../api/transport';

const assert = {
  equal<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(
        message || `Assertion failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
  },
  ok(value: unknown, message?: string): void {
    if (!value) {
      throw new Error(message || `Assertion failed: expected truthy value, got ${JSON.stringify(value)}`);
    }
  },
  async rejects(
    promiseFactory: () => Promise<unknown>,
    validator: (err: any) => boolean
  ): Promise<void> {
    let threw = false;
    try {
      await promiseFactory();
    } catch (err) {
      threw = true;
      if (!validator(err)) {
        throw new Error(`Rejected error did not pass validator: ${(err as Error)?.message}`);
      }
    }
    if (!threw) {
      throw new Error('Expected promise to reject, but it resolved');
    }
  },
};

interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
}

const tests: TestCase[] = [
  {
    name: '1. Accepts exact value AP13700322492018 and parses its CFST_YEAR_SUFFIX components',
    fn: () => {
      const parsed = parseDrivingLicense('AP13700322492018');
      assert.equal(parsed.isValid, true, 'AP13700322492018 should be valid');
      assert.equal(parsed.format, 'CFST_YEAR_SUFFIX');
      assert.equal(parsed.stateCode, 'AP');
      assert.equal(parsed.rtoCode, '137');
      assert.equal(parsed.serialNumber, '0032249');
      assert.equal(parsed.issueYear, 2018);

      const validation = validateDrivingLicense('AP13700322492018', true);
      assert.equal(validation.isValid, true);
      assert.equal(validation.error, undefined);
    },
  },
  {
    name: '2. Supports all documented Indian driving licence formats (Sarathi, CFST, Slash-separated, Legacy)',
    fn: () => {
      const validSamples: Array<{
        input: string;
        expectedFormat: 'SARATHI_STANDARD' | 'CFST_YEAR_SUFFIX' | 'ORG_LEGACY';
        state: string;
        year: number;
      }> = [
        { input: 'MH-12-20200012345', expectedFormat: 'SARATHI_STANDARD', state: 'MH', year: 2020 },
        { input: 'MH1220200012345', expectedFormat: 'SARATHI_STANDARD', state: 'MH', year: 2020 },
        { input: 'TS 09 2019 0045678', expectedFormat: 'SARATHI_STANDARD', state: 'TS', year: 2019 },
        { input: 'AP12/2007/0123456', expectedFormat: 'SARATHI_STANDARD', state: 'AP', year: 2007 },
        { input: 'DL-04C-20150012345', expectedFormat: 'SARATHI_STANDARD', state: 'DL', year: 2015 },
        { input: 'AP13700322492018', expectedFormat: 'CFST_YEAR_SUFFIX', state: 'AP', year: 2018 },
        { input: 'AP12/0123456/2007', expectedFormat: 'CFST_YEAR_SUFFIX', state: 'AP', year: 2007 },
        { input: 'TS-107-0045123-2016', expectedFormat: 'CFST_YEAR_SUFFIX', state: 'TS', year: 2016 },
        { input: 'DL-2026-0073', expectedFormat: 'ORG_LEGACY', state: 'DL', year: 2026 },
      ];

      for (const sample of validSamples) {
        const parsed = parseDrivingLicense(sample.input);
        assert.equal(parsed.isValid, true, `Expected ${sample.input} to be valid`);
        assert.equal(parsed.format, sample.expectedFormat, `Unexpected format for ${sample.input}`);
        assert.equal(parsed.stateCode, sample.state);
        assert.equal(parsed.issueYear, sample.year);
      }
    },
  },
  {
    name: '3. Normalizes valid lowercase input and trims leading/trailing whitespace',
    fn: () => {
      const inputs = [
        '  ap13700322492018  ',
        'mh-12-20200012345',
        '  ap12/2007/0123456 ',
        'dl-2026-0073',
      ];

      for (const raw of inputs) {
        const norm = normalizeDrivingLicense(raw);
        assert.equal(norm, raw.trim().toUpperCase());
        const res = validateDrivingLicense(raw, true);
        assert.equal(res.isValid, true, `Expected "${raw}" to be valid after normalization`);
      }

      assert.equal(sanitizeDrivingLicenseInput('ap12/2007/0123456'), 'AP12/2007/0123456');
    },
  },
  {
    name: '4. Rejects invalid state/UT and RTO identifiers',
    fn: () => {
      const invalidStateOrRto = [
        'XX13700322492018',
        'ZZ-12-20200012345',
        'AB12/2007/0123456',
        'MH-00-20200012345',
        'AP00000322492018',
        'AP0020200012345',
      ];

      assert.equal(VALID_INDIAN_DL_STATE_CODES.has('XX'), false);

      for (const val of invalidStateOrRto) {
        const res = validateDrivingLicense(val, true);
        assert.equal(res.isValid, false, `Expected invalid state/RTO "${val}" to be rejected`);
        assert.equal(res.error, DRIVING_LICENCE_ERROR_MESSAGE);
      }
    },
  },
  {
    name: '5. Rejects invalid issue years and invalid serial numbers',
    fn: () => {
      const invalidYearOrSerial = [
        'MH-12-18990012345', // year < 1970
        'MH-12-20990012345', // future year > maxIssueYear
        'AP13700322491950',  // year < 1970 at end
        'AP13700322492099',  // future year at end
        'MH-12-20200000000', // all-zero serial
        'AP13700000002018',  // all-zero serial in CFST format
        'MH-12-20201111111', // repeating identical digits serial
        'AP13799999992018',  // repeating identical digits serial
        'DL-2026-0000',      // all-zero serial in legacy format
      ];

      for (const val of invalidYearOrSerial) {
        const res = validateDrivingLicense(val, true);
        assert.equal(res.isValid, false, `Expected "${val}" to be rejected`);
        assert.equal(res.error, DRIVING_LICENCE_ERROR_MESSAGE);
      }
    },
  },
  {
    name: '6. Rejects alphabetic-only strings, numeric-only strings, random special characters, and malformed separators',
    fn: () => {
      const invalidStrings = [
        'ABCDEFGHIJKLMNOP',
        'DRIVINGLICENCE',
        '1234567890123456',
        'MH@12#20200012345',
        'AP137$0032249*2018',
        'MH--12-20200012345',
        'AP12//2007//0123456',
        'AP-12/2007/0123456', // mixed '-' and '/'
        '-MH1220200012345',
        'MH1220200012345-',
      ];

      for (const val of invalidStrings) {
        const res = validateDrivingLicense(val, true);
        assert.equal(res.isValid, false, `Expected "${val}" to be rejected`);
        assert.equal(res.error, DRIVING_LICENCE_ERROR_MESSAGE);
      }
    },
  },
  {
    name: '7. Rejects missing or incomplete components',
    fn: () => {
      const incompleteValues = [
        'AP',
        'AP13',
        'AP1370032',
        'MH-12-2020',
        'MH-12-2020-123',
        'AP12/2007/123',
        'DL-2026-12',
      ];

      for (const val of incompleteValues) {
        const res = validateDrivingLicense(val, true);
        assert.equal(res.isValid, false, `Expected incomplete "${val}" to be rejected`);
        assert.equal(res.error, DRIVING_LICENCE_ERROR_MESSAGE);
      }

      const emptyRequired = validateDrivingLicense('   ', true);
      assert.equal(emptyRequired.isValid, false);
      assert.equal(emptyRequired.error, 'Driving License Number is required.');

      const emptyOptional = validateDrivingLicense('   ', false);
      assert.equal(emptyOptional.isValid, true);
    },
  },
  {
    name: '8. Enforces frontend and data/API layer consistency on create and update',
    fn: async () => {
      // Provide in-memory localStorage & offline fetch stub when executing in Node test environment
      const store = new Map<string, string>();
      if (typeof globalThis.localStorage === 'undefined') {
        (globalThis as any).localStorage = {
          getItem: (k: string) => store.get(k) ?? null,
          setItem: (k: string, v: string) => store.set(k, String(v)),
          removeItem: (k: string) => store.delete(k),
          clear: () => store.clear(),
        };
      }
      const origFetch = globalThis.fetch;
      (globalThis as any).fetch = async (_url: any, init?: RequestInit) => {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        return {
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          text: async () => JSON.stringify(body),
          json: async () => body,
        };
      };

      try {
        const created = await createDriverApi({
          id: 'TEST-DRV-AP137',
          driverName: 'Ramesh Kumar',
          mobileNumber: '9876543210',
          licenseNumber: '  ap13700322492018 ',
        });
        assert.equal(created.licenseNumber, 'AP13700322492018');

        const updated = await updateDriverApi('TEST-DRV-AP137', {
          licenseNumber: 'ap12/2007/0123456',
        });
        assert.equal(updated.licenseNumber, 'AP12/2007/0123456');

        await assert.rejects(
          async () => {
            await createDriverApi({
              driverName: 'Invalid Driver',
              mobileNumber: '9876543210',
              licenseNumber: 'INVALID_DL_123',
            });
          },
          (err: any) => {
            assert.equal(err.message, DRIVING_LICENCE_ERROR_MESSAGE);
            return true;
          }
        );

        await assert.rejects(
          async () => {
            await updateDriverApi('TEST-DRV-AP137', {
              licenseNumber: 'XX-00-18000000000',
            });
          },
          (err: any) => {
            assert.equal(err.message, DRIVING_LICENCE_ERROR_MESSAGE);
            return true;
          }
        );
      } finally {
        (globalThis as any).fetch = origFetch;
      }
    },
  },
];

export async function runDrivingLicenseValidationTests(): Promise<void> {
  let passed = 0;
  for (const t of tests) {
    await t.fn();
    passed++;
    console.log(`PASS: ${t.name}`);
  }
  console.log(`\nAll ${passed}/${tests.length} Driving Licence validation regression tests passed.`);
}

runDrivingLicenseValidationTests().catch((err) => {
  console.error('Driving Licence validation test failed:', err);
  throw err;
});
