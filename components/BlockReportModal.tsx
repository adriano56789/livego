import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { api } from '../services/api';

interface BlockReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlock: () => void;
  onReport: () => void;
  onUnfriend?: () => void;
  onDeleteMessages?: () => void;
  currentUser?: any;
  targetUser?: any;
}

const BlockReportModal: React.FC<BlockReportModalProps> = ({ 
  isOpen, 
  onClose, 
  onBlock, 
  onReport, 
  onUnfriend, 
  onDeleteMessages, 
  currentUser, 
  targetUser 
}) => {
  const { t } = useTranslation();
  const [blockStatus, setBlockStatus] = useState<{
    canBlock: boolean;
    reason: string;
    restrictions: string[];
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser && targetUser) {
      checkBlockStatus();
    }
  }, [isOpen, currentUser, targetUser]);

  const checkBlockStatus = async () => {
    if (!currentUser?.id || !targetUser?.id) return;
    
    setIsLoading(true);
    try {
      const response = await api.checkBlockStatus(currentUser.id, targetUser.id);
      setBlockStatus(response);
    } catch (error) {
      console.error('Erro ao verificar status de bloqueio:', error);
      // Em caso de erro, permitir bloqueio por segurança
      setBlockStatus({
        canBlock: true,
        reason: '',
        restrictions: [],
        message: 'Bloqueio permitido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!currentUser?.id || !targetUser?.id) return;
    
    try {
      // Registrar tentativa de bloqueio para auditoria
      await api.registerBlockAttempt(currentUser.id, targetUser.id, 'Bloqueio via chat privado', true);
      
      // Executar bloqueio
      onBlock();
    } catch (error) {
      console.error('Erro ao registrar tentativa de bloqueio:', error);
      // Mesmo em caso de erro, permitir bloqueio
      onBlock();
    }
  };

  const getBlockButtonContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
          <span>Verificando...</span>
        </div>
      );
    }

    if (!blockStatus) {
      return t('common.block');
    }

    if (!blockStatus.canBlock) {
      return (
        <div className="flex flex-col items-center">
          <span className="text-red-400">🛡️ Bloqueio Temporário</span>
          <span className="text-xs text-gray-400 mt-1">{blockStatus.reason}</span>
        </div>
      );
    }

    return t('common.block');
  };

  const getRestrictionTooltip = () => {
    if (!blockStatus?.canBlock && blockStatus?.restrictions && blockStatus.restrictions.length > 0) {
      const restrictionDetails = {
        'withdrawal_pending': 'Transações financeiras pendentes (saques em processamento)',
        'target_withdrawal_pending': 'O outro usuário tem transações pendentes',
        'recent_disputes': 'Disputas recentes detectadas',
        'excessive_blocks': 'Múltiplas tentativas de bloqueio recentes',
        'new_user_protection': 'Proteção para usuários recentes (menos de 7 dias)'
      };

      return blockStatus.restrictions
        .map(restriction => restrictionDetails[restriction as keyof typeof restrictionDetails] || restriction)
        .join('\n');
    }
    return '';
  };

  return (
    <div 
        className={`absolute inset-0 z-50 flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
        <div 
            className={`w-full max-w-md transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
            onClick={e => e.stopPropagation()}
        >
            <div className="px-2 pb-2 space-y-2">
                {/* Alerta de proteção se necessário */}
                {blockStatus && !blockStatus.canBlock && (
                    <div className="bg-yellow-900/80 border border-yellow-600 rounded-xl p-3 mb-2">
                        <div className="flex items-center space-x-2">
                            <span className="text-yellow-400 text-lg">⚠️</span>
                            <div className="flex-1">
                                <h4 className="text-yellow-300 font-semibold text-sm">Proteção Anti-Golpe</h4>
                                <p className="text-yellow-200 text-xs mt-1">
                                    {blockStatus.message}
                                </p>
                                <p className="text-yellow-100 text-xs mt-2 opacity-75">
                                    Esta medida previne golpes e bloqueios abusivos após transações financeiras.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-[#2a2a2c] rounded-xl overflow-hidden">
                    <div className="flex flex-col space-y-2">
                        {onDeleteMessages && (
                            <>
                                <button 
                                    onClick={onDeleteMessages} 
                                    className="w-full py-3 text-orange-500 text-center text-lg font-bold hover:bg-gray-700/50 transition-colors"
                                >
                                    🗑️ Apagar Mensagens
                                </button>
                                <div className="h-px bg-gray-600/50"></div>
                            </>
                        )}
                        {onUnfriend && (
                            <>
                                <button 
                                    onClick={onUnfriend} 
                                    className="w-full py-3 text-red-500 text-center text-lg font-bold hover:bg-gray-700/50 transition-colors"
                                >
                                    {t('common.unfriend')}
                                </button>
                                <div className="h-px bg-gray-600/50"></div>
                            </>
                        )}
                        <button 
                            onClick={handleBlock}
                            disabled={!blockStatus?.canBlock || isLoading}
                            className={`w-full py-3 text-center text-lg font-bold transition-all ${
                                !blockStatus?.canBlock || isLoading
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'text-red-500 hover:bg-gray-700/50'
                            }`}
                            title={getRestrictionTooltip()}
                        >
                            {getBlockButtonContent()}
                        </button>
                        <div className="h-px bg-gray-600/50"></div>
                        <button 
                            onClick={onReport} 
                            className="w-full py-3 text-white text-center text-lg font-bold hover:bg-gray-700/50 transition-colors"
                        >
                            {t('common.report')}
                        </button>
                    </div>
                </div>
                <div className="bg-[#2a2a2c] rounded-xl overflow-hidden">
                    <button 
                        onClick={onClose} 
                        className="w-full py-3 text-white text-center text-lg font-bold hover:bg-gray-700/50 transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default BlockReportModal;