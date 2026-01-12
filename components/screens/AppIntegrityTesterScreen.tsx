
import React, { useState } from 'react';
import { appAuditor, ComponentAudit } from '../../services/appAuditor';
import { ChevronLeftIcon, CheckIcon, CloseIcon, PlayIcon, ShieldIcon, DatabaseIcon, CpuIcon, LinkIcon } from '../icons';
import { LoadingSpinner } from '../Loading';

export default function AppIntegrityTesterScreen({ onClose }: { onClose: () => void }) {
    const [auditResults, setAuditResults] = useState<ComponentAudit[]>([]);
    const [isAuditing, setIsAuditing] = useState(false);
    
    const [mochaApiResults, setMochaApiResults] = useState<ComponentAudit[]>([]);
    const [isMochaScanning, setIsMochaScanning] = useState(false);

    const handleStartAudit = async () => {
        setIsAuditing(true);
        const data = await appAuditor.runFullAppAudit();
        setAuditResults(data);
        setIsAuditing(false);
    };

    const handleStartMochaScan = async () => {
        setIsMochaScanning(true);
        // A mesma função de auditoria pode ser usada, a apresentação dos dados que muda.
        const data = await appAuditor.runFullAppAudit();
        setMochaApiResults(data);
        setIsMochaScanning(false);
    };

    const auditSuccessCount = auditResults.filter(r => r.status === 'ok').length;
    const auditFailCount = auditResults.filter(r => r.status === 'fail').length;

    const mochaConnectedCount = mochaApiResults.filter(r => r.apiDependencies.length > 0 && r.callVerified).length;
    const mochaDisconnectedCount = mochaApiResults.filter(r =>  r.apiDependencies.length > 0 && !r.callVerified).length;
    const mochaNoApiCount = mochaApiResults.filter(r => r.apiDependencies.length === 0).length;

    return (
        <div className="fixed inset-0 z-[170] bg-[#050505] flex flex-col font-sans animate-in slide-in-from-right duration-300 overflow-hidden">
            {/* Header Super Clean */}
            <header className="flex items-center justify-between p-6 shrink-0">
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full active:scale-90 transition-transform">
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <div className="text-center">
                    <h1 className="text-white font-black text-[11px] uppercase tracking-[0.4em] opacity-80">Integridade LiveGo</h1>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="text-[9px] text-emerald-400 font-black uppercase tracking-tighter">Perícia de Código Ativa</span>
                    </div>
                </div>
                <div className="w-10"></div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-6">
                
                {/* MONITOR 1: INTEGRIDADE DO APP */}
                <div className="py-8 flex flex-col items-center">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <CpuIcon className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-white text-xl font-black uppercase tracking-tighter mb-2">Scanner de Componentes</h2>
                    <p className="text-gray-500 text-[10px] font-medium text-center max-w-[260px] leading-relaxed">
                        Auditando a fiação entre as telas e a API. Verificamos se as importações estão corretas e se os dados estão fluindo.
                    </p>
                </div>

                <button 
                    onClick={handleStartAudit}
                    disabled={isAuditing}
                    className="w-full bg-emerald-500 text-black font-black text-xs uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                >
                    {isAuditing ? <LoadingSpinner /> : <PlayIcon className="w-4 h-4 fill-current" />}
                    {isAuditing ? 'Rastreando Dependências...' : 'Iniciar Auditoria de Código'}
                </button>

                {auditResults.length > 0 && (
                    <div className="animate-in fade-in duration-500">
                        <div className="grid grid-cols-2 gap-3 mt-6 mb-10">
                            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex flex-col items-center">
                                <span className="text-emerald-400 text-2xl font-black">{auditSuccessCount}</span>
                                <span className="text-[9px] text-gray-500 font-bold uppercase">Saudáveis</span>
                            </div>
                            <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl flex flex-col items-center">
                                <span className="text-red-400 text-2xl font-black">{auditFailCount}</span>
                                <span className="text-[9px] text-gray-500 font-bold uppercase">Falhas</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-gray-600 text-[9px] font-black uppercase tracking-widest px-1">Relatório Técnico</h3>
                            <div className="space-y-2">
                                {auditResults.map((comp, idx) => (
                                    <div key={idx} className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-white text-[13px] font-bold tracking-tight">{comp.name}</span>
                                                <span className="text-gray-600 text-[9px] font-mono mt-0.5 truncate max-w-[200px]">{comp.apiDependencies.join(', ')}</span>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${comp.status === 'ok' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {comp.status}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <AuditPill label="Import" active={comp.importVerified} />
                                            <AuditPill label="Call" active={comp.callVerified} />
                                            <AuditPill label="Data" active={comp.payloadValid} />
                                        </div>
                                        {comp.errorLog && (
                                            <div className="mt-3 p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                                                <p className="text-red-400 text-[9px] font-mono leading-tight">{comp.errorLog}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* SEPARADOR */}
                <div className="w-full h-px bg-white/5 my-12"></div>

                {/* MONITOR 2: STATUS DA API MOCHA */}
                <div className="py-8 flex flex-col items-center">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                        <DatabaseIcon className="w-10 h-10 text-blue-400" />
                    </div>
                    <h2 className="text-white text-xl font-black uppercase tracking-tighter mb-2">Status da API Mocha</h2>
                    <p className="text-gray-500 text-[10px] font-medium text-center max-w-[260px] leading-relaxed">
                        Verifica se cada componente está conseguindo se comunicar com a API em tempo real.
                    </p>
                </div>
                
                <button 
                    onClick={handleStartMochaScan}
                    disabled={isMochaScanning}
                    className="w-full bg-blue-500 text-white font-black text-xs uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50"
                >
                    {isMochaScanning ? <LoadingSpinner /> : <PlayIcon className="w-4 h-4 fill-current" />}
                    {isMochaScanning ? 'Verificando Conexões...' : 'Escanear Conexões da API'}
                </button>

                {mochaApiResults.length > 0 && (
                     <div className="animate-in fade-in duration-500">
                        <div className="grid grid-cols-3 gap-3 mt-6 mb-10">
                            <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl flex flex-col items-center">
                                <span className="text-emerald-400 text-2xl font-black">{mochaConnectedCount}</span>
                                <span className="text-[9px] text-gray-500 font-bold uppercase">Conectados</span>
                            </div>
                            <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-2xl flex flex-col items-center">
                                <span className="text-red-400 text-2xl font-black">{mochaDisconnectedCount}</span>
                                <span className="text-[9px] text-gray-500 font-bold uppercase">Offline</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col items-center">
                                <span className="text-gray-400 text-2xl font-black">{mochaNoApiCount}</span>
                                <span className="text-[9px] text-gray-500 font-bold uppercase">Sem API</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {mochaApiResults.map((comp, idx) => {
                                let statusText = "Não Utiliza API";
                                let statusColor = "bg-gray-500/10 text-gray-500";
                                let StatusIcon = LinkIcon;
                                
                                if (comp.apiDependencies.length > 0) {
                                    if (comp.callVerified) {
                                        statusText = "API Conectada";
                                        statusColor = "bg-emerald-500/10 text-emerald-400";
                                        StatusIcon = CheckIcon;
                                    } else {
                                        statusText = "API Desconectada";
                                        statusColor = "bg-red-500/10 text-red-400";
                                        StatusIcon = CloseIcon;
                                    }
                                }

                                return (
                                <div key={`mocha-${idx}`} className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                                    <span className="text-white text-[13px] font-bold tracking-tight">{comp.name}</span>
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${statusColor}`}>
                                        <StatusIcon className="w-3 h-3"/>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{statusText}</span>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none flex justify-center">
                <div className="flex items-center gap-2 opacity-30">
                    <ShieldIcon className="w-3 h-3 text-gray-500" />
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest font-mono">Component Integrity System</span>
                </div>
            </div>
        </div>
    );
}

function AuditPill({ label, active }: { label: string, active: boolean }) {
    return (
        <div className={`flex items-center justify-center gap-1.5 py-1.5 rounded-full border ${active ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-red-500/5 border-red-500/10 text-red-400'}`}>
            {active ? <CheckIcon className="w-2.5 h-2.5" /> : <CloseIcon className="w-2.5 h-2.5" />}
            <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
        </div>
    );
}