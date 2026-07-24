// FluxOS Independent Background Print Service
// Handles printing queue, deduplication, audit logging, and hardware dispatch completely decoupled from UI views.

import { eventBus, EventPayloadMap } from './eventBus';
import { triggerThermalPrint, SpoolJob, getSavedPrinters } from '../lib/thermalPrinter';

export interface PrintQueueItem {
  id: string;
  jobKey: string;
  type: string;
  data: any;
  targetPrinterId?: string;
  sector?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  attempts: number;
  maxAttempts: number;
  createdTime: number;
  errorMsg?: string;
}

class PrintService {
  private queue: PrintQueueItem[] = [];
  private isProcessing: boolean = false;
  private recentJobHashes: Map<string, number> = new Map();
  private isSubscribed: boolean = false;

  constructor() {
    this.loadPersistedQueue();
    this.init();
  }

  public init() {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    // 1. Listen for ORDER_CREATED (Auto-print Kitchen Comanda if enabled)
    eventBus.subscribe('ORDER_CREATED', (payload) => {
      const autoPrintEnabled = localStorage.getItem('adegaos_auto_print_comanda') !== 'false';
      if (!autoPrintEnabled) return;

      const jobKey = `comanda_order_${payload.id}_${JSON.stringify(payload.items)}`;
      this.enqueuePrint({
        type: 'comanda',
        data: {
          identifier: payload.table || payload.id.slice(-6).toUpperCase(),
          table: payload.table,
          date: new Date().toLocaleDateString('pt-BR'),
          time: new Date().toLocaleTimeString('pt-BR'),
          sector: payload.sector || 'cozinha',
          items: payload.items
        },
        sector: payload.sector || 'cozinha',
        jobKey
      });
    });

    // 2. Listen for PRINT_REQUESTED
    eventBus.subscribe('PRINT_REQUESTED', (payload) => {
      this.enqueuePrint(payload);
    });

    // 3. Listen for CASH_FLOW_UPDATED
    eventBus.subscribe('CASH_FLOW_UPDATED', (payload) => {
      if (payload.type === 'close' || payload.type === 'fechamento') {
        const jobKey = `cash_flow_${Date.now()}`;
        this.enqueuePrint({
          type: 'cash_flow',
          data: payload.data || payload,
          jobKey
        });
      }
    });

    // Kick off initial processing loop
    setTimeout(() => this.processQueue(), 500);
  }

  public enqueuePrint(params: EventPayloadMap['PRINT_REQUESTED']): string {
    const jobKey = params.jobKey || `job_${params.type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Deduplication check: ignore identical job within 30 seconds unless forced
    const now = Date.now();
    const lastTime = this.recentJobHashes.get(jobKey);
    if (!params.force && lastTime && now - lastTime < 30000) {
      console.log(`[PrintService] Deduplicated job ${jobKey} (already enqueued ${Math.round((now - lastTime)/1000)}s ago)`);
      return jobKey;
    }

    this.recentJobHashes.set(jobKey, now);

    const newItem: PrintQueueItem = {
      id: `PQ_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      jobKey,
      type: params.type,
      data: params.data,
      targetPrinterId: params.targetPrinterId,
      sector: params.sector,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdTime: now
    };

    this.queue.push(newItem);
    this.persistQueue();

    // Trigger processing
    this.processQueue();
    return newItem.id;
  }

  private async processQueue() {
    if (this.isProcessing) return;

    const pendingItem = this.queue.find((q) => q.status === 'pending');
    if (!pendingItem) return;

    this.isProcessing = true;
    pendingItem.status = 'processing';
    pendingItem.attempts += 1;
    this.persistQueue();

    try {
      const result = await triggerThermalPrint(
        pendingItem.type,
        pendingItem.data,
        pendingItem.targetPrinterId || pendingItem.sector
      );

      if (result.success) {
        pendingItem.status = 'completed';
        eventBus.publish('PRINT_COMPLETED', {
          jobKey: pendingItem.jobKey,
          success: true,
          printerId: pendingItem.targetPrinterId,
          durationMs: result.durationMs
        });
      } else {
        if (pendingItem.attempts < pendingItem.maxAttempts) {
          pendingItem.status = 'pending'; // Retry later
        } else {
          pendingItem.status = 'error';
          pendingItem.errorMsg = result.errorMsg || 'Falha no envio da impressão';

          eventBus.publish('PRINT_COMPLETED', {
            jobKey: pendingItem.jobKey,
            success: false,
            printerId: pendingItem.targetPrinterId,
            errorMsg: pendingItem.errorMsg
          });

          // Notify error via EventBus
          eventBus.publish('NOTIFICATION_REQUESTED', {
            type: 'print_error',
            title: 'Erro na Impressora Térmica',
            message: `Não foi possível imprimir (${pendingItem.type}). Verifique a conexão.`,
            sound: 'print_error'
          });
        }
      }
    } catch (err: any) {
      console.error('[PrintService] Execution error:', err);
      pendingItem.status = 'error';
      pendingItem.errorMsg = err.message || String(err);

      eventBus.publish('PRINT_COMPLETED', {
        jobKey: pendingItem.jobKey,
        success: false,
        errorMsg: pendingItem.errorMsg
      });
    } finally {
      this.isProcessing = false;
      this.persistQueue();

      // Continue processing remaining queue
      if (this.queue.some((q) => q.status === 'pending')) {
        setTimeout(() => this.processQueue(), 200);
      }
    }
  }

  public reprocessJob(jobId: string): boolean {
    const item = this.queue.find((q) => q.id === jobId);
    if (!item) return false;

    item.status = 'pending';
    item.attempts = 0;
    item.errorMsg = undefined;
    this.persistQueue();
    this.processQueue();
    return true;
  }

  public clearCompleted() {
    this.queue = this.queue.filter((q) => q.status === 'pending' || q.status === 'processing');
    this.persistQueue();
  }

  public getQueue(): PrintQueueItem[] {
    return [...this.queue];
  }

  private persistQueue() {
    try {
      localStorage.setItem('adegaos_print_queue_v2', JSON.stringify(this.queue.slice(-100)));
    } catch (e) {}
  }

  private loadPersistedQueue() {
    try {
      const raw = localStorage.getItem('adegaos_print_queue_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Reset stuck processing items back to pending on restart
          this.queue = parsed.map((item: PrintQueueItem) => {
            if (item.status === 'processing') item.status = 'pending';
            return item;
          });
        }
      }
    } catch (e) {}
  }
}

export const printService = new PrintService();
