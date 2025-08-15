import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { User, DiamondPackage, Address, PaymentMethod, CardDetails, PurchaseOrder, CardBrand } from '../types';
import * as authService from '../services/authService';
import { useApiViewer } from './ApiContext';
import CrossIcon from './icons/CrossIcon';
import DiamondIcon from './icons/DiamondIcon';
import BankIcon from './icons/BankIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PencilIcon from './icons/PencilIcon';
import VisaIcon from './icons/VisaIcon';
import MastercardIcon from './icons/MastercardIcon';
import EloIcon from './icons/EloIcon';
import AmexIcon from './icons/AmexIcon';

interface PurchaseConfirmationScreenProps {
  user: User;
  selectedPackage: DiamondPackage;
  onExit: () => void;
  onConfirm: (updatedUser: User, order: PurchaseOrder) => void;
}

const InfoRow: React.FC<{ label: string; value: string | React.ReactNode; isEmphasized?: boolean }> = ({ label, value, isEmphasized = false }) => (
    <div className={`flex justify-between items-center py-1.5 ${isEmphasized ? 'text-base' : 'text-sm'}`}>
        <span className="text-gray-400">{label}</span>
        <div className={`${isEmphasized ? 'font-bold text-white' : 'text-gray-200'}`}>{value}</div>
    </div>
);

const InputField = React.forwardRef<HTMLInputElement, { id: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; className?: string; required?: boolean; maxLength?: number; pattern?: string; error?: string; }>(
    ({ id, placeholder, value, onChange, className = '', required = true, error, ...props }, ref) => (
        <div className="w-full">
            <input
                ref={ref}
                id={id}
                name={id}
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full bg-[#2c2c2e] h-11 rounded-md px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${error ? 'ring-1 ring-red-500' : 'focus:ring-green-500'} ${className}`}
                required={required}
                {...props}
            />
            {error && <p className="text-red-400 text-xs mt-1 pl-1">{error}</p>}
        </div>
    )
);


const PurchaseConfirmationScreen: React.FC<PurchaseConfirmationScreenProps> = ({ user, selectedPackage, onExit, onConfirm }) => {
    const [activeTab, setActiveTab] = useState<PaymentMethod>('transfer');
    const [address, setAddress] = useState<Address>({ street: '', number: '', neighborhood: '', city: '', postalCode: '' });
    const [cardDetails, setCardDetails] = useState<CardDetails>({ number: '', expiry: '', cvc: '', name: '' });
    const [cardBrand, setCardBrand] = useState<CardBrand>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showApiResponse } = useApiViewer();
    
    const [isEditingAddress, setIsEditingAddress] = useState(true);
    const [originalAddress, setOriginalAddress] = useState(address);
    const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof Address, string>>>({});
    const [addressSaveSuccess, setAddressSaveSuccess] = useState(false);

    const [isEditingCard, setIsEditingCard] = useState(true);
    const [originalCardDetails, setOriginalCardDetails] = useState(cardDetails);
    const [cardErrors, setCardErrors] = useState<Partial<Record<keyof CardDetails, string>>>({});
    const [cardSaveSuccess, setCardSaveSuccess] = useState(false);

    const [isEditingBankDetails, setIsEditingBankDetails] = useState(false);
    const [bankDetails, setBankDetails] = useState({
        bankName: 'Banco do Brasil',
        bankCode: '001',
        agency: '1234-5',
        account: '54321-0',
        document: '123.456.789-00',
        holder: 'LiveGo Pagamentos Ltda.'
    });
    const [originalBankDetails, setOriginalBankDetails] = useState(bankDetails);
    const [bankErrors, setBankErrors] = useState<Record<string, string>>({});
    const [isSavingBank, setIsSavingBank] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const bankNameInputRef = useRef<HTMLInputElement>(null);

     const isFormComplete = useMemo(() => {
        if (isEditingAddress) return false;
        if (activeTab === 'card' && isEditingCard) return false;
        return true;
    }, [isEditingAddress, isEditingCard, activeTab]);
    
    useEffect(() => {
        if (isEditingBankDetails) {
            bankNameInputRef.current?.focus();
        }
    }, [isEditingBankDetails]);

    useEffect(() => {
        if (cardDetails.number.replace(/\D/g, '').length < 4) {
            if (cardBrand !== null) {
                setCardBrand(null);
            }
            return;
        }

        const handler = setTimeout(async () => {
            try {
                const { brand } = await authService.detectCardBrand(cardDetails.number);
                setCardBrand(brand);
            } catch (error) {
                console.error("Card brand detection failed:", error);
                setCardBrand(null);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [cardDetails.number, cardBrand]);
    
    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;
        if (name === 'postalCode') {
            value = value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
        }
        setAddress(prev => ({ ...prev, [name]: value }));
    };

    const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;
        if (name === 'number') {
            value = value.replace(/\D/g, '').slice(0, 16);
        }
        if (name === 'expiry') value = value.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2');
        if (name === 'cvc') value = value.replace(/\D/g, '').slice(0, 4);
        setCardDetails(prev => ({ ...prev, [name]: value }));
    };

    const validateBankDetails = () => {
        const errors: Record<string, string> = {};
        if (!bankDetails.bankName.trim()) errors.bankName = 'Nome do banco é obrigatório.';
        if (!bankDetails.bankCode.trim() || !/^\d{3}$/.test(bankDetails.bankCode)) errors.bankCode = 'Código deve ter 3 dígitos.';
        if (!bankDetails.agency.trim() || !/^\d{4}-\d$/.test(bankDetails.agency)) errors.agency = 'Formato inválido. Use 0000-0.';
        if (!bankDetails.account.trim()) errors.account = 'Conta é obrigatória.';
        if (!bankDetails.document.trim() || (bankDetails.document.length !== 14 && bankDetails.document.length !== 18)) errors.document = 'CPF/CNPJ inválido.';
        if (!bankDetails.holder.trim()) errors.holder = 'Titular é obrigatório.';
        setBankErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleBankDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;
        if (name === 'bankCode') value = value.replace(/\D/g, '').slice(0, 3);
        if (name === 'agency') value = value.replace(/\D/g, '').slice(0, 5).replace(/(\d{4})(\d)/, '$1-$2');
        if (name === 'document') {
            value = value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            } else {
                value = value.slice(0, 14).replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
            }
        }
        setBankDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleEditBankClick = () => {
        setOriginalBankDetails(bankDetails);
        setIsEditingBankDetails(true);
    };

    const handleCancelBankEdit = () => {
        setBankDetails(originalBankDetails);
        setBankErrors({});
        setIsEditingBankDetails(false);
    };

    const handleSaveBankDetails = async () => {
        if (!validateBankDetails()) return;
        setIsSavingBank(true);
        setSaveSuccess(false);
        await new Promise(res => setTimeout(res, 1000));
        setIsSavingBank(false);
        setSaveSuccess(true);
        setIsEditingBankDetails(false);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const handleSubmit = async () => {
        if (!isFormComplete) {
            alert("Por favor, salve seus detalhes de endereço e pagamento antes de continuar.");
            return;
        }
        setIsSubmitting(true);
        try {
            const paymentDetails = {
                method: activeTab,
                card: activeTab === 'card' ? cardDetails : undefined,
            };
            const { updatedUser, order } = await authService.purchaseDiamonds(user.id, selectedPackage.id, address, paymentDetails);
            showApiResponse(`POST /api/purchase`, { packageId: selectedPackage.id, success: true, order });
            onConfirm(updatedUser, order);
        } catch (error) {
            console.error("Purchase failed:", error);
            alert('A compra falhou. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- Address Handlers ---
    const validateAddress = () => {
        const errors: Partial<Record<keyof Address, string>> = {};
        if (!address.street.trim()) errors.street = 'Rua é obrigatória.';
        if (!address.number.trim()) errors.number = 'Nº é obrigatório.';
        if (!address.neighborhood.trim()) errors.neighborhood = 'Bairro é obrigatório.';
        if (!address.city.trim()) errors.city = 'Cidade é obrigatória.';
        if (!address.postalCode.trim() || !/^\d{5}-?\d{3}$/.test(address.postalCode)) errors.postalCode = 'CEP inválido.';
        setAddressErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleEditAddressClick = () => {
        setOriginalAddress(address);
        setIsEditingAddress(true);
    };

    const handleCancelAddressEdit = () => {
        setAddress(originalAddress);
        setAddressErrors({});
        if (Object.values(originalAddress).some(v => v.trim() !== '')) {
            setIsEditingAddress(false);
        }
    };

    const handleSaveAddress = () => {
        if (!validateAddress()) return;
        setIsEditingAddress(false);
        setAddressSaveSuccess(true);
        setTimeout(() => setAddressSaveSuccess(false), 2000);
    };
    
    // --- Card Handlers ---
    const validateCardDetails = () => {
        const errors: Partial<Record<keyof CardDetails, string>> = {};
        if (cardDetails.number.replace(/\D/g, '').length !== 16) errors.number = 'Número de cartão inválido.';
        if (!cardDetails.name.trim()) errors.name = 'Nome é obrigatório.';
        if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) errors.expiry = 'Data inválida (MM/AA).';
        if (cardDetails.cvc.length < 3) errors.cvc = 'CVC inválido.';
        setCardErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleEditCardClick = () => {
        setOriginalCardDetails(cardDetails);
        setIsEditingCard(true);
    };

    const handleCancelCardEdit = () => {
        setCardDetails(originalCardDetails);
        setCardErrors({});
        if (Object.values(originalCardDetails).some(v => v.trim() !== '')) {
            setIsEditingCard(false);
        }
    };

    const handleSaveCard = () => {
        if (!validateCardDetails()) return;
        setIsEditingCard(false);
        setCardSaveSuccess(true);
        setTimeout(() => setCardSaveSuccess(false), 2000);
    };

    const renderBankTransfer = () => {
        if (isEditingBankDetails) {
            return (
                <div className="p-3">
                    <h3 className="font-semibold text-white mb-3">Editar Dados Bancários</h3>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                             <div className="flex-grow">
                                <InputField ref={bankNameInputRef} id="bankName" placeholder="Nome do Banco" value={bankDetails.bankName} onChange={handleBankDetailChange} error={bankErrors.bankName} />
                             </div>
                             <div className="w-1/3">
                                <InputField id="bankCode" placeholder="Cód." value={bankDetails.bankCode} onChange={handleBankDetailChange} error={bankErrors.bankCode} maxLength={3} />
                             </div>
                        </div>
                        <div className="flex gap-2">
                             <div className="w-1/2">
                                <InputField id="agency" placeholder="Agência (0000-0)" value={bankDetails.agency} onChange={handleBankDetailChange} error={bankErrors.agency} maxLength={6} />
                             </div>
                             <div className="w-1/2">
                                <InputField id="account" placeholder="Conta Corrente" value={bankDetails.account} onChange={handleBankDetailChange} error={bankErrors.account} />
                             </div>
                        </div>
                        <InputField id="document" placeholder="CPF/CNPJ do Titular" value={bankDetails.document} onChange={handleBankDetailChange} error={bankErrors.document} maxLength={18} />
                        <InputField id="holder" placeholder="Nome Completo do Titular" value={bankDetails.holder} onChange={handleBankDetailChange} error={bankErrors.holder} />
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button onClick={handleCancelBankEdit} className="w-full py-2.5 rounded-full font-semibold transition-colors bg-[#2c2c2e] hover:bg-[#3a3a3c]">
                            Cancelar
                        </button>
                        <button onClick={handleSaveBankDetails} disabled={isSavingBank} className="w-full py-2.5 rounded-full font-semibold transition-colors bg-green-500 text-black hover:bg-green-400 disabled:bg-gray-600 flex items-center justify-center">
                            {isSavingBank && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            {isSavingBank ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            )
        }
        
        return (
             <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <BankIcon className="w-5 h-5 text-green-400" />
                        <h3 className="font-semibold text-green-400">Informações para Pagamento</h3>
                    </div>
                    <button onClick={handleEditBankClick} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
                        <PencilIcon className="w-4 h-4"/> Editar
                    </button>
                </div>
                {saveSuccess && <p className="text-green-400 text-sm text-center mb-2">Dados salvos com sucesso!</p>}
                <div className="space-y-1 text-sm border-t border-b border-gray-700/50 py-2">
                    <InfoRow label="Banco" value={`${bankDetails.bankName} (${bankDetails.bankCode})`} />
                    <InfoRow label="Agência" value={bankDetails.agency} />
                    <InfoRow label="Conta Corrente" value={bankDetails.account.replace(/./g, (c, i) => i < bankDetails.account.length - 2 ? '*' : c)} />
                    <InfoRow label="CPF/CNPJ" value={bankDetails.document.replace(/./g, (c, i) => i > 2 && i < bankDetails.document.length - 2 && c.match(/\d/) ? '*' : c)} />
                    <InfoRow label="Titular" value={bankDetails.holder} />
                </div>
                <p className="text-xs text-gray-500 mt-3">Após a transferência, envie o comprovante para o suporte para creditarmos seus diamantes.</p>
            </div>
        );
    };

    const renderCardPayment = () => {
        if (isEditingCard) {
             return (
                 <div className="p-3">
                    <h3 className="font-semibold text-white mb-2">Detalhes do Cartão</h3>
                    <div className="space-y-2">
                        <div className="relative">
                            <InputField id="number" placeholder="Número do Cartão" value={cardDetails.number} onChange={handleCardChange} maxLength={16} error={cardErrors.number} className="pr-12" />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 h-6 flex items-center">
                                {cardBrand === 'visa' && <VisaIcon className="h-4 w-auto" />}
                                {cardBrand === 'mastercard' && <MastercardIcon className="h-5 w-auto" />}
                                {cardBrand === 'amex' && <AmexIcon className="h-5 w-auto" />}
                                {cardBrand === 'elo' && <EloIcon className="h-5 w-auto" />}
                            </div>
                        </div>
                        <InputField id="name" placeholder="Nome no Cartão" value={cardDetails.name} onChange={handleCardChange} error={cardErrors.name} />
                        <div className="flex gap-2">
                            <InputField id="expiry" placeholder="MM/AA" value={cardDetails.expiry} onChange={handleCardChange} maxLength={5} error={cardErrors.expiry} />
                            <InputField id="cvc" placeholder="CVC" value={cardDetails.cvc} onChange={handleCardChange} maxLength={4} error={cardErrors.cvc} />
                        </div>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button onClick={handleCancelCardEdit} className="w-full py-2.5 rounded-full font-semibold transition-colors bg-[#2c2c2e] hover:bg-[#3a3a3c]">
                            Cancelar
                        </button>
                        <button onClick={handleSaveCard} className="w-full py-2.5 rounded-full font-semibold transition-colors bg-green-500 text-black hover:bg-green-400">
                            Salvar Cartão
                        </button>
                    </div>
                </div>
            );
        }
        
        const maskedCardNumber = `**** **** **** ${cardDetails.number.slice(-4)}`;
        return (
             <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">Detalhes do Cartão</h3>
                    <button onClick={handleEditCardClick} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
                        <PencilIcon className="w-4 h-4"/> Editar
                    </button>
                </div>
                {cardSaveSuccess && <p className="text-green-400 text-sm text-center mb-2">Cartão salvo com sucesso!</p>}
                <div className="space-y-1 text-sm border-t border-b border-gray-700/50 py-2">
                    <InfoRow label="Cartão" value={maskedCardNumber} />
                    <InfoRow label="Nome" value={cardDetails.name} />
                    <InfoRow label="Validade" value={cardDetails.expiry} />
                </div>
            </div>
        );
    };

    const renderAddressSection = () => {
        if (isEditingAddress) {
             return (
                <div className="p-3">
                    <h3 className="font-semibold text-white mb-2">Endereço de Cobrança (Obrigatório)</h3>
                    <div className="space-y-2">
                       <div className="flex gap-2">
                           <InputField id="street" placeholder="Rua" value={address.street} onChange={handleAddressChange} className="flex-grow" error={addressErrors.street} />
                           <InputField id="number" placeholder="Nº" value={address.number} onChange={handleAddressChange} className="w-1/4" error={addressErrors.number} />
                       </div>
                       <InputField id="neighborhood" placeholder="Bairro" value={address.neighborhood} onChange={handleAddressChange} error={addressErrors.neighborhood} />
                       <div className="flex gap-2">
                           <InputField id="city" placeholder="Cidade" value={address.city} onChange={handleAddressChange} className="flex-grow" error={addressErrors.city} />
                           <InputField id="postalCode" placeholder="CEP" value={address.postalCode} onChange={handleAddressChange} className="w-2/5" maxLength={9} error={addressErrors.postalCode} />
                       </div>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button onClick={handleCancelAddressEdit} className="w-full py-2.5 rounded-full font-semibold transition-colors bg-[#2c2c2e] hover:bg-[#3a3a3c]">
                            Cancelar
                        </button>
                        <button onClick={handleSaveAddress} className="w-full py-2.5 rounded-full font-semibold transition-colors bg-green-500 text-black hover:bg-green-400">
                            Salvar Endereço
                        </button>
                    </div>
                </div>
            )
        }
        
        return (
             <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">Endereço de Cobrança</h3>
                    <button onClick={handleEditAddressClick} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
                        <PencilIcon className="w-4 h-4"/> Editar
                    </button>
                </div>
                {addressSaveSuccess && <p className="text-green-400 text-sm text-center mb-2">Endereço salvo com sucesso!</p>}
                 <div className="space-y-1 text-sm border-t border-b border-gray-700/50 py-2">
                    <InfoRow label="Endereço" value={`${address.street}, ${address.number}`} />
                    <InfoRow label="Bairro" value={address.neighborhood} />
                    <InfoRow label="Cidade" value={address.city} />
                    <InfoRow label="CEP" value={address.postalCode} />
                </div>
            </div>
        );
    };

    return (
        <div 
            className="fixed inset-0 bg-[#1C1F24] z-[60] flex flex-col font-sans"
        >
            <header className="p-4 flex items-center shrink-0 border-b border-gray-700">
                <button onClick={onExit} className="p-2 -m-2"><ArrowLeftIcon className="w-6 h-6"/></button>
                <h2 className="text-lg font-bold text-white text-center flex-grow">Confirmar Compra</h2>
                <button onClick={onExit} className="p-1"><CrossIcon className="w-5 h-5 text-gray-400" /></button>
            </header>

            <main className="flex-grow p-4 overflow-y-auto divide-y divide-gray-800 scrollbar-hide">
                <div className="py-4">
                    <div className="flex items-center gap-3 mb-3">
                        <DiamondIcon className="w-8 h-8"/>
                        <div>
                            <p className="font-bold text-lg">{selectedPackage.diamonds.toLocaleString()} Diamantes</p>
                            <p className="text-sm text-gray-300">Pacote Selecionado</p>
                        </div>
                    </div>
                    <div className="pt-3 space-y-1 border-t border-gray-700/50">
                        <InfoRow label="Valor do Pacote" value={`${selectedPackage.currency} ${selectedPackage.price.toFixed(2).replace('.', ',')}`} />
                        <InfoRow label="Taxas" value="R$ 0,00" />
                        <InfoRow label="Total a Pagar" value={`${selectedPackage.currency} ${selectedPackage.price.toFixed(2).replace('.', ',')}`} isEmphasized />
                    </div>
                </div>
                
                <div className="py-4">
                    <div className="flex items-center p-1 bg-black/30 rounded-full mb-3">
                        <button onClick={() => setActiveTab('transfer')} className={`w-1/2 py-2 rounded-full flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${activeTab === 'transfer' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>
                            <BankIcon className="w-5 h-5"/> Transferência
                        </button>
                        <button onClick={() => setActiveTab('card')} className={`w-1/2 py-2 rounded-full flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${activeTab === 'card' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>
                            <CreditCardIcon className="w-5 h-5" /> Cartão de Crédito
                        </button>
                    </div>
                    {activeTab === 'transfer' ? renderBankTransfer() : renderCardPayment()}
                </div>

                 <div className="py-4">
                    {renderAddressSection()}
                </div>
            </main>
            
            <footer className="p-4 shrink-0 border-t border-gray-700">
                {!isFormComplete && (
                    <p className="text-center text-yellow-400 text-sm mb-3 px-4">
                        Por favor, salve os detalhes obrigatórios de cada seção para continuar.
                    </p>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={!isFormComplete || isSubmitting}
                    className="w-full bg-green-500 text-black font-bold py-3 rounded-full text-lg transition-colors hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                     {isSubmitting ? 'Processando...' : `Confirmar Compra (R$ ${selectedPackage.price.toFixed(2).replace('.', ',')})`}
                </button>
            </footer>
             <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default PurchaseConfirmationScreen;