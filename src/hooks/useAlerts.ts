import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Alert {
  id: string;
  timestamp: string;
  title: string;
  stock_symbol: string;
  type: string;
  entry_price: number;
  stoploss_price: number;
  test_mode: boolean;
  status: 'new' | 'active' | 'ignored';
  priority: 'high' | 'medium' | 'low';
  date: string;
  created_at: string;
  updated_at: string;
  interval: string;
  close_to_200_ma_2min: boolean;
  close_to_200_ma_5min: boolean;
  above_200_ma_2min: boolean;
  above_200_ma_5min: boolean;
  close_to_prev_month_high: boolean;
  close_to_prev_month_low: boolean;
  above_prev_month_high: boolean;
  above_prev_month_low: boolean;
  close_to_orb_high: boolean;
  close_to_orb_low: boolean;
  above_orb_high: boolean;
  above_orb_low: boolean;
  supertrend_trend: 'up' | 'down';
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

const isValidStatus = (s: string): s is Alert['status'] =>
  ['new', 'active', 'ignored'].includes(s);

const isValidPriority = (p: string): p is Alert['priority'] =>
  ['high', 'medium', 'low'].includes(p);

export const useAlerts = (selectedDate: string) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [selectedInterval, setSelectedInterval] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const { toast } = useToast();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Filter alerts when selectedInterval changes
  useEffect(() => {
    if (selectedInterval === 'all') {
      setFilteredAlerts(alerts);
    } else {
      setFilteredAlerts(alerts.filter(alert => alert.interval === selectedInterval));
    }
  }, [selectedInterval, alerts]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || ((window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext))();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(console.error);
      } catch (audioError) {
        console.log('Audio playback failed:', audioError);
      }
    }
  };

  const fetchAlerts = async (date: string) => {
    console.log('📥 Fetching alerts for', date);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trading_alerts')
        .select('*')
        .eq('date', date)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedAlerts = (data || []).map(alert => ({
        ...alert,
        status: isValidStatus(alert.status) ? alert.status : 'new',
        priority: isValidPriority(alert.priority) ? alert.priority : 'medium',
      })) as Alert[];

      setAlerts(typedAlerts);
      // Initial filter application
      if (selectedInterval === 'all') {
        setFilteredAlerts(typedAlerts);
      } else {
        setFilteredAlerts(typedAlerts.filter(alert => alert.interval === selectedInterval));
      }
    } catch (error) {
      console.error('❌ Error fetching alerts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch alerts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateAlertStatus = async (alertId: string, newStatus: Alert['status']) => {
    try {
      const { error } = await supabase
        .from('trading_alerts')
        .update({ status: newStatus })
        .eq('id', alertId);

      if (error) throw error;

      const updated = alerts.map(alert =>
        alert.id === alertId ? { ...alert, status: newStatus } : alert
      );
      setAlerts(updated);

      const alert = updated.find(a => a.id === alertId);
      if (alert) {
        toast({
          title: `Alert ${newStatus}`,
          description: `${alert.title} status updated to ${newStatus}`,
        });
      }
    } catch (error) {
      console.error('❌ Error updating alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to update alert status',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    console.log('🔁 useEffect triggered: selectedDate =', selectedDate);
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 2000;
    const connectionTimeout = 10000; // 10 seconds connection timeout
    let isSubscribed = true;
    let retryTimeout: NodeJS.Timeout;
    let connectionTimeoutId: NodeJS.Timeout;

    fetchAlerts(selectedDate);

    const setupSubscription = () => {
      setConnectionStatus('connecting');
      
      // Clean up existing subscription if any
      if (channelRef.current) {
        console.log('🧹 Cleaning up existing subscription...');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Clear any existing timeouts
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (connectionTimeoutId) {
        clearTimeout(connectionTimeoutId);
      }

      console.log('📡 Setting up real-time subscription...');
      
      // Set connection timeout
      connectionTimeoutId = setTimeout(() => {
        if (isSubscribed && channelRef.current) {
          console.warn('⚠️ Connection timeout - cleaning up and retrying...');
          setConnectionStatus('error');
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
          if (retryCount < maxRetries) {
            retryCount++;
            setupSubscription();
          }
        }
      }, connectionTimeout);

      const channel = supabase
        .channel('trading-alerts-changes', {
          config: {
            broadcast: { self: true },
            presence: { key: '' },
          },
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trading_alerts',
          },
          async (payload) => {
            if (!isSubscribed) return;

            try {
              const { eventType, new: newAlert, old: oldAlert } = payload;
              console.log(`📬 Real-time ${eventType} received:`, payload);

              if (eventType === 'INSERT') {
                const typed: Alert = {
                  ...newAlert,
                  status: isValidStatus(newAlert.status) ? newAlert.status : 'new',
                  priority: isValidPriority(newAlert.priority) ? newAlert.priority : 'medium',
                } as Alert;
                setAlerts(prev => [typed, ...prev]);
                toast({
                  title: '🚨 New Trading Alert!',
                  description: `${typed.title}: ${typed.stock_symbol} - ${typed.type}`,
                  duration: 5000,
                });
                playNotificationSound();
              } else if (eventType === 'UPDATE') {
                const typed: Alert = {
                  ...newAlert,
                  status: isValidStatus(newAlert.status) ? newAlert.status : 'new',
                  priority: isValidPriority(newAlert.priority) ? newAlert.priority : 'medium',
                } as Alert;
                setAlerts(prev => prev.map(a => (a.id === typed.id ? typed : a)));
                toast({
                  title: 'Alert Updated',
                  description: `${typed.title} has been updated`,
                  duration: 3000,
                });
              } else if (eventType === 'DELETE') {
                setAlerts(prev => prev.filter(a => a.id !== oldAlert.id));
                toast({
                  title: 'Alert Removed',
                  description: `${oldAlert.title} has been removed`,
                  duration: 3000,
                });
              }
            } catch (error) {
              console.error('Error processing real-time event:', error);
            }
          }
        )
        .subscribe((status) => {
          if (!isSubscribed) return;

          console.log('📡 Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
            // Clear connection timeout on successful subscription
            if (connectionTimeoutId) {
              clearTimeout(connectionTimeoutId);
            }
            retryCount = 0;
            console.log('✅ Real-time subscription established');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnectionStatus('disconnected');
            console.warn(`⚠️ Subscription ${status} — retry ${retryCount + 1}`);
            if (retryCount < maxRetries && isSubscribed) {
              retryCount++;
              retryTimeout = setTimeout(() => {
                if (isSubscribed) {
                  console.log(`🔄 Attempting to reconnect (attempt ${retryCount})...`);
                  setupSubscription();
                }
              }, retryDelay * Math.pow(2, retryCount - 1)); // Exponential backoff with base 2
            } else {
              setConnectionStatus('error');
              console.error('❌ Max retries reached. Manual refresh needed.');
              toast({
                title: 'Connection Error',
                description: 'Real-time connection lost. Please refresh the page.',
                variant: 'destructive',
                duration: 0,
              });
            }
          }
        });

      channelRef.current = channel;
    };

    setupSubscription();

    return () => {
      console.log('🧹 Cleaning up real-time subscription...');
      isSubscribed = false;
      setConnectionStatus('disconnected');
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (connectionTimeoutId) {
        clearTimeout(connectionTimeoutId);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [selectedDate, toast]);

  return {
    alerts: filteredAlerts,
    isLoading,
    connectionStatus,
    updateAlertStatus,
    selectedInterval,
    setSelectedInterval,
    refreshAlerts: () => fetchAlerts(selectedDate),
  };
};
