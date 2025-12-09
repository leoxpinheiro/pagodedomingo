import React, { useState, useMemo } from 'react';
import { AppState, EventData, Payment, MONTHS, Band, CostItem, parseDate } from '../types';
import { ChevronLeft, ChevronRight, Users, DollarSign, AlertTriangle, Plus, Trash2, Edit2, Save, X, Wallet, PlusCircle, CheckCircle, ArrowDownCircle, Lock, HelpCircle } from 'lucide-react';

interface Props {
  data: AppState;
  onUpdateEvent: (evt: EventData) => void;
  onAddEvent: (evt: EventData) => void;
  onDeleteEvent: (id: string) => void;
  onAddPayment: (pmt: Payment) => void;
  onDeletePayment: (id: string) => void;
  onToggleSettled: (monthKey: string) => void;
}

const Financial: React.FC<Props> = ({ data, onUpdateEvent, onAddEvent, onDeleteEvent, onAddPayment, onDeletePayment, onToggleSettled }) => {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  
  // Modals & Forms
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newEventDate, setNewEventDate] = useState('');
  
  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  // --- Calculations ---

  const monthEvents = useMemo(() => {
    return data.events
      .filter(e => e.status === 'done' && e.date.startsWith(currentMonthKey))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data.events, currentMonthKey]);

  // -- LOGICA DE QUITAÇÃO (Manual e Informativa) --
  // O status "isSettled" agora vem diretamente do array manual do usuário
  const isSettled = data.settledMonths.includes(currentMonthKey);
  
  const endOfMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day of current month view
  
  // Apenas para mostrar o número "Saldo a Receber" como referência
  const cumulativeStats = useMemo(() => {
      let accumProfit = 0;
      let accumConsumed = 0;

      // Sum all profit from events <= end of viewed month
      data.events.forEach(e => {
          if(e.status === 'done' && e.date <= endOfMonthDate.toISOString().split('T')[0]) {
             const rev = (e.couvertCount * e.couvertPrice) + ((e.promoCount || 0) * (e.promoPrice || 0));
             const cost = e.bands.reduce((acc, b) => acc + b.value, 0) + e.extraCosts.reduce((acc, c) => acc + c.value, 0);
             accumProfit += (rev - cost);
          }
      });

      // Sum all expenses <= end of viewed month
      data.personalExpenses.forEach(e => {
          if(e.date <= endOfMonthDate.toISOString().split('T')[0]) {
              accumConsumed += e.finalValue;
          }
      });
      
      const totalReceivable = accumProfit - accumConsumed;
      const totalPaid = data.payments.reduce((acc, p) => acc + p.amount, 0);
      
      const outstandingGlobal = totalReceivable - totalPaid;

      return { outstandingGlobal };
  }, [data.events, data.personalExpenses, data.payments, endOfMonthDate]);


  const stats = useMemo(() => {
    let totalRev = 0;
    let totalCost = 0;
    let maxAudience = 0;

    monthEvents.forEach(e => {
      const rev = (e.couvertCount * e.couvertPrice) + ((e.promoCount || 0) * (e.promoPrice || 0));
      const cost = e.bands.reduce((acc, b) => acc + b.value, 0) + e.extraCosts.reduce((acc, c) => acc + c.value, 0);
      const audience = e.couvertCount + (e.promoCount || 0);

      totalRev += rev;
      totalCost += cost;
      if (audience > maxAudience) maxAudience = audience;
    });

    const operatingProfit = totalRev - totalCost;
    
    // Personal Expenses for this month
    const monthExpenses = data.personalExpenses.filter(e => e.date.startsWith(currentMonthKey));
    const consCost = monthExpenses.reduce((sum, e) => sum + e.finalValue, 0);
    
    // Payments made within this specific month (just for listing)
    const monthPayments = data.payments.filter(p => p.date.startsWith(currentMonthKey));
    const totalMonthPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      eventCount: monthEvents.length,
      revenue: totalRev,
      costs: totalCost,
      operatingProfit,
      consCost,
      maxAudience,
      monthPayments,
      totalMonthPaid,
      netResult: operatingProfit - consCost
    };
  }, [monthEvents, data.personalExpenses, data.payments, currentMonthKey]);

  // --- Handlers ---

  const handleCreateEvent = () => {
    if (!newEventDate) return;
    const evt: EventData = {
      id: Math.random().toString(36).substr(2, 9),
      date: newEventDate,
      status: 'done',
      couvertPrice: 15, 
      couvertCount: 0,
      extraCosts: [], 
      bands: [
        { id: Math.random().toString(36), name: '', time: '17:00', value: 0 },
        { id: Math.random().toString(36), name: '', time: '20:00', value: 0 }
      ]
    };
    onAddEvent(evt);
    setIsAddingEvent(false);
    setTimeout(() => setEditingEvent(evt), 50);
  };

  const handleCreatePayment = () => {
     if(!paymentAmount) return;
     onAddPayment({
         id: Math.random().toString(36).substr(2, 9),
         date: paymentDate,
         amount: parseFloat(paymentAmount),
         note: paymentNote
     });
     setIsAddingPayment(false);
     setPaymentAmount('');
     setPaymentNote('');
  }

  const handleUpdateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      onUpdateEvent(editingEvent);
      setEditingEvent(null);
    }
  };

  // --- Band & Cost Helpers (Keep existing logic) ---
  const updateEditingBand = (index: number, field: keyof Band, value: string | number) => {
    if (!editingEvent) return;
    const newBands = [...editingEvent.bands];
    newBands[index] = { ...newBands[index], [field]: value };
    if (field === 'name' && typeof value === 'string') {
        const preset = data.bandPresets.find(p => p.name.toLowerCase() === value.toLowerCase());
        if (preset) { newBands[index].value = preset.lastValue; }
    }
    setEditingEvent({ ...editingEvent, bands: newBands });
  };
  const addBand = () => { if (editingEvent) setEditingEvent({ ...editingEvent, bands: [...editingEvent.bands, { id: Math.random().toString(36), name: '', time: '00:00', value: 0 }] }); };
  const removeBand = (index: number) => { if (editingEvent) { const b = [...editingEvent.bands]; b.splice(index, 1); setEditingEvent({ ...editingEvent, bands: b }); }};
  
  const updateEditingCost = (index: number, field: keyof CostItem, value: string | number) => { if (editingEvent) { const c = [...editingEvent.extraCosts]; c[index] = { ...c[index], [field]: value }; setEditingEvent({ ...editingEvent, extraCosts: c }); }};
  const addCost = () => { if (editingEvent) setEditingEvent({ ...editingEvent, extraCosts: [...editingEvent.extraCosts, { id: Math.random().toString(36), description: '', value: 0 }] }); };
  const removeCost = (index: number) => { if (editingEvent) { const c = [...editingEvent.extraCosts]; c.splice(index, 1); setEditingEvent({ ...editingEvent, extraCosts: c }); }};

  return (
    <div className="space-y-8 pb-32 relative">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1">
            <button onClick={prevMonth} className="p-2 hover:bg-white rounded-full text-slate-600 transition-all shadow-sm">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center w-32">
              <span className="text-sm font-bold text-slate-800 uppercase block leading-none">
                {MONTHS[currentDate.getMonth()]}
              </span>
              <span className="text-xs text-slate-500">{currentDate.getFullYear()}</span>
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-white rounded-full text-slate-600 transition-all shadow-sm">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
           <button 
             onClick={() => setIsAddingPayment(true)}
             className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-bold shadow-md shadow-emerald-100 transition-all text-sm"
           >
             <DollarSign className="w-4 h-4" /> Adiantamento
           </button>
           <button 
             onClick={() => {
                setNewEventDate(`${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-01`);
                setIsAddingEvent(true);
             }}
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-bold shadow-md shadow-indigo-100 transition-all text-sm"
           >
             <Plus className="w-4 h-4" /> Novo Evento
           </button>
        </div>
      </div>

      {/* PAID STAMP / MANUAL STATUS BAR */}
      <div className={`
         w-full rounded-xl p-4 flex items-center justify-between border-2 transition-all
         ${isSettled ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-300 shadow-sm'}
      `}>
          <div className="flex items-center gap-4">
             {isSettled ? (
                 <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                     <Lock className="w-6 h-6" />
                 </div>
             ) : (
                 <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner animate-pulse">
                     <HelpCircle className="w-6 h-6" />
                 </div>
             )}
             <div>
                 <h4 className={`text-lg font-bold ${isSettled ? 'text-emerald-800' : 'text-slate-800'}`}>
                     {isSettled ? 'PRESTAÇÃO DE CONTAS REALIZADA' : 'PENDENTE DE ACERTO'}
                 </h4>
                 <p className="text-xs text-slate-500 max-w-md">
                     {isSettled 
                        ? 'Você confirmou que este mês já foi discutido e encerrado com a casa.' 
                        : 'Este mês ainda consta como aberto. Clique ao lado quando realizar o acerto final com o proprietário.'}
                 </p>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
              {!isSettled && (
                  <div className="text-right hidden md:block opacity-60">
                      <p className="text-xs font-bold text-slate-500 uppercase">Saldo Global (Referência)</p>
                      <p className="text-lg font-bold text-slate-700">
                          R$ {cumulativeStats.outstandingGlobal.toLocaleString('pt-BR')}
                      </p>
                  </div>
              )}
              
              <button 
                onClick={() => onToggleSettled(currentMonthKey)}
                className={`
                    px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-sm
                    ${isSettled 
                        ? 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'}
                `}
              >
                  {isSettled ? (
                      <>Reabrir Mês</>
                  ) : (
                      <><CheckCircle className="w-4 h-4" /> Marcar como Acertado</>
                  )}
              </button>
          </div>
      </div>

      {/* Floating Balloons (Visual Timeline of the Month) */}
      {monthEvents.length > 0 && (
         <div className="bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timeline</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {monthEvents.map(evt => {
                const rev = (evt.couvertCount * evt.couvertPrice) + ((evt.promoCount || 0) * (evt.promoPrice || 0));
                const cost = evt.bands.reduce((acc, b) => acc + b.value, 0) + evt.extraCosts.reduce((acc, c) => acc + c.value, 0);
                const profit = rev - cost;
                const isProfit = profit >= 0;
                const day = parseDate(evt.date).getDate();

                return (
                  <div key={evt.id} className="group relative flex flex-col items-center gap-1 cursor-default">
                     <div 
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md transition-transform hover:scale-110
                          ${isProfit ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-rose-400 to-rose-600'}
                        `}
                     >
                        {day}
                     </div>
                     <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {isProfit ? '+' : ''} R$ {profit.toFixed(0)}
                     </div>
                  </div>
                );
              })}
            </div>
         </div>
      )}

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <p className="text-slate-500 text-xs font-bold uppercase mb-2 z-10 relative">Receita Eventos</p>
          <p className="text-2xl font-bold text-slate-800 z-10 relative">R$ {stats.revenue.toLocaleString('pt-BR')}</p>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <p className="text-slate-500 text-xs font-bold uppercase mb-2 z-10 relative">Custos Totais</p>
          <p className="text-2xl font-bold text-rose-600 z-10 relative">R$ {stats.costs.toLocaleString('pt-BR')}</p>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm relative overflow-hidden ${stats.operatingProfit >= 0 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-600' : 'bg-gradient-to-br from-rose-500 to-rose-600 text-white border-rose-600'}`}>
           <p className="text-white/80 text-xs font-bold uppercase mb-2">Lucro Operacional</p>
           <p className="text-3xl font-bold">
              R$ {stats.operatingProfit.toLocaleString('pt-BR')}
           </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
           <p className="text-slate-500 text-xs font-bold uppercase mb-2 z-10 relative">Consumo Pessoal</p>
           <p className="text-2xl font-bold text-rose-600 z-10 relative">- R$ {stats.consCost.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {monthEvents.map(evt => {
            const rev = (evt.couvertCount * evt.couvertPrice) + ((evt.promoCount || 0) * (evt.promoPrice || 0));
            const costs = evt.bands.reduce((s, b) => s + b.value, 0) + evt.extraCosts.reduce((s,c) => s + c.value, 0);
            const profit = rev - costs;
            const isLoss = profit < 0;
            const displayDate = parseDate(evt.date);

            return (
              <div key={evt.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-indigo-200 transition-colors">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  <div className="flex gap-5">
                     <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-xl w-20 h-20 text-slate-700 shrink-0">
                       <span className="text-3xl font-bold tracking-tighter">{displayDate.getDate()}</span>
                       <span className="text-xs font-bold uppercase text-slate-400">{displayDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                     </div>
                     <div className="flex flex-col justify-center">
                       <div className="space-y-1 mb-2">
                         {evt.bands.map(b => (
                           <div key={b.id} className="font-medium text-slate-900 flex items-center gap-2">
                             {b.name || 'Banda a definir'} 
                             <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{b.time}</span>
                           </div>
                         ))}
                       </div>
                       <div className="flex items-center gap-4 text-sm text-slate-500">
                         <span className="flex items-center gap-1"><Users className="w-4 h-4 text-slate-400"/> {evt.couvertCount + (evt.promoCount || 0)}</span>
                         <span className="flex items-center gap-1"><Trash2 className="w-4 h-4 text-rose-400"/> Custo: {costs}</span>
                       </div>
                     </div>
                  </div>
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 lg:gap-1 min-w-[160px] border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                    <div className="text-right">
                        <span className="block text-xs text-slate-400 font-bold uppercase">Resultado Líquido</span>
                        <span className={`text-2xl font-bold ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isLoss ? '-' : '+'} R$ {Math.abs(profit).toLocaleString('pt-BR')}
                        </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button onClick={() => setEditingEvent(evt)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDeleteEvent(evt.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
        })}
      </div>

      {/* FECHAMENTO DO MES / CAIXINHA FINAL */}
      <div className="mt-12 bg-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-700 rounded-full opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="bg-slate-700 p-2 rounded-lg"><Wallet className="w-6 h-6 text-indigo-400"/></div>
              <h3 className="text-xl font-bold">Fechamento: {MONTHS[currentDate.getMonth()]}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
              
              {/* Col 1: Calculo do Mes */}
              <div className="space-y-3">
                  <p className="text-slate-400 text-xs font-bold uppercase">Resultado do Período</p>
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Lucro Eventos</span>
                      <span className="font-bold text-emerald-400">R$ {stats.operatingProfit.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Consumo Pessoal</span>
                      <span className="font-bold text-rose-400">- R$ {stats.consCost.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="h-px bg-slate-700 my-2"></div>
                  <div className="flex justify-between text-lg font-bold">
                      <span>Resultado Líquido</span>
                      <span className={stats.netResult >= 0 ? 'text-white' : 'text-rose-400'}>R$ {stats.netResult.toLocaleString('pt-BR')}</span>
                  </div>
              </div>

              {/* Col 2: Adiantamentos deste mes */}
              <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-slate-400 text-xs font-bold uppercase">Adiantamentos (Neste Mês)</p>
                    <button onClick={() => setIsAddingPayment(true)} className="text-xs text-indigo-400 hover:text-indigo-300 underline">Adicionar</button>
                  </div>
                  
                  {stats.monthPayments.length === 0 ? (
                      <p className="text-slate-500 text-sm italic">Nenhum recebimento registrado neste mês.</p>
                  ) : (
                      <div className="max-h-24 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-600">
                          {stats.monthPayments.map(p => (
                              <div key={p.id} className="flex justify-between text-sm group">
                                  <span className="text-slate-300 truncate w-32">{p.note || 'Adiantamento'}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-emerald-400 font-bold">R$ {p.amount}</span>
                                    <button onClick={() => onDeletePayment(p.id)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
                  {stats.monthPayments.length > 0 && (
                      <div className="pt-2 border-t border-slate-700 flex justify-between text-sm font-bold">
                          <span>Total Recebido</span>
                          <span className="text-emerald-400">R$ {stats.totalMonthPaid.toLocaleString('pt-BR')}</span>
                      </div>
                  )}
              </div>

              {/* Col 3: Status Geral */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 flex flex-col justify-center items-center text-center">
                   {isSettled ? (
                       <>
                          <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                          <p className="text-emerald-400 font-bold text-lg">Mês Acertado</p>
                          <p className="text-xs text-slate-400 mt-1">Prestação de contas realizada.</p>
                       </>
                   ) : (
                       <>
                          <ArrowDownCircle className="w-10 h-10 text-slate-400 mb-2" />
                          <p className="text-white font-bold text-lg">Pendente</p>
                          <p className="text-xs text-slate-400 mt-1">Aguardando prestação de contas.</p>
                       </>
                   )}
              </div>
          </div>
      </div>

      {/* MODALS */}
      {/* Date Picker Modal */}
      {isAddingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              <h3 className="font-bold text-lg mb-2 text-slate-800">Nova Data</h3>
              <input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl mb-6 text-lg" />
              <div className="flex gap-3">
                 <button onClick={() => setIsAddingEvent(false)} className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl">Cancelar</button>
                 <button onClick={handleCreateEvent} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Confirmar</button>
              </div>
           </div>
        </div>
      )}

      {/* Payment Modal */}
      {isAddingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-600"/> Registrar Adiantamento</h3>
              
              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                      <input type="number" autoFocus value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl text-xl font-bold text-slate-800" placeholder="0.00" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                      <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl text-slate-800" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observação</label>
                      <input type="text" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl text-slate-800" placeholder="Ex: Pix Parcial" />
                  </div>
              </div>

              <div className="flex gap-3 mt-6">
                 <button onClick={() => setIsAddingPayment(false)} className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl">Cancelar</button>
                 <button onClick={handleCreatePayment} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700">Salvar</button>
              </div>
           </div>
        </div>
      )}

      {/* Edit Modal (re-used existing structure) */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 my-8 relative">
            <button onClick={() => setEditingEvent(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold text-slate-800 mb-1">Detalhes do Evento</h3>
            <p className="text-sm text-indigo-600 font-medium mb-6">{parseDate(editingEvent.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <form onSubmit={handleUpdateEvent} className="space-y-6">
              {/* Simplified for brevity - assumes same form fields as previous version but kept functional */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-4"><Users className="w-4 h-4 text-slate-400" /><span className="text-xs font-bold text-slate-500 uppercase">Bilheteria</span></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs text-slate-500 mb-1">Qtd Normal</label><input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 font-bold" value={editingEvent.couvertCount} onChange={e => setEditingEvent({...editingEvent, couvertCount: Number(e.target.value)})} /><div className="mt-1 flex items-center gap-1 text-xs text-slate-400"><span>x R$</span><input className="w-12 border-b border-slate-300 bg-transparent text-center" value={editingEvent.couvertPrice} onChange={e => setEditingEvent({...editingEvent, couvertPrice: Number(e.target.value)})} /></div></div>
                    <div><label className="block text-xs text-slate-500 mb-1">Qtd Promo/VIP</label><input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 font-bold" value={editingEvent.promoCount || 0} onChange={e => setEditingEvent({...editingEvent, promoCount: Number(e.target.value)})} /><div className="mt-1 flex items-center gap-1 text-xs text-slate-400"><span>x R$</span><input className="w-12 border-b border-slate-300 bg-transparent text-center" value={editingEvent.promoPrice || 0} onChange={e => setEditingEvent({...editingEvent, promoPrice: Number(e.target.value)})} /></div></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-slate-400" /><span className="text-xs font-bold text-slate-500 uppercase">Atrações Musicais</span></div><button type="button" onClick={addBand} className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded"><PlusCircle className="w-3 h-3" /> Adicionar</button></div>
                <div className="space-y-3">{editingEvent.bands.map((band, idx) => (<div key={band.id} className="flex gap-2 items-center"><input className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-center" value={band.time} onChange={e => updateEditingBand(idx, 'time', e.target.value)} /><input list="band-suggestions-edit" className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium" value={band.name} placeholder="Nome da Banda" onChange={e => updateEditingBand(idx, 'name', e.target.value)} /><div className="relative w-24"><span className="absolute left-2 top-2 text-slate-400 text-xs">R$</span><input className="w-full pl-6 bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold text-rose-600" type="number" value={band.value} onChange={e => updateEditingBand(idx, 'value', Number(e.target.value))} /></div><button type="button" onClick={() => removeBand(idx)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></div>))}</div>
                <datalist id="band-suggestions-edit">{data.bandPresets.map((preset, idx) => (<option key={idx} value={preset.name} />))}</datalist>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3 pt-4 border-t border-slate-100"><div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-slate-400" /><span className="text-xs font-bold text-slate-500 uppercase">Custos Extras</span></div><button type="button" onClick={addCost} className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded"><PlusCircle className="w-3 h-3" /> Adicionar</button></div>
                <div className="space-y-3">{editingEvent.extraCosts.map((cost, idx) => (<div key={cost.id} className="flex gap-2 items-center"><input className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Descrição" value={cost.description} onChange={e => updateEditingCost(idx, 'description', e.target.value)} /><div className="relative w-28"><span className="absolute left-2 top-2 text-slate-400 text-xs">R$</span><input className="w-full pl-6 bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold text-slate-700" type="number" value={cost.value} onChange={e => updateEditingCost(idx, 'value', Number(e.target.value))} /></div><button type="button" onClick={() => removeCost(idx)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></div>))}</div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold text-lg rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Salvar Tudo</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financial;