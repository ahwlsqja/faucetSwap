'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
});

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { address, isConnected: isWalletConnected } = useAccount();

  useEffect(() => {
    if (!isWalletConnected || !address) {
      // Disconnect socket if wallet is disconnected
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Join user room
      socketInstance.emit('join-user-room', { userId: address });
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Listen for balance updates
    socketInstance.on('balance-updated', (data) => {
      toast.success(`Balance updated for ${data.chain}: ${data.balance.balanceFormatted} ${data.balance.symbol}`);
    });

    // Listen for faucet updates
    socketInstance.on('faucet-updated', (data) => {
      if (data.success) {
        toast.success(`Faucet request successful! Received ${data.amount} ${data.token}`);
      } else {
        toast.error(`Faucet request failed: ${data.error}`);
      }
    });

    // Listen for cooldown updates
    socketInstance.on('cooldown-updated', (data) => {
      if (data.cooldownExpired) {
        toast.success(`Cooldown expired for ${data.chain}! You can request tokens now.`);
      }
    });

    // Listen for donation updates
    socketInstance.on('donation-updated', (data) => {
      switch (data.type) {
        case 'new_donation':
          toast.success(`New donation recorded: ${data.donation.amount} ${data.donation.token}`);
          break;
        case 'donation_confirmed':
          toast.success(`Donation confirmed! Thank you for contributing to the community.`);
          break;
        case 'badge_minted':
          toast.success(`🎉 Congratulations! You've earned a ${data.badge.badgeLevel} badge!`);
          break;
      }
    });

    // Listen for global stats updates
    socketInstance.on('stats-updated', (data) => {
      // Could update global state here or trigger refetch
      console.log('Global stats updated:', data);
    });

    // Error handling
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Connection error. Some real-time features may not work.');
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      if (socketInstance.connected) {
        socketInstance.emit('leave-user-room', { userId: address });
        socketInstance.disconnect();
      }
    };
  }, [address, isWalletConnected]);

  const value = {
    socket,
    isConnected,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}