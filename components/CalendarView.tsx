
import React, { useState, useMemo } from 'react';
import { DayPerformance } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Trash2 } from 'lucide-react';

interface CalendarViewProps {
  history: Record<string, DayPerformance>;
  onSelectDate: (date: string) => void;
  onDeleteHistory?: (date: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ history, onSelectDate, onDeleteHistory }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Uint8Array([new Date(year, month, 1).getDay()])[0];
    const totalDays = new Uint8Array([new Date(year, month + 1, 0).getDate()])[0];
    
    const days = [];
    // Padding for start of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  const getPercentStyles = (percent: number) => {
    if (percent < 60) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (percent < 90) return 'text-orange-600 bg-orange-50 border-orange-100';
    if (percent < 98) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const handleDelete = (e: React.MouseEvent, dateStr: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete all data for ${dateStr}? This action cannot be undone.`)) {
      onDeleteHistory?.(dateStr);
    }
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <CalendarIcon size={20} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-700">Performance History</h2>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-bold text-slate-600 px-2 min-w-[120px] text-center">{monthName}</span>
          <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-2">
              {d}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;
            
            const dateStr = date.toISOString().split('T')[0];
            const perf = history[dateStr];
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div 
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                className={`relative group aspect-square rounded-2xl border p-1 flex flex-col items-center justify-center transition-all cursor-pointer hover:border-indigo-300 hover:shadow-md ${
                  isToday ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 bg-white'
                }`}
              >
                <span className={`text-sm font-bold ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                  {date.getDate()}
                </span>
                
                {perf && perf.totalTasks > 0 ? (
                  <>
                    <div className={`mt-1 text-[9px] font-black px-1.5 py-0.5 rounded-full border ${getPercentStyles(perf.percentage)}`}>
                      {perf.percentage}%
                    </div>
                    {onDeleteHistory && (
                      <button 
                        onClick={(e) => handleDelete(e, dateStr)}
                        className="absolute -top-1 -right-1 p-1 bg-white border border-slate-100 rounded-full text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="mt-1 w-1 h-1 bg-slate-100 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 flex items-start gap-3">
        <Info size={16} className="text-slate-400 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Performance Legend</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[10px] text-slate-400 font-medium">&lt; 60%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-[10px] text-slate-400 font-medium">60-89%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-[10px] text-slate-400 font-medium">90-97%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-400 font-medium">98%+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
