/**
 * Utilitários de autenticação para o frontend
 * Seguindo melhores práticas para JWT
 */

interface JWTPayload {
  id?: string;
  userId?: string;
  name?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Centraliza a decodificação e validação do token JWT
 * NOTA: atob() apenas decodifica, não valida a assinatura do token
 */
const decodeToken = (token: string): JWTPayload | null => {
  try {
    // Validar formato JWT (3 partes separadas por .)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Token inválido: formato JWT incorreto');
      return null;
    }

    // Decodificar payload (parte do meio)
    const payload = parts[1];
    if (!payload) {
      console.error('Token inválido: payload não encontrado');
      return null;
    }

    // Adicionar padding se necessário para base64
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    try {
      const decoded = JSON.parse(atob(paddedPayload));
      return decoded;
    } catch (parseError) {
      console.error('Erro ao decodificar payload JSON:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Erro ao processar token:', error);
    return null;
  }
};

/**
 * Obtém o token JWT do localStorage com validação básica
 */
const getToken = (): string | null => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // Validação básica do formato
    if (typeof token !== 'string' || token.trim().length === 0) {
      console.error('Token inválido: formato incorreto');
      clearToken(); // Limpar token inválido
      return null;
    }

    return token.trim();
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return null;
  }
};

/**
 * Obtém o payload decodificado do token
 */
const getTokenPayload = (): JWTPayload | null => {
  const token = getToken();
  if (!token) return null;

  return decodeToken(token);
};

/**
 * Obtém o ID do usuário a partir do token JWT
 */
export const getUserIdFromToken = (): string | null => {
  const payload = getTokenPayload();
  if (!payload) return null;

  // Tentar diferentes campos que podem conter o ID
  const userId = payload.id || payload.userId || payload.sub;
  
  if (!userId) {
    console.error('Token não contém ID de usuário válido');
    return null;
  }

  if (typeof userId !== 'string') {
    console.error('ID de usuário inválido no token');
    return null;
  }

  return userId;
};

/**
 * Obtém o nome do usuário a partir do token JWT
 */
export const getUserNameFromToken = (): string | null => {
  const payload = getTokenPayload();
  if (!payload) return null;

  const userName = payload.name || payload.username || payload.displayName;
  
  if (!userName) {
    console.warn('Token não contém nome de usuário');
    return null;
  }

  if (typeof userName !== 'string') {
    console.error('Nome de usuário inválido no token');
    return null;
  }

  return userName;
};

/**
 * Verifica se o token é válido (formato e expiração)
 * NOTA: Não valida assinatura do JWT (requer backend)
 */
export const isTokenValid = (): boolean => {
  const token = getToken();
  if (!token) return false;

  const payload = getTokenPayload();
  if (!payload) return false;

  // Verificar expiração
  if (payload.exp) {
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp < now) {
      console.warn('Token expirado');
      clearToken(); // Limpar token expirado
      return false;
    }
  }

  return true;
};

/**
 * Verifica se o usuário está autenticado
 */
export const isAuthenticated = (): boolean => {
  return isTokenValid() && getUserIdFromToken() !== null;
};

/**
 * Remove o token do localStorage (logout)
 */
export const clearToken = (): void => {
  try {
    localStorage.removeItem('token');
  } catch (error) {
    console.error('Erro ao limpar token:', error);
  }
};

/**
 * Salva o token no localStorage com validação
 */
export const saveToken = (token: string): boolean => {
  try {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      console.error('Token inválido para salvar');
      return false;
    }

    // Validar formato básico antes de salvar
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      console.error('Token com formato JWT inválido');
      return false;
    }

    // Validar payload antes de salvar
    const payload = decodeToken(token.trim());
    if (!payload) {
      console.error('Token com payload inválido');
      return false;
    }

    // Verificar campos obrigatórios
    if (!payload.id && !payload.userId && !payload.sub) {
      console.error('Token não contém ID de usuário');
      return false;
    }

    localStorage.setItem('token', token.trim());
    return true;
  } catch (error) {
    console.error('Erro ao salvar token:', error);
    return false;
  }
};

/**
 * Obtém informações completas do usuário do token
 */
export const getUserInfo = (): { id: string; name?: string } | null => {
  const id = getUserIdFromToken();
  if (!id) return null;

  const name = getUserNameFromToken();
  
  return { id, name };
};
