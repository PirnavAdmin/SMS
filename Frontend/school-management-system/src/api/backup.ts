import { apiClient } from './client';

export interface BackupModuleCount {
  module: string;
  count: number;
  description: string;
}

export interface BackupStatus {
  databaseEngine: string;
  schoolId?: number;
  schoolName: string;
  totalRecords: number;
  lastBackupDate?: string;
  modules: BackupModuleCount[];
}

export interface BackupSnapshotItem {
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  createdAt: string;
  createdAtFormatted: string;
  createdBy: string;
  totalRecords: number;
  schoolName?: string;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  restoredAt: string;
  restoredBy: string;
  totalRestored: number;
  moduleCounts: Record<string, number>;
}

export const fetchBackupStatusApi = async () => {
  return apiClient<{ success: boolean; data: BackupStatus }>('/api/backup/status', {
    method: 'GET'
  });
};

export const createServerSnapshotApi = async () => {
  return apiClient<{ success: boolean; message: string; data: BackupSnapshotItem }>('/api/backup/create-snapshot', {
    method: 'POST'
  });
};

export const fetchSnapshotsApi = async () => {
  return apiClient<{ success: boolean; data: BackupSnapshotItem[] }>('/api/backup/snapshots', {
    method: 'GET'
  });
};

export const downloadBackupExportApi = async () => {
  const token = localStorage.getItem('auth_token');
  const rawBase = (import.meta.env.VITE_API_URL as string) || '';
  const baseUrl = rawBase.trim().replace(/\/+$/, '');
  const url = `${baseUrl}/api/backup/export`;

  const headers: HeadersInit = {
    'ngrok-skip-browser-warning': 'true',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Backup export failed with status ${res.status}`);
  }

  const disposition = res.headers.get('content-disposition');
  let filename = `sms_backup_${new Date().toISOString().slice(0, 10)}.json`;
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) {
      filename = match[1].replace(/['"]/g, '').trim();
    }
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
  return { filename, size: blob.size };
};

export const downloadSnapshotFileApi = async (fileName: string) => {
  const token = localStorage.getItem('auth_token');
  const rawBase = (import.meta.env.VITE_API_URL as string) || '';
  const baseUrl = rawBase.trim().replace(/\/+$/, '');
  const url = `${baseUrl}/api/backup/snapshots/${encodeURIComponent(fileName)}/download`;

  const headers: HeadersInit = {
    'ngrok-skip-browser-warning': 'true',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Snapshot download failed with status ${res.status}`);
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
  return { fileName, size: blob.size };
};

export const restoreSnapshotApi = async (fileName: string) => {
  return apiClient<{ success: boolean; message: string; data: RestoreResult }>('/api/backup/restore', {
    method: 'POST',
    body: JSON.stringify({ fileName })
  });
};

export const restoreUploadedBackupApi = async (file: File) => {
  const token = localStorage.getItem('auth_token');
  const formData = new FormData();
  formData.append('file', file);

  const headers: HeadersInit = {
    'ngrok-skip-browser-warning': 'true',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const rawBase = (import.meta.env.VITE_API_URL as string) || '';
  const baseUrl = rawBase.trim().replace(/\/+$/, '');
  const url = `${baseUrl}/api/backup/restore`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!res.ok) {
    let msg = `Restore failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson?.message) msg = errJson.message;
    } catch {}
    throw new Error(msg);
  }

  return await res.json() as { success: boolean; message: string; data: RestoreResult };
};
