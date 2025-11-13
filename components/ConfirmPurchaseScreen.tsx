import React, { useState, useMemo } from 'react';
import { BackIcon, BankIcon, CreditCardIcon, YellowDiamondIcon, PencilIcon } from './icons';
import { ToastType } from '../types';
import { useTranslation } from '../i18n';

interface ConfirmPurchaseScreenProps {
  onClose: () => void;
  packageDetails: {
    diamonds: number;
    price: number;
  };
  onConfirmPurchase: (pkg: { diamonds: number; price: number }) => void;
  addToast: (type: ToastType, message: string) => void;
}

const InputField: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    className?: string;
    type?: string;
    label: string;
    disabled?: boolean;
}> = ({ value, onChange, placeholder, className = '', type = 'text', label, disabled = false }) => (
    <div className={`flex-1 ${className}`}>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder || label}
            aria-label={label}
            disabled={disabled}
            className="w-full bg-[#2c2c2e] border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-800 disabled:text-gray-400"
        />
    </div>
);


const ConfirmPurchaseScreen: React.FC<ConfirmPurchaseScreenProps> = ({ onClose, packageDetails, onConfirmPurchase, addToast }) => {
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'credit_card'>('transfer');
  
  const [address, setAddress] = useState({ street: '', number: '', neighborhood: '', city: '', cep: '' });
  const [isAddressSaved, setIsAddressSaved] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(true);

  const [cardInfo, setCardInfo] = useState({ number: '', name: '', expiry: '', cvv: ''});
  const [isCardSaved, setIsCardSaved] = useState(false);
  const [isEditingCardInfo, setIsEditingCardInfo] = useState(true);
  
  const [bankInfo, setBankInfo] = useState({
    banco: 'Banco do Brasil (001)',
    agencia: '1234-5',
    conta: '******-0',
    cpfCnpj: '123.***.***-00',
    titular: 'LiveGo Pagamentos Ltda.',
  });
  const [isBankInfoSaved, setIsBankInfoSaved] = useState(true);
  const [isEditingBankInfo, setIsEditingBankInfo] = useState(false);
  const [tempBankInfo, setTempBankInfo] = useState(bankInfo);

  const handleAddressChange = (field: keyof typeof address, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    setIsAddressSaved(false);
  };
  
  const handleSaveAddress = () => {
      const { street, number, neighborhood, city, cep } = address;
      if (street && number && neighborhood && city && cep) {
          setIsAddressSaved(true);
          setIsEditingAddress(false);
      } else {
          addToast(ToastType.Error, t('confirmPurchase.pleaseFillAddress'));
      }
  };

  const handleCancelAddress = () => {
    setAddress({ street: '', number: '', neighborhood: '', city: '', cep: '' });
    if (!isAddressSaved) {
        setIsEditingAddress(true);
    }
  };
  
  const handleEditAddress = () => {
    setIsEditingAddress(true);
    setIsAddressSaved(false);
  };


  const handleCardChange = (field: keyof typeof cardInfo, value: string) => {
    setCardInfo(prev => ({ ...prev, [field]: value }));
    setIsCardSaved(false);
  };

  const handleSaveCard = () => {
      const { number, name, expiry, cvv } = cardInfo;
      if (number && name && expiry && cvv) {
          setIsCardSaved(true);
          setIsEditingCardInfo(false);
      } else {
          addToast(ToastType.Error, t('confirmPurchase.pleaseFillCard'));
      }
  };

  const handleCancelCard = () => {
      setCardInfo({ number: '', name: '', expiry: '', cvv: '' });
       if (!isCardSaved) {
        setIsEditingCardInfo(true);
    }
  }

  const handleEditCard = () => {
    setIsEditingCardInfo(true);
    setIsCardSaved(false);
  };

  const handleEditBankInfo = () => {
    setTempBankInfo(bankInfo);
    setIsEditingBankInfo(true);
    setIsBankInfoSaved(false);
  };

  const handleBankInfoChange = (field: keyof typeof bankInfo, value: string) => {
    setBankInfo(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSaveBankInfo = () => {
    const { banco, agencia, conta, cpfCnpj, titular } = bankInfo;
    if (banco && agencia && conta && cpfCnpj && titular) {
      setIsBankInfoSaved(true);
      setIsEditingBankInfo(false);
    } else {
      addToast(ToastType.Error, t('confirmPurchase.pleaseFillBank'));
    }
  };
  
  const handleCancelBankInfo = () => {
    setBankInfo(tempBankInfo);
    setIsBankInfoSaved(true);
    setIsEditingBankInfo(false);
  };

  const isPurchaseReady = useMemo(() => {
    if (!isAddressSaved) return false;
    if (paymentMethod === 'credit_card' && !isCardSaved) return false;
    if (paymentMethod === 'transfer' && !isBankInfoSaved) return false;
    return true;
  }, [isAddressSaved, isCardSaved, paymentMethod, isBankInfoSaved]);


  return (
    <div className="absolute inset-0 bg-[#111111] z-50 flex flex-col text-white">
      <header className="flex items-center p-4 flex-shrink-0">
        <button onClick={onClose} className="absolute">
          <BackIcon className="w-6 h-6" />
        </button>
        <div className="flex-grow text-center">
          <h1 className="text-lg font-semibold">{t('confirmPurchase.title')}</h1>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 space-y-4 no-scrollbar">
        <div className="bg-[#1c1c1e] rounded-lg p-4">
            <div className="flex items-center space-x-3">
                <YellowDiamondIcon className="w-8 h-8 text-yellow-400" />
                <div>
                <p className="font-bold text-white">{packageDetails.diamonds} {t('profile.diamonds')}</p>
                <p className="text-sm text-gray-400">{t('confirmPurchase.selectedPackage')}</p>
                </div>
            </div>
            <div className="space-y-2 text-sm mt-3 pt-3 border-t border-gray-700">
                <div className="flex justify-between">
                <span className="text-gray-400">{t('confirmPurchase.packageValue')}</span>
                <span className="text-white font-semibold">R$ {packageDetails.price.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between">
                <span className="text-gray-400">{t('confirmPurchase.fees')}</span>
                <span className="text-white font-semibold">R$ 0,00</span>
                </div>
            </div>
            <div className="flex justify-between font-bold text-base mt-3 pt-3 border-t border-gray-700">
                <span className="text-white">{t('confirmPurchase.total')}</span>
                <span className="text-white">R$ {packageDetails.price.toFixed(2).replace('.', ',')}</span>
            </div>
        </div>

        <div className="flex items-center space-x-2 bg-[#1c1c1e] rounded-lg p-2">
            <button 
                onClick={() => setPaymentMethod('transfer')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-md transition-colors ${paymentMethod === 'transfer' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700/50'}`}
            >
                <BankIcon className="w-5 h-5" />
                <span>{t('confirmPurchase.transfer')}</span>
            </button>
            <button 
                onClick={() => setPaymentMethod('credit_card')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-md transition-colors ${paymentMethod === 'credit_card' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700/50'}`}
            >
                <CreditCardIcon className="w-5 h-5" />
                <span>{t('confirmPurchase.creditCard')}</span>
            </button>
        </div>

        <div className="bg-[#1c1c1e] rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-white">{t('confirmPurchase.deliveryAddress')}</h3>
                {!isEditingAddress && (
                    <button onClick={handleEditAddress} className="flex items-center space-x-1 text-purple-400 hover:text-purple-300">
                        <PencilIcon className="w-4 h-4" />
                        <span>{t('common.edit')}</span>
                    </button>
                )}
            </div>
            
            <InputField label={t('confirmPurchase.address.street')} value={address.street} onChange={e => handleAddressChange('street', e.target.value)} disabled={!isEditingAddress} />
            <div className="flex space-x-3">
                <InputField label={t('confirmPurchase.address.number')} value={address.number} onChange={e => handleAddressChange('number', e.target.value)} disabled={!isEditingAddress} />
                <InputField label={t('confirmPurchase.address.neighborhood')} value={address.neighborhood} onChange={e => handleAddressChange('neighborhood', e.target.value)} disabled={!isEditingAddress} />
            </div>
            <div className="flex space-x-3">
                <InputField label={t('confirmPurchase.address.city')} value={address.city} onChange={e => handleAddressChange('city', e.target.value)} disabled={!isEditingAddress} />
                <InputField label={t('confirmPurchase.address.cep')} value={address.cep} onChange={e => handleAddressChange('cep', e.target.value)} disabled={!isEditingAddress} />
            </div>

            {isEditingAddress && (
                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={handleCancelAddress} className="bg-gray-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-gray-500 transition-colors">{t('common.cancel')}</button>
                    <button onClick={handleSaveAddress} className="bg-purple-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-purple-700 transition-colors">{t('common.save')}</button>
                </div>
            )}
        </div>

        {paymentMethod === 'credit_card' && (
            <div className="bg-[#1c1c1e] rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white">{t('confirmPurchase.cardDetails')}</h3>
                    {!isEditingCardInfo && (
                        <button onClick={handleEditCard} className="flex items-center space-x-1 text-purple-400 hover:text-purple-300">
                            <PencilIcon className="w-4 h-4" />
                            <span>{t('common.edit')}</span>
                        </button>
                    )}
                </div>
                <InputField label={t('confirmPurchase.card.number')} value={cardInfo.number} onChange={e => handleCardChange('number', e.target.value)} disabled={!isEditingCardInfo} />
                <InputField label={t('confirmPurchase.card.name')} value={cardInfo.name} onChange={e => handleCardChange('name', e.target.value)} disabled={!isEditingCardInfo} />
                <div className="flex space-x-3">
                    <InputField label={t('confirmPurchase.card.expiry')} placeholder="MM/AA" value={cardInfo.expiry} onChange={e => handleCardChange('expiry', e.target.value)} disabled={!isEditingCardInfo} />
                    <InputField label={t('confirmPurchase.card.cvv')} value={cardInfo.cvv} onChange={e => handleCardChange('cvv', e.target.value)} disabled={!isEditingCardInfo} />
                </div>

                {isEditingCardInfo && (
                    <div className="flex justify-end space-x-3 pt-2">
                        <button onClick={handleCancelCard} className="bg-gray-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-gray-500 transition-colors">{t('common.cancel')}</button>
                        <button onClick={handleSaveCard} className="bg-purple-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-purple-700 transition-colors">{t('common.save')}</button>
                    </div>
                )}
            </div>
        )}

        {paymentMethod === 'transfer' && (
            <div className="bg-[#1c1c1e] rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white">{t('confirmPurchase.bankDetails')}</h3>
                    {!isEditingBankInfo && (
                        <button onClick={handleEditBankInfo} className="flex items-center space-x-1 text-purple-400 hover:text-purple-300">
                            <PencilIcon className="w-4 h-4" />
                            <span>{t('common.edit')}</span>
                        </button>
                    )}
                </div>
                <InputField label={t('confirmPurchase.bank.bank')} value={bankInfo.banco} onChange={e => handleBankInfoChange('banco', e.target.value)} disabled={!isEditingBankInfo} />
                <div className="flex space-x-3">
                    <InputField label={t('confirmPurchase.bank.agency')} value={bankInfo.agencia} onChange={e => handleBankInfoChange('agencia', e.target.value)} disabled={!isEditingBankInfo} />
                    <InputField label={t('confirmPurchase.bank.account')} value={bankInfo.conta} onChange={e => handleBankInfoChange('conta', e.target.value)} disabled={!isEditingBankInfo} />
                </div>
                <InputField label={t('confirmPurchase.bank.cpfCnpj')} value={bankInfo.cpfCnpj} onChange={e => handleBankInfoChange('cpfCnpj', e.target.value)} disabled={!isEditingBankInfo} />
                <InputField label={t('confirmPurchase.bank.holder')} value={bankInfo.titular} onChange={e => handleBankInfoChange('titular', e.target.value)} disabled={!isEditingBankInfo} />

                {isEditingBankInfo && (
                    <div className="flex justify-end space-x-3 pt-2">
                        <button onClick={handleCancelBankInfo} className="bg-gray-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-gray-500 transition-colors">{t('common.cancel')}</button>
                        <button onClick={handleSaveBankInfo} className="bg-purple-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-purple-700 transition-colors">{t('common.save')}</button>
                    </div>
                )}
            </div>
        )}

      </main>

      <footer className="p-4 flex-shrink-0">
        <button
          onClick={() => onConfirmPurchase(packageDetails)}
          disabled={!isPurchaseReady}
          className="w-full bg-green-600 text-white font-bold py-4 rounded-full hover:bg-green-700 transition-colors disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {t('confirmPurchase.confirmButton')} (R$ {packageDetails.price.toFixed(2).replace('.', ',')})
        </button>
      </footer>
    </div>
  );
};

export default ConfirmPurchaseScreen;
