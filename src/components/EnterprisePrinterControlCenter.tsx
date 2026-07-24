import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ProductionCategoryConfigManager from './ProductionCategoryConfigManager';
import {
  Printer,
  Wifi,
  Usb,
  Bluetooth,
  Sliders,
  FileText,
  Play,
  RefreshCw,
  Check,
  X,
  Plus,
  Trash2,
  Activity,
  Terminal,
  ToggleLeft,
  ToggleRight,
  Database,
  Radio,
  Server,
  Clock,
  Key,
  AlertCircle,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Cpu,
  Table
} from 'lucide-react';
import {
  PrinterDevice,
  getSavedPrinters,
  savePrinters,
  triggerThermalPrint,
  getSpoolQueue,
  addSpoolJob,
  clearSpoolQueue,
  SpoolJob,
  generateEscPosBuffer,
  generateReceiptText,
  bufferToHexPreview,
  connectAndPrintWebUSB,
  connectAndPrintWebSerial
} from '../lib/thermalPrinter';

export interface EnterprisePrinterConfig {
  id: string;
  name: string;
  enabled: boolean;
  
  // 1. Conexão Condicional
  connection: {
    type: 'system' | 'usb' | 'serial' | 'network' | 'bluetooth';
    // USB
    usbDeviceId?: string;
    usbVendorId?: string;
    usbProductId?: string;
    usbDeviceName?: string;
    // Serial
    serialPort: string;
    baudRate: number;
    parity: 'none' | 'even' | 'odd';
    stopBits: 1 | 2;
    flowControl: 'none' | 'hardware' | 'software';
    // Network TCP/IP
    ip: string;
    tcpPort: number;
    // Bluetooth
    btDeviceName: string;
    btMac: string;
    btServiceUuid: string;
    // Common
    timeoutMs: number;
  };

  // 2. Impressora Hardware & Driver
  hardware: {
    model: string;
    manufacturer: string;
    driver: 'system' | 'webusb' | 'raw_tcp' | 'serial_com' | 'virtual';
    paperSize: '58mm' | '80mm';
    columnsCount: number;
    autoCut: boolean;
    cashDrawer: boolean;
    drawerCode: string;
    buzzer: boolean;
  };

  // 3. Layout da Impressão (ESC/POS Params)
  layout: {
    fontFamily: 'font_a' | 'font_b' | 'font_c';
    scaleHorizontal: 1 | 2 | 3 | 4;
    scaleVertical: 1 | 2 | 3 | 4;
    bold: boolean;
    underline: boolean;
    italic: boolean;
    inverted: boolean;
    align: 'left' | 'center' | 'right';
    lineSpacing: number; // dots
    blockSpacing: number; // blank lines
    density: 'low' | 'medium' | 'high' | 'ultra';
    speedMmS: number;
  };

  // 4. Documento (Matrix Table per element)
  document: {
    header: { visible: boolean; font: 'font_a' | 'font_b'; size: 'normal' | 'double' | 'large'; bold: boolean; align: 'left' | 'center' | 'right' };
    logo: { visible: boolean; align: 'left' | 'center' | 'right' };
    orderNumber: { visible: boolean; font: 'font_a' | 'font_b'; size: 'normal' | 'double' | 'large'; bold: boolean; align: 'left' | 'center' | 'right' };
    customerName: { visible: boolean; font: 'font_a' | 'font_b'; size: 'normal' | 'double'; bold: boolean; align: 'left' | 'center' | 'right' };
    dateTime: { visible: boolean; align: 'left' | 'center' | 'right' };
    itemsTable: { visible: boolean; font: 'font_a' | 'font_b'; size: 'normal' | 'double'; bold: boolean; align: 'left' | 'center' | 'right' };
    notes: { visible: boolean; font: 'font_a' | 'font_b'; bold: boolean; align: 'left' | 'center' | 'right' };
    totals: { visible: boolean; font: 'font_a' | 'font_b'; size: 'normal' | 'double'; bold: boolean; align: 'left' | 'center' | 'right' };
    payments: { visible: boolean; font: 'font_a' | 'font_b'; bold: boolean; align: 'left' | 'center' | 'right' };
    qrCode: { visible: boolean; size: number; align: 'left' | 'center' | 'right' };
    barcode: { visible: boolean; align: 'left' | 'center' | 'right' };
    footer: { visible: boolean; font: 'font_a' | 'font_b'; size: 'normal' | 'double'; bold: boolean; align: 'left' | 'center' | 'right' };
  };

  // 5. Regras & Setores
  rules: {
    autoPrintOnSale: boolean;
    manualPrintAllowed: boolean;
    copiesCount: number;
    sectorRouting: {
      caixa: boolean;
      cozinha: boolean;
      bar: boolean;
      producao: boolean;
      delivery: boolean;
    };
    priority: 'low' | 'normal' | 'high' | 'critical';
  };

  // 6. Diagnóstico & Telemetria
  diagnostics: {
    status: 'online' | 'ready' | 'no_device' | 'error' | 'untested';
    latencyMs: number | null;
    lastPrintTime: string;
    lastPrintBytes: number;
    lastErrorCode?: string;
  };
}

// Default Configuration Seed
export const DEFAULT_ENTERPRISE_CONFIGS: EnterprisePrinterConfig[] = [
  {
    id: 'prn_main_caixa',
    name: 'IMP-01 [CAIXA PRINCIPAL]',
    enabled: true,
    connection: {
      type: 'system',
      usbDeviceId: '',
      usbVendorId: '',
      usbProductId: '',
      usbDeviceName: 'Impressora USB Genérica ESC/POS',
      serialPort: 'COM1',
      baudRate: 9600,
      parity: 'none',
      stopBits: 1,
      flowControl: 'none',
      ip: '192.168.1.200',
      tcpPort: 9100,
      btDeviceName: 'POS-58-BT',
      btMac: '00:11:22:33:44:55',
      btServiceUuid: '00001101-0000-1000-8000-00805f9b34fb',
      timeoutMs: 2000
    },
    hardware: {
      model: 'HPRT TP808',
      manufacturer: 'HPRT',
      driver: 'system',
      paperSize: '58mm',
      columnsCount: 32,
      autoCut: true,
      cashDrawer: true,
      drawerCode: '27,112,0,25,250',
      buzzer: true
    },
    layout: {
      fontFamily: 'font_a',
      scaleHorizontal: 1,
      scaleVertical: 1,
      bold: false,
      underline: false,
      italic: false,
      inverted: false,
      align: 'left',
      lineSpacing: 30,
      blockSpacing: 1,
      density: 'high',
      speedMmS: 250
    },
    document: {
      header: { visible: true, font: 'font_a', size: 'double', bold: true, align: 'center' },
      logo: { visible: true, align: 'center' },
      orderNumber: { visible: true, font: 'font_a', size: 'double', bold: true, align: 'left' },
      customerName: { visible: true, font: 'font_a', size: 'normal', bold: true, align: 'left' },
      dateTime: { visible: true, align: 'left' },
      itemsTable: { visible: true, font: 'font_a', size: 'normal', bold: false, align: 'left' },
      notes: { visible: true, font: 'font_b', bold: false, align: 'left' },
      totals: { visible: true, font: 'font_a', size: 'double', bold: true, align: 'left' },
      payments: { visible: true, font: 'font_a', bold: false, align: 'left' },
      qrCode: { visible: true, size: 4, align: 'center' },
      barcode: { visible: true, align: 'center' },
      footer: { visible: true, font: 'font_b', size: 'normal', bold: false, align: 'center' }
    },
    rules: {
      autoPrintOnSale: true,
      manualPrintAllowed: true,
      copiesCount: 1,
      sectorRouting: {
        caixa: true,
        cozinha: false,
        bar: false,
        producao: false,
        delivery: true
      },
      priority: 'high'
    },
    diagnostics: {
      status: 'untested',
      latencyMs: null,
      lastPrintTime: '-',
      lastPrintBytes: 0
    }
  },
  {
    id: 'prn_cozinha_01',
    name: 'IMP-02 [COZINHA & PREPARO]',
    enabled: true,
    connection: {
      type: 'network',
      usbDeviceId: '',
      serialPort: 'COM2',
      baudRate: 115200,
      parity: 'none',
      stopBits: 1,
      flowControl: 'none',
      ip: '192.168.1.201',
      tcpPort: 9100,
      btDeviceName: '',
      btMac: '',
      btServiceUuid: '',
      timeoutMs: 3000
    },
    hardware: {
      model: 'Bematech MP-4200 TH',
      manufacturer: 'Bematech',
      driver: 'raw_tcp',
      paperSize: '80mm',
      columnsCount: 48,
      autoCut: true,
      cashDrawer: false,
      drawerCode: '',
      buzzer: true
    },
    layout: {
      fontFamily: 'font_a',
      scaleHorizontal: 2,
      scaleVertical: 2,
      bold: true,
      underline: false,
      italic: false,
      inverted: false,
      align: 'left',
      lineSpacing: 36,
      blockSpacing: 2,
      density: 'ultra',
      speedMmS: 200
    },
    document: {
      header: { visible: true, font: 'font_a', size: 'large', bold: true, align: 'center' },
      logo: { visible: false, align: 'center' },
      orderNumber: { visible: true, font: 'font_a', size: 'large', bold: true, align: 'left' },
      customerName: { visible: true, font: 'font_a', size: 'double', bold: true, align: 'left' },
      dateTime: { visible: true, align: 'left' },
      itemsTable: { visible: true, font: 'font_a', size: 'double', bold: true, align: 'left' },
      notes: { visible: true, font: 'font_a', bold: true, align: 'left' },
      totals: { visible: false, font: 'font_a', size: 'normal', bold: false, align: 'left' },
      payments: { visible: false, font: 'font_a', bold: false, align: 'left' },
      qrCode: { visible: false, size: 3, align: 'center' },
      barcode: { visible: false, align: 'center' },
      footer: { visible: false, font: 'font_b', size: 'normal', bold: false, align: 'center' }
    },
    rules: {
      autoPrintOnSale: true,
      manualPrintAllowed: true,
      copiesCount: 1,
      sectorRouting: {
        caixa: false,
        cozinha: true,
        bar: false,
        producao: true,
        delivery: false
      },
      priority: 'critical'
    },
    diagnostics: {
      status: 'untested',
      latencyMs: null,
      lastPrintTime: '-',
      lastPrintBytes: 0
    }
  }
];

interface EnterprisePrinterControlCenterProps {
  theme: 'dark' | 'light';
}

export default function EnterprisePrinterControlCenter({ theme }: EnterprisePrinterControlCenterProps) {
  // Load persistent configurations
  const [configs, setConfigs] = useState<EnterprisePrinterConfig[]>(() => {
    try {
      const raw = localStorage.getItem('adegaos_enterprise_printer_configs_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load enterprise configs v2:', e);
    }
    return DEFAULT_ENTERPRISE_CONFIGS;
  });

  const [selectedId, setSelectedId] = useState<string>(configs[0]?.id || 'prn_main_caixa');
  const [activeTab, setActiveTab] = useState<'connection' | 'hardware' | 'layout' | 'document' | 'rules' | 'diagnostics'>('connection');

  // Spooler Queue & Logs State
  const [spoolQueue, setSpoolQueue] = useState<SpoolJob[]>(() => getSpoolQueue());
  const [streamLogs, setStreamLogs] = useState<Array<{ id: string; time: string; level: 'info' | 'warn' | 'error'; text: string }>>([
    { id: '1', time: new Date().toLocaleTimeString(), level: 'info', text: 'SISTEMA: Motor Spooler ESC/POS Conectado [AdegaOS Enterprise v2.5]' }
  ]);

  // Sync Spool Queue Event
  useEffect(() => {
    const handleSpoolUpdate = () => {
      setSpoolQueue(getSpoolQueue());
    };
    window.addEventListener('adegaos_spool_updated', handleSpoolUpdate);
    return () => window.removeEventListener('adegaos_spool_updated', handleSpoolUpdate);
  }, []);

  // Update draft printer configuration and persist to localStorage
  const updateCurrentConfig = (mutator: (draft: EnterprisePrinterConfig) => void) => {
    setConfigs(prev => {
      const copy = JSON.parse(JSON.stringify(prev)) as EnterprisePrinterConfig[];
      const idx = copy.findIndex(c => c.id === selectedId);
      if (idx !== -1) {
        mutator(copy[idx]);
        localStorage.setItem('adegaos_enterprise_printer_configs_v2', JSON.stringify(copy));

        // Sync with adegaos_printers_list for global POS usage
        const globalPrinters: PrinterDevice[] = copy.map(c => ({
          id: c.id,
          name: c.name,
          sector: Object.keys(c.rules.sectorRouting).find(k => (c.rules.sectorRouting as any)[k]) || 'caixa',
          method: c.connection.type === 'usb' ? 'webusb' : c.connection.type === 'serial' ? 'webserial' : c.connection.type === 'network' ? 'network' : 'system',
          connectionIp: c.connection.ip ? `${c.connection.ip}:${c.connection.tcpPort}` : '',
          paperSize: c.hardware.paperSize,
          enabled: c.enabled,
          autoCut: c.hardware.autoCut,
          copies: c.rules.copiesCount || 1
        }));
        savePrinters(globalPrinters);
      }
      return copy;
    });
  };

  // New Profile Modal State
  const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState(false);
  const [newProfileNameInput, setNewProfileNameInput] = useState('');
  const [newProfileTypeInput, setNewProfileTypeInput] = useState<'usb' | 'network' | 'serial' | 'bluetooth'>('usb');

  // Delete Confirmation Modal State
  const [profileToDelete, setProfileToDelete] = useState<EnterprisePrinterConfig | null>(null);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  const currentConfig = configs.find(c => c.id === selectedId) || configs[0];

  // Helper for opening new printer profile modal
  const handleOpenNewProfileModal = () => {
    setNewProfileNameInput(`Impressora ${configs.length + 1}`);
    setNewProfileTypeInput('usb');
    setIsNewProfileModalOpen(true);
  };

  // Confirm creation of new profile with custom name
  const handleConfirmCreateProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = newProfileNameInput.trim() || `Impressora ${configs.length + 1}`;
    const newId = `prn_${Date.now()}`;
    const newObj: EnterprisePrinterConfig = {
      ...JSON.parse(JSON.stringify(DEFAULT_ENTERPRISE_CONFIGS[0])),
      id: newId,
      name: finalName,
      connection: {
        ...DEFAULT_ENTERPRISE_CONFIGS[0].connection,
        type: newProfileTypeInput
      },
      diagnostics: {
        status: 'untested',
        latencyMs: null,
        lastPrintTime: '-',
        lastPrintBytes: 0
      }
    };
    const updated = [...configs, newObj];
    setConfigs(updated);
    setSelectedId(newId);
    localStorage.setItem('adegaos_enterprise_printer_configs_v2', JSON.stringify(updated));

    // Global POS sync
    const globalPrinters: PrinterDevice[] = updated.map(c => ({
      id: c.id,
      name: c.name,
      sector: Object.keys(c.rules.sectorRouting).find(k => (c.rules.sectorRouting as any)[k]) || 'caixa',
      method: c.connection.type === 'usb' ? 'webusb' : c.connection.type === 'serial' ? 'webserial' : c.connection.type === 'network' ? 'network' : 'system',
      connectionIp: c.connection.ip ? `${c.connection.ip}:${c.connection.tcpPort}` : '',
      paperSize: c.hardware.paperSize,
      enabled: c.enabled,
      autoCut: c.hardware.autoCut,
      copies: c.rules.copiesCount || 1
    }));
    savePrinters(globalPrinters);

    setIsNewProfileModalOpen(false);
  };

  // Helper for initiating deletion modal
  const handleOpenDeleteModal = () => {
    if (configs.length <= 1) {
      setDeleteErrorMsg('É necessário manter pelo menos 1 perfil de impressora cadastrado.');
      setTimeout(() => setDeleteErrorMsg(null), 4000);
      return;
    }
    setProfileToDelete(currentConfig);
  };

  // Confirm deletion of profile
  const handleConfirmDeleteProfile = () => {
    if (!profileToDelete) return;
    if (configs.length <= 1) {
      setProfileToDelete(null);
      return;
    }
    const updated = configs.filter(c => c.id !== profileToDelete.id);
    setConfigs(updated);
    const nextSelected = updated[0]?.id || '';
    setSelectedId(nextSelected);
    localStorage.setItem('adegaos_enterprise_printer_configs_v2', JSON.stringify(updated));

    // Global POS sync
    const globalPrinters: PrinterDevice[] = updated.map(c => ({
      id: c.id,
      name: c.name,
      sector: Object.keys(c.rules.sectorRouting).find(k => (c.rules.sectorRouting as any)[k]) || 'caixa',
      method: c.connection.type === 'usb' ? 'webusb' : c.connection.type === 'serial' ? 'webserial' : c.connection.type === 'network' ? 'network' : 'system',
      connectionIp: c.connection.ip ? `${c.connection.ip}:${c.connection.tcpPort}` : '',
      paperSize: c.hardware.paperSize,
      enabled: c.enabled,
      autoCut: c.hardware.autoCut,
      copies: c.rules.copiesCount || 1
    }));
    savePrinters(globalPrinters);

    setProfileToDelete(null);
  };

  // REAL WebUSB Discovery Action
  const [discoveringUsb, setDiscoveringUsb] = useState(false);
  const handleDiscoverWebUsbDevice = async () => {
    if (!('usb' in navigator)) {
      alert('Seu navegador não possui suporte à API WebUSB. Utilize o Google Chrome ou Edge.');
      return;
    }
    setDiscoveringUsb(true);
    try {
      const device = await (navigator as any).usb.requestDevice({ filters: [] });
      if (device) {
        const vid = `0x${device.vendorId.toString(16).toUpperCase().padStart(4, '0')}`;
        const pid = `0x${device.productId.toString(16).toUpperCase().padStart(4, '0')}`;
        const devName = device.productName || `USB Device (${vid}:${pid})`;

        updateCurrentConfig(draft => {
          draft.connection.usbVendorId = vid;
          draft.connection.usbProductId = pid;
          draft.connection.usbDeviceName = devName;
          draft.diagnostics.status = 'ready';
        });

        setStreamLogs(prev => [
          { id: Date.now().toString(), time: new Date().toLocaleTimeString(), level: 'info', text: `USB: Dispositivo detectado VID=${vid} PID=${pid} (${devName})` },
          ...prev
        ]);
      }
    } catch (err: any) {
      setStreamLogs(prev => [
        { id: Date.now().toString(), time: new Date().toLocaleTimeString(), level: 'warn', text: `USB PROMPT: ${err.message}` },
        ...prev
      ]);
    } finally {
      setDiscoveringUsb(false);
    }
  };

  // REAL WebSerial Discovery Action
  const [discoveringSerial, setDiscoveringSerial] = useState(false);
  const handleDiscoverWebSerialPort = async () => {
    if (!('serial' in navigator)) {
      alert('Seu navegador não possui suporte à API WebSerial.');
      return;
    }
    setDiscoveringSerial(true);
    try {
      const port = await (navigator as any).serial.requestPort();
      if (port) {
        const info = port.getInfo ? port.getInfo() : {};
        const vid = info.usbVendorId ? `0x${info.usbVendorId.toString(16).toUpperCase()}` : 'COM';
        updateCurrentConfig(draft => {
          draft.connection.serialPort = `COM (${vid})`;
          draft.diagnostics.status = 'ready';
        });

        setStreamLogs(prev => [
          { id: Date.now().toString(), time: new Date().toLocaleTimeString(), level: 'info', text: `SERIAL: Porta autorizada pelo usuário (${vid})` },
          ...prev
        ]);
      }
    } catch (err: any) {
      setStreamLogs(prev => [
        { id: Date.now().toString(), time: new Date().toLocaleTimeString(), level: 'warn', text: `SERIAL PROMPT: ${err.message}` },
        ...prev
      ]);
    } finally {
      setDiscoveringSerial(false);
    }
  };

  // REAL Test Print Execution & Diagnostics
  const [isTestPrinting, setIsTestPrinting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; durationMs: number; bytesCount: number; errorMsg?: string } | null>(null);

  const handleTriggerFullTestPrint = async () => {
    setIsTestPrinting(true);
    setTestResult(null);

    const testData = {
      number: '9901-TESTE',
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      identifier: `DIAGNOSTICO [${currentConfig.name}]`,
      cashierId: 'GERENCIA_ERP',
      subtotal: 150.00,
      discount: 10.00,
      total: 140.00,
      paymentMethod: 'pix',
      items: [
        { qty: 1, name: 'TESTE ESC/POS REAL DISPATCH', unitPrice: 100.00 },
        { qty: 2, name: 'BOBINA TÉRMICA PADRÃO ERP', unitPrice: 25.00 }
      ]
    };

    const startTime = performance.now();

    try {
      const receiptText = generateReceiptText('sale', testData, currentConfig.hardware.paperSize, currentConfig.document);
      const escPosBuffer = generateEscPosBuffer(receiptText, {
        autoCut: currentConfig.hardware.autoCut,
        cashDrawer: currentConfig.hardware.cashDrawer,
        align: currentConfig.layout.align,
        fontFamily: currentConfig.layout.fontFamily,
        bold: currentConfig.layout.bold,
        scaleHorizontal: currentConfig.layout.scaleHorizontal,
        scaleVertical: currentConfig.layout.scaleVertical
      });

      let res: { success: boolean; durationMs: number; bytesCount: number; errorMsg?: string } = {
        success: false,
        durationMs: 0,
        bytesCount: escPosBuffer.length
      };

      const connType = currentConfig.connection.type;
      const driver = currentConfig.hardware.driver;

      if (connType === 'usb' || driver === 'webusb') {
        if (!('usb' in navigator)) {
          res = {
            success: false,
            durationMs: Math.round(performance.now() - startTime),
            bytesCount: escPosBuffer.length,
            errorMsg: 'ERR_WEBUSB_NOT_SUPPORTED: O navegador não possui suporte à API WebUSB.'
          };
        } else {
          const usbRes = await connectAndPrintWebUSB(escPosBuffer, false);
          res = {
            success: usbRes.success,
            durationMs: usbRes.durationMs,
            bytesCount: escPosBuffer.length,
            errorMsg: usbRes.errorMsg || (usbRes.success ? undefined : 'ERR_WEBUSB_NO_DEVICE: Nenhum dispositivo WebUSB conectado. Solicite o dispositivo na aba Conexão.')
          };
        }
      } else if (connType === 'serial' || driver === 'serial_com') {
        if (!('serial' in navigator)) {
          res = {
            success: false,
            durationMs: Math.round(performance.now() - startTime),
            bytesCount: escPosBuffer.length,
            errorMsg: 'ERR_WEBSERIAL_NOT_SUPPORTED: O navegador não possui suporte à API WebSerial.'
          };
        } else {
          const serialRes = await connectAndPrintWebSerial(escPosBuffer, currentConfig.connection.baudRate);
          res = {
            success: serialRes.success,
            durationMs: serialRes.durationMs,
            bytesCount: escPosBuffer.length,
            errorMsg: serialRes.errorMsg || (serialRes.success ? undefined : 'ERR_WEBSERIAL_NO_PORT: Porta Serial COM não autorizada pelo usuário.')
          };
        }
      } else if (connType === 'network' || driver === 'raw_tcp') {
        res = {
          success: false,
          durationMs: Math.round(performance.now() - startTime),
          bytesCount: escPosBuffer.length,
          errorMsg: `ERR_TCP_PROXY: Envio direto TCP (${currentConfig.connection.ip}:${currentConfig.connection.tcpPort}) requer o Agente Local de Spooler do AdegaOS na máquina cliente.`
        };
      } else if (connType === 'bluetooth') {
        res = {
          success: false,
          durationMs: Math.round(performance.now() - startTime),
          bytesCount: escPosBuffer.length,
          errorMsg: `ERR_BLUETOOTH_DISCONNECTED: Dispositivo Bluetooth ${currentConfig.connection.btDeviceName || 'POS'} não pareado.`
        };
      } else {
        // System Spooler
        const { printViaSystemBrowser } = await import('../lib/thermalPrinter');
        const ok = await printViaSystemBrowser(receiptText, currentConfig.hardware.paperSize);
        res = {
          success: ok,
          durationMs: Math.round(performance.now() - startTime),
          bytesCount: escPosBuffer.length,
          errorMsg: ok ? undefined : 'ERR_SYSTEM_SPOOLER: Falha ao abrir o Gerenciador de Impressão do Sistema Operacional.'
        };
      }

      setTestResult(res);

      updateCurrentConfig(draft => {
        draft.diagnostics.lastPrintTime = new Date().toLocaleTimeString('pt-BR');
        draft.diagnostics.lastPrintBytes = res.bytesCount;
        draft.diagnostics.latencyMs = res.durationMs;
        draft.diagnostics.status = res.success ? 'online' : 'error';
        draft.diagnostics.lastErrorCode = res.errorMsg;
      });

      // Add job to Spooler
      const job: SpoolJob = {
        id: `JOB_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        printerId: currentConfig.id,
        printerName: currentConfig.name,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        bytesCount: escPosBuffer.length,
        status: res.success ? 'completed' : 'error',
        durationMs: res.durationMs,
        errorCode: res.errorMsg ? res.errorMsg.split(':')[0] : undefined,
        details: res.success ? `Enviado com sucesso (${escPosBuffer.length} bytes)` : (res.errorMsg || 'Erro de comunicação'),
        rawHexPreview: bufferToHexPreview(escPosBuffer, 24)
      };
      addSpoolJob(job);

      setStreamLogs(prev => [
        {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          level: res.success ? 'info' : 'error',
          text: res.success
            ? `PRINT SUCCESS: ${res.bytesCount} bytes transmitidos em ${res.durationMs}ms para ${currentConfig.name}`
            : `PRINT FAIL (${currentConfig.name}): ${res.errorMsg}`
        },
        ...prev
      ]);
    } catch (err: any) {
      const errText = err.message || String(err);
      setTestResult({ success: false, durationMs: 0, bytesCount: 0, errorMsg: errText });
      updateCurrentConfig(draft => {
        draft.diagnostics.status = 'error';
        draft.diagnostics.lastErrorCode = errText;
      });
    } finally {
      setIsTestPrinting(false);
    }
  };

  // Generate live ESC/POS receipt text & buffer for preview
  const liveReceiptText = generateReceiptText(
    'sale',
    {
      number: '1001',
      clientName: 'CLIENTE TESTE ERP',
      subtotal: 120.0,
      totalAmount: 120.0,
      items: [{ quantity: 1, name: 'VINHO CABERNET SAUVIGNON 750ML', totalPrice: 120.0 }]
    },
    currentConfig.hardware.paperSize,
    currentConfig.document
  );

  const liveEscPosBuffer = generateEscPosBuffer(liveReceiptText, {
    autoCut: currentConfig.hardware.autoCut,
    cashDrawer: currentConfig.hardware.cashDrawer,
    align: currentConfig.layout.align,
    fontFamily: currentConfig.layout.fontFamily,
    bold: currentConfig.layout.bold,
    scaleHorizontal: currentConfig.layout.scaleHorizontal,
    scaleVertical: currentConfig.layout.scaleVertical
  });

  const isDark = theme === 'dark';

  // Status Badge Rendering based strictly on truth
  const renderStatusBadge = () => {
    const st = currentConfig.diagnostics.status;
    if (st === 'online') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          TESTADO - SUCESSO ({currentConfig.diagnostics.latencyMs}ms)
        </span>
      );
    }
    if (st === 'ready') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
          DISPOSITIVO PAREADO
        </span>
      );
    }
    if (st === 'error') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
          <X className="w-3 h-3" /> ERRO DE COMUNICAÇÃO
        </span>
      );
    }
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
        isDark ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-gray-100 text-gray-600 border border-gray-300'
      }`}>
        AGUARDANDO TESTE
      </span>
    );
  };

  return (
    <div className={`w-full rounded-2xl border flex flex-col overflow-hidden text-xs font-sans transition-all shadow-xl ${
      isDark ? 'bg-[#080808] border-[#1A1A1A] text-gray-200' : 'bg-white border-gray-200 text-slate-800'
    }`}>
      
      {/* =========================================================================
          TOP COMMAND BAR: PROFILE SELECTOR & GLOBAL REAL ACTION (PIXEL-PERFECT DESKTOP & MOBILE)
          ========================================================================= */}
      <div className={`p-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 w-full min-w-0 ${
        isDark ? 'bg-[#0B0B0B] border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'
      }`}>
        {/* Left: Device Selector & Quick Profile Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-none">
            <div className="w-10 h-10 rounded-xl bg-[#18F2A4]/10 text-[#18F2A4] border border-[#18F2A4]/20 flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4" />
            </div>

            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={`w-full sm:w-auto h-10 px-3 rounded-xl border text-xs font-bold outline-none transition-all cursor-pointer truncate ${
                isDark ? 'bg-[#141414] border-gray-800 text-[#18F2A4] hover:border-gray-700' : 'bg-white border-gray-300 text-emerald-800'
              }`}
            >
              {configs.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.connection.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Profile Actions Bar */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenNewProfileModal}
              className={`flex-1 sm:flex-none h-10 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs shrink-0 active:scale-95 ${
                isDark ? 'border-gray-800 bg-[#141414] hover:bg-gray-800 text-gray-300 hover:text-white' : 'border-gray-300 bg-white hover:bg-gray-100 text-slate-700 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-[#18F2A4] shrink-0" />
              <span>Novo Perfil</span>
            </button>

            <button
              type="button"
              onClick={handleOpenDeleteModal}
              className={`h-10 px-3 rounded-xl border transition-all cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
                isDark ? 'border-red-950 bg-red-950/20 hover:bg-red-900/40 text-red-400' : 'border-red-200 bg-red-50 hover:bg-red-100 text-red-600'
              }`}
              title="Excluir Perfil Atual"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Excluir</span>
            </button>
          </div>
        </div>

        {/* Right: Status Badge & Primary Test Execution Button */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-gray-800/40 md:border-t-0">
          <div className="shrink-0 flex items-center h-10">
            {renderStatusBadge()}
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={handleTriggerFullTestPrint}
            disabled={isTestPrinting}
            className="h-10 px-4 rounded-xl font-bold text-xs bg-[#18F2A4] text-black hover:bg-[#12d58f] active:bg-[#0fe399] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 shrink-0"
          >
            <Play className="w-4 h-4 fill-black shrink-0" />
            <span>{isTestPrinting ? 'Executando...' : 'Testar Impressão'}</span>
          </motion.button>
        </div>
      </div>

      {/* Deletion Error Notification Banner */}
      {deleteErrorMsg && (
        <div className="px-3 py-2 text-xs border-b font-semibold flex items-center justify-between gap-2 bg-amber-950/40 border-amber-900/50 text-amber-300">
          <div className="flex items-center gap-2 min-w-0">
            <X className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">{deleteErrorMsg}</span>
          </div>
          <button type="button" onClick={() => setDeleteErrorMsg(null)} className="text-gray-400 hover:text-white cursor-pointer shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Execution Feedback Notification Banner */}
      {testResult && (
        <div className={`px-3 py-2 text-xs border-b font-mono flex items-center justify-between gap-2 ${
          testResult.success
            ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-300'
            : 'bg-red-950/40 border-red-900/50 text-red-300'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            {testResult.success ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <X className="w-4 h-4 text-red-400 shrink-0" />}
            <span className="truncate">
              {testResult.success
                ? `SUCESSO: Impressão ESC/POS executada com sucesso em ${testResult.durationMs}ms.`
                : `FALHA REAL: ${testResult.errorMsg}`}
            </span>
          </div>
          <button type="button" onClick={() => setTestResult(null)} className="text-gray-400 hover:text-white cursor-pointer shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          HIGH-DENSITY ERP TAB NAVBAR (6 SUB-PANELS)
          ========================================================================= */}
      <div className={`px-2 pt-2 border-b flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth w-full ${
        isDark ? 'bg-[#0A0A0A] border-[#1A1A1A]' : 'bg-gray-100 border-gray-200'
      }`}>
        {[
          { id: 'connection', label: '1. Conexão', icon: Wifi },
          { id: 'hardware', label: '2. Impressora', icon: Printer },
          { id: 'layout', label: '3. Layout ESC/POS', icon: Sliders },
          { id: 'document', label: '4. Matriz Documento', icon: Table },
          { id: 'rules', label: '5. Regras & Setores', icon: Server },
          { id: 'diagnostics', label: '6. Diagnóstico & Spooler', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative h-10 px-3.5 py-2 rounded-t-xl text-xs font-bold tracking-tight flex items-center gap-2 cursor-pointer transition-all border-t border-x shrink-0 whitespace-nowrap ${
                isActive
                  ? isDark
                    ? 'bg-[#080808] border-[#1A1A1A] border-b-[#080808] text-[#18F2A4] z-10'
                    : 'bg-white border-gray-200 border-b-white text-emerald-800 z-10'
                  : isDark
                    ? 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#111]'
                    : 'border-transparent text-gray-600 hover:text-slate-900 hover:bg-gray-200'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#18F2A4]' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#18F2A4]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB CONTENT PANEL AREA
          ========================================================================= */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          
          {/* =========================================================================
              PANEL 1: CONEXÃO CONDICIONAL POR PROTOCOLO (SELETOR COMPACTO)
              ========================================================================= */}
          {activeTab === 'connection' && (
            <motion.div
              key="connection"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.12 }}
              className="flex flex-col gap-4"
            >
              {/* Compact Protocol Selector Dropdown (Rule 4) */}
              <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
                <label htmlFor="protocol-select" className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Protocolo de Conexão:
                </label>

                <select
                  id="protocol-select"
                  value={currentConfig.connection.type}
                  onChange={(e) => updateCurrentConfig(d => {
                    const val = e.target.value as any;
                    d.connection.type = val;
                    if (val === 'system') d.hardware.driver = 'system';
                    else if (val === 'usb') d.hardware.driver = 'webusb';
                    else if (val === 'network') d.hardware.driver = 'raw_tcp';
                    else if (val === 'serial') d.hardware.driver = 'serial_com';
                  })}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer transition-all ${
                    isDark ? 'bg-[#141414] border-gray-800 text-[#18F2A4] hover:border-gray-700' : 'bg-white border-gray-300 text-emerald-800'
                  }`}
                >
                  <option value="system">Driver do Sistema (Spooler Windows / Impressão Silenciosa Kiosk)</option>
                  <option value="usb">USB Direct (WebUSB Raw ESC/POS)</option>
                  <option value="network">TCP/IP (Rede Ethernet / Wi-Fi)</option>
                  <option value="serial">Serial RS-232 / COM</option>
                  <option value="bluetooth">Bluetooth (Wireless POS)</option>
                </select>
              </div>

              {/* CONDITIONAL FORM FIELDS: Render ONLY fields relevant to the selected protocol */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#0B0B0B] border-[#161616]' : 'bg-gray-50 border-gray-200'
              }`}>

                {/* 0. System Driver Fields */}
                {currentConfig.connection.type === 'system' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <span className="font-bold text-xs uppercase text-[#18F2A4] flex items-center gap-1.5">
                        <Printer className="w-4 h-4" /> Driver do Sistema Operacional (Spooler Windows / Linux / Mac)
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded font-bold">
                        MAIS ESTÁVEL E RECOMENDADO
                      </span>
                    </div>

                    <div className={`p-3.5 rounded-xl border text-xs leading-relaxed flex flex-col gap-2 ${
                      isDark ? 'bg-[#121212] border-gray-800/80 text-gray-300' : 'bg-white border-gray-200 text-slate-800'
                    }`}>
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-4 h-4 shrink-0 text-[#18F2A4]" />
                        <span>Ideal para impressoras USB instaladas no sistema</span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        O envio é feito pelo Gerenciador de Impressão nativo do sistema. Com o atalho do PWA/Navegador configurado com o parâmetro <code className="bg-black/40 px-1 py-0.5 rounded text-[#18F2A4] font-mono">--kiosk-printing</code>, o cupom sai <strong>automaticamente e instantaneamente</strong> sem abrir nenhuma caixa de diálogo.
                      </p>
                      <ul className="text-[11px] text-gray-400 list-disc list-inside gap-1 flex flex-col">
                        <li>Não sofre bloqueios de "Access Denied" do WebUSB do navegador.</li>
                        <li>Permite que a impressora continue configurada no painel de controle do sistema.</li>
                        <li>Garante impressão em 1 clique sem requerer religar a impressora.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* 1. USB Fields */}
                {currentConfig.connection.type === 'usb' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <span className="font-bold text-xs uppercase text-[#18F2A4] flex items-center gap-1.5">
                        <Usb className="w-4 h-4" /> Configuração de Interface USB Direct
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        API WebUSB: {'usb' in navigator ? 'SUPORTADA' : 'NÃO SUPORTADA'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400">Dispositivo USB Pareado</label>
                        <input
                          type="text"
                          readOnly
                          value={currentConfig.connection.usbDeviceName || 'Nenhum dispositivo selecionado'}
                          className={`w-full p-2 rounded-lg border font-mono text-xs font-bold outline-none mt-1 ${
                            isDark ? 'bg-[#141414] border-gray-800 text-emerald-400' : 'bg-white border-gray-300 text-emerald-800'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400">Vendor ID (VID) / Product ID (PID)</label>
                        <div className="font-mono text-xs font-bold p-2 rounded-lg bg-[#141414] border border-gray-800 text-gray-300 mt-1">
                          {currentConfig.connection.usbVendorId || '0x----'} : {currentConfig.connection.usbProductId || '0x----'}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400">Timeout USB (ms)</label>
                        <input
                          type="number"
                          value={currentConfig.connection.timeoutMs}
                          onChange={(e) => updateCurrentConfig(d => { d.connection.timeoutMs = Number(e.target.value); })}
                          className={`w-full p-2 rounded-lg border font-mono text-xs font-bold outline-none mt-1 ${
                            isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-white border-gray-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleDiscoverWebUsbDevice}
                        disabled={discoveringUsb}
                        className="px-3 py-2 rounded-lg font-bold text-xs bg-[#18F2A4]/15 border border-[#18F2A4]/30 text-[#18F2A4] hover:bg-[#18F2A4]/25 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${discoveringUsb ? 'animate-spin' : ''}`} />
                        {discoveringUsb ? 'Buscando...' : 'Solicitar Dispositivo WebUSB'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. TCP/IP Network Fields */}
                {currentConfig.connection.type === 'network' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <span className="font-bold text-xs uppercase text-[#18F2A4] flex items-center gap-1.5">
                        <Wifi className="w-4 h-4" /> Configuração de Rede TCP/IP Ethernet / Wi-Fi
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400">Endereço IP da Impressora</label>
                        <input
                          type="text"
                          value={currentConfig.connection.ip}
                          onChange={(e) => updateCurrentConfig(d => { d.connection.ip = e.target.value; })}
                          placeholder="192.168.1.200"
                          className={`w-full p-2 rounded-lg border font-mono text-xs font-bold outline-none mt-1 ${
                            isDark ? 'bg-[#141414] border-gray-800 text-emerald-400' : 'bg-white border-gray-300 text-emerald-800'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400">Porta RAW Socket TCP</label>
                        <input
                          type="number"
                          value={currentConfig.connection.tcpPort}
                          onChange={(e) => updateCurrentConfig(d => { d.connection.tcpPort = Number(e.target.value); })}
                          className={`w-full p-2 rounded-lg border font-mono text-xs font-bold outline-none mt-1 ${
                            isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-white border-gray-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400">Timeout de Conexão (ms)</label>
                        <input
                          type="number"
                          value={currentConfig.connection.timeoutMs}
                          onChange={(e) => updateCurrentConfig(d => { d.connection.timeoutMs = Number(e.target.value); })}
                          className={`w-full p-2 rounded-lg border font-mono text-xs font-bold outline-none mt-1 ${
                            isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-white border-gray-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Serial RS-232 / COM Fields */}
                {currentConfig.connection.type === 'serial' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <span className="font-bold text-xs uppercase text-[#18F2A4] flex items-center gap-1.5">
                        <Key className="w-4 h-4" /> Configuração de Porta Serial COM / RS-232
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400">Porta COM</label>
                        <input
                          type="text"
                          value={currentConfig.connection.serialPort}
                          onChange={(e) => updateCurrentConfig(d => { d.connection.serialPort = e.target.value; })}
                          placeholder="COM1"
                          className={`w-full p-2 rounded-lg border font-mono text-xs font-bold outline-none mt-1 ${
                            isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-white border-gray-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400">Baud Rate (bps)</label>
                        <select
                          value={currentConfig.connection.baudRate}
                          onChange={(e) => updateCurrentConfig(d => { d.connection.baudRate = Number(e.target.value); })}
                          className={`w-full p-2 rounded-lg border font-mono text-xs font-bold outline-none mt-1 ${
                            isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-white border-gray-300 text-slate-900'
                          }`}
                        >
                          {[9600, 19200, 38400, 57600, 115200].map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400">Paridade</label>
                        <select
                          value={currentConfig.connection.parity}
                          onChange={(e) => updateCurrentConfig(d => { d.connection.parity = e.target.value as any; })}
                          className={`w-full p-2 rounded-lg border font-mono text-xs font-bold outline-none mt-1 ${
                            isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-white border-gray-300 text-slate-900'
                          }`}
                        >
                          <option value="none">Nenhuma (None)</option>
                          <option value="even">Par (Even)</option>
                          <option value="odd">Ímpar (Odd)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400">Stop Bits</label>
                        <select
                          value={currentConfig.connection.stopBits}
                          onChange={(e) => updateCurrentConfig(d => { d.connection.stopBits = Number(e.target.value) as any; })}
                          className={`w-full p-2 rounded-lg border font-mono text-xs font-bold outline-none mt-1 ${
                            isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-white border-gray-300 text-slate-900'
                          }`}
                        >
                          <option value={1}>1 bit</option>
                          <option value={2}>2 bits</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400">Controle de Fluxo</label>
                        <select
                          value={currentConfig.connection.flowControl}
                          onChange={(e) => updateCurrentConfig(d => { d.connection.flowControl = e.target.value as any; })}
                          className={`w-full p-2 rounded-lg border font-mono text-xs font-bold outline-none mt-1 ${
                            isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-white border-gray-300 text-slate-900'
                          }`}
                        >
                          <option value="none">Nenhum (None)</option>
                          <option value="hardware">RTS / CTS (Hardware)</option>
                          <option value="software">XON / XOFF (Software)</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleDiscoverWebSerialPort}
                        disabled={discoveringSerial}
                        className="px-3 py-2 rounded-lg font-bold text-xs bg-[#18F2A4]/15 border border-[#18F2A4]/30 text-[#18F2A4] hover:bg-[#18F2A4]/25 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${discoveringSerial ? 'animate-spin' : ''}`} />
                        {discoveringSerial ? 'Aguardando...' : 'Autorizar Porta WebSerial'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Bluetooth Fields */}
                {currentConfig.connection.type === 'bluetooth' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <span className="font-bold text-xs uppercase text-[#18F2A4] flex items-center gap-1.5">
                        <Bluetooth className="w-4 h-4" /> Configuração de Conexão Bluetooth POS
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400">Nome do Dispositivo BT</label>
                        <input
                          type="text"
                          value={currentConfig.connection.btDeviceName}
                          onChange={(e) => updateCurrentConfig(d => { d.connection.btDeviceName = e.target.value; })}
                          placeholder="POS-58-BT"
                          className={`w-full p-2 rounded-lg border font-mono text-xs font-bold outline-none mt-1 ${
                            isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-white border-gray-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400">Endereço MAC / UUID</label>
                        <input
                          type="text"
                          value={currentConfig.connection.btMac}
                          onChange={(e) => updateCurrentConfig(d => { d.connection.btMac = e.target.value; })}
                          placeholder="00:11:22:33:44:55"
                          className={`w-full p-2 rounded-lg border font-mono text-xs font-bold outline-none mt-1 ${
                            isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-white border-gray-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400">Timeout (ms)</label>
                        <input
                          type="number"
                          value={currentConfig.connection.timeoutMs}
                          onChange={(e) => updateCurrentConfig(d => { d.connection.timeoutMs = Number(e.target.value); })}
                          className={`w-full p-2 rounded-lg border font-mono text-xs font-bold outline-none mt-1 ${
                            isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-white border-gray-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* =========================================================================
              PANEL 2: IMPRESSORA (HARDWARE & DRIVER)
              ========================================================================= */}
          {activeTab === 'hardware' && (
            <motion.div
              key="hardware"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.12 }}
              className="flex flex-col gap-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Modelo da Impressora</label>
                  <select
                    value={currentConfig.hardware.model}
                    onChange={(e) => updateCurrentConfig(d => { d.hardware.model = e.target.value; })}
                    className={`w-full p-2 rounded-lg border font-bold text-xs outline-none mt-1 ${
                      isDark ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-300 text-slate-900'
                    }`}
                  >
                    <option value="HPRT TP808">HPRT TP808 / TP805 (ESC/POS 203 DPI)</option>
                    <option value="Bematech MP-4200 TH">Bematech MP-4200 TH Dual</option>
                    <option value="Elgin I9">Elgin I9 / I8 / I7</option>
                    <option value="Epson TM-T20III">Epson TM-T20III / TM-T88VI</option>
                    <option value="Daruma DR800">Daruma DR800 L/H/ETH</option>
                    <option value="Generica ESC/POS">Genérica ESC/POS Padrão</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Fabricante</label>
                  <input
                    type="text"
                    value={currentConfig.hardware.manufacturer}
                    onChange={(e) => updateCurrentConfig(d => { d.hardware.manufacturer = e.target.value; })}
                    className={`w-full p-2 rounded-lg border font-bold text-xs outline-none mt-1 ${
                      isDark ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Driver / Modo de Comunicação</label>
                  <select
                    value={currentConfig.hardware.driver}
                    onChange={(e) => updateCurrentConfig(d => { d.hardware.driver = e.target.value as any; })}
                    className={`w-full p-2 rounded-lg border font-bold text-xs outline-none mt-1 ${
                      isDark ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-300 text-slate-900'
                    }`}
                  >
                    <option value="system">Spooler Sistema Operacional (Windows/Linux/Mac)</option>
                    <option value="webusb">Direct WebUSB Nativo</option>
                    <option value="raw_tcp">Raw TCP/IP Direct (Socket 9100)</option>
                    <option value="serial_com">Porta Serial COM</option>
                    <option value="virtual">Simulador e Fila em Tela</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Bobina de Papel</label>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    <select
                      value={currentConfig.hardware.paperSize}
                      onChange={(e) => updateCurrentConfig(d => {
                        const val = e.target.value as '58mm' | '80mm';
                        d.hardware.paperSize = val;
                        d.hardware.columnsCount = val === '58mm' ? 32 : 48;
                      })}
                      className={`p-2 rounded-lg border font-bold text-xs outline-none ${
                        isDark ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-300 text-slate-900'
                      }`}
                    >
                      <option value="58mm">58 mm</option>
                      <option value="80mm">80 mm</option>
                    </select>

                    <select
                      value={currentConfig.hardware.columnsCount}
                      onChange={(e) => updateCurrentConfig(d => { d.hardware.columnsCount = Number(e.target.value); })}
                      className={`p-2 rounded-lg border font-mono font-bold text-xs outline-none ${
                        isDark ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-300 text-slate-900'
                      }`}
                    >
                      <option value={32}>32 Col</option>
                      <option value={42}>42 Col</option>
                      <option value={48}>48 Col</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Hardware Toggles Bar */}
              <div className={`p-3 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-3 ${
                isDark ? 'bg-[#0B0B0B] border-[#161616]' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`flex items-center justify-between p-2 rounded-lg border ${
                  isDark ? 'bg-black/20 border-gray-800 text-white' : 'bg-white border-gray-200 text-slate-800'
                }`}>
                  <span className="font-bold text-xs">Corte Automático (Guilhotina ESC/POS)</span>
                  <button
                    type="button"
                    onClick={() => updateCurrentConfig(d => { d.hardware.autoCut = !d.hardware.autoCut; })}
                    className="cursor-pointer"
                  >
                    {currentConfig.hardware.autoCut ? <ToggleRight className="w-6 h-6 text-[#18F2A4]" /> : <ToggleLeft className="w-6 h-6 text-gray-500" />}
                  </button>
                </div>

                <div className={`flex items-center justify-between p-2 rounded-lg border ${
                  isDark ? 'bg-black/20 border-gray-800 text-white' : 'bg-white border-gray-200 text-slate-800'
                }`}>
                  <span className="font-bold text-xs">Abertura de Gaveta de Dinheiro</span>
                  <button
                    type="button"
                    onClick={() => updateCurrentConfig(d => { d.hardware.cashDrawer = !d.hardware.cashDrawer; })}
                    className="cursor-pointer"
                  >
                    {currentConfig.hardware.cashDrawer ? <ToggleRight className="w-6 h-6 text-[#18F2A4]" /> : <ToggleLeft className="w-6 h-6 text-gray-500" />}
                  </button>
                </div>

                <div className={`flex items-center justify-between p-2 rounded-lg border ${
                  isDark ? 'bg-black/20 border-gray-800 text-white' : 'bg-white border-gray-200 text-slate-800'
                }`}>
                  <span className="font-bold text-xs">Buzzer / Alarme Sonoro</span>
                  <button
                    type="button"
                    onClick={() => updateCurrentConfig(d => { d.hardware.buzzer = !d.hardware.buzzer; })}
                    className="cursor-pointer"
                  >
                    {currentConfig.hardware.buzzer ? <ToggleRight className="w-6 h-6 text-[#18F2A4]" /> : <ToggleLeft className="w-6 h-6 text-gray-500" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              PANEL 3: LAYOUT DA IMPRESSÃO ESC/POS PARAMS & HEX INSPECTOR
              ========================================================================= */}
          {activeTab === 'layout' && (
            <motion.div
              key="layout"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.12 }}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Fonte ESC/POS</label>
                  <select
                    value={currentConfig.layout.fontFamily}
                    onChange={(e) => updateCurrentConfig(d => { d.layout.fontFamily = e.target.value as any; })}
                    className={`w-full p-2 rounded-lg border font-bold text-xs outline-none mt-1 ${
                      isDark ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-300 text-slate-900'
                    }`}
                  >
                    <option value="font_a">Fonte A (12x24 dots)</option>
                    <option value="font_b">Fonte B (9x17 dots)</option>
                    <option value="font_c">Fonte C (9x24 dots)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Escala Horizontal</label>
                  <select
                    value={currentConfig.layout.scaleHorizontal}
                    onChange={(e) => updateCurrentConfig(d => { d.layout.scaleHorizontal = Number(e.target.value) as any; })}
                    className={`w-full p-2 rounded-lg border font-mono font-bold text-xs outline-none mt-1 ${
                      isDark ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-300 text-slate-900'
                    }`}
                  >
                    <option value={1}>1x Normal</option>
                    <option value={2}>2x Largura</option>
                    <option value={3}>3x Largura</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Escala Vertical</label>
                  <select
                    value={currentConfig.layout.scaleVertical}
                    onChange={(e) => updateCurrentConfig(d => { d.layout.scaleVertical = Number(e.target.value) as any; })}
                    className={`w-full p-2 rounded-lg border font-mono font-bold text-xs outline-none mt-1 ${
                      isDark ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-300 text-slate-900'
                    }`}
                  >
                    <option value={1}>1x Normal</option>
                    <option value={2}>2x Altura</option>
                    <option value={3}>3x Altura</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Alinhamento Padrão</label>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    {[
                      { id: 'left', icon: AlignLeft },
                      { id: 'center', icon: AlignCenter },
                      { id: 'right', icon: AlignRight },
                    ].map(a => {
                      const Icon = a.icon;
                      const isSel = currentConfig.layout.align === a.id;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => updateCurrentConfig(d => { d.layout.align = a.id as any; })}
                          className={`p-1.5 rounded-lg border flex items-center justify-center cursor-pointer ${
                            isSel
                              ? 'border-[#18F2A4] bg-[#18F2A4]/15 text-[#18F2A4]'
                              : isDark ? 'border-gray-800 bg-[#111] text-gray-500' : 'border-gray-300 bg-gray-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* LIVE ESC/POS BYTE HEX INSPECTOR */}
              <div className={`p-3 rounded-xl border font-mono text-[11px] flex flex-col gap-2 ${
                isDark ? 'border-gray-800 bg-[#050505] text-gray-300' : 'border-gray-200 bg-gray-50 text-slate-800'
              }`}>
                <div className={`flex items-center justify-between font-bold border-b pb-2 ${isDark ? 'text-gray-400 border-gray-800' : 'text-slate-600 border-gray-200'}`}>
                  <span className="flex items-center gap-1.5 text-[#18F2A4]">
                    <Terminal className="w-3.5 h-3.5" /> Inspetor em Tempo Real de Bytes ESC/POS ({liveEscPosBuffer.length} bytes)
                  </span>
                  <span className="hidden sm:inline">Codificação: ASCII / UTF-8 Binary</span>
                </div>

                <div className={`p-2 rounded font-mono text-[10px] leading-relaxed break-all select-all border ${
                  isDark ? 'bg-black text-emerald-400 border-gray-900' : 'bg-white text-emerald-700 border-gray-200'
                }`}>
                  {bufferToHexPreview(liveEscPosBuffer, 64)}
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              PANEL 4: MATRIZ DE DOCUMENTO (DESKTOP TABLE & MOBILE TOUCH CARDS)
              ========================================================================= */}
          {activeTab === 'document' && (
            <motion.div
              key="document"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.12 }}
              className="flex flex-col gap-2.5"
            >
              {/* DESKTOP TABLE VIEW (md+) */}
              <div className={`hidden md:block w-full overflow-x-auto scrollbar-thin rounded-xl border ${
                isDark ? 'bg-[#0A0A0A] border-[#161616]' : 'bg-white border-gray-200'
              }`}>
                <table className="w-full min-w-0 text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b text-[10px] font-bold uppercase tracking-tight ${
                      isDark ? 'bg-[#121212] border-gray-800 text-gray-400' : 'bg-gray-100 border-gray-300 text-slate-700'
                    }`}>
                      <th className="p-2.5">Elemento</th>
                      <th className="p-2.5 text-center">Exibir</th>
                      <th className="p-2.5">Fonte</th>
                      <th className="p-2.5">Escala</th>
                      <th className="p-2.5 text-center">Negrito</th>
                      <th className="p-2.5 text-center">Alinhar</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-sans ${isDark ? 'divide-gray-800/40' : 'divide-gray-200'}`}>
                    {[
                      { key: 'header', label: 'Cabeçalho / CNPJ' },
                      { key: 'logo', label: 'Logotipo da Empresa' },
                      { key: 'orderNumber', label: 'Nº Pedido / Comanda' },
                      { key: 'customerName', label: 'Cliente / Mesa' },
                      { key: 'dateTime', label: 'Data & Hora' },
                      { key: 'itemsTable', label: 'Tabela de Itens' },
                      { key: 'notes', label: 'Observações' },
                      { key: 'totals', label: 'Totais & Descontos' },
                      { key: 'payments', label: 'Pagamento & Troco' },
                      { key: 'qrCode', label: 'QR Code' },
                      { key: 'barcode', label: 'Código de Barras' },
                      { key: 'footer', label: 'Rodapé Final' },
                    ].map((row) => {
                      const itemConfig = (currentConfig.document as any)[row.key];
                      if (!itemConfig) return null;
                      return (
                        <tr key={row.key} className={isDark ? 'hover:bg-[#111]' : 'hover:bg-gray-50'}>
                          <td className={`p-2.5 font-bold text-xs ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {row.label}
                          </td>

                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => updateCurrentConfig(d => { (d.document as any)[row.key].visible = !(d.document as any)[row.key].visible; })}
                              className="cursor-pointer p-0.5"
                            >
                              {itemConfig.visible ? (
                                <Eye className="w-4 h-4 text-[#18F2A4] mx-auto" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-400 mx-auto" />
                              )}
                            </button>
                          </td>

                          <td className="p-2">
                            {itemConfig.font !== undefined ? (
                              <select
                                value={itemConfig.font}
                                onChange={(e) => updateCurrentConfig(d => { (d.document as any)[row.key].font = e.target.value; })}
                                className={`p-1 rounded border text-xs font-bold outline-none cursor-pointer ${
                                  isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-white border-gray-300 text-slate-900'
                                }`}
                              >
                                <option value="font_a">A (12x24)</option>
                                <option value="font_b">B (9x17)</option>
                              </select>
                            ) : (
                              <span className="text-gray-400 text-[10px] italic">Padrão</span>
                            )}
                          </td>

                          <td className="p-2">
                            {itemConfig.size !== undefined ? (
                              <select
                                value={itemConfig.size}
                                onChange={(e) => updateCurrentConfig(d => { (d.document as any)[row.key].size = e.target.value; })}
                                className={`p-1 rounded border text-xs font-bold outline-none cursor-pointer ${
                                  isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-white border-gray-300 text-slate-900'
                                }`}
                              >
                                <option value="normal">1x Normal</option>
                                <option value="double">2x Duplo</option>
                                <option value="large">3x Gigante</option>
                              </select>
                            ) : (
                              <span className="text-gray-400 text-[10px] italic">Auto</span>
                            )}
                          </td>

                          <td className="p-2.5 text-center">
                            {itemConfig.bold !== undefined ? (
                              <button
                                type="button"
                                onClick={() => updateCurrentConfig(d => { (d.document as any)[row.key].bold = !(d.document as any)[row.key].bold; })}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer border transition-all ${
                                  itemConfig.bold
                                    ? 'bg-[#18F2A4]/20 text-[#18F2A4] border-[#18F2A4]/30'
                                    : isDark ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-300'
                                }`}
                              >
                                {itemConfig.bold ? 'SIM' : 'NÃO'}
                              </button>
                            ) : (
                              <span className="text-gray-400 text-[10px]">-</span>
                            )}
                          </td>

                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {['left', 'center', 'right'].map(alignVal => (
                                <button
                                  key={alignVal}
                                  type="button"
                                  onClick={() => updateCurrentConfig(d => { (d.document as any)[row.key].align = alignVal; })}
                                  className={`p-1 rounded border cursor-pointer ${
                                    (itemConfig.align || 'left') === alignVal
                                      ? 'border-[#18F2A4] bg-[#18F2A4]/15 text-[#18F2A4]'
                                      : isDark ? 'border-gray-800 bg-[#141414] text-gray-500' : 'border-gray-300 bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {alignVal === 'left' && <AlignLeft className="w-3 h-3" />}
                                  {alignVal === 'center' && <AlignCenter className="w-3 h-3" />}
                                  {alignVal === 'right' && <AlignRight className="w-3 h-3" />}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE DEDICATED TOUCH CARDS VIEW (< md) */}
              <div className="grid grid-cols-1 gap-2.5 md:hidden">
                {[
                  { key: 'header', label: 'Cabeçalho / CNPJ' },
                  { key: 'logo', label: 'Logotipo da Empresa' },
                  { key: 'orderNumber', label: 'Nº Pedido / Comanda' },
                  { key: 'customerName', label: 'Cliente / Mesa' },
                  { key: 'dateTime', label: 'Data & Hora' },
                  { key: 'itemsTable', label: 'Tabela de Itens' },
                  { key: 'notes', label: 'Observações' },
                  { key: 'totals', label: 'Totais & Descontos' },
                  { key: 'payments', label: 'Pagamento & Troco' },
                  { key: 'qrCode', label: 'QR Code' },
                  { key: 'barcode', label: 'Código de Barras' },
                  { key: 'footer', label: 'Rodapé Final' },
                ].map((row) => {
                  const itemConfig = (currentConfig.document as any)[row.key];
                  if (!itemConfig) return null;
                  return (
                    <div
                      key={row.key}
                      className={`p-3 rounded-xl border flex flex-col gap-2.5 transition-all ${
                        isDark ? 'bg-[#0B0B0B] border-[#181818]' : 'bg-white border-gray-200 shadow-xs'
                      }`}
                    >
                      {/* Card Header: Title + Visibility Pill */}
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {row.label}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateCurrentConfig(d => { (d.document as any)[row.key].visible = !(d.document as any)[row.key].visible; })}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all ${
                            itemConfig.visible
                              ? 'bg-[#18F2A4]/15 border-[#18F2A4]/30 text-[#18F2A4]'
                              : isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'
                          }`}
                        >
                          {itemConfig.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{itemConfig.visible ? 'Visível' : 'Oculto'}</span>
                        </button>
                      </div>

                      {/* Card Body: Controls (when visible) */}
                      {itemConfig.visible && (
                        <div className={`pt-2.5 border-t grid grid-cols-2 gap-2 text-xs ${
                          isDark ? 'border-gray-800/60' : 'border-gray-100'
                        }`}>
                          {/* Font Selector */}
                          {itemConfig.font !== undefined && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Fonte</span>
                              <select
                                value={itemConfig.font}
                                onChange={(e) => updateCurrentConfig(d => { (d.document as any)[row.key].font = e.target.value; })}
                                className={`p-2 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                                  isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-gray-50 border-gray-300 text-slate-900'
                                }`}
                              >
                                <option value="font_a">A (12x24)</option>
                                <option value="font_b">B (9x17)</option>
                              </select>
                            </div>
                          )}

                          {/* Size Selector */}
                          {itemConfig.size !== undefined && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Escala</span>
                              <select
                                value={itemConfig.size}
                                onChange={(e) => updateCurrentConfig(d => { (d.document as any)[row.key].size = e.target.value; })}
                                className={`p-2 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                                  isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-gray-50 border-gray-300 text-slate-900'
                                }`}
                              >
                                <option value="normal">1x Normal</option>
                                <option value="double">2x Duplo</option>
                                <option value="large">3x Gigante</option>
                              </select>
                            </div>
                          )}

                          {/* Bold Selector */}
                          {itemConfig.bold !== undefined && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Negrito</span>
                              <button
                                type="button"
                                onClick={() => updateCurrentConfig(d => { (d.document as any)[row.key].bold = !(d.document as any)[row.key].bold; })}
                                className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center cursor-pointer transition-all ${
                                  itemConfig.bold
                                    ? 'bg-[#18F2A4]/20 border-[#18F2A4]/30 text-[#18F2A4]'
                                    : isDark ? 'bg-[#141414] border-gray-800 text-gray-400' : 'bg-gray-50 border-gray-300 text-gray-600'
                                }`}
                              >
                                {itemConfig.bold ? 'Negrito ON' : 'Negrito OFF'}
                              </button>
                            </div>
                          )}

                          {/* Alignment Selector */}
                          <div className="flex flex-col gap-1 col-span-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Alinhamento</span>
                            <div className="grid grid-cols-3 gap-1.5">
                              {[
                                { id: 'left', label: 'Esquerda', icon: AlignLeft },
                                { id: 'center', label: 'Centro', icon: AlignCenter },
                                { id: 'right', label: 'Direita', icon: AlignRight },
                              ].map(a => {
                                const Icon = a.icon;
                                const isSel = (itemConfig.align || 'left') === a.id;
                                return (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => updateCurrentConfig(d => { (d.document as any)[row.key].align = a.id; })}
                                    className={`py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                      isSel
                                        ? 'border-[#18F2A4] bg-[#18F2A4]/15 text-[#18F2A4]'
                                        : isDark ? 'border-gray-800 bg-[#141414] text-gray-400' : 'border-gray-300 bg-gray-50 text-slate-700'
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{a.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              PANEL 5: REGRAS & ROTEAMENTO POR SETOR
              ========================================================================= */}
          {activeTab === 'rules' && (
            <motion.div
              key="rules"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.12 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {/* Sector Routing */}
              <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
                isDark ? 'bg-[#0B0B0B] border-[#161616]' : 'bg-gray-50 border-gray-200'
              }`}>
                <span className="font-bold text-xs uppercase text-[#18F2A4] tracking-wider">
                  Roteamento Operacional por Setor
                </span>

                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { key: 'caixa', label: 'Frente de Caixa / Balcão' },
                    { key: 'cozinha', label: 'Cozinha & Preparo de Lanches' },
                    { key: 'bar', label: 'Adega & Bar de Bebidas' },
                    { key: 'producao', label: 'Produção / Salgadeira' },
                    { key: 'delivery', label: 'Expedição / Delivery' },
                  ].map(sector => {
                    const isEnabled = (currentConfig.rules.sectorRouting as any)[sector.key];
                    return (
                      <div key={sector.key} className={`flex items-center justify-between p-2 rounded-lg border ${
                        isDark ? 'bg-black/20 border-gray-800 text-white' : 'bg-white border-gray-200 text-slate-800'
                      }`}>
                        <span className="font-bold text-xs">{sector.label}</span>
                        <button
                          type="button"
                          onClick={() => updateCurrentConfig(d => { (d.rules.sectorRouting as any)[sector.key] = !(d.rules.sectorRouting as any)[sector.key]; })}
                          className="cursor-pointer"
                        >
                          {isEnabled ? <ToggleRight className="w-5 h-5 text-[#18F2A4]" /> : <ToggleLeft className="w-5 h-5 text-gray-500" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Copies & Automation Rules */}
              <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
                isDark ? 'bg-[#0B0B0B] border-[#161616]' : 'bg-gray-50 border-gray-200'
              }`}>
                <span className="font-bold text-xs uppercase text-[#18F2A4] tracking-wider">
                  Automação & Cópias
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400">Número de Vias / Cópias</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={currentConfig.rules.copiesCount}
                      onChange={(e) => updateCurrentConfig(d => { d.rules.copiesCount = Number(e.target.value); })}
                      className={`w-full p-2 rounded-lg border font-mono font-bold text-xs outline-none mt-1 ${
                        isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-white border-gray-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400">Prioridade na Fila</label>
                    <select
                      value={currentConfig.rules.priority}
                      onChange={(e) => updateCurrentConfig(d => { d.rules.priority = e.target.value as any; })}
                      className={`w-full p-2 rounded-lg border font-bold text-xs outline-none mt-1 ${
                        isDark ? 'bg-[#141414] border-gray-800 text-white' : 'bg-white border-gray-300 text-slate-900'
                      }`}
                    >
                      <option value="low">Baixa</option>
                      <option value="normal">Normal</option>
                      <option value="high">Alta</option>
                      <option value="critical">Crítica (Urgente)</option>
                    </select>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-2 rounded-lg border mt-2 ${
                  isDark ? 'bg-black/20 border-gray-800 text-white' : 'bg-white border-gray-200 text-slate-800'
                }`}>
                  <span className="font-bold text-xs">Impressão Automática ao Finalizar Venda</span>
                  <button
                    type="button"
                    onClick={() => updateCurrentConfig(d => { d.rules.autoPrintOnSale = !d.rules.autoPrintOnSale; })}
                    className="cursor-pointer"
                  >
                    {currentConfig.rules.autoPrintOnSale ? <ToggleRight className="w-5 h-5 text-[#18F2A4]" /> : <ToggleLeft className="w-5 h-5 text-gray-500" />}
                  </button>
                </div>
              </div>

              {/* Category Production Rules Configurator */}
              <div className="md:col-span-2 mt-2">
                <ProductionCategoryConfigManager theme={theme} />
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              PANEL 6: DIAGNÓSTICO BASEADO EM DADOS REAIS & FILA SPOOLER
              ========================================================================= */}
          {activeTab === 'diagnostics' && (
            <motion.div
              key="diagnostics"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.12 }}
              className="flex flex-col gap-4"
            >
              {/* Real System Telemetry Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#0B0B0B] border-[#161616]' : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Suporte WebUSB</span>
                  <div className={`font-mono font-bold text-xs mt-1 flex items-center gap-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {'usb' in navigator ? (
                      <><Check className="w-3.5 h-3.5 text-[#18F2A4]" /> <span className="text-[#18F2A4]">ATIVO NO NAVEGADOR</span></>
                    ) : (
                      <><X className="w-3.5 h-3.5 text-gray-500" /> <span className="text-gray-400">NÃO DISPONÍVEL</span></>
                    )}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#0B0B0B] border-[#161616]' : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Suporte WebSerial</span>
                  <div className={`font-mono font-bold text-xs mt-1 flex items-center gap-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {'serial' in navigator ? (
                      <><Check className="w-3.5 h-3.5 text-[#18F2A4]" /> <span className="text-[#18F2A4]">ATIVO NO NAVEGADOR</span></>
                    ) : (
                      <><X className="w-3.5 h-3.5 text-gray-500" /> <span className="text-gray-400">NÃO DISPONÍVEL</span></>
                    )}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#0B0B0B] border-[#161616]' : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Último Latência Registrada</span>
                  <div className="font-mono font-bold text-xs text-[#18F2A4] mt-1">
                    {currentConfig.diagnostics.latencyMs !== null ? `${currentConfig.diagnostics.latencyMs} ms` : 'Sem Testes Recentes'}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#0B0B0B] border-[#161616]' : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Total Em Fila de Spool</span>
                  <div className="font-mono font-bold text-xs text-blue-400 mt-1">
                    {spoolQueue.length} Trabalhos
                  </div>
                </div>
              </div>

              {/* REAL SPOOLER QUEUE TABLE */}
              <div className={`rounded-xl border flex flex-col overflow-hidden ${
                isDark ? 'bg-[#0A0A0A] border-[#161616]' : 'bg-white border-gray-200'
              }`}>
                <div className={`p-3 border-b flex items-center justify-between ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <span className={`font-bold text-xs flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Database className="w-4 h-4 text-[#18F2A4]" /> Histórico Fila de Spooler (ESC/POS)
                  </span>

                  <button
                    type="button"
                    onClick={() => clearSpoolQueue()}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    Limpar Histórico
                  </button>
                </div>

                {spoolQueue.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 font-mono text-xs">
                    Nenhum trabalho de impressão registrado no histórico local.
                  </div>
                ) : (
                  <>
                    {/* DESKTOP QUEUE TABLE (md+) */}
                    <div className="hidden md:block w-full overflow-x-auto scrollbar-thin">
                      <table className="w-full min-w-[480px] text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className={`border-b text-[10px] font-bold uppercase ${
                            isDark ? 'bg-[#121212] border-gray-800 text-gray-400' : 'bg-gray-100 border-gray-300 text-slate-700'
                          }`}>
                            <th className="p-2">ID Trabalho</th>
                            <th className="p-2">Impressora</th>
                            <th className="p-2">Hora</th>
                            <th className="p-2">Duração</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Detalhes</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-gray-800/40' : 'divide-gray-200'}`}>
                          {spoolQueue.slice(0, 10).map(job => (
                            <tr key={job.id} className={isDark ? 'hover:bg-[#111]' : 'hover:bg-gray-50'}>
                              <td className="p-2 text-gray-400">{job.id.slice(-10)}</td>
                              <td className={`p-2 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{job.printerName}</td>
                              <td className="p-2 text-gray-400">{job.timestamp}</td>
                              <td className="p-2 text-gray-400">{job.durationMs}ms</td>
                              <td className="p-2">
                                {job.status === 'completed' ? (
                                  <span className="text-emerald-400 font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/50">
                                    Concluído
                                  </span>
                                ) : (
                                  <span className="text-red-400 font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-red-950/40 border border-red-900/50">
                                    {job.errorCode || 'Erro'}
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-gray-400 text-[10px]">{job.details || 'Processado'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE DEDICATED QUEUE CARDS (< md) */}
                    <div className="grid grid-cols-1 gap-2 p-2.5 md:hidden font-sans">
                      {spoolQueue.slice(0, 8).map(job => (
                        <div
                          key={job.id}
                          className={`p-3 rounded-xl border flex flex-col gap-2 ${
                            isDark ? 'bg-[#111] border-gray-800/80' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {job.printerName}
                            </span>
                            {job.status === 'completed' ? (
                              <span className="text-emerald-400 font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/50">
                                Concluído
                              </span>
                            ) : (
                              <span className="text-red-400 font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-red-950/40 border border-red-900/50">
                                {job.errorCode || 'Erro'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono pt-1 border-t border-gray-800/40">
                            <span>ID: {job.id.slice(-8)}</span>
                            <span>{job.timestamp} ({job.durationMs}ms)</span>
                          </div>

                          {job.details && (
                            <div className="text-[10px] text-gray-400 italic">
                              {job.details}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Real Stream Log Terminal */}
              <div className={`rounded-xl border p-3 flex flex-col gap-2 font-mono text-[11px] ${
                isDark ? 'border-gray-800 bg-[#050505]' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <span className="text-[#18F2A4] font-bold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" /> Monitor de Eventos do Driver
                  </span>
                  <button
                    type="button"
                    onClick={() => setStreamLogs([])}
                    className="text-[10px] text-gray-400 hover:text-gray-300 cursor-pointer"
                  >
                    Limpar
                  </button>
                </div>

                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                  {streamLogs.map(log => (
                    <div key={log.id} className="flex items-center gap-2">
                      <span className="text-gray-500">[{log.time}]</span>
                      <span className={log.level === 'error' ? 'text-red-400' : 'text-emerald-300'}>
                        {log.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* =========================================================================
          MODAL 1: CADASTRAR NOVO PERFIL DE IMPRESSORA (NOME PERSONALIZADO)
          ========================================================================= */}
      <AnimatePresence>
        {isNewProfileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl flex flex-col gap-4 ${
                isDark ? 'bg-[#111111] border-gray-800 text-white' : 'bg-white border-gray-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between border-b border-gray-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#18F2A4]/10 text-[#18F2A4] border border-[#18F2A4]/20">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Novo Perfil de Impressora</h3>
                    <p className="text-[11px] text-gray-400">Defina o nome e método de conexão inicial</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewProfileModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmCreateProfile} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-300">
                    Nome da Impressora / Perfil <span className="text-[#18F2A4]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newProfileNameInput}
                    onChange={(e) => setNewProfileNameInput(e.target.value)}
                    placeholder="Ex: Balcão Caixas 01, Cozinha TM-T20..."
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all ${
                      isDark ? 'bg-[#181818] border-gray-700 text-white focus:border-[#18F2A4]' : 'bg-gray-50 border-gray-300 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-300">Protocolo de Conexão Inicial</label>
                  <select
                    value={newProfileTypeInput}
                    onChange={(e: any) => setNewProfileTypeInput(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all cursor-pointer ${
                      isDark ? 'bg-[#181818] border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-slate-900'
                    }`}
                  >
                    <option value="usb">Direta USB (WebUSB / Cabo POS)</option>
                    <option value="network">Rede Ethernet / Wi-Fi (RAW TCP/IP)</option>
                    <option value="serial">Serial / COM Port (WebSerial)</option>
                    <option value="bluetooth">Bluetooth SPP / POS sem fio</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800/60">
                  <button
                    type="button"
                    onClick={() => setIsNewProfileModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-gray-700 hover:bg-gray-800 text-gray-300 font-bold text-xs cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#18F2A4] text-black hover:bg-[#12d58f] font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Criar Perfil
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 2: CONFIRMAÇÃO DE EXCLUSÃO DE PERFIL
          ========================================================================= */}
      <AnimatePresence>
        {profileToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl flex flex-col gap-4 ${
                isDark ? 'bg-[#111111] border-red-900/50 text-white' : 'bg-white border-red-200 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-red-400">Excluir Perfil de Impressora</h3>
                  <p className="text-[11px] text-gray-400">Esta ação não pode ser desfeita</p>
                </div>
              </div>

              <p className={`text-xs leading-relaxed p-3.5 rounded-xl border font-medium ${
                isDark
                  ? 'bg-red-950/40 border-red-900/50 text-red-200'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                Tem certeza que deseja remover permanentemente o perfil <strong className={`font-bold ${isDark ? 'text-white' : 'text-red-950'}`}>"{profileToDelete.name}"</strong>? O roteamento de impressões para este dispositivo será interrompido.
              </p>

              <div className={`flex items-center justify-end gap-2 pt-2 border-t ${isDark ? 'border-gray-800/60' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setProfileToDelete(null)}
                  className={`px-3.5 py-2 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                    isDark
                      ? 'border-gray-700 hover:bg-gray-800 text-gray-300'
                      : 'border-gray-300 hover:bg-gray-100 text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteProfile}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500 font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir Perfil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
