export type NetworkChangeCallback = (isOnline: boolean) => void;

class NetworkService {
  private listeners: Set<NetworkChangeCallback> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  public isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  }

  public subscribe(callback: NetworkChangeCallback): () => void {
    this.listeners.add(callback);
    // Call immediately with current state
    callback(this.isOnline());
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  private handleOnline = () => {
    this.notify(true);
  };

  private handleOffline = () => {
    this.notify(false);
  };

  private notify(isOnline: boolean) {
    this.listeners.forEach((callback) => {
      try {
        callback(isOnline);
      } catch (err) {
        console.error('Error in network subscriber:', err);
      }
    });
  }
}

export const networkService = new NetworkService();
