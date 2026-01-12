import React from 'react';
import { ToastData, ToastType } from '../types';

export const Toast: React.FC<{ data: ToastData; onClose: () => void }> = ({ data, onClose }) => {
  const bg = data.type === ToastType.Error ? 'bg-red-500' : 'bg-green-500';
  return (
    <div className={`${bg} text-white px-4 py-2 rounded-lg shadow-lg mb-2 animate-in slide-in-from-top-2 fade-in`}>
      {data.message}
    </div>
  );
};

export default Toast;
