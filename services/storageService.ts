
import { ForecastRow, Goal, SalesPersonProfile, DiaryEntry } from '../types';

const KEYS = {
  FORECAST: 'crm_ia_forecast_data',
  GOALS: 'crm_ia_goals_data',
  PROFILE: 'crm_ia_sales_profile',
  DIARY: 'crm_ia_diary_entries'
};

export const storageService = {
  getForecast: (): ForecastRow[] => {
    const data = localStorage.getItem(KEYS.FORECAST);
    return data ? JSON.parse(data) : [];
  },
  saveForecast: (data: ForecastRow[]) => {
    localStorage.setItem(KEYS.FORECAST, JSON.stringify(data));
  },
  getGoals: (): Goal[] => {
    const data = localStorage.getItem(KEYS.GOALS);
    return data ? JSON.parse(data) : [];
  },
  saveGoals: (data: Goal[]) => {
    localStorage.setItem(KEYS.GOALS, JSON.stringify(data));
  },
  getProfile: (): SalesPersonProfile => {
    const data = localStorage.getItem(KEYS.PROFILE);
    return data ? JSON.parse(data) : { name: '', email: '' };
  },
  saveProfile: (profile: SalesPersonProfile) => {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },
  getDiaryEntries: (): DiaryEntry[] => {
    const data = localStorage.getItem(KEYS.DIARY);
    return data ? JSON.parse(data) : [];
  },
  saveDiaryEntries: (entries: DiaryEntry[]) => {
    localStorage.setItem(KEYS.DIARY, JSON.stringify(entries));
  }
};
