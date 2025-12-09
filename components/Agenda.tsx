import React, { useState } from 'react';
import { AppState, EventData, Band, parseDate } from '../types';
import { Calendar, Plus, ArrowRight, AlertTriangle, Music, Trash2, PlusCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  data: AppState;
  onAddEvent: (evt: EventData) => void;
  onUpdateEvent: (evt: EventData) => void;
}

const Agenda: React.FC<Props> = ({ data, onAddEvent, onUpdateEvent }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [date, setDate] = useState('');
  
  // Start with 2 default slots as requested
  const [bandsInput, setBandsInput] = useState([
    { name: '', time: '17:00', value: '' },
    { name: '', time: '20:00', value: '' }
  ]);

  // -- Generate Next 8 Sundays --
  const getNextSundays = () => {
    const dates = [];
    let d = new Date();
    // Move to next Sunday (or today if Sunday)
    d.setDate(d.getDate() + (7 - d.getDay()) % 7);
    
    for(let i=0; i<8; i++) {
        dates.push(new Date(d));
        d.setDate(d.getDate() + 7);
    }
    return dates;
  }

  const nextSundays = getNextSundays();
  
  // Check if a specific date has an event
  const getEventForDate = (dateObj: Date) => {
      const dateStr = dateObj.toISOString().split('T')[0];
      return data.events.find(e => e.date === dateStr && e.status === 'scheduled');
  }

  const scheduledEvents = data.events
    .filter(e => e.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Handle Band Input Change with Autocomplete Logic
  const handleBandChange = (index: number, field: 'name' | 'time' | 'value', val: string) => {
    const newBands = [...bandsInput];
    newBands[index] = { ...newBands[index], [field]: val };
    
    // If name changed, try to find in presets
    if (field === 'name') {
      const preset = data.bandPresets.find(p => p.name.toLowerCase() === val.toLowerCase());
      if (preset) {
        newBands[index].value = preset.lastValue.toString();
      }
    }
    
    setBandsInput(newBands);
  };

  const addBandSlot = () => {
    setBandsInput([...bandsInput, { name: '', time: '', value: '' }]);
  };

  const removeBandSlot = (index: number) => {
    setBandsInput(bandsInput.filter((_, i) => i !== index));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty bands
    const validBands: Band[] = bandsInput
      .filter(b => b.name.trim() !== '')
      .map(b => ({
        id: Math.random().toString(36).substr(2, 9),
        name: b.name,
        time: b.time,
        value: parseFloat(b.value) || 0
      }));

    const newEvent: EventData = {
      id: Math.random().toString(36).substr(2, 9),
      date: date,
      status: 'scheduled',
      couvertPrice: 15, // Padrão 15
      couvertCount: 0,
      extraCosts: [], // Lista vazia de custos
      bands: validBands
    };
    onAddEvent(newEvent);
    setShowModal(false);
    
    // Reset form to default state
    setDate('');
    setBandsInput([
      { name: '', time: '17:00', value: '' },
      { name: '', time: '20:00', value: '' }
    ]);
  };

  const handleRealize = (evt: EventData) => {
    if(confirm('Isso moverá o evento para a aba Financeiro para você lançar a bilheteria real. Confirmar?')) {
        const updated: EventData = {
            ...evt,
            status: 'done',
            couvertCount: 0, 
            extraCosts: []
        };
        onUpdateEvent(updated);
    }
  };

  // Helper to start creation for a specific date
  const openCreateForDate = (dateObj: Date) => {
      setDate(dateObj.toISOString().split('T')[0]);
      // Reset bands to default when opening modal
      setBandsInput([
        { name: '', time: '17:00', value: '' },
        { name: '', time: '20:00', value: '' }
      ]);
      setShowModal(true);
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Agenda Dominical</h2>
           <p className="text-slate-500 text-sm">Planejamento dos próximos 2 meses.</p>
        </div>
        <button 
          onClick={() => { setDate(''); setBandsInput([{ name: '', time: '17:00', value: '' }, { name: '', time: '20:00', value: '' }]); setShowModal(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Evento Manual
        </button>
      </div>

      {/* Next Sundays Grid (8 Items, Compact) */}
      <div>
         <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" /> Próximos 8 Domingos
            </h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Visão Compacta</span>
         </div>
         
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {nextSundays.map((sunday, idx) => {
                const evt = getEventForDate(sunday);
                const hasBands = evt && evt.bands.length > 0 && evt.bands.every(b => b.name !== '');
                const isNext = idx === 0;
                
                return (
                    <div key={idx} className="relative group">
                        {evt ? (
                             // Card de Evento Existente (Compacto)
                             <div className={`
                                h-full flex flex-col justify-between
                                bg-white rounded-lg border shadow-sm transition-all hover:shadow-md
                                ${hasBands ? 'border-slate-200 hover:border-indigo-300' : 'border-orange-200 bg-orange-50/50'}
                             `}>
                                {/* Header Compacto */}
                                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-lg">
                                   <div className="flex items-center gap-2">
                                      <span className="text-lg font-bold text-slate-700">{sunday.getDate()}</span>
                                      <span className="text-xs uppercase font-bold text-slate-400">{sunday.toLocaleDateString('pt-BR', { month: 'short' }).replace('.','')}</span>
                                   </div>
                                   {!hasBands && (
                                       <span title="Definir atrações">
                                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                                       </span>
                                   )}
                                   {isNext && hasBands && (
                                       <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">PRÓXIMO</span>
                                   )}
                                </div>
                                
                                {/* Lista de Bandas Compacta */}
                                <div className="p-3 space-y-1.5 flex-1 min-h-[60px]">
                                   {evt.bands.length > 0 ? evt.bands.slice(0,3).map((b, i) => (
                                       <div key={i} className="text-xs font-medium text-slate-600 flex items-center gap-1.5 truncate">
                                          <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1 rounded">{b.time}</span>
                                          <span className="truncate">{b.name || '...'}</span>
                                       </div>
                                   )) : (
                                       <p className="text-xs text-orange-500 italic flex items-center gap-1">
                                           <Music className="w-3 h-3"/> Sem atrações
                                       </p>
                                   )}
                                   {evt.bands.length > 3 && <p className="text-[10px] text-slate-400 italic pl-1">+ {evt.bands.length - 3} bandas</p>}
                                </div>

                                {/* Botão de Ação */}
                                <div className="p-2 border-t border-slate-100">
                                    <button 
                                    onClick={() => handleRealize(evt)}
                                    title="Move este evento para a aba Financeiro para lançar os ganhos reais"
                                    className="w-full py-1.5 bg-indigo-50 hover:bg-emerald-50 text-indigo-600 hover:text-emerald-600 font-bold text-xs rounded border border-indigo-100 hover:border-emerald-200 flex items-center justify-center gap-1 transition-colors"
                                    >
                                    Mover p/ Financeiro <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                             </div>
                        ) : (
                            // Card Vazio (Compacto)
                            <div 
                               onClick={() => openCreateForDate(sunday)}
                               className="h-full min-h-[150px] border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-slate-50 cursor-pointer transition-all gap-1"
                            >
                                <div className="flex flex-col items-center leading-none mb-1">
                                    <span className="text-xl font-bold">{sunday.getDate()}</span>
                                    <span className="text-[10px] uppercase">{sunday.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                </div>
                                <Plus className="w-5 h-5 opacity-40" />
                                <span className="text-xs font-medium">Agendar</span>
                            </div>
                        )}
                    </div>
                )
            })}
         </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
            <span>Todos os Agendamentos</span>
            <span className="text-xs font-normal text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-lg">Eventos ainda não realizados</span>
        </div>
        <table className="w-full text-left">
          <tbody className="divide-y divide-slate-100">
            {scheduledEvents.length === 0 ? (
               <tr>
                 <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Nenhum evento futuro encontrado. Use o calendário acima para criar.</td>
               </tr>
            ) : (
              scheduledEvents.map(evt => (
                <tr key={evt.id} className="hover:bg-slate-50 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-medium text-slate-800">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      {parseDate(evt.date).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {evt.bands.map((b, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-700 text-sm">
                          <span className="text-xs font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{b.time}</span>
                          {b.name}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    R$ {evt.bands.reduce((s,b) => s + b.value, 0).toLocaleString('pt-BR')}
                    <span className="block text-[10px] text-slate-400 font-normal">Custo estimado</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleRealize(evt)}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded transition-colors inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 border border-emerald-200"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Mover p/ Financeiro
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Datalist for Autocomplete */}
      <datalist id="band-suggestions">
        {data.bandPresets.map((preset, idx) => (
          <option key={idx} value={preset.name} />
        ))}
      </datalist>

      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Novo Agendamento</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data do Evento</label>
                <input 
                  type="date" 
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700">Programação (Bandas)</label>
                    <button 
                      type="button" 
                      onClick={addBandSlot} 
                      className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded"
                    >
                      <PlusCircle className="w-3 h-3" /> Adicionar
                    </button>
                </div>
                
                {bandsInput.map((band, index) => (
                  <div key={index} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div className="w-24">
                      <label className="text-[10px] uppercase text-slate-400 font-bold">Horário</label>
                      <input 
                        type="time" 
                        value={band.time}
                        onChange={e => handleBandChange(index, 'time', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase text-slate-400 font-bold">Banda</label>
                      <input 
                        type="text" 
                        list="band-suggestions"
                        placeholder="Nome da atração"
                        value={band.name}
                        onChange={e => handleBandChange(index, 'name', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] uppercase text-slate-400 font-bold">Valor (R$)</label>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        value={band.value}
                        onChange={e => handleBandChange(index, 'value', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="pt-5">
                        <button type="button" onClick={() => removeBandSlot(index)} className="text-slate-400 hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg"
                >
                  Agendar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;