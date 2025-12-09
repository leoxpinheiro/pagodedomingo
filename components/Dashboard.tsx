import React from 'react';
import { AppState, MONTHS, parseDate } from '../types';
import { Calendar, ArrowUpRight, ArrowDownRight, Award, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: AppState;
}

const Dashboard: React.FC<Props> = ({ data }) => {
  const completedEvents = data.events.filter(e => e.status === 'done');
  
  // Group by month
  const monthlyData: Record<string, { revenue: number, costs: number, profit: number, bestEvent: string, bestEventVal: number }> = {};
  
  completedEvents.forEach(e => {
    const monthKey = e.date.substring(0, 7); // YYYY-MM
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, costs: 0, profit: 0, bestEvent: '', bestEventVal: 0 };
    
    const revenue = (e.couvertCount * e.couvertPrice) + ((e.promoCount || 0) * (e.promoPrice || 0));
    // Updated cost calculation to use extraCosts array
    const cost = e.bands.reduce((sum, b) => sum + b.value, 0) + e.extraCosts.reduce((sum, c) => sum + c.value, 0);
    const profit = revenue - cost;
    
    monthlyData[monthKey].revenue += revenue;
    monthlyData[monthKey].costs += cost;
    monthlyData[monthKey].profit += profit;

    // Track best event using date parser
    if (profit > monthlyData[monthKey].bestEventVal) {
        monthlyData[monthKey].bestEventVal = profit;
        const d = parseDate(e.date);
        monthlyData[monthKey].bestEvent = `${d.getDate()}/${d.getMonth()+1}`;
    }
  });

  const sortedMonths = Object.keys(monthlyData).sort().reverse(); // Newest first
  
  // Calculate Totals
  let globalRevenue = 0;
  let globalProfit = 0;
  Object.values(monthlyData).forEach(m => {
      globalRevenue += m.revenue;
      globalProfit += m.profit;
  });

  // Chart Data (Oldest first)
  const chartData = Object.keys(monthlyData).sort().map(key => ({
    name: MONTHS[parseInt(key.split('-')[1]) - 1].substring(0, 3),
    Lucro: monthlyData[key].profit,
    Receita: monthlyData[key].revenue,
    fullName: MONTHS[parseInt(key.split('-')[1]) - 1] + '/' + key.split('-')[0]
  }));

  // Formatter function for clean numbers (500, 1k, 1.5k)
  const formatYAxis = (val: number) => {
    if (val === 0) return '0';
    if (val < 1000) return val.toString();
    // 1000 -> 1k, 1500 -> 1.5k, 2000 -> 2k
    return `${(val / 1000).toFixed(1).replace('.0', '')}k`;
  };

  // Custom Tooltip Component for Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const receita = payload.find((p: any) => p.dataKey === 'Receita')?.value || 0;
      const lucro = payload.find((p: any) => p.dataKey === 'Lucro')?.value || 0;
      const margin = receita > 0 ? ((lucro / receita) * 100).toFixed(1) : '0';
      // Find full name from payload if available, or just use label
      const dataItem = payload[0].payload; 

      return (
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 min-w-[220px]">
          <p className="font-bold text-slate-400 mb-3 uppercase text-xs tracking-wider border-b border-slate-700 pb-2">
            {dataItem.fullName || label}
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center group">
               <span className="flex items-center gap-2 text-indigo-300 text-sm font-medium">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div> 
                 Receita
               </span>
               <span className="font-bold text-lg">R$ {receita.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center group">
               <span className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div> 
                 Lucro Líquido
               </span>
               <span className="font-bold text-lg">R$ {lucro.toLocaleString('pt-BR')}</span>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-2 flex justify-between items-center mt-1">
               <span className="text-xs text-slate-400 font-medium">Margem de Lucro</span>
               <span className={`font-bold text-sm ${parseFloat(margin) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                 {margin}%
               </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Top Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Painel de Controle</h1>
            <p className="text-indigo-100 opacity-90">Visão macro do seu negócio.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 min-w-[140px]">
                <p className="text-xs text-indigo-100 font-medium uppercase tracking-wider">Lucro Acumulado</p>
                <p className="text-2xl font-bold mt-1">R$ {globalProfit.toLocaleString('pt-BR')}</p>
             </div>
             <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 min-w-[140px]">
                <p className="text-xs text-indigo-100 font-medium uppercase tracking-wider">Receita Bruta</p>
                <p className="text-2xl font-bold mt-1">R$ {globalRevenue.toLocaleString('pt-BR')}</p>
             </div>
          </div>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 rounded-full bg-white opacity-5"></div>
      </div>

      {/* Main Graph Area - Enhanced */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-slate-100 relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-60 pointer-events-none"></div>

         <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 relative z-10">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm">
                        <Activity className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-xl tracking-tight">Fluxo Financeiro</h3>
                </div>
                <p className="text-slate-500 text-sm ml-1">Acompanhamento mensal de performance.</p>
            </div>
            
            <div className="flex gap-6 mt-6 md:mt-0 bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-sm px-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                    <span className="text-slate-700 font-bold">Receita</span>
                </div>
                <div className="flex items-center gap-2 text-sm px-2 border-l border-slate-200">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-slate-700 font-bold">Lucro Real</span>
                </div>
            </div>
         </div>

         <div className="h-[380px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                    dy={15} 
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                    tickFormatter={formatYAxis} 
                />
                <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5 5' }} 
                    wrapperStyle={{ outline: 'none' }}
                />
                
                <Area 
                    type="monotone" 
                    dataKey="Receita" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorReceita)" 
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#4f46e5', className: 'animate-pulse' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="Lucro" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorLucro)" 
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#059669', className: 'animate-pulse' }}
                />
              </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Monthly Cards Grid */}
      <div>
        <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2 mt-8">
            <Calendar className="w-5 h-5 text-indigo-600" /> Detalhamento Mensal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedMonths.length === 0 && (
                <div className="col-span-full py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 text-slate-400 mb-3">
                        <Activity className="w-6 h-6" />
                    </div>
                    <p className="text-slate-500 font-medium">Ainda não há meses fechados.</p>
                    <p className="text-sm text-slate-400">Adicione eventos passados no Financeiro para ver estatísticas.</p>
                </div>
            )}
            {sortedMonths.map(monthKey => {
                const data = monthlyData[monthKey];
                const [year, month] = monthKey.split('-');
                const monthName = MONTHS[parseInt(month) - 1];
                const isPositive = data.profit >= 0;

                return (
                    <div key={monthKey} className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all hover:-translate-y-1 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        
                        <div className="flex justify-between items-start mb-4 pl-2">
                            <div>
                                <h4 className="font-bold text-xl capitalize text-slate-800">{monthName}</h4>
                                <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{year}</span>
                            </div>
                            <div className={`p-2.5 rounded-xl ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {isPositive ? <ArrowUpRight className="w-5 h-5"/> : <ArrowDownRight className="w-5 h-5"/>}
                            </div>
                        </div>

                        <div className="space-y-3 pl-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">Lucro Líquido</span>
                                <span className={`font-bold text-lg ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    R$ {data.profit.toLocaleString('pt-BR')}
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 h-px"></div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Receita Bruta</span>
                                <span className="font-bold text-slate-700">
                                    R$ {data.revenue.toLocaleString('pt-BR')}
                                </span>
                            </div>
                        </div>

                        {data.bestEventVal > 0 && (
                            <div className="mt-5 pt-3 border-t border-slate-50 flex items-center gap-2 text-xs text-indigo-700 bg-gradient-to-r from-indigo-50 to-white -mx-5 -mb-5 p-4 pl-7">
                                <Award className="w-4 h-4 text-indigo-500" />
                                <span>Melhor dia: <strong>{data.bestEvent}</strong> <span className="opacity-70">(+{data.bestEventVal})</span></span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;