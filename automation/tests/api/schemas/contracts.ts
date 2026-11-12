import { SchemaSpec } from '../../utils/schema';

export const AUTH_RESPONSE_SCHEMA: SchemaSpec = {
  userId: { type: 'number', required: true },
  fullName: { type: 'string', required: true, minLength: 1 },
  token: { type: 'string', required: true, minLength: 20 },
  roles: { type: 'array', required: true },
  email: { type: 'string', nullable: true },
  mobileNumber: { type: 'string', nullable: true },
};

export const PUBLIC_BRANDING_SCHEMA: SchemaSpec = {
  schoolName: { type: 'string', required: true },
  logoUrl: { type: 'string', nullable: true },
  tagline: { type: 'string', nullable: true },
  email: { type: 'string', nullable: true },
};

export const ADMISSION_ITEM_SCHEMA: SchemaSpec = {
  id: { type: 'number', required: true },
  registrationNo: { type: 'string', nullable: true },
  status: { type: 'string', nullable: true },
};

export const STUDENT_PAGED_SCHEMA: SchemaSpec = {
  items: { type: 'array', required: true },
  totalRecords: { type: 'number', required: true },
  pageNumber: { type: 'number', required: true },
  pageSize: { type: 'number', required: true },
};
