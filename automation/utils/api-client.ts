import { APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { getConfig } from './env';

export interface AuthSession {
  userId: number;
  fullName: string;
  token: string;
  roles: string[];
  email?: string;
  mobileNumber?: string;
  branch?: string;
}

export class SmsApiClient {
  readonly baseUrl: string;
  private ctx: APIRequestContext;
  private token: string | null = null;
  private roleHeader = '';
  private branchHeader = '';
  private academicYearHeader = '';

  constructor(ctx: APIRequestContext, baseUrl?: string) {
    this.ctx = ctx;
    this.baseUrl = (baseUrl || getConfig().apiUrl).replace(/\/+$/, '');
  }

  static async create(baseUrl?: string): Promise<SmsApiClient> {
    const url = (baseUrl || getConfig().apiUrl).replace(/\/+$/, '');
    const ctx = await playwrightRequest.newContext({ baseURL: url });
    return new SmsApiClient(ctx, url);
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  setContextHeaders(opts: { role?: string; branch?: string; academicYear?: string }): void {
    if (opts.role !== undefined) this.roleHeader = opts.role;
    if (opts.branch !== undefined) this.branchHeader = opts.branch;
    if (opts.academicYear !== undefined) this.academicYearHeader = opts.academicYear;
  }

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (this.roleHeader) headers['X-User-Role'] = this.roleHeader;
    if (this.branchHeader) headers['X-Branch-Id'] = this.branchHeader;
    if (this.academicYearHeader) headers['X-Academic-Year-Id'] = this.academicYearHeader;
    return { ...headers, ...(extra || {}) };
  }

  async login(emailOrPhone: string, password: string, portal?: string): Promise<{ status: number; body: any }> {
    const res = await this.ctx.post(`${this.baseUrl}/api/auth/login`, {
      data: { emailOrPhone, password, ...(portal ? { portal } : {}) },
      headers: { 'Content-Type': 'application/json' },
    });
    const text = await res.text();
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (res.ok() && body?.token) {
      this.token = body.token;
      this.roleHeader = Array.isArray(body.roles) && body.roles.length > 0 ? body.roles[0] : '';
      if (body.branch) this.branchHeader = body.branch;
    }
    return { status: res.status(), body };
  }

  async get(path: string, headers?: Record<string, string>) {
    return this.ctx.get(`${this.baseUrl}${path}`, { headers: this.buildHeaders(headers) });
  }

  async post(path: string, data?: unknown, headers?: Record<string, string>) {
    return this.ctx.post(`${this.baseUrl}${path}`, { data, headers: this.buildHeaders(headers) });
  }

  async put(path: string, data?: unknown, headers?: Record<string, string>) {
    return this.ctx.put(`${this.baseUrl}${path}`, { data, headers: this.buildHeaders(headers) });
  }

  async patch(path: string, data?: unknown, headers?: Record<string, string>) {
    return this.ctx.patch(`${this.baseUrl}${path}`, { data, headers: this.buildHeaders(headers) });
  }

  async delete(path: string, headers?: Record<string, string>) {
    return this.ctx.delete(`${this.baseUrl}${path}`, { headers: this.buildHeaders(headers) });
  }

  async isBackendReachable(): Promise<boolean> {
    try {
      const res = await this.ctx.get(`${this.baseUrl}/api/Settings/public-branding`, { timeout: 3000 });
      return res.status() < 500;
    } catch {
      return false;
    }
  }
}
