
import React from 'react';

const Placeholder = ({ name }: { name: string }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 text-white p-4">
        <div className="bg-[#1C1C1E] p-6 rounded-xl border border-white/10 text-center">
            <h2 className="text-xl font-bold mb-2 text-[#a855f7]">{name}</h2>
            <p className="text-gray-400 text-sm">Este recurso estará disponível em breve.</p>
            <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-gray-700 rounded-full text-xs font-bold hover:bg-gray-600"
            >
                Fechar / Recarregar
            </button>
        </div>
    </div>
);

// Mantemos apenas o que REALMENTE ainda não foi feito
export const FAQScreen = (props: any) => <Placeholder name="FAQ" />;
export const CameraPermissionModal = (props: any) => <Placeholder name="Permissões" />;
export const LocationPermissionModal = (props: any) => <Placeholder name="Localização" />;
export const PipSettingsModal = (props: any) => <Placeholder name="Configurações PIP" />;
export const LiveHistoryScreen = (props: any) => <Placeholder name="Histórico da Live" />;
export const LanguageSelectionModal = (props: any) => <Placeholder name="Idiomas" />;
export const MusicDetailScreen = (props: any) => <Placeholder name="Detalhes da Música" />;
