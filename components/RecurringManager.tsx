import React from 'react';
import { RecurringRule, RecurrenceType } from '../types.ts';
import { X, Trash2, Repeat, CalendarDays, CalendarRange, Clock } from 'lucide-react';

interface RecurringManagerProps {
  rules: RecurringRule[];
  onDelete: (id: string) => void;
  onClose: () => void;
}

const RecurringManager: React.FC<RecurringManagerProps> = ({ rules, onDelete, onClose }) => {
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${period}`;
  };

  const getDayLabel = (rule: RecurringRule) => {
    if (rule.type === 'weekly' && rule.dayValue !== undefined) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[rule.dayValue];
    }
    if (rule.type === 'monthly' && rule.dayValue !== undefined) {
      return `Day ${rule.dayValue} of month`;
    }
    return 'Every day';
  };

  const getTypeIcon = (type: RecurrenceType) => {
    switch (type) {
      case 'daily': return <Repeat size={14} className="text-emerald-500" />;
      case 'weekly': return <CalendarDays size={14} className="text-blue-500" />;
      case 'monthly': return <CalendarRange size={14} className="text-purple-500" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Repeat size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Recurring Tasks</h2>
              <p className="text-xs text-slate-500 font-medium">Automatic templates for your schedule</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-slate-200 p-2 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
          {rules.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Clock size={32} />
              </div>
              <p className="text-slate-400 font-medium italic">No recurring tasks set yet.</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Expand an hour slot in your schedule to set a task as recurring.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {rules.sort((a, b) => a.hour - b.hour).map((rule) => (
                <div key={rule.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-bold text-slate-400 w-16">
                      {formatHour(rule.hour)}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-700">{rule.task}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {getTypeIcon(rule.type)}
                        <span>{rule.type}</span>
                        <span>•</span>
                        <span>{getDayLabel(rule)}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onDelete(rule.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurringManager;