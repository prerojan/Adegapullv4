import React, { useState, useEffect } from 'react';
import { Settings, Users, Store, ShieldAlert, Key, Plus, Save, ToggleLeft, ToggleRight, X, Trash2, Shield, Download, Laptop, Printer, Sliders, Play, Check, AlertCircle, FileText, Sparkles, RefreshCw, Volume2, Wifi, Usb, Bluetooth, HelpCircle, Award, Mail, Phone, Lock, Edit3, CheckCircle2, Server, Globe, Tablet, Radio, Zap } from 'lucide-react';
import { CashierUser } from '../types';
import { PrinterDevice, getSavedPrinters, savePrinters, triggerThermalPrint } from '../lib/thermalPrinter';
import EnterprisePrinterControlCenter from './EnterprisePrinterControlCenter';

interface ManagerSettingsProps {
  usersList: CashierUser[];
  onToggleUserActive: (userId: string) => void;
  onAddUser: (user: CashierUser) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUserRole: (userId: string, newRole: 'admin' | 'manager' | 'finance' | 'cashier' | 'waiter' | 'stock') => void;
  theme: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export default function ManagerSettings({
  usersList,
  onToggleUserActive,
  onAddUser,
  onDeleteUser,
  onUpdateUserRole,
  theme,
  onToggleTheme
}: ManagerSettingsProps) {
  // Topic Tab Selector State
  type SETTINGS_TOPIC = 'general' | 'printers' | 'staff' | 'terminals';
  const [activeTopic, setActiveTopic] = useState<SETTINGS_TOPIC>('general');

  // Corporate states
  const [storeName, setStoreName] = useState(() => localStorage.getItem('adegaos_store_name') || 'Adega Central Premium');
  const [cnpj, setCnpj] = useState(() => localStorage.getItem('adegaos_cnpj') || '12.345.678/0001-99');
  const [address, setAddress] = useState(() => localStorage.getItem('adegaos_address') || 'Rua dos Boêmios, 100 - Centro, São Paulo - SP');

  // Real-time thermal roll text
  const [activeReceiptText, setActiveReceiptText] = useState<string>(() => {
    return localStorage.getItem('adegaos_last_receipt') || '';
  });

  useEffect(() => {
    const handleNewPrint = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail !== undefined) {
        setActiveReceiptText(customEvent.detail);
      }
    };
    window.addEventListener('adegaos_new_print', handleNewPrint);
    return () => {
      window.removeEventListener('adegaos_new_print', handleNewPrint);
    };
  }, []);

  // Per-Printer Management State
  const [printersList, setPrintersList] = useState<PrinterDevice[]>(() => getSavedPrinters());
  
  // New Printer Modal State
  const [isAddPrinterModalOpen, setIsAddPrinterModalOpen] = useState(false);
  const [newPrinterName, setNewPrinterName] = useState('');
  const [newPrinterSector, setNewPrinterSector] = useState<'caixa' | 'cozinha' | 'bar' | 'expedição' | 'outros'>('caixa');
  const [newPrinterMethod, setNewPrinterMethod] = useState<'system' | 'webusb' | 'webserial' | 'bluetooth' | 'network' | 'virtual'>('system');
  const [newPrinterIp, setNewPrinterIp] = useState('192.168.1.200:9100');
  const [newPrinterPaper, setNewPrinterPaper] = useState<'58mm' | '80mm'>('58mm');
  const [newPrinterAutoCut, setNewPrinterAutoCut] = useState(true);
  const [newPrinterCopies, setNewPrinterCopies] = useState(1);

  // Global Text Template States
  const [headerText, setHeaderText] = useState<string>(() => {
    return localStorage.getItem('adegaos_header_text') || 'ADEGA CENTRAL PREMIUM\nCNPJ: 12.345.678/0001-99\nOBRIGADO PELA PREFERÊNCIA!';
  });
  const [footerText, setFooterText] = useState<string>(() => {
    return localStorage.getItem('adegaos_footer_text') || 'Desenvolvido por FluxOS\n--- CUPOM NÃO FISCAL ---';
  });

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [testingPrinterId, setTestingPrinterId] = useState<string | null>(null);
  const [isHardwareGuideOpen, setIsHardwareGuideOpen] = useState(false);

  // Helper Handlers for Printers List
  const handleUpdatePrinter = (id: string, updates: Partial<PrinterDevice>) => {
    setPrintersList(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      savePrinters(updated);
      return updated;
    });
  };

  const handleDeletePrinter = (id: string) => {
    if (confirm('Deseja realmente remover esta impressora?')) {
      setPrintersList(prev => {
        const updated = prev.filter(p => p.id !== id);
        savePrinters(updated);
        return updated;
      });
    }
  };

  const handleAddNewPrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrinterName.trim()) return;

    const newPrn: PrinterDevice = {
      id: `prn_${Date.now()}`,
      name: newPrinterName.trim(),
      sector: newPrinterSector,
      method: newPrinterMethod,
      connectionIp: newPrinterIp,
      paperSize: newPrinterPaper,
      enabled: true,
      autoCut: newPrinterAutoCut,
      copies: newPrinterCopies || 1
    };

    setPrintersList(prev => {
      const updated = [...prev, newPrn];
      savePrinters(updated);
      return updated;
    });

    setNewPrinterName('');
    setIsAddPrinterModalOpen(false);
  };

  const handleSaveAllPrinters = () => {
    savePrinters(printersList);
    localStorage.setItem('adegaos_header_text', headerText);
    localStorage.setItem('adegaos_footer_text', footerText);
    setShowSuccessBanner(true);
    setTimeout(() => {
      setShowSuccessBanner(false);
    }, 3000);
  };

  const handlePairWebUSB = async (printerId: string) => {
    if (!('usb' in navigator)) {
      alert('Seu navegador não suporta WebUSB. Utilize o Google Chrome ou Microsoft Edge.');
      return;
    }
    try {
      const device = await (navigator as any).usb.requestDevice({ filters: [] });
      if (device) {
        alert(`Dispositivo USB pareado com sucesso: ${device.productName || 'Impressora USB'}`);
        handleUpdatePrinter(printerId, { method: 'webusb' });
      }
    } catch (err: any) {
      console.warn('[FluxOS WebUSB Pair Note]:', err);
    }
  };

  const handleTriggerPrinterTest = async (printer: PrinterDevice) => {
    setTestingPrinterId(printer.id);
    const mockData = {
      number: 'TESTE-99',
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      identifier: `TESTE DE IMPRESSÃO [${printer.name.toUpperCase()}]`,
      cashierId: 'CONFIGURACOES',
      subtotal: 99.90,
      discount: 0.00,
      total: 99.90,
      paymentMethod: 'pix',
      items: [
        { qty: 1, name: `[${printer.sector.toUpperCase()}] TESTE DE COMUNICAÇÃO DIRECT`, unitPrice: 99.90 }
      ]
    };

    try {
      await triggerThermalPrint('sale', mockData, printer.id);
      alert(`Comando de teste enviado com sucesso para "${printer.name}"!`);
    } catch (err: any) {
      console.error("Erro no teste de impressão:", err);
      alert(`Falha no envio da impressão: ${err.message}`);
    } finally {
      setTestingPrinterId(null);
    }
  };

  // PWA/Chrome Install states
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(() => (window as any).deferredPwaPrompt || null);
  const [isAppInstalled, setIsAppInstalled] = React.useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPwaPrompt = e;
      setDeferredPrompt(e);
    };

    const handlePromptAvailable = () => {
      if ((window as any).deferredPwaPrompt) {
        setDeferredPrompt((window as any).deferredPwaPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      (window as any).deferredPwaPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

    if ((window as any).deferredPwaPrompt) {
      setDeferredPrompt((window as any).deferredPwaPrompt);
    }

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleTriggerInstall = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPwaPrompt;
    if (!promptEvent) {
      if (window.self !== window.top) {
        alert('Para instalar o aplicativo nativo FluxOS, abra o link do sistema em uma nova aba diretamente no navegador (fora do visualizador/iFrame do AI Studio).');
      } else {
        alert('O aplicativo já está instalado ou o seu navegador já registrou a instalação. Acesse o menu do navegador em "Instalar FluxOS" ou procure o ícone na tela inicial.');
      }
      return;
    }
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      (window as any).deferredPwaPrompt = null;
    }
  };

  // Staff User modal and edit state
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'manager' | 'finance' | 'cashier' | 'waiter' | 'stock'>('waiter');

  // Edit PIN Modal State
  const [editingUserPinId, setEditingUserPinId] = useState<string | null>(null);
  const [editPinValue, setEditPinValue] = useState('');

  const handleSaveCorporate = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('adegaos_store_name', storeName);
    localStorage.setItem('adegaos_cnpj', cnpj);
    localStorage.setItem('adegaos_address', address);
    alert('Dados institucionais da empresa atualizados com sucesso!');
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || newUserPin.length < 4) {
      alert('Favor preencher o nome e um PIN numérico de no mínimo 4 dígitos.');
      return;
    }

    const payload: CashierUser = {
      id: `u-${Date.now()}`,
      name: newUserName,
      pin: newUserPin,
      role: newUserRole,
      active: true
    };

    onAddUser(payload);
    setShowUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPin('');
    alert(`Novo colaborador ${newUserName} cadastrado com sucesso.`);
  };

  const handleSaveEditedPin = (userId: string) => {
    if (editPinValue.length < 4) {
      alert('O PIN deve conter no mínimo 4 dígitos.');
      return;
    }
    const targetUser = usersList.find(u => u.id === userId);
    if (targetUser) {
      targetUser.pin = editPinValue;
      alert(`PIN do usuário ${targetUser.name} alterado com sucesso para ${editPinValue}.`);
    }
    setEditingUserPinId(null);
    setEditPinValue('');
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Centro de Configurações do Sistema</h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Gerenciamento modular de parâmetros da empresa, rede de impressoras, PINs de colaboradores e terminais PDV.</p>
        </div>

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              theme === 'dark' ? 'bg-[#111] border-gray-800 text-gray-300 hover:text-white' : 'bg-white border-gray-200 text-gray-700 shadow-sm'
            }`}
          >
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </button>
        )}
      </div>

      {/* TOPIC SEPARATION NAVIGATION BAR (Tabs) */}
      <div className={`p-1.5 rounded-2xl border flex flex-wrap items-center gap-2 ${
        theme === 'dark' ? 'bg-[#0A0A0A] border-[#1C1C1C]' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <button
          type="button"
          onClick={() => setActiveTopic('general')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTopic === 'general'
              ? (theme === 'dark' ? 'bg-[#18F2A4] text-black shadow-md' : 'bg-[#10B981] text-white shadow-md')
              : 'text-gray-400 hover:text-white hover:bg-gray-500/10'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Empresa & Geral</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTopic('printers')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTopic === 'printers'
              ? (theme === 'dark' ? 'bg-[#18F2A4] text-black shadow-md' : 'bg-[#10B981] text-white shadow-md')
              : 'text-gray-400 hover:text-white hover:bg-gray-500/10'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Rede de Impressoras & Setores</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTopic('staff')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTopic === 'staff'
              ? (theme === 'dark' ? 'bg-[#18F2A4] text-black shadow-md' : 'bg-[#10B981] text-white shadow-md')
              : 'text-gray-400 hover:text-white hover:bg-gray-500/10'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Colaboradores & PINs</span>
          <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-black/20 text-current">{usersList.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTopic('terminals')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTopic === 'terminals'
              ? (theme === 'dark' ? 'bg-[#18F2A4] text-black shadow-md' : 'bg-[#10B981] text-white shadow-md')
              : 'text-gray-400 hover:text-white hover:bg-gray-500/10'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Terminais & Segurança PWA</span>
        </button>
      </div>

      {/* =========================================================
          TOPIC 1: EMPRESA & GERAL
          ========================================================= */}
      {activeTopic === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          
          {/* Institutional Store Data */}
          <form onSubmit={handleSaveCorporate} className={`p-5 rounded-2xl border flex flex-col gap-4 ${
            theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
              <Store className="w-4 h-4 text-[#18F2A4]" />
              <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">Perfil da Empresa (Matriz / Filial)</span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Nome de Exibição / Fantasia</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className={`p-3 rounded-xl border outline-none font-bold ${
                  theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">CNPJ / Registro Fiscal</label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className={`p-3 rounded-xl border outline-none font-mono font-bold ${
                  theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Endereço Comercial Completo</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`p-3 rounded-xl border outline-none ${
                  theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                }`}
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
              }`}
            >
              <Save className="w-4 h-4" />
              Salvar Dados Institucionais
            </button>
          </form>

          {/* Receipt Header & Footer Templates */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
            theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
              <FileText className="w-4 h-4 text-sky-400" />
              <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">Cabeçalho e Rodapé dos Cupons</span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Texto do Cabeçalho (Topo da Bobina)</label>
              <textarea
                rows={3}
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                className={`p-3 rounded-xl border outline-none font-mono text-xs ${
                  theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Texto do Rodapé (Final da Bobina)</label>
              <textarea
                rows={3}
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className={`p-3 rounded-xl border outline-none font-mono text-xs ${
                  theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={handleSaveAllPrinters}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                theme === 'dark' ? 'bg-[#111] border border-gray-800 text-white hover:bg-[#1A1A1A]' : 'bg-gray-100 border border-gray-200 text-gray-800 hover:bg-gray-200'
              }`}
            >
              <Save className="w-4 h-4" />
              Gravar Textos dos Cupons
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          TOPIC 2: CENTRAL DE CONFIGURAÇÃO DE IMPRESSÃO EMPRESARIAL
          ========================================================= */}
      {activeTopic === 'printers' && (
        <div className="flex flex-col gap-5 animate-fade-in">
          <EnterprisePrinterControlCenter theme={theme} />
        </div>
      )}

      {false && (
        <div className="flex flex-col gap-5 animate-fade-in">
          
          {/* Header Action Bar */}
          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#18F2A4]" />
                <h3 className="text-sm font-black tracking-tight">Rede de Impressoras Térmicas por Setor</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#18F2A4]/10 text-[#18F2A4] border border-[#18F2A4]/20 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#18F2A4]" /> Modo Direto Instantâneo
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Cadastre e personalize cada impressora individualmente com seu próprio método de comunicação (WebUSB, Serial, Rede IP ou Driver Spooler).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddPrinterModalOpen(true)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                  theme === 'dark' ? 'bg-[#111] border-gray-800 text-gray-200 hover:bg-[#1A1A1A]' : 'bg-gray-100 border-gray-200 text-slate-800 hover:bg-gray-200'
                }`}
              >
                <Plus className="w-4 h-4 text-[#18F2A4]" />
                Cadastrar Impressora
              </button>

              <button
                type="button"
                onClick={handleSaveAllPrinters}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                  theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                }`}
              >
                {showSuccessBanner ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {showSuccessBanner ? 'Salvo com Sucesso!' : 'Gravar Alterações'}
              </button>
            </div>
          </div>

          {/* Instant Printing & Zero-Dialog Kiosk Guide */}
          <div className={`p-4 rounded-2xl border flex flex-col gap-2.5 ${
            theme === 'dark' ? 'bg-[#0A1812] border-emerald-900/40 text-emerald-100' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-emerald-400">
              <Zap className="w-4 h-4" /> Impressão Direta em 0.1 Segundos sem Janelas do Windows
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              Para fazer cupons saírem <strong>instantaneamente</strong> na impressora ao confirmar a venda, sem pedir seleção ou salvar em PDF:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-1 text-xs">
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#060D0A] border-emerald-900/60' : 'bg-white border-emerald-200'}`}>
                <span className="font-extrabold text-emerald-400 flex items-center gap-1 mb-1">
                  <Usb className="w-3.5 h-3.5" /> Opção 1: Conexão WebUSB Direta
                </span>
                <span>Altere o método da impressora para <strong>USB Direto (WebUSB)</strong> e clique em "Parear USB". O sistema enviará ESC/POS diretamente para a impressora em 0.1 segundo.</span>
              </div>
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#060D0A] border-emerald-900/60' : 'bg-white border-emerald-200'}`}>
                <span className="font-extrabold text-emerald-400 flex items-center gap-1 mb-1">
                  <Laptop className="w-3.5 h-3.5" /> Opção 2: Driver Windows + Modo Kiosk
                </span>
                <span>Se utilizar o Driver Spooler do Windows (HPRT/Bematech/Elgin), inicie o navegador Google Chrome com a flag <code className="px-1 py-0.5 rounded bg-black/30 font-mono text-[10px] text-emerald-300">--kiosk-printing</code>. O Chrome enviará todos os cupons direto para o papel sem pedir confirmação.</span>
              </div>
            </div>
          </div>

          {/* Registered Printers Cards List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {printersList.map((printer) => {
              const isTesting = testingPrinterId === printer.id;
              
              // Sector colors
              const sectorColorMap: Record<string, string> = {
                caixa: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                cozinha: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                bar: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
                expedição: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
                outros: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
              };
              const badgeClass = sectorColorMap[printer.sector.toLowerCase()] || sectorColorMap.outros;

              return (
                <div
                  key={printer.id}
                  className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
                    printer.enabled
                      ? theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
                      : 'opacity-60 border-dashed border-gray-800 bg-[#050505]'
                  }`}
                >
                  {/* Top Bar: Name & Enable Toggle */}
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: theme === 'dark' ? '#141414' : '#F3F4F6' }}>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                        {printer.sector}
                      </span>
                      <input
                        type="text"
                        value={printer.name}
                        onChange={(e) => handleUpdatePrinter(printer.id, { name: e.target.value })}
                        className={`font-black text-sm outline-none bg-transparent ${
                          theme === 'dark' ? 'text-white hover:bg-[#111] focus:bg-[#111]' : 'text-slate-900 hover:bg-gray-100 focus:bg-gray-100'
                        } px-2 py-0.5 rounded-lg border border-transparent hover:border-gray-700 transition-all`}
                        placeholder="Nome da Impressora"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdatePrinter(printer.id, { enabled: !printer.enabled })}
                        className="cursor-pointer"
                        title={printer.enabled ? 'Desativar Impressora' : 'Ativar Impressora'}
                      >
                        {printer.enabled ? (
                          <ToggleRight className="w-6 h-6 text-[#18F2A4]" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-600" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePrinter(printer.id)}
                        className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remover Impressora"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Individual Communication Method Selector */}
                  <div className="flex flex-col gap-1.5 text-xs">
                    <label className="text-gray-400 font-extrabold uppercase tracking-wider text-[9px]">
                      Método de Comunicação Individual da Impressora
                    </label>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {[
                        { id: 'system', label: 'Driver Spooler', icon: Laptop },
                        { id: 'webusb', label: 'USB Direto', icon: Usb },
                        { id: 'webserial', label: 'Serial COM', icon: Key },
                        { id: 'network', label: 'Rede IP', icon: Wifi },
                        { id: 'bluetooth', label: 'Bluetooth', icon: Bluetooth },
                        { id: 'virtual', label: 'Simulador', icon: Tablet },
                      ].map((m) => {
                        const Icon = m.icon;
                        const isSelected = printer.method === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleUpdatePrinter(printer.id, { method: m.id as any })}
                            className={`p-2 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#18F2A4] bg-[#18F2A4]/10 text-[#18F2A4]'
                                : theme === 'dark' ? 'bg-[#111] border-gray-800 text-gray-400 hover:border-gray-700' : 'bg-gray-50 border-gray-200 text-slate-700 hover:bg-gray-100'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="truncate max-w-full">{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Parameter Options based on selected method */}
                  {printer.method === 'network' && (
                    <div className="flex flex-col gap-1 text-xs">
                      <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Endereço IP & Porta TCP (Ex: 192.168.1.200:9100)</label>
                      <input
                        type="text"
                        value={printer.connectionIp || ''}
                        onChange={(e) => handleUpdatePrinter(printer.id, { connectionIp: e.target.value })}
                        placeholder="192.168.1.200:9100"
                        className={`p-2 rounded-xl border outline-none font-mono text-xs font-bold ${
                          theme === 'dark' ? 'bg-[#111] border-gray-800 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-800'
                        }`}
                      />
                    </div>
                  )}

                  {printer.method === 'webusb' && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl border bg-[#18F2A4]/5 border-[#18F2A4]/20 text-xs">
                      <span className="text-[11px] text-gray-400 font-bold">Comunicação direta por hardware USB</span>
                      <button
                        type="button"
                        onClick={() => handlePairWebUSB(printer.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#18F2A4] text-black font-extrabold text-[10px] hover:bg-[#12d58f] transition-all cursor-pointer"
                      >
                        Parear USB
                      </button>
                    </div>
                  )}

                  {/* Print Settings Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Largura Bobina</label>
                      <select
                        value={printer.paperSize}
                        onChange={(e) => handleUpdatePrinter(printer.id, { paperSize: e.target.value as any })}
                        className={`p-2 rounded-xl border outline-none font-bold text-xs ${
                          theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-slate-900'
                        }`}
                      >
                        <option value="58mm">58mm (32 col)</option>
                        <option value="80mm">80mm (48 col)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Corte Auto</label>
                      <button
                        type="button"
                        onClick={() => handleUpdatePrinter(printer.id, { autoCut: !printer.autoCut })}
                        className={`p-2 rounded-xl border font-bold text-xs flex items-center justify-between cursor-pointer ${
                          printer.autoCut
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                            : 'border-gray-800 bg-[#111] text-gray-500'
                        }`}
                      >
                        <span>{printer.autoCut ? 'Guilhotina' : 'Manual'}</span>
                        {printer.autoCut ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Nº de Vias</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={printer.copies || 1}
                        onChange={(e) => handleUpdatePrinter(printer.id, { copies: Number(e.target.value) })}
                        className={`p-2 rounded-xl border outline-none font-mono font-bold text-xs ${
                          theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Test Print Button */}
                  <button
                    type="button"
                    onClick={() => handleTriggerPrinterTest(printer)}
                    disabled={isTesting}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                      theme === 'dark' ? 'bg-[#111] border-gray-800 text-gray-200 hover:bg-[#1A1A1A]' : 'bg-gray-100 border-gray-200 text-slate-800 hover:bg-gray-200'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 text-[#18F2A4]" />
                    {isTesting ? 'Enviando Teste...' : `Testar Impressão (${printer.name})`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Additional Global Print Templates */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
            theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <span className="text-xs font-extrabold uppercase text-gray-400 tracking-wider block border-b pb-2" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
              Textos de Cabeçalho e Rodapé dos Cupons não Fiscais
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Texto do Cabeçalho (Topo)</label>
                <textarea
                  rows={3}
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  className={`p-3 rounded-xl border outline-none font-mono text-xs ${
                    theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Texto do Rodapé (Final)</label>
                <textarea
                  rows={3}
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className={`p-3 rounded-xl border outline-none font-mono text-xs ${
                    theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                  }`}
                />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================
          MODAL: CADASTRO DE NOVA IMPRESSORA
          ========================================================= */}
      {isAddPrinterModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 flex flex-col gap-4 ${
            theme === 'dark' ? 'bg-[#0A0A0A] border-gray-800 text-white' : 'bg-white border-gray-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E7EB' }}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#18F2A4]/10 text-[#18F2A4]">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">Cadastrar Nova Impressora</h3>
                  <p className="text-[11px] text-gray-400">Adicione um novo dispositivo para qualquer setor</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPrinterModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewPrinter} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Nome da Impressora</label>
                <input
                  type="text"
                  required
                  value={newPrinterName}
                  onChange={(e) => setNewPrinterName(e.target.value)}
                  placeholder="Ex: Impressora Salgadeira / Caixa 2"
                  className={`p-2.5 rounded-xl border outline-none font-bold ${
                    theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Setor Operacional</label>
                  <select
                    value={newPrinterSector}
                    onChange={(e) => setNewPrinterSector(e.target.value as any)}
                    className={`p-2.5 rounded-xl border outline-none font-bold ${
                      theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                    }`}
                  >
                    <option value="caixa">Frente de Caixa</option>
                    <option value="cozinha">Cozinha & Preparo</option>
                    <option value="bar">Adega & Bar</option>
                    <option value="expedição">Expedição / Delivery</option>
                    <option value="outros">Outro Setor</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Método Conexão</label>
                  <select
                    value={newPrinterMethod}
                    onChange={(e) => setNewPrinterMethod(e.target.value as any)}
                    className={`p-2.5 rounded-xl border outline-none font-bold ${
                      theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                    }`}
                  >
                    <option value="system">Driver Spooler Windows</option>
                    <option value="webusb">USB Direto (WebUSB)</option>
                    <option value="webserial">Porta COM Serial</option>
                    <option value="network">Rede IP TCP/IP</option>
                    <option value="bluetooth">Bluetooth Sem Fio</option>
                    <option value="virtual">Simulador em Tela</option>
                  </select>
                </div>
              </div>

              {newPrinterMethod === 'network' && (
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">IP / Porta TCP/IP</label>
                  <input
                    type="text"
                    value={newPrinterIp}
                    onChange={(e) => setNewPrinterIp(e.target.value)}
                    placeholder="192.168.1.200:9100"
                    className={`p-2.5 rounded-xl border outline-none font-mono font-bold ${
                      theme === 'dark' ? 'bg-[#111] border-gray-800 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-800'
                    }`}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Bobina</label>
                  <select
                    value={newPrinterPaper}
                    onChange={(e) => setNewPrinterPaper(e.target.value as any)}
                    className={`p-2.5 rounded-xl border outline-none font-bold ${
                      theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                    }`}
                  >
                    <option value="58mm">58mm (32 colunas)</option>
                    <option value="80mm">80mm (48 colunas)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Avanço/Cópias</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newPrinterCopies}
                    onChange={(e) => setNewPrinterCopies(Number(e.target.value))}
                    className={`p-2.5 rounded-xl border outline-none font-mono font-bold ${
                      theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E7EB' }}>
                <button
                  type="button"
                  onClick={() => setIsAddPrinterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#18F2A4] text-black hover:bg-[#12d58f] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Cadastrar Dispositivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          TOPIC 3: COLABORADORES & PINS
          ========================================================= */}
      {activeTopic === 'staff' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          {/* Header Action Banner */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                Acessos de Colaboradores & Autenticação por PIN
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Cadastre o staff com nome, e-mail, cargo e defina o código PIN secreto individual para autorizações operacionais.</p>
            </div>

            <button
              onClick={() => setShowUserModal(true)}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
              }`}
            >
              <Plus className="w-4 h-4" />
              Novo Colaborador
            </button>
          </div>

          {/* Staff List Table */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
            theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={theme === 'dark' ? 'bg-black/20 text-gray-500' : 'bg-gray-100 text-gray-600'}>
                    <th className="p-3 font-bold uppercase text-[9px] tracking-widest">Colaborador</th>
                    <th className="p-3 font-bold uppercase text-[9px] tracking-widest">Cargo / Permissão</th>
                    <th className="p-3 font-bold uppercase text-[9px] tracking-widest">PIN de Acesso</th>
                    <th className="p-3 font-bold uppercase text-[9px] tracking-widest">Status</th>
                    <th className="p-3 font-bold uppercase text-[9px] tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((user) => (
                    <tr key={user.id} className={`border-b ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200'}`}>
                      <td className="p-3 font-bold">
                        <div className="flex flex-col">
                          <span className="text-sm">{user.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono">ID: {user.id}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <select
                            value={user.role}
                            onChange={(e) => onUpdateUserRole(user.id, e.target.value as any)}
                            className="p-1.5 rounded-lg text-xs bg-transparent border cursor-pointer focus:outline-none font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: theme === 'dark' ? '#111' : 'white',
                              borderColor: theme === 'dark' ? '#222' : '#E5E5E5',
                              color: theme === 'dark' ? '#DDD' : '#333'
                            }}
                          >
                            <option value="waiter">Garçom</option>
                            <option value="cashier">Caixa</option>
                            <option value="stock">Estoque</option>
                            <option value="finance">Finanças</option>
                            <option value="manager">Gerente</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>

                      <td className="p-3 font-mono">
                        {editingUserPinId === user.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="password"
                              maxLength={6}
                              value={editPinValue}
                              onChange={(e) => setEditPinValue(e.target.value.replace(/\D/g, ''))}
                              placeholder="Novo PIN"
                              className="w-20 p-1 rounded border text-center font-bold text-xs bg-black text-white border-emerald-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEditedPin(user.id)}
                              className="px-2 py-1 rounded bg-emerald-500 text-black font-bold text-[10px] cursor-pointer"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setEditingUserPinId(null)}
                              className="px-2 py-1 rounded bg-gray-800 text-gray-300 text-[10px] cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#18F2A4] tracking-widest text-sm">••••</span>
                            <button
                              onClick={() => {
                                setEditingUserPinId(user.id);
                                setEditPinValue(user.pin);
                              }}
                              className="p-1 text-gray-500 hover:text-white transition-colors cursor-pointer"
                              title="Redefinir PIN"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${user.active ? 'text-emerald-400' : 'text-gray-500'}`}>
                          <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
                          {user.active ? 'PIN Ativo' : 'Bloqueado'}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onToggleUserActive(user.id)}
                            title={user.active ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
                            className="p-1.5 rounded border border-gray-800 hover:bg-gray-800/50 cursor-pointer"
                          >
                            {user.active ? <ToggleRight className="w-5 h-5 text-[#18F2A4]" /> : <ToggleLeft className="w-5 h-5 text-gray-600" />}
                          </button>

                          <button
                            onClick={() => {
                              (window as any).confirmModal(`Tem certeza de que deseja remover o colaborador "${user.name}"?`, () => {
                                onDeleteUser(user.id);
                                alert(`Colaborador ${user.name} removido com sucesso.`);
                              });
                            }}
                            className="p-1.5 rounded border border-red-500/20 text-red-500 hover:bg-red-500/10 cursor-pointer"
                            title="Remover Colaborador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TOPIC 4: TERMINAIS & SEGURANÇA PWA
          ========================================================= */}
      {activeTopic === 'terminals' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          <div className={`p-5 rounded-2xl border flex flex-col gap-5 ${
            theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
              <Laptop className="w-4 h-4 text-[#18F2A4]" />
              <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">Modo Frente de Caixa Nativo (App PWA Standalone)</span>
            </div>

            <div className="flex flex-col md:flex-row gap-5 items-start">
              <div className="flex-1 flex flex-col gap-3">
                <span className="text-sm font-bold block" style={{ color: theme === 'dark' ? 'white' : '#111' }}>Instalação e Uso em Computadores do Salão e Caixa</span>
                <p className="text-xs text-gray-400 leading-relaxed">
                  O FluxOS é uma PWA otimizada para execução em tela cheia e modo quiosque (Kiosk Mode). Ele permite acesso ultra-rápido aos garçons e caixas sem barras do navegador.
                </p>

                {deferredPrompt ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleTriggerInstall}
                      className={`px-5 py-3 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg ${
                        theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      Instalar Aplicativo Oficial no Computador
                    </button>
                  </div>
                ) : isAppInstalled ? (
                  <div className="p-3 rounded-xl border bg-emerald-950/20 border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>FluxOS está em execução como aplicativo nativo standalone.</span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border flex flex-col gap-2 bg-gray-500/5 border-gray-800 text-xs">
                    <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Passo a Passo Para Instalação:</span>
                    <ol className="list-decimal list-inside text-gray-300 space-y-1" style={{ color: theme === 'dark' ? '#DDD' : '#444' }}>
                      <li>No Google Chrome / Edge, abra o menu de opções no canto superior direito.</li>
                      <li>Clique em <strong>Salvar e Compartilhar</strong> &gt; <strong>Criar Atalho...</strong></li>
                      <li>Marque a caixa <strong>"Abrir como janela"</strong>.</li>
                      <li>Clique em <strong>Criar</strong> para ter o ícone do FluxOS na área de trabalho.</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Status parameters */}
              <div className={`p-4 rounded-xl border flex flex-col gap-3 w-full md:w-64 shrink-0 text-xs ${
                theme === 'dark' ? 'bg-[#111] border-gray-800' : 'bg-gray-100 border-gray-200'
              }`}>
                <span className="font-extrabold uppercase text-[10px] text-gray-400 tracking-wider">Status do Terminal</span>
                <div className="flex flex-col gap-2 text-gray-400">
                  <div className="flex justify-between items-center">
                    <span>Cache Offline S-Sync:</span>
                    <span className="font-bold text-emerald-400">Ativo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Conexão Local:</span>
                    <span className="font-bold text-sky-400">Online</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Versão da PWA:</span>
                    <span className="font-mono text-white font-bold">v3.8.4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF USER */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border flex flex-col p-5 shadow-2xl ${
            theme === 'dark' ? 'bg-[#0E0E0E] border-[#1A1A1A] text-white' : 'bg-white border-gray-200 text-[#111111]'
          }`}>
            <div className="flex justify-between items-center mb-4 border-b pb-3" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Key className="w-4 h-4 text-[#18F2A4]" />
                Cadastrar Colaborador & Liberar PIN
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Roberto Garçom"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="p-3 rounded-xl border focus:outline-none font-bold"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">E-mail de Contato (Opcional)</label>
                <input
                  type="email"
                  placeholder="carlos@adega.com.br"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="p-3 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">PIN Secreto (Min. 4 Dígitos) *</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="Ex: 1234"
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, ''))}
                    className="p-3 rounded-xl border focus:outline-none font-mono text-center tracking-widest font-extrabold text-sm"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Cargo / Nível de Acesso</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="p-3 rounded-xl border focus:outline-none font-bold"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  >
                    <option value="waiter">Garçom (Salão)</option>
                    <option value="cashier">Operador de Caixa</option>
                    <option value="stock">Auxiliar de Estoque</option>
                    <option value="finance">Financeiro</option>
                    <option value="manager">Gerente de Turno</option>
                    <option value="admin">Administrador Geral</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs border cursor-pointer ${
                    theme === 'dark' ? 'bg-transparent border-[#222] text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer ${
                    theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
