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

export type SectorContext = 'producao' | 'order' | 'caixa' | 'gerente' | 'all';

class NotificationService {
  private isSubscribed: boolean = false;
  private activeSector: SectorContext = 'all';

  constructor() {
    this.init();
  }

  public setSector(sector: SectorContext) {
    this.activeSector = sector;
  }

  public getSector(): SectorContext {
    if (this.activeSector !== 'all') return this.activeSector;
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('order') || path.includes('mobile')) return 'order';
      if (path.includes('producao') || path.includes('cozinha')) return 'producao';
      if (path.includes('caixa') || path.includes('venda')) return 'caixa';
    }
    return 'all';
  }

  public init() {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    // 1. ORDER_CREATED -> Audio MUST sound ONLY on Produção/Desktop (NOT Order/Mobile)
    eventBus.subscribe('ORDER_CREATED', (payload) => {
      const current = this.getSector();
      // Strictly suppress audio & toast on Mobile / OrderApp
      if (current === 'order') return;

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

    // 2. ORDER_READY -> Audio MUST sound ONLY on Order/Mobile (NOT Produção)
    eventBus.subscribe('ORDER_READY', (payload) => {
      const current = this.getSector();
      // Strictly suppress audio on Produção
      if (current === 'producao') return;

      const tableInfo = payload.table ? ` (Mesa/Comanda: ${payload.table})` : '';
      const title = `Pedido Pronto #${payload.id.slice(-6).toUpperCase()}`;
      const message = `Pedido pronto para entrega${tableInfo}`;

      this.triggerAlert({
        title,
        message,
        sound: 'order_ready',
        toastType: 'success'
      });
    });

    // 3. ORDER_CANCELLED -> Bidirectional: notifies the opposite sector only
    eventBus.subscribe('ORDER_CANCELLED', (payload) => {
      const current = this.getSector();
      const origin = payload.origin || 'order';

      // Do NOT play audio on the sector that originated the cancellation
      if (origin === current && current !== 'all' && current !== 'gerente') {
        return;
      }

      const title = `Pedido Cancelado #${payload.id.slice(-6).toUpperCase()}`;
      const message = payload.reason ? `Motivo: ${payload.reason}` : 'O pedido foi cancelado pelo operador.';

      this.triggerAlert({
        title,
        message,
        sound: 'order_cancelled',
        toastType: 'warning'
      });
    });

    // 4. NOTIFICATION_REQUESTED -> Filtered by event type and sector
    eventBus.subscribe('NOTIFICATION_REQUESTED', (payload) => {
      const current = this.getSector();

      // Cash flow sound plays ONLY at Caixa or Gerente
      if (payload.type === 'cash_flow' && current !== 'caixa' && current !== 'gerente' && current !== 'all') {
        return;
      }

      // Print error sound plays ONLY in the originating sector or Produção (NEVER Order/Mobile)
      if (payload.type === 'print_error') {
        if (current === 'order') return;
      }

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
