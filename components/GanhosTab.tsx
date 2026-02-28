import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRightIcon } from './icons';
import { useTranslation } from '../i18n';
import { User, ToastType } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';
import GanhosDisplay from './GanhosDisplay';

interface GanhosTabProps {
    onConfigure: () => void;
    currentUser: User;
    updateUser: (user: User) => void;
    addToast: (type: ToastType, message: string) => void;
}

const GanhosTab: React.FC<GanhosTabProps> = ({ onConfigure, currentUser, updateUser, addToast }) => {
    const { t } = useTranslation();
    const [earningsInfo, setEarningsInfo] = useState<{ available_diamonds: number; gross_brl: number; platform_fee_brl: number; net_brl: number } | null>(null);
    const [withdrawAmount, setWithdrawAmount] = useState<string>('');
    const [calculation, setCalculation] = useState<{ gross_value: number; platform_fee: number; net_value: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

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
        <div className="space-y-6">
            <GanhosDisplay earnings={earningsInfo?.available_diamonds || 0} />
            
            <div className="space-y-3">
                <label htmlFor="withdraw-amount" className="text-sm text-gray-300">{t('wallet.withdrawValue')}</label>
                <div className="flex items-center space-x-2">
                    <input
                        id="withdraw-amount"
                        type="number"
                        placeholder={t('wallet.withdrawPlaceholder')}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="flex-grow bg-[#2C2C2E] text-white placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button onClick={handleMaxClick} className="bg-purple-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                        {t('common.max')}
                    </button>
                </div>
            </div>

            <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">{t('wallet.grossValue')}</span>
                    <span className="text-white">{isCalculating && withdrawAmount ? '...' : formatCurrency(displayData.gross_value)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">{t('wallet.platformFee')}</span>
                    <span className="text-gray-400">- {isCalculating && withdrawAmount ? '...' : formatCurrency(displayData.platform_fee)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-base">
                    <span className="text-white">{t('wallet.netValue')}</span>
                    <span className="text-green-500">{isCalculating && withdrawAmount ? '...' : formatCurrency(displayData.net_value)}</span>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-sm text-gray-300">{t('wallet.withdrawMethod')}</h3>
                <button onClick={onConfigure} className="w-full flex justify-between items-center bg-[#2C2C2E] p-4 rounded-lg hover:bg-gray-700/50 transition-colors">
                    <span className="text-white">
                        {currentUser.withdrawal_method ? `${currentUser.withdrawal_method.method.toUpperCase()}: ${Object.values(currentUser.withdrawal_method.details)[0]}` : t('wallet.configureMethod')}
                    </span>
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                </button>
                <p className="text-xs text-gray-500 text-center">{t('wallet.valueSentTo')}</p>
            </div>

            <div className="pt-4">
                <button
                    onClick={handleConfirmWithdraw}
                    disabled={isWithdrawButtonDisabled}
                    className="w-full bg-purple-600 text-white font-bold py-4 rounded-full transition-colors disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    {isWithdrawing ? "Processando..." : t('wallet.confirmWithdraw')}
                </button>
            </div>
        </div>
    );
};

export default GanhosTab;