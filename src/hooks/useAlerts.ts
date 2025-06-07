import { useState, useEffect } from 'react';
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
}

export const useAlerts = (selectedDate: string) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      console.log('Audio notification not available:', error);
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(console.error);
      } catch (audioError) {
        console.log('Audio file not available:', audioError);
      }
    }
  };

  // Fetch alerts for the selected date
  const fetchAlerts = async (date: string) => {
    console.log('Fetching alerts for date:', date);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trading_alerts')
        .select('*')
        .eq('date', date)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Fetched alerts:', data);
      const typedAlerts = (data || []).map(alert => ({
        ...alert,
        status: alert.status as 'new' | 'active' | 'ignored',
        priority: alert.priority as 'high' | 'medium' | 'low'
      }));
      
      setAlerts(typedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch alerts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update alert status
  const updateAlertStatus = async (alertId: string, newStatus: 'new' | 'active' | 'ignored') => {
    try {
      const { error } = await supabase
        .from('trading_alerts')
        .update({ status: newStatus })
        .eq('id', alertId);

      if (error) throw error;

      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        toast({
          title: `Alert ${newStatus}`,
          description: `${alert.title} status updated to ${newStatus}`,
        });
      }
    } catch (error) {
      console.error('Error updating alert:', error);
      toast({
        title: "Error",
        description: "Failed to update alert status",
        variant: "destructive"
      });
    }
  };

  // Set up real-time subscription with retry logic
  useEffect(() => {
    console.log('Setting up real-time subscription for alerts...');
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 2000; // 2 seconds
    
    // First, fetch current alerts
    fetchAlerts(selectedDate);
    
    const setupSubscription = () => {
      const channel = supabase
        .channel('trading-alerts-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trading_alerts'
          },
          async (payload) => {
            console.log('Real-time change received:', payload);
            console.log('Current selected date:', selectedDate);
            
            // Always fetch fresh data on any change
            await fetchAlerts(selectedDate);
            
            if (payload.eventType === 'INSERT') {
              const newAlert = payload.new as Alert;
              console.log('New alert received:', newAlert);
              
              toast({
                title: "🚨 New Trading Alert!",
                description: `${newAlert.title}: ${newAlert.stock_symbol} - ${newAlert.type}`,
                duration: 5000,
              });
              playNotificationSound();
            } else if (payload.eventType === 'UPDATE') {
              const updatedAlert = payload.new as Alert;
              console.log('Alert updated:', updatedAlert);
              
              toast({
                title: "Alert Updated",
                description: `${updatedAlert.title} has been updated`,
                duration: 3000,
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedAlert = payload.old as Alert;
              console.log('Alert deleted:', deletedAlert);
              
              toast({
                title: "Alert Removed",
                description: `${deletedAlert.title} has been removed`,
                duration: 3000,
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('Real-time subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to real-time updates');
            retryCount = 0; // Reset retry count on successful subscription
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel error occurred:', status);
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying subscription (${retryCount}/${maxRetries})...`);
              setTimeout(setupSubscription, retryDelay);
            } else {
              console.error('Max retries reached. Please refresh the page.');
              toast({
                title: "Connection Error",
                description: "Failed to establish real-time connection. Please refresh the page.",
                variant: "destructive",
                duration: 0, // Don't auto-dismiss
              });
            }
          }
        });

      return channel;
    };

    const channel = setupSubscription();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [selectedDate, toast]);

  return {
    alerts,
    isLoading,
    updateAlertStatus,
    refreshAlerts: () => fetchAlerts(selectedDate)
  };
};
