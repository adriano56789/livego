import React from 'react';
import { CloseIcon, SlidersIcon } from '../icons';

export default function ResolutionPanel({ isOpen, onClose, onSelectResolution, currentResolution }: any) {
    if(!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-transparent" onClick={onClose}>
      <div 
        className="w-full bg-[#1C1C1E] rounded-t-2xl p-5 animate-in slide-in-from-bottom duration-300 pb-8 border-t border-white/5 shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-bold text-base">Qualidade de Imagem</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
                <CloseIcon className="text-gray-400 w-5 h-5" />
            </button>
        </div>

        <div className="space-y-3">
            {['1080p', '720p', '480p'].map(res => (
                <button 
                    key={res} 
                    onClick={() => onSelectResolution(res)}
                    className={`w-full py-4 rounded-xl font-medium text-sm flex items-center justify-between px-4 transition-colors ${
                        currentResolution === res 
                        ? 'bg-[#2C2C2E] text-[#a855f7] border border-[#a855f7]/50' 
                        : 'bg-[#2C2C2E] text-white border border-transparent hover:bg-[#3A3A3C]'
                    }`}
                >
                    <span>{res}</span>
                    {currentResolution === res && <div className="w-2.5 h-2.5 rounded-full bg-[#a855f7]"></div>}
                </button>
            ))}
        </div>
      </div>
    </div>
  )
}