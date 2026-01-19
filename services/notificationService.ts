
import { ForecastRow, Notification } from '../types';

export const notificationService = {
  getAlerts: (data: ForecastRow[]): Notification[] => {
    const alerts: Notification[] = [];
    const now = new Date();

    data.forEach(row => {
      // Regra 1: Oportunidade de alto valor (> 500k) sem follow-up recente
      // Fix: Corrected property names from VALOR to AMOUNT and CLIENTE to CUSTOMER
      if (row.AMOUNT > 500000 && (!row['FOLLOW-UP'] || row['FOLLOW-UP'].length < 10)) {
        alerts.push({
          id: `alert-value-${row.id}`,
          title: 'Alto Valor sem Follow-up',
          message: `A oportunidade ${row.CUSTOMER} de R$ ${row.AMOUNT.toLocaleString()} precisa de atenção imediata.`,
          type: 'warning',
          rowId: row.id
        });
      }

      // Regra 2: Confiança Alta (90%) mas sem pedido (JAN/FEV/MAR não marcados)
      // Fix: Corrected property names from CONFIDÊNCIA to Confidence and CLIENTE to CUSTOMER
      if (row.Confidence === 90 && !row.JAN && !row.FEV && !row.MAR) {
        alerts.push({
          id: `alert-closing-${row.id}`,
          title: 'Gatilho de Fechamento',
          message: `${row.CUSTOMER} está em 90%. Falta pouco para fechar! Verifique a PO.`,
          type: 'info',
          rowId: row.id
        });
      }

      // Regra 3: Pendência ativa (oweInfoToClient)
      if (row.oweInfoToClient) {
        alerts.push({
          id: `alert-pendency-${row.id}`,
          title: 'Pendência com Cliente',
          // Fix: Corrected property name from CLIENTE to CUSTOMER
          message: `Você deve informações para ${row.CUSTOMER}.`,
          type: 'warning',
          rowId: row.id
        });
      }
    });

    return alerts;
  }
};
