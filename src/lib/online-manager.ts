/**
 * Gestionnaire de connectivité avancé.
 * Health check silencieux — pas d'erreur console.
 */

type Listener = (online: boolean) => void;

class OnlineManager {
  private listeners: Set<Listener> = new Set();
  private _isOnline: boolean = true;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private readonly CHECK_INTERVAL = 60000; // 1 min (au lieu de 30s)
  private checking = false;

  constructor() {
    if (typeof window !== "undefined") {
      this._isOnline = navigator.onLine;

      window.addEventListener("online", () => this.updateStatus(true));
      window.addEventListener("offline", () => this.updateStatus(false));

      this.healthCheckInterval = setInterval(
        () => this.performHealthCheck(),
        this.CHECK_INTERVAL
      );
    }
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  private updateStatus(online: boolean) {
    if (this._isOnline !== online) {
      this._isOnline = online;
      this.listeners.forEach((fn) => fn(online));
    }
  }

  private async performHealthCheck(): Promise<void> {
    // Éviter les checks concurrents
    if (this.checking || !navigator.onLine) return;
    this.checking = true;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch("/api/health", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeout);
      this.updateStatus(res.ok);
    } catch {
      // Silence complet — pas d'erreur console
      if (!navigator.onLine) {
        this.updateStatus(false);
      }
    } finally {
      this.checking = false;
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.listeners.clear();
  }
}

export const onlineManager = new OnlineManager();