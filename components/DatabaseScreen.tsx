
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeftIcon, DatabaseIcon, CheckIcon, CloseIcon, PlayIcon, LinkIcon } from './icons';
import { ToastType } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';

interface DatabaseScreenProps {
    onClose: () => void;
    addToast: (type: ToastType, message: string) => void;
}

interface CollectionStatus {
    name: string;
    exists: boolean;
}

const DatabaseScreen: React.FC<DatabaseScreenProps> = ({ onClose, addToast }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [statusText, setStatusText] = useState("Conectando ao backend...");
    const [scanResult, setScanResult] = useState<{ collections: CollectionStatus[], requiredCount: number } | null>(null);

    const checkStatus = useCallback(async () => {
        setIsLoading(true);
        setScanResult(null); 
        try {
            setStatusText("Escaneando 112 APIs para dependências...");
            const requiredCollections = await api.db.getRequiredCollections();
            
            setStatusText("Verificando coleções existentes no MongoDB...");
            const existingCollections = await api.db.checkCollections();
            
            if (!Array.isArray(requiredCollections) || !Array.isArray(existingCollections)) {
                throw new Error("A API não retornou listas de coleções válidas.");
            }
            
            const collectionStatus: CollectionStatus[] = requiredCollections.map(name => ({
                name,
                exists: existingCollections.includes(name)
            })).sort((a, b) => a.name.localeCompare(b.name));

            setScanResult({ collections: collectionStatus, requiredCount: requiredCollections.length });
            setStatusText("Verificação concluída.");
        } catch (error: any) {
            addToast(ToastType.Error, error.message || "Falha ao conectar com a API do banco.");
            setScanResult(null);
            setStatusText("Erro na verificação.");
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    const handleSync = async () => {
        setIsLoading(true);
        setStatusText("Enviando comando para criar banco completo...");
        addToast(ToastType.Info, "Sincronizando banco de dados...");
        try {
            const result = await api.db.setupDatabase();
            addToast(ToastType.Success, result.message || "Banco de dados sincronizado com sucesso!");
            await checkStatus(); 
        } catch (error: any) {
            addToast(ToastType.Error, error.message || "Erro ao sincronizar banco de dados.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const missingCount = useMemo(() => scanResult?.collections.filter(c => !c.exists).length || 0, [scanResult]);

    return (
        <div className="fixed inset-0 z-[150] bg-[#121212] flex flex-col font-sans animate-in slide-in-from-right duration-300">
            <header className="flex items-center justify-between p-4 border-b border-white/10 bg-[#1C1C1E] shrink-0">
                <button onClick={onClose}><ChevronLeftIcon className="w-6 h-6 text-white" /></button>
                <h1 className="text-white font-bold text-lg">Database Monitor</h1>
                <div className="w-6"></div>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-[#1C1C1E] rounded-2xl p-6 border border-white/10 mb-6 text-center">
                    <DatabaseIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <h2 className="text-white font-bold text-lg">Setup do Banco de Dados Real</h2>
                    <p className="text-gray-400 text-xs mt-2 max-w-sm mx-auto">
                        Esta ferramenta escaneia as 112 APIs, detecta todas as coleções necessárias e as cria no seu banco de dados MongoDB real configurado no backend.
                    </p>
                </div>
                
                <div className="mb-6">
                    <h3 className="text-gray-300 font-bold text-sm mb-2">URL de Conexão (Configurada no Backend)</h3>
                    <div className="relative">
                        <input 
                            type="text"
                            value="mongodb://localhost:27017/livego"
                            disabled
                            className="w-full bg-[#1C1C1E] text-gray-500 p-3 pl-10 rounded-xl text-xs outline-none border border-white/10 font-mono"
                        />
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    </div>
                     <p className="text-gray-600 text-[10px] mt-2 px-1">A URL de conexão real é configurada de forma segura no arquivo <code className="bg-white/10 p-1 rounded">.env</code> do backend para proteção.</p>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-gray-300 font-bold text-sm">Status das Coleções ({scanResult?.requiredCount || 0} detectadas)</h3>
                        {missingCount > 0 && <span className="text-red-400 text-xs font-bold bg-red-500/10 px-2 py-1 rounded-full animate-pulse">{missingCount} FALTANDO</span>}
                        {missingCount === 0 && scanResult && <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-full">BANCO COMPLETO</span>}
                    </div>

                    <div className="bg-[#1C1C1E] rounded-xl border border-white/10 max-h-64 overflow-y-auto scrollbar-hide">
                        {isLoading && !scanResult ? (
                            <div className="p-10 flex flex-col items-center justify-center gap-4">
                                <LoadingSpinner />
                                <span className="text-purple-400 text-xs font-bold">{statusText}</span>
                            </div>
                        ) : !scanResult ? (
                             <div className="p-10 text-center text-gray-500">{statusText}</div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {scanResult.collections.map(col => (
                                    <div key={col.name} className="flex items-center justify-between p-3">
                                        <span className="font-mono text-sm text-gray-300">{col.name}</span>
                                        {col.exists ? (
                                            <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
                                                <CheckIcon className="w-4 h-4" /> OK
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                                                <CloseIcon className="w-4 h-4" /> Faltando
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <footer className="p-4 bg-[#1C1C1E] border-t border-white/10">
                <button 
                    onClick={handleSync}
                    disabled={isLoading || missingCount === 0}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-purple-900/30 transition-all active:scale-95 disabled:opacity-50 disabled:from-gray-600 disabled:to-gray-700 disabled:shadow-none"
                >
                    {isLoading ? <LoadingSpinner /> : <PlayIcon className="w-6 h-6" />}
                    {missingCount > 0 ? `Criar Banco Completo (${missingCount} coleções)` : 'Banco de Dados Sincronizado'}
                </button>
            </footer>
        </div>
    );
};

export default DatabaseScreen;
