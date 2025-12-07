import { User as BaseUser } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface AuthenticatedUser extends BaseUser {
  token: string;
  refreshToken?: string;
  lastLogin?: string;
  deviceInfo?: {
    userAgent: string;
    ipAddress: string;
    deviceId?: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthPayload {
  userId: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = any> {
  status: number;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface SocketUser extends AuthenticatedUser {
  socketId: string;
  rooms: string[];
}

export interface SocketAuthPayload {
  token: string;
  userId: string;
}

// Extendendo o tipo User original para incluir campos adicionais
declare module './index' {
  interface User {
    token?: string;
    refreshToken?: string;
    lastLogin?: string;
    deviceInfo?: {
      userAgent: string;
      ipAddress: string;
      deviceId?: string;
    };
  }
}
