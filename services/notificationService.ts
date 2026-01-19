
import { ForecastRow, Notification } from '../types';

export const notificationService = {
  getAlerts: (data: ForecastRow[]): Notification[] => {
    const alerts: Notification[] = [];
    const now = new Date();

    data.forEach(row => {
      // Regra 1: Oportunidade de alto valor (> 500k) sem follow-up recente
      // Fix: Changed row.AMOUNT to row.VALOR
      if (row.VALOR > 500000 && (!row['FOLLOW-UP'] || row['FOLLOW-UP'].length < 10)) {
        alerts.push({
          id: `alert-value-${row.id}`,
          title: 'Alto Valor sem Follow-up',
          // Fix: Changed row.CUSTOMER to row.CLIENTE and row.AMOUNT to row.VALOR
          message: `A oportunidade ${row.CLIENTE} de R$ ${row.VALOR.toLocaleString()} precisa de atenção imediata.`,
          type: 'warning',
          rowId: row.id
        });
      }

      // Regra 2: Confiança Alta (90%) mas sem pedido (JAN/FEV/MAR não marcados)
      // Fix: Changed row.Confidence to row.CONFIDÊNCIA
      if (row.CONFIDÊNCIA === 90 && !row.JAN && !row.FEV && !row.MAR) {
        alerts.push({
          id: `alert-closing-${row.id}`,
          title: 'Gatilho de Fechamento',
          // Fix: Changed row.CUSTOMER to row.CLIENTE
          message: `${row.CLIENTE} está em 90%. Falta pouco para fechar! Verifique a PO.`,
          type: 'info',
          rowId: row.id
        });
      }

      // Regra 3: Pendência ativa (oweInfoToClient)
      if (row.oweInfoToClient) {
        alerts.push({
          id: `alert-pendency-${row.id}`,
          title: 'Pendência com Cliente',
          // Fix: Changed row.CUSTOMER to row.CLIENTE
          message: `Você deve informações para ${row.CLIENTE}.`,
          type: 'warning',
          rowId: row.id
        });
      }
    });

    return alerts;
  }
};
