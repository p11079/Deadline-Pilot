/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'completed' | 'overdue';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  timeEstimateMinutes: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO String or date YYYY-MM-DD HH:MM
  priority: Priority;
  status: TaskStatus;
  category: string;
  estimatedHours: number;
  actualHoursSpent: number;
  checklist: ChecklistItem[];
  progressScore: number; // 0 to 100 representing pilot completion confidence
  createdAt: string;
  aiSuggestedReason?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  energyRequired?: 'low' | 'medium' | 'high';
  isRecurring?: boolean;
  recurringInterval?: 'none' | 'daily' | 'weekly' | 'monthly';
}

export interface TimeBlock {
  id: string;
  taskId?: string;
  title: string;
  startTime: string; // ISO String or HH:MM
  endTime: string; // ISO String or HH:MM
  date: string; // YYYY-MM-DD
  category: string;
  completed: boolean;
}

export type ActivePage = 'landing' | 'login' | 'dashboard' | 'tasks' | 'calendar' | 'analytics' | 'assistant' | 'settings' | 'planner' | 'notifications';

export interface ImpossibleScheduleAlert {
  severity: 'info' | 'warning' | 'critical';
  issue: string;
  impact: string;
  resolution: string;
}

export interface SplitSubTask {
  title: string;
  estimatedHours: number;
  sequence: number;
}

export interface SplitTaskSuggestion {
  originalTaskId: string;
  originalTitle: string;
  reasonForSplit: string;
  subTasks: SplitSubTask[];
}

export interface DeadlinePrediction {
  taskId: string;
  taskTitle: string;
  deadline: string;
  estimatedHoursLeft: number;
  prediction: 'safe' | 'at_risk' | 'missed';
  daysToDeadline?: number;
  explanation: string;
}

export interface MovedLowPriorityWork {
  taskId: string;
  title: string;
  priority: string;
  movedToDate: string;
  reason: string;
}

export interface BurnoutEstimate {
  percentage: number;
  level: 'low' | 'moderate' | 'high' | 'critical';
  stressors: string[];
  mitigationAction: string;
}

export interface PlanTimeBlock {
  startTime: string;
  endTime: string;
  type: 'focus' | 'break' | 'admin' | 'rest';
  title: string;
  description: string;
  taskId?: string;
}

export interface RecommendedBreak {
  timeSlot: string;
  durationMinutes: number;
  activity: string;
  benefit: string;
}

export interface ProactiveCopilotPlan {
  impossibleScheduleAlerts: ImpossibleScheduleAlert[];
  splitTasks: SplitTaskSuggestion[];
  deadlinePredictions: DeadlinePrediction[];
  movedLowPriorityWork: MovedLowPriorityWork[];
  burnoutEstimate: BurnoutEstimate;
  todaysPlan: PlanTimeBlock[];
  tomorrowsPlan: PlanTimeBlock[];
  recommendedBreaks: RecommendedBreak[];
  copilotReasoning: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  timezone: string;
  streakCount: number;
  pilotPersona: 'supportive' | 'tough-love' | 'analytical' | 'hyper-focused';
  weeklyFocusGoal: number; // hours
}

export interface AIInsight {
  id: string;
  type: 'danger' | 'warning' | 'success' | 'tip';
  title: string;
  message: string;
  actionText?: string;
  actionPayload?: any;
  timestamp: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedAction?: {
    type: 'create_task' | 'add_time_block' | 'reschedule' | 'optimize_checklist';
    label: string;
    payload: any;
  };
}

export type NotificationType = 'deadline' | 'ai_warning' | 'brief' | 'summary' | 'overload' | 'burnout';

export interface SmartNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'info' | 'warning' | 'critical';
  actionUrl?: string;
  channels: ('browser' | 'email' | 'fcm' | 'system')[];
}

export interface NotificationSettings {
  enableBrowser: boolean;
  enableEmail: boolean;
  enableFCM: boolean;
  alertTypes: {
    deadline: boolean;
    ai_warning: boolean;
    brief: boolean;
    summary: boolean;
    overload: boolean;
    burnout: boolean;
  };
  emailAddress?: string;
  fcmToken?: string;
}

