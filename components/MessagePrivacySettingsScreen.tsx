import React, { useState, useEffect } from 'react';
import type { User, PrivacySettings } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import CheckIcon from './icons/CheckIcon';

interface MessagePrivacySettingsScreenProps {
    user: User;
    onExit: () => void;
    onSave: (settings: Partial<Omit<PrivacySettings, 'userId'>>) => Promise<void>;
}

type Option = 'everyone' | 'mutuals';

const MessagePrivacySettingsScreen: React.FC<MessagePrivacySettingsScreenProps> = ({ user, onExit, onSave }) => {
    const [selectedOption, setSelectedOption] = useState<Option>('everyone');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [initialSetting, setInitialSetting] = useState<Option>('everyone');

    useEffect(() => {
        setIsLoading(true);
        liveStreamService.getPrivacySettings(user.id)
            .then(settings => {
                const currentSetting = settings.messagePrivacy || 'everyone';
                setSelectedOption(currentSetting);
                setInitialSetting(currentSetting);
            })
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, [user.id]);
    
    const handleSave = async () => {
        setIsSaving(true);
        await onSave({ messagePrivacy: selectedOption });
        // isSaving will be false when the component unmounts on exit.
    };

    const hasChanges = selectedOption !== initialSetting;

    const renderOption = (option: Option, title: string, description?: string) => (
        <button onClick={() => setSelectedOption(option)} className="w-full flex justify-between items-start px-4 py-4 text-left">
            <div>
                <span className="text-white">{title}</span>
                {description && <p className="text-sm text-gray-400 mt-1 pr-4">{description}</p>}
            </div>
            {selectedOption === option && <CheckIcon className="w-6 h-6 text-purple-400 mt-1 shrink-0" />}
        </button>
    );

    return (
        <div className="h-screen w-full bg-[#1c1c1c] text-white flex flex-col font-sans">
            <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800/50 relative">
                <button onClick={onExit} className="p-2 -m-2 z-10"><ArrowLeftIcon className="w-6 h-6" /></button>
                <h1 className="font-semibold text-lg absolute left-1/2 -translate-x-1/2 whitespace-nowrap">Quem pode me enviar men...</h1>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving || !hasChanges}
                    className="font-semibold text-lg text-purple-400 hover:text-purple-300 disabled:text-gray-500 z-10"
                >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
            </header>
            <main className="flex-grow pt-2">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800/50">
                        {renderOption('everyone', 'Todos')}
                        {renderOption('mutuals', 'Apenas seguidores mútuos', 'Não receberá mais mensagens de estranhos, mas ainda pode receber presentes')}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MessagePrivacySettingsScreen;
