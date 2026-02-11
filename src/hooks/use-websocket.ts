'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { webSocketService, WebSocketMessage } from '@/lib/websocket-service';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('DISCONNECTED');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const listenersRef = useRef<Map<string, Set<(message: WebSocketMessage) => void>>>(new Map());

  useEffect(() => {
    // Connect to WebSocket
    const connectWebSocket = async () => {
      try {
        await webSocketService.connect();
        setIsConnected(true);
        setConnectionState(webSocketService.getConnectionState());
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setIsConnected(false);
        setConnectionState('ERROR');
      }
    };

    connectWebSocket();

    // Listen to all messages for connection state updates
    const unsubscribeAll = webSocketService.subscribe('*', (message) => {
      setLastMessage(message);
      setConnectionState(webSocketService.getConnectionState());
      setIsConnected(webSocketService.isConnected());
    });

    // Cleanup
    return () => {
      unsubscribeAll();
    };
  }, []);

  const subscribe = useCallback((type: string, callback: (message: WebSocketMessage) => void) => {
    const unsubscribe = webSocketService.subscribe(type, callback);
    
    // Store listener for cleanup
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type)!.add(callback);

    return unsubscribe;
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    webSocketService.send(message);
  }, []);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setIsConnected(false);
    setConnectionState('DISCONNECTED');
    
    // Clear all listeners
    listenersRef.current.clear();
  }, []);

  // Specific senders
  const sendAttendanceUpdate = useCallback((data: any) => {
    webSocketService.sendAttendanceUpdate(data);
  }, []);

  const sendSessionStart = useCallback((data: any) => {
    webSocketService.sendSessionStart(data);
  }, []);

  const sendSessionEnd = useCallback((sessionId: string) => {
    webSocketService.sendSessionEnd(sessionId);
  }, []);

  const sendStudentCheckIn = useCallback((data: any) => {
    webSocketService.sendStudentCheckIn(data);
  }, []);

  const sendLocationVerification = useCallback((sessionId: string, studentId: string, location: any) => {
    webSocketService.sendLocationVerification(sessionId, studentId, location);
  }, []);

  const sendNotification = useCallback((userId: string, notification: any) => {
    webSocketService.sendNotification(userId, notification);
  }, []);

  return {
    isConnected,
    connectionState,
    lastMessage,
    subscribe,
    send,
    sendAttendanceUpdate,
    sendSessionStart,
    sendSessionEnd,
    sendStudentCheckIn,
    sendLocationVerification,
    sendNotification,
    disconnect
  };
}

// Specific hooks for different message types
export function useAttendanceUpdates(sessionId?: string) {
  const [updates, setUpdates] = useState<any[]>([]);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('attendance_update', (message) => {
      if (!sessionId || message.sessionId === sessionId) {
        setUpdates(prev => [...prev, message.data]);
      }
    });

    return unsubscribe;
  }, [sessionId, subscribe]);

  return updates;
}

export function useStudentCheckIns(sessionId?: string) {
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('student_checkin', (message) => {
      if (!sessionId || message.sessionId === sessionId) {
        setCheckIns(prev => [...prev, message.data]);
      }
    });

    return unsubscribe;
  }, [sessionId, subscribe]);

  return checkIns;
}

export function useSessionEvents() {
  const [sessionEvents, setSessionEvents] = useState<any[]>([]);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribeSessionStart = subscribe('session_start', (message) => {
      setSessionEvents(prev => [...prev, { type: 'start', ...message.data }]);
    });

    const unsubscribeSessionEnd = subscribe('session_end', (message) => {
      setSessionEvents(prev => [...prev, { type: 'end', ...message.data }]);
    });

    return () => {
      unsubscribeSessionStart();
      unsubscribeSessionEnd();
    };
  }, [subscribe]);

  return sessionEvents;
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('notification', (message) => {
      if (!userId || message.userId === userId) {
        setNotifications(prev => [...prev, message.data]);
      }
    });

    return unsubscribe;
  }, [userId, subscribe]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    clearNotifications
  };
}
