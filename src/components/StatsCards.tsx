
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Bell, BellOff, AlertTriangle, Star } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    total: number;
    active: number;
    ignored: number;
    new: number;
    highPriority: number;
  };
}

export const StatsCards = ({ stats }: StatsCardsProps) => {
  const cards = [
    {
      title: 'Total Alerts',
      value: stats.total,
      icon: Bell,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'New',
      value: stats.new,
      icon: Star,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      title: 'Active',
      value: stats.active,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'Ignored',
      value: stats.ignored,
      icon: BellOff,
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/20'
    },
    {
      title: 'High Priority',
      value: stats.highPriority,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card 
            key={card.title}
            className={`p-6 bg-slate-800/30 border ${card.borderColor} ${card.bgColor} hover:bg-slate-800/50 transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-2">
                  {card.title}
                </p>
                <p className={`text-3xl font-bold ${card.color}`}>
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
