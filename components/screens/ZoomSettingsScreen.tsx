import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon } from '../icons';
import { User, ToastType } from '../../types';
import { api } from '../../services/api';

interface ZoomSettingsScreenProps {
    onClose: () => void;
    currentUser: User;
    updateUser: (user: User) => void;
    addToast: (type: ToastType, message: string) => void;
}

const ZoomSettingsScreen: React.FC<ZoomSettingsScreenProps> = ({ onClose, currentUser, updateUser, addToast }) => {
    const [zoomLevel, setZoomLevel] = useState(currentUser.uiSettings?.zoomLevel || 100);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            if (zoomLevel !== (currentUser.uiSettings?.zoomLevel || 100)) {
                try {
                    const { success, user } = await api.users.updateUiSettings({ zoomLevel });
                    if (success && user) {
                        updateUser(user);
                        addToast(ToastType.Success, 'Preferência de zoom salva!');
                    }
                } catch (error) {
                    addToast(ToastType.Error, 'Falha ao salvar a preferência de zoom.');
                }
            }
        }, 500); // 500ms debounce

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [zoomLevel, currentUser.uiSettings?.zoomLevel, updateUser, addToast]);

    return (
        <div className="fixed inset-0 z-[150] bg-[#121212] flex flex-col font-sans animate-in slide-in-from-right duration-300">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-white/5">
                <button onClick={onClose}><ChevronLeftIcon className="w-6 h-6 text-white" /></button>
                <div className="flex-grow text-center mr-6"><h1 className="text-lg font-bold text-white">Ajuste de Zoom da Interface</h1></div>
            </header>
            <div className="p-8 flex flex-col items-center justify-center flex-1">
                <span className="text-gray-400 text-sm mb-4">Arraste para ajustar o tamanho da interface</span>
                <div className="w-full flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-500">80%</span>
                    <input 
                        type="range" 
                        min="80"
                        max="120"
                        step="5"
                        value={zoomLevel}
                        onChange={(e) => setZoomLevel(parseInt(e.target.value, 10))}
                        className="w-full accent-purple-500" 
                    />
                    <span className="text-xs font-bold text-gray-500">120%</span>
                </div>
                 <div className="mt-6 text-white text-4xl font-black transition-all" style={{ fontSize: `${(zoomLevel / 100) * 2.25}rem` }}>
                    {zoomLevel}%
                </div>
            </div>
        </div>
    );
};

export default ZoomSettingsScreen;
