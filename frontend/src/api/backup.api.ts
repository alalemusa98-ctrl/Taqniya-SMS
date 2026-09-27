import { apiClient } from './client';

export type BackupType = 'full' | 'database' | 'files';

export interface BackupItem {
  filename: string;
  type: BackupType;
  size: string;
  size_bytes: number;
  created_at: string;
  note: string | null;
}

export interface BackupSummary {
  total_backups: number;
  total_size: string;
  full_count: number;
  database_count: number;
  files_count: number;
  storage_directory: string;
}

export interface BackupListResponse {
  summary: BackupSummary;
  backups: BackupItem[];
}

export interface CreateBackupDto {
  type?: BackupType;
  note?: string;
}

export const backupApi = {
  async listBackups(type?: BackupType): Promise<BackupListResponse> {
    const params = type ? { type } : undefined;
    const res = await apiClient.get<{ success: boolean; data: BackupListResponse }>('/backups', { params });
    return res.data.data;
  },

  async createBackup(dto: CreateBackupDto = {}): Promise<BackupItem> {
    const res = await apiClient.post<{ success: boolean; message: string; data: BackupItem }>('/backups/create', dto);
    return res.data.data;
  },

  async uploadBackup(file: File): Promise<BackupItem> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{ success: boolean; message: string; data: BackupItem }>('/backups/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  async restoreBackup(filename: string): Promise<{ filename: string; restored_at: string }> {
    const res = await apiClient.post<{ success: boolean; message: string; data: { filename: string; restored_at: string } }>(
      `/backups/restore/${encodeURIComponent(filename)}`,
    );
    return res.data.data;
  },

  async deleteBackup(filename: string): Promise<{ filename: string; deleted_at: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string; data: { filename: string; deleted_at: string } }>(
      `/backups/${encodeURIComponent(filename)}`,
    );
    return res.data.data;
  },

  async downloadBackup(filename: string): Promise<void> {
    const res = await apiClient.get(`/backups/download/${encodeURIComponent(filename)}`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/zip' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  getDownloadUrl(filename: string): string {
    const baseURL = (apiClient.defaults.baseURL || '/api/v1').replace(/\/$/, '');
    return `${baseURL}/backups/download/${encodeURIComponent(filename)}`;
  },
};
