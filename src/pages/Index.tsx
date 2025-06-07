import { useState } from 'react';
import { AlertCard } from '@/components/AlertCard';
import { FilterTabs } from '@/components/FilterTabs';
import { StatsCards } from '@/components/StatsCards';
import { RefreshButton } from '@/components/RefreshButton';
import { DatePicker } from '@/components/DatePicker';
import { useAlerts } from '@/hooks/useAlerts';
import { format } from 'date-fns';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'ignored' | 'new' | 'active_new'>('active_new');
  
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const { alerts, isLoading, updateAlertStatus, refreshAlerts } = useAlerts(dateString);

  // Filter alerts based on the active filter
  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active_new') return alert.status === 'active' || alert.status === 'new';
    return alert.status === activeFilter;
  });

  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    ignored: alerts.filter(a => a.status === 'ignored').length,
    new: alerts.filter(a => a.status === 'new').length,
    highPriority: alerts.filter(a => a.priority === 'high').length
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Trading Alert Dashboard
            </h1>
            <p className="text-slate-400 text-lg">
              TradingView Strategy Notifications
            </p>
          </div>
          <div className="flex items-center gap-4">
            <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
            <RefreshButton onRefresh={refreshAlerts} isRefreshing={isLoading} />
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Filter Tabs */}
        <FilterTabs 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter}
          stats={stats}
        />

        {/* Alerts List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-slate-400 text-lg">Loading alerts...</div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 text-lg mb-2">
                No {activeFilter !== 'all' && activeFilter !== 'active_new' ? activeFilter : ''} alerts found for {format(selectedDate, 'MMM dd, yyyy')}
              </div>
              <p className="text-slate-500">
                {activeFilter === 'all' 
                  ? 'Waiting for new trading signals...' 
                  : `Switch to a different filter to see more alerts`
                }
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onStatusChange={(newStatus) => updateAlertStatus(alert.id, newStatus)}
              />
            ))
          )}
        </div>

        {/* Webhook URL Information */}
        <div className="mt-12 p-6 bg-slate-800 rounded-lg border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-2">TradingView Webhook URL</h3>
          <div className="bg-slate-900 p-3 rounded border border-slate-600 mb-4">
            <code className="text-emerald-400 text-sm break-all">
              https://npqayykcyyynyrnmnoif.supabase.co/functions/v1/trading-webhook
            </code>
          </div>
          <div className="text-sm text-slate-400 space-y-2">
            <p><strong>Method:</strong> POST</p>
            <p><strong>Required fields:</strong> strategy, message</p>
            <p><strong>Optional fields:</strong> stock_symbols (array), priority (high/medium/low)</p>
            <p><strong>Example payload:</strong></p>
            <pre className="bg-slate-900 p-2 rounded text-xs text-slate-300 mt-2">
{`{
  "strategy": "RSI Oversold",
  "message": "AAPL showing oversold conditions",
  "stock_symbols": ["AAPL"],
  "priority": "high"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
