
import React from 'react';

interface ToolsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenCoHostModal: () => void;
}

const ToolsModal: React.FC<ToolsModalProps> = ({ isOpen, onClose, onOpenCoHostModal }) => {
    if(!isOpen) return null;
    return (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
            <div className="bg-[#1C1C1E] p-4 rounded-t-lg w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-white text-lg mb-4">Tools</h2>
                <button onClick={onOpenCoHostModal} className="bg-blue-500 p-2 rounded w-full">Co-Host</button>
            </div>
        </div>
    );
};

export default ToolsModal;
