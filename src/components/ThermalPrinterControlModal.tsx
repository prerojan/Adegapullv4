import React, { useState, useEffect } from 'react';
import { Printer, X, Laptop, Usb, Bluetooth, Copy, Check, Download, Play, Settings } from 'lucide-react';
import { printViaSystemBrowser, connectAndPrintWebUSB, connectAndPrintWebSerial, generateEscPosBuffer } from '../lib/thermalPrinter';

interface ThermalPrinterControlModalProps {
  theme: 'dark' | 'light';
}

export default function ThermalPrinterControlModal({ theme }: ThermalPrinterControlModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [receiptText, setReceiptText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleRequestedPrint = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail && customEvent.detail.text) {
        setReceiptText(customEvent.detail.text);
        const mode = localStorage.getItem('adegaos_printer_mode') || 'system';
        if (mode === 'virtual') {
          setIsOpen(true);
        }
      }
    };

    window.addEventListener('adegaos_thermal_print_requested', handleRequestedPrint);
    return () => {
      window.removeEventListener('adegaos_thermal_print_requested', handleRequestedPrint);
    };
  }, []);

  if (!isOpen || !receiptText) return null;

  const paperSize = (localStorage.getItem('adegaos_paper_size') as '58mm' | '80mm') || '58mm';

  const handleSystemPrint = () => {
    setIsPrinting(true);
    setStatusMessage('Enviando para a Impressora Padrão do Windows...');
    printViaSystemBrowser(receiptText, paperSize);
    setTimeout(() => {
      setIsPrinting(false);
      setStatusMessage('Trabalho enviado para o Spooler!');
    }, 1000);
  };

  const handleWebUsbPrint = async () => {
    setIsPrinting(true);
    setStatusMessage('Procurando impressora USB...');
    const buffer = generateEscPosBuffer(receiptText);
    const success = await connectAndPrintWebUSB(buffer);
    setIsPrinting(false);
    if (success) {
      setStatusMessage('Impresso via USB com sucesso!');
    } else {
      setStatusMessage('Não foi possível conectar via WebUSB. Tente o Driver do Sistema.');
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(receiptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cupom_fluxos_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
        theme === 'dark' ? 'bg-[#0A0A0A] border-gray-800 text-white' : 'bg-white border-gray-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E7EB' }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#18F2A4]/10 text-[#18F2A4]">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">Central de Impressão Térmica</h3>
              <p className="text-[11px] text-gray-400">Cupom gerado em tempo real pelo FluxOS</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          
          {/* Status banner */}
          {statusMessage && (
            <div className="p-3 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between">
              <span>{statusMessage}</span>
              <button onClick={() => setStatusMessage(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Receipt Roll Simulation */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
              Visualização da Bobina ({paperSize})
            </span>
            <div className={`p-4 rounded-xl border font-mono text-xs leading-relaxed text-black bg-[#FFFEE0] shadow-inner select-all overflow-x-auto w-full max-w-[320px] ${
              paperSize === '80mm' ? 'max-w-[380px]' : 'max-w-[290px]'
            }`}>
              <pre className="whitespace-pre-wrap word-break-all font-mono text-[11px]">
                {receiptText}
              </pre>
            </div>
          </div>

          {/* Connection Trigger Buttons */}
          <div className="flex flex-col gap-2 mt-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
              Escolha a Impressora de Destino
            </span>

            {/* Option 1: System Printer (Windows / HPRT-II on USB005) */}
            <button
              onClick={handleSystemPrint}
              disabled={isPrinting}
              className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-between cursor-pointer transition-all ${
                theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f] border-[#18F2A4]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e] border-[#10B981]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Laptop className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-extrabold">Imprimir no Windows / Driver do Sistema</div>
                  <div className="text-[10px] opacity-80">HPRT-II na USB005, USB001, Spooler ou Impressora Padrão</div>
                </div>
              </div>
              <Play className="w-4 h-4" />
            </button>

            {/* Option 2: WebUSB Direct */}
            <button
              onClick={handleWebUsbPrint}
              disabled={isPrinting}
              className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-between cursor-pointer transition-all ${
                theme === 'dark' ? 'bg-[#111] border-gray-800 text-white hover:bg-[#1a1a1a]' : 'bg-gray-100 border-gray-200 text-slate-900 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Usb className="w-4 h-4 text-[#18F2A4]" />
                <div className="text-left">
                  <div className="font-extrabold">Conectar USB Direto (WebUSB)</div>
                  <div className="text-[10px] text-gray-400">Selecione HPRT-II, Elgin, Bematech ou POS58 na caixa</div>
                </div>
              </div>
              <Play className="w-4 h-4" />
            </button>

            {/* Action Tools: Copy & Download */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={handleCopyText}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === 'dark' ? 'bg-[#111] border-gray-800 text-gray-300 hover:bg-[#1a1a1a]' : 'bg-gray-100 border-gray-200 text-slate-700 hover:bg-gray-200'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar Texto'}
              </button>

              <button
                onClick={handleDownloadTxt}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === 'dark' ? 'bg-[#111] border-gray-800 text-gray-300 hover:bg-[#1a1a1a]' : 'bg-gray-100 border-gray-200 text-slate-700 hover:bg-gray-200'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Cupom (.txt)
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
