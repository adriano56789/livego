import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n';
import { api, storage } from '@/services/api';

interface LoginResponse {
  success: boolean;
  error?: string;
  user?: any;
  token?: string;
}

interface LoginScreenProps {
  onLogin: (credentials: { email: string, password: string }) => Promise<LoginResponse>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'register' | 'login'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchLastEmail = async () => {
        try {
            const { email: lastEmail } = await api.auth.getLastEmail();
            if (lastEmail) {
                setEmail(lastEmail);
            }
        } catch (error) {
            console.warn("Could not fetch last login email. This is expected on first login or if the server is restarting.");
        }
    };
    fetchLastEmail();
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;
    
    setLoading(true);
    setStatusMessage({ text: '', type: '' });

    try {
      const result = await onLogin({ email, password });
      if (result && !result.success) {
        setStatusMessage({ text: result.error || 'Falha no login', type: 'error' });
      }
    } catch (error: any) {
      setStatusMessage({ text: error.message || 'E-mail ou senha incorretos.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || loading) return;

    setLoading(true);
    setStatusMessage({ text: '', type: '' });

    try {
      const result = await api.auth.register({ name, email, password });
      if (result.success) {
        setStatusMessage({ text: 'Conta criada com sucesso! Faça login agora.', type: 'success' });
        setViewMode('login');
        setPassword(''); // Limpa a senha por segurança
      }
    } catch (error: any) {
      setStatusMessage({ text: error.message || 'Erro ao registrar conta real no banco.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-cover bg-center font-sans" 
         style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/95"></div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 overflow-hidden">
        
        <div className="w-full text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-6xl font-black text-white mb-2 tracking-tighter italic">LiveGo</h1>
            <p className="text-purple-300 text-sm font-bold uppercase tracking-[0.2em]">Experiência VIP Real</p>
        </div>

        <div className="w-full max-w-sm flex flex-col space-y-4">
            {statusMessage.text && (
                 <div className={`p-4 rounded-2xl text-sm font-bold text-center animate-in zoom-in-95 duration-300 ${statusMessage.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                    {statusMessage.text}
                 </div>
            )}

            {viewMode === 'register' ? (
                <form onSubmit={handleRegister} className="space-y-4 w-full animate-in slide-in-from-right-4 duration-300">
                     <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10 focus-within:border-purple-500/50 transition-all">
                        <input 
                            className="bg-transparent w-full text-white placeholder-gray-500 outline-none text-sm font-medium" 
                            placeholder="Seu nome real ou apelido" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required
                        />
                     </div>
                     <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10 focus-within:border-purple-500/50 transition-all">
                        <input 
                            type="email" 
                            className="bg-transparent w-full text-white placeholder-gray-500 outline-none text-sm font-medium" 
                            placeholder="E-mail de acesso" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required
                        />
                     </div>
                     <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10 focus-within:border-purple-500/50 transition-all">
                        <input 
                            type="password" 
                            className="bg-transparent w-full text-white placeholder-gray-500 outline-none text-sm font-medium" 
                            placeholder="Crie uma senha segura" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required
                        />
                     </div>
                     
                     <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-4 rounded-2xl mt-4 transition-all shadow-xl shadow-purple-900/30 active:scale-95 disabled:opacity-50">
                        {loading ? 'PROCESSANDO...' : 'CRIAR MINHA CONTA'}
                     </button>
                </form>
            ) : (
                <form onSubmit={handleEmailLogin} className="space-y-4 w-full animate-in slide-in-from-left-4 duration-300">
                     <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10 focus-within:border-purple-500/50 transition-all">
                        <input 
                            type="email" 
                            className="bg-transparent w-full text-white placeholder-gray-500 outline-none text-sm font-medium" 
                            placeholder="E-mail" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required
                        />
                     </div>
                     <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10 focus-within:border-purple-500/50 transition-all">
                        <input 
                            type="password" 
                            className="bg-transparent w-full text-white placeholder-gray-500 outline-none text-sm font-medium" 
                            placeholder="Senha" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required
                        />
                     </div>
                     
                     <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-4 rounded-2xl mt-4 transition-all shadow-xl shadow-purple-900/30 active:scale-95 disabled:opacity-50">
                        {loading ? 'VERIFICANDO...' : 'ENTRAR'}
                     </button>
                </form>
            )}
        </div>

        <div className="w-full max-w-sm mt-12 text-center">
            <p className="text-gray-400 text-sm mb-4">
                {viewMode === 'login' ? 'Ainda não tem acesso?' : 'Já possui uma conta ativa?'}
            </p>
            <button 
                onClick={() => {
                    setViewMode(viewMode === 'login' ? 'register' : 'login');
                    setStatusMessage({ text: '', type: '' });
                }}
                className="text-white font-black text-sm uppercase tracking-widest hover:text-purple-400 transition-colors underline decoration-purple-500 decoration-2 underline-offset-8"
            >
                {viewMode === 'login' ? 'Criar minha conta agora' : 'Fazer login no sistema'}
            </button>
        </div>

        <div className="absolute bottom-10 text-gray-600 text-[10px] font-bold uppercase tracking-widest">
            Servidor Real LiveGo Online v1.0
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;