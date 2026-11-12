import { expect } from '@playwright/test';

export type PrimitiveType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface FieldRule {
  type: PrimitiveType;
  required?: boolean;
  nullable?: boolean;
  minLength?: number;
}

export type SchemaSpec = Record<string, FieldRule>;

/**
 * Validates a JSON object against a declarative contract specification.
 */
export function assertMatchesSchema(
  payload: unknown,
  schema: SchemaSpec,
  label = 'response'
): void {
  expect(payload, `${label} must be a non-null object`).toBeTruthy();
  expect(typeof payload, `${label} must be an object`).toBe('object');
  const obj = payload as Record<string, unknown>;

  for (const [key, rule] of Object.entries(schema)) {
    const hasKey = Object.prototype.hasOwnProperty.call(obj, key);
    const val = obj[key];

    if (rule.required && (!hasKey || val === undefined)) {
      throw new Error(`${label}.${key} is required but missing`);
    }

    if (!hasKey || val === undefined) continue;

    if (val === null) {
      if (!rule.nullable) {
        throw new Error(`${label}.${key} must not be null`);
      }
      continue;
    }

    if (rule.type === 'array') {
      expect(Array.isArray(val), `${label}.${key} should be an array`).toBe(true);
    } else if (rule.type === 'object') {
      expect(typeof val === 'object' && !Array.isArray(val), `${label}.${key} should be an object`).toBe(true);
    } else {
      expect(typeof val, `${label}.${key} should be ${rule.type}`).toBe(rule.type);
      if (rule.type === 'string' && rule.minLength !== undefined) {
        expect((val as string).length, `${label}.${key} minLength ${rule.minLength}`).toBeGreaterThanOrEqual(
          rule.minLength
        );
      }
    }
  }
}

export function assertSuccessEnvelope(body: any, label = 'envelope'): any {
  expect(body, `${label} should be defined`).toBeTruthy();
  if (typeof body === 'object' && 'success' in body) {
    expect(body.success, `${label}.success should be true`).toBe(true);
    return body.data;
  }
  return body;
}
