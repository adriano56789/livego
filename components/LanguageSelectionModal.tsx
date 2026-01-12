import React from 'react';
import { CloseIcon, BrazilFlagIcon, USAFlagIcon, SpainFlagIcon, VietnamFlagIcon, IndiaFlagIcon, CheckIcon } from './icons';
import { useTranslation } from '../i18n';
import { api } from '../services/api';

interface Language {
    code: string;
    name: string;
    icon: React.ReactNode;
}

interface LanguageSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({ isOpen, onClose }) => {
    // FIX: Add conditional rendering based on the isOpen prop.
    if (!isOpen) return null;
    
    const { language, setLanguage } = useTranslation();

    const languages: Language[] = [
        { code: 'pt', name: 'Português (Brasil)', icon: <BrazilFlagIcon className="w-6 h-6 rounded-sm" /> },
        { code: 'en', name: 'English (US)', icon: <USAFlagIcon className="w-6 h-6 rounded-sm" /> },
        { code: 'es', name: 'Español', icon: <SpainFlagIcon className="w-6 h-6 rounded-sm" /> },
        { code: 'vn', name: 'Tiếng Việt', icon: <VietnamFlagIcon className="w-6 h-6 rounded-sm" /> },
        { code: 'in', name: 'हिन्दी', icon: <IndiaFlagIcon className="w-6 h-6 rounded-sm" /> },
    ];

    const handleSelect = async (code: string) => {
        try {
            // Sincroniza com a API Mocha
            await api.users.setLanguage(code);
            // Atualiza o contexto global
            setLanguage(code);
            onClose();
        } catch (err) {
            console.error("Falha ao salvar idioma na API Mocha");
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
            <div 
                className="bg-[#1C1C1E] w-full max-w-md rounded-t-[32px] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom duration-300 border-t border-white/10 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>

                <div className="flex items-center justify-between p-6 pt-2 border-b border-white/5 bg-[#1C1C1E] shrink-0">
                    <h2 className="text-white font-black text-lg tracking-tight">Selecionar Idioma</h2>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full active:scale-90 transition-transform">
                        <CloseIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                
                <div className="p-2 pb-12 max-h-[60vh] overflow-y-auto no-scrollbar bg-[#1C1C1E]">
                    {languages.map(lang => {
                        const isSelected = language === lang.code;
                        return (
                            <button 
                                key={lang.code}
                                onClick={() => handleSelect(lang.code)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:bg-white/10 group ${isSelected ? 'bg-white/5' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 group-active:scale-90 transition-transform">
                                    {lang.icon}
                                </div>
                                <span className={`text-sm flex-1 text-left font-bold ${isSelected ? 'text-[#A855F7]' : 'text-white'}`}>{lang.name}</span>
                                {isSelected && (
                                    <div className="w-6 h-6 bg-[#A855F7]/20 rounded-full flex items-center justify-center">
                                        <CheckIcon className="w-3.5 h-3.5 text-[#A855F7]" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default LanguageSelectionModal;