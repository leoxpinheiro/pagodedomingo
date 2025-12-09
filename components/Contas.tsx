import React, { useState } from 'react';
import { AppState, PersonalExpense } from '../types';
import { Receipt, Calculator, Trash2, PlusCircle } from 'lucide-react';

interface Props {
  data: AppState;
  onAddExpense: (exp: PersonalExpense) => void;
  onDeleteExpense: (id: string) => void;
}

const Contas: React.FC<Props> = ({ data, onAddExpense, onDeleteExpense }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [originalValue, setOriginalValue] = useState('');
  const [discount, setDiscount] = useState('15'); // Padrão 15%

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(originalValue);
    const disc = parseFloat(discount);
    
    if (!val || isNaN(val)) return;

    const finalVal = val * (1 - (disc / 100));

    const newExpense: PersonalExpense = {
      id: Math.random().toString(36).substr(2, 9),
      date: date,
      description: description || 'Consumo em evento',
      originalValue: val,
      discountPercent: disc,
      finalValue: finalVal
    };

    onAddExpense(newExpense);
    setOriginalValue('');
    setDescription('');
  };

  // Stats
  const totalOriginal = data.personalExpenses.reduce((sum, e) => sum + e.originalValue, 0);
  const totalFinal = data.personalExpenses.reduce((sum, e) => sum + e.finalValue, 0);
  const totalSaved = totalOriginal - totalFinal;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Contas & Consumo Pessoal</h2>
           <p className="text-slate-500 text-sm">Gerencie seu consumo nos eventos. O sistema abate isso do seu lucro automaticamente.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" /> Calculadora
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
              <input 
                type="date" 
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
              <input 
                type="text" 
                placeholder="Ex: Whisky + Energético"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor da Conta (R$)</label>
                <input 
                  type="number" 
                  required
                  placeholder="0.00"
                  value={originalValue}
                  onChange={e => setOriginalValue(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Desconto (%)</label>
                <input 
                  type="number" 
                  required
                  placeholder="15"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Preview Calculation */}
            {originalValue && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                 <div className="flex justify-between text-slate-500">
                   <span>Valor Original:</span>
                   <span>R$ {parseFloat(originalValue).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-emerald-600">
                   <span>Desconto ({discount}%):</span>
                   <span>- R$ {(parseFloat(originalValue) * (parseFloat(discount)/100)).toFixed(2)}</span>
                 </div>
                 <div className="border-t border-slate-200 my-1 pt-1 flex justify-between font-bold text-slate-800 text-lg">
                   <span>A Pagar (Abater):</span>
                   <span>R$ {(parseFloat(originalValue) * (1 - (parseFloat(discount)/100))).toFixed(2)}</span>
                 </div>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <PlusCircle className="w-5 h-5" /> Adicionar à Conta
            </button>
          </form>
        </div>

        {/* List & Stats */}
        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                 <p className="text-xs text-slate-500 uppercase font-bold">Total Consumido</p>
                 <p className="text-xl font-bold text-slate-800">R$ {totalOriginal.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                 <p className="text-xs text-emerald-600 uppercase font-bold">Economia (Desc.)</p>
                 <p className="text-xl font-bold text-emerald-600">R$ {totalSaved.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center border-l-4 border-l-rose-500">
                 <p className="text-xs text-rose-600 uppercase font-bold">Abatido do Lucro</p>
                 <p className="text-xl font-bold text-rose-600">R$ {totalFinal.toFixed(2)}</p>
              </div>
           </div>

           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">
               Histórico de Despesas
             </div>
             <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
               {data.personalExpenses.length === 0 ? (
                 <div className="p-8 text-center text-slate-400">Nenhuma despesa registrada.</div>
               ) : (
                 data.personalExpenses.sort((a,b) => b.date.localeCompare(a.date)).map(exp => (
                   <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                         <Receipt className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="font-medium text-slate-800">{exp.description}</p>
                         <p className="text-xs text-slate-500">{new Date(exp.date).toLocaleDateString('pt-BR')} • Desc: {exp.discountPercent}%</p>
                       </div>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-bold text-rose-600">- R$ {exp.finalValue.toFixed(2)}</p>
                        <p className="text-xs text-slate-400 line-through">R$ {exp.originalValue.toFixed(2)}</p>
                     </div>
                     <button onClick={() => onDeleteExpense(exp.id)} className="ml-4 text-slate-400 hover:text-rose-500">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 ))
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Contas;