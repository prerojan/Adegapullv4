import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Bell,
  Zap,
  Printer,
  Activity,
  Check,
  X,
  RefreshCw,
  Sliders,
  Shield,
  Server,
  Radio,
  Terminal,
  Volume1,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioManager, SoundType } from '../services/audioManager';
import { pwaService } from '../services/pwaService';
import { printService, PrintQueueItem } from '../services/printService';
import { eventBus } from '../services/eventBus';
import { notificationService, SectorContext } from '../services/notificationService';

interface EnterpriseServicesAudioControlProps {
  theme?: 'dark' | 'light';
}

export default function EnterpriseServicesAudioControl({ theme = 'dark' }: EnterpriseServicesAudioControlProps) {
  const isDark = theme === 'dark';

  // Audio Manager State
  const [soundSettings, setSoundSettings] = useState(() => audioManager.getSettings());
  
  // Track playing sound ID for real-time equalizer visual feedback
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  const triggerSoundTest = (sound: SoundType) => {
    audioManager.play(sound);
    setPlayingSound(sound);
    setTimeout(() => {
      setPlayingSound(null);
    }, 1200);
  };

  const handleVolumeChange = (newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    audioManager.saveSettings(clamped, clamped > 0 ? soundSettings.soundEnabled : false);
    setSoundSettings(audioManager.getSettings());
  };

  // Convert volume 0..1 to approx dB for professional UI display
  const getDbDisplay = (vol: number) => {
    if (vol === 0) return 'MUTE';
    const db = Math.round(20 * Math.log10(vol));
    return `${db} dB`;
  };

  // Sector Sound Toggles State
  const [sectorSoundEnabled, setSectorSoundEnabled] = useState<{
    producao: boolean;
    caixa: boolean;
    order: boolean;
    gerente: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('adegaos_sector_sound_routing');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { producao: true, caixa: true, order: true, gerente: true };
  });

  const handleToggleSectorSound = (sector: 'producao' | 'caixa' | 'order' | 'gerente') => {
    setSectorSoundEnabled(prev => {
      const updated = { ...prev, [sector]: !prev[sector] };
      localStorage.setItem('adegaos_sector_sound_routing', JSON.stringify(updated));
      return updated;
    });
  };

  // PWA Notification State
  const [pwaPermission, setPwaPermission] = useState<string>(() => pwaService.getPermissionStatus());
  const [notifyNewOrders, setNotifyNewOrders] = useState<boolean>(() => {
    return localStorage.getItem('adegaos_pwa_notify_orders') !== 'false';
  });
  const [notifyPrintErrors, setNotifyPrintErrors] = useState<boolean>(() => {
    return localStorage.getItem('adegaos_pwa_notify_errors') !== 'false';
  });

  // Background Print Queue State
  const [printQueueList, setPrintQueueList] = useState<PrintQueueItem[]>(() => printService.getQueue());

  // EventBus Real-time Ticker Stream
  const [eventFilter, setEventFilter] = useState<'all' | 'orders' | 'financial' | 'print'>('all');
  const [eventBusStream, setEventBusStream] = useState<Array<{
    id: string;
    time: string;
    type: string;
    category: 'orders' | 'financial' | 'print' | 'system';
    details: string;
  }>>([
    {
      id: 'init_1',
      time: new Date().toLocaleTimeString('pt-BR'),
      type: 'SYSTEM_BOOT',
      category: 'system',
      details: 'Sintetizador Web Audio API e Barramento EventBus inicializados com sucesso.'
    }
  ]);

  // Periodic Refresh for Queue & Events
  useEffect(() => {
    const interval = setInterval(() => {
      setPrintQueueList(printService.getQueue());
      setSoundSettings(audioManager.getSettings());
      setPwaPermission(pwaService.getPermissionStatus());
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // EventBus Stream Subscription
  useEffect(() => {
    const pushLog = (type: string, category: 'orders' | 'financial' | 'print' | 'system', details: string) => {
      setEventBusStream(prev => [
        {
          id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          time: new Date().toLocaleTimeString('pt-BR'),
          type,
          category,
          details
        },
        ...prev.slice(0, 39) // keep last 40 events
      ]);
    };

    const unsubOrderCreated = eventBus.subscribe('ORDER_CREATED', (data) => {
      pushLog('ORDER_CREATED', 'orders', `Pedido #${data.id.slice(-6).toUpperCase()} ${data.table ? `(${data.table})` : ''} encaminhado à Produção.`);
    });

    const unsubOrderReady = eventBus.subscribe('ORDER_READY', (data) => {
      pushLog('ORDER_READY', 'orders', `Pedido #${data.id.slice(-6).toUpperCase()} pronto para entrega.`);
    });

    const unsubOrderCancelled = eventBus.subscribe('ORDER_CANCELLED', (data) => {
      pushLog('ORDER_CANCELLED', 'orders', `Pedido #${data.id.slice(-6).toUpperCase()} cancelado. ${data.reason ? `Motivo: ${data.reason}` : ''}`);
    });

    const unsubPrint = eventBus.subscribe('PRINT_REQUESTED', (data) => {
      pushLog('PRINT_REQUESTED', 'print', `Trabalho de impressão tipo '${data.type}' enviado à fila background.`);
    });

    const unsubCash = eventBus.subscribe('CASH_FLOW_UPDATED', (data) => {
      pushLog('CASH_FLOW_UPDATED', 'financial', `Movimentação de caixa: ${data.type.toUpperCase()}`);
    });

    return () => {
      unsubOrderCreated();
      unsubOrderReady();
      unsubOrderCancelled();
      unsubPrint();
      unsubCash();
    };
  }, []);

  const filteredEvents = eventBusStream.filter(e => {
    if (eventFilter === 'all') return true;
    return e.category === eventFilter;
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      
      {/* =========================================================================
          HERO STATUS BANNER - Enterprise System Health & Background Workers
          ========================================================================= */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-gradient-to-r from-[#0D1C14] via-[#0A0A0A] to-[#080808] border-[#18F2A4]/30' : 'bg-gradient-to-r from-emerald-50 via-white to-gray-50 border-emerald-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`p-3.5 rounded-2xl shrink-0 border shadow-inner ${
            isDark ? 'bg-[#18F2A4]/10 text-[#18F2A4] border-[#18F2A4]/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}>
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`font-black text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Serviços em Segundo Plano & Áudio Operacional
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border flex items-center gap-1 ${
                isDark ? 'bg-[#18F2A4]/15 text-[#18F2A4] border-[#18F2A4]/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                <Activity className="w-3 h-3" /> Worker Ativo
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Gerenciador centralizado do sintetizador Web Audio API, notificações nativas PWA, fila de impressão e barramento de eventos do FluxOS.
            </p>
          </div>
        </div>

        {/* Telemetry Quick Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className={`px-3 py-1.5 rounded-xl border font-mono text-[11px] font-bold flex items-center gap-2 ${
            soundSettings.isUnlocked
              ? (isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-900')
              : (isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-100 border-amber-300 text-amber-900')
          }`}>
            <Volume2 className="w-4 h-4" />
            <span>{soundSettings.isUnlocked ? 'Áudio Habilitado (Unlocked)' : 'Áudio Aguardando Toque'}</span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border font-mono text-[11px] font-bold flex items-center gap-2 ${
            pwaPermission === 'granted'
              ? (isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-100 border-blue-300 text-blue-900')
              : (isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-slate-700')
          }`}>
            <Bell className="w-4 h-4" />
            <span>PWA Push: {pwaPermission === 'granted' ? 'Ativo' : pwaPermission}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          GRID SECTION 1: SINTETIZADOR DE ÁUDIO OPERACIONAL (WEB AUDIO API)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Main Audio Master & Tone Tester */}
        <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
          isDark ? 'bg-[#0A0A0A] border-[#1C1C1C]' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              <Volume2 className={`w-4 h-4 ${isDark ? 'text-[#18F2A4]' : 'text-emerald-700'}`} />
              <h3 className={`font-bold text-xs uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                1. Sintetizador de Áudio Operacional
              </h3>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>
                {soundSettings.soundEnabled ? 'Áudio Ligado' : 'Mutado'}
              </span>
              <input
                type="checkbox"
                checked={soundSettings.soundEnabled}
                onChange={(e) => {
                  audioManager.saveSettings(soundSettings.volume, e.target.checked);
                  setSoundSettings(audioManager.getSettings());
                }}
                className="accent-[#18F2A4] w-4 h-4 cursor-pointer"
              />
            </label>
          </div>

          <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            O sintetizador de áudio roda via Web Audio API em primeiro plano, produzindo timbres instantâneos de 0ms de latência sem dependências de arquivos de som externos.
          </p>

          {/* Master Volume Slider Control (Enterprise Clean UI) */}
          <div className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${
            isDark ? 'bg-[#111111] border-gray-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const newEnabled = !soundSettings.soundEnabled;
                    audioManager.saveSettings(soundSettings.volume, newEnabled);
                    setSoundSettings(audioManager.getSettings());
                  }}
                  className={`p-2 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                    !soundSettings.soundEnabled || soundSettings.volume === 0
                      ? (isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600')
                      : soundSettings.volume < 0.4
                        ? (isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
                        : (isDark ? 'bg-[#18F2A4]/15 border-[#18F2A4]/40 text-[#18F2A4]' : 'bg-emerald-100 border-emerald-300 text-emerald-800')
                  }`}
                  title={soundSettings.soundEnabled ? 'Clique para Mutar' : 'Clique para Ativar Áudio'}
                >
                  {!soundSettings.soundEnabled || soundSettings.volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : soundSettings.volume < 0.4 ? (
                    <Volume1 className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                <div className="flex flex-col">
                  <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Volume Mestre do Sintetizador
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    Nível de Saída: <strong className={isDark ? 'text-[#18F2A4]' : 'text-emerald-700'}>{getDbDisplay(soundSettings.soundEnabled ? soundSettings.volume : 0)}</strong>
                  </span>
                </div>
              </div>

              {/* Readout Percentage Badge */}
              <div className={`px-2.5 py-1 rounded-lg border font-mono font-black text-xs ${
                !soundSettings.soundEnabled || soundSettings.volume === 0
                  ? (isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600')
                  : (isDark ? 'bg-[#18F2A4]/10 border-[#18F2A4]/30 text-[#18F2A4]' : 'bg-emerald-100 border-emerald-300 text-emerald-800')
              }`}>
                {soundSettings.soundEnabled ? `${Math.round(soundSettings.volume * 100)}%` : 'MUTADO'}
              </div>
            </div>

            {/* Custom Track Slider */}
            <div className="relative flex items-center w-full py-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={soundSettings.soundEnabled ? soundSettings.volume : 0}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full cursor-pointer h-2.5 rounded-full appearance-none outline-none transition-all z-10 opacity-0"
              />
              {/* Custom Track Background & Progress Fill */}
              <div className={`absolute left-0 right-0 h-2.5 rounded-full overflow-hidden pointer-events-none border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-slate-200 border-slate-300'
              }`}>
                <div
                  className={`h-full transition-all duration-75 rounded-full ${
                    !soundSettings.soundEnabled || soundSettings.volume === 0
                      ? 'bg-gray-500'
                      : isDark
                        ? 'bg-gradient-to-r from-emerald-500 to-[#18F2A4] shadow-[0_0_12px_rgba(24,242,164,0.4)]'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  }`}
                  style={{ width: `${soundSettings.soundEnabled ? soundSettings.volume * 100 : 0}%` }}
                />
              </div>

              {/* Custom Thumb handle overlay */}
              <div
                className={`absolute w-5 h-5 rounded-full border-2 shadow-md pointer-events-none transition-all duration-75 -ml-2.5 flex items-center justify-center ${
                  !soundSettings.soundEnabled || soundSettings.volume === 0
                    ? 'bg-gray-400 border-gray-600'
                    : isDark
                      ? 'bg-white border-[#18F2A4] ring-2 ring-[#18F2A4]/30'
                      : 'bg-white border-emerald-600 ring-2 ring-emerald-600/30'
                }`}
                style={{ left: `${soundSettings.soundEnabled ? soundSettings.volume * 100 : 0}%` }}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isDark ? 'bg-[#18F2A4]' : 'bg-emerald-600'
                }`} />
              </div>
            </div>

            {/* Clean Quick Preset Pills */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              {[
                { label: 'Mute', val: 0 },
                { label: '25%', val: 0.25 },
                { label: '50%', val: 0.50 },
                { label: '75%', val: 0.75 },
                { label: '100%', val: 1.00 }
              ].map(p => {
                const isSelected = soundSettings.soundEnabled && Math.abs(soundSettings.volume - p.val) < 0.04;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleVolumeChange(p.val)}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border text-center ${
                      isSelected
                        ? (isDark ? 'bg-[#18F2A4] text-black border-[#18F2A4]' : 'bg-emerald-600 text-white border-emerald-600 shadow-sm')
                        : (isDark ? 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100')
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operational Timbre Test Cards (Clean Enterprise Design) */}
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Testar Timbres Operacionais:
              </span>
              <span className="text-[10px] font-mono text-gray-400">Web Audio API</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  sound: 'order_created',
                  label: 'Novo Pedido',
                  desc: 'Tom Agudo Duplo (880Hz → 1174Hz)',
                  dotColor: 'bg-emerald-500'
                },
                {
                  sound: 'order_ready',
                  label: 'Pedido Pronto',
                  desc: 'Acorde Triplo Harmonioso',
                  dotColor: 'bg-blue-500'
                },
                {
                  sound: 'order_cancelled',
                  label: 'Pedido Cancelado',
                  desc: 'Tom Grave Duplo Alerta',
                  dotColor: 'bg-amber-500'
                },
                {
                  sound: 'cash_flow',
                  label: 'Venda no Caixa',
                  desc: 'Brilho Financeiro Suave',
                  dotColor: 'bg-purple-500'
                },
                {
                  sound: 'print_error',
                  label: 'Erro de Impressão',
                  desc: 'Alarme Triplo de Falha',
                  dotColor: 'bg-red-500'
                },
                {
                  sound: 'ding',
                  label: 'Sinal Padrão',
                  desc: 'Bip Único de Notificação',
                  dotColor: 'bg-slate-400'
                }
              ].map(item => {
                const isPlaying = playingSound === item.sound;
                return (
                  <button
                    key={item.sound}
                    type="button"
                    onClick={() => triggerSoundTest(item.sound as SoundType)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.98] ${
                      isPlaying
                        ? (isDark ? 'bg-[#18F2A4]/10 border-[#18F2A4] ring-1 ring-[#18F2A4]/30' : 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/20')
                        : (isDark ? 'bg-[#111111] border-gray-800 hover:border-gray-700 hover:bg-gray-900' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs')
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${item.dotColor} ${isPlaying ? 'animate-ping' : ''}`} />
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.label}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono truncate">
                          {item.desc}
                        </span>
                      </div>
                    </div>

                    {/* Animated Sound Equalizer Waves or Play Pill */}
                    <div className="shrink-0 flex items-center gap-1">
                      {isPlaying ? (
                        <div className="flex items-end gap-0.5 h-4 px-2">
                          <motion.div animate={{ height: [4, 14, 6, 16, 4] }} transition={{ repeat: Infinity, duration: 0.3 }} className={`w-0.5 rounded-full ${isDark ? 'bg-[#18F2A4]' : 'bg-emerald-600'}`} />
                          <motion.div animate={{ height: [12, 6, 16, 8, 12] }} transition={{ repeat: Infinity, duration: 0.35 }} className={`w-0.5 rounded-full ${isDark ? 'bg-[#18F2A4]' : 'bg-emerald-600'}`} />
                          <motion.div animate={{ height: [6, 16, 8, 14, 6] }} transition={{ repeat: Infinity, duration: 0.28 }} className={`w-0.5 rounded-full ${isDark ? 'bg-[#18F2A4]' : 'bg-emerald-600'}`} />
                        </div>
                      ) : (
                        <div className={`p-1.5 rounded-lg border transition-all group-hover:scale-105 ${
                          isDark ? 'bg-gray-800 border-gray-700 text-gray-300 group-hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 group-hover:bg-slate-200'
                        }`}>
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel 2: Sector Sound Routing Matrix & PWA System Notifications */}
        <div className="flex flex-col gap-6">
          
          {/* Sector Sound Routing Matrix */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-3.5 ${
            isDark ? 'bg-[#0A0A0A] border-[#1C1C1C]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2.5 ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <Layers className={`w-4 h-4 ${isDark ? 'text-[#18F2A4]' : 'text-emerald-700'}`} />
                <h3 className={`font-bold text-xs uppercase tracking-wider ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  2. Roteamento de Áudio por Setor
                </h3>
              </div>
              <span className="text-[10px] font-mono text-gray-400">Ativação Local</span>
            </div>

            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Configure em quais módulos e telas operacionais os timbres de aviso sonoro devem ser executados.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {[
                { key: 'producao', label: 'Cozinha & Produção', desc: 'Bipa em novos pedidos' },
                { key: 'caixa', label: 'Caixa & Balcão', desc: 'Bipa em vendas e erros' },
                { key: 'order', label: 'Atendimento Mobile', desc: 'Bipa em pedidos prontos' },
                { key: 'gerente', label: 'Painel do Gerente', desc: 'Recebe todos os alertas' }
              ].map(sec => {
                const isActive = sectorSoundEnabled[sec.key as keyof typeof sectorSoundEnabled];
                return (
                  <div
                    key={sec.key}
                    onClick={() => handleToggleSectorSound(sec.key as any)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      isActive
                        ? (isDark ? 'bg-[#18F2A4]/10 border-[#18F2A4]/30 text-white' : 'bg-emerald-50 border-emerald-300 text-slate-900')
                        : (isDark ? 'bg-[#111] border-gray-800 text-gray-500' : 'bg-gray-100 border-gray-200 text-slate-500')
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{sec.label}</div>
                      <div className="text-[10px] opacity-75">{sec.desc}</div>
                    </div>
                    {isActive ? (
                      <ToggleRight className="w-5 h-5 text-[#18F2A4] shrink-0" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-500 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PWA & System OS Notifications */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-3.5 ${
            isDark ? 'bg-[#0A0A0A] border-[#1C1C1C]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2.5 ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <Bell className={`w-4 h-4 ${isDark ? 'text-[#18F2A4]' : 'text-emerald-700'}`} />
                <h3 className={`font-bold text-xs uppercase tracking-wider ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  3. Notificações PWA / Sistema Operacional
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                pwaPermission === 'granted'
                  ? (isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-300')
                  : (isDark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-800 border border-amber-300')
              }`}>
                {pwaPermission === 'granted' ? 'Concedido' : pwaPermission === 'denied' ? 'Negado' : 'Pendente'}
              </span>
            </div>

            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Permite enviar alertas nativos do Windows / Android / macOS mesmo com o navegador minimizado em segundo plano.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  const granted = await pwaService.requestNotificationPermission();
                  setPwaPermission(pwaService.getPermissionStatus());
                  if (granted) alert('Permissão de Notificação Concedida com Sucesso!');
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                  pwaPermission === 'granted'
                    ? (isDark ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' : 'bg-gray-200 text-slate-800 border-gray-300 hover:bg-gray-300')
                    : 'bg-[#18F2A4] text-black border-[#18F2A4] hover:bg-[#12d58f]'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>{pwaPermission === 'granted' ? 'Permissão Ativa' : 'Solicitar Permissão do SO'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const sent = await pwaService.sendNotification('FluxOS Teste de Notificação', {
                    body: 'Notificação nativa de teste disparada pelo Service Worker.',
                    tag: `test_${Date.now()}`
                  });
                  if (!sent && pwaPermission !== 'granted') {
                    alert('Solicite e permita as Notificações do Navegador primeiro.');
                  }
                }}
                className={`py-2.5 px-4 rounded-xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                  isDark ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-white' : 'border-gray-300 bg-gray-100 hover:bg-gray-200 text-slate-800'
                }`}
              >
                <Zap className={`w-4 h-4 ${isDark ? 'text-[#18F2A4]' : 'text-emerald-700'}`} />
                <span>Testar Notificação Nativa</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          SECTION 3: FILA DE TRABALHOS BACKGROUND (PRINTSERVICE SINGLETON)
          ========================================================================= */}
      <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
        isDark ? 'bg-[#0A0A0A] border-[#1C1C1C]' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <Printer className={`w-4 h-4 ${isDark ? 'text-[#18F2A4]' : 'text-emerald-700'}`} />
            <h3 className={`font-bold text-xs uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              4. Fila de Trabalhos em Segundo Plano (PrintService Worker)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
              isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-800 border-purple-300'
            }`}>
              Deduplicação 30s Ativa
            </span>

            <button
              type="button"
              onClick={() => {
                printService.clearCompleted();
                setPrintQueueList(printService.getQueue());
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-slate-800 border-gray-300'
              }`}
            >
              Limpar Concluídos
            </button>
          </div>
        </div>

        {printQueueList.length === 0 ? (
          <div className={`p-8 text-center text-xs italic rounded-xl border border-dashed ${
            isDark ? 'border-gray-800 text-gray-500 bg-[#111111]/50' : 'border-gray-300 text-slate-500 bg-gray-50'
          }`}>
            Nenhum trabalho na fila de segundo plano no momento. Todas as impressões e tarefas foram processadas.
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {printQueueList.map(item => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                  isDark ? 'bg-[#111111] border-gray-800' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] uppercase border ${
                    item.status === 'completed'
                      ? (isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300')
                      : item.status === 'error'
                        ? (isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-800 border-red-300')
                        : item.status === 'processing'
                          ? (isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse' : 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse')
                          : (isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300')
                  }`}>
                    {item.status}
                  </span>

                  <div className="flex flex-col min-w-0">
                    <span className={`font-bold truncate ${isDark ? 'text-gray-200' : 'text-slate-900'}`}>
                      {item.type.toUpperCase()} {item.sector ? `[Setor: ${item.sector}]` : ''}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 truncate">
                      Key: {item.jobKey}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {item.status === 'error' && (
                    <button
                      type="button"
                      onClick={() => {
                        printService.reprocessJob(item.id);
                        setPrintQueueList(printService.getQueue());
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 cursor-pointer"
                    >
                      Reprocessar
                    </button>
                  )}
                  <span className="text-[10px] font-mono text-gray-400">
                    {new Date(item.createdTime).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 4: BARRAMENTO DE EVENTOS EM TEMPO REAL (EVENTBUS TICKER MONITOR)
          ========================================================================= */}
      <div className={`p-5 rounded-2xl border flex flex-col gap-4 font-mono text-xs ${
        isDark ? 'bg-[#050505] border-[#1C1C1C]' : 'bg-gray-900 border-gray-800 text-gray-100 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-gray-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#18F2A4]" />
            <h3 className="font-bold uppercase tracking-wider text-[#18F2A4]">
              5. Monitor do Barramento EventBus em Tempo Real
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pills */}
            {(['all', 'orders', 'financial', 'print'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setEventFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  eventFilter === f
                    ? 'bg-[#18F2A4] text-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'orders' ? 'Pedidos' : f === 'financial' ? 'Caixa' : 'Impressão'}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setEventBusStream([])}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white cursor-pointer border border-gray-700"
            >
              Limpar
            </button>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-6 text-center text-gray-500 italic text-xs">
            Nenhum evento registrado no barramento para este filtro.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
            {filteredEvents.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 py-1 px-2 rounded hover:bg-white/5 transition-all text-[11px]">
                <span className="text-gray-500 shrink-0 font-mono">[{ev.time}]</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 uppercase ${
                  ev.category === 'orders' ? 'bg-blue-500/20 text-blue-300' :
                  ev.category === 'financial' ? 'bg-purple-500/20 text-purple-300' :
                  ev.category === 'print' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {ev.type}
                </span>
                <span className="text-gray-300 truncate">{ev.details}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
