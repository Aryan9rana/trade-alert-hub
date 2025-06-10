import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const intervals = [
  { label: "1 Minute", value: "1" },
  { label: "2 Minutes", value: "2" },
  { label: "3 Minutes", value: "3" },
  { label: "5 Minutes", value: "5" },
  { label: "10 Minutes", value: "10" },
  { label: "15 Minutes", value: "15" },
]

interface IntervalFilterProps {
  selectedInterval: string
  onIntervalChange: (value: string) => void
}

export function IntervalFilter({ selectedInterval, onIntervalChange }: IntervalFilterProps) {
  return (
    <Select value={selectedInterval} onValueChange={onIntervalChange}>
      <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
        <SelectValue placeholder="Select interval" />
      </SelectTrigger>
      <SelectContent className="bg-slate-800 border-slate-700">
        <SelectItem value="all" className="text-white hover:bg-slate-700 focus:bg-slate-700">All Intervals</SelectItem>
        {intervals.map((interval) => (
          <SelectItem 
            key={interval.value} 
            value={interval.value}
            className="text-white hover:bg-slate-700 focus:bg-slate-700"
          >
            {interval.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 