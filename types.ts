export type EventStatus = 'scheduled' | 'done';

export interface Band {
  id: string;
  name: string;
  time: string;
  value: number;
}

export interface BandPreset {
  name: string;
  lastValue: number;
}

export interface CostItem {
  id: string;
  description: string;
  value: number;
}

export interface EventData {
  id: string;
  date: string; // YYYY-MM-DD
  status: EventStatus;
  
  // Revenues
  couvertPrice: number;
  couvertCount: number;
  promoPrice?: number;
  promoCount?: number;
  
  // Costs
  bands: Band[];
  extraCosts: CostItem[]; // Alterado de number para array de itens
  
  // Computed (helper)
  totalRevenue?: number;
  totalCost?: number;
  netProfit?: number;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  note: string;
}

// Nova estrutura para despesas pessoais individuais
export interface PersonalExpense {
  id: string;
  date: string;
  description: string;
  originalValue: number; // Valor da comanda cheia
  discountPercent: number; // % de desconto
  finalValue: number; // Valor a pagar (abatido do lucro)
}

export interface Receipt {
  id: string;
  date: string;
  amount: number;
  description: string;
  imageUrl?: string;
  type: 'manual' | 'upload';
}

// Global App State Interface
export interface AppState {
  events: EventData[];
  payments: Payment[];
  personalExpenses: PersonalExpense[];
  receipts: Receipt[];
  bandPresets: BandPreset[];
  settledMonths: string[]; // Lista de chaves 'YYYY-MM' que foram marcados como quitados manualmente
  lastUpdated?: string; // ISO String da última modificação
}

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Helper para corrigir datas
export const parseDate = (dateStr: string) => {
  if(!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}