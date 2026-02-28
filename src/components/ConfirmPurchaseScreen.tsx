
import React, { useState, useEffect, useMemo } from 'react';
import { BackIcon, BankIcon, CreditCardIcon, YellowDiamondIcon, PixIcon, LockIcon, QuestionMarkIcon, CopyIcon, CheckIcon, CheckCircleIcon } from './icons';
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

// Helper function to calculate CRC16 (CCITT-FALSE) required by Pix standard
const calculateCRC16 = (str: string) => {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        crc ^= c << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
        crc = crc & 0xFFFF; // Ensure 16-bit
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
};

const generatePixCode = (amount: number, transactionId: string, merchantKey: string) => {
    const amountStr = amount.toFixed(2);
    
    // Construct Merchant Account Info (ID 26)
    const gui = "0014BR.GOV.BCB.PIX";
    const key = `01${merchantKey.length.toString().padStart(2, '0')}${merchantKey}`;
    const merchantAccountInfoContent = gui + key;
    const merchantAccountInfo = `26${merchantAccountInfoContent.length.toString().padStart(2, '0')}${merchantAccountInfoContent}`;

    // Construct Additional Data Field (ID 62) containing TxID
    const txId = transactionId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || "***";
    const additionalDataContent = `05${txId.length.toString().padStart(2, '0')}${txId}`;
    const additionalData = `62${additionalDataContent.length.toString().padStart(2, '0')}${additionalDataContent}`;

    // Helper to format generic fields
    const f = (id: string, value: string) => `${id}${value.length.toString().padStart(2, '0')}${value}`;

    const payloadWithoutCRC = [
        f('00', '01'),
        merchantAccountInfo,
        f('52', '0000'),
        f('53', '986'),
        f('54', amountStr),
        f('58', 'BR'),
        f('59', 'LiveGo Diamonds'),
        f('60', 'SAO PAULO'),
        additionalData,
        '6304' // ID 63 + Length 04
    ].join('');

    const crc = calculateCRC16(payloadWithoutCRC);
    return payloadWithoutCRC + crc;
};


const ConfirmPurchaseScreen: React.FC<ConfirmPurchaseScreenProps> = ({ onClose, packageDetails, onConfirmPurchase, addToast }) => {
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('pix');
  
  // Pix State
  const [timeLeft, setTimeLeft] = useState(598); // 09:58
  const orderId = useMemo(() => `LG${Math.floor(Math.random() * 1000000)}`, []);
  // Use a specific email key as requested for realism
  const pixKeyString = "adrianomdk5@gmail.com"; 
  const [pixStatus, setPixStatus] = useState<'pending' | 'confirmed'>('pending');
  
  // Generate a strictly valid Pix string structure
  const pixCode = useMemo(() => {
      return generatePixCode(packageDetails.price, orderId, pixKeyString);
  }, [packageDetails.price, orderId, pixKeyString]);
  
  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Timer Effect
  useEffect(() => {
    if (paymentMethod === 'pix' && timeLeft > 0) {
      const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timerId);
    }
  }, [paymentMethod, timeLeft]);

  // Simulate Banking Verification for Pix
  useEffect(() => {
    if (paymentMethod === 'pix' && pixStatus === 'pending') {
        // Simulate waiting for user to pay (10 seconds)
        const timeout = setTimeout(() => {
            setPixStatus('confirmed');
            addToast(ToastType.Success, "Pagamento via Pix identificado!");
        }, 10000);
        return () => clearTimeout(timeout);
    }
  }, [paymentMethod, pixStatus, addToast]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
  };

  const handleCopyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    addToast(ToastType.Success, "Código Pix Copia e Cola copiado!");
  };

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(pixKeyString);
    addToast(ToastType.Success, "Chave Pix copiada!");
  };

  const handleConfirm = () => {
    if (paymentMethod === 'credit_card') {
        if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
            addToast(ToastType.Error, t('confirmPurchase.pleaseFillCard'));
            return;
        }
    }
    
    setIsProcessing(true);
    // Simulate API processing
    setTimeout(() => {
        setIsProcessing(false);
        onConfirmPurchase(packageDetails);
    }, 1500);
  };

  return (
    <div className="absolute inset-0 bg-[#121212] z-50 flex flex-col text-white font-sans">
      {/* Header */}
      <header className="flex items-center p-4 border-b border-white/5 flex-shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <BackIcon className="w-6 h-6 text-white" />
        </button>
        <h1 className="flex-grow text-center text-lg font-bold">Checkout</h1>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      <main className="flex-grow overflow-y-auto px-5 py-6 space-y-6 no-scrollbar">
        
        {/* Product Card */}
        <div className="bg-[#1E1E1E] rounded-2xl p-4 flex items-center shadow-md border border-white/5">
            <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0 mr-4">
                 <YellowDiamondIcon className="w-10 h-10 text-yellow-400" />
            </div>
            <div className="flex-grow">
                <h3 className="font-bold text-base text-white">{packageDetails.diamonds.toLocaleString('pt-BR')} Diamonds Pack</h3>
                <p className="text-gray-500 text-xs mt-0.5">Order {orderId}</p>
            </div>
            <div className="text-right">
                 <span className="font-bold text-lg">R$ {packageDetails.price.toFixed(2).replace('.', ',')}</span>
            </div>
        </div>

        {/* Payment Method Tabs */}
        <div className="bg-[#1E1E1E] p-1.5 rounded-xl flex border border-white/5">
             <button 
                onClick={() => setPaymentMethod('pix')}
                className={`flex-1 flex items-center justify-center py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                    paymentMethod === 'pix' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
            >
                <PixIcon className={`w-5 h-5 mr-2 ${paymentMethod === 'pix' ? 'text-[#32BCAD]' : 'text-gray-500'}`} />
                Pix
            </button>
            <button 
                onClick={() => setPaymentMethod('credit_card')}
                className={`flex-1 flex items-center justify-center py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                    paymentMethod === 'credit_card' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
            >
                <CreditCardIcon className="w-5 h-5 mr-2" />
                Credit Card
            </button>
        </div>

        {/* Payment Content */}
        {paymentMethod === 'pix' ? (
            <div className="flex flex-col items-center space-y-6 animate-fade-in-up">
                
                {/* Status Pill */}
                <div className="flex flex-col items-center space-y-2">
                    {pixStatus === 'pending' ? (
                        <div className="bg-yellow-500/10 text-yellow-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-2 animate-pulse">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <span>Aguardando Pagamento...</span>
                        </div>
                    ) : (
                        <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
                            <CheckCircleIcon className="w-4 h-4 text-green-400" />
                            <span>Pagamento Confirmado!</span>
                        </div>
                    )}
                    <div className="text-4xl font-bold font-mono tracking-wider text-white">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* QR Code */}
                <div className={`bg-white p-4 rounded-2xl shadow-xl shadow-black/50 transition-all duration-500 ${pixStatus === 'confirmed' ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                     <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}&color=000000&bgcolor=ffffff`}
                        alt="Pix QR Code" 
                        className="w-48 h-48 mix-blend-multiply"
                    />
                </div>
                
                {/* Specific Pix Key Display */}
                <div className="w-full bg-[#1E1E1E] rounded-xl border border-white/5 overflow-hidden">
                    <div className="bg-[#2a2a2c] px-4 py-2 text-xs text-gray-400 font-bold uppercase border-b border-white/5">
                        Chave Pix (E-mail)
                    </div>
                    <div className="flex items-center p-3">
                         <span className="flex-grow text-white font-mono text-sm">{pixKeyString}</span>
                         <button onClick={handleCopyPixKey} className="text-blue-400 hover:text-blue-300 font-bold text-xs uppercase ml-2">
                             Copiar
                         </button>
                    </div>
                </div>

                {/* Copy Pix Code */}
                <div className="w-full space-y-2">
                    <p className="text-xs text-gray-400 font-bold ml-1 uppercase">Pix Copia e Cola</p>
                    <div className="bg-[#1E1E1E] rounded-xl flex items-center p-1 pl-4 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex-grow overflow-hidden mr-3">
                            <p className="text-gray-300 text-xs truncate font-mono select-all opacity-70">
                                {pixCode}
                            </p>
                        </div>
                        <button 
                            onClick={handleCopyPixCode}
                            className="bg-[#32BCAD] hover:bg-[#289e90] text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-lg"
                        >
                            <CopyIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                {pixStatus === 'pending' && (
                    <p className="text-gray-500 text-xs text-center px-4">
                        Faça o pagamento no seu app de banco. <br/>A confirmação é automática.
                    </p>
                )}

            </div>
        ) : (
            <div className="space-y-5 animate-fade-in-up">
                {/* Credit Card Form */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Card Number</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="0000 0000 0000 0000"
                            className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-green-500 focus:outline-none transition-colors placeholder-gray-600 font-mono"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                        />
                        <LockIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Cardholder Name</label>
                    <input 
                        type="text" 
                        placeholder="As written on card"
                        className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-green-500 focus:outline-none transition-colors placeholder-gray-600"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                    />
                </div>

                <div className="flex space-x-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Expiry</label>
                        <input 
                            type="text" 
                            placeholder="MM/YY"
                            className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-green-500 focus:outline-none transition-colors placeholder-gray-600 text-center"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                        />
                    </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide">CVV</label>
                             <QuestionMarkIcon className="w-3 h-3 text-gray-500" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="123"
                            maxLength={4}
                            className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-green-500 focus:outline-none transition-colors placeholder-gray-600 text-center"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        )}

      </main>

      {/* Footer */}
      <footer className="p-5 pb-8 bg-[#121212] border-t border-white/5">
        {paymentMethod === 'pix' && pixStatus === 'pending' ? (
            <div className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl py-4 flex items-center justify-center space-x-3 opacity-80">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-gray-400"></div>
                <span className="text-gray-400 font-semibold text-sm">Aguardando confirmação do banco...</span>
            </div>
        ) : (
             <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className={`w-full bg-[#101827] hover:bg-[#1f2937] text-white border border-white/10 font-bold text-lg py-4 rounded-xl shadow-lg transform transition-all active:scale-[0.98] flex items-center justify-center space-x-2 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''} ${paymentMethod === 'pix' ? 'bg-[#10B981] hover:bg-[#059669] border-transparent' : 'bg-[#10B981] hover:bg-[#059669] border-transparent'}`}
            >
                {isProcessing ? (
                    <span>Processing...</span>
                ) : (
                    paymentMethod === 'pix' ? (
                        <span>Liberar Diamantes Agora</span>
                    ) : (
                        <span>Confirm Purchase</span>
                    )
                )}
            </button>
        )}
       
        <div className="mt-4 flex items-center justify-center text-gray-500 space-x-1.5">
            <LockIcon className="w-3 h-3" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Secure Payment</span>
        </div>
      </footer>
    </div>
  );
};

export default ConfirmPurchaseScreen;
