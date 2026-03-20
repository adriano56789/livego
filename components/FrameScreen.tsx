import React, { useState, useEffect } from 'react';
import { BackIcon, YellowDiamondIcon } from './icons';
import { useTranslation } from '../i18n';
import { User, ToastType } from '../types';
import { shopAPI, Frame, UserFrame } from '../services/shopAPI';

interface FrameScreenProps {
  onClose: () => void;
  user: User;
  updateUser: (user: User) => void;
  onOpenWallet: (initialTab: 'Diamante' | 'Ganhos') => void;
  addToast: (type: ToastType, message: string) => void;
}

const FrameScreen: React.FC<FrameScreenProps> = ({ 
  onClose, 
  user, 
  updateUser, 
  onOpenWallet, 
  addToast 
}) => {
  const { t } = useTranslation();
  const [frames, setFrames] = useState<Frame[]>([]);
  const [userFrames, setUserFrames] = useState<UserFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState<UserFrame | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar frames do banco e frames do usuário
  useEffect(() => {
    loadFrames();
  }, [user.id]);

  const loadFrames = async () => {
    try {
      setLoading(true);
      
      // Carregar todos os frames disponíveis
      const allFrames = await shopAPI.frames.getAll();
      setFrames(allFrames);
      
      // Carregar frames do usuário
      const userFramesData = await shopAPI.frames.getUserFrames(user.id);
      setUserFrames(userFramesData);
      
      // Carregar frame equipado atual
      const currentFrameData = await shopAPI.frames.getCurrent(user.id);
      setCurrentFrame(currentFrameData);
      
    } catch (error) {
      addToast('error', 'Erro ao carregar frames');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (frameId: string, price: number) => {
    try {
      if (user.diamonds < price) {
        addToast('error', 'Diamonds insuficientes');
        onOpenWallet('Diamante');
        return;
      }

      const result = await shopAPI.frames.purchase(frameId, user.id);
      if (result.success) {
        // Atualizar diamonds do usuário
        const updatedUser = { ...user, diamonds: result.userDiamonds };
        updateUser(updatedUser);
        
        // Recarregar frames do usuário
        await loadFrames();
        
        addToast('success', 'Frame comprado com sucesso!');
      }
      
    } catch (error: any) {
      addToast('error', error.message || 'Erro ao comprar frame');
    }
  };

  const handleEquip = async (frameId: string) => {
    try {
      const result = await shopAPI.frames.equip(frameId, user.id);
      if (result.success) {
        // Recarregar frames do usuário
        await loadFrames();
        
        addToast('success', 'Frame equipado com sucesso!');
      }
    } catch (error: any) {
      addToast('error', error.message || 'Erro ao equipar frame');
    }
  };

  const isFrameOwned = (frameId: string) => {
    return userFrames.some(userFrame => userFrame.frameId === frameId);
  };

  const isFrameEquipped = (frameId: string) => {
    return currentFrame?.frameId === frameId;
  };

  const getRemainingDays = (expirationDate: string) => {
    const exp = new Date(expirationDate);
    const now = new Date();
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR');
  };

  const getFrameTier = (price: number) => {
    if (price <= 1000) return { tier: 'Bronze', color: 'text-orange-400' };
    if (price <= 2500) return { tier: 'Prata', color: 'text-gray-400' };
    return { tier: 'Ouro', color: 'text-yellow-400' };
  };

  const renderFrame = (frame: Frame) => {
    const isOwned = isFrameOwned(frame.id);
    const isEquipped = isFrameEquipped(frame.id);
    const tier = getFrameTier(frame.price);
    
    return (
      <div key={frame.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="relative">
          <img 
            src={frame.image} 
            alt={frame.name}
            className="w-full h-32 object-cover rounded-lg mb-3"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="#4B5563"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="24">?</text></svg>');
            }}
          />
          {isEquipped && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Equipado
            </div>
          )}
          {isOwned && !isEquipped && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              Possuído
            </div>
          )}
        </div>
        
        <h3 className="text-white font-semibold text-sm mb-1">{frame.name}</h3>
        <p className="text-gray-400 text-xs mb-2">{frame.description}</p>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-semibold ${tier.color}`}>
              {tier.tier}
            </span>
            <span className="text-purple-400 text-xs">
              {frame.duration} dias
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <YellowDiamondIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-sm">{formatPrice(frame.price)}</span>
          </div>
          
          {!isOwned ? (
            <button
              onClick={() => handlePurchase(frame.id, frame.price)}
              disabled={user.diamonds < frame.price}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                user.diamonds >= frame.price
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Comprar
            </button>
          ) : (
            <>
              {!isEquipped && (
                <button
                  onClick={() => handleEquip(frame.id)}
                  className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-semibold transition-colors"
                >
                  Equipar
                </button>
              )}
              {isEquipped && (
                <div className="px-3 py-1 bg-green-500 text-white rounded text-xs font-semibold">
                  Ativo
                </div>
              )}
            </>
          )}
        </div>

        {/* Mostrar tempo restante se possuído */}
        {isOwned && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            {(() => {
              const userFrame = userFrames.find(uf => uf.frameId === frame.id);
              if (userFrame) {
                const remainingDays = getRemainingDays(userFrame.expirationDate);
                return (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Tempo restante:</span>
                    <span className={`font-semibold ${
                      remainingDays <= 3 ? 'text-red-400' : 
                      remainingDays <= 7 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {remainingDays} dias
                    </span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <BackIcon className="w-5 h-5" />
            </button>
            <h2 className="text-white font-bold text-lg">Frames de Avatar</h2>
          </div>
          <div className="flex items-center space-x-2">
            <YellowDiamondIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{user.diamonds.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Carregando...</div>
            </div>
          ) : frames.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Nenhum frame disponível</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {frames.map(renderFrame)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FrameScreen;
