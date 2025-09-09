'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useApi } from './useApi';
import toast from 'react-hot-toast';

interface User {
  id: string;
  address: string;
  email?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { getNonce, login: apiLogin, getProfile } = useApi();

  const isAuthenticated = !!user && !!address;

  // Check if user is already authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Clear auth when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      logout();
    }
  }, [isConnected]);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const profile = await getProfile();
        setUser(profile);
      }
    } catch (error) {
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      // Get nonce from backend
      const { message } = await getNonce();
      
      // Sign message with wallet
      const signature = await signMessageAsync({ message });
      
      // Login with signature
      const response = await apiLogin({
        address,
        signature,
        message,
      });

      // Store token and user data
      localStorage.setItem('authToken', response.access_token);
      setUser(response.user);
      
      toast.success('Successfully logged in!');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}