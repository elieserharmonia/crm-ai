
import { User, UserRole } from '../types';

const USERS_KEY = 'crm_ia_users';
const SESSION_KEY = 'crm_ia_session';
const MANAGER_SECRET_CODE = 'CRM-MASTER-2026';

// Usuários padrão para teste inicial
const DEFAULT_USERS: User[] = [
  { id: '1', name: 'Gestor Master', email: 'gestor@crm.com', role: 'gestor', password: '123' },
  { id: '2', name: 'MARCIO', email: 'marcio@crm.com', role: 'vendedor', password: '123' },
  { id: '3', name: 'CLAUDINEI', email: 'claudinei@crm.com', role: 'vendedor', password: '123' }
];

export const authService = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(data);
  },

  register: (userData: Omit<User, 'id'>, managerCode?: string): { user?: User, error?: string } => {
    const users = authService.getUsers();
    
    // Verificar se o e-mail já existe
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return { error: 'Este e-mail já está cadastrado.' };
    }

    // Validar código de gestor
    if (userData.role === 'gestor' && managerCode !== MANAGER_SECRET_CODE) {
      return { error: 'Código de Autorização de Gestor inválido.' };
    }

    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    
    return { user: newUser };
  },

  login: (email: string, password: string): User | null => {
    const users = authService.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPass } = user;
      localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPass));
      return userWithoutPass as User;
    }
    return null;
  },

  recoverPassword: (email: string): User | null => {
    const users = authService.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  }
};
