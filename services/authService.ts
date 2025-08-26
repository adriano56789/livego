import { apiClient } from './apiClient';
import type { User, Conversation, DiamondPackage, Address, CardDetails, PaymentMethod, PurchaseOrder, CardBrand } from '../types';

export const loginWithGoogle = (accountId?: number): Promise<User> => {
    return apiClient('/api/auth/google', { method: 'POST', body: JSON.stringify({ accountId }) });
};

export const loginWithFacebook = (): Promise<void> => {
    alert('A funcionalidade de login com Facebook ainda não foi implementada.');
    return Promise.resolve();
};

export const getUserProfile = (userId: number): Promise<User> => {
    return apiClient(`/api/users/${userId}`);
};

export const getFollowingUsers = (userId: number): Promise<User[]> => {
    return apiClient(`/api/users/${userId}/following`);
};

export const getFollowers = (userId: number): Promise<User[]> => {
    return apiClient(`/api/users/${userId}/followers`);
};

export const getFriends = (userId: number): Promise<User[]> => {
    return apiClient(`/api/users/${userId}/friends`);
};

export const getFans = (userId: number): Promise<User[]> => {
    // In this mock, fans are unilateral followers.
    return apiClient(`/api/users/${userId}/fans`);
};

export const getGiftsReceived = (userId: number): Promise<{ totalValue: number }> => {
    return apiClient(`/api/users/${userId}/gifts/received`);
};

export const getGiftsSent = (userId: number): Promise<{ totalValue: number }> => {
    return apiClient(`/api/users/${userId}/gifts/sent`);
};


export const getProfileVisitors = (userId: number): Promise<User[]> => {
    return apiClient(`/api/users/${userId}/visitors`);
};

export const uploadProfilePhoto = (userId: number, photoDataUrl: string): Promise<User> => {
    return apiClient(`/api/users/${userId}/avatar`, {
        method: 'PATCH',
        body: JSON.stringify({ photoDataUrl }),
    });
};

export const addProfilePhoto = (userId: number, photoDataUrl: string): Promise<User> => {
    return apiClient(`/api/users/${userId}/photos`, {
        method: 'POST',
        body: JSON.stringify({ photoDataUrl }),
    });
};

export const deleteProfilePhoto = (userId: number, photoUrl: string): Promise<User> => {
    return apiClient(`/api/users/${userId}/photos`, {
        method: 'DELETE',
        body: JSON.stringify({ photoUrl }),
    });
};

export const generateNickname = (): Promise<{ newNickname: string }> => {
    return apiClient('/api/users/generate-nickname', { method: 'POST' });
};

export const updateUserProfile = (userId: number, profileData: Partial<Pick<User, 'nickname' | 'gender' | 'birthday' | 'invite_code' | 'personalSignature' | 'country' | 'personalityTags' | 'profession' | 'languages' | 'height' | 'weight' | 'emotionalState' | 'lastLiveTitle' | 'lastLiveMeta'>>): Promise<User> => {
    return apiClient(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
    });
};

export const changeUserEmail = (userId: number, newEmail: string): Promise<User> => {
    return apiClient(`/api/users/${userId}/email`, {
        method: 'PATCH',
        body: JSON.stringify({ newEmail }),
    });
};

export const deleteAccount = (userId: number): Promise<{ success: boolean }> => {
    return apiClient(`/api/users/${userId}`, {
        method: 'DELETE',
    });
};

export const getConversations = (userId: number): Promise<Conversation[]> => {
    return apiClient(`/api/users/${userId}/conversations`);
};

export const getDiamondPackages = (): Promise<DiamondPackage[]> => {
    return apiClient('/api/diamonds/packages');
};

export const purchaseDiamonds = (
    userId: number,
    packageId: number,
    address: Address,
    paymentDetails?: { method: PaymentMethod; card?: CardDetails }
): Promise<{ updatedUser: User, order: PurchaseOrder }> => {
    return apiClient(`/api/purchase`, {
        method: 'POST',
        body: JSON.stringify({ userId, packageId, address, paymentDetails }),
    });
};

export const getPurchaseHistory = (userId: number): Promise<PurchaseOrder[]> => {
    return apiClient(`/api/users/${userId}/purchase-history`);
};

export const checkOrderStatus = (orderId: string): Promise<{ order: PurchaseOrder | null }> => {
    return apiClient(`/api/purchase/status/${orderId}`);
};

export const searchUsers = (query: string): Promise<User[]> => {
    return apiClient(`/api/users/search?q=${encodeURIComponent(query)}`);
};

export const detectCardBrand = (cardNumber: string): Promise<{ brand: CardBrand }> => {
    return apiClient('/api/payment/detect-brand', {
        method: 'POST',
        body: JSON.stringify({ cardNumber }),
    });
};

export const generateNewUserId = (): Promise<{ newId: number }> => {
    return apiClient('/api/users/generate-id', { method: 'POST' });
};

// --- Avatar Protection Services ---

export const activateAvatarProtection = (userId: number, avatarImage: string): Promise<{ success: boolean, protectionId: string, frameUrl: string }> => {
    return apiClient('/api/avatar/protection/activate', {
        method: 'POST',
        body: JSON.stringify({ userId, avatarImage }),
    });
};

export const deactivateAvatarProtection = (userId: number): Promise<{ success: boolean }> => {
    return apiClient('/api/avatar/protection/deactivate', {
        method: 'POST',
        body: JSON.stringify({ userId }),
    });
};

export const checkAvatarInUse = (avatarImage: string): Promise<{ inUse: boolean, protectedBy: number | null }> => {
    return apiClient('/api/avatar/protection/check', {
        method: 'POST',
        body: JSON.stringify({ avatarImage }),
    });
};

export const getFriendRequests = (userId: number): Promise<User[]> => {
    return apiClient(`/api/users/${userId}/friend-requests`);
};

// --- Settings Screen Services ---
export const getConnectedAccounts = (userId: number): Promise<{ provider: string, email: string }[]> => {
    return apiClient(`/api/users/${userId}/connected-accounts`);
};

export const updateConnectedAccounts = (userId: number, accounts: { provider: string, email: string }[]): Promise<{ success: boolean }> => {
    return apiClient(`/api/users/${userId}/connected-accounts`, {
        method: 'PATCH',
        body: JSON.stringify({ accounts }),
    });
};

export const getEarningsInfo = (userId: number): Promise<{ total: number, lastMonth: number, conversionRate: number, feeRate: number }> => {
    return apiClient(`/api/users/${userId}/earnings`);
};