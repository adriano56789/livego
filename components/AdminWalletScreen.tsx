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

const HistoryItem: React.FC<{ item: PurchaseRecord }> = ({ item }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    
    return (
        <div 
            className={`flex justify-between items-start py-3 px-1 sm:px-2 rounded-lg transition-colors ${isHovered ? 'bg-[#2a2a2d]' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex-1 min-w-0 pr-3">
                <p className="font-semibold text-white text-sm sm:text-base truncate">{item.description}</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                    {new Date(item.timestamp).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="font-bold text-base sm:text-lg text-white">{formatCurrency(item.amountBRL)}</p>
                <div className="flex items-center justify-end space-x-1.5 mt-1">
                    <StatusIcon status={item.status} />
                    <StatusBadge status={item.status} />
                </div>
            </div>
        </div>
    );
};

const BalanceDisplay: React.FC<{ earnings: number | undefined }> = ({ earnings = 0 }) => (
    <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-4 sm:p-5 rounded-xl shadow-lg">
        <p className="text-xs sm:text-sm text-white/80 mb-1">Saldo Disponível</p>
        <div className="flex items-end justify-between">
            <div>
                <p className="text-2xl sm:text-3xl font-bold text-white">{formatCurrency(earnings)}</p>
                <p className="text-xs text-white/80 mt-1">Saque disponível</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1.5 sm:p-2">
                <BankIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
        </div>
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
            className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
              isActive ? 'bg-purple-600 text-white' : 'bg-[#2C2C2E] text-gray-300 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#111] z-50 flex flex-col text-white h-screen">
            <header className="flex items-center p-3 sm:p-4 border-b border-gray-800 flex-shrink-0 sticky top-0 bg-[#111]/95 backdrop-blur-sm z-10">
                <button onClick={onClose} className="p-1 sm:p-2 -ml-1 sm:-ml-2">
                    <BackIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <div className="flex-grow flex items-center justify-center space-x-2 sm:space-x-3">
                    <img 
                        src={currentUser.avatarUrl} 
                        alt={currentUser.name} 
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" 
                    />
                    <h1 className="text-base sm:text-lg font-semibold">Admin LiveGo</h1>
                </div>
                <div className="w-6 sm:w-8" /> {/* Spacer para alinhamento */}
            </header>

            <main className="flex-1 p-3 sm:p-4 space-y-4 sm:space-y-6 overflow-hidden flex flex-col">
                <div className="px-1 sm:px-0">
                    <BalanceDisplay earnings={currentUser.platformEarnings} />
                </div>

                <div className="bg-[#1c1c1e] p-3 sm:p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                         <h2 className="font-semibold text-white text-sm sm:text-base">Método de Saque</h2>
                         {!isEditingEmail && (
                            <button 
                                onClick={() => setIsEditingEmail(true)} 
                                className="flex items-center space-x-1 text-purple-400 text-xs sm:text-sm font-semibold hover:bg-purple-900/30 px-2 py-1 rounded-lg transition-colors"
                            >
                                <PencilIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span>Editar</span>
                            </button>
                         )}
                    </div>

                    {isEditingEmail ? (
                        <div className="space-y-3">
                            <div className="relative">
                                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="Seu e-mail para pagamento"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#2C2C2E] text-white text-sm sm:text-base placeholder-gray-500 rounded-lg py-2.5 sm:py-3 pl-9 sm:pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setIsEditingEmail(false)}
                                    className="flex-1 bg-gray-700 text-white font-medium py-2.5 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEmail}
                                    disabled={isSavingEmail}
                                    className="flex-1 bg-purple-600 text-white font-medium py-2.5 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-700 flex justify-center items-center"
                                >
                                    {isSavingEmail ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                    ) : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-3 bg-[#2C2C2E] p-3 rounded-lg">
                            <EnvelopeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                            <span className="text-white text-sm sm:text-base break-all">{email || 'Nenhum e-mail cadastrado'}</span>
                        </div>
                    )}
                </div>

                <div className="bg-[#1c1c1e] p-3 sm:p-4 rounded-xl flex-1 flex flex-col">
                    <div className="flex-shrink-0">
                        <h2 className="font-semibold text-white mb-3 sm:mb-4 flex items-center space-x-2">
                            <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                            <span className="text-sm sm:text-base">Histórico de Saques</span>
                        </h2>

                        <div className="flex-shrink-0 mb-3 sm:mb-4 overflow-x-auto pb-2 -mx-1 px-1">
                            <div className="flex space-x-1.5 sm:space-x-2 w-max min-w-full">
                                <TabButton label="Todos" type="all" />
                                <TabButton label="Concluído" type="Concluído" />
                                <TabButton label="Pendente" type="Pendente" />
                                <TabButton label="Cancelado" type="Cancelado" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {isLoadingHistory ? (
                            <div className="flex justify-center py-4 h-full items-center">
                                <LoadingSpinner />
                            </div>
                        ) : history.length > 0 ? (
                            <div className="divide-y divide-gray-700/50 -mx-2 sm:mx-0">
                                {history.slice(0, 3).map(item => (
                                    <div key={item.id} className="px-2 sm:px-0">
                                        <HistoryItem item={item} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-sm text-gray-400">Nenhum saque encontrado para este filtro.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            
            <footer className="p-3 sm:p-4 border-t border-gray-800 bg-[#111]">
                <button
                    onClick={handleWithdraw}
                    disabled={isWithdrawing || isEditingEmail || !currentUser.platformEarnings || currentUser.platformEarnings <= 0}
                    className="w-full bg-green-600 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-full text-base sm:text-lg hover:bg-green-700 transition-all duration-300 button-glow disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    {isWithdrawing ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            <span>Processando...</span>
                        </>
                    ) : (
                        <>
                            <span>Sacar</span>
                            <span className="font-mono">{formatCurrency(currentUser.platformEarnings)}</span>
                        </>
                    )}
                </button>
            </footer>
        </div>
    );
};

export default AdminWalletScreen;