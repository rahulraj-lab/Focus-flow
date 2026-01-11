
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar as CalendarIcon, Trash2, LayoutDashboard, Sparkles, CheckCircle2, Repeat, Clock, ListTodo, CircleDashed, CheckCircle, Bell } from 'lucide-react';
import { ScheduleItem, RecurringRule, AppNotification, ViewMode, DayPerformance, MergedScheduleItem } from './types';
import HourRow from './components/HourRow';
import AIPanner from './components/AIPanner';
import RecurringManager from './components/RecurringManager';
import NotificationTab from './components/NotificationTab';
import CalendarView from './components/CalendarView';

const STORAGE_KEYS = {
  DAY_PREFIX: 'aura_day_',
  RECURRING: 'aura_recurring_rules',
  NOTIFICATIONS: 'aura_notifications'
};

const App: React.FC = () => {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [history, setHistory] = useState<Record<string, DayPerformance>>({});
  const [showAI, setShowAI] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>('schedule');
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [selectedViewingDate, setSelectedViewingDate] = useState(new Date().toISOString().split('T')[0]);

  // Sync state with history for hardware back button support
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setActiveView(event.state.view);
      }
    };
    window.addEventListener('popstate', handlePopState);
    // Initial state
    window.history.replaceState({ view: activeView }, '');
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: ViewMode) => {
    if (view !== activeView) {
      window.history.pushState({ view }, '');
      setActiveView(view);
    }
  };

  // Load Initial Data
  useEffect(() => {
    const savedRules = localStorage.getItem(STORAGE_KEYS.RECURRING);
    if (savedRules) {
      try { setRecurringRules(JSON.parse(savedRules)); } catch (e) { console.error(e); }
    }
    const savedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (savedNotifs) {
      try { setNotifications(JSON.parse(savedNotifs)); } catch (e) { console.error(e); }
    }
    refreshHistory();
  }, []);

  const refreshHistory = () => {
    const dayHistory: Record<string, DayPerformance> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEYS.DAY_PREFIX)) {
        try {
          const date = key.replace(STORAGE_KEYS.DAY_PREFIX, '');
          const dayItems: ScheduleItem[] = JSON.parse(localStorage.getItem(key) || '[]');
          const activeTasks = dayItems.filter(it => it.task.trim() !== '');
          const totalTasks = activeTasks.length;
          const completedTasks = activeTasks.filter(it => it.completed).length;
          const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
          dayHistory[date] = { date, percentage, totalTasks, completedTasks };
        } catch (e) { console.error(e); }
      }
    }
    setHistory(dayHistory);
  };

  const deleteHistoryForDate = (date: string) => {
    localStorage.removeItem(STORAGE_KEYS.DAY_PREFIX + date);
    refreshHistory();
    if (date === selectedViewingDate) initializeNewDay(date);
    addNotification({ title: "History Cleared", message: `Deleted data for ${date}.`, type: 'info' });
  };

  useEffect(() => {
    const dayKey = STORAGE_KEYS.DAY_PREFIX + selectedViewingDate;
    const savedDay = localStorage.getItem(dayKey);
    if (savedDay) {
      try { setItems(JSON.parse(savedDay)); } catch (e) { initializeNewDay(selectedViewingDate); }
    } else {
      initializeNewDay(selectedViewingDate);
    }
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60000);
    return () => clearInterval(interval);
  }, [selectedViewingDate]);

  const initializeNewDay = (dateStr: string) => {
    const rules: RecurringRule[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECURRING) || '[]');
    const date = new Date(dateStr);
    const newDay: ScheduleItem[] = Array.from({ length: 24 }, (_, i) => {
      const rule = rules.find(r => r.hour === i && (r.type === 'daily' || (r.type === 'weekly' && r.dayValue === date.getDay()) || (r.type === 'monthly' && r.dayValue === date.getDate())));
      return { hour: i, task: rule ? rule.task : '', completed: false, notes: rule ? rule.notes : '', recurrence: rule ? rule.type : 'none' };
    });
    setItems(newDay);
  };

  const addNotification = (notif: Pick<AppNotification, 'title' | 'message' | 'type'>) => {
    const newNotif: AppNotification = { ...notif, id: `notif-${Date.now()}`, timestamp: Date.now(), read: false };
    setNotifications(prev => [newNotif, ...prev].slice(0, 30));
  };

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(STORAGE_KEYS.DAY_PREFIX + selectedViewingDate, JSON.stringify(items));
      refreshHistory(); 
    }
  }, [items, selectedViewingDate]);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurringRules)); }, [recurringRules]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications)); }, [notifications]);

  const updateItemRange = useCallback((updatedData: Partial<ScheduleItem>, startHour: number, endHour: number) => {
    setItems(prev => {
      const next = [...prev];
      for (let h = startHour; h <= endHour; h++) {
        next[h] = { ...next[h], ...updatedData };
      }
      return next;
    });

    const date = new Date(selectedViewingDate);
    setRecurringRules(prevRules => {
      let newRules = prevRules.filter(r => !(r.hour >= startHour && r.hour <= endHour));
      if (updatedData.task !== '' && updatedData.recurrence && updatedData.recurrence !== 'none') {
        for (let h = startHour; h <= endHour; h++) {
          newRules.push({
            id: `rule-${h}-${Date.now()}`,
            hour: h,
            task: updatedData.task || items[h].task,
            notes: updatedData.notes !== undefined ? updatedData.notes : items[h].notes,
            type: updatedData.recurrence,
            dayValue: updatedData.recurrence === 'weekly' ? date.getDay() : updatedData.recurrence === 'monthly' ? date.getDate() : undefined
          });
        }
      }
      return newRules;
    });

    if (updatedData.task === '') {
      addNotification({ title: "Task Cleared", message: `Slot ${startHour}:00 reset.`, type: 'info' });
    } else if (updatedData.completed) {
      addNotification({ title: "Task Done", message: `Completed: ${updatedData.task || items[startHour].task}`, type: 'success' });
    }
  }, [selectedViewingDate, items]);

  const deleteRecurringRule = (id: string) => {
    setRecurringRules(prev => prev.filter(r => r.id !== id));
    addNotification({ title: "Template Removed", message: "Rule deleted.", type: 'info' });
  };

  const handleDateSelectFromCalendar = (date: string) => {
    setSelectedViewingDate(date);
    navigateTo('schedule');
  };

  const mergedItems = useMemo(() => {
    const merged: MergedScheduleItem[] = [];
    if (items.length === 0) return merged;
    let current: MergedScheduleItem = { ...items[0], startHour: items[0].hour, endHour: items[0].hour };
    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      const canMerge = item.task.trim() !== '' && item.task === current.task && item.completed === current.completed && item.notes === current.notes && item.recurrence === current.recurrence;
      if (canMerge) { current.endHour = item.hour; } else { merged.push({ ...current }); current = { ...item, startHour: item.hour, endHour: item.hour }; }
    }
    merged.push(current);
    return merged;
  }, [items]);

  const mergedRemaining = useMemo(() => mergedItems.filter(it => it.task.trim() !== '' && !it.completed), [mergedItems]);
  const progress = items.filter(it => it.task.trim() !== '').length === 0 ? 0 : Math.round((items.filter(it => it.task.trim() !== '' && it.completed).length / items.filter(it => it.task.trim() !== '').length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pb-32 font-inter selection:bg-indigo-100">
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 pb-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform">
                <LayoutDashboard size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">FocusFlow</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <CalendarIcon size={10} /> {new Date(selectedViewingDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl relative tap-target"><Bell size={20} />{notifications.filter(n => !n.read).length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />}</button>
              <button onClick={() => setShowRecurring(true)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl tap-target"><Repeat size={20} /></button>
              <button onClick={() => setShowAI(true)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl tap-target"><Sparkles size={20} /></button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="inline-flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
              {['home', 'schedule', 'calendar'].map((v) => (
                <button 
                  key={v} 
                  onClick={() => navigateTo(v as ViewMode)} 
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all tap-target ${activeView === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                >
                  {v === 'home' && <LayoutDashboard size={14} />}
                  {v === 'schedule' && <Clock size={14} />}
                  {v === 'calendar' && <CalendarIcon size={14} />}
                  {v === 'schedule' ? 'Timeline' : v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-3xl px-4 mt-8 flex flex-col gap-6">
        {activeView !== 'calendar' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center justify-between active:bg-slate-50 transition-colors">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Efficiency</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-800 tracking-tighter">{progress}%</span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Daily Goal</span>
              </div>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                <circle cx="32" cy="32" r="28" fill="transparent" stroke="#4f46e5" strokeWidth="6" strokeDasharray={175.9} strokeDashoffset={175.9 - (175.9 * progress) / 100} strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-indigo-600"><CheckCircle2 size={20} /></div>
            </div>
          </div>
        )}

        {activeView === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-2 text-xs font-black text-slate-400 uppercase tracking-widest"><CircleDashed size={14} className="text-amber-500" /> Pending Tasks</div>
              {mergedRemaining.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 border-2 border-dashed border-slate-200 text-center text-slate-300 italic text-sm">No pending tasks for today.</div>
              ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  {mergedRemaining.map(item => <HourRow key={`${item.startHour}-${item.endHour}`} item={item} onUpdate={updateItemRange} isCurrent={currentHour >= item.startHour && currentHour <= item.endHour} />)}
                </div>
              )}
            </section>
          </div>
        )}

        {activeView === 'schedule' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8 animate-in fade-in duration-500">
            <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hourly Timeline</div>
            <div className="divide-y divide-slate-100">
              {mergedItems.map(item => <HourRow key={`${item.startHour}-${item.endHour}`} item={item} onUpdate={updateItemRange} isCurrent={currentHour >= item.startHour && currentHour <= item.endHour} />)}
            </div>
          </div>
        )}

        {activeView === 'calendar' && <CalendarView history={history} onSelectDate={handleDateSelectFromCalendar} onDeleteHistory={deleteHistoryForDate} />}
      </main>

      {/* Floating Action Navigation (Mobile Bottom Bar) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-lg border border-slate-200 shadow-2xl rounded-full px-2 py-2 flex items-center gap-1 z-50 fixed-bottom-nav">
        <button onClick={() => navigateTo('home')} className={`flex items-center gap-2 px-10 py-3 rounded-full text-sm font-bold transition-all tap-target ${activeView === 'home' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400'}`}><LayoutDashboard size={18} />Home</button>
        <button onClick={() => navigateTo('schedule')} className={`flex items-center gap-2 px-10 py-3 rounded-full text-sm font-bold transition-all tap-target ${activeView === 'schedule' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400'}`}><Clock size={18} />Timeline</button>
      </nav>

      {showAI && <AIPanner 
        history={history}
        recurringRules={recurringRules}
        onPlanGenerated={(ai) => { setItems(prev => prev.map(it => { const m = ai.find(a => a.hour === it.hour); return m ? { ...it, task: m.task || '', notes: m.notes || '', completed: false } : it; })); navigateTo('schedule'); setShowAI(false); }} 
        onClose={() => setShowAI(false)} 
      />}
      {showRecurring && <RecurringManager rules={recurringRules} onDelete={deleteRecurringRule} onClose={() => setShowRecurring(false)} />}
      {showNotifications && <NotificationTab notifications={notifications} onClear={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} onClearAll={() => setNotifications([])} onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} onClose={() => setShowNotifications(false)} />}
    </div>
  );
};

export default App;
