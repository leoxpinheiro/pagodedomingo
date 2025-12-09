import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wallet, CalendarDays, Receipt, Menu, X, Clock } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Financial from './components/Financial';
import Agenda from './components/Agenda';
import Contas from './components/Contas'; 
import { AppState, EventData, Payment, PersonalExpense, BandPreset } from './types';

// Mock inicial apenas se não tiver nada salvo
const DEFAULT_PRESETS: BandPreset[] = [
    { name: 'Grupo Revelação Cover', lastValue: 1200 },
    { name: 'Turma do Pagode Cover', lastValue: 1500 },
    { name: 'Menos é Mais Cover', lastValue: 1400 },
    { name: 'Samba da Gente', lastValue: 800 },
    { name: 'DJ Residente', lastValue: 300 }
];

const INITIAL_STATE: AppState = {
  events: [], 
  payments: [],
  personalExpenses: [],
  receipts: [],
  bandPresets: DEFAULT_PRESETS,
  settledMonths: [],
  lastUpdated: new Date().toISOString()
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'financial' | 'agenda' | 'contas'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Initialize from localStorage or default
  const [data, setData] = useState<AppState>(() => {
    const saved = localStorage.getItem('pagode_app_data');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Garante que campos novos existam
        return { 
            ...INITIAL_STATE, 
            ...parsed, 
            settledMonths: parsed.settledMonths || [],
            lastUpdated: parsed.lastUpdated || new Date().toISOString()
        };
    }
    return INITIAL_STATE;
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('pagode_app_data', JSON.stringify(data));
  }, [data]);

  // -- Helper to learn bands --
  const learnBands = (evt: EventData) => {
    setData(prev => {
      const newPresets = [...prev.bandPresets];
      evt.bands.forEach(b => {
        if (!b.name) return;
        const existingIndex = newPresets.findIndex(p => p.name.toLowerCase() === b.name.toLowerCase());
        if (existingIndex >= 0) {
          newPresets[existingIndex].lastValue = b.value;
        } else {
          newPresets.push({ name: b.name, lastValue: b.value });
        }
      });
      return { ...prev, bandPresets: newPresets };
    });
  };

  // Helper para atualizar timestamp
  const touchTimestamp = (prev: AppState): AppState => ({
      ...prev,
      lastUpdated: new Date().toISOString()
  });

  // -- Actions to modify state --
  const addEvent = (evt: EventData) => {
    setData(prev => {
        const d = { ...prev, events: [...prev.events, evt] };
        return touchTimestamp(d);
    });
    learnBands(evt);
  };

  const updateEvent = (updatedEvt: EventData) => {
    setData(prev => {
        const d = {
            ...prev,
            events: prev.events.map(e => e.id === updatedEvt.id ? updatedEvt : e)
        };
        return touchTimestamp(d);
    });
    learnBands(updatedEvt);
  };

  const deleteEvent = (id: string) => {
    setData(prev => touchTimestamp({ ...prev, events: prev.events.filter(e => e.id !== id) }));
  };

  const addPayment = (pmt: Payment) => {
    setData(prev => touchTimestamp({ ...prev, payments: [...prev.payments, pmt] }));
  };
  
  const deletePayment = (id: string) => {
    setData(prev => touchTimestamp({ ...prev, payments: prev.payments.filter(p => p.id !== id) }));
  };

  const addExpense = (exp: PersonalExpense) => {
    setData(prev => touchTimestamp({ ...prev, personalExpenses: [...prev.personalExpenses, exp] }));
  };
  
  const deleteExpense = (id: string) => {
    setData(prev => touchTimestamp({ ...prev, personalExpenses: prev.personalExpenses.filter(e => e.id !== id) }));
  };

  // Nova função para alternar status do mês
  const toggleMonthSettled = (monthKey: string) => {
    setData(prev => {
        const isSettled = prev.settledMonths.includes(monthKey);
        const newSettled = isSettled 
            ? prev.settledMonths.filter(m => m !== monthKey)
            : [...prev.settledMonths, monthKey];
        return touchTimestamp({ ...prev, settledMonths: newSettled });
    });
  };
  
  // Reset Button
  const handleReset = () => {
      if(confirm('Tem certeza? Isso apagará todos os dados lançados.')) {
          setData(INITIAL_STATE);
      }
  }

  // Formata data de atualização
  const formatLastUpdate = (isoString?: string) => {
      if (!isoString) return 'Desconhecido';
      const d = new Date(isoString);
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  // -- Navigation Items --
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'financial', label: 'Financeiro', icon: Wallet },
    { id: 'agenda', label: 'Agenda', icon: CalendarDays },
    { id: 'contas', label: 'Contas & Consumo', icon: Receipt },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={data} />;
      case 'financial':
        return <Financial 
          data={data} 
          onAddEvent={addEvent}
          onUpdateEvent={updateEvent} 
          onDeleteEvent={deleteEvent}
          onAddPayment={addPayment}
          onDeletePayment={deletePayment}
          onToggleSettled={toggleMonthSettled}
        />;
      case 'agenda':
        return <Agenda 
          data={data} 
          onAddEvent={addEvent} 
          onUpdateEvent={updateEvent} 
        />;
      case 'contas':
        return <Contas 
          data={data} 
          onAddExpense={addExpense}
          onDeleteExpense={deleteExpense}
        />;
      default:
        return <Dashboard data={data} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-auto flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Pagode<span className="text-brand-500">Domingo</span>
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${activeTab === item.id 
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 bg-slate-800/50">
           <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Clock className="w-3 h-3" />
              <span>Última atualização:</span>
           </div>
           <p className="text-xs text-white font-medium pl-5">
              {formatLastUpdate(data.lastUpdated)}
           </p>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold cursor-pointer hover:bg-brand-400 transition-colors" onClick={handleReset} title="Resetar Dados">
              AD
            </div>
            <div>
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs text-slate-400">Gestor</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-slate-800">
            {navItems.find(i => i.id === activeTab)?.label}
          </span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;