import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRightIcon } from './icons';
import { useTranslation } from '../i18n';
import { User, ToastType } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';
import GanhosDisplay from './GanhosDisplay';
import { safeError } from '../utils/maskSensitiveData';
import ConfirmWithdrawalScreen from '../ConfirmWithdrawalScreen';

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
    const [showConfirmation, setShowConfirmation] = useState(false);

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
    useEffect(() => {
        fetchEarningsInfo();
    }, [fetchEarningsInfo]);

    // Calculate withdrawal value in real-time as user types
    useEffect(() => {
        const amount = parseInt(withdrawAmount);
        
        // ⚠️ NÃO processa vazio ou inválido
        if (!withdrawAmount || isNaN(amount) || amount <= 0) {
            return;
        }

        setIsCalculating(true);
        api.calculateWithdrawal(amount)
            .then((result) => {
                setCalculation(result);
            })
            .catch((error) => {
                // ⚠️ NÃO limpa estado em caso de erro
                safeError('[GanhosTab] Erro ao calcular saque:', error);
            })
            .finally(() => setIsCalculating(false));
    }, [withdrawAmount]);

    const handleMaxClick = () => {
        if (earningsInfo) {
            setWithdrawAmount(earningsInfo.available_diamonds.toString());
        }
    };

    const handleConfirmWithdraw = () => {
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

        if (!calculation) {
            addToast(ToastType.Error, "Aguarde o cálculo dos valores.");
            return;
        }

        // Mostrar modal de confirmação
        setShowConfirmation(true);
    };

    const handleWithdrawalConfirmed = async (withdrawalDetails: { diamonds: number; gross_brl: number; platform_fee_brl: number; net_brl: number; method: string; methodDetails: string }) => {
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

            // Log seguro - sem exibir chave PIX completa
            const maskedPixKey = pixKey.includes('@') 
                ? `*********@${pixKey.substring(pixKey.indexOf('@') + 1)}`
                : pixKey.length > 4 
                    ? pixKey.substring(0, 2) + '*'.repeat(pixKey.length - 4) + pixKey.substring(pixKey.length - 2)
                    : '***';
            
            console.log(`[GanhosTab] Iniciando saque via Pix para chave mascarada: ${maskedPixKey}`);
            const response = await api.withdrawViaPix(currentUser.id, withdrawalDetails.diamonds, pixKey, pixKeyType);
            
            if (response.success) {
                addToast(ToastType.Success, 
                    `Saque de R$ ${withdrawalDetails.net_brl.toFixed(2)} iniciado! ` +
                    `O dinheiro será transferido em até 1 dia útil. ` +
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
                setShowConfirmation(false);
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
    
    // Se temos calculation, usar os valores reais da API
    if (calculation) {
        displayData.gross_brl = calculation.gross_brl;
        displayData.platform_fee_brl = calculation.platform_fee_brl;
        displayData.net_brl = calculation.net_brl;
        displayData.breakdown = calculation.breakdown;
    }
    
    // Verificar se está carregando para mostrar valores corretos
    const isLoadingCalculation = isCalculating && withdrawAmount && !isNaN(parseInt(withdrawAmount)) && parseInt(withdrawAmount) > 0;
    
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
                            <span className="text-white">{isLoadingCalculation ? '...' : formatCurrency(displayData.gross_brl)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">{t('wallet.platformFee')}</span>
                            <span className="text-gray-400">- {isLoadingCalculation ? '...' : formatCurrency(displayData.platform_fee_brl)}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-base">
                            <span className="text-white">{t('wallet.netValue')}</span>
                            <span className="text-green-500">{isLoadingCalculation ? '...' : formatCurrency(displayData.net_brl)}</span>
                        </div>
                    </>
                )}
            </div>

            <div className="space-y-3">
                <h3 className="text-sm text-gray-300">{t('wallet.withdrawMethod')}</h3>
                <button onClick={onConfigure} className="w-full flex justify-between items-center bg-[#2C2C2E] p-4 rounded-lg hover:bg-gray-700/50 transition-colors">
                    <span className="text-white">
                        {(earningsInfo?.withdrawal_method || currentUser.withdrawal_method) ? 
                            (() => {
                                const method = (earningsInfo?.withdrawal_method || currentUser.withdrawal_method);
                                const methodName = method.method.toUpperCase();
                                let maskedDetails = '';
                                
                                if (method.method === 'mercado_pago' && method.details.email) {
                                    // Mascarar email do Mercado Pago
                                    const email = method.details.email;
                                    const emailMatch = email.match(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+)/);
                                    if (emailMatch) {
                                        const domain = emailMatch[2];
                                        maskedDetails = `*********@${domain}`;
                                    } else {
                                        maskedDetails = '***';
                                    }
                                } else if (method.method === 'pix' && method.details.pixKey) {
                                    // Mascarar chave PIX
                                    const pixKey = method.details.pixKey;
                                    if (pixKey.includes('@')) {
                                        // Email PIX
                                        const emailMatch = pixKey.match(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+)/);
                                        if (emailMatch) {
                                            const domain = emailMatch[2];
                                            maskedDetails = `*********@${domain}`;
                                        } else {
                                            maskedDetails = '***';
                                        }
                                    } else if (pixKey.length > 4) {
                                        // CPF, telefone, etc
                                        maskedDetails = pixKey.substring(0, 2) + '*'.repeat(pixKey.length - 4) + pixKey.substring(pixKey.length - 2);
                                    } else {
                                        maskedDetails = '***';
                                    }
                                }
                                
                                return `${methodName}: ${maskedDetails}`;
                            })()
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

            {/* Modal de Confirmação de Saque */}
            {showConfirmation && calculation && (
                <ConfirmWithdrawalScreen
                    onClose={() => setShowConfirmation(false)}
                    withdrawalDetails={{
                        diamonds: calculation.diamonds,
                        gross_brl: calculation.gross_brl,
                        platform_fee_brl: calculation.platform_fee_brl,
                        net_brl: calculation.net_brl,
                        method: (earningsInfo?.withdrawal_method || currentUser.withdrawal_method)?.method || 'pix',
                        methodDetails: (() => {
                            const method = earningsInfo?.withdrawal_method || currentUser.withdrawal_method;
                            if (method?.method === 'pix' && method.details.pixKey) {
                                const pixKey = method.details.pixKey;
                                if (pixKey.includes('@')) {
                                    const emailMatch = pixKey.match(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+)/);
                                    if (emailMatch) {
                                        const domain = emailMatch[2];
                                        return `*********@${domain}`;
                                    }
                                } else if (pixKey.length > 4) {
                                    return pixKey.substring(0, 2) + '*'.repeat(pixKey.length - 4) + pixKey.substring(pixKey.length - 2);
                                }
                            }
                            return '***';
                        })()
                    }}
                    onConfirmWithdrawal={handleWithdrawalConfirmed}
                    isProcessing={isWithdrawing}
                    addToast={addToast}
                />
            )}
        </div>
    );
};

export default GanhosTab;