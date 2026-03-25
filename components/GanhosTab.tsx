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

interface EarningsInfo {
    available_diamonds: number;
    brl_value: number;
    conversion_rate: string;
    withdrawal_method?: any;
}

const GanhosTab: React.FC<GanhosTabProps> = ({ onConfigure, currentUser, updateUser, addToast }) => {
    const { t } = useTranslation();
    const [earningsInfo, setEarningsInfo] = useState<EarningsInfo | null>(null);
    const [withdrawAmount, setWithdrawAmount] = useState<string>('');
    const [calculation, setCalculation] = useState<{ diamonds: number; gross_brl: number; platform_fee_brl: number; net_brl: number; breakdown: { conversion: string; fee: string; final: string; } } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const fetchEarningsInfo = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getEarnings(currentUser.id);
            setEarningsInfo(data);
            
            // Se a API retornar withdrawal_method, atualizar o usuário
            if (data.withdrawal_method && !currentUser.withdrawal_method) {
                updateUser({ ...currentUser, withdrawal_method: data.withdrawal_method });
            }
        } catch (err) {
            addToast(ToastType.Error, (err as Error).message || "Falha ao carregar informações de ganhos.");
        } finally {
            setIsLoading(false);
        }
    }, [currentUser.id, currentUser, updateUser, addToast]);

    // Fetch on mount and when user's earnings change (e.g., received a gift)
    // 🔧 CORREÇÃO: Removido currentUser.earnings para evitar loop infinito
    useEffect(() => {
        fetchEarningsInfo();
    }, [fetchEarningsInfo]);

    // Calculate withdrawal value in real-time as user types
    useEffect(() => {
        const amount = parseInt(withdrawAmount);
        
        if (!isNaN(amount) && amount > 0) {
            setIsCalculating(true);
            const timer = setTimeout(() => {
                api.calculateWithdrawal(amount)
                    .then((result) => {
                        setCalculation(result);
                    })
                    .catch((error) => {
                        setCalculation(null);
                    })
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
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0 || !earningsInfo || amount > earningsInfo.available_diamonds) {
            addToast(ToastType.Error, "Valor de saque inválido.");
            return;
        }

        if (!(earningsInfo?.withdrawal_method || currentUser.withdrawal_method)) {
            addToast(ToastType.Error, "Configure um método de saque primeiro.");
            onConfigure();
            return;
        }

        setIsWithdrawing(true);
        try {
            const withdrawalMethod = earningsInfo?.withdrawal_method || currentUser.withdrawal_method;
            
            // Extrair chave Pix e tipo do método configurado
            let pixKey = '';
            let pixKeyType = '';
            
            if (withdrawalMethod.method === 'pix') {
                pixKey = withdrawalMethod.details.pixKey;
                // Determinar tipo da chave Pix baseado no formato
                if (pixKey.includes('@')) {
                    pixKeyType = 'email';
                } else if (/^\d{11}$/.test(pixKey)) {
                    pixKeyType = 'cpf';
                } else if (/^\d{14}$/.test(pixKey)) {
                    pixKeyType = 'cnpj';
                } else if (pixKey.startsWith('+')) {
                    pixKeyType = 'phone';
                } else {
                    pixKeyType = 'evp'; // Chave aleatória
                }
            } else {
                addToast(ToastType.Error, "Método de saque não suportado. Use Pix.");
                return;
            }

            // Realizar saque via Pix (cash-out) do Mercado Pago
            const response = await api.withdrawViaPix(currentUser.id, amount, pixKey, pixKeyType);
            
            if (response.success) {
                addToast(ToastType.Success, 
                    `Saque de R$ ${amount.toFixed(2)} iniciado! ` +
                    `O dinheiro será transferido para ${pixKey} em até 1 dia útil. ` +
                    `ID da transferência: ${response.transferId}`
                );
                
                // Atualizar dados do usuário após saque
                const [freshUser, freshEarnings] = await Promise.all([
                    api.getCurrentUser(),
                    api.getEarnings(currentUser.id)
                ]);
                
                if (freshUser) {
                    updateUser(freshUser);
                }
                if (freshEarnings) {
                    setEarningsInfo(freshEarnings);
                }
                
                setWithdrawAmount('');
                setCalculation(null);
            } else {
                throw new Error(response.error || "Falha na solicitação de saque.");
            }
        } catch (error) {
            addToast(ToastType.Error, (error as Error).message || "Falha na solicitação de saque.");
        } finally {
            setIsWithdrawing(false);
        }
    };

    const formatCurrency = (value: number | undefined) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

    // Só mostrar displayData se houver cálculo ou se o usuário já digitou um valor válido
    const shouldShowCalculation = calculation || (withdrawAmount && !isNaN(parseInt(withdrawAmount)) && parseInt(withdrawAmount) > 0);
    
    const displayData = calculation || {
        diamonds: (parseInt(withdrawAmount) || earningsInfo?.available_diamonds) ?? 0,
        gross_brl: 0,
        platform_fee_brl: 0,
        net_brl: 0,
        breakdown: {
            conversion: `${(parseInt(withdrawAmount) || earningsInfo?.available_diamonds) ?? 0} diamantes = R$0.00`,
            fee: 'Taxa da plataforma (20%): R$0.00',
            final: 'Valor a receber: R$0.00'
        }
    };
    
    const isWithdrawButtonDisabled = isWithdrawing || isCalculating || !calculation || calculation.net_brl <= 0;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {(() => {
                const earningsValue = earningsInfo?.available_diamonds ?? currentUser?.earnings ?? 0;
                return <GanhosDisplay earnings={earningsValue} />;
            })()}
            
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
                {shouldShowCalculation && (
                    <>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">{t('wallet.grossValue')}</span>
                            <span className="text-white">{isCalculating && withdrawAmount ? '...' : formatCurrency(displayData.gross_brl)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">{t('wallet.platformFee')}</span>
                            <span className="text-gray-400">- {isCalculating && withdrawAmount ? '...' : formatCurrency(displayData.platform_fee_brl)}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-base">
                            <span className="text-white">{t('wallet.netValue')}</span>
                            <span className="text-green-500">{isCalculating && withdrawAmount ? '...' : formatCurrency(displayData.net_brl)}</span>
                        </div>
                    </>
                )}
            </div>

            <div className="space-y-3">
                <h3 className="text-sm text-gray-300">{t('wallet.withdrawMethod')}</h3>
                <button onClick={onConfigure} className="w-full flex justify-between items-center bg-[#2C2C2E] p-4 rounded-lg hover:bg-gray-700/50 transition-colors">
                    <span className="text-white">
                        {(earningsInfo?.withdrawal_method || currentUser.withdrawal_method) ? 
                            `${(earningsInfo?.withdrawal_method || currentUser.withdrawal_method).method.toUpperCase()}: ${(earningsInfo?.withdrawal_method || currentUser.withdrawal_method).method === 'mercado_pago' ? (earningsInfo?.withdrawal_method || currentUser.withdrawal_method).details.email : (earningsInfo?.withdrawal_method || currentUser.withdrawal_method).details.pixKey}` 
                            : t('wallet.configureMethod')
                        }
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