
import React from 'react';
import { ToastData, ToastType } from '../types';
import { CloseIcon, InfoIcon, CheckCircleIcon, WarningTriangleIcon } from './icons';

interface ToastProps {
  data: ToastData;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ data, onClose }) => {
  const config = {
    [ToastType.Error]: {
      bgColor: 'bg-red-800/80 border-red-700/80',
      textColor: 'text-red-200',
      icon: <WarningTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
    },
    [ToastType.Success]: {
      bgColor: 'bg-green-800/80 border-green-700/80',
      textColor: 'text-green-200',
      icon: <CheckCircleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
    },
    [ToastType.Info]: {
      bgColor: 'bg-blue-800/80 border-blue-700/80',
      textColor: 'text-blue-200',
      icon: <InfoIcon className="w-5 h-5 mr-3 flex-shrink-0" />
    },
  }[data.type];

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border backdrop-blur-sm ${config.bgColor} ${config.textColor}`}>
      <div className="flex items-center">
        {config.icon}
        <p className="text-sm">{data.message}</p>
      </div>
      <button onClick={onClose} className="ml-4 text-gray-400/70 hover:text-gray-200">
        <CloseIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;