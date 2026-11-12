import { SmsApiClient } from '../utils/api-client';

export interface TrackedResource {
  method: 'DELETE';
  path: string;
  label: string;
}

/**
 * Tracks disposable API resources created during a test run and deletes them in LIFO order
 * so automated tests never pollute or corrupt existing environment data.
 */
export class TestDataRegistry {
  private readonly cleanupQueue: TrackedResource[] = [];

  trackDelete(path: string, label: string): void {
    this.cleanupQueue.push({ method: 'DELETE', path, label });
  }

  async cleanupAll(api: SmsApiClient): Promise<void> {
    while (this.cleanupQueue.length > 0) {
      const item = this.cleanupQueue.pop()!;
      try {
        const res = await api.delete(item.path);
        if (!res.ok() && res.status() !== 404) {
          console.warn(`[cleanup] ${item.label} (${item.path}) returned HTTP ${res.status()}`);
        }
      } catch (err) {
        console.warn(`[cleanup] Failed to clean up ${item.label}: ${String(err)}`);
      }
    }
  }
}
