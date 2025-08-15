import React, { useState, useEffect, useCallback } from 'react';
import type { User, PurchaseOrder } from '../types';
import * as authService from '../services/authService';
import { useApiViewer } from './ApiContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import DiamondIcon from './icons/DiamondIcon';

interface PurchaseHistoryScreenProps {
  user: User;
  onExit: () => void;
  onUpdateUser: (user: User) => void;
}

const statusStyles = {
  completed: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  failed: 'bg-red-500/20 text-red-400',
};

const PurchaseHistoryScreen: React.FC<PurchaseHistoryScreenProps> = ({ user, onExit, onUpdateUser }) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingStatusId, setCheckingStatusId] = useState<string | null>(null);
  const { showApiResponse } = useApiViewer();

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const historyData = await authService.getPurchaseHistory(user.id);
      showApiResponse(`GET /api/users/${user.id}/purchase-history`, historyData);
      setOrders(historyData);
    } catch (error) {
      console.error('Failed to fetch purchase history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id, showApiResponse]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);
  
  const handleCheckStatus = async (orderId: string) => {
    setCheckingStatusId(orderId);
    try {
        const { order } = await authService.checkOrderStatus(orderId);
        showApiResponse(`GET /api/purchase/${orderId}/status`, { order });
        if (order) {
            setOrders(prevOrders => prevOrders.map(o => o.orderId === orderId ? order : o));
            // If the order completed, we might need to update the user's diamond balance
            if (order.status === 'completed') {
                const updatedUser = await authService.getUserProfile(user.id); // Refetch user
                onUpdateUser(updatedUser);
            }
        }
    } catch (error) {
        console.error(`Failed to check status for order ${orderId}:`, error);
        alert('Não foi possível verificar o status do pedido.');
    } finally {
        setCheckingStatusId(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex-grow flex items-center justify-center"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>;
    }
    if (orders.length === 0) {
      return <div className="flex-grow flex items-center justify-center text-gray-500">Nenhum histórico de compras.</div>;
    }

    return (
      <div className="space-y-3">
        {orders.map(order => (
          <div key={order.orderId} className="bg-[#1c1c1e] p-3 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-white flex items-center gap-2">
                  <DiamondIcon className="w-5 h-5"/>
                  {order.package.diamonds.toLocaleString()} Diamantes
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(order.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">{order.package.currency} {order.package.price.toFixed(2).replace('.', ',')}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${statusStyles[order.status]}`}>
                  {order.status === 'pending' ? 'Pendente' : order.status === 'completed' ? 'Concluído' : 'Falhou'}
                </span>
              </div>
            </div>
            {order.status === 'pending' && (
                <div className="mt-2 pt-2 border-t border-gray-700/50">
                     <button 
                        onClick={() => handleCheckStatus(order.orderId)}
                        disabled={checkingStatusId === order.orderId}
                        className="w-full text-center text-sm text-cyan-400 font-semibold p-1 hover:bg-cyan-400/10 rounded-md disabled:opacity-50"
                    >
                        {checkingStatusId === order.orderId ? 'Verificando...' : 'Verificar Status'}
                    </button>
                </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Histórico de Compras</h1>
        <div className="w-6 h-6"></div>
      </header>
      <main className="flex-grow p-4 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default PurchaseHistoryScreen;
