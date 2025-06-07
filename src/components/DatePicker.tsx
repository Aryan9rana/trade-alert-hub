
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const DatePicker = ({ selectedDate, onDateChange }: DatePickerProps) => {
  const goToPreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(selectedDate.getDate() - 1);
    onDateChange(previousDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + 1);
    onDateChange(nextDay);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={goToPreviousDay}
        className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 min-w-[160px] justify-start"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            {format(selectedDate, 'MMM dd, yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateChange(date)}
            initialFocus
            className="text-slate-300"
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="sm"
        onClick={goToNextDay}
        disabled={isToday}
        className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      {!isToday && (
        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700"
        >
          Today
        </Button>
      )}
    </div>
  );
};
