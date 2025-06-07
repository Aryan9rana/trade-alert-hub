
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FilterTabsProps {
  activeFilter: 'all' | 'active' | 'ignored' | 'new' | 'active_new';
  onFilterChange: (filter: 'all' | 'active' | 'ignored' | 'new' | 'active_new') => void;
  stats: {
    total: number;
    active: number;
    ignored: number;
    new: number;
    highPriority: number;
  };
}

export const FilterTabs = ({ activeFilter, onFilterChange, stats }: FilterTabsProps) => {
  const tabs = [
    { 
      id: 'active_new' as const, 
      label: 'Active & New', 
      count: stats.active + stats.new,
      color: 'text-emerald-400'
    },
    { 
      id: 'all' as const, 
      label: 'All Alerts', 
      count: stats.total,
      color: 'text-slate-300'
    },
    { 
      id: 'new' as const, 
      label: 'New', 
      count: stats.new,
      color: 'text-purple-400'
    },
    { 
      id: 'active' as const, 
      label: 'Active', 
      count: stats.active,
      color: 'text-emerald-400'
    },
    { 
      id: 'ignored' as const, 
      label: 'Ignored', 
      count: stats.ignored,
      color: 'text-slate-400'
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={cn(
              "px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2",
              activeFilter === tab.id
                ? "bg-slate-700 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
            )}
          >
            <span className="font-medium">{tab.label}</span>
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs",
                activeFilter === tab.id 
                  ? "bg-slate-600 text-slate-200" 
                  : "bg-slate-700 text-slate-400"
              )}
            >
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
};
