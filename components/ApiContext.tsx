
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

  const logOnly = useCallback((title: string, data: object) => {
    console.log(`[API Sim] (log only) ${title}`, data);
    const sanitizedData = sanitizeDataForViewer(data);
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
  
  const showAndLog = useCallback((title: string, data: object) => {
    console.log(`[API Sim] (show) ${title}`, data);
    const sanitizedData = sanitizeDataForViewer(data);
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
    setApiResponse({ title, data: sanitizedData });
  }, []);

  const hideApiResponse = useCallback(() => {
    setApiResponse(null);
  }, []);

  useEffect(() => {
    apiLogger.setListener({ logOnly, showAndLog });
    return () => apiLogger.setListener(null);
  }, [logOnly, showAndLog]);
  
  return (
    <ApiViewerContext.Provider value={{ showApiResponse: showAndLog, hideApiResponse, apiResponse, apiLog }}>
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