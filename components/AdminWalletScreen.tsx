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

const StatusBadge: React.FC<{ status: PurchaseRecord['status'] }> = ({ status }) => {
    const config = {
        'Concluído': 'bg-green-500/20 text-green-400',
        'Pendente': 'bg-yellow-500/20 text-yellow-400',
        'Cancelado': 'bg-red-500/20 text-red-400',
    }[status];

    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${config}`}>{status}</span>;
};

const HistoryItem: React.FC<{ item: PurchaseRecord }> = ({ item }) => (
    <div className="flex justify-between items-center py-3">
        <div>
            <p className="font-semibold text-white">{item.description}</p>
            <p className="text-sm text-gray-400">{new Date(item.timestamp).toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="text-right">
            <p className="font-bold text-lg text-white">{formatCurrency(item.amountBRL)}</p>
            <div className="flex items-center justify-end space-x-2 mt-1">
                <StatusIcon status={item.status} />
                <StatusBadge status={item.status} />
            </div>
        </div>
    </div>
);

const BalanceDisplay: React.FC<{ earnings: number | undefined }> = ({ earnings }) => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-purple-500/50 text-center">
        <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-purple-900/50 border-2 border-purple-500/50 flex items-center justify-center">
            <BankIcon className="w-8 h-8 text-purple-300" />
        </div>
        <h2 className="text-lg font-semibold text-purple-300">Ganhos da Plataforma</h2>
        <p className="text-xs text-gray-500 mb-2">Taxas acumuladas da plataforma</p>
        <p className="text-5xl font-bold text-white tracking-tight">
            {formatCurrency(earnings)}
        </p>
    </div>
);


const AdminWalletScreen: React.FC<AdminWalletScreenProps> = ({ isOpen, onClose, currentUser, updateUser, addToast }) => {
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

    useEffect(() => {
        if (isOpen) {
            setIsLoadingHistory(true);
            api.getAdminWithdrawalHistory(filter)
                .then(setHistory)
                .catch(() => addToast(ToastType.Error, "Falha ao carregar histórico de saques."))
                .finally(() => setIsLoadingHistory(false));
        }
    }, [isOpen, filter, addToast]);
    
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
                api.getAdminWithdrawalHistory(filter).then(setHistory);
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
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              isActive ? 'bg-purple-600 text-white' : 'bg-[#2C2C2E] text-gray-300 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-[#111] z-50 flex flex-col text-white">
            <header className="flex items-center p-4 border-b border-gray-800 flex-shrink-0">
                <button onClick={onClose} className="absolute z-10 p-2 -ml-2">
                    <BackIcon className="w-6 h-6" />
                </button>
                <div className="flex-grow flex items-center justify-center space-x-3">
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover" />
                    <h1 className="text-lg font-semibold">Admin LiveGo</h1>
                </div>
                <div className="w-6" /> {/* Spacer */}
            </header>

            <main className="flex-grow p-4 space-y-6 overflow-y-auto no-scrollbar">
                <BalanceDisplay earnings={currentUser.platformEarnings} />

                <div className="bg-[#1c1c1e] p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                         <h2 className="font-semibold text-white">Método de Saque</h2>
                         {!isEditingEmail && (
                            <button onClick={() => setIsEditingEmail(true)} className="flex items-center space-x-1 text-purple-400 text-sm font-semibold">
                                <PencilIcon className="w-4 h-4" />
                                <span>Editar</span>
                            </button>
                         )}
                    </div>

                    {isEditingEmail ? (
                        <>
                            <div className="relative">
                                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="Seu e-mail para pagamento"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#2C2C2E] text-white placeholder-gray-500 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <button
                                onClick={handleSaveEmail}
                                disabled={isSavingEmail}
                                className="w-full bg-purple-600 text-white font-bold py-3 rounded-full hover:bg-purple-700 transition-colors disabled:bg-gray-700 flex justify-center items-center"
                            >
                                {isSavingEmail ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : "Salvar E-mail"}
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center space-x-3 bg-[#2C2C2E] p-3 rounded-lg">
                            <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                            <span className="text-white">{email}</span>
                        </div>
                    )}
                </div>

                <div className="bg-[#1c1c1e] p-4 rounded-lg">
                    <h2 className="font-semibold text-white mb-4 flex items-center space-x-2">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                        <span>Histórico de Saques</span>
                    </h2>

                    <div className="flex-shrink-0 mb-4 flex items-center justify-center space-x-2 sm:space-x-3">
                        <TabButton label="Todos" type="all" />
                        <TabButton label="Concluído" type="Concluído" />
                        <TabButton label="Pendente" type="Pendente" />
                        <TabButton label="Cancelado" type="Cancelado" />
                    </div>

                    {isLoadingHistory ? (
                        <div className="flex justify-center py-4"><LoadingSpinner /></div>
                    ) : history.length > 0 ? (
                        <div className="divide-y divide-gray-700/50">
                            {history.map(item => <HistoryItem key={item.id} item={item} />)}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">Nenhum saque encontrado para este filtro.</p>
                    )}
                </div>
            </main>
            
            <footer className="p-4 flex-shrink-0 border-t border-gray-800">
                <button
                    onClick={handleWithdraw}
                    disabled={isWithdrawing || isEditingEmail || !currentUser.platformEarnings || currentUser.platformEarnings <= 0}
                    className="w-full bg-green-600 text-white font-bold py-4 rounded-full text-lg hover:bg-green-700 transition-all duration-300 button-glow disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                     {isWithdrawing ? "Processando..." : `Sacar ${formatCurrency(currentUser.platformEarnings)}`}
                </button>
            </footer>
        </div>
    );
};

export default AdminWalletScreen;