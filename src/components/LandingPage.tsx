import React, { useState } from 'react';
import { 
  Sparkles, ShieldCheck, Zap, Package, Users, CheckCircle2, HelpCircle, 
  ArrowRight, ShieldAlert, DollarSign, ExternalLink, FileSpreadsheet, 
  Check, AlertTriangle, ShoppingCart, Printer, Clock, ArrowUpRight, 
  Layers, Lock, Settings, Activity, FileText, BarChart3, Sun, Moon
} from 'lucide-react';

interface LandingPageProps {
  theme: 'dark' | 'light';
  onEnterSystem: () => void;
  onEnterAdmin: () => void;
  onToggleTheme: () => void;
}

export default function LandingPage({ theme, onEnterSystem, onEnterAdmin, onToggleTheme }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // Interactive Hero Preview state
  const [heroPreviewTab, setHeroPreviewTab] = useState<'dashboard' | 'pdv' | 'pedidos' | 'impressao' | 'estoque' | 'financeiro'>('dashboard');

  // "Do pedido ao resultado" stepper state
  const [activeStep, setActiveStep] = useState<number>(0);

  // "Controle sua equipe" active role state
  const [activeRole, setActiveRole] = useState<'admin' | 'manager' | 'cashier' | 'waiter' | 'production'>('manager');

  // Pricing/ROI Calculator states
  const [monthlySales, setMonthlySales] = useState<number>(45000);
  const [estimatedLoss, setEstimatedLoss] = useState<number>(8); // 8% average leakage

  // B2B Lead generation modal states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactStore, setContactStore] = useState('');
  const [contactSent, setContactSent] = useState(false);

  // Keyboard shortcut bypass Alt+L for developers/reviewers
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        onEnterSystem();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnterSystem]);

  const systemSavings = Math.round((monthlySales * estimatedLoss) / 100);
  const ROIValue = Math.max(0, systemSavings - 149); // Estimated subscription price R$149/mo

  const handleToggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const competitors = [
    {
      feature: 'Previsão de Ruptura de Estoque (Curva ABC & Lead Time)',
      fluxOs: true,
      genericPos: false,
      legacySoft: 'Apenas relatórios estáticos, sem estimativa'
    },
    {
      feature: 'Rastreabilidade FIFO / PEPS com Gestão de Lotes de Validade',
      fluxOs: true,
      genericPos: false,
      legacySoft: 'Geralmente cadastrado como observação de texto'
    },
    {
      feature: 'Sincronização em Tempo Real (Garçom / Balcão / Produção)',
      fluxOs: true,
      genericPos: 'Sincronização lenta ou dependente de banco local',
      legacySoft: true
    },
    {
      feature: 'Desdobramento de Fardos / Receita Dose Automática',
      fluxOs: true,
      genericPos: false,
      legacySoft: 'Requer módulo externo caro de produção'
    },
    {
      feature: 'Painel BI Integrado com DRE e Fluxo de Caixa Real',
      fluxOs: true,
      genericPos: 'Apenas resumo básico de vendas',
      legacySoft: 'Geralmente requer exportar para Excel'
    },
    {
      feature: 'Funcionalidade Offline com Sincronia de Recuperação',
      fluxOs: true,
      genericPos: false,
      legacySoft: 'Banco local isolado'
    }
  ];

  const faqs = [
    {
      q: 'O que é o FluxOS e para quem ele serve?',
      a: 'O FluxOS é um ecossistema operacional de ponto de venda (PDV), retaguarda e controle inteligente de estoque projetado especificamente para adegas, depósitos de bebidas, lojas de conveniência e pubs. Ele centraliza a venda rápida de balcão, entrega, atendimento em mesas/comandas com aplicativo do garçom, gestão financeira (DRE) e de fornecedores.'
    },
    {
      q: 'Como funciona o controle de lotes e o método FIFO?',
      a: 'Nosso sistema permite cadastrar e rastrear lotes específicos de mercadorias com suas respectivas datas de validade. Na venda, o FluxOS prioriza a baixa automática do lote que vence primeiro (PEPS/FIFO), emitindo alertas sonoros e visuais se houver produtos próximos do vencimento nas gôndolas.'
    },
    {
      q: 'O que significa a Curva ABC de produtos?',
      a: 'A Curva ABC classifica os produtos de acordo com a representatividade financeira nas vendas dos últimos 30 dias. Classe A representam cerca de 70% do seu faturamento (giro altíssimo), Classe B os próximos 20% e Classe C os 10% restantes. O sistema usa essa métrica cruzada com o Lead Time do fornecedor para calcular o Ponto de Reabastecimento ideal e sugerir compras automáticas, impedindo a falta de estoque sem comprometer o fluxo de caixa.'
    },
    {
      q: 'É possível operar sem internet?',
      a: 'Sim! O FluxOS possui arquitetura resiliente com suporte offline. Se a sua conexão de internet cair, você continua realizando vendas rápidas, lançando comandas de salão e operando o caixa normalmente. Os dados ficam em fila de sincronização local (IndexedDB) e são enviados para a nuvem automaticamente assim que a rede se restabelecer.'
    }
  ];

  // Steps flow data
  const flowSteps = [
    {
      id: 0,
      title: 'Venda registrada',
      description: 'O caixa finaliza uma venda rápida no PDV ou o garçom lança um pedido na comanda do salão.',
      details: {
        type: 'venda',
        source: 'PDV Balcão - Caixa #1',
        items: '2x Combo Gin Tanqueray + Tonic, 1x Gelo Cubo',
        value: 'R$ 198,00',
        badge: 'Finalizado via PIX'
      }
    },
    {
      id: 1,
      title: 'Pedido processado',
      description: 'O sistema valida a transação de forma assíncrona e encaminha o pedido para a fila correta de montagem.',
      details: {
        type: 'pedido',
        status: 'Preparando',
        queue: 'Fila de Preparação Balcão',
        time: 'Instante t + 0.4s',
        alert: 'Sincronizado com o Monitor da Produção'
      }
    },
    {
      id: 2,
      title: 'Impressão enviada',
      description: 'A ordem é automaticamente disparada para a respectiva impressora térmica física de comanda.',
      details: {
        type: 'impressao',
        printer: 'Térmica Bematech - Setor Bebidas Rápidas',
        status: 'Impressão Concluída',
        target: 'Impressão automática sem intervenção manual',
        layout: 'COMANDA #4120 - MESA 08'
      }
    },
    {
      id: 3,
      title: 'Estoque atualizado',
      description: 'O estoque dá baixa automática nas garrafas utilizando a regra FIFO (Lote com vencimento mais próximo sai primeiro).',
      details: {
        type: 'estoque',
        sku: 'Gin Tanqueray 750ml (SKU-8822)',
        batch: 'Lote LOT-JAN-24 (Vencimento 25/11/2026)',
        remaining: 'Faltam 42 unidades no lote ativo',
        action: 'Baixa automática efetuada'
      }
    },
    {
      id: 4,
      title: 'Informação disponível',
      description: 'O faturamento bruto, o custo da mercadoria vendida (CMV) e as taxas de cartão são consolidados na DRE.',
      details: {
        type: 'financeiro',
        accounting: 'DRE / Fluxo de Caixa Atualizado',
        revenue: '+ R$ 198,00 faturado',
        cmv: 'Custo Real: R$ 104,20',
        profit: 'Lucro Líquido Lançado: R$ 93,80'
      }
    }
  ];

  // Users roles metadata
  const teamRoles = {
    admin: {
      name: 'Administrador (Proprietário)',
      description: 'Acesso total e estratégico sobre todo o ecossistema.',
      permissions: [
        'Visualização de faturamento global e consolidação de filiais',
        'Configurações fiscais, DRE financeiro avançado e auditoria',
        'Gestão de usuários, criação de acessos e alteração de permissões'
      ],
      viewMockup: {
        header: 'Painel Central do Proprietário',
        metrics: [
          { label: 'Faturamento Consolidado', val: 'R$ 148.900,00' },
          { label: 'Lucro Líquido (Global)', val: 'R$ 47.648,00' },
          { label: 'Unidades Ativas', val: '3 Filiais' }
        ]
      }
    },
    manager: {
      name: 'Gerente Operacional',
      description: 'Controle de estoque, compras e conciliação de caixa.',
      permissions: [
        'Lançamento de compras de fornecedores e controle de Curva ABC',
        'Ajustes de estoque físico e acompanhamento de validades FIFO',
        'Abertura, fechamento e sangrias de caixas operacionais'
      ],
      viewMockup: {
        header: 'Retaguarda & Gestão de Compras',
        metrics: [
          { label: 'Sugestão de Compra', val: '14 Itens em Ruptura' },
          { label: 'Alertas de Lote Vencendo', val: '2 Lotes Ativos' },
          { label: 'Conciliação de Hoje', val: 'R$ 4.890,20 Pendente' }
        ]
      }
    },
    cashier: {
      name: 'Caixa / Atendente de Balcão',
      description: 'Frente de caixa rápido com foco em fluxo ágil de atendimento.',
      permissions: [
        'Registro rápido de vendas no PDV com leitura de código de barras',
        'Lançamento instantâneo de recebimento em PIX, Cartão ou Dinheiro',
        'Visualização restrita ao caixa do próprio turno de trabalho'
      ],
      viewMockup: {
        header: 'Frente de Caixa Rápido PDV',
        metrics: [
          { label: 'Carrinho Ativo', val: '3 Itens' },
          { label: 'Total Acumulado Turno', val: 'R$ 2.410,00' },
          { label: 'Status do Caixa', val: 'ABERTO' }
        ]
      }
    },
    waiter: {
      name: 'Garçom / Atendente de Mesa',
      description: 'Aplicativo móvel para lançamento rápido de comandas diretamente no salão.',
      permissions: [
        'Abertura de comandas, adição e cancelamento de itens por mesa',
        'Chamado de conta e impressão prévia de cupom não fiscal de mesa',
        'Bloqueado de acesso a estoque global ou relatórios financeiros'
      ],
      viewMockup: {
        header: 'FluxOS Comandas Mobile',
        metrics: [
          { label: 'Minhas Mesas Ativas', val: '6 Mesas' },
          { label: 'Comandas Pendentes', val: 'R$ 840,00' },
          { label: 'Tempo Médio Atendimento', val: '8 min' }
        ]
      }
    },
    production: {
      name: 'Operador de Produção / Balcão Preparador',
      description: 'Visualização simplificada da fila de preparação e expedição.',
      permissions: [
        'Monitor de pedidos recebidos em tempo real para montagem de combos',
        'Baixa rápida de pedidos finalizados na fila de expedição',
        'Totalmente isolado de transações monetárias, caixas ou faturamento'
      ],
      viewMockup: {
        header: 'KDS - Monitor de Expedição Balcão',
        metrics: [
          { label: 'Pedidos na Fila', val: '4 Combos' },
          { label: 'Aguardando Retirada', val: '1 Pedido' },
          { label: 'Tempo de Preparo Médio', val: '3.5 min' }
        ]
      }
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col font-sans transition-all duration-300 ${
      theme === 'dark' ? 'bg-[#000000] text-white theme-dark' : 'bg-gray-50 text-gray-900 theme-light'
    }`}>
      
      {/* Top Header Navigation */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b flex items-center justify-between px-6 py-4 transition-colors ${
        theme === 'dark' ? 'bg-[#000000]/80 border-[#111111]' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="flex items-center gap-2 cursor-default select-none group">
          <img src="/logo.png" alt="FluxOS Logo" className="w-5.5 h-5.5 object-contain shrink-0 group-hover:scale-105 transition-transform" />
          <span className={`font-extrabold text-sm tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Flux<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-[#18F2A4]">OS</span>
          </span>
          <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ml-1 ${
            theme === 'dark' ? 'bg-[#18F2A4]/5 text-[#18F2A4] border-[#18F2A4]/20' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            v3.5 PRO
          </span>
        </div>

        {/* Action button cluster */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-lg border transition-all text-xs cursor-pointer ${
              theme === 'dark' ? 'bg-[#0E0E0E] border-[#222] hover:bg-[#161616]' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
            }`}
            title="Alternar Tema"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-600" />}
          </button>

          <button
            onClick={() => setIsContactModalOpen(true)}
            className={`px-4 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              theme === 'dark' 
                ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f] shadow-[0_0_15px_rgba(24,242,164,0.3)]' 
                : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
            }`}
          >
            Solicitar Demonstração
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 1. Hero Section */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        {/* Glow Effects */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[350px] sm:w-[500px] h-[250px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 text-xs animate-pulse ${
          theme === 'dark' 
            ? 'border-[#18F2A4]/20 bg-[#18F2A4]/5 text-[#18F2A4]' 
            : 'border-emerald-300 bg-emerald-100 text-emerald-950 font-extrabold shadow-sm'
        }`}>
          <Zap className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-800'}`} />
          <span>Controle Operacional & Inteligência de Estoque unificados</span>
        </div>

        {/* Hero Content */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl mb-6 font-sans">
          Tenha controle da sua operação.
        </h1>

        <p className={`text-base sm:text-lg max-w-2xl mb-10 leading-relaxed font-sans ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Vendas, estoque, pedidos e financeiro conectados em um único sistema.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full max-w-md mb-16">
          <button
            onClick={() => setIsContactModalOpen(true)}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f] shadow-[0_0_20px_rgba(24,242,164,0.4)]'
                : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
            }`}
          >
            Solicitar demonstração
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsContactModalOpen(true)}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#090909] border-[#222] text-gray-300 hover:text-white hover:bg-[#111]'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm'
            }`}
          >
            Falar sobre o FluxOS
          </button>
        </div>

        {/* Interactive Visual Mockup Protagonist (Real operational views) */}
        <div className={`w-full max-w-5xl rounded-2xl border overflow-hidden shadow-2xl text-left flex flex-col ${
          theme === 'dark' ? 'bg-[#0A0A0A] border-[#1C1C1C]' : 'bg-white border-gray-200'
        }`}>
          {/* Top Bar window layout */}
          <div className="p-3 border-b flex flex-col md:flex-row justify-between items-start md:items-center bg-black/10 text-xs gap-3" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#EAEAEA' }}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-gray-500 font-mono text-[10px] ml-2">fluxos-cloud-v3.5.sh</span>
            </div>

            <div className={`flex flex-wrap gap-1 p-0.5 rounded border ${theme === 'dark' ? 'bg-black/20 border-gray-800/10' : 'bg-gray-100 border-gray-200'}`}>
              <button
                onClick={() => setHeroPreviewTab('dashboard')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded cursor-pointer transition-all ${
                  heroPreviewTab === 'dashboard' 
                    ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-100 text-emerald-800') 
                    : (theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-600 hover:text-black')
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setHeroPreviewTab('pdv')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded cursor-pointer transition-all ${
                  heroPreviewTab === 'pdv' 
                    ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-100 text-emerald-800') 
                    : (theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-600 hover:text-black')
                }`}
              >
                PDV de Vendas
              </button>
              <button
                onClick={() => setHeroPreviewTab('pedidos')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded cursor-pointer transition-all ${
                  heroPreviewTab === 'pedidos' 
                    ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-100 text-emerald-800') 
                    : (theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-600 hover:text-black')
                }`}
              >
                Pedidos Ativos
              </button>
              <button
                onClick={() => setHeroPreviewTab('impressao')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded cursor-pointer transition-all ${
                  heroPreviewTab === 'impressao' 
                    ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-100 text-emerald-800') 
                    : (theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-600 hover:text-black')
                }`}
              >
                Impressão
              </button>
              <button
                onClick={() => setHeroPreviewTab('estoque')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded cursor-pointer transition-all ${
                  heroPreviewTab === 'estoque' 
                    ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-100 text-emerald-800') 
                    : (theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-600 hover:text-black')
                }`}
              >
                Controle FIFO
              </button>
              <button
                onClick={() => setHeroPreviewTab('financeiro')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded cursor-pointer transition-all ${
                  heroPreviewTab === 'financeiro' 
                    ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-100 text-emerald-800') 
                    : (theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-600 hover:text-black')
                }`}
              >
                Financeiro
              </button>
            </div>
          </div>

          {/* Interactive Screen Container */}
          <div className="p-6 min-h-[340px] flex flex-col justify-between">
            {heroPreviewTab === 'dashboard' && (
              <div className="flex flex-col gap-5 text-xs animate-fade-in">
                <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#EAEAEA' }}>
                  <span className={`font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5 ${
                    theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'
                  }`}>
                    <Activity className="w-4 h-4" />
                    Dashboard Geral da Operação
                  </span>
                  <span className="text-gray-500 font-mono text-[10px]">Consolidado: Filial Jardins (Matriz)</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-xl border text-left ${
                    theme === 'dark' ? 'bg-black/20 border-gray-800/10' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <span className="text-gray-500 font-bold uppercase text-[9px]">Vendas Hoje</span>
                    <span className={`text-lg font-black block mt-1 ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>R$ 4.892,10</span>
                    <span className="text-[9px] text-gray-500 font-medium">112 pedidos efetuados</span>
                  </div>
                  <div className={`p-4 rounded-xl border text-left ${
                    theme === 'dark' ? 'bg-black/20 border-gray-800/10' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <span className="text-gray-500 font-bold uppercase text-[9px]">CMV Médio</span>
                    <span className={`text-lg font-black block mt-1 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'}`}>62.8%</span>
                    <span className="text-[9px] text-gray-500 font-medium">Margem líquida de 37.2%</span>
                  </div>
                  <div className={`p-4 rounded-xl border text-left ${
                    theme === 'dark' ? 'bg-black/20 border-gray-800/10' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <span className="text-gray-500 font-bold uppercase text-[9px]">Avisos de Lote</span>
                    <span className={`text-lg font-black block mt-1 ${theme === 'dark' ? 'text-amber-500' : 'text-amber-600'}`}>2 Validades</span>
                    <span className={`text-[9px] font-semibold ${theme === 'dark' ? 'text-amber-500/80' : 'text-amber-700'}`}>FIFO priorizando saída</span>
                  </div>
                  <div className={`p-4 rounded-xl border text-left ${
                    theme === 'dark' ? 'bg-black/20 border-gray-800/10' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <span className="text-gray-500 font-bold uppercase text-[9px]">Equipe Ativa</span>
                    <span className={`text-lg font-black block mt-1 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>5 Usuários</span>
                    <span className="text-[9px] text-gray-500 font-medium">Acessos com permissão</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                  theme === 'dark' ? 'bg-black/20 border-gray-800/10' : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className={`font-bold text-[10px] uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Status das Mesas & Comandas em Tempo Real</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                    <div className={`p-2 rounded border flex justify-between items-center ${
                      theme === 'dark' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50/50'
                    }`}>
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}>Mesa 01</span>
                      <span className={`font-bold ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>R$ 142,00</span>
                    </div>
                    <div className={`p-2 rounded border flex justify-between items-center ${
                      theme === 'dark' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50/50'
                    }`}>
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}>Mesa 04</span>
                      <span className={`font-bold ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>R$ 310,50</span>
                    </div>
                    <div className={`p-2 rounded border flex justify-between items-center ${
                      theme === 'dark' ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200 bg-amber-50/50'
                    }`}>
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}>Mesa 12</span>
                      <span className={`font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}>Fechando</span>
                    </div>
                    <div className={`p-2 rounded border flex justify-between items-center text-gray-500 ${
                      theme === 'dark' ? 'border-gray-800 bg-black/10' : 'border-gray-200 bg-white'
                    }`}>
                      <span>Mesa 08</span>
                      <span>Livre</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {heroPreviewTab === 'pdv' && (
              <div className="flex flex-col gap-4 text-xs animate-fade-in">
                <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#EAEAEA' }}>
                  <span className={`font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5 ${
                    theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'
                  }`}>
                    <ShoppingCart className="w-4 h-4" />
                    Ponto de Venda Rápido (PDV Balcão)
                  </span>
                  <span className={`px-2.5 py-0.5 text-[9px] font-black rounded uppercase ${
                    theme === 'dark' ? 'bg-[#18F2A4] text-black' : 'bg-emerald-600 text-white'
                  }`}>Caixa Turno Ativo</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className={`md:col-span-8 p-4 rounded-xl border flex flex-col gap-3 ${
                    theme === 'dark' ? 'bg-black/20 border-gray-800/10' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase">
                      <span>Carrinho de Produtos</span>
                      <span className={theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}>3 itens selecionados</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className={`flex justify-between p-2.5 rounded border items-center ${
                        theme === 'dark' ? 'bg-black/30 border-gray-800/20' : 'bg-white border-gray-150'
                      }`}>
                        <div>
                          <span className={`font-bold block ${theme === 'dark' ? 'text-gray-200' : 'text-gray-850'}`}>Whisky Jack Daniels 1L</span>
                          <span className="text-[10px] text-gray-500">Lote LOT-JD-88 - Validade: 12/2029</span>
                        </div>
                        <span className={`font-mono font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>R$ 149,90</span>
                      </div>
                      <div className={`flex justify-between p-2.5 rounded border items-center ${
                        theme === 'dark' ? 'bg-black/30 border-gray-800/20' : 'bg-white border-gray-150'
                      }`}>
                        <div>
                          <span className={`font-bold block ${theme === 'dark' ? 'text-gray-200' : 'text-gray-850'}`}>6x Cerveja Stella Artois 275ml</span>
                          <span className="text-[10px] text-gray-500">Lote LOT-SA-12 - Validade: 08/2026</span>
                        </div>
                        <span className={`font-mono font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>R$ 47,40</span>
                      </div>
                      <div className={`flex justify-between p-2.5 rounded border items-center ${
                        theme === 'dark' ? 'bg-black/30 border-gray-800/20' : 'bg-white border-gray-150'
                      }`}>
                        <div>
                          <span className={`font-bold block ${theme === 'dark' ? 'text-gray-200' : 'text-gray-850'}`}>Gelo Cubo Saco 5kg</span>
                          <span className="text-[10px] text-gray-500">Controle unitário</span>
                        </div>
                        <span className={`font-mono font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>R$ 15,00</span>
                      </div>
                    </div>
                  </div>

                  <div className={`md:col-span-4 p-4 rounded-xl border flex flex-col justify-between gap-4 ${
                    theme === 'dark' ? 'bg-[#18F2A4]/5 border-[#18F2A4]/10' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div>
                      <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider block">Valor Líquido a Receber</span>
                      <span className={`text-2xl font-black font-mono block mt-1 ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>R$ 212,30</span>
                      <span className="text-[9px] text-gray-500 block mt-1">PIX Instantâneo sem taxas adicionais</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className={`p-2 rounded border text-[9px] font-semibold text-center uppercase tracking-wider ${
                        theme === 'dark' ? 'bg-black/40 border-emerald-500/20 text-[#18F2A4]' : 'bg-emerald-100/50 border-emerald-300 text-emerald-800'
                      }`}>
                        Recebimento Automático
                      </div>
                      <div className="text-[9px] text-gray-500 text-center">Teclas de Atalho de Balcão F1 a F12 habilitadas</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {heroPreviewTab === 'pedidos' && (
              <div className="flex flex-col gap-4 text-xs animate-fade-in">
                <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#EAEAEA' }}>
                  <span className={`font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5 ${
                    theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'
                  }`}>
                    <Clock className="w-4 h-4" />
                    Monitor de Produção & Fila de Preparação (KDS)
                  </span>
                  <span className={`font-mono text-[10px] ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>Atualização em tempo real</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-3.5 rounded-xl border flex flex-col gap-3 ${
                    theme === 'dark' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <span className="font-bold text-blue-600 text-[9px] uppercase tracking-wider">Fila de Montagem (4)</span>
                    <div className="flex flex-col gap-2">
                      <div className={`p-2.5 rounded border ${
                        theme === 'dark' ? 'bg-black/40 border-gray-800 text-white' : 'bg-white border-blue-100 text-gray-900 shadow-sm'
                      }`}>
                        <div className="flex justify-between font-bold">
                          <span>Pedido #4904</span>
                          <span className="text-blue-500 font-mono">11:42</span>
                        </div>
                        <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>1x Combo Vodka Absolut + 4x RedBull</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border flex flex-col gap-3 ${
                    theme === 'dark' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'
                  }`}>
                    <span className="font-bold text-amber-600 text-[9px] uppercase tracking-wider">Em Preparação (2)</span>
                    <div className="flex flex-col gap-2">
                      <div className={`p-2.5 rounded border ${
                        theme === 'dark' ? 'bg-black/40 border-gray-800 text-white' : 'bg-white border-amber-100 text-gray-900 shadow-sm'
                      }`}>
                        <div className="flex justify-between font-bold">
                          <span>Mesa 04 - Comanda #12</span>
                          <span className="text-amber-600 font-mono">11:35</span>
                        </div>
                        <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>6x Stella Artois LN, 1x Porção Fritas</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border flex flex-col gap-3 ${
                    theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <span className="font-bold text-emerald-600 text-[9px] uppercase tracking-wider">Pronto para Retirada (1)</span>
                    <div className="flex flex-col gap-2">
                      <div className={`p-2.5 rounded border ${
                        theme === 'dark' ? 'bg-black/40 border-gray-800 text-white' : 'bg-white border-emerald-100 text-gray-900 shadow-sm'
                      }`}>
                        <div className="flex justify-between font-bold">
                          <span>Balcão - Pedido #4901</span>
                          <span className="text-emerald-600 font-mono">Finalizado</span>
                        </div>
                        <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>1x Whisky Jack Daniels + Gelo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {heroPreviewTab === 'impressao' && (
              <div className="flex flex-col gap-4 text-xs animate-fade-in">
                <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#EAEAEA' }}>
                  <span className={`font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5 ${
                    theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'
                  }`}>
                    <Printer className="w-4 h-4" />
                    Fluxo de Impressão Operacional Sincronizado
                  </span>
                  <span className={`font-mono text-[10px] ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>Automação de Setores Ativa</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
                    theme === 'dark' ? 'bg-black/20 border-gray-800/10' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <span className={`font-bold text-[10px] uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Roteamento Inteligente por Setor</span>
                    <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                      Ao lançar um pedido complexo, o FluxOS fragmenta os itens de forma inteligente e envia a impressão apenas para os respectivos setores de separação física.
                    </p>
                    <div className="flex flex-col gap-2 text-[10px] mt-1 font-mono">
                      <div className={`p-2 rounded border flex justify-between ${
                        theme === 'dark' ? 'bg-black/40 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'
                      }`}>
                        <span>Cervejas / Gelados</span>
                        <span className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600 font-bold'}>Impressora Térmica do Freezer</span>
                      </div>
                      <div className={`p-2 rounded border flex justify-between ${
                        theme === 'dark' ? 'bg-black/40 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'
                      }`}>
                        <span>Coquetéis / Doses</span>
                        <span className={theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600 font-bold'}>Impressora Térmica do Bar Central</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border flex flex-col gap-2 font-mono text-[10px] ${
                    theme === 'dark' ? 'bg-black/40 border-gray-800 text-[#18F2A4]' : 'bg-white border-gray-300 text-gray-800 shadow-md'
                  }`}>
                    <span className="text-[9px] text-gray-500 font-sans block uppercase font-bold">MOCKUP DA IMPRESSÃO DE PRODUÇÃO (CUPOM TÉRMICO)</span>
                    <div className={`border-t border-dashed pt-2 flex flex-col gap-1 ${
                      theme === 'dark' ? 'border-[#18F2A4]/30' : 'border-gray-300'
                    }`}>
                      <div className="text-center font-bold">*** FLUXOS - OPERAÇÃO DE SALÃO ***</div>
                      <div className="text-center">PEDIDO: #4120 | DATA: 19/07/2026</div>
                      <div className={`text-center border-b border-dashed pb-2 ${
                        theme === 'dark' ? 'border-[#18F2A4]/30' : 'border-gray-300'
                      }`}>GARÇOM: CARLOS | SETOR: COZINHA</div>
                      <div className="flex justify-between font-bold mt-2">
                        <span>Item</span>
                        <span>Qtd</span>
                      </div>
                      <div className="flex justify-between">
                        <span>01 - ENGRADADO HEINEKEN 6X LN</span>
                        <span>02</span>
                      </div>
                      <div className="flex justify-between">
                        <span>02 - COMBO WHISKY RED LABEL + COCO</span>
                        <span>01</span>
                      </div>
                      <div className={`border-t border-dashed mt-2 pt-2 text-center text-gray-500 text-[9px] ${
                        theme === 'dark' ? 'border-[#18F2A4]/30' : 'border-gray-300'
                      }`}>
                        IMPRESSÃO AUTOMÁTICA EM REDE LOCAL
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {heroPreviewTab === 'estoque' && (
              <div className="flex flex-col gap-4 text-xs animate-fade-in">
                <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#EAEAEA' }}>
                  <span className={`font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5 ${
                    theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'
                  }`}>
                    <Package className="w-4 h-4" />
                    Controle de Estoque Inteligente FIFO & Curva ABC
                  </span>
                  <span className={`font-mono text-[10px] ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700 font-bold'}`}>PEPS / FIFO integrado</span>
                </div>

                <div className={`overflow-x-auto rounded-xl border ${theme === 'dark' ? 'border-gray-800/10' : 'border-gray-200 bg-white'}`}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`${theme === 'dark' ? 'bg-black/20 text-gray-500' : 'bg-gray-100 text-gray-700'}`}>
                        <th className="p-3 font-bold text-[10px] uppercase">Produto / SKU</th>
                        <th className="p-3 font-bold text-[10px] uppercase">Lote Ativo</th>
                        <th className="p-3 font-bold text-[10px] uppercase">Data Validade</th>
                        <th className="p-3 font-bold text-[10px] uppercase">Qtd Física</th>
                        <th className="p-3 font-bold text-[10px] uppercase">Curva ABC</th>
                        <th className="p-3 font-bold text-[10px] uppercase">Status FIFO</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={`border-b ${theme === 'dark' ? 'border-gray-800/10 hover:bg-black/10' : 'border-gray-150 hover:bg-gray-50'}`}>
                        <td className={`p-3 font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Cerveja Heineken LN 330ml</td>
                        <td className="p-3 font-mono text-gray-500">LOT-HK-1092</td>
                        <td className={`p-3 font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>29/07/2026 (10 dias)</td>
                        <td className={`p-3 font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>14 caixas (336 un)</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            theme === 'dark' ? 'bg-emerald-500/10 text-[#18F2A4]' : 'bg-emerald-100 text-emerald-800'
                          }`}>Classe A</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
                          }`}>Venda Prioritária</span>
                        </td>
                      </tr>
                      <tr className={`border-b ${theme === 'dark' ? 'border-gray-800/10 hover:bg-black/10' : 'border-gray-150 hover:bg-gray-50'}`}>
                        <td className={`p-3 font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Whisky Jack Daniels 1L</td>
                        <td className="p-3 font-mono text-gray-500">LOT-JD-8821</td>
                        <td className="p-3 text-gray-500">15/12/2029</td>
                        <td className={`p-3 font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>22 garrafas</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            theme === 'dark' ? 'bg-emerald-500/10 text-[#18F2A4]' : 'bg-emerald-100 text-emerald-800'
                          }`}>Classe B</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                          }`}>Estoque Seguro</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {heroPreviewTab === 'financeiro' && (
              <div className="flex flex-col gap-4 text-xs animate-fade-in">
                <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#EAEAEA' }}>
                  <span className={`font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5 ${
                    theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'
                  }`}>
                    <DollarSign className="w-4 h-4" />
                    Demonstrativo de Resultado de Exercício (DRE)
                  </span>
                  <span className={`font-bold text-[10px] ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>Consolidado Real</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border text-left ${
                    theme === 'dark' ? 'bg-black/20 border-gray-800/10' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <span className="text-gray-500 block uppercase text-[9px]">Faturamento Operacional</span>
                    <span className="text-xl font-bold block font-mono text-emerald-600 mt-1">R$ 45.820,00</span>
                    <span className="text-[9px] text-gray-500 block mt-1">Acumulado do mês corrente</span>
                  </div>
                  <div className={`p-4 rounded-xl border text-left ${
                    theme === 'dark' ? 'bg-black/20 border-gray-800/10' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <span className="text-gray-500 block uppercase text-[9px]">Custo de Mercadoria (CMV)</span>
                    <span className="text-xl font-bold block font-mono text-red-600 mt-1">R$ 28.760,00</span>
                    <span className="text-[9px] text-gray-500 block mt-1">Custo médio das vendas</span>
                  </div>
                  <div className={`p-4 rounded-xl border text-left ${
                    theme === 'dark' ? 'bg-[#18F2A4]/5 border-[#18F2A4]/15 text-[#18F2A4]' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    <span className={`block uppercase text-[9px] ${theme === 'dark' ? 'text-gray-400' : 'text-emerald-950 font-bold'}`}>Margem de Lucro Bruto</span>
                    <span className="text-xl font-bold block font-mono mt-1">R$ 17.060,00</span>
                    <span className={`text-[9px] font-medium block mt-1 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>Aproveitamento de 37.23%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Simulated window action buttons */}
            <div className="border-t pt-3 flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase mt-4" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#EAEAEA' }}>
              <span>Dados Reais de Produção Sincronizados</span>
              <button onClick={() => setIsContactModalOpen(true)} className={`cursor-pointer transition-colors flex items-center gap-1 ${
                theme === 'dark' ? 'hover:text-[#18F2A4]' : 'hover:text-emerald-600 text-gray-600'
              }`}>
                Agendar Demonstração Gratuita <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Uma operação, uma visão completa. (Section 1) */}
      <section className={`py-20 px-6 w-full border-t border-b ${
        theme === 'dark' ? 'bg-[#050505] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 text-left flex flex-col gap-4">
            <span className={`text-xs font-bold uppercase tracking-widest block ${
              theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700 font-black'
            }`}>Arquitetura de Unidades</span>
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Uma operação, uma visão completa.</h2>
            <p className={`text-sm leading-relaxed font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Todas as informações importantes organizadas em um só lugar. Tenha o controle consolidado de faturamento, estoque e usuários de múltiplas filiais ou gerencie sua única unidade com total maestria administrativa.
            </p>

            <div className="flex flex-col gap-3.5 mt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-600'}`} />
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Controle individual de faturamento bruto e CMV por filial física.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-600'}`} />
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Transferência rápida de mercadorias e lotes de estoque entre unidades.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-600'}`} />
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Relatórios consolidados gerados automaticamente para tomada de decisão.</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className={`p-6 rounded-2xl border text-left flex flex-col gap-4 ${
              theme === 'dark' ? 'bg-[#0A0A0A] border-[#1C1C1C]' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold uppercase text-[10px] text-gray-400">Consolidação Multi-Filial</span>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                  theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-100 text-emerald-800'
                }`}>Live View</span>
              </div>

              <div className="flex flex-col gap-3">
                <div className={`p-3.5 rounded-xl border flex justify-between items-center text-xs ${
                  theme === 'dark' ? 'bg-black/30 border-gray-800/10' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div>
                    <span className={`font-bold block ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Matriz - Jardins</span>
                    <span className="text-[10px] text-gray-500">12 caixas ativas • 82 pedidos hoje</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold block ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>R$ 32.410,00</span>
                    <span className="text-[9px] text-gray-500">CMV: 61.2%</span>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border flex justify-between items-center text-xs ${
                  theme === 'dark' ? 'bg-black/30 border-gray-800/10' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div>
                    <span className={`font-bold block ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Filial - Pinheiros</span>
                    <span className="text-[10px] text-gray-500">6 caixas ativas • 41 pedidos hoje</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold block ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>R$ 15.190,00</span>
                    <span className="text-[9px] text-gray-500">CMV: 64.1%</span>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border flex justify-between items-center text-xs ${
                  theme === 'dark' ? 'bg-black/30 border-gray-800/10' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div>
                    <span className={`font-bold block ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Filial - Itaim Bibi</span>
                    <span className="text-[10px] text-gray-500">4 caixas ativas • 28 pedidos hoje</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold block ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>R$ 9.800,00</span>
                    <span className="text-[9px] text-gray-500">CMV: 59.8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Do pedido ao resultado. (Section 2 - Interactive Stepper) */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full text-center">
        <span className={`text-xs font-bold uppercase tracking-widest block mb-2 ${
          theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700 font-black'
        }`}>Fluxo Logístico & Comercial</span>
        <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight mb-4 font-sans ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Do pedido ao resultado.</h2>
        <p className={`text-xs max-w-lg mx-auto mb-12 font-sans ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>Acompanhe a jornada completa de uma venda. Veja como o FluxOS orquestra as informações físicas e lógicas em frações de segundo.</p>

        {/* Stepper Buttons layout */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 max-w-4xl mx-auto mb-10 text-xs font-sans">
          {flowSteps.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`py-3 px-4 rounded-xl border font-bold transition-all cursor-pointer text-center flex flex-col gap-1.5 items-center justify-center ${
                activeStep === step.id 
                  ? (theme === 'dark' 
                      ? 'bg-[#18F2A4]/10 border-[#18F2A4] text-[#18F2A4] shadow-sm' 
                      : 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm')
                  : (theme === 'dark'
                      ? 'bg-black/20 border-gray-800 text-gray-500 hover:text-white hover:bg-black/30'
                      : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-200')
              }`}
            >
              <span className={`text-[10px] uppercase font-bold tracking-wider ${
                activeStep === step.id
                  ? (theme === 'dark' ? 'text-[#18F2A4]/80' : 'text-emerald-700')
                  : 'text-gray-500'
              }`}>Passo 0{step.id + 1}</span>
              <span className="truncate max-w-full">{step.title}</span>
            </button>
          ))}
        </div>

        {/* Dynamic step detail container */}
        <div className={`p-6 rounded-3xl border text-left max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center ${
          theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="md:col-span-7 flex flex-col gap-4">
            <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded uppercase w-fit tracking-wider ${
              theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-100 text-emerald-800'
            }`}>
              Fluxo Ativo • Fase {activeStep + 1} de 5
            </span>
            <h3 className="font-extrabold text-xl font-sans" style={{ color: theme === 'dark' ? 'white' : 'black' }}>
              {flowSteps[activeStep].title}
            </h3>
            <p className={`text-xs leading-relaxed font-medium font-sans ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-650'
            }`}>
              {flowSteps[activeStep].description}
            </p>
            <button 
              onClick={() => setIsContactModalOpen(true)}
              className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer mt-1 ${
                theme === 'dark' ? 'text-[#18F2A4] hover:underline' : 'text-emerald-700 hover:text-emerald-800 font-extrabold'
              }`}
            >
              Quero este fluxo na minha adega <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`md:col-span-5 w-full font-mono text-xs p-4 rounded-2xl border transition-all ${
            theme === 'dark' 
              ? 'bg-[#0E0E0E] border-[#222] text-gray-300' 
              : 'bg-white border-slate-200 text-slate-800 shadow-md'
          }`}>
            <div className={`flex justify-between items-center border-b pb-2 mb-3 text-[10px] font-bold ${
              theme === 'dark' ? 'border-gray-800 text-gray-500' : 'border-slate-200 text-slate-500'
            }`}>
              <span>SISTEMA DIAGNOSTICS</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> ONLINE</span>
            </div>

            {activeStep === 0 && (
              <div className="flex flex-col gap-2">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-slate-500 font-bold'}>REGISTRO DE OPERAÇÃO:</span>
                <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{flowSteps[0].details.source}</span>
                <div className={`p-2.5 rounded mt-1 border ${theme === 'dark' ? 'bg-black/50 border-gray-800/50' : 'bg-slate-100 border-slate-200'}`}>
                  <p className={`text-[10px] font-sans uppercase font-bold ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>Produtos no checkout:</p>
                  <p className={`text-[11px] font-bold mt-0.5 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>{flowSteps[0].details.items}</p>
                </div>
                <div className="flex justify-between text-[11px] mt-1">
                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}>Valor Final:</span>
                  <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{flowSteps[0].details.value}</span>
                </div>
                <div className={`text-[9px] p-1 rounded text-center border mt-1 font-bold ${
                  theme === 'dark' 
                    ? 'text-[#18F2A4] bg-[#18F2A4]/5 border-[#18F2A4]/10' 
                    : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                }`}>
                  {flowSteps[0].details.badge}
                </div>
              </div>
            )}

            {activeStep === 1 && (
              <div className="flex flex-col gap-2">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-slate-500 font-bold'}>LOG DO PROTOCOLO S-SYNC:</span>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}>Latência:</span>
                  <span className={`font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>{flowSteps[1].details.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}>Destino da Fila:</span>
                  <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{flowSteps[1].details.queue}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}>Fase Atual:</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    theme === 'dark' ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-850 border border-amber-200'
                  }`}>
                    {flowSteps[1].details.status}
                  </span>
                </div>
                <div className={`text-[9px] italic mt-2 border-t pt-2 font-sans ${
                  theme === 'dark' ? 'text-gray-500 border-gray-800' : 'text-slate-500 border-slate-200'
                }`}>
                  {flowSteps[1].details.alert}
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="flex flex-col gap-2">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-slate-500 font-bold'}>CONTROLE DE HARDWARE LOCAL:</span>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}>Device:</span>
                  <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{flowSteps[2].details.printer}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}>Estado:</span>
                  <span className={`font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>{flowSteps[2].details.status}</span>
                </div>
                <p className={`text-[10px] italic mt-1 font-sans leading-snug ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>
                  {flowSteps[2].details.target}
                </p>
                <div className={`p-2 rounded mt-2 text-center font-bold border ${
                  theme === 'dark' 
                    ? 'bg-black border-[#18F2A4]/20 text-[#18F2A4]' 
                    : 'bg-slate-100 border-emerald-200 text-emerald-800'
                }`}>
                  {flowSteps[2].details.layout}
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="flex flex-col gap-2">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-slate-500 font-bold'}>ESTOQUE AUDITADO FIFO:</span>
                <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{flowSteps[3].details.sku}</span>
                <div className={`p-2 rounded border text-[10px] leading-snug ${
                  theme === 'dark' ? 'bg-black border-gray-800 text-amber-500' : 'bg-slate-100 border-slate-200 text-amber-800'
                }`}>
                  <p className={`font-sans uppercase text-[8px] font-bold ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>Rastreio de Lote Ativo:</p>
                  <p className="mt-0.5 font-bold">{flowSteps[3].details.batch}</p>
                </div>
                <div className="flex justify-between text-[11px] mt-1">
                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}>Remanescente:</span>
                  <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{flowSteps[3].details.remaining}</span>
                </div>
                <div className={`text-[9px] p-1 rounded text-center border font-bold mt-1 ${
                  theme === 'dark' 
                    ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' 
                    : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                }`}>
                  {flowSteps[3].details.action}
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="flex flex-col gap-2">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}>CONCILIAÇÃO CONTÁBIL DRE:</span>
                <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{flowSteps[4].details.accounting}</span>
                <div className="flex flex-col gap-1 mt-1 text-[11px]">
                  <span className={`font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>{flowSteps[4].details.revenue}</span>
                  <span className={`font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-650'}`}>{flowSteps[4].details.cmv}</span>
                  <span className={`font-bold pt-1 mt-1 block border-t ${
                    theme === 'dark' ? 'text-[#18F2A4] border-gray-800' : 'text-emerald-800 border-slate-200'
                  }`}>
                    {flowSteps[4].details.profit}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Controle sua equipe. (Section 3 - Interactive Access Matrix) */}
      <section className={`py-20 px-6 w-full ${
        theme === 'dark' ? 'bg-[#040404] border-t border-b border-[#111]' : 'bg-gray-100 border-t border-b border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto text-center">
          <span className={`text-xs font-bold uppercase tracking-widest block mb-2 ${
            theme === 'dark' ? 'text-indigo-400' : 'text-indigo-700 font-extrabold'
          }`}>Gestão de Usuários</span>
          <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight mb-4 font-sans ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Controle sua equipe.</h2>
          <p className={`text-xs max-w-lg mx-auto mb-12 font-sans ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-650'
          }`}>Cada usuário possui acesso adequado para sua função. Proteja seus relatórios financeiros e garanta uma operação organizada de ponta a ponta.</p>

          {/* Role selection buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-10 text-xs font-sans">
            {Object.keys(teamRoles).map((roleKey) => (
              <button
                key={roleKey}
                onClick={() => setActiveRole(roleKey as any)}
                className={`px-4 py-2 rounded-xl font-bold border cursor-pointer transition-all ${
                  activeRole === roleKey 
                    ? (theme === 'dark' 
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 shadow-sm' 
                        : 'bg-indigo-50 border-indigo-500 text-indigo-800 shadow-sm')
                    : (theme === 'dark'
                        ? 'bg-transparent border-transparent text-gray-500 hover:text-white'
                        : 'bg-transparent border-transparent text-gray-600 hover:text-gray-900')
                }`}
              >
                {teamRoles[roleKey as keyof typeof teamRoles].name.split(' (')[0]}
              </button>
            ))}
          </div>

          {/* Interactive display of active role profile details */}
          <div className={`p-6 rounded-3xl border text-left max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 ${
            theme === 'dark' ? 'bg-black border-[#131313]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex flex-col gap-4 justify-between">
              <div className="flex flex-col gap-3">
                <div className={`p-3 w-fit rounded-xl ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700'}`}>
                  <Users className="w-6 h-6" />
                </div>
                <h3 className={`font-extrabold text-lg font-sans ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {teamRoles[activeRole].name}
                </h3>
                <p className={`text-xs leading-relaxed font-medium font-sans ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {teamRoles[activeRole].description}
                </p>

                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Permissões de Acesso:</span>
                  {teamRoles[activeRole].permissions.map((perm, i) => (
                    <div key={i} className={`flex items-start gap-2 text-[11px] ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                      <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setIsContactModalOpen(true)}
                className={`w-full py-2 px-4 rounded-xl text-center font-bold text-xs mt-4 cursor-pointer transition-all ${
                  theme === 'dark' 
                    ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20' 
                    : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Ver mais sobre a Gestão de Usuários →
              </button>
            </div>

            {/* Simulated app screen based on selected role */}
            <div className={`p-4 rounded-2xl border flex flex-col gap-4 text-xs font-mono transition-all ${
              theme === 'dark' 
                ? 'bg-[#0E0E0E] border-[#222] text-gray-300' 
                : 'bg-white border-slate-200 text-slate-800 shadow-md'
            }`}>
              <div className={`flex justify-between items-center border-b pb-2 ${
                theme === 'dark' ? 'border-gray-800/40' : 'border-slate-200'
              }`}>
                <span className={theme === 'dark' ? 'text-gray-400 text-[10px] font-bold uppercase tracking-wider' : 'text-slate-500 text-[10px] font-bold uppercase tracking-wider'}>Visualização do Perfil</span>
                <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[9px] font-bold">Simulado</span>
              </div>

              <div className="flex flex-col gap-3">
                <div className={`p-3 rounded-xl text-left border ${
                  theme === 'dark' ? 'bg-black/40 border-gray-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <span className={theme === 'dark' ? 'text-gray-500 text-[9px] uppercase tracking-wider font-bold' : 'text-slate-500 text-[9px] uppercase tracking-wider font-bold'}>Módulo Ativo</span>
                  <p className={`font-bold text-sm font-sans mt-0.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{teamRoles[activeRole].viewMockup.header}</p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <span className={theme === 'dark' ? 'text-gray-500 text-[9px] uppercase tracking-wider font-bold' : 'text-slate-500 text-[9px] uppercase tracking-wider font-bold'}>Métricas do Dashboard:</span>
                  {teamRoles[activeRole].viewMockup.metrics.map((metric, idx) => (
                    <div key={idx} className={`flex justify-between items-center border-b pb-1.5 ${
                      theme === 'dark' ? 'border-gray-800/10' : 'border-slate-200'
                    }`}>
                      <span className={`text-[11px] font-sans ${theme === 'dark' ? 'text-gray-400' : 'text-slate-650'}`}>{metric.label}</span>
                      <span className={`font-bold ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>{metric.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Decisões baseadas na realidade. (Section 4 - Analytics / Business Reality) */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-4 text-left">
            <span className={`text-xs font-bold uppercase tracking-widest block ${
              theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700 font-extrabold'
            }`}>Inteligência Estratégica</span>
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-sans ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Decisões baseadas na realidade.</h2>
            <p className={`text-sm leading-relaxed font-medium font-sans ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Veja o que acontece na sua operação através dos seus próprios dados. Pare de operar no escuro ou perder noites anotando faturamento em planilhas que não batem com o estoque físico.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-black/20 border-gray-800/10' : 'bg-gray-50 border-gray-200'}`}>
                <span className="text-gray-500 font-bold uppercase text-[9px] tracking-wider block">Giro do Estoque</span>
                <span className={`text-lg font-black block mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Análise Curva ABC</span>
                <span className="text-[10px] text-gray-500 mt-1 block">Classificação de produtos por relevância financeira de vendas.</span>
              </div>
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-black/20 border-gray-800/10' : 'bg-gray-50 border-gray-200'}`}>
                <span className="text-gray-500 font-bold uppercase text-[9px] tracking-wider block">CMV Automatizado</span>
                <span className={`text-lg font-black block mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Margem Real</span>
                <span className="text-[10px] text-gray-500 mt-1 block">Controle preciso sobre impostos, taxas operacionais e descontos.</span>
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className={`p-5 rounded-2xl border text-left flex flex-col gap-4 ${
              theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold uppercase text-[10px] text-gray-400 flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                  Métricas Financeiras Reais
                </span>
                <span className={`font-bold font-mono text-[10px] ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'}`}>Indicadores de Giro</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 rounded-lg border text-center ${theme === 'dark' ? 'bg-black/30 border-gray-800/20' : 'bg-white border-gray-200 shadow-sm'}`}>
                  <span className="text-gray-500 block text-[9px] font-bold uppercase">CMV Médio</span>
                  <span className={`text-base font-black font-mono block mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>62.8%</span>
                </div>
                <div className={`p-3 rounded-lg border text-center ${
                  theme === 'dark' ? 'bg-[#18F2A4]/5 border-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                }`}>
                  <span className={`block text-[9px] font-bold uppercase ${theme === 'dark' ? 'text-gray-400' : 'text-emerald-700'}`}>Margem Operacional</span>
                  <span className={`text-base font-black font-mono block mt-1 ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>37.2%</span>
                </div>
                <div className={`p-3 rounded-lg border text-center ${theme === 'dark' ? 'bg-black/30 border-gray-800/20' : 'bg-white border-gray-200 shadow-sm'}`}>
                  <span className="text-gray-500 block text-[9px] font-bold uppercase">Giro de Lotes</span>
                  <span className={`text-base font-black font-mono block mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>FIFO/PEPS</span>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${theme === 'dark' ? 'bg-black/30 border-gray-800/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Gargalos Financeiros Eliminados</span>
                <div className="flex justify-between items-center text-[11px] border-b border-gray-800/10 pb-1 text-gray-500">
                  <span>Quebra por vencimento não rastreado</span>
                  <span className="text-red-600 font-mono font-bold">- Reduzido para 0%</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-gray-500">
                  <span>Inconsistência de fecho manual de caixas</span>
                  <span className="text-red-600 font-mono font-bold">- Reduzido para 0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Benefits Cards Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full text-center border-t" style={{ borderColor: theme === 'dark' ? '#111' : '#E5E5E5' }}>
        <span className={`text-xs font-bold uppercase tracking-widest block mb-2 ${
          theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700 font-extrabold'
        }`}>Vantagens</span>
        <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>A ferramenta certa para acelerar seus resultados</h2>
        <p className={`text-xs max-w-lg mx-auto mb-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Maximize sua margem operacional e garanta o total controle sobre o seu dinheiro.</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left font-sans">
          {[
            { title: 'Mais controle', desc: 'Monitore cada fardo de cerveja e garrafa de destilado cadastrado por data de lote, com baixa automática e auditoria de caixa.' },
            { title: 'Menos perdas', desc: 'Evite o prejuízo de bebidas vencendo no salão. Nosso sistema prioriza a saída das validades mais próximas usando PEPS/FIFO.' },
            { title: 'Mais velocidade', desc: 'Finalize transações em segundos. O PDV foi otimizado para operação em teclado rápido de balcão e comandas sincronizadas.' },
            { title: 'Melhores decisões', desc: 'Entenda os números de verdade. Tenha relatórios de CMV, Curva ABC e lucratividade global por categoria de produto.' }
          ].map((card, idx) => (
            <div key={idx} className={`p-6 rounded-2xl border flex flex-col gap-4 ${
              theme === 'dark' ? 'bg-[#080808] border-[#131313] hover:border-[#18F2A4]/25' : 'bg-white border-gray-200 hover:shadow-md'
            }`}>
              <span className={`text-lg font-black font-sans ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>0{idx+1}</span>
              <h3 className="font-extrabold text-base leading-tight" style={{ color: theme === 'dark' ? 'white' : '#111' }}>{card.title}</h3>
              <p className={`text-xs leading-relaxed font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive ROI Calculator Section (Simulador Financeiro) */}
      <section className={`py-16 px-6 w-full ${
        theme === 'dark' ? 'bg-[#050505] border-y border-[#111]' : 'bg-gray-100 border-y border-gray-200'
      }`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className={`text-xs font-bold uppercase tracking-widest block mb-1 ${
              theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700 font-extrabold'
            }`}>Simulador Financeiro</span>
            <h2 className={`text-2xl sm:text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Calcule o Retorno sobre seu Investimento</h2>
            <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-650'}`}>Diga-nos o seu faturamento médio mensal estimado e veja quanto dinheiro você está deixando escorrer pelo ralo devido a falhas operacionais que o FluxOS elimina.</p>
          </div>

          <div className={`p-6 rounded-2xl border grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${
            theme === 'dark' ? 'bg-black border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex flex-col gap-5 text-left font-sans">
              <div className="flex flex-col gap-1.5">
                <div className={`flex justify-between items-center text-xs font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                  <span>Faturamento Mensal da Adega</span>
                  <span className={`font-mono text-sm ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700 font-bold'}`}>R$ {monthlySales.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="5000" 
                  max="200000" 
                  step="5000"
                  value={monthlySales}
                  onChange={(e) => setMonthlySales(Number(e.target.value))}
                  className={`w-full h-1.5 rounded-lg cursor-pointer ${theme === 'dark' ? 'accent-[#18F2A4] bg-gray-700' : 'accent-emerald-600 bg-gray-200'}`}
                />
                <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase">
                  <span>R$ 5 mil</span>
                  <span>R$ 200 mil</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className={`flex justify-between items-center text-xs font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                  <span>Perdas Estimadas (Vencimento/Furtos/Manual)</span>
                  <span className={`font-mono text-sm ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600 font-bold'}`}>{estimatedLoss}% do Faturamento</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="15" 
                  step="0.5"
                  value={estimatedLoss}
                  onChange={(e) => setEstimatedLoss(Number(e.target.value))}
                  className={`w-full h-1.5 rounded-lg cursor-pointer ${theme === 'dark' ? 'accent-amber-500 bg-gray-700' : 'accent-amber-600 bg-gray-200'}`}
                />
                <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase">
                  <span>Mínimo (2%)</span>
                  <span>Setor Médio (8%)</span>
                  <span>Crítico (15%)</span>
                </div>
              </div>
            </div>

            {/* Simulated ROI metrics block */}
            <div className={`p-5 rounded-xl border text-center flex flex-col gap-4 ${
              theme === 'dark' ? 'bg-gradient-to-br from-emerald-500/10 to-[#18F2A4]/5 border-emerald-500/10' : 'bg-emerald-50/50 border-emerald-200'
            }`}>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Perda Operacional Eliminada</span>
                <span className={`text-2xl sm:text-3xl font-extrabold font-mono mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>R$ {systemSavings.toLocaleString()} /mês</span>
              </div>
              
              <div className={`h-[1px] w-3/4 mx-auto ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-200'}`} />
              
              <div className="flex flex-col font-sans">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Retorno de Lucro Líquido (ROI)</span>
                <span className={`text-3xl sm:text-4xl font-black font-mono mt-1 ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>R$ {ROIValue.toLocaleString()} <span className="text-xs text-gray-500">/mês</span></span>
                <span className="text-[10px] text-gray-500 mt-2 italic">Subtraído o custo de assinatura sugerido de R$149</span>
              </div>
              
              <button
                onClick={() => setIsContactModalOpen(true)}
                className={`w-full py-2.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                  theme === 'dark' 
                    ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' 
                    : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                }`}
              >
                Parar de Perder Dinheiro Hoje
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Comparative Matrix Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-14">
          <span className={`text-xs font-bold uppercase tracking-widest block mb-2 ${
            theme === 'dark' ? 'text-amber-500' : 'text-amber-700 font-extrabold'
          }`}>Análise Comparativa</span>
          <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Como o FluxOS se compara aos concorrentes?</h2>
          <p className="text-xs text-gray-500 max-w-lg mx-auto mt-2">Colocamos lado a lado as funcionalidades essenciais para o seu negócio funcionar sem dor de cabeça.</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: theme === 'dark' ? '#161616' : '#E5E5E5' }}>
          <table className="w-full text-left text-[9px] sm:text-[11px] md:text-xs border-collapse table-fixed md:table-auto">
            <thead>
              <tr className={theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-gray-100'}>
                <th className="px-2 py-2.5 sm:p-4 font-bold border-b text-[8px] sm:text-[10px] md:text-xs w-[32%] md:w-auto" style={{ borderColor: theme === 'dark' ? '#161616' : '#E5E5E5', color: theme === 'dark' ? '#9CA3AF' : '#374151' }}>Recurso</th>
                <th className="px-2 py-2.5 sm:p-4 font-bold border-b text-[8px] sm:text-[10px] md:text-xs w-[24%] md:w-auto" style={{ borderColor: theme === 'dark' ? '#161616' : '#E5E5E5', color: theme === 'dark' ? '#18F2A4' : '#047857' }}>FluxOS PRO</th>
                <th className="px-2 py-2.5 sm:p-4 font-bold border-b text-[8px] sm:text-[10px] md:text-xs w-[22%] md:w-auto text-gray-400" style={{ borderColor: theme === 'dark' ? '#161616' : '#E5E5E5' }}>PDV Comum</th>
                <th className="px-2 py-2.5 sm:p-4 font-bold border-b text-[8px] sm:text-[10px] md:text-xs w-[22%] md:w-auto text-gray-400" style={{ borderColor: theme === 'dark' ? '#161616' : '#E5E5E5' }}>Rest. Antigo</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((comp, idx) => (
                <tr key={idx} className={`hover:bg-gray-500/5 ${
                  theme === 'dark' ? 'border-b border-[#0C0C0C]' : 'border-b border-gray-200'
                }`}>
                  <td className={`px-2 py-2 sm:p-4 font-semibold text-[8px] sm:text-[10px] md:text-xs ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{comp.feature}</td>
                  <td className="px-2 py-2 sm:p-4 text-[8px] sm:text-[10px] md:text-xs">
                    <span className={`inline-flex items-center gap-0.5 sm:gap-1 font-bold px-1 sm:px-2 py-0.5 rounded-full border text-[8px] sm:text-[9px] md:text-[10px] ${
                      theme === 'dark' 
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10' 
                        : 'text-emerald-850 bg-emerald-50 border-emerald-200 font-bold'
                    }`}>
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                      Integrado
                    </span>
                  </td>
                  <td className="px-2 py-2 sm:p-4 text-gray-500 text-[8px] sm:text-[10px] md:text-xs">
                    {comp.genericPos === false ? (
                      <span className={`font-semibold flex items-center gap-0.5 sm:gap-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600 font-bold'}`}>
                        <ShieldAlert className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500 shrink-0" /> Não possui
                      </span>
                    ) : (
                      comp.genericPos
                    )}
                  </td>
                  <td className="px-2 py-2 sm:p-4 text-gray-500 text-[8px] sm:text-[10px] md:text-xs">
                    {comp.legacySoft === false ? (
                      <span className={`font-semibold flex items-center gap-0.5 sm:gap-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600 font-bold'}`}>
                        <ShieldAlert className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500 shrink-0" /> Não possui
                      </span>
                    ) : comp.legacySoft === true ? (
                      <span className={`font-semibold ${theme === 'dark' ? 'text-emerald-500' : 'text-emerald-700 font-bold'}`}>Sim, mas complexo</span>
                    ) : (
                      comp.legacySoft
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) Section */}
      <section className={`py-16 px-6 w-full border-t ${
        theme === 'dark' ? 'bg-[#030303] border-[#111]' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <HelpCircle className={`w-8 h-8 mx-auto mb-3 ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-600'}`} />
            <h2 className={`text-2xl font-extrabold tracking-tight font-sans ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Perguntas Frequentes</h2>
            <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-650'}`}>Dúvidas rápidas sobre a operação, implantação e recursos da plataforma.</p>
          </div>

          <div className="flex flex-col gap-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className={`rounded-xl border overflow-hidden transition-all text-xs text-left ${
                  theme === 'dark' ? 'bg-[#0A0A0A] border-[#151515]' : 'bg-white border-gray-150 shadow-sm'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleFaq(idx)}
                  className="w-full p-4 flex justify-between items-center font-bold text-[13px] hover:bg-gray-500/5 transition-colors cursor-pointer text-left font-sans"
                >
                  <span style={{ color: theme === 'dark' ? 'white' : '#111' }}>{faq.q}</span>
                  <span className={`text-lg font-mono font-bold shrink-0 ml-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {activeFaq === idx ? '−' : '+'}
                  </span>
                </button>
                
                {activeFaq === idx && (
                  <div className={`p-4 border-t leading-relaxed font-sans ${
                    theme === 'dark' ? 'border-[#151515] text-gray-400' : 'border-gray-150 text-gray-600'
                  }`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Call to Action Final Frame */}
      <section className="py-20 px-6 max-w-5xl mx-auto w-full text-center relative overflow-hidden rounded-3xl border mb-20 bg-gradient-to-br from-[#060606] to-[#111111]" style={{ borderColor: 'rgba(24,242,164,0.1)' }}>
        <div className="absolute -bottom-10 left-1/4 w-[250px] h-[250px] bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 font-sans text-white">
          Sua adega merece uma gestão melhor.
        </h2>
        
        <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed font-sans">
          Sem contratos de fidelidade abusivos. Teste a ferramenta completa, simule vendas de balcão e garanta que o estoque trabalhe para as suas finanças.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => setIsContactModalOpen(true)}
            className={`px-8 py-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
              theme === 'dark'
                ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f] shadow-[0_0_15px_rgba(24,242,164,0.3)]'
                : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
            }`}
          >
            Começar com FluxOS
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Footer Branding Area */}
      <footer className={`py-12 px-6 border-t mt-auto text-xs ${
        theme === 'dark' ? 'bg-[#030303] border-[#111]' : 'bg-gray-100 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 font-sans">
          <div className="flex flex-col items-center sm:items-start gap-1.5">
            <div className="flex items-center gap-2 cursor-default select-none group">
              <img src="/logo.png" alt="FluxOS Logo" className="w-5 h-5 object-contain shrink-0 group-hover:rotate-12 transition-transform duration-300" />
              <span className={`font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Flux<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-[#18F2A4]">OS</span>
              </span>
            </div>
            <p 
              onDoubleClick={() => onEnterSystem()}
              className="text-[10px] text-slate-500 text-center sm:text-left cursor-pointer select-none hover:text-emerald-500 transition-colors font-medium"
              title="Clique duplo para ir à tela de Login"
            >
              © 2026 FluxOS Technologies S.A. Todos os direitos reservados.
            </p>
          </div>
          
          <div className={`flex gap-6 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-650'}`}>
            <button onClick={() => setIsContactModalOpen(true)} className="hover:text-[#18F2A4] cursor-pointer">Falar com Consultor</button>
            <button onClick={() => setIsContactModalOpen(true)} className="hover:text-[#18F2A4] cursor-pointer">Suporte Técnico</button>
            <a href="#comparativo" className="hover:text-[#18F2A4]">Comparativo</a>
            <a href="#faq" className="hover:text-[#18F2A4]">Termos de Uso</a>
          </div>
        </div>
      </footer>

      {/* Beautiful B2B Contact Lead Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl border flex flex-col gap-5 text-left relative ${
            theme === 'dark' ? 'bg-[#0A0A0A] border-[#1C1C1C] text-white' : 'bg-white border-gray-200 text-gray-900 shadow-2xl'
          }`}>
            <button 
              onClick={() => { setIsContactModalOpen(false); setContactSent(false); }}
              className={`absolute top-4 right-4 font-mono text-xs cursor-pointer font-bold border p-1 rounded transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-500 hover:text-white border-transparent hover:border-gray-800' 
                  : 'text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-200'
              }`}
            >
              [FECHAR]
            </button>

            {contactSent ? (
              <div className="text-center py-8 flex flex-col items-center gap-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-[#18F2A4] flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className={`font-extrabold text-xl font-sans ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Solicitação Recebida!</h3>
                <p className={`text-xs leading-relaxed font-sans ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Perfeito, <strong className={theme === 'dark' ? 'text-white' : 'text-gray-900 font-extrabold'}>{contactName}</strong>! Nosso time comercial de consultoria em B2B para Adegas já recebeu o contato da <strong className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{contactStore}</strong>. 
                  <span className="block mt-2">Nós entraremos em contato via WhatsApp no número <strong className={theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700 font-bold'}>{contactPhone}</strong> em menos de 15 minutos!</span>
                </p>
                <button
                  onClick={() => { setIsContactModalOpen(false); setContactSent(false); }}
                  className="mt-4 px-6 py-2 rounded-lg bg-[#18F2A4] text-black font-extrabold text-xs cursor-pointer hover:bg-[#12d58f] transition-all font-sans"
                >
                  Entendido, Obrigado!
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5 font-sans">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#18F2A4]" />
                    <span className={`font-extrabold text-sm tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Fale com nosso Consultor</span>
                  </div>
                  <p className={`text-[11px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Preencha rapidamente para agendar uma demonstração gratuita e estruturar os lucros da sua adega.</p>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContactSent(true);
                  }}
                  className="flex flex-col gap-3.5 font-sans"
                >
                  <div className="flex flex-col gap-1">
                    <label className={`text-[9px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Seu Nome</label>
                    <input 
                      type="text" 
                      required 
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className={`px-3 py-2 text-xs rounded border bg-transparent focus:outline-none focus:border-[#18F2A4] ${
                        theme === 'dark' ? 'text-white border-[#1C1C1C]' : 'text-gray-900 border-gray-200'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={`text-[9px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>WhatsApp de Contato</label>
                    <input 
                      type="tel" 
                      required 
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Ex: (11) 99999-9999"
                      className={`px-3 py-2 text-xs rounded border bg-transparent focus:outline-none focus:border-[#18F2A4] ${
                        theme === 'dark' ? 'text-white border-[#1C1C1C]' : 'text-gray-900 border-gray-200'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={`text-[9px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Nome da Adega/Distribuidora</label>
                    <input 
                      type="text" 
                      required 
                      value={contactStore}
                      onChange={(e) => setContactStore(e.target.value)}
                      placeholder="Ex: Adega do Russo"
                      className={`px-3 py-2 text-xs rounded border bg-transparent focus:outline-none focus:border-[#18F2A4] ${
                        theme === 'dark' ? 'text-white border-[#1C1C1C]' : 'text-gray-900 border-gray-200'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 mt-2 rounded-xl font-bold text-xs bg-[#18F2A4] text-black hover:bg-[#12d58f] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Solicitar Demonstração Sem Compromisso</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                <div className="flex items-center gap-3 border-t pt-3 font-sans" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[9px] text-gray-400 font-medium">Atendimento comercial ativo agora. Retorno estimado em 15min.</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
