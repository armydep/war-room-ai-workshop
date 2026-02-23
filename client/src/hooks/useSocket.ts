import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Incident } from '../types';

interface UseSocketReturn {
  socket: Socket | null;
  liveFeed: Incident[];
  connected: boolean;
}

export function useSocket(serverUrl: string): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [liveFeed, setLiveFeed] = useState<Incident[]>([]);
  const [connected, setConnected] = useState(false);

  const handleCreated = useCallback((incident: Incident) => {
    setLiveFeed(prev => [incident, ...prev].slice(0, 10));
  }, []);

  const handleUpdated = useCallback((incident: Incident) => {
    setLiveFeed(prev => {
      const exists = prev.some(i => i.id === incident.id);
      if (exists) {
        return prev.map(i => (i.id === incident.id ? incident : i));
      }
      return [incident, ...prev].slice(0, 10);
    });
  }, []);

  useEffect(() => {
    const s = io(serverUrl);

    s.on('connect', () => {
      console.log('Connected to WarRoom');
      setConnected(true);
    });

    s.on('disconnect', () => {
      console.log('Disconnected from WarRoom');
      setConnected(false);
    });

    s.on('incident:created', handleCreated);
    s.on('incident:updated', handleUpdated);

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [serverUrl, handleCreated, handleUpdated]);

  return { socket, liveFeed, connected };
}
