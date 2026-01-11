import React, { useState, useEffect, useRef } from 'react';
import { ScheduleItem, RecurrenceType, MergedScheduleItem } from '../types.ts';
import { Check, ChevronDown, ChevronUp, Edit3, Repeat, CalendarDays, CalendarRange, Trash2, Clock, Maximize2, Plus, RefreshCcw } from 'lucide-react';

interface HourRowProps {
  item: MergedScheduleItem;
  onUpdate: (updatedData: Partial<ScheduleItem>, startHour: number, endHour: number) => void;
  isCurrent: boolean;
}

const HourRow: React.FC<HourRowProps> = ({ item, onUpdate, isCurrent }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const prevTaskRef = useRef(item.task);

  useEffect(() => {
    if (prevTaskRef.current.trim() !== '' && item.task.trim() === '') {
      setIsDeleting(true);
      const timer = setTimeout(() => setIsDeleting(false), 800);
      return () => clearTimeout(timer);
    }
    prevTaskRef.current = item.task;
  }, [item.task]);

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${period}`;
  };

  const getTimeRangeLabel = () => {
    const start = formatHour(item.startHour);
    const endHourPlusOne = item.endHour + 1;
    const endLabel = endHourPlusOne === 24 ? '12:00 AM' : formatHour(endHourPlusOne);
    if (item.startHour === item.endHour) return start;
    return `${start} - ${endLabel}`;
  };

  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ task: e.target.value }, item.startHour, item.endHour);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ notes: e.target.value }, item.startHour, item.endHour);
  };

  const handleRecurrenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ recurrence: e.target.value as RecurrenceType }, item.startHour, item.endHour);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDuration = parseInt(e.target.value);
    const newEndHour = Math.min(23, item.startHour + newDuration - 1);
    onUpdate({ 
      task: item.task, 
      notes: item.notes, 
      completed: item.completed, 
      recurrence: item.recurrence 
    }, item.startHour, newEndHour);
  };

  const toggleComplete = () => {
    onUpdate({ completed: !item.completed }, item.startHour, item.endHour);
  };

  const clearBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ task: '', notes: '', completed: false, recurrence: 'none' }, item.startHour, item.endHour);
  };

  const getRecurrenceIcon = () => {
    switch (item.recurrence) {
      case 'daily': return <Repeat size={12} />;
      case 'weekly': return <CalendarDays size={12} />;
      case 'monthly': return <CalendarRange size={12} />;
      default: return null;
    }
  };

  const duration = item.endHour - item.startHour + 1;
  const maxPossibleDuration = 24 - item.startHour;
  const hasTask = item.task.trim() !== '';

  return (
    <div 
      className={`group flex flex-col border-b border-slate-100 last:border-b-0 transition-all duration-300 relative overflow-hidden ${
        isCurrent ? 'bg-indigo-50/50' : 'bg-white hover:bg-slate-50 active:bg-slate-100'
      } ${isDeleting ? 'bg-rose-50 ring-1 ring-rose-200 z-10' : ''}`}
    >
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-rose-500/5 animate-pulse pointer-events-none">
           <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] animate-bounce">
             <RefreshCcw size={14} className="animate-spin-slow" /> Reset
           </div>
        </div>
      )}

      <div className={`flex items-center px-4 py-4 gap-4 relative z-10 transition-opacity duration-300 ${isDeleting ? 'opacity-30' : 'opacity-100'}`}>
        <div className="w-24 md:w-32 flex-shrink-0 text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
          {getTimeRangeLabel()}
          {duration > 1 && (
            <div className="text-[9px] text-indigo-500 font-black mt-0.5 flex items-center gap-1">
              <Clock size={10} /> {duration} HR
            </div>
          )}
        </div>

        <button
          onClick={toggleComplete}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 tap-target ${
            item.completed 
              ? 'bg-emerald-500 border-emerald-500 text-white' 
              : hasTask ? 'border-slate-300' : 'border-slate-100'
          }`}
          disabled={!hasTask}
        >
          {item.completed && <Check size={14} strokeWidth={3} />}
          {!hasTask && <div className="w-1 h-1 bg-slate-200 rounded-full" />}
        </button>

        <div className="flex-grow flex items-center gap-2 overflow-hidden">
          {!hasTask && <Plus size={14} className="text-slate-300 flex-shrink-0" />}
          <input
            type="text"
            value={item.task}
            onChange={handleTaskChange}
            placeholder="Add task..."
            className={`w-full bg-transparent outline-none text-slate-700 transition-all ${
              item.completed ? 'line-through text-slate-400 opacity-60' : 'font-medium'
            } placeholder:text-slate-200`}
          />
          {item.recurrence && item.recurrence !== 'none' && (
            <span className="flex-shrink-0 text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest flex items-center gap-1">
              {getRecurrenceIcon()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {hasTask && (
            <button
              onClick={clearBlock}
              className="p-2 text-slate-300 hover:text-rose-500 tap-target"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-lg tap-target transition-colors ${
              isExpanded || item.notes ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300'
            }`}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-6 md:pl-40 pr-8 animate-in slide-in-from-top-2 duration-200 space-y-4">
          <textarea
            value={item.notes}
            onChange={handleNotesChange}
            placeholder="Details..."
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 px-3 py-1.5 rounded-lg">
              <Maximize2 size={12} className="text-indigo-500" />
              <select value={duration} onChange={handleDurationChange} className="bg-transparent border-none outline-none text-indigo-600">
                {[...Array(Math.min(12, maxPossibleDuration))].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}h</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 px-3 py-1.5 rounded-lg">
              <Repeat size={12} className="text-indigo-500" />
              <select value={item.recurrence || 'none'} onChange={handleRecurrenceChange} className="bg-transparent border-none outline-none text-indigo-600">
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HourRow;