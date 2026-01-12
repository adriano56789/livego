

import React, { useState, useEffect, useMemo } from 'react';
import { integrityScanner, ApiTestResult } from '../../services/integrityScanner';
import { ChevronLeftIcon, CheckIcon, CloseIcon, PlayIcon, ShieldIcon, DatabaseIcon, CpuIcon, RefreshIcon, CopyIcon } from '../icons';
import { LoadingSpinner } from '../Loading';

export default function FullApiCheckupScreen({ onClose }: { onClose: () => void }) {
    const [results, setResults] = useState<ApiTestResult[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [filter, setFilter] = useState<'all' | 'fail'>('all');
    const [copiedAll, setCopiedAll] = useState(false);

    const handleStartScan = async () => {
        setResults([]);
        setIsScanning(true);
        await integrityScanner.runFullScan((res) => {
            setResults(prev => [...prev, res]);
        });
        setIsScanning(false);
    };

    const stats = useMemo(() => {
        const totalEndpoints = 112; // Total de endpoints definidos
        const totalScanned = results.length;
        const passed = results.filter(r => r.dataStatus === 'ok').length;
        const failed = results.filter(r => r.dataStatus === 'fail').length;
        const progress = totalEndpoints > 0 ? Math.round((totalScanned / totalEndpoints) * 100) : 0;
        return { total: totalScanned, passed, failed, progress };
    }, [results]);

    const filteredResults = useMemo(() => {
        if (filter === 'fail') return results.filter(r => r.dataStatus === 'fail');
        return results;
    }, [results, filter]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const copyFailureReport = () => {
        const failures = results.filter(r => r.dataStatus === 'fail');
        if (failures.length === 0) return;

        const report = failures.map(f => (
            `GRUPO: ${f.group}\nPATH: ${f.path}\nERRO: ${f.error || 'Falha de resposta/dados'}\n-------------------`
        )).join('\n');

        copyToClipboard(`RELATÓRIO DE INTEGRIDADE LIVEGO (112 PONTOS)\nDATA: ${new Date().toLocaleString()}\n\n${report}`);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[#020202] flex flex-col font-mono animate-in fade-in duration-500 overflow-hidden">
            {/* Header Pericial */}
            <header className="flex items-center justify-between p-6 border-b border-white/5 bg-black/50 backdrop-blur-xl shrink-0">
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl active:scale-90 transition-transform">
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <div className="text-center">
                    <h1 className="text-white font-black text-xs uppercase tracking-[0.5em]">System Forensics</h1>
                    <p className="text-[9px] text-emerald-500 font-bold mt-1">Sonda de Integridade: 112 Pontos de API</p>
                </div>
                <button onClick={handleStartScan} disabled={isScanning} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl active:rotate-180 transition-all duration-700">
                    <RefreshIcon className={`w-5 h-5 ${isScanning ? 'animate-spin text-emerald-500' : 'text-gray-400'}`} />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                
                {/* Gauge de Progresso e Stats */}
                <div className="p-8 flex flex-col items-center">
                    <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                            <circle 
                                cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                strokeDasharray={552}
                                strokeDashoffset={552 - (552 * stats.progress) / 100}
                                className="text-emerald-500 transition-all duration-300"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {isScanning && stats.progress < 100 ? (
                                <div className="flex flex-col items-center gap-2">
                                    <LoadingSpinner />
                                    <span className="text-emerald-400 font-bold text-lg">{stats.progress}%</span>
                                </div>
                            ) : (
                                <>
                                    <span className="text-4xl font-black text-white">{stats.progress}%</span>
                                    <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
                                        {stats.failed > 0 && results.length > 0 ? `${stats.failed} Falhas` : 'Completo'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
                        <div className="text-center">
                            <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Total</p>
                            <p className="text-lg font-black text-white">{results.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] text-emerald-500 uppercase font-bold mb-1">Passou</p>
                            <p className="text-lg font-black text-emerald-400">{stats.passed}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] text-red-500 uppercase font-bold mb-1">Falhou</p>
                            <p className="text-lg font-black text-red-400">{stats.failed}</p>
                        </div>
                    </div>
                </div>

                {/* Filtros e Ação de Cópia */}
                <div className="px-6 mb-6 space-y-4">
                    <div className="flex gap-2">
                        <button onClick={() => setFilter('all')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white text-black' : 'bg-white/5 text-gray-500'}`}>Todos</button>
                        <button onClick={() => setFilter('fail')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'fail' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-white/5 text-gray-500'}`}>Somente Falhas</button>
                    </div>

                    {stats.failed > 0 && (
                        <button 
                            onClick={copyFailureReport}
                            className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 border border-red-500/30 text-[10px] font-black uppercase tracking-widest transition-all ${copiedAll ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-red-500/10 text-red-500 active:scale-95'}`}
                        >
                            {copiedAll ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                            {copiedAll ? 'Copiado para o Clipboard!' : 'Copiar Relatório de Falhas'}
                        </button>
                    )}
                </div>

                {/* Lista de Resultados */}
                <div className="px-6 space-y-2">
                    {results.length === 0 && !isScanning && (
                        <div className="py-20 text-center opacity-30 flex flex-col items-center">
                            <CpuIcon className="w-12 h-12 mb-4" />
                            <p className="text-xs uppercase tracking-widest">Aguardando Início do Diagnóstico...</p>
                        </div>
                    )}

                    {filteredResults.map((res, idx) => (
                        <div key={idx} className="bg-[#0A0A0A] border border-white/5 rounded-xl p-4 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-gray-500 text-[8px] font-bold uppercase tracking-tighter mb-0.5">{res.group}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white text-xs font-bold tracking-tight truncate">{res.path}</span>
                                        <button onClick={() => copyToClipboard(res.path)} className="text-gray-600 hover:text-white transition-colors active:scale-75">
                                            <CopyIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <div className={`text-[10px] font-black shrink-0 ${res.dataStatus === 'ok' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {res.dataStatus === 'ok' ? 'ONLINE' : 'OFFLINE'}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <StatusPill label="Import" status={res.importStatus} />
                                <StatusPill label="Call" status={res.callStatus} />
                                <StatusPill label="Data" status={res.dataStatus} />
                            </div>

                            {res.error && (
                                <div className="group relative mt-3 p-2 bg-red-500/5 rounded border border-red-500/10 cursor-pointer active:bg-red-500/10 transition-colors"
                                     onClick={() => copyToClipboard(res.error || '')}>
                                    <p className="text-red-400 text-[9px] leading-tight break-words select-text">{res.error}</p>
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CopyIcon className="w-2.5 h-2.5 text-red-400" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Ação Principal Foguete */}
            {!isScanning && results.length === 0 && (
                <div className="absolute bottom-10 left-6 right-6">
                    <button 
                        onClick={handleStartScan}
                        className="w-full bg-emerald-500 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl shadow-emerald-500/20"
                    >
                        <PlayIcon className="w-5 h-5 fill-current" />
                        INICIAR CHECKUP DE 112 PONTOS
                    </button>
                </div>
            )}
            
            {/* Overlay de Scan em tempo real */}
            {isScanning && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-[loading_1s_infinite]" style={{ width: '30%' }}></div>
                </div>
            )}
        </div>
    );
}

function StatusPill({ label, status }: { label: string, status: 'ok' | 'fail' }) {
    return (
        <div className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md border ${status === 'ok' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
            <span className="text-[7px] font-black uppercase tracking-tighter">{label}</span>
            {status === 'ok' ? <CheckIcon className="w-2 h-2" /> : <CloseIcon className="w-2 h-2" />}
        </div>
    );
}