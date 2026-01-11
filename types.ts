
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface ScheduleItem {
  hour: number; // 0-23
  task: string;
  completed: boolean;
  notes: string;
  recurrence?: RecurrenceType;
}

export interface MergedScheduleItem extends Omit<ScheduleItem, 'hour'> {
  startHour: number;
  endHour: number;
}

export interface RecurringRule {
  id: string;
  hour: number;
  task: string;
  notes: string;
  type: RecurrenceType;
  dayValue?: number; // Day of week (0-6) or Day of month (1-31)
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: number;
  read: boolean;
}

export interface DayPerformance {
  date: string; // YYYY-MM-DD
  percentage: number;
  totalTasks: number;
  completedTasks: number;
}

export type ViewMode = 'home' | 'schedule' | 'calendar';
