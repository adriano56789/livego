
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRightIcon, YellowDiamondIcon } from './icons';
import { useTranslation } from '../i18n';
import { User, ToastType } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';

interface GanhosTabProps {
    onConfigure: () => void;
    currentUser: User;
    updateUser: (user: User) => void;
    addToast: (type: ToastType, message: string) => void;
}

// Custom hook to animate number counting up
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

const GanhosTab: React.FC<GanhosTabProps> = ({ onConfigure, currentUser, updateUser, addToast }) => {
    const { t } = useTranslation();
    const [earningsInfo, setEarningsInfo] = useState<{ available_diamonds: number; gross_brl: number; platform_fee_brl: number; net_brl: number } | null>(null);
    const [withdrawAmount, setWithdrawAmount] = useState<string>('');
    const [calculation, setCalculation] = useState<{ gross_value: number; platform_fee: number; net_value: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const formattedEarnings = useCountUp(earningsInfo?.available_diamonds || 0);

    const fetchEarningsInfo = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getEarningsInfo(currentUser.id);
            setEarningsInfo(data);
        } catch (err) {
            addToast(ToastType.Error, (err as Error).message || "Falha ao carregar informações de ganhos.");
        } finally {
            setIsLoading(false);
        }
    }, [currentUser.id, addToast]);

    // Fetch on mount and when user's earnings change (e.g., received a gift)
    useEffect(() => {
        fetchEarningsInfo();
    }, [fetchEarningsInfo, currentUser.earnings]);

    // Calculate withdrawal value in real-time as user types
    useEffect(() => {
        const amount = parseInt(withdrawAmount);
        if (!isNaN(amount) && amount > 0) {
            setIsCalculating(true);
            const timer = setTimeout(() => {
                api.calculateWithdrawal(amount)
                    .then(setCalculation)
                    .catch(() => setCalculation(null))
                    .finally(() => setIsCalculating(false));
            }, 300); // Debounce
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
        const amount = parseInt(withdrawAmount);
        if (isNaN(amount) || amount <= 0 || !earningsInfo || amount > earningsInfo.available_diamonds) {
            addToast(ToastType.Error, "Valor de saque inválido.");
            return;
        }

        if (!currentUser.withdrawal_method) {
            addToast(ToastType.Error, "Configure um método de saque primeiro.");
            onConfigure();
            return;
        }

        setIsWithdrawing(true);
        try {
            const { success, user } = await api.confirmWithdrawal(currentUser.id, amount);
            if (success && user) {
                addToast(ToastType.Info, "Solicitação de saque enviada e está sendo processada.");
                updateUser(user); // Optimistically update user if needed, though WebSocket is preferred
                setWithdrawAmount('');
                setCalculation(null);
            } else {
                throw new Error("Falha na solicitação de saque.");
            }
        } catch (error) {
            addToast(ToastType.Error, (error as Error).message || "Falha na solicitação de saque.");
        } finally {
            setIsWithdrawing(false);
        }
    };

    const formatCurrency = (value: number | undefined) => `R$ ${(value || 0).toFixed(2).replace('.', ',')}`;

    const displayData = calculation || {
        gross_value: earningsInfo?.gross_brl || 0,
        platform_fee: earningsInfo?.platform_fee_brl || 0,
        net_value: earningsInfo?.net_brl || 0
    };
    
    const isWithdrawButtonDisabled = isWithdrawing || isCalculating || !calculation || calculation.net_value <= 0;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full px-2 pt-2 pb-6">
            {/* Main Card */}
            <div className="relative w-full aspect-[1.9/1] bg-gradient-to-r from-[#104a9b] to-[#051c36] rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-lg border border-white/5">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
                    backgroundSize: '12px 12px',
                    opacity: 0.4
                }}></div>
                
                {/* Glow Effect Right */}
                <div className="absolute -right-10 top-0 w-40 h-full bg-gradient-to-l from-blue-500/20 to-transparent transform skew-x-12 blur-xl"></div>
                <div className="absolute right-0 top-0 w-full h-full bg-gradient-to-bl from-blue-500/10 to-transparent"></div>

                <div className="z-10 mt-2">
                    <p className="text-white/90 text-sm font-light tracking-wide">Disponível para saque</p>
                    <div className="flex items-center gap-3 mt-1">
                        <YellowDiamondIcon className="w-12 h-12 drop-shadow-md" />
                        <span className="text-[3.5rem] leading-none font-bold text-white tracking-tight drop-shadow-sm">
                            {formattedEarnings.toLocaleString('pt-BR')}
                        </span>
                    </div>
                </div>
                <div className="z-10 text-right">
                    <p className="text-white/60 text-sm font-normal tracking-wide">ganhos</p>
                </div>
            </div>

            {/* Withdrawal Amount Input */}
            <div className="mt-8 space-y-2">
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
            </div>

            {/* Breakdown */}
            <div className="mt-6 space-y-3 px-1">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Valor Bruto (BRL)</span>
                    <span className="text-white font-medium">{isCalculating && withdrawAmount ? '...' : formatCurrency(displayData.gross_value)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Taxa da Plataforma (20%)</span>
                    <span className="text-gray-400">- {isCalculating && withdrawAmount ? '...' : formatCurrency(displayData.platform_fee)}</span>
                </div>
                <div className="flex justify-between items-center text-base pt-1">
                    <span className="text-white font-bold">Valor a Receber:</span>
                    <span className="text-[#22c55e] font-bold">{isCalculating && withdrawAmount ? '...' : formatCurrency(displayData.net_value)}</span>
                </div>
            </div>

            {/* Withdrawal Method */}
            <div className="mt-6 space-y-2">
                <label className="text-sm text-gray-300 ml-1 font-medium">Método de Saque</label>
                <button 
                    onClick={onConfigure} 
                    className="w-full flex justify-between items-center bg-[#252528] border border-white/10 p-4 rounded-xl hover:bg-[#2c2c2f] transition-colors h-14"
                >
                    <span className="text-white text-base">
                        {currentUser.withdrawal_method ? `${currentUser.withdrawal_method.method.toUpperCase()}: ${Object.values(currentUser.withdrawal_method.details)[0]}` : "Configurar Método"}
                    </span>
                    <ChevronRightIcon className="w-5 h-5 text-[#10b981]" />
                </button>
            </div>
            
            <p className="mt-4 text-center text-xs text-gray-500">O valor será enviado para sua conta cadastrada.</p>

            {/* Confirm Button */}
            <div className="mt-auto pt-6 pb-2">
                <button
                    onClick={handleConfirmWithdraw}
                    disabled={isWithdrawButtonDisabled}
                    className="w-full bg-gradient-to-r from-[#9333ea] to-[#3b82f6] h-14 rounded-full text-white font-bold text-lg shadow-lg shadow-purple-900/30 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isWithdrawing ? "Processando..." : "Confirmar Saque"}
                </button>
            </div>
        </div>
    );
};

export default GanhosTab;
