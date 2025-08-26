import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function useApi() {
  // User endpoints
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
        // User doesn't exist, create one
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

  // Faucet endpoints
  const requestFaucet = async (requestData: { userId: string; chain: string; address: string }) => {
    const response = await apiClient.post('/faucet/request', requestData);
    return response.data;
  };

  const getFaucetStatus = async (userId: string) => {
    const response = await apiClient.get(`/faucet/status/${userId}`);
    return response.data;
  };

  const getFaucetHistory = async (userId: string, page = 1, limit = 20) => {
    const response = await apiClient.get(`/faucet/history/${userId}?page=${page}&limit=${limit}`);
    return response.data;
  };

  const getFaucetStats = async () => {
    const response = await apiClient.get('/faucet/stats');
    return response.data;
  };

  const refreshBalance = async (userId: string, chain: string) => {
    const response = await apiClient.post(`/faucet/refresh-balance/${userId}/${chain}`);
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

  return {
    // User methods
    createUser,
    getUserByAddress,
    getUserById,
    getUserStats,
    addWallet,
    
    // Faucet methods
    requestFaucet,
    getFaucetStatus,
    getFaucetHistory,
    getFaucetStats,
    refreshBalance,
    
    // Donation methods
    createDonation,
    getDonationHistory,
    getDonationPools,
    getDonationStats,
    getUserBadges,
    getLeaderboard,
  };
}