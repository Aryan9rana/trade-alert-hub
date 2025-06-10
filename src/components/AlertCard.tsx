import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, TrendingUp, AlertTriangle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface Alert {
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
}

interface AlertCardProps {
  alert: Alert;
  onStatusChange: (newStatus: 'new' | 'active' | 'ignored') => void;
}

export const AlertCard = ({ alert, onStatusChange }: AlertCardProps) => {
  const [formattedTime, setFormattedTime] = useState('');

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSeconds < 30) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  // Update time more frequently
  useEffect(() => {
    const updateTime = () => {
      setFormattedTime(formatTime(alert.timestamp));
    };

    // Initial update
    updateTime();

    // Update every 10 seconds for more recent alerts
    const interval = setInterval(updateTime, 10000);

    return () => clearInterval(interval);
  }, [alert.timestamp]);

  const highlightStockSymbols = (message: string, symbols: string[]) => {
    let highlightedMessage = message;
    symbols.forEach(symbol => {
      const regex = new RegExp(`\\b${symbol}\\b`, 'gi');
      highlightedMessage = highlightedMessage.replace(
        regex, 
        `<span class="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-semibold">${symbol}</span>`
      );
    });
    return highlightedMessage;
  };

  const getPriorityIcon = () => {
    switch (alert.priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'medium':
        return <TrendingUp className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    switch (alert.status) {
      case 'new':
        return 'border-purple-500/20 bg-purple-500/5';
      case 'active':
        return 'border-emerald-500/20 bg-emerald-500/5';
      case 'ignored':
        return 'border-slate-500/20 bg-slate-500/5';
      default:
        return 'border-slate-500/20 bg-slate-500/5';
    }
  };

  const getStatusBadgeColor = () => {
    switch (alert.status) {
      case 'new':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'ignored':
        return 'bg-slate-600/20 text-slate-400 border-slate-600/30';
      default:
        return 'bg-slate-600/20 text-slate-400 border-slate-600/30';
    }
  };

  const getStatusIcon = () => {
    switch (alert.status) {
      case 'new':
        return <Star className="w-3 h-3" />;
      case 'active':
        return <TrendingUp className="w-3 h-3" />;
      case 'ignored':
        return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <Card className={cn(
      "p-6 border transition-all duration-200 hover:shadow-lg bg-slate-800/50",
      alert.status === 'ignored' ? "opacity-75" : "",
      getStatusColor()
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            {getPriorityIcon()}
            <h3 className="text-lg font-semibold text-white">
              {alert.title}
            </h3>
            <Badge 
              variant="outline"
              className={cn("text-xs flex items-center gap-1", getStatusBadgeColor())}
            >
              {getStatusIcon()}
              {alert.status.toUpperCase()}
            </Badge>
            <Badge 
              variant="outline"
              className={cn(
                "text-xs border",
                alert.priority === 'high' 
                  ? "border-red-500/30 text-red-400"
                  : alert.priority === 'medium'
                  ? "border-yellow-500/30 text-yellow-400"
                  : "border-slate-500/30 text-slate-400"
              )}
            >
              {alert.priority.toUpperCase()}
            </Badge>
          </div>

          {/* Alert Details */}
          <div className="text-slate-300 leading-relaxed space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Type:</span>
              <span>{alert.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Entry Price:</span>
              <span>${alert.entry_price.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Stop Loss:</span>
              <span>${alert.stoploss_price.toFixed(2)}</span>
            </div>
            {alert.test_mode && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                Test Mode
              </Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Clock className="w-4 h-4" />
              {formattedTime}
            </div>
            
            <Badge 
              variant="outline"
              className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
            >
              {alert.stock_symbol}
            </Badge>
          </div>

          {/* New fields */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center text-sm text-slate-400">
              <span className="mr-2">Interval:</span>
              <span className="text-white">{alert.interval}m</span>
            </div>
            <div className="flex items-center text-sm text-slate-400">
              <span className="mr-2">200 MA Status:</span>
              <span className="text-white">
                {alert.close_to_200_ma_2min ? '2min ✓' : '2min ✗'} | 
                {alert.close_to_200_ma_5min ? '5min ✓' : '5min ✗'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ml-6 flex flex-col gap-2">
          {alert.status === 'new' && (
            <>
              <Button
                onClick={() => onStatusChange('active')}
                size="sm"
                className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all duration-200"
              >
                Activate
              </Button>
              <Button
                onClick={() => onStatusChange('ignored')}
                variant="outline"
                size="sm"
                className="bg-slate-600/20 border-slate-600/30 text-slate-400 hover:bg-slate-600/30 transition-all duration-200"
              >
                Ignore
              </Button>
            </>
          )}
          {alert.status === 'active' && (
            <Button
              onClick={() => onStatusChange('ignored')}
              size="sm"
              className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all duration-200"
            >
              Ignore
            </Button>
          )}
          {alert.status === 'ignored' && (
            <Button
              onClick={() => onStatusChange('active')}
              size="sm"
              className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all duration-200"
            >
              Activate
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
