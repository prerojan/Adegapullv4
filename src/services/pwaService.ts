// FluxOS PWA & Background Notification Service
// Handles Service Worker registration, Web Notifications API permissions, and background/minimized alerts.

export interface NotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  vibrate?: number[];
  data?: any;
}

class PwaService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private permissionGranted: boolean = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (typeof window === 'undefined') return;

    // Check Notification permission status
    if ('Notification' in window) {
      this.permissionGranted = Notification.permission === 'granted';
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        this.swRegistration = reg;
        console.log('[PWA Service] Service Worker registered with scope:', reg.scope);
      } catch (err) {
        console.warn('[PWA Service] Service Worker registration failed:', err);
      }
    }
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      this.permissionGranted = result === 'granted';
      return this.permissionGranted;
    } catch (err) {
      console.warn('[PWA Service] Request permission error:', err);
      return false;
    }
  }

  public getPermissionStatus(): string {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  public async sendNotification(title: string, options: NotificationOptions): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;

    // Check if permission is granted
    if (Notification.permission !== 'granted') {
      const granted = await this.requestNotificationPermission();
      if (!granted) return false;
    }

    const payloadOptions: NotificationOptions = {
      body: options.body,
      icon: options.icon || '/icon.png',
      badge: options.badge || '/logo-bw.png',
      tag: options.tag || `fluxos_notif_${Date.now()}`,
      vibrate: options.vibrate || [200, 100, 200, 100, 200],
      data: options.data || { url: window.location.href }
    };

    try {
      // 1. Try Service Worker showNotification if active
      if (this.swRegistration && this.swRegistration.active) {
        await this.swRegistration.showNotification(title, payloadOptions as any);
        return true;
      }

      // 2. Fallback to standard window Notification instance
      const notif = new Notification(title, payloadOptions);
      notif.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (payloadOptions.data?.url) {
          window.location.href = payloadOptions.data.url;
        }
      };
      return true;
    } catch (err) {
      console.warn('[PWA Service] Failed to dispatch system notification:', err);
      return false;
    }
  }
}

export const pwaService = new PwaService();
