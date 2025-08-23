
import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';
import type { ApiLogEntry } from '../types';
import { apiLogger } from '../services/apiLogger';

interface ApiViewerContextType {
  showApiResponse: (title: string, data: object) => void;
  hideApiResponse: () => void;
  apiResponse: { title: string; data: object } | null;
  apiLog: ApiLogEntry[];
}

const ApiViewerContext = createContext<ApiViewerContextType | undefined>(undefined);

const sanitizeDataForViewer = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDataForViewer(item));
  }
  if (data !== null && typeof data === 'object') {
    const sanitizedObject: { [key: string]: any } = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        if (typeof value === 'string' && value.startsWith('data:image/') && value.length > 200) {
          sanitizedObject[key] = `${value.substring(0, 50)}...[base64_data_truncated]`;
        } else {
          sanitizedObject[key] = sanitizeDataForViewer(value);
        }
      }
    }
    return sanitizedObject;
  }
  return data;
};


export const ApiViewerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiResponse, setApiResponse] = useState<{ title: string; data: object } | null>(null);
  const [apiLog, setApiLog] = useState<ApiLogEntry[]>([]);

  const showApiResponse = useCallback((title: string, data: object) => {
    console.log(`[API Sim] ${title}`, data);
    const sanitizedData = sanitizeDataForViewer(data);
    
    // This now serves two purposes:
    // 1. It powers the pop-up modal viewer.
    // 2. It populates the persistent API Log in Developer Tools.
    setApiResponse({ title, data: sanitizedData });

    setApiLog(prevLog => {
        const newLogEntry: ApiLogEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            title,
            data: sanitizedData,
        };
        const updatedLog = [newLogEntry, ...prevLog];
        if (updatedLog.length > 50) {
            updatedLog.pop();
        }
        return updatedLog;
    });
  }, []);

  useEffect(() => {
    // Register the context's show function with the global logger
    apiLogger.setListener(showApiResponse);
    
    // On unmount, clear the listener to prevent memory leaks
    return () => apiLogger.setListener(() => {});
  }, [showApiResponse]);

  const hideApiResponse = useCallback(() => {
    setApiResponse(null);
  }, []);

  return (
    <ApiViewerContext.Provider value={{ showApiResponse, hideApiResponse, apiResponse, apiLog }}>
      {children}
    </ApiViewerContext.Provider>
  );
};

export const useApiViewer = () => {
  const context = useContext(ApiViewerContext);
  if (context === undefined) {
    throw new Error('useApiViewer must be used within an ApiViewerProvider');
  }
  return context;
};
