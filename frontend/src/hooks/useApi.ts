import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function useApi() {
  // User endpoints (adjusted for backend compatibility)
  const createUser = async (userData: { email?: string; address: string }) => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  };

  const getUserByAddress = async (address: string) => {
    try {
      const response = await apiClient.get(`/users/address/${address}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return createUser({ address });
      }
      throw error;
    }
  };

  const getUserById = async (id: string) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  };

  const getUserStats = async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/stats`);
    return response.data;
  };

  const addWallet = async (userId: string, walletData: { chain: string; address: string }) => {
    const response = await apiClient.post(`/users/${userId}/wallets`, walletData);
    return response.data;
  };

  // Faucet endpoints (updated for backend compatibility)
  const requestFaucet = async (requestData: { chain: string; source: 'OFFICIAL_FAUCET' | 'COMMUNITY_POOL' }) => {
    const response = await apiClient.post('/faucet/request', requestData);
    return response.data;
  };

  const getCooldownStatus = async (address: string, chain?: string) => {
    const response = await apiClient.get(`/faucet/cooldown/${address}${chain ? `?chain=${chain}` : ''}`);
    return response.data;
  };

  const getFaucetHistory = async (address: string, limit = 20) => {
    const response = await apiClient.get(`/faucet/history/${address}?limit=${limit}`);
    return response.data;
  };

  const getFaucetStats = async () => {
    const response = await apiClient.get('/faucet/statistics');
    return response.data;
  };

  const updateRequestStatus = async (requestId: string, status: string, txHash?: string) => {
    const response = await apiClient.patch(`/faucet/request/${requestId}/status`, { status, txHash });
    return response.data;
  };

  // Donation endpoints
  const createDonation = async (donationData: {
    userId: string;
    chain: string;
    token: string;
    amount: string;
    txHash: string;
  }) => {
    const response = await apiClient.post('/donation', donationData);
    return response.data;
  };

  const getDonationHistory = async (userId: string, page = 1, limit = 20) => {
    const response = await apiClient.get(`/donation/history/${userId}?page=${page}&limit=${limit}`);
    return response.data;
  };

  const getDonationPools = async () => {
    const response = await apiClient.get('/donation/pools');
    return response.data;
  };

  const getDonationStats = async () => {
    const response = await apiClient.get('/donation/stats');
    return response.data;
  };

  const getUserBadges = async (userId: string) => {
    const response = await apiClient.get(`/donation/badges/${userId}`);
    return response.data;
  };

  const getLeaderboard = async (limit = 50) => {
    const response = await apiClient.get(`/donation/leaderboard?limit=${limit}`);
    return response.data;
  };

  // Auth endpoints
  const getNonce = async () => {
    const response = await apiClient.get('/auth/nonce');
    return response.data;
  };

  const login = async (loginData: { address: string; signature: string; message: string }) => {
    const response = await apiClient.post('/auth/login', loginData);
    return response.data;
  };

  const getProfile = async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  };

  return {
    // User methods
    createUser,
    getUserByAddress,
    getUserById,
    getUserStats,
    addWallet,
    
    // Faucet methods
    requestFaucet,
    getCooldownStatus,
    getFaucetHistory,
    getFaucetStats,
    updateRequestStatus,
    
    // Donation methods
    createDonation,
    getDonationHistory,
    getDonationPools,
    getDonationStats,
    getUserBadges,
    getLeaderboard,
    
    // Auth methods
    getNonce,
    login,
    getProfile,
  };
}