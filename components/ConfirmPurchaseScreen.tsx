
import React, { useState } from 'react';
import { ChevronLeftIcon, SolidDiamondIcon, BankIcon, LockIcon, EditIcon, CheckIcon } from './icons';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';
import { mercadoPagoService } from '../services/mercadopago';
import { ToastType } from '../types';

interface ConfirmPurchaseScreenProps {
    packageDetails: { diamonds: number; price: number };
    onConfirm: () => void;
    onCancel: () => void;
    addToast?: (type: ToastType, message: string) => void;
}

const MercadoPagoCheckout: React.FC<{
    packageDetails: { diamonds: number; price: number };
    paymentMethod: 'transfer' | 'card';
    onPay: () => Promise<void>;
    onCancelPayment: () => void;
}> = ({ packageDetails, paymentMethod, onPay, onCancelPayment }) => {
    const [isPaying, setIsPaying] = useState(false);

    const handlePay = async () => {
        setIsPaying(true);
        try {
            await onPay();
        } catch (e) {
            // Error is handled by parent's addToast
        } finally {
            setIsPaying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[160] bg-black/50 backdrop-blur-sm flex items-center justify-center font-sans animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl w-[90%] max-w-sm overflow-hidden text-black shadow-2xl">
                <header className="bg-gray-100 p-4 flex items-center justify-center border-b">
                    <img src="https://logopng.com.br/logos/mercado-pago-24.svg" alt="Mercado Pago" className="h-8" />
                </header>
                <div className="p-6">
                    <p className="text-gray-500 text-sm text-center">Você está pagando</p>
                    <p className="text-3xl font-bold text-center my-2">R$ {packageDetails.price.toFixed(2).replace('.', ',')}</p>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm my-4">
                        <div className="flex justify-between">
                            <span className="text-gray-600">{packageDetails.diamonds.toLocaleString()} Diamantes</span>
                            <span className="font-bold">R$ {packageDetails.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handlePay}
                        disabled={isPaying}
                        className="w-full bg-[#009EE3] text-white font-bold py-4 rounded-lg text-base transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center h-14"
                    >
                        {isPaying ? <LoadingSpinner /> : `Pagar com ${paymentMethod === 'card' ? 'Cartão' : 'PIX'}`}
                    </button>
                    <button onClick={onCancelPayment} className="w-full text-center text-gray-500 text-sm mt-4">Cancelar pagamento</button>
                </div>
            </div>
        </div>
    );
};


const ConfirmPurchaseScreen: React.FC<ConfirmPurchaseScreenProps> = ({ packageDetails, onConfirm, onCancel, addToast }) => {
    const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'card'>('card');
    const [address, setAddress] = useState({ street: '', number: '', district: '', city: '', zip: '' });
    const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [isAddressSaved, setIsAddressSaved] = useState(false);
    const [isCardSaved, setIsCardSaved] = useState(false);
    const [preferenceId, setPreferenceId] = useState<string | null>(null);

    const handleSaveAddress = async () => {
        try {
            await api.users.updateBillingAddress(address);
            setIsAddressSaved(true);
        } catch (e) {
            setIsAddressSaved(true);
        }
    };

    const handleSaveCard = async () => {
        try {
            await api.users.updateCreditCard(card);
            setIsCardSaved(true);
        } catch (e) {
            setIsCardSaved(true);
        }
    };

    const handleProceedToPayment = async () => {
        setIsLoading(true);
        setStatusText('Validando informações...');

        try {
            if (!isAddressSaved && address.street) await handleSaveAddress();
            if (!isCardSaved && card.number && paymentMethod === 'card') await handleSaveCard();

            setStatusText('Criando preferência de pagamento...');
            const { preferenceId: newPreferenceId } = await mercadoPagoService.createPreference(packageDetails);
            if (!newPreferenceId) {
                throw new Error("Não foi possível gerar a preferência de pagamento.");
            }
            
            setPreferenceId(newPreferenceId);
            setIsLoading(false);
            setStatusText('');

        } catch (error) {
            addToast?.(ToastType.Error, (error as Error).message || "Falha ao iniciar o pagamento.");
            setIsLoading(false);
            setStatusText('');
        }
    };

    const handleFinalizePayment = async () => {
        setStatusText('Processando confirmação e liberando diamantes...');
        try {
            const result = await mercadoPagoService.finalizeTransaction(packageDetails, paymentMethod);
            
            if (result && result.success) {
                onConfirm(); // Isso fechará a tela e mostrará a notificação de sucesso
            } else {
                throw new Error("Falha na confirmação final do pagamento.");
            }
        } catch (error) {
            addToast?.(ToastType.Error, (error as Error).message || "O pagamento falhou. Tente novamente.");
            // Lançar erro para que o `catch` do checkout modal possa parar o loading
            throw error;
        }
    };

    const handleCancel = async () => {
        try {
            await api.cancelPurchaseTransaction();
        } catch(e) { console.error(e); }
        onCancel();
    };

    if (preferenceId) {
        return (
            <MercadoPagoCheckout 
                packageDetails={packageDetails}
                paymentMethod={paymentMethod}
                onPay={handleFinalizePayment}
                onCancelPayment={handleCancel}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-[150] bg-[#121212] flex flex-col font-sans animate-in slide-in-from-right duration-300">
            <div className="flex items-center p-4 bg-[#121212] border-b border-white/5 shrink-0 z-10">
                <button onClick={handleCancel} className="p-1 -ml-2">
                    <ChevronLeftIcon className="text-white w-6 h-6" />
                </button>
                <h2 className="flex-1 text-center text-white text-base font-bold mr-4">Confirmar compra</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-28 scrollbar-hide">
                <div className="bg-[#1C1C1E] rounded-lg p-4 mb-6 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <SolidDiamondIcon className="w-8 h-8 text-[#FFC107]" />
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-sm">{packageDetails.diamonds.toLocaleString('pt-BR')} Diamante</span>
                            <span className="text-gray-500 text-xs">Pacote Selecionado</span>
                        </div>
                    </div>
                    
                    <div className="space-y-2 border-t border-white/10 pt-3">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-gray-400">Valor do Pacote</span>
                            <span className="text-white">R$ {packageDetails.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-gray-400">Taxas</span>
                            <span className="text-white">R$ 0,00</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 font-bold border-t border-white/5 mt-2">
                            <span className="text-white">Total a Pagar</span>
                            <span className="text-white">R$ {packageDetails.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mb-6">
                    <button 
                        onClick={() => setPaymentMethod('transfer')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
                            paymentMethod === 'transfer' 
                            ? 'bg-[#A855F7] text-white border-[#A855F7]' 
                            : 'bg-transparent text-gray-400 border-gray-700 hover:bg-white/5'
                        }`}
                    >
                        <BankIcon className="w-4 h-4" /> Transferência
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('card')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
                            paymentMethod === 'card' 
                            ? 'bg-[#A855F7] text-white border-[#A855F7]' 
                            : 'bg-transparent text-gray-400 border-gray-700 hover:bg-white/5'
                        }`}
                    >
                        <LockIcon className="w-4 h-4" /> Cartão de Crédito
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-white font-bold text-xs">Endereço de Cobrança (Obrigatório)</h3>
                            {isAddressSaved && <CheckIcon className="w-4 h-4 text-green-500" />}
                        </div>
                        <div className="space-y-3">
                            <input type="text" placeholder="Rua" className="w-full bg-[#232325] text-white p-3 rounded-lg text-xs outline-none border border-white/5 focus:border-[#A855F7] placeholder-gray-500" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} />
                            <div className="flex gap-3">
                                <input type="text" placeholder="Nº" className="w-1/3 bg-[#232325] text-white p-3 rounded-lg text-xs outline-none border border-white/5 focus:border-[#A855F7] placeholder-gray-500" value={address.number} onChange={e => setAddress({...address, number: e.target.value})} />
                                <input type="text" placeholder="Bairro" className="w-2/3 bg-[#232325] text-white p-3 rounded-lg text-xs outline-none border border-white/5 focus:border-[#A855F7] placeholder-gray-500" value={address.district} onChange={e => setAddress({...address, district: e.target.value})} />
                            </div>
                            <div className="flex gap-3">
                                <input type="text" placeholder="Cidade" className="w-1/2 bg-[#232325] text-white p-3 rounded-lg text-xs outline-none border border-white/5 focus:border-[#A855F7] placeholder-gray-500" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
                                <input type="text" placeholder="CEP" className="w-1/2 bg-[#232325] text-white p-3 rounded-lg text-xs outline-none border border-white/5 focus:border-[#A855F7] placeholder-gray-500" value={address.zip} onChange={e => setAddress({...address, zip: e.target.value})} />
                            </div>
                            {!isAddressSaved && (
                                <div className="flex justify-end gap-3 mt-2">
                                    <button onClick={handleSaveAddress} className="px-6 py-1.5 bg-[#A855F7] text-white text-xs font-bold rounded-full hover:bg-[#9333ea]">Salvar Endereço</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {paymentMethod === 'card' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-white font-bold text-xs">Informações do Cartão</h3>
                                {isCardSaved && <CheckIcon className="w-4 h-4 text-green-500" />}
                            </div>
                            <div className="space-y-3">
                                <input type="text" placeholder="Número do Cartão" className="w-full bg-[#232325] text-white p-3 rounded-lg text-xs outline-none border border-white/5 focus:border-[#A855F7] placeholder-gray-500" value={card.number} onChange={e => setCard({...card, number: e.target.value})} />
                                <input type="text" placeholder="Nome no Cartão" className="w-full bg-[#232325] text-white p-3 rounded-lg text-xs outline-none border border-white/5 focus:border-[#A855F7] placeholder-gray-500" value={card.name} onChange={e => setCard({...card, name: e.target.value})} />
                                <div className="flex gap-3">
                                    <input type="text" placeholder="MM/AA" className="w-1/2 bg-[#232325] text-white p-3 rounded-lg text-xs outline-none border border-white/5 focus:border-[#A855F7] placeholder-gray-500" value={card.expiry} onChange={e => setCard({...card, expiry: e.target.value})} />
                                    <input type="text" placeholder="CVV" className="w-1/2 bg-[#232325] text-white p-3 rounded-lg text-xs outline-none border border-white/5 focus:border-[#A855F7] placeholder-gray-500" value={card.cvv} onChange={e => setCard({...card, cvv: e.target.value})} />
                                </div>
                                {!isCardSaved && (
                                    <div className="flex justify-end gap-3 mt-2">
                                        <button onClick={handleSaveCard} className="px-6 py-1.5 bg-[#A855F7] text-white text-xs font-bold rounded-full hover:bg-[#9333ea]">Salvar Cartão</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                         <div className="animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-white font-bold text-xs">Dados para PIX</h3>
                            </div>
                            <div className="bg-[#232325] border border-green-500/30 p-4 rounded-lg text-center space-y-2">
                                <p className="text-green-300 text-xs">Escaneie o QR Code ou use a chave abaixo.</p>
                                <div className="w-32 h-32 bg-white mx-auto my-4 rounded-lg flex items-center justify-center text-black font-bold text-xs">QR Code Simulado</div>
                                <p className="text-gray-400 text-xs">Chave Aleatória:</p>
                                <p className="text-white text-sm font-mono break-all">00020126...5915LiveGo...6304</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 bg-[#121212] border-t border-white/5 safe-area-bottom z-20">
                {isLoading && (
                    <div className="text-center mb-3 text-purple-300 text-xs font-bold animate-pulse h-4">
                        {statusText}
                    </div>
                )}
                <button 
                    onClick={handleProceedToPayment}
                    disabled={isLoading}
                    className="w-full bg-[#3b4453] hover:bg-[#4b5563] text-white font-bold py-3.5 rounded-full text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center h-12"
                >
                    {isLoading 
                        ? <LoadingSpinner /> 
                        : `Prosseguir para Pagamento`
                    }
                </button>
            </div>
        </div>
    );
};

export default ConfirmPurchaseScreen;
