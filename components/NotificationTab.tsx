import React from 'react';
import { AppNotification } from '../types.ts';
import { Bell, CheckCircle2, AlertCircle, Info, Trash2, X, BellOff } from 'lucide-react';

interface NotificationTabProps {
  notifications: AppNotification[];
  onClear: (id: string) => void;
  onClearAll: () => void;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}

const NotificationTab: React.FC<NotificationTabProps> = ({ 
  notifications, 
  onClear, 
  onClearAll, 
  onMarkRead,
  onClose
}) => {
  const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);

  const getTypeStyles = (type: AppNotification['type']) => {
    switch (type) {
      case 'success': return { icon: <CheckCircle2 size={16} className="text-emerald-500" />, bg: 'bg-emerald-50' };
      case 'warning': return { icon: <AlertCircle size={16} className="text-amber-500" />, bg: 'bg-amber-50' };
      default: return { icon: <Info size={16} className="text-indigo-500" />, bg: 'bg-indigo-50' };
    }
  };

  const formatTime = (ts: number) => {
    const now = Date.now();
    const diff = now - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end p-4 pointer-events-none">
      <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] pointer-events-auto" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col pointer-events-auto animate-in slide-in-from-right-4 duration-300 h-fit max-h-[80vh] mt-16 mr-2">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <Bell size={18} />
            </div>
            <h2 className="font-bold text-slate-800">Inbox</h2>
          </div>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button 
                onClick={onClearAll}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                title="Clear all"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2 min-h-[200px]">
          {notifications.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                <BellOff size={24} />
              </div>
              <p className="text-slate-400 text-sm font-medium italic px-4">No new notifications</p>
            </div>
          ) : (
            sortedNotifications.map((notif) => {
              const styles = getTypeStyles(notif.type);
              return (
                <div 
                  key={notif.id}
                  onMouseEnter={() => !notif.read && onMarkRead(notif.id)}
                  className={`group relative flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                    notif.read ? 'bg-white border-slate-100' : 'bg-indigo-50/30 border-indigo-100 shadow-sm'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${styles.bg}`}>
                    {styles.icon}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs font-bold truncate ${notif.read ? 'text-slate-600' : 'text-slate-800'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{formatTime(notif.timestamp)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mt-0.5">{notif.message}</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onClear(notif.id); }}
                    className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                  {!notif.read && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-500 rounded-full" />
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-medium">Hover to mark as read</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationTab;