// FluxOS Decoupled Operational Notification Service
// Listens to EventBus and coordinates sound chimes, visual toasts, and PWA background notifications.

import { eventBus } from './eventBus';
import { audioManager, SoundType } from './audioManager';
import { pwaService } from './pwaService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
}

class NotificationService {
  private isSubscribed: boolean = false;

  constructor() {
    this.init();
  }

  public init() {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    // 1. ORDER_CREATED
    eventBus.subscribe('ORDER_CREATED', (payload) => {
      const tableInfo = payload.table ? ` (Mesa/Comanda: ${payload.table})` : '';
      const itemCount = payload.items?.length || 0;
      const title = `Novo Pedido #${payload.id.slice(-6).toUpperCase()}`;
      const message = `${itemCount} item(ns) registrado(s)${tableInfo}`;

      this.triggerAlert({
        title,
        message,
        sound: 'order_created',
        toastType: 'info'
      });
    });

    // 2. ORDER_READY
    eventBus.subscribe('ORDER_READY', (payload) => {
      const tableInfo = payload.table ? ` (Mesa/Comanda: ${payload.table})` : '';
      const title = `Pedido Pronto! #${payload.id.slice(-6).toUpperCase()}`;
      const message = `Pedido pronto para entrega/servir${tableInfo}`;

      this.triggerAlert({
        title,
        message,
        sound: 'order_ready',
        toastType: 'success'
      });
    });

    // 3. ORDER_CANCELLED
    eventBus.subscribe('ORDER_CANCELLED', (payload) => {
      const title = `Pedido Cancelado #${payload.id.slice(-6).toUpperCase()}`;
      const message = payload.reason ? `Motivo: ${payload.reason}` : 'O pedido foi cancelado pelo operador.';

      this.triggerAlert({
        title,
        message,
        sound: 'order_cancelled',
        toastType: 'warning'
      });
    });

    // 4. NOTIFICATION_REQUESTED
    eventBus.subscribe('NOTIFICATION_REQUESTED', (payload) => {
      let toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
      if (payload.type === 'print_error') toastType = 'error';
      else if (payload.type === 'order_ready' || payload.type === 'cash_flow') toastType = 'success';
      else if (payload.type === 'warning') toastType = 'warning';

      this.triggerAlert({
        title: payload.title,
        message: payload.message,
        sound: payload.sound || (payload.type === 'print_error' ? 'print_error' : payload.type === 'cash_flow' ? 'cash_flow' : 'ding'),
        toastType
      });
    });
  }

  private triggerAlert(params: {
    title: string;
    message: string;
    sound?: SoundType;
    toastType: 'success' | 'error' | 'warning' | 'info';
  }) {
    // A. Foreground Sound Chime
    if (params.sound) {
      audioManager.play(params.sound);
    }

    // B. Visual Toast Dispatch (for UI Toast Containers)
    if (typeof window !== 'undefined') {
      const toastDetail: ToastMessage = {
        id: `toast_${Date.now()}_${Math.random()}`,
        type: params.toastType,
        title: params.title,
        message: params.message,
        timestamp: Date.now()
      };
      window.dispatchEvent(new CustomEvent('adegaos_show_toast', { detail: toastDetail }));
    }

    // C. PWA System/Background Notification if minimized/unfocused
    if (typeof document !== 'undefined' && (document.visibilityState === 'hidden' || !document.hasFocus())) {
      pwaService.sendNotification(params.title, {
        body: params.message,
        tag: `notif_${Date.now()}`,
        vibrate: params.sound === 'order_created' ? [200, 100, 200] : [100, 50, 100]
      });
    }
  }
}

export const notificationService = new NotificationService();
