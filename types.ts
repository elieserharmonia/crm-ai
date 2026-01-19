
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

export interface ForecastRow {
  id: string;
  'Unnamed: 0': string | number;
  'RESP.': string;
  'CLIENTE': string;
  'FORNECEDOR': string;
  'DESCRIÇÃO': string;
  'VALOR': number;
  'UF': string;
  'CONFIDÊNCIA': number;
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
  AiManager = 'gerente-ia',
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
