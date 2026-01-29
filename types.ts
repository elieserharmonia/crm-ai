
export type UserRole = 'vendedor' | 'gestor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

export interface Contact {
  id: string;
  companyName: string;
  name: string;
  role: string;
  phone: string;
  email: string;
}

export interface DiaryEntry {
  id: string;
  companyName: string;
  content: string;
  lastUpdate: string;
  diaryLink?: string;
}

export interface ForecastRow {
  id: string;
  'Unnamed: 0': string | number;
  'RESP.': string;
  'CUSTOMER': string;
  'SUPPLIER': string;
  'DESCRIPTION': string;
  'AMOUNT': number;
  'UF': string;
  'Confidence': number;
  'JAN': string;
  'FEV': string;
  'MAR': string;
  '2026': string;
  'FOLLOW-UP': string;
  'CONTATOS': string;
  oweInfoToClient: boolean;
  lastUpdate?: string;
  notes?: string;
  budgetCode?: string; // Número do Orçamento
  color?: string;      // Classe de cor do Tailwind (ex: bg-blue-50)
}

export interface PurchaseOrder {
  id: string;
  forecastId: string;
  customer: string;
  supplier: string;
  budgetCode: string; // Vinculado ao orçamento
  poNumber: string;   // Número do pedido
  amount: number;     // Valor fechado
  date: string;
  description: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
  rowId?: string;
}

export interface Goal {
  id: string;
  customer: string;
  supplier: string;
  value: number;       // Valor 2026 (Meta Atual)
  value2025?: number;  // Valor 2025 (Comparativo YoY)
}

export interface SalesPersonProfile {
  name: string;
  email: string;
  logo?: string;
  phone?: string;
  address?: string;
  businessCardUrl?: string;
}

export enum Tab {
  Forecast = 'previsao',
  Dashboard = 'painel',
  Goals = 'metas',
  Orders = 'pedidos',
  Companies = 'empresas',
  Diary = 'diario',
  Settings = 'configuracoes'
}

export const CONFIDENCE_MAPPING = {
  0: 'Oportunidade Perdida',
  10: 'Oportunidade observada',
  30: 'Proposta enviada',
  50: 'Indicação de compra',
  80: 'Solicitação de compra',
  90: 'Pedido recebido',
  100: 'Material entregue'
};
