import { io } from 'socket.io-client';

let socketInstance = null;

/**
 * Get or initialize the Socket.IO client instance
 * @param {Object} options
 * @param {boolean} options.isPublicDisplay - Whether this is an unauthenticated public TV screen
 * @param {string} options.doctorId - Specific doctor queue to auto-subscribe
 * @returns {import('socket.io-client').Socket}
 */
export function getSocket(options = {}) {
  const token = localStorage.getItem('adyapan_token');
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // Resolve socket server origin (if VITE_API_URL is '/api', origin is window.location.origin)
  let socketUrl = window.location.origin;
  if (apiUrl && apiUrl.startsWith('http')) {
    try {
      const url = new URL(apiUrl);
      socketUrl = url.origin;
    } catch (e) {
      socketUrl = window.location.origin;
    }
  }

  // If already connected with same auth state, return existing
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
  }

  socketInstance = io(socketUrl, {
    auth: {
      token: token || undefined,
    },
    query: {
      isPublicDisplay: options.isPublicDisplay ? 'true' : 'false',
      doctorId: options.doctorId || '',
      departmentId: options.departmentId || '',
    },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'], // Prioritize websocket with polling fallback
  });

  socketInstance.on('connect', () => {
    // Connected to Socket.IO Server
  });

  socketInstance.on('reconnect', () => {
    // Reconnected - clients should refresh queue state to avoid missed events
    if (typeof options.onReconnect === 'function') {
      options.onReconnect();
    }
  });

  socketInstance.on('disconnect', () => {
    // Disconnected
  });

  return socketInstance;
}

/**
 * Disconnect socket on logout or unmount
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export default getSocket;
