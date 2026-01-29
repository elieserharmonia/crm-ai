
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
  diaryLink?: string; // Link para o OneDrive Web
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
  customer?: string;
  supplier?: string;
  value: number;
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
  Companies = 'empresas',
  Diary = 'diario',
  Settings = 'configuracoes'
}

export const CONFIDENCE_MAPPING = {
  0: 'Oportunidade Perdida',
  10: 'Sonho: Contato inicial realizado',
  30: 'Proposta solicitada (cotação)',
  50: 'Cotação enviada + indicação (Negociação)',
  80: 'RFQ enviada ao departamento do fornecedor',
  90: 'Pedido (PO) em mãos',
  100: 'Fechado (Ganho)'
};
