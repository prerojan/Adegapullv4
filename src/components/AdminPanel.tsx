import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Landmark, Key, ShieldAlert, Plus, Trash2, CheckCircle2, 
  MapPin, Phone, DollarSign, Package, UserCheck, Settings, ArrowLeft, 
  TrendingUp, BarChart3, Edit, ToggleLeft, ToggleRight, Sparkles,
  Terminal, Lock, Activity, ShieldCheck, Database, AlertTriangle,
  Play, Pause, Clock, PieChart, HelpCircle, FileText, CheckCircle,
  HardDrive, Server, Globe, Wifi, Search, Sliders, MessageSquare, 
  AlertCircle, RefreshCw, X, Menu, Shield, Cpu, Layers, BarChart
} from 'lucide-react';
import { CashierUser } from '../types';

interface AdminPanelProps {
  theme: 'dark' | 'light';
  usersList: CashierUser[];
  onAddUser: (user: CashierUser) => void;
  onDeleteUser: (userId: string) => void;
  onBackToLanding: () => void;
  onBackToLogin?: () => void;
  products?: any[];
  sales?: any[];
  tablesComandas?: any[];
  activeShift?: any;
}

interface FluxClientStore {
  id: string;
  name: string;
  cnpj: string;
  ownerName: string;
  email: string;
  plan: 'Bronze' | 'Prata' | 'Gold' | 'Enterprise';
  status: 'active' | 'suspended';
  monthlyValue: number;
  usersCount: number;
  totalOrders: number;
  lastSync: string;
}

interface FluxSupportTicket {
  id: string;
  clientName: string;
  subject: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  category: 'Faturamento' | 'Impressoras' | 'Estoque' | 'Instabilidade';
}

interface FluxInvoice {
  id: string;
  clientName: string;
  value: number;
  dueDate: string;
  status: 'pago' | 'pendente' | 'vencido';
  paymentMethod: 'PIX' | 'Boleto' | 'Cartão Credito';
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Superadmin' | 'Developer' | 'Support';
  active: boolean;
}

export default function AdminPanel({ 
  theme, 
  usersList, 
  onAddUser, 
  onDeleteUser, 
  onBackToLanding,
  onBackToLogin,
  products = [],
  sales = [],
  tablesComandas = [],
  activeShift = null
}: AdminPanelProps) {
  
  // Security Authentication Gate
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const handleDevLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.toLowerCase() === 'dev123' || passwordInput.toLowerCase() === 'admin') {
      setIsAdminAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Senha de segurança inválida para o FluxOS Dev Console!');
    }
  };

  // Tab State
  type ERP_TAB = 'overview' | 'clients' | 'financial' | 'servers' | 'tickets' | 'configs';
  const [activeTab, setActiveTab] = useState<ERP_TAB>('overview');
  
  // Responsive sidebar open state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Client list state loaded from localStorage, or dynamically initialized using the active store info
  const [clients, setClients] = useState<FluxClientStore[]>(() => {
    try {
      const stored = localStorage.getItem('flux_admin_clients');
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    const localStoreName = localStorage.getItem('adegaos_store_name') || 'Adega Central Premium';
    const localCnpj = localStorage.getItem('adegaos_cnpj') || '12.345.678/0001-99';
    
    return [
      {
        id: 'store-local',
        name: localStoreName,
        cnpj: localCnpj,
        ownerName: 'Administrador Local',
        email: 'contato@fluxos.com.br',
        plan: 'Gold',
        status: 'active',
        monthlyValue: 149.00,
        usersCount: usersList.length || 1,
        totalOrders: sales.length,
        lastSync: 'Recém sincronizado (Local)'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('flux_admin_clients', JSON.stringify(clients));
  }, [clients]);

  // Support Tickets State
  const [tickets, setTickets] = useState<FluxSupportTicket[]>(() => {
    try {
      const stored = localStorage.getItem('flux_admin_tickets');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      {
        id: 'tkt-101',
        clientName: localStorage.getItem('adegaos_store_name') || 'Adega Central Premium',
        subject: 'Verificação periódica dos canais de vendas e faturamento',
        priority: 'low',
        status: 'resolved',
        createdAt: new Date().toLocaleDateString('pt-BR') + ' 10:45',
        category: 'Faturamento'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('flux_admin_tickets', JSON.stringify(tickets));
  }, [tickets]);

  // Invoices/Billing State
  const [invoices, setInvoices] = useState<FluxInvoice[]>(() => {
    try {
      const stored = localStorage.getItem('flux_admin_invoices');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      { 
        id: 'inv-301', 
        clientName: localStorage.getItem('adegaos_store_name') || 'Adega Central Premium', 
        value: 149.00, 
        dueDate: '10/' + new Date().toLocaleDateString('pt-BR').split('/')[1] + '/' + new Date().toLocaleDateString('pt-BR').split('/')[2], 
        status: 'pago', 
        paymentMethod: 'PIX' 
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('flux_admin_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Platform Plan Configs (Simulating values)
  const [planValues, setPlanValues] = useState({
    Bronze: 49.00,
    Prata: 99.00,
    Gold: 149.00,
    Enterprise: 299.00
  });

  // Admins List State
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    try {
      const stored = localStorage.getItem('flux_admin_users');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      { id: 'adm-1', name: 'Suporte Técnico FluxOS', email: 'suporte@fluxos.com.br', role: 'Support', active: true },
      { id: 'adm-2', name: 'Dev Engenharia', email: 'dev@fluxos.com.br', role: 'Developer', active: true }
    ];
  });

  useEffect(() => {
    localStorage.setItem('flux_admin_users', JSON.stringify(adminUsers));
  }, [adminUsers]);

  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'Superadmin' | 'Developer' | 'Support'>('Support');

  // Client Modal States
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState<string | null>(null);

  // Form fields
  const [clientForm, setClientForm] = useState({
    name: '',
    cnpj: '',
    ownerName: '',
    email: '',
    plan: 'Prata' as 'Bronze' | 'Prata' | 'Gold' | 'Enterprise',
    status: 'active' as 'active' | 'suspended',
    monthlyValue: 99.00,
    usersCount: 4
  });

  // KPI Calculations
  const platformMMR = useMemo(() => {
    return clients
      .filter(c => c.status === 'active')
      .reduce((sum, c) => {
        // use simulated values or default
        const actualPlanVal = planValues[c.plan] || c.monthlyValue;
        return sum + actualPlanVal;
      }, 0);
  }, [clients, planValues]);

  const activeClientsCount = useMemo(() => {
    return clients.filter(c => c.status === 'active').length;
  }, [clients]);

  const totalOrdersProcessed = useMemo(() => {
    return clients.reduce((sum, c) => sum + c.totalOrders, 0);
  }, [clients]);

  // Server health statuses with dynamic load
  const [serverNodes, setServerNodes] = useState([
    { name: 'API Gateway Central', type: 'Load Balancer', status: 'operational', load: '18%', latency: '8ms', icon: Globe },
    { name: 'Core DB Cluster (Postgres)', type: 'Database Node', status: 'operational', load: '24%', latency: '3ms', icon: Database },
    { name: 'Redis Cache Memory', type: 'Cache Store', status: 'operational', load: '8%', latency: '1ms', icon: HardDrive },
    { name: 'WebSocket Realtime Node', type: 'S-Sync Gateway', status: 'operational', load: '14%', latency: '12ms', icon: Wifi },
    { name: 'Thermal Cloud Printer Spool', type: 'CUPS Service', status: 'operational', load: '4%', latency: '15ms', icon: Server }
  ]);

  const [isScanning, setIsScanning] = useState(false);

  // Dynamic live logs terminal entries
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[SYSTEM INIT] FluxOS core engine booted safely.',
    '[S-SYNC] Listening for remote POS handshakes on port 3000.',
    '[DB] Persistent storage connection: OK (latência 3ms).',
    '[WS] Gateway active. 142 persistent connections verified.',
    '[INFRA] Cache hit rate is currently 94.2%.'
  ]);

  const handleClearLogs = () => {
    setTerminalLogs(['[SYSTEM] Logs limpos pelo administrador.']);
  };

  const handleInjectLog = (logMessage: string) => {
    setTerminalLogs(prev => [
      ...prev,
      `[ADMIN_ACTION] ${logMessage}`
    ]);
  };

  const handleTriggerHealthcheck = () => {
    setIsScanning(true);
    handleInjectLog('Iniciando varredura completa de saúde do cluster...');
    
    setTimeout(() => {
      setServerNodes(prev => prev.map(node => {
        const randomLoad = Math.floor(Math.random() * 25) + 5;
        const randomLat = Math.floor(Math.random() * 15) + 1;
        return {
          ...node,
          load: `${randomLoad}%`,
          latency: `${randomLat}ms`
        };
      }));
      setIsScanning(false);
      handleInjectLog('Healthcheck concluído com sucesso. Todos os clusters respondendo abaixo do SLA de 20ms.');
      handleInjectLog(`[REALTIME_SYNC] OK: ${products.length} produtos carregados, ${sales.length} faturamentos computados.`);
    }, 1500);
  };

  useEffect(() => {
    handleInjectLog(`[INIT] Conectado ao cluster local: ${products.length} SKUs, ${sales.length} vendas gravadas.`);
    if (activeShift) {
      handleInjectLog(`[TURNO] Operando caixa ativo por: ${activeShift.openedBy}`);
    } else {
      handleInjectLog(`[TURNO] Nenhum turno de caixa aberto no PDV.`);
    }
  }, [products.length, sales.length, activeShift]);

  // Client actions
  const handleToggleClientStatus = (clientId: string) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const nextStatus = c.status === 'active' ? 'suspended' : 'active';
        handleInjectLog(`Status da licença da loja '${c.name}' alterado para [${nextStatus.toUpperCase()}].`);
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const handleOpenAddClient = () => {
    setClientForm({
      name: '',
      cnpj: '',
      ownerName: '',
      email: '',
      plan: 'Prata',
      status: 'active',
      monthlyValue: planValues.Prata,
      usersCount: 4
    });
    setIsEditingClient(null);
    setIsAddingClient(true);
  };

  const handleOpenEditClient = (client: FluxClientStore) => {
    setClientForm({
      name: client.name,
      cnpj: client.cnpj,
      ownerName: client.ownerName,
      email: client.email,
      plan: client.plan,
      status: client.status,
      monthlyValue: client.monthlyValue,
      usersCount: client.usersCount
    });
    setIsEditingClient(client.id);
    setIsAddingClient(true);
  };

  const handleSaveClientForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingClient) {
      setClients(prev => prev.map(c => {
        if (c.id === isEditingClient) {
          handleInjectLog(`Dados da licença de '${clientForm.name}' atualizados.`);
          return {
            ...c,
            ...clientForm,
            monthlyValue: planValues[clientForm.plan]
          };
        }
        return c;
      }));
    } else {
      const newClient: FluxClientStore = {
        id: `store-${Date.now()}`,
        name: clientForm.name,
        cnpj: clientForm.cnpj,
        ownerName: clientForm.ownerName,
        email: clientForm.email,
        plan: clientForm.plan,
        status: clientForm.status,
        monthlyValue: planValues[clientForm.plan],
        usersCount: clientForm.usersCount,
        totalOrders: 0,
        lastSync: 'Recém criado'
      };
      setClients(prev => [...prev, newClient]);
      handleInjectLog(`Novo cliente '${clientForm.name}' cadastrado com plano ${clientForm.plan}.`);
    }
    setIsAddingClient(false);
  };

  const handleDeleteClient = (clientId: string) => {
    const found = clients.find(c => c.id === clientId);
    if (!found) return;
    (window as any).confirmModal(`Tem certeza de que deseja remover permanentemente o cliente '${found.name}' da rede FluxOS?`, () => {
      setClients(prev => prev.filter(c => c.id !== clientId));
      handleInjectLog(`Cliente '${found.name}' removido permanentemente da plataforma.`);
    });
  };

  // Ticket actions
  const handleResolveTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        handleInjectLog(`Chamado técnico #${ticketId} resolvido.`);
        return { ...t, status: 'resolved' };
      }
      return t;
    }));
  };

  const handleStartTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        handleInjectLog(`Chamado #${ticketId} colocado em andamento por engenheiro de suporte.`);
        return { ...t, status: 'in_progress' };
      }
      return t;
    }));
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminEmail) return;
    const newAdmin: AdminUser = {
      id: `adm-${Date.now()}`,
      name: newAdminName,
      email: newAdminEmail,
      role: newAdminRole,
      active: true
    };
    setAdminUsers(prev => [...prev, newAdmin]);
    handleInjectLog(`Novo administrador '${newAdminName}' (${newAdminRole}) adicionado.`);
    setNewAdminName('');
    setNewAdminEmail('');
  };

  const handleToggleAdminStatus = (id: string) => {
    setAdminUsers(prev => prev.map(adm => {
      if (adm.id === id) {
        const nextState = !adm.active;
        handleInjectLog(`Status do administrador '${adm.name}' alterado para ${nextState ? 'Ativo' : 'Inativo'}.`);
        return { ...adm, active: nextState };
      }
      return adm;
    }));
  };

  const handleGoBack = () => {
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      onBackToLanding();
    }
  };

  // Unauthenticated screen
  if (!isAdminAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 transition-all duration-300 ${
        theme === 'dark' ? 'bg-[#000] text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className={`w-full max-w-md p-8 rounded-2xl border text-center flex flex-col gap-6 transition-all ${
          theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-2xl'
        }`}>
          <div className="flex flex-col items-center gap-3">
            <h1 className="font-extrabold text-2xl tracking-tight leading-none">
              Flux<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-[#18F2A4]">OS</span> Dev Console
            </h1>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              Painel integrado de engenharia e controle operacional para administradores da plataforma FluxOS ERP.
            </p>
          </div>

          <form onSubmit={handleDevLoginSubmit} className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Código de Engenharia (Dev Key)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input 
                  type="password"
                  placeholder="Senha de acesso à infraestrutura..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-xs outline-none focus:border-[#18F2A4] transition-all font-mono font-bold ${
                    theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-gray-100 border-gray-200 text-black'
                  }`}
                  autoFocus
                />
              </div>
              {authError && <span className="text-[10px] text-red-500 font-bold block mt-1">✕ {authError}</span>}
              <span className="text-[9px] text-gray-500 font-medium block">Dica: use <code className="font-bold font-mono">dev123</code> ou <code className="font-bold font-mono">admin</code> para testar.</span>
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:shadow-xl ${
                theme === 'dark' ? 'bg-gradient-to-r from-violet-600 to-[#18F2A4] text-white' : 'bg-gradient-to-r from-[#10B981] to-teal-600 text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Autenticar Console Dev
            </button>
          </form>

          <div className="border-t pt-4 border-dashed" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
            <button
              onClick={handleGoBack}
              className="text-xs font-bold text-gray-500 hover:text-[#18F2A4] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-all duration-300 ${
      theme === 'dark' ? 'bg-[#000] text-white font-sans' : 'bg-gray-50 text-gray-900 font-sans'
    }`}>
      
      {/* 1. MOBILE RESPONSIVE NAVIGATION TOPBAR */}
      <header className={`md:hidden flex items-center justify-between px-4 py-3 border-b shrink-0 z-50 sticky top-0 ${
        theme === 'dark' ? 'bg-[#080808]/90 border-[#111]' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-1.5 rounded-lg border hover:bg-gray-500/10 cursor-pointer"
          title="Abrir Menu Administrador"
        >
          <Menu className="w-5 h-5 text-[#18F2A4]" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-extrabold text-xs tracking-tight">
            Flux<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-[#18F2A4]">OS</span> Dev
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-gray-500 font-bold">LIVE</span>
        </div>
      </header>

      {/* MOBILE SIDEBAR DROPDOWN BACKDROP */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-45 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* 2. LATERAL SIDEBAR NAVBAR (RESPONSIVE DRAWER IN MOBILE, FIXED ASIDE IN DESKTOP) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r flex flex-col justify-between shrink-0 h-full transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex
        ${theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-md'}
      `}>
        <div className="flex flex-col">
          {/* Sidebar Header Brand with Custom Gradient Logo */}
          <div className={`p-5 border-b flex items-center gap-3 ${
            theme === 'dark' ? 'border-[#111]' : 'border-gray-150'
          }`}>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight leading-none">
                Flux<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-[#18F2A4]">OS</span> ERP
              </span>
              <span className="text-[9px] text-gray-500 block font-black tracking-widest mt-1 uppercase">PLATFORM CONSOLE</span>
            </div>
            
            {/* Close button for mobile menu drawer */}
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden ml-auto p-1 text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sidebar Nav Items */}
          <nav className="p-4 flex flex-col gap-1.5 text-xs font-sans">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1 px-3">Barramento SaaS</span>
            
            <button
              onClick={() => { setActiveTab('overview'); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                activeTab === 'overview'
                  ? (theme === 'dark' ? 'bg-gradient-to-r from-violet-500/10 to-[#18F2A4]/5 text-[#18F2A4] border-l-2 border-[#18F2A4]' : 'bg-emerald-50 text-emerald-800 border-l-2 border-emerald-500')
                  : 'text-gray-500 hover:text-[#18F2A4] hover:bg-gray-500/5'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" /> Dashboard Geral
            </button>

            <button
              onClick={() => { setActiveTab('clients'); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                activeTab === 'clients'
                  ? (theme === 'dark' ? 'bg-gradient-to-r from-violet-500/10 to-[#18F2A4]/5 text-[#18F2A4] border-l-2 border-[#18F2A4]' : 'bg-emerald-50 text-emerald-800 border-l-2 border-emerald-500')
                  : 'text-gray-500 hover:text-[#18F2A4] hover:bg-gray-500/5'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" /> Lojas / Clientes
              <span className="ml-auto text-[10px] bg-indigo-500/15 text-indigo-400 font-bold px-2 py-0.5 rounded-full">{clients.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('financial'); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                activeTab === 'financial'
                  ? (theme === 'dark' ? 'bg-gradient-to-r from-violet-500/10 to-[#18F2A4]/5 text-[#18F2A4] border-l-2 border-[#18F2A4]' : 'bg-emerald-50 text-emerald-800 border-l-2 border-emerald-500')
                  : 'text-gray-500 hover:text-[#18F2A4] hover:bg-gray-500/5'
              }`}
            >
              <DollarSign className="w-4 h-4 shrink-0" /> Tesouraria & Faturamento
            </button>

            <button
              onClick={() => { setActiveTab('servers'); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                activeTab === 'servers'
                  ? (theme === 'dark' ? 'bg-gradient-to-r from-violet-500/10 to-[#18F2A4]/5 text-[#18F2A4] border-l-2 border-[#18F2A4]' : 'bg-emerald-50 text-emerald-800 border-l-2 border-emerald-500')
                  : 'text-gray-500 hover:text-[#18F2A4] hover:bg-gray-500/5'
              }`}
            >
              <Server className="w-4 h-4 shrink-0" /> Status de Servidor
              <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            <button
              onClick={() => { setActiveTab('tickets'); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                activeTab === 'tickets'
                  ? (theme === 'dark' ? 'bg-gradient-to-r from-violet-500/10 to-[#18F2A4]/5 text-[#18F2A4] border-l-2 border-[#18F2A4]' : 'bg-emerald-50 text-emerald-800 border-l-2 border-emerald-500')
                  : 'text-gray-500 hover:text-[#18F2A4] hover:bg-gray-500/5'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" /> Chamados de Suporte
              <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce">2</span>
            </button>

            <button
              onClick={() => { setActiveTab('configs'); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                activeTab === 'configs'
                  ? (theme === 'dark' ? 'bg-gradient-to-r from-violet-500/10 to-[#18F2A4]/5 text-[#18F2A4] border-l-2 border-[#18F2A4]' : 'bg-emerald-50 text-emerald-800 border-l-2 border-emerald-500')
                  : 'text-gray-500 hover:text-[#18F2A4] hover:bg-gray-500/5'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" /> Configurações Globais
            </button>
          </nav>
        </div>

        {/* Sidebar Footer with system telemetry & Back Action */}
        <div className={`p-4 border-t flex flex-col gap-3 ${
          theme === 'dark' ? 'border-[#111]' : 'border-gray-150'
        }`}>
          <button
            onClick={handleGoBack}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              theme === 'dark' ? 'bg-[#141414] text-gray-300 hover:bg-[#1C1C1C] hover:text-white border border-[#222]' : 'bg-gray-150 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o Login
          </button>
        </div>
      </aside>

      {/* 3. MAIN WORKSPACE CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
        {/* Workspace Top Header Bar */}
        <header className={`px-6 py-4 border-b flex justify-between items-center shrink-0 ${
          theme === 'dark' ? 'bg-[#000]/60 border-[#111] backdrop-blur-md' : 'bg-white border-gray-200 shadow-xs'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider select-none">
            <span className="text-gray-400">FluxOS Control Engine</span>
            <span className="text-gray-500 font-normal">/</span>
            <span className="text-[#18F2A4] tracking-widest font-extrabold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18F2A4]" />
              {activeTab === 'overview' && 'Dashboard Geral'}
              {activeTab === 'clients' && 'Lojas & Clientes'}
              {activeTab === 'financial' && 'Faturamento & MMR'}
              {activeTab === 'servers' && 'Status de Servidores'}
              {activeTab === 'tickets' && 'Central de Suporte'}
              {activeTab === 'configs' && 'Configurações Globais'}
            </span>
          </div>


        </header>

        {/* Render Active Tab Screen Container */}
        <div className="p-4 md:p-6 flex flex-col gap-6 flex-1">

          {/* =========================================================
              TAB: OVERVIEW 
              ========================================================= */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              
              {/* Bento Grid Platform KPIs matching ManagerDashboard style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* KPI Card 1: MMR */}
                <div className={`p-5 rounded-2xl border flex items-center justify-between group transition-all duration-300 hover:scale-[1.01] ${
                  theme === 'dark' ? 'bg-[#080808] border-[#111] hover:border-violet-500/20' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                }`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">MMR da Plataforma</span>
                    <span className={`text-2xl font-extrabold mt-1.5 font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>
                      R$ {platformMMR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold block mt-1">✓ Licenças ativas recalculadas</span>
                  </div>
                  <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
                    <Landmark className="w-5 h-5" />
                  </div>
                </div>

                {/* KPI Card 2: Clientes */}
                <div className={`p-5 rounded-2xl border flex items-center justify-between group transition-all duration-300 hover:scale-[1.01] ${
                  theme === 'dark' ? 'bg-[#080808] border-[#111] hover:border-blue-500/20' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                }`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Lojas Clientes Ativas</span>
                    <span className={`text-2xl font-extrabold mt-1.5 font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>
                      {activeClientsCount} / {clients.length}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold block mt-1">
                      {clients.filter(c => c.status === 'suspended').length} loja suspensa por cobrança
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                {/* KPI Card 3: Vendas */}
                <div className={`p-5 rounded-2xl border flex items-center justify-between group transition-all duration-300 hover:scale-[1.01] ${
                  theme === 'dark' ? 'bg-[#080808] border-[#111] hover:border-[#18F2A4]/20' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                }`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Vendas Sincronizadas</span>
                    <span className={`text-2xl font-extrabold mt-1.5 font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>
                      {totalOrdersProcessed.toLocaleString('pt-BR')} Transações
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold block mt-1">✓ Sem perdas no banco central</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#18F2A4]/15 text-[#18F2A4]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                {/* KPI Card 4: Latência */}
                <div className={`p-5 rounded-2xl border flex items-center justify-between group transition-all duration-300 hover:scale-[1.01] ${
                  theme === 'dark' ? 'bg-[#080808] border-[#111] hover:border-cyan-500/20' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                }`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Média Latência API</span>
                    <span className={`text-2xl font-extrabold mt-1.5 font-mono ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'}`}>
                      6.8 ms
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold block mt-1">✓ Excelente (Meta &lt; 20ms)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                </div>

              </div>

              {/* Server health, load gauges and real-time logs */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Active clients synchronizations / Live data feeds */}
                <div className={`lg:col-span-7 p-5 rounded-2xl border flex flex-col gap-4 ${
                  theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className="flex justify-between items-center border-b pb-3 border-gray-800/10" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase font-black tracking-widest text-gray-500">Fluxo Operacional de Sincronia</span>
                      <span className="text-[10px] text-gray-500 mt-1">Status de recebimento de dados em tempo real das unidades parceiras</span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        handleInjectLog('Solicitada sincronização manual dos terminais.');
                        alert('Consultando sincronização de todas as unidades ativas...');
                      }}
                      className={`p-1.5 rounded-lg border cursor-pointer ${
                        theme === 'dark' 
                          ? 'border-gray-800 text-gray-400 hover:text-white hover:bg-gray-500/5' 
                          : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      title="Forçar consulta de sincronias"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto no-scrollbar">
                    {clients.map((c) => (
                      <div key={c.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        theme === 'dark' ? 'bg-black/30 border-gray-900' : 'bg-gray-50 border-gray-150'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]' : 'bg-red-500'}`} />
                          <div className="flex flex-col">
                            <span className={`font-extrabold text-xs ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{c.name}</span>
                            <span className="text-[10px] text-gray-500 font-mono">Plano: {c.plan} • CNPJ: {c.cnpj}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 text-[11px] border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-800/10">
                          <div className="flex flex-col text-left sm:text-right">
                            <span className="font-medium text-gray-500 text-[9px] uppercase">Pedidos na Plataforma</span>
                            <span className={`font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{c.totalOrders}</span>
                          </div>
                          
                          <div className="flex flex-col text-right">
                            <span className="font-medium text-gray-500 text-[9px] uppercase">Última Sincronia</span>
                            <span className="font-black text-emerald-400 font-mono text-xs">{c.lastSync}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real-time Engineering Terminal Logs */}
                <div className={`lg:col-span-5 p-5 rounded-2xl border flex flex-col gap-3 ${
                  theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className="flex justify-between items-center border-b pb-3 border-gray-800/10" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#18F2A4]" />
                      <span className="text-xs uppercase font-black tracking-widest text-gray-500">Log de Infraestrutura</span>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          const listMsg = [
                            'Conexão aberta de novo caixa na filial Adega Central Premium.',
                            'Backup automático do Postgres gerado com sucesso na AWS S3.',
                            'Limpeza de sessões expiradas completada: 23 registros descartados.',
                            'Gateway de impressão em nuvem: Spooler limpo.',
                            'Disparo de webhook para faturamento concluído.'
                          ];
                          const randomMsg = listMsg[Math.floor(Math.random() * listMsg.length)];
                          handleInjectLog(randomMsg);
                        }}
                        className="text-[9px] font-bold text-violet-400 hover:text-violet-300 uppercase tracking-widest cursor-pointer"
                      >
                        [Simular Evento]
                      </button>
                      <button 
                        onClick={handleClearLogs}
                        className="text-[9px] font-bold text-gray-500 hover:text-red-400 uppercase tracking-widest cursor-pointer"
                      >
                        [Limpar]
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#030303] border border-gray-900 flex-1 flex flex-col gap-2 min-h-[250px] font-mono text-[10px] text-emerald-400 overflow-y-auto no-scrollbar max-h-[350px]">
                    {terminalLogs.map((log, index) => (
                      <div key={index} className="flex gap-2 leading-relaxed text-left">
                        <span className="text-gray-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                        <span className="text-gray-300 break-all">{log}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* =========================================================
              TAB: CLIENTS (MANAGEMENT ERP)
              ========================================================= */}
          {activeTab === 'clients' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col text-left">
                  <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Gerenciamento de Adegas Parceiras</h2>
                  <p className="text-xs text-gray-500">Cadastro de CNPJ, controle de planos ativos, valores de mensalidade e bloqueio de inadimplência.</p>
                </div>
                <button
                  onClick={handleOpenAddClient}
                  className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md hover:shadow-lg self-start sm:self-auto ${
                    theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Cadastrar Novo Estabelecimento
                </button>
              </div>

              {/* Table of active SaaS Stores wrapped for responsive scroll */}
              <div className="overflow-hidden rounded-2xl border" style={{ borderColor: theme === 'dark' ? '#161616' : '#E5E5E5' }}>
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                    <thead>
                      <tr className={theme === 'dark' ? 'bg-[#080808] text-gray-500 border-b border-[#111]' : 'bg-gray-150 text-gray-600 border-b border-gray-200'}>
                        <th className="p-4 font-black uppercase text-[10px] tracking-wider">Razão Social / CNPJ</th>
                        <th className="p-4 font-black uppercase text-[10px] tracking-wider">Proprietário / Email</th>
                        <th className="p-4 font-black uppercase text-[10px] tracking-wider">Plano</th>
                        <th className="p-4 font-black uppercase text-[10px] tracking-wider">Valor Mensal</th>
                        <th className="p-4 font-black uppercase text-[10px] tracking-wider">Membros do Caixa</th>
                        <th className="p-4 font-black uppercase text-[10px] tracking-wider">Status Operacional</th>
                        <th className="p-4 font-black uppercase text-[10px] tracking-wider text-right">Ações de Engenharia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c) => (
                        <tr key={c.id} className={`hover:bg-gray-500/5 ${
                          theme === 'dark' ? 'border-b border-[#111]' : 'border-b border-gray-200'
                        }`}>
                          <td className="p-4 flex flex-col text-left">
                            <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{c.name}</span>
                            <span className="text-[10px] text-gray-500 font-mono mt-0.5">CNPJ: {c.cnpj}</span>
                          </td>
                          <td className="p-4 text-left">
                            <div className="flex flex-col">
                              <span className={`font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{c.ownerName}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{c.email}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              c.plan === 'Enterprise' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              c.plan === 'Gold' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              c.plan === 'Prata' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                            }`}>
                              {c.plan}
                            </span>
                          </td>
                          <td className={`p-4 font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            R$ {(planValues[c.plan] || c.monthlyValue).toFixed(2)}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5 text-[10px] text-gray-500 font-mono">
                              <span className="font-bold text-gray-400">{c.usersCount} colaboradores</span>
                              <span>{c.totalOrders} vendas sync</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider ${
                              c.status === 'active' ? 'text-emerald-400' : 'text-red-500'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 'bg-red-500'}`} />
                              {c.status === 'active' ? 'Ativo' : 'Suspenso'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleClientStatus(c.id)}
                                className={`p-2 rounded-lg border cursor-pointer ${
                                  c.status === 'active' 
                                    ? 'text-amber-500 border-amber-500/20 hover:bg-amber-500/10' 
                                    : 'text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10'
                                }`}
                                title={c.status === 'active' ? 'Suspender Licença' : 'Ativar Licença'}
                              >
                                {c.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                onClick={() => handleOpenEditClient(c)}
                                className="p-2 rounded-lg border text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/10 cursor-pointer"
                                title="Editar Detalhes"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteClient(c.id)}
                                className="p-2 rounded-lg border text-red-400 border-red-500/20 hover:bg-red-500/10 cursor-pointer"
                                title="Excluir Cliente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add/Edit Client Modal Form */}
              {isAddingClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                  <div className={`w-full max-w-md p-6 rounded-2xl border flex flex-col gap-4 text-left ${
                    theme === 'dark' ? 'bg-[#080808] border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900 shadow-2xl'
                  }`}>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-800/10" style={{ borderColor: theme === 'dark' ? '#1c1c1c' : '#eaeaea' }}>
                      <span className="font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#18F2A4]" />
                        {isEditingClient ? 'Editar Licença' : 'Cadastrar Novo Cliente'}
                      </span>
                      <button onClick={() => setIsAddingClient(false)} className="text-gray-500 hover:text-white cursor-pointer"><X className="w-4.5 h-4.5" /></button>
                    </div>

                    <form onSubmit={handleSaveClientForm} className="flex flex-col gap-4 text-xs font-sans">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Razão Social da Adega</label>
                        <input 
                          type="text" 
                          required
                          value={clientForm.name}
                          onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                          className={`p-3 rounded-xl border outline-none font-sans font-bold ${
                            theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-gray-100 border-gray-200'
                          }`}
                          placeholder="Ex: Adega São Jorge Distribuidora"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">CNPJ do Estabelecimento</label>
                          <input 
                            type="text" 
                            required
                            value={clientForm.cnpj}
                            onChange={(e) => setClientForm({ ...clientForm, cnpj: e.target.value })}
                            className={`p-3 rounded-xl border outline-none font-mono ${
                              theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-gray-100 border-gray-200'
                            }`}
                            placeholder="00.000.000/0001-00"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Nome do Responsável</label>
                          <input 
                            type="text" 
                            required
                            value={clientForm.ownerName}
                            onChange={(e) => setClientForm({ ...clientForm, ownerName: e.target.value })}
                            className={`p-3 rounded-xl border outline-none font-sans font-bold ${
                              theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-gray-100 border-gray-200'
                            }`}
                            placeholder="Ex: Carlos Ferreira Martins"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Email de Contato Administrador</label>
                        <input 
                          type="email" 
                          required
                          value={clientForm.email}
                          onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                          className={`p-3 rounded-xl border outline-none font-sans ${
                            theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-gray-100 border-gray-200'
                          }`}
                          placeholder="suporte@adegasaojorge.com.br"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Plano Operacional</label>
                          <select 
                            value={clientForm.plan}
                            onChange={(e) => {
                              const plan = e.target.value as any;
                              setClientForm({ ...clientForm, plan, monthlyValue: planValues[plan] });
                            }}
                            className={`p-3 rounded-xl border outline-none font-sans font-bold ${
                              theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-gray-100 border-gray-200'
                            }`}
                          >
                            <option value="Bronze">Bronze (R$ {planValues.Bronze}/mês)</option>
                            <option value="Prata">Prata (R$ {planValues.Prata}/mês)</option>
                            <option value="Gold">Gold (R$ {planValues.Gold}/mês)</option>
                            <option value="Enterprise">Enterprise (R$ {planValues.Enterprise}/mês)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Limite Máximo Membros</label>
                          <input 
                            type="number" 
                            required
                            value={clientForm.usersCount}
                            onChange={(e) => setClientForm({ ...clientForm, usersCount: Number(e.target.value) })}
                            className={`p-3 rounded-xl border outline-none font-mono font-bold ${
                              theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-gray-100 border-gray-200'
                            }`}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2 transition-all ${
                          theme === 'dark' ? 'bg-gradient-to-r from-violet-600 to-[#18F2A4] text-white' : 'bg-[#10B981] text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Registrar Parâmetros de Licenciamento
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB: FINANCIAL (ERP SAAS BILLING)
              ========================================================= */}
          {activeTab === 'financial' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex flex-col text-left">
                <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Tesouraria SaaS & Faturamento Mensal</h2>
                <p className="text-xs text-gray-500">Monitore as faturas das adegas clientes, mude valores de planos em tempo real e analise o faturamento global.</p>
              </div>

              {/* Financial Simulator and Plan Values */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Simulated Plans editor */}
                <div className={`lg:col-span-4 p-5 rounded-2xl border flex flex-col gap-4 ${
                  theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className="border-b pb-3 border-gray-800/10" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
                    <span className="text-xs uppercase font-black tracking-widest text-gray-500 block">Editar Preços da Plataforma</span>
                    <span className="text-[10px] text-gray-500 block mt-1">Alterações refletem no faturamento total de MMR da plataforma imediatamente</span>
                  </div>

                  <div className="flex flex-col gap-3.5 text-xs font-sans">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-400">Plano Bronze (Básico)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-mono">R$</span>
                        <input 
                          type="number"
                          value={planValues.Bronze}
                          onChange={(e) => setPlanValues({ ...planValues, Bronze: Math.max(0, Number(e.target.value)) })}
                          className={`w-20 p-1.5 rounded border text-center font-bold font-mono ${theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-gray-50 border-gray-200'}`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-400">Plano Prata (Intermediário)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-mono">R$</span>
                        <input 
                          type="number"
                          value={planValues.Prata}
                          onChange={(e) => setPlanValues({ ...planValues, Prata: Math.max(0, Number(e.target.value)) })}
                          className={`w-20 p-1.5 rounded border text-center font-bold font-mono ${theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-gray-50 border-gray-200'}`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-400">Plano Gold (Recomendado)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-mono">R$</span>
                        <input 
                          type="number"
                          value={planValues.Gold}
                          onChange={(e) => setPlanValues({ ...planValues, Gold: Math.max(0, Number(e.target.value)) })}
                          className={`w-20 p-1.5 rounded border text-center font-bold font-mono ${theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-gray-50 border-gray-200'}`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-400">Plano Enterprise (Corporativo)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-mono">R$</span>
                        <input 
                          type="number"
                          value={planValues.Enterprise}
                          onChange={(e) => setPlanValues({ ...planValues, Enterprise: Math.max(0, Number(e.target.value)) })}
                          className={`w-20 p-1.5 rounded border text-center font-bold font-mono ${theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-gray-50 border-gray-200'}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border text-xs text-left leading-relaxed ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-r from-violet-600/10 to-blue-500/10 border-violet-500/20' 
                      : 'bg-violet-50 border-violet-100 text-gray-700'
                  }`}>
                    <span className={`font-bold block mb-1 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-700'}`}>Métrica LTV Estimada:</span>
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-650'}>
                      O Ticket Médio atual é de <strong className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>R$ {(platformMMR / activeClientsCount || 0).toFixed(2)}</strong>. Com LTV médio de 14.5 meses, cada cliente novo gera aproximadamente <strong className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>R$ {((platformMMR / activeClientsCount || 0) * 14.5).toFixed(2)}</strong> para o FluxOS.
                    </span>
                  </div>
                </div>

                {/* SVG Trend Graphs in Tesouraria */}
                <div className={`lg:col-span-8 p-5 rounded-2xl border flex flex-col gap-4 ${
                  theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className="border-b pb-3 border-gray-800/10 flex justify-between items-center" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
                    <div className="flex flex-col text-left">
                      <span className="text-xs uppercase font-black tracking-widest text-gray-500">Histórico de Receita do Barramento (6 Meses)</span>
                      <span className="text-[10px] text-gray-500 mt-1">Crescimento de mensalidades recorrentes em reais</span>
                    </div>
                    <span className="text-[10px] bg-[#18F2A4]/10 text-[#18F2A4] font-black px-2.5 py-1 rounded">Alta de 12.4%</span>
                  </div>

                  {/* Beautiful SVG Bar Chart */}
                  <div className="h-[210px] w-full flex items-end gap-3 px-2 pt-4">
                    {[
                      { month: 'Fev', value: 240, height: '40%' },
                      { month: 'Mar', value: 310, height: '52%' },
                      { month: 'Abr', value: 380, height: '65%' },
                      { month: 'Mai', value: 440, height: '75%' },
                      { month: 'Jun', value: 490, height: '84%' },
                      { month: 'Jul (Hoje)', value: 590, height: '100%', highlight: true }
                    ].map((bar, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end gap-2 group">
                        <span className="text-[10px] font-mono font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">R$ {bar.value}</span>
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            bar.highlight 
                              ? 'bg-gradient-to-t from-violet-600 via-blue-500 to-[#18F2A4]' 
                              : (theme === 'dark' ? 'bg-gradient-to-t from-gray-800/80 to-gray-700 hover:to-indigo-500/60' : 'bg-gradient-to-t from-gray-200 to-gray-300 hover:to-indigo-300')
                          }`}
                          style={{ height: bar.height }}
                        />
                        <span className={`text-[10px] font-bold ${bar.highlight ? 'text-[#18F2A4]' : 'text-gray-500'}`}>{bar.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Billing list table */}
              <div className="overflow-hidden rounded-2xl border" style={{ borderColor: theme === 'dark' ? '#161616' : '#E5E5E5' }}>
                <div className={`p-4 border-b font-black text-xs text-left ${
                  theme === 'dark' ? 'bg-[#080808] border-[#161616] text-gray-400' : 'bg-gray-150 text-gray-700'
                }`}>
                  Faturas de Mensalidades Emitidas Recentemente
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                    <thead>
                      <tr className={theme === 'dark' ? 'bg-[#0A0A0A] text-gray-500' : 'bg-gray-50 text-gray-600'}>
                        <th className="p-3.5 font-bold uppercase text-[10px]">Código Fatura</th>
                        <th className="p-3.5 font-bold uppercase text-[10px]">Estabelecimento</th>
                        <th className="p-3.5 font-bold uppercase text-[10px]">Forma de Cobrança</th>
                        <th className="p-3.5 font-bold uppercase text-[10px]">Valor Cobrado</th>
                        <th className="p-3.5 font-bold uppercase text-[10px]">Data Vencimento</th>
                        <th className="p-3.5 font-bold uppercase text-[10px] text-right">Status do Pagamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className={`hover:bg-gray-500/5 ${
                          theme === 'dark' ? 'border-b border-[#111]' : 'border-b border-gray-200'
                        }`}>
                          <td className="p-3.5 font-mono text-gray-500">{inv.id}</td>
                          <td className={`p-3.5 font-bold text-left ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{inv.clientName}</td>
                          <td className="p-3.5 font-medium text-gray-400">{inv.paymentMethod}</td>
                          <td className={`p-3.5 font-extrabold font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>R$ {inv.value.toFixed(2)}</td>
                          <td className="p-3.5 text-gray-500">{inv.dueDate}</td>
                          <td className="p-3.5 text-right">
                            <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                              inv.status === 'pago' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              inv.status === 'pendente' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                              {inv.status}
                            </span>
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
              TAB: SERVERS (INFRASTRUCTURE LOGS)
              ========================================================= */}
          {activeTab === 'servers' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col text-left">
                  <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Clusters de Servidores & Monitoramento em Nuvem</h2>
                  <p className="text-xs text-gray-500">Métricas em tempo real de execução dos microserviços Docker redundantes que sustentam o FluxOS.</p>
                </div>
                <button
                  onClick={handleTriggerHealthcheck}
                  disabled={isScanning}
                  className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border hover:bg-gray-500/5 cursor-pointer shrink-0 ${
                    theme === 'dark' ? 'border-gray-800 text-white' : 'border-gray-300 text-gray-700 bg-white shadow-sm'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-[#18F2A4]' : ''}`} /> 
                  {isScanning ? 'Varrendo Infraestrutura...' : 'Forçar Varredura (Healthcheck)'}
                </button>
              </div>

              {/* Node cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serverNodes.map((node, index) => {
                  const NodeIcon = node.icon;
                  return (
                    <div key={index} className={`p-5 rounded-2xl border flex flex-col gap-4 transition-all duration-300 hover:scale-[1.01] ${
                      theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                            <NodeIcon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className={`font-extrabold text-xs leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{node.name}</span>
                            <span className="text-[10px] text-gray-500 mt-1 font-mono">{node.type}</span>
                          </div>
                        </div>

                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[8px] font-black uppercase tracking-wider">
                          online
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[10px] font-mono border-t pt-3.5 border-gray-800/10" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
                        <div className="flex flex-col text-left">
                          <span className="text-gray-500 uppercase text-[9px] tracking-widest font-black">Carga de CPU</span>
                          <span className={`font-black mt-1 text-xs ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{node.load}</span>
                        </div>

                        <div className="flex flex-col text-left">
                          <span className="text-gray-500 uppercase text-[9px] tracking-widest font-black">Latência SSL</span>
                          <span className="font-black text-emerald-400 mt-1 text-xs">{node.latency}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cluster Backup / Restore Telemetry Simulation */}
              <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 text-left ${
                theme === 'dark' ? 'bg-gradient-to-r from-[#080808] to-black border-[#111]' : 'bg-gray-100 border-gray-200'
              }`}>
                <div className="flex flex-col gap-1 max-w-xl">
                  <span className="text-xs font-black uppercase text-gray-500 tracking-widest">S-SYNC Sincronização em Nuvem</span>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    O protocolo S-Sync mantém os terminais locais sincronizados de forma assíncrona com a base central, garantindo alta disponibilidade e reconciliação automática de lançamentos.
                  </p>
                </div>
                <button
                  onClick={() => {
                    handleInjectLog('Geração de backup em andamento...');
                    alert('Backup do banco de dados e sincronia local gerados com sucesso.');
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer border ${
                    theme === 'dark' ? 'border-[#222] bg-[#111] hover:bg-[#1C1C1C] text-white' : 'border-gray-300 bg-white text-gray-700 shadow-xs'
                  }`}
                >
                  Simular Backup DB
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB: TICKETS (CENTRAL DE CHAMADOS)
              ========================================================= */}
          {activeTab === 'tickets' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex flex-col text-left">
                <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Central de Suporte Operacional (2º Nível)</h2>
                <p className="text-xs text-gray-500">Responda aos chamados das adegas físicas de forma ágil para garantir que nenhuma impressora ou frente de caixa pare.</p>
              </div>

              {/* Support list */}
              <div className="flex flex-col gap-3">
                {tickets.map((t) => (
                  <div key={t.id} className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between md:items-center gap-4 text-left ${
                    theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-gray-500 font-bold">#{t.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                          t.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          t.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          prioridade {t.priority}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">• Criado em {t.createdAt}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-800'
                        }`}>{t.category}</span>
                      </div>

                      <span className={`text-sm font-extrabold leading-relaxed ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t.subject}</span>
                      <span className="text-[10px] text-gray-500">Estação Remota: <strong className="text-gray-400 font-bold">{t.clientName}</strong></span>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                      {t.status === 'open' && (
                        <button
                          onClick={() => handleStartTicket(t.id)}
                          className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-violet-600 text-white hover:bg-violet-700 transition-all cursor-pointer"
                        >
                          Atender Chamado
                        </button>
                      )}

                      {t.status === 'in_progress' && (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-2 bg-violet-500/10 text-violet-400 text-[9px] font-black uppercase tracking-wider rounded-lg animate-pulse border border-violet-500/20">
                            Em Atendimento
                          </span>
                          <button
                            onClick={() => handleResolveTicket(t.id)}
                            className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white hover:bg-emerald-600 transition-all cursor-pointer"
                          >
                            Resolver
                          </button>
                        </div>
                      )}

                      {t.status === 'resolved' && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-black uppercase tracking-widest">
                          <CheckCircle className="w-4 h-4 text-emerald-500" /> Resolvido
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================
              TAB: CONFIGS (INFRASTRUCTURE PARAMS & ADMINS CRUD)
              ========================================================= */}
          {activeTab === 'configs' && (
            <div className="flex flex-col gap-6 animate-fade-in text-left">
              <div className="flex flex-col">
                <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Parâmetros de Conexão & Credenciais</h2>
                <p className="text-xs text-gray-500">Parâmetros de balanceamento, chaves secretas de criptografia e gerenciamento de administradores da plataforma.</p>
              </div>

              {/* Config fields panel */}
              <div className={`p-5 rounded-2xl border flex flex-col gap-5 ${
                theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">API Gateway Endpoint (HTTPS)</label>
                    <input 
                      type="text" 
                      className={`p-3 rounded-xl border outline-none font-mono font-bold ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800 text-emerald-400 font-mono' : 'bg-gray-100 border-gray-200 text-emerald-800'
                      }`}
                      value="https://api.fluxos.com.br/v1"
                      readOnly
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Intervalo Heartbeat S-SYNC (Segundos)</label>
                    <input 
                      type="number" 
                      className={`p-3 rounded-xl border outline-none font-mono font-bold ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-100 border-gray-200 text-black'
                      }`}
                      value={30}
                      readOnly
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Chave de Token JWT Secreta</label>
                    <input 
                      type="password" 
                      className={`p-3 rounded-xl border outline-none font-mono text-gray-500 ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800' : 'bg-gray-100 border-gray-200'
                      }`}
                      value="jwt_secret_token_fluxos_saas_32_chars_long"
                      readOnly
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Frequência de Backup DB</label>
                    <select 
                      className={`p-3 rounded-xl border outline-none font-sans font-bold ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-100 border-gray-200'
                      }`}
                      disabled
                    >
                      <option>A cada 1 hora (Recomendado para produção)</option>
                      <option>A cada 24 horas</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4 flex justify-end gap-3" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
                  <button
                    onClick={() => {
                      handleInjectLog('Parâmetros de execução da infraestrutura atualizados com sucesso.');
                      alert('Parâmetros de infraestrutura salvos com sucesso!');
                    }}
                    className={`px-4 py-3 rounded-xl font-bold text-xs cursor-pointer ${
                      theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white'
                    }`}
                  >
                    Salvar Alterações de Infraestrutura
                  </button>
                </div>
              </div>

              {/* Sub-section: Administrators of FluxOS */}
              <div className={`p-5 rounded-2xl border flex flex-col gap-5 ${
                theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="border-b pb-3 border-gray-800/10" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
                  <span className="text-xs font-black uppercase text-gray-500 tracking-widest block">Administradores com Acesso ao Dev Console</span>
                  <span className="text-[10px] text-gray-500 block mt-1">Controle de acessos de engenharia e suporte de segundo nível</span>
                </div>

                {/* Form to add admin */}
                <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Nome</label>
                    <input 
                      type="text"
                      required
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className={`p-2.5 rounded-xl border text-xs outline-none ${
                        theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-gray-100 border-gray-200'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Email</label>
                    <input 
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="carlos@fluxos.com.br"
                      className={`p-2.5 rounded-xl border text-xs outline-none ${
                        theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-gray-100 border-gray-200'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <div className="flex flex-col gap-1.5 flex-1 w-full">
                      <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Cargo</label>
                      <select 
                        value={newAdminRole}
                        onChange={(e) => setNewAdminRole(e.target.value as any)}
                        className={`p-2.5 rounded-xl border text-xs outline-none font-bold ${
                          theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-gray-100 border-gray-200'
                        }`}
                      >
                        <option value="Superadmin">Superadmin</option>
                        <option value="Developer">Developer</option>
                        <option value="Support">Support</option>
                      </select>
                    </div>

                    <button 
                      type="submit"
                      className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase shrink-0 w-full sm:w-auto h-[38px] flex items-center justify-center gap-1 cursor-pointer ${
                        theme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-black'
                      }`}
                    >
                      <Plus className="w-4 h-4" /> Adicionar
                    </button>
                  </div>
                </form>

                {/* Admins Table list */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={theme === 'dark' ? 'bg-black/20 text-gray-500' : 'bg-gray-100 text-gray-600'}>
                        <th className="p-3 font-bold uppercase text-[9px] tracking-widest">Nome do Administrador</th>
                        <th className="p-3 font-bold uppercase text-[9px] tracking-widest">E-mail</th>
                        <th className="p-3 font-bold uppercase text-[9px] tracking-widest">Cargo / Permissão</th>
                        <th className="p-3 font-bold uppercase text-[9px] tracking-widest">Status de Acesso</th>
                        <th className="p-3 font-bold uppercase text-[9px] tracking-widest text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((adm) => (
                        <tr key={adm.id} className={`border-b ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200'}`}>
                          <td className="p-3 font-bold">{adm.name}</td>
                          <td className="p-3 font-mono text-gray-400">{adm.email}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              adm.role === 'Superadmin' ? 'bg-red-500/10 text-red-400' :
                              adm.role === 'Developer' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-gray-500/10 text-gray-400'
                            }`}>{adm.role}</span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 font-bold ${adm.active ? 'text-emerald-400' : 'text-red-500'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${adm.active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                              {adm.active ? 'Ativo' : 'Revogado'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleToggleAdminStatus(adm.id)}
                              className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border cursor-pointer ${
                                adm.active 
                                  ? 'border-red-500/20 text-red-400 hover:bg-red-500/10' 
                                  : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                            >
                              {adm.active ? 'Revogar acesso' : 'Restaurar acesso'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
