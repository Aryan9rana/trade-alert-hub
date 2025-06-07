
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const RefreshButton = ({ onRefresh, isRefreshing }: RefreshButtonProps) => {
  return (
    <Button 
      onClick={onRefresh}
      disabled={isRefreshing}
      className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 transition-all duration-200"
      size="lg"
    >
      <RefreshCw 
        className={cn(
          "w-5 h-5 mr-2", 
          isRefreshing && "animate-spin"
        )} 
      />
      {isRefreshing ? 'Refreshing...' : 'Refresh Alerts'}
    </Button>
  );
};
