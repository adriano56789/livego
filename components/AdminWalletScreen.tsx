
import React, { useState, useEffect } from 'react';
import { BackIcon, BankIcon, EnvelopeIcon, PencilIcon, DocumentTextIcon, CheckCircleIcon, ClockIcon, MinusCircleIcon } from './icons';
import { User, ToastType, PurchaseRecord } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';

interface AdminWalletScreenProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  updateUser: (user: User) => void;
  addToast: (type: ToastType, message: string) => void;
  // This prop will carry the full history from App.tsx which updates via WebSocket
  // We will filter it inside to show only relevant admin items (withdraws, fee income)
  purchaseHistory?: PurchaseRecord[]; 
}

const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'R$ 0,00';
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
};

type FilterType = 'all' | 'Concluído' | 'Pendente' | 'Cancelado';

const StatusIcon: React.FC<{ status: PurchaseRecord['status'] }> = ({ status }) => {
    switch (status) {
        case 'Concluído': return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
        case 'Pendente': return <ClockIcon className="w-4 h-4 text-yellow-400" />;
        case 'Cancelado': return <MinusCircleIcon className="w-4 h-4 text-red-400" />;
        default: return null;
    }
};

const HistoryItem: React.FC<{ item: PurchaseRecord }> = ({ item }) => {
    const isIncome = item.type === 'platform_fee_income';

    return (
        <div className="flex justify-between items-center py-4 px-4 bg-[#1C1C1E] rounded-xl border border-white/5">
            <div>
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isIncome ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="font-semibold text-white text-sm">{item.description}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-4">{new Date(item.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
            </div>
            <div className="text-right">
                <p className={`font-bold text-base ${isIncome ? 'text-green-400' : 'text-white'}`}>
                    {isIncome ? '+' : '-'} {formatCurrency(item.amountBRL)}
                </p>
                <div className="flex items-center justify-end space-x-1.5 mt-1">
                    <StatusIcon status={item.status} />
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${
                        item.status === 'Concluído' ? 'text-green-500' : 
                        item.status === 'Pendente' ? 'text-yellow-500' : 'text-red-500'
                    }`}>{item.status}</span>
                </div>
            </div>
        </div>
    );
};

const BalanceDisplay: React.FC<{ earnings: number | undefined }> = ({ earnings }) => (
    <div className="relative w-full rounded-3xl overflow-hidden p-6 shadow-xl mb-2">
         {/* Background gradient matching screenshot style */}
         <div className="absolute inset-0 bg-gradient-to-br from-[#3b2d65] via-[#231e32] to-[#121212]"></div>
         {/* Glow effect */}
         <div className="absolute top-[-50%] left-0 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.15),_transparent_70%)] pointer-events-none"></div>

         <div className="relative z-10 flex flex-col items-start">
             <div className="flex items-center space-x-3 mb-6">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/5 shadow-inner">
                    <BankIcon className="w-5 h-5 text-white" />
                 </div>
                 <h2 className="text-lg font-medium text-white/90 tracking-wide">Ganhos da Plataforma</h2>
             </div>
             
             <p className="text-sm text-gray-400 mb-1">Taxas acumuladas da plataforma</p>
             <p className="text-4xl font-extrabold text-white tracking-tight">
                {formatCurrency(earnings)}
             </p>
         </div>
    </div>
);


const AdminWalletScreen: React.FC<AdminWalletScreenProps> = ({ isOpen, onClose, currentUser, updateUser, addToast, purchaseHistory }) => {
    const [email, setEmail] = useState('');
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isSavingEmail, setIsSavingEmail] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [history, setHistory] = useState<PurchaseRecord[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');

    useEffect(() => {
        if (isOpen) {
            const savedEmail = currentUser.adminWithdrawalMethod?.email;
            setEmail(savedEmail || '');
            setIsEditingEmail(!savedEmail); 
        }
    }, [isOpen, currentUser.adminWithdrawalMethod]);

    // Use passed purchaseHistory prop or fetch if missing (fallback)
    // In this fix, we primarily rely on the prop for real-time updates.
    useEffect(() => {
        if (isOpen) {
            if (purchaseHistory) {
                // Filter relevant records for Admin
                const adminRecords = purchaseHistory.filter(p => 
                    p.userId === currentUser.id && 
                    (p.type === 'withdraw_platform_earnings' || p.type === 'platform_fee_income')
                );
                // Apply status filter
                const filtered = filter === 'all' ? adminRecords : adminRecords.filter(p => p.status === filter);
                // Sort
                filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                
                setHistory(filtered);
                setIsLoadingHistory(false);
            } else {
                // Fallback fetch if prop is not provided (though App.tsx should provide it)
                setIsLoadingHistory(true);
                api.getAdminWithdrawalHistory(filter)
                    .then(setHistory)
                    .catch(() => addToast(ToastType.Error, "Falha ao carregar histórico de saques."))
                    .finally(() => setIsLoadingHistory(false));
            }
        }
    }, [isOpen, filter, purchaseHistory, currentUser.id, addToast]);
    
    const handleSaveEmail = async () => {
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            addToast(ToastType.Error, "Por favor, insira um e-mail válido.");
            return;
        }
        setIsSavingEmail(true);
        try {
            const { success, user } = await api.saveAdminWithdrawalMethod(email);
            if (success && user) {
                updateUser(user);
                addToast(ToastType.Success, "E-mail de saque salvo com sucesso!");
                setIsEditingEmail(false);
            } else {
                throw new Error("Falha ao salvar o e-mail.");
            }
        } catch (error) {
            addToast(ToastType.Error, (error as Error).message);
        } finally {
            setIsSavingEmail(false);
        }
    };

    const handleWithdraw = async () => {
        if (isEditingEmail || !currentUser.adminWithdrawalMethod?.email) {
            addToast(ToastType.Error, "Por favor, salve um e-mail para saque primeiro.");
            return;
        }
        if (!currentUser.platformEarnings || currentUser.platformEarnings <= 0) {
            addToast(ToastType.Info, "Não há saldo para sacar.");
            return;
        }
        
        setIsWithdrawing(true);
        try {
            const { success, message } = await api.requestAdminWithdrawal();
            if (success) {
                addToast(ToastType.Success, message || "Saque solicitado com sucesso!");
                // No need to manually refetch if sockets are working, but fallback exists
                if (!purchaseHistory) {
                    api.getAdminWithdrawalHistory(filter).then(setHistory);
                }
            } else {
                throw new Error("A solicitação de saque falhou.");
            }
        } catch (error) {
            addToast(ToastType.Error, (error as Error).message);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const TabButton: React.FC<{ label: string; type: FilterType }> = ({ label, type }) => {
        const isActive = filter === type;
        return (
          <button
            onClick={() => setFilter(type)}
            className={`px-5 py-2 text-xs font-semibold rounded-full transition-all duration-200 whitespace-nowrap border ${
              isActive 
                ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]' 
                : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'
            }`}
          >
            {label}
          </button>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-[#0F0F11] z-50 flex flex-col text-white font-sans">
            {/* Header */}
            <header className="flex items-center p-4 pt-6 pb-2 flex-shrink-0 relative">
                <button onClick={onClose} className="absolute left-4 p-2 -ml-2 text-gray-300 hover:text-white transition-colors">
                    <BackIcon className="w-6 h-6" />
                </button>
                <div className="flex-grow flex flex-col items-center justify-center">
                     <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden mb-1 border border-white/10">
                            <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-sm font-semibold text-white">Admin LiveGo</h1>
                     </div>
                </div>
            </header>

            <main className="flex-grow px-5 py-6 space-y-8 overflow-y-auto no-scrollbar">
                <BalanceDisplay earnings={currentUser.platformEarnings} />

                {/* Withdrawal Method Section */}
                <div className="space-y-3">
                     <h2 className="font-bold text-base text-white">Método de Saque</h2>
                     <div className="relative group">
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                             <EnvelopeIcon className="w-5 h-5 text-gray-500" />
                         </div>
                         <input
                             type="email"
                             readOnly={!isEditingEmail}
                             placeholder="Seu e-mail para pagamento"
                             value={email}
                             onChange={(e) => setEmail(e.target.value)}
                             className={`w-full bg-[#161618] border border-gray-700 rounded-2xl py-4 pl-12 pr-12 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-all ${!isEditingEmail ? 'opacity-70' : ''}`}
                         />
                         <button 
                            onClick={isEditingEmail ? handleSaveEmail : () => setIsEditingEmail(true)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-500 hover:text-purple-400 p-1"
                         >
                            {isSavingEmail ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-purple-500"></div>
                            ) : (
                                isEditingEmail ? <CheckCircleIcon className="w-5 h-5" /> : <PencilIcon className="w-5 h-5" />
                            )}
                         </button>
                     </div>
                </div>

                {/* History Section */}
                <div className="space-y-4">
                    <h2 className="font-bold text-base text-white">Histórico de Transações</h2>

                    {/* Filter Tabs */}
                    <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-1">
                        <TabButton label="Todos" type="all" />
                        <TabButton label="Concluído" type="Concluído" />
                        <TabButton label="Pendente" type="Pendente" />
                        <TabButton label="Cancelado" type="Cancelado" />
                    </div>

                    {/* List */}
                    <div className="min-h-[100px]">
                        {isLoadingHistory ? (
                            <div className="flex justify-center py-8"><LoadingSpinner /></div>
                        ) : history.length > 0 ? (
                            <div className="space-y-3">
                                {history.map(item => <HistoryItem key={item.id} item={item} />)}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-500/50">
                                <p className="text-sm font-medium">Nenhuma transação encontrada.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            
            {/* Bottom Button */}
            <footer className="p-5 flex-shrink-0 bg-gradient-to-t from-[#0F0F11] to-transparent">
                <button
                    onClick={handleWithdraw}
                    disabled={isWithdrawing || isEditingEmail || !currentUser.platformEarnings || currentUser.platformEarnings <= 0}
                    className="w-full bg-[#8B5CF6] text-white font-bold py-4 rounded-xl text-lg hover:bg-[#7C3AED] transition-all shadow-lg shadow-purple-900/20 active:scale-[0.98] disabled:bg-[#2C2C2E] disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
                >
                     {isWithdrawing ? "Processando..." : `Sacar ${formatCurrency(currentUser.platformEarnings)}`}
                </button>
            </footer>
        </div>
    );
};

export default AdminWalletScreen;
