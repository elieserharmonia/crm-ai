
import React, { useState } from 'react';
import { LogIn, ShieldCheck, Lock, Mail, Bot, UserPlus, ArrowLeft, CheckCircle2, Loader2, Copy, X, Key, ShieldAlert, Eye, EyeOff, Save } from 'lucide-react';
import { authService } from '../services/authService';
import { geminiService } from '../services/geminiService';
import { User, UserRole } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

type AuthView = 'login' | 'register' | 'recover';

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('vendedor');
  const [managerCode, setManagerCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // States para Modais e Mensagens
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeContent, setWelcomeContent] = useState('');
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (view === 'register') {
      const { user: newUser, error: regError } = authService.register({ name, email, password, role }, managerCode);
      if (newUser) {
        try {
          const emailDraft = await geminiService.generateWelcomeEmail(newUser);
          setWelcomeContent(emailDraft || '');
          setRegisteredUser(newUser);
          setShowWelcomeModal(true);
        } catch (err) {
          setRegisteredUser(newUser);
          setShowWelcomeModal(true);
        }
      } else {
        setError(regError || 'Erro ao cadastrar.');
      }
    } else if (view === 'login') {
      const user = authService.login(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError('E-mail ou senha incorretos.');
      }
    } else if (view === 'recover') {
      const user = authService.recoverPassword(email);
      if (user) {
        setRecoverySuccess(`Sua senha foi localizada: "${user.password}". Por favor, guarde-a em segurança.`);
      } else {
        setError('E-mail não encontrado no sistema.');
      }
    }
    setIsLoading(false);
  };

  const handleCloseWelcome = () => {
    if (registeredUser) {
      onLogin(registeredUser);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 relative">
        <div className="p-8 bg-blue-600 text-white text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
            <Bot size={32} />
          </div>
          <h1 className="text-2xl font-bold">CRM-IA</h1>
          <p className="text-blue-100/70 text-sm mt-1">
            {view === 'register' ? 'Crie sua conta profissional' : 
             view === 'recover' ? 'Recuperação de Acesso' : 
             'Gerente de Vendas com Inteligência Artificial'}
          </p>
        </div>
        
        <form onSubmit={handleAuth} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 animate-shake flex items-center gap-2">
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          {recoverySuccess && (
            <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100 animate-in fade-in">
              {recoverySuccess}
              <button 
                type="button"
                onClick={() => setView('login')}
                className="block mt-2 text-blue-600 underline"
              >
                Ir para o Login
              </button>
            </div>
          )}
          
          <div className="space-y-4">
            {view === 'register' && (
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {view !== 'recover' && (
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {view === 'register' && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tipo de Acesso</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => setRole('vendedor')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${role === 'vendedor' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}
                    >
                      Vendedor
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRole('gestor')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${role === 'gestor' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
                    >
                      Gestor
                    </button>
                  </div>
                </div>

                {role === 'gestor' && (
                  <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-black text-indigo-500 uppercase tracking-widest px-1 flex items-center gap-1">
                      <Key size={12} /> Código de Autorização de Gestor
                    </label>
                    <input 
                      type="password"
                      required
                      placeholder="Insira o código mestre"
                      className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={managerCode}
                      onChange={(e) => setManagerCode(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-400 px-1 italic">Dica: use CRM-MASTER-2026</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                {view === 'register' ? 'Concluir Cadastro' : 
                 view === 'recover' ? 'Localizar Senha' : 
                 'Acessar Plataforma'}
                <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="pt-2 flex flex-col items-center gap-3">
            {view === 'login' ? (
              <>
                <button 
                  type="button"
                  onClick={() => { setView('recover'); setError(''); }}
                  className="text-sm font-semibold text-slate-500 hover:text-blue-600"
                >
                  Esqueci minha senha
                </button>
                <button 
                  type="button"
                  onClick={() => { setView('register'); setError(''); }}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2"
                >
                  <UserPlus size={16} /> Não tem conta? Cadastre-se
                </button>
              </>
            ) : (
              <button 
                type="button"
                onClick={() => { setView('login'); setError(''); setRecoverySuccess(null); }}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Voltar para o Login
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Welcome Modal - Credenciais Claras */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
             <div className="p-6 bg-green-500 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={24} />
                  <h3 className="text-lg font-bold">Bem-vindo ao CRM-IA!</h3>
                </div>
             </div>
             <div className="p-8 space-y-6">
                <div className="space-y-4 text-center">
                  <h4 className="text-xl font-bold text-slate-800">Olá, {registeredUser?.name}!</h4>
                  <p className="text-sm text-slate-500 px-8">
                    Sua conta foi criada. **Importante:** Guarde suas credenciais abaixo para não perder o acesso ao sistema.
                  </p>
                </div>

                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">E-mail (Login)</span>
                      <span className="font-mono font-bold text-slate-900 select-all">{registeredUser?.email}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Senha de Acesso</span>
                      <span className="font-mono font-bold text-blue-600 select-all px-2 py-1 bg-blue-50 rounded border border-blue-100">{registeredUser?.password}</span>
                   </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl flex items-start gap-3 border border-amber-100">
                  <Save size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    Anotou tudo? O sistema utiliza armazenamento local. Se você limpar o histórico do navegador ou trocar de computador sem um backup, precisará dessas informações.
                  </p>
                </div>

                <div className="border-t pt-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mensagem da IA:</p>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar bg-slate-50 p-4 rounded-xl text-xs text-slate-600 italic leading-relaxed whitespace-pre-wrap">
                    {welcomeContent}
                  </div>
                </div>

                <button 
                  onClick={handleCloseWelcome}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                >
                  Entrar no Painel de Vendas
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
