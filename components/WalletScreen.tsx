
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeftIcon, MoreIcon, SolidDiamondIcon, CheckIcon, PixIcon, MercadoPagoIcon, BankIcon, ChevronRightIcon, YellowDiamondIcon } from './icons';
import { User, PurchaseRecord, ToastType } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';
import ConfirmPurchaseScreen from './ConfirmPurchaseScreen';

interface WalletScreenProps {
    onClose: () => void;
    initialTab?: 'Diamante' | 'Ganhos';
    isBroadcaster?: boolean;
    currentUser?: User | null;
    updateUser?: any;
    addToast?: (type: ToastType, message: string) => void;
    purchaseHistory?: PurchaseRecord[];
    onPurchase?: (pkg: { diamonds: number; price: number }) => void;
}

const useCountUp = (end: number, duration = 1000) => {
    const [count, setCount] = useState(0);
    const frameRef = useRef(0);
    const startCountRef = useRef(0);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            setCount(end);
            startCountRef.current = end;
            isFirstRender.current = false;
            return;
        }

        const startCount = startCountRef.current;
        const range = end - startCount;
        let startTime: number | null = null;

        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(startCount + range * progress));

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(step);
            } else {
                startCountRef.current = end;
            }
        };

        frameRef.current = requestAnimationFrame(step);

        return () => cancelAnimationFrame(frameRef.current);
    }, [end, duration]);

    return count;
};

const WalletScreen: React.FC<WalletScreenProps> = ({ onClose, initialTab = 'Diamante', currentUser, updateUser, addToast }) => {
    const [currentView, setCurrentView] = useState<'wallet' | 'history' | 'withdraw_method'>('wallet');
    const [activeTab, setActiveTab] = useState<'Diamante' | 'Ganhos'>(initialTab);
    const [historyFilter, setHistoryFilter] = useState('Todos'); 
    const [selectedMethod, setSelectedMethod] = useState<'pix' | 'mercadopago'>('pix');
    const [pixKey, setPixKey] = useState('');

    // Purchase State
    const [isConfirmingPurchase, setIsConfirmingPurchase] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<{ diamonds: number; price: number } | null>(null);
    const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    // Earnings State
    const [earningsInfo, setEarningsInfo] = useState<{ available_diamonds: number; gross_brl: number; platform_fee_brl: number; net_brl: number } | null>(null);
    const [withdrawAmount, setWithdrawAmount] = useState<string>('');
    const [calculation, setCalculation] = useState<{ gross_value: number; platform_fee: number; net_value: number } | null>(null);
    const [isEarningsLoading, setIsEarningsLoading] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const formattedEarnings = useCountUp(earningsInfo?.available_diamonds || 0);

    const fetchEarningsInfo = useCallback(async () => {
        if (!currentUser) return;
        setIsEarningsLoading(true);
        try {
            const walletData = await api.diamonds.getBalance(currentUser.id);
            if (walletData && walletData.userEarnings) {
                setEarningsInfo(walletData.userEarnings);
            } else {
                setEarningsInfo({ available_diamonds: 0, gross_brl: 0, platform_fee_brl: 0, net_brl: 0 });
            }
        } catch (err) {
            if (addToast) addToast(ToastType.Error, (err as Error).message || "Falha ao carregar informações de ganhos.");
        } finally {
            setIsEarningsLoading(false);
        }
    }, [currentUser, addToast]);

    useEffect(() => {
        if (activeTab === 'Ganhos') {
            fetchEarningsInfo();
        }
    }, [activeTab, fetchEarningsInfo, currentUser?.earnings]);

    useEffect(() => {
        if (currentUser?.withdrawal_method) {
            const method = currentUser.withdrawal_method.method;
            const details = currentUser.withdrawal_method.details;
            setSelectedMethod(method === 'mercadopago' ? 'mercadopago' : 'pix');
            setPixKey(details?.email || '');
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentView === 'history') {
            const fetchHistory = async () => {
                setIsHistoryLoading(true);
                try {
                    const data = await api.users.getWithdrawalHistory(historyFilter);
                    setPurchaseHistory(data || []);
                } catch (error) {
                    if (addToast) addToast(ToastType.Error, "Falha ao carregar histórico.");
                    setPurchaseHistory([]);
                } finally {
                    setIsHistoryLoading(false);
                }
            };
            fetchHistory();
        }
    }, [currentView, historyFilter, addToast]);

    useEffect(() => {
        const amount = parseInt(withdrawAmount);
        if (!isNaN(amount) && amount > 0) {
            setIsCalculating(true);
            const timer = setTimeout(() => {
                api.earnings.withdraw.calculate(amount)
                    .then(setCalculation)
                    .catch(() => setCalculation(null))
                    .finally(() => setIsCalculating(false));
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setCalculation(null);
        }
    }, [withdrawAmount]);

    const handleMaxClick = () => {
        if (earningsInfo) {
            setWithdrawAmount(earningsInfo.available_diamonds.toString());
        }
    };

    const handleConfirmWithdraw = async () => {
        if (!currentUser) return;
        
        const amount = parseInt(withdrawAmount);
        if (isNaN(amount) || amount <= 0 || !earningsInfo || amount > earningsInfo.available_diamonds) {
            if (addToast) addToast(ToastType.Error, "Valor de saque inválido.");
            return;
        }

        if (!currentUser.withdrawal_method) {
            if (addToast) addToast(ToastType.Error, "Configure um método de saque primeiro.");
            setCurrentView('withdraw_method');
            return;
        }

        setIsWithdrawing(true);
        try {
            const { success, message } = await api.earnings.withdraw.request(amount, currentUser.withdrawal_method);
            if (success) {
                if (addToast) addToast(ToastType.Info, message || "Solicitação de saque enviada.");
                
                const updatedUser = await api.users.me();
                if(updatedUser) updateUser(updatedUser);

                setWithdrawAmount('');
                setCalculation(null);
                fetchEarningsInfo(); 
            } else {
                throw new Error("Falha na solicitação de saque.");
            }
        } catch (error) {
            if (addToast) addToast(ToastType.Error, (error as Error).message || "Falha na solicitação de saque.");
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleSaveWithdrawalMethod = async () => {
        if (!currentUser) return;
        try {
            const { success, user } = await api.earnings.withdraw.methods.update(selectedMethod, { key: pixKey });
            if (success && user) {
                updateUser(user);
                setCurrentView('wallet');
                if (addToast) addToast(ToastType.Success, "Método de saque salvo com sucesso!");
            }
        } catch (error) {
            if (addToast) addToast(ToastType.Error, "Erro ao salvar método.");
        }
    };

    const handlePackageSelect = (pkg: { diamonds: number; price: number }) => {
        setSelectedPackage(pkg);
        setIsConfirmingPurchase(true);
    };

    const handlePurchaseComplete = async () => {
        if (!selectedPackage || !currentUser) return;
        
        try {
            const { success, user } = await api.diamonds.purchase(currentUser.id, selectedPackage.diamonds, selectedPackage.price);
            if (success && user) {
                updateUser(user);
                if (addToast) addToast(ToastType.Success, `Sucesso! +${selectedPackage.diamonds} diamantes adicionados.`);
                setIsConfirmingPurchase(false);
                setSelectedPackage(null);
            }
        } catch (error) {
            if (addToast) addToast(ToastType.Error, "Falha na compra. Tente novamente.");
        }
    };

    const formatCurrency = (value: number | undefined) => {
        const numValue = Number(value || 0);
        return numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const displayData = calculation || {
        gross_value: earningsInfo?.gross_brl || 0,
        platform_fee: earningsInfo?.platform_fee_brl || 0,
        net_value: earningsInfo?.net_brl || 0
    };
    
    const isWithdrawButtonDisabled = isWithdrawing || isCalculating || !calculation || calculation.net_value <= 0;

    const diamondOptions = [
        { diamonds: 800, price: 7.00 },
        { diamonds: 3000, price: 25.00 },
        { diamonds: 6000, price: 60.00 },
        { diamonds: 20000, price: 180.00 },
        { diamonds: 36000, price: 350.00 },
        { diamonds: 65000, price: 600.00 },
    ];

    const historyTabs = ['Todos', 'Concluído', 'Pendente', 'Cancelado'];

    if (isConfirmingPurchase && selectedPackage) {
        return (
            <ConfirmPurchaseScreen 
                packageDetails={selectedPackage}
                onConfirm={handlePurchaseComplete}
                onCancel={() => { setIsConfirmingPurchase(false); setSelectedPackage(null); }}
                addToast={addToast}
            />
        );
    }

    if (currentView === 'withdraw_method') {
        return (
            <div className="fixed inset-0 bg-[#0A0A0A] z-[120] flex flex-col font-sans">
                <div className="flex items-center p-4 border-b border-gray-800">
                    <button onClick={() => setCurrentView('wallet')} className="p-1 mr-2">
                        <ChevronLeftIcon className="text-white w-6 h-6" />
                    </button>
                    <h2 className="text-white text-lg font-bold">Configurar Método de Saque</h2>
                </div>
                
                <div className="p-4 flex-1">
                    <p className="text-gray-400 text-sm mb-4">Selecione como você gostaria de receber seu dinheiro.</p>
                    
                    <div className="flex gap-4 mb-6">
                        <button 
                            onClick={() => setSelectedMethod('pix')}
                            className={`flex-1 relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                selectedMethod === 'pix' 
                                ? 'border-[#00C853] bg-[#00C853]/10' 
                                : 'border-gray-700 bg-[#1C1C1E]'
                            }`}
                        >
                            {selectedMethod === 'pix' && (
                                <div className="absolute top-2 right-2 w-4 h-4 bg-[#00C853] rounded-full flex items-center justify-center">
                                    <CheckIcon className="w-3 h-3 text-black" />
                                </div>
                            )}
                            <div className="w-12 h-12 flex items-center justify-center"><PixIcon className="w-12 h-12" /></div>
                            <span className="text-white font-bold text-sm">PIX</span>
                        </button>

                        <button 
                            onClick={() => setSelectedMethod('mercadopago')}
                            className={`flex-1 relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                selectedMethod === 'mercadopago' 
                                ? 'border-[#009EE3] bg-[#009EE3]/10' 
                                : 'border-gray-700 bg-[#1C1C1E]'
                            }`}
                        >
                            {selectedMethod === 'mercadopago' && (
                                <div className="absolute top-2 right-2 w-4 h-4 bg-[#009EE3] rounded-full flex items-center justify-center">
                                    <CheckIcon className="w-3 h-3 text-white" />
                                </div>
                            )}
                            <div className="w-12 h-12 flex items-center justify-center"><MercadoPagoIcon className="w-12 h-12" /></div>
                            <span className="text-white font-bold text-sm">Mercado Pago</span>
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-gray-400 text-xs font-bold">Chave PIX</label>
                        <input 
                            type="text" 
                            value={pixKey}
                            onChange={(e) => setPixKey(e.target.value)}
                            className="w-full bg-[#E8F0FE] text-black p-3 rounded-lg outline-none border-none font-medium text-sm"
                            placeholder="Digite sua chave PIX"
                        />
                    </div>
                </div>

                <div className="p-4">
                    <button 
                        onClick={handleSaveWithdrawalMethod}
                        className="w-full bg-[#00C853] hover:bg-[#00a846] text-white font-bold py-3.5 rounded-full transition-colors"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        );
    }

    if (currentView === 'history') {
        return (
            <div className="fixed inset-0 bg-[#0A0A0A] z-[120] flex flex-col font-sans">
                <div className="flex items-center justify-between p-4 bg-[#0A0A0A]">
                    <button onClick={() => setCurrentView('wallet')} className="p-1">
                        <ChevronLeftIcon className="text-white w-6 h-6" />
                    </button>
                    <h2 className="text-white text-lg font-bold">Histórico de Transações</h2>
                    <div className="w-6" />
                </div>
                <div className="px-4 mb-4">
                    <div className="flex space-x-2 overflow-x-auto no-scrollbar">
                        {historyTabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setHistoryFilter(tab)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                                    historyFilter === tab 
                                    ? 'bg-[#A855F7] text-white' 
                                    : 'bg-[#1C1C1E] text-gray-400 hover:bg-gray-800'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4">
                    {isHistoryLoading ? (
                        <div className="flex justify-center mt-20"><LoadingSpinner /></div>
                    ) : purchaseHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                             <p className="text-sm">Nenhum registro encontrado para "{historyFilter}".</p>
                        </div>
                    ) : (
                        <div className="space-y-3 pb-4">
                            {purchaseHistory.map(item => (
                                <div key={item.id} className="bg-[#1C1C1E] p-3 rounded-lg flex justify-between items-center border border-white/5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-white text-sm font-bold">{item.description || "Transação"}</span>
                                        <span className="text-gray-500 text-[10px]">{formatDate(item.timestamp)}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`font-bold text-sm ${item.type === 'withdrawal' ? 'text-red-400' : 'text-green-400'}`}>
                                            {item.type === 'withdrawal' ? '-' : '+'} {formatCurrency(item.amountBRL)}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase ${
                                            item.status === 'Concluído' ? 'text-green-500' :
                                            item.status === 'Pendente' ? 'text-yellow-500' :
                                            'text-red-500'
                                        }`}>{item.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#0A0A0A] z-[120] flex flex-col font-sans animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 bg-[#0A0A0A] shrink-0">
                <button onClick={onClose}>
                    <ChevronLeftIcon className="text-white w-6 h-6" />
                </button>
                <div className="flex space-x-6">
                    <button 
                        onClick={() => setActiveTab('Diamante')}
                        className={`text-lg font-bold pb-1 relative ${activeTab === 'Diamante' ? 'text-white' : 'text-gray-500'}`}
                    >
                        Diamante
                        {activeTab === 'Diamante' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('Ganhos')}
                        className={`text-lg font-bold pb-1 relative ${activeTab === 'Ganhos' ? 'text-white' : 'text-gray-500'}`}
                    >
                        Ganhos
                         {activeTab === 'Ganhos' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>}
                    </button>
                </div>
                <button onClick={() => setCurrentView('history')}>
                    <MoreIcon className="text-white w-6 h-6" />
                </button>
            </div>

            <div className={`flex-1 p-4 bg-[#0A0A0A] overflow-y-auto no-scrollbar`}>
                {activeTab === 'Diamante' ? (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-[#181825] to-[#0d0d14] rounded-2xl p-6 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
                            
                            <p className="text-gray-400 text-sm mb-1">Meus diamantes</p>
                            <div className="flex items-center gap-3">
                                <SolidDiamondIcon className="w-8 h-8 text-[#FFC107]" />
                                <span className="text-4xl font-bold text-white tracking-wide">
                                    {(currentUser?.diamonds || 0).toLocaleString('pt-BR')}
                                </span>
                            </div>
                            <div className="absolute bottom-4 right-4 text-gray-500 text-xs font-semibold">
                                diamantes
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {diamondOptions.map((opt, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => handlePackageSelect(opt)}
                                    className="bg-[#1C1C1E] rounded-xl p-4 flex flex-col items-center justify-center hover:bg-[#2C2C2E] transition-colors cursor-pointer border border-white/5"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <SolidDiamondIcon className="w-5 h-5 text-[#FFC107]" />
                                        <span className="text-white font-bold text-lg">{opt.diamonds.toLocaleString('pt-BR')}</span>
                                    </div>
                                    <div className="text-gray-400 text-sm">
                                        {opt.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    isEarningsLoading ? (
                        <div className="flex justify-center py-20"><LoadingSpinner /></div>
                    ) : (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-[#104a9b] to-[#051c36] rounded-2xl p-6 shadow-lg relative overflow-hidden border border-white/5 aspect-[1.9/1] flex flex-col justify-between">
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
                                backgroundSize: '12px 12px',
                                opacity: 0.4
                            }}></div>
                            
                            <div className="absolute -right-10 top-0 w-40 h-full bg-gradient-to-l from-blue-500/20 to-transparent transform skew-x-12 blur-xl"></div>

                            <div className="z-10 mt-2">
                                <p className="text-white/90 text-sm font-light tracking-wide">Disponível para saque</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <YellowDiamondIcon className="w-12 h-12 drop-shadow-md" />
                                    <span className="text-[3.5rem] leading-none font-bold text-white tracking-tight drop-shadow-sm">
                                        {(formattedEarnings || 0).toLocaleString('pt-BR')}
                                    </span>
                                </div>
                            </div>
                            <div className="z-10 text-right">
                                <p className="text-white/60 text-sm font-normal tracking-wide">ganhos</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-300 ml-1 font-medium">Valor do Saque</label>
                            <div className="flex gap-3 h-12">
                                <div className="flex-grow bg-[#252528] rounded-lg border border-white/10 flex items-center px-4 transition-colors focus-within:border-purple-500/50">
                                    <input
                                        type="number"
                                        placeholder="Quantidade de ganhos"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-base"
                                    />
                                </div>
                                <button 
                                    onClick={handleMaxClick} 
                                    className="bg-[#8B5CF6] text-white font-bold px-6 rounded-lg text-sm tracking-wide hover:bg-[#7c3aed] transition-colors shadow-lg shadow-purple-900/20"
                                >
                                    MÁXIMO
                                </button>
                            </div>
                            {withdrawAmount && !isNaN(Number(withdrawAmount)) && (
                                <div className="text-sm text-gray-400 mt-1">
                                    Valor Bruto: {formatCurrency(calculation?.gross_value)}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Total Solicitado (Ganhos)</span>
                                <span className="text-white font-medium">{withdrawAmount ? Number(withdrawAmount).toLocaleString('pt-BR') : '0'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Taxa da Plataforma (20%)</span>
                                <span className="text-red-400">- {isCalculating && withdrawAmount ? '...' : formatCurrency(displayData.platform_fee)}</span>
                            </div>
                            <div className="flex justify-between items-center text-base pt-2 border-t border-white/10">
                                <span className="text-white font-bold">Valor Líquido a Receber (80%):</span>
                                <span className="font-bold text-[#22c55e]">{isCalculating && withdrawAmount ? '...' : formatCurrency(displayData.net_value)}</span>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-sm text-gray-300 ml-1 font-medium">Método de Saque</label>
                            <button 
                                onClick={() => setCurrentView('withdraw_method')}
                                className="w-full flex justify-between items-center bg-[#252528] border border-white/10 p-4 rounded-xl hover:bg-[#2c2c2f] transition-colors h-14"
                            >
                                <span className="text-white text-base">
                                    {currentUser?.withdrawal_method ? `${currentUser.withdrawal_method.method.toUpperCase()}: ${Object.values(currentUser.withdrawal_method.details)[0]}` : "Configurar Método"}
                                </span>
                                <ChevronRightIcon className="w-5 h-5 text-[#10b981]" />
                            </button>
                        </div>
                        
                        <p className="mt-4 text-center text-xs text-gray-500">O valor líquido será enviado para sua conta cadastrada.</p>

                         <button
                            onClick={handleConfirmWithdraw}
                            disabled={isWithdrawButtonDisabled}
                            className="w-full bg-gradient-to-r from-[#9333ea] to-[#3b82f6] h-14 rounded-full text-white font-bold text-lg shadow-lg shadow-purple-900/30 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {isWithdrawing ? "Processando..." : "Confirmar Saque"}
                        </button>
                    </div>
                    )
                )}
            </div>
        </div>
    );
};

export default WalletScreen;
