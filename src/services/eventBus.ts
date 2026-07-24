// FluxOS Corporate Event Bus
// Centralized Event Management for Decoupled Printing, Audio, PWA Notifications, and ERP Operations

export type SystemEventType =
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'ORDER_READY'
  | 'ORDER_CANCELLED'
  | 'PRINT_REQUESTED'
  | 'PRINT_COMPLETED'
  | 'NOTIFICATION_REQUESTED'
  | 'CASH_FLOW_UPDATED';

export interface EventPayloadMap {
  ORDER_CREATED: {
    id: string;
    table?: string;
    items: Array<{ name: string; qty: number; notes?: string; status?: string; price?: number }>;
    totalAmount?: number;
    sector?: string;
    clientName?: string;
    timestamp?: number;
    paymentMethod?: string;
    origin?: string;
  };
  ORDER_UPDATED: {
    id: string;
    table?: string;
    itemIndex?: number;
    status: string;
    previousStatus?: string;
    items?: any[];
  };
  ORDER_READY: {
    id: string;
    table?: string;
    itemNames?: string[];
    sector?: string;
  };
  ORDER_CANCELLED: {
    id: string;
    table?: string;
    reason?: string;
    origin?: string;
    sector?: string;
  };
  PRINT_REQUESTED: {
    type: 'sale' | 'comanda' | 'cash_flow' | 'diagnostic' | string;
    data: any;
    targetPrinterId?: string;
    sector?: string;
    jobKey?: string;
    force?: boolean;
  };
  PRINT_COMPLETED: {
    jobKey?: string;
    success: boolean;
    printerId?: string;
    durationMs?: number;
    errorMsg?: string;
  };
  NOTIFICATION_REQUESTED: {
    type: 'order_created' | 'order_ready' | 'order_cancelled' | 'print_error' | 'cash_flow' | 'info' | 'warning';
    title: string;
    message: string;
    sound?: 'order_created' | 'order_ready' | 'order_cancelled' | 'print_error' | 'cash_flow' | 'ding';
    data?: any;
    origin?: string;
    sector?: string;
  };
  CASH_FLOW_UPDATED: {
    type: string;
    amount: number;
    cashierId?: string;
    data?: any;
  };
}

export type EventCallback<T extends SystemEventType> = (payload: EventPayloadMap[T]) => void;

class EventBus {
  private listeners: Map<SystemEventType, Set<EventCallback<any>>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    // Cross-tab synchronization via BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('fluxos_event_bus_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type && event.data.payload) {
            this.emitLocal(event.data.type, event.data.payload, true);
          }
        };
      } catch (e) {
        console.warn('[EventBus] BroadcastChannel not available or restricted:', e);
      }
    }

    // Native Window Event fallback
    if (typeof window !== 'undefined') {
      window.addEventListener('fluxos_native_event_bus', (e: Event) => {
        const customEv = e as CustomEvent<{ type: SystemEventType; payload: any }>;
        if (customEv.detail) {
          this.emitLocal(customEv.detail.type, customEv.detail.payload, true);
        }
      });
    }
  }

  public subscribe<T extends SystemEventType>(type: T, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      const set = this.listeners.get(type);
      if (set) {
        set.delete(callback);
      }
    };
  }

  public publish<T extends SystemEventType>(type: T, payload: EventPayloadMap[T]): void {
    // 1. Emit locally
    this.emitLocal(type, payload, false);

    // 2. Broadcast to other tabs/windows
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type, payload });
      } catch (e) {
        console.warn('[EventBus] Failed to broadcast message:', e);
      }
    }

    // 3. Dispatch native DOM event
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('fluxos_native_event_bus', { detail: { type, payload } }));
      } catch (e) {}
    }
  }

  private emitLocal<T extends SystemEventType>(type: T, payload: EventPayloadMap[T], isExternal: boolean): void {
    const set = this.listeners.get(type);
    if (set && set.size > 0) {
      set.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[EventBus] Error in listener for event ${type}:`, err);
        }
      });
    }
  }
}

export const eventBus = new EventBus();
