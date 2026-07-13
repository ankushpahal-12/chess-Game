import { useState, useEffect } from 'react';

export type PingCallback = (pingMs: number) => void;

class PingService {
  private currentPing: number = 0;
  private intervalId: any = null;
  private listeners: Set<PingCallback> = new Set();
  private apiBaseUrl: string = 'http://localhost:5000';

  constructor() {
    if (typeof window !== 'undefined') {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      this.apiBaseUrl = socketUrl;
    }
  }

  public getPing(): number {
    return this.currentPing;
  }

  public subscribe(callback: PingCallback): () => void {
    this.listeners.add(callback);
    callback(this.currentPing);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public startPinging(intervalMs: number = 2000) {
    if (this.intervalId) return;

    const doPing = async () => {
      const startTime = Date.now();
      try {
        const response = await fetch(`${this.apiBaseUrl}/health`, {
          method: 'GET',
          cache: 'no-store',
          // Set a low timeout so we don't hang
          signal: AbortSignal.timeout(5000)
        });
        if (response.ok) {
          const latency = Date.now() - startTime;
          this.currentPing = latency;
          this.notify();
        } else {
          this.currentPing = -1;
          this.notify();
        }
      } catch (err) {
        this.currentPing = -1; // -1 means disconnected/unreachable
        this.notify();
      }
    };

    // Run first ping immediately
    doPing();
    this.intervalId = setInterval(doPing, intervalMs);
  }

  public stopPinging() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private notify() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.currentPing);
      } catch (err) {
        console.error('Error in ping subscriber:', err);
      }
    });
  }
}

export const pingService = new PingService();

// Custom hook to subscribe to ping changes in components
export function usePing() {
  const [ping, setPing] = useState(pingService.getPing());

  useEffect(() => {
    return pingService.subscribe(setPing);
  }, []);

  return ping;
}

export default pingService;

