import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeftIcon, BankIcon, MailIcon, EditIcon, HistoryIcon, RefreshIcon, CloseIcon, ArrowUpIcon, ArrowDownIcon } from './icons';
import { User, PurchaseRecord, ToastType } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';

interface AdminWalletScreenProps {
    onClose: () => void;
    user: User;
    addToast?: (type: ToastType, message: string) => void;
}

const EditMethodModal = ({ currentEmail, onSave, onClose }: { currentEmail: string, onSave: (email: string) => void, onClose: () => void }) => {
    const [email, setEmail] = useState(currentEmail);

    return (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="w-full bg-[#1C1C1E] rounded-t-2xl p-5 animate-in slide-in-from-bottom duration-300 pb-8 shadow-2xl border-t border-white/10" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-bold text-base">Editar Método de Saque</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
                        <CloseIcon className="text-gray-400 w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-gray-400 text-xs font-bold mb-2 block">Chave PIX / E-mail</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#2C2C2E] text-white p-4 rounded-xl outline-none border border-white/5 focus:border-[#A855F7] transition-colors"
                            placeholder="seu.email@exemplo.com"
                            autoFocus
                        />
                    </div>
                    <button 
                        onClick={() => onSave(email)}
                        className="w-full bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold py-3.5 rounded-full transition-colors shadow-lg active:scale-95"
                    >
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminWalletScreen: React.FC<AdminWalletScreenProps> = ({ onClose, user, addToast }) => {
    const [activeTab, setActiveTab] = useState<'Todos' | 'Taxas Recebidas' | 'Saques Efetuados'>('Todos');
    const [history, setHistory] = useState<PurchaseRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ available: 0, totalFees: 0, totalWithdrawn: 0 });
    
    const [withdrawalEmail, setWithdrawalEmail] = useState(
        user.withdrawal_method?.details?.email || 'admin@livego.com'
    );
    const [isEditingEmail, setIsEditingEmail] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [updatedUser, recordsDataResponse] = await Promise.all([
                api.users.me(),
                api.admin.getAdminWithdrawalHistory()
            ]);
            
            // Comment: Cast to any to allow property access on wrapped API response.
            const recordsData: any = recordsDataResponse;

            // Validação rigorosa de array para o histórico
            const safeRecords: PurchaseRecord[] = Array.isArray(recordsData) 
                ? recordsData 
                : (recordsData?.data && Array.isArray(recordsData.data) ? recordsData.data : []);

            const totalFees = safeRecords
                .filter(r => r.type === 'fee')
                .reduce((sum, r) => sum + (r.amountBRL || 0), 0);
            
            const totalWithdrawn = safeRecords
                .filter(r => r.type === 'withdrawal' && r.status === 'Concluído')
                .reduce((sum, r) => sum + (r.amountBRL || 0), 0);

            if (updatedUser) {
                setStats({
                    available: updatedUser.platformEarnings || 0,
                    totalFees,
                    totalWithdrawn
                });
                if (updatedUser.withdrawal_method?.details?.email) {
                    setWithdrawalEmail(updatedUser.withdrawal_method.details.email);
                }
            }
            
            setHistory([...safeRecords].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } catch (error) {
            console.error("[AdminWallet] Falha ao carregar:", error);
            if (addToast) addToast(ToastType.Error, "Falha ao sincronizar dados administrativos.");
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadData();
    }, [activeTab, loadData]);

    const handleWithdraw = async () => {
        if (stats.available <= 0) return;
        try {
            const res = await api.admin.withdraw.request(stats.available);
            if (res.success) {
                if (addToast) addToast(ToastType.Success, "Saque solicitado com sucesso!");
                await loadData();
            }
        } catch (error) {
            if (addToast) addToast(ToastType.Error, "Falha ao solicitar saque.");
        }
    };

    const handleSaveEmail = async (newEmail: string) => {
        try {
            const res = await api.admin.saveAdminWithdrawalMethod({ type: 'email', email: newEmail });
            if (res.success) {
                setWithdrawalEmail(newEmail);
                setIsEditingEmail(false);
                if (addToast) addToast(ToastType.Success, "Método de saque atualizado!");
            }
        } catch (error) {
            if (addToast) addToast(ToastType.Error, "Erro ao salvar e-mail.");
        }
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatCurrency = (val: number | undefined) => (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const filteredHistory = useMemo(() => {
        if (!Array.isArray(history)) return [];
        if (activeTab === 'Taxas Recebidas') return history.filter(item => item.type === 'fee');
        if (activeTab === 'Saques Efetuados') return history.filter(item => item.type === 'withdrawal');
        return history;
    }, [history, activeTab]);

    return (
        <div className="fixed inset-0 bg-[#121212] z-[120] flex flex-col font-sans">
            <div className="flex items-center justify-between p-4 bg-[#121212] z-10 shrink-0">
                <button onClick={onClose} className="p-1"><ChevronLeftIcon className="text-white w-6 h-6" /></button>
                <span className="font-bold text-white text-base">Carteira do Administrador</span>
                <button onClick={loadData} className="p-1"><RefreshIcon className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-6">
                {loading && !stats.available ? <div className="flex justify-center pt-20"><LoadingSpinner/></div> : (
                    <>
                        <div className="bg-gradient-to-r from-[#6366F1] to-[#3B82F6] rounded-2xl p-6 relative shadow-lg mt-2">
                            <span className="text-white/90 text-xs font-medium mb-1">Saldo Disponível para Saque</span>
                            <span className="text-4xl font-black text-white tracking-wide">{formatCurrency(stats.available)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#1C1C1E] border border-white/5 rounded-xl p-4 flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-xs text-green-400 font-bold"><ArrowUpIcon className="w-4 h-4" /> <span>Total Arrecadado (Taxas)</span></div>
                                <span className="text-white font-bold text-2xl">{formatCurrency(stats.totalFees)}</span>
                            </div>
                             <div className="bg-[#1C1C1E] border border-white/5 rounded-xl p-4 flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-xs text-orange-400 font-bold"><ArrowDownIcon className="w-4 h-4" /> <span>Total Sacado (Admin)</span></div>
                                <span className="text-white font-bold text-2xl">{formatCurrency(stats.totalWithdrawn)}</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2 px-1">
                                <h3 className="text-white font-bold text-sm">Método de Saque</h3>
                                <button onClick={() => setIsEditingEmail(true)} className="text-[#A855F7] text-xs font-bold flex items-center gap-1"><EditIcon className="w-3 h-3" /> Editar</button>
                            </div>
                            <div className="bg-[#1C1C1E] rounded-xl p-4 flex items-center gap-3 border border-white/5">
                                <MailIcon className="w-5 h-5 text-gray-500" />
                                <span className="text-gray-300 text-sm font-medium">{withdrawalEmail}</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-4 px-1"><HistoryIcon className="w-4 h-4 text-gray-400" /><h3 className="text-white font-bold text-sm">Histórico de Transações</h3></div>
                            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                                {(['Todos', 'Taxas Recebidas', 'Saques Efetuados'] as const).map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${activeTab === tab ? 'bg-[#A855F7] text-white' : 'bg-[#1C1C1E] text-gray-400'}`}>{tab}</button>
                                ))}
                            </div>
                            <div className="flex flex-col space-y-2">
                                {filteredHistory.length === 0 ? <div className="text-center text-gray-500 text-xs py-10">Nenhum registro encontrado.</div>
                                : filteredHistory.map(item => (
                                    <div key={item.id} className="flex justify-between items-center bg-[#1C1C1E] p-3 rounded-lg">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-white font-bold text-sm">{item.type === 'fee' ? 'Taxa de Saque' : 'Saque para Admin'}</span>
                                            <span className="text-gray-500 text-[10px]">{item.relatedUserName ? `de: ${item.relatedUserName} | ` : ''}{formatDate(item.timestamp)}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`font-bold text-sm ${item.type === 'fee' ? 'text-green-400' : 'text-orange-400'}`}>{item.type === 'fee' ? '+' : '-'} {formatCurrency(item.amountBRL)}</span>
                                            <span className={`text-[10px] font-bold uppercase ${item.status === 'Concluído' ? 'text-green-500' : item.status === 'Pendente' ? 'text-yellow-500' : 'text-red-500'}`}>{item.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="p-4 bg-gradient-to-t from-black/50 to-transparent absolute bottom-0 left-0 right-0">
                <button onClick={handleWithdraw} disabled={stats.available <= 0} className={`w-full font-bold py-4 rounded-xl text-sm shadow-lg ${stats.available > 0 ? 'bg-[#00C853] text-white' : 'bg-[#2C2C2E] text-gray-500 cursor-not-allowed'}`}>Sacar {formatCurrency(stats.available)}</button>
            </div>

            {isEditingEmail && <EditMethodModal currentEmail={withdrawalEmail} onSave={handleSaveEmail} onClose={() => setIsEditingEmail(false)} />}
        </div>
    );
};

export default AdminWalletScreen;