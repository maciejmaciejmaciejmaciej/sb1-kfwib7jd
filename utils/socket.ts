import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { WooCommerceSettings } from './api';
import { logError } from './errorLogger';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;

export function initializeSocket(settings: WooCommerceSettings) {
  if (socket?.connected) return socket;

  const wsUrl = Platform.select({
    web: settings.storeUrl.replace(/^http/, 'ws'),
    default: settings.storeUrl, // Socket.io handles the protocol switch for native
  });

  socket = io(wsUrl, {
    path: '/wp-json/wc/v3/socket',
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: RECONNECT_DELAY,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    reconnectAttempts = 0;
  });

  socket.on('disconnect', (reason) => {
    logError(`WebSocket disconnected: ${reason}`, 'WebSocket');
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logError('Maximum reconnection attempts reached', 'WebSocket');
      socket?.close();
      socket = null;
      return;
    }

    reconnectAttempts++;
  });

  socket.on('connect_error', (error) => {
    logError(`WebSocket connection error: ${error.message}`, 'WebSocket');
  });

  socket.on('error', (error) => {
    logError(`WebSocket error: ${error}`, 'WebSocket');
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.close();
    socket = null;
    reconnectAttempts = 0;
  }
}