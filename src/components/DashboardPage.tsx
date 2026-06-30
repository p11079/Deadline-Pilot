/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  CheckCircle, 
  Calendar as CalIcon, 
  ArrowRight, 
  Zap, 
  Target, 
  Flame, 
  Plus, 
  CheckSquare, 
  CheckCircle2,
  Trash2, 
  ChevronRight,
  Gauge,
  Activity,
  Award,
  AlertCircle
} from 'lucide-react';
import { Task, AIInsight, TimeBlock, UserProfile, ActivePage, Priority, TaskStatus } from '../types';

interface DashboardPageProps {
  tasks: Task[];
  insights: AIInsight[];
  timeBlocks: TimeBlock[];
  user: UserProfile;
  onNavigate: (page: ActivePage) => void;
  onToggleChecklistItem: (taskId: string, itemId: string) => void;
  onApplyInsightAction: (actionPayload: any) => void;
  onAddTask?: (newTask: Omit<Task, 'id' | 'createdAt' | 'progressScore'>) => void;
  onUpdateTask?: (updatedTask: Task) => void;
}

// Reusable Metric Card
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  colorClass = "from-indigo-500 to-violet-500", 
  bgClass = "indigo-500/10" 
}: { 
  title: string; 
  value: string | number; 
  subtitle: string; 
  icon: React.ComponentType<any>; 
  colorClass?: string; 
  bgClass?: string;
}) {
  return (
    <motion.div 
      className="glass-panel border-white/5 bg-[#0d0d10]/90 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300 shadow-xl"
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClass} opacity-5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none`} />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{title}</p>
          <h4 className="text-3xl font-bold font-mono text-white tracking-tight">{value}</h4>
          <p className="text-xs text-zinc-400 font-medium">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${colorClass} bg-opacity-10 flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-indigo-400" />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage({
  tasks,
  insights,
  timeBlocks,
  user,
  onNavigate,
  onToggleChecklistItem,
  onApplyInsightAction,
  onAddTask,
  onUpdateTask
}: DashboardPageProps) {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('medium');
  const [quickCategory, setQuickCategory] = useState('Engineering');
  const [quickHours, setQuickHours] = useState(2);
  const [successToast, setSuccessToast] = useState('');

  // Critical task & dynamic timer
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const criticalTask = activeTasks.find(t => t.priority === 'critical') || activeTasks.find(t => t.priority === 'high') || activeTasks[0];
  const [timeLeftStr, setTimeLeftStr] = useState('00:00:00');

  useEffect(() => {
    if (!criticalTask) return;
    
    const updateTimer = () => {
      const diffMs = new Date(criticalTask.deadline).getTime() - new Date().getTime();
      if (diffMs <= 0) {
        setTimeLeftStr("OVERDUE");
        return;
      }
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      const pad = (num: number) => num.toString().padStart(2, '0');
      setTimeLeftStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [criticalTask]);

  // Today's Time Blocks
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayBlocks = timeBlocks
    .filter(tb => tb.date === todayDateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Focus time calculation
  const completedBlocks = timeBlocks.filter(tb => tb.completed);
  const totalFocusHoursCompleted = completedBlocks.reduce((acc, block) => {
    const [sh, sm] = block.startTime.split(':').map(Number);
    const [eh, em] = block.endTime.split(':').map(Number);
    const diffHours = (eh - sh) + (em - sm) / 60;
    return acc + (diffHours > 0 ? diffHours : 1);
  }, 0);

  // Today's focus hours
  const todayFocusHours = todayBlocks
    .filter(tb => tb.completed)
    .reduce((acc, block) => {
      const [sh, sm] = block.startTime.split(':').map(Number);
      const [eh, em] = block.endTime.split(':').map(Number);
      const diffHours = (eh - sh) + (em - sm) / 60;
      return acc + (diffHours > 0 ? diffHours : 1);
    }, 0);

  // Productivity Score Calculation
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const totalTasksCount = tasks.length;
  const taskCompletionRatio = totalTasksCount > 0 ? completedTasksCount / totalTasksCount : 0;
  const timeblockCompletionRatio = timeBlocks.length > 0 ? completedBlocks.length / timeBlocks.length : 0;
  
  // Dynamic metrics
  const rawProductivityScore = Math.min(
    100, 
    Math.round((taskCompletionRatio * 45) + (timeblockCompletionRatio * 35) + (user.streakCount * 4))
  );
  const productivityScore = totalTasksCount === 0 ? 80 : rawProductivityScore;

  const getProductivityGrade = (score: number) => {
    if (score >= 95) return { grade: 'A+', label: 'SUPERIOR autopilot synchronization', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' };
    if (score >= 85) return { grade: 'A', label: 'OPTIMAL flight path parameters', color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' };
    if (score >= 70) return { grade: 'B', label: 'STABLE operational clearance', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' };
    return { grade: 'C', label: 'ATTENTION: Critical turbulence detected', color: 'text-rose-400 border-rose-500/20 bg-rose-500/5' };
  };

  const scoreDetails = getProductivityGrade(productivityScore);

  // Today's Active Tasks (Not completed, and either due today or without a deadline)
  const todayTasks = tasks.filter(t => {
    if (t.status === 'completed') return false;
    if (!t.deadline) return true;
    return t.deadline.startsWith(todayDateStr);
  });

  // Upcoming Milestones (Sorted by nearest first)
  const upcomingDeadlines = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  // Quick Add handler
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !onAddTask) return;

    // Default deadline: Today plus 8 hours
    const defaultDeadline = new Date();
    defaultDeadline.setHours(defaultDeadline.getHours() + 8);

    onAddTask({
      title: quickTitle,
      description: `Tactical task initialized directly from command deck.`,
      deadline: defaultDeadline.toISOString().slice(0, 16).replace('T', ' '),
      priority: quickPriority,
      status: 'todo',
      category: quickCategory,
      estimatedHours: quickHours,
      actualHoursSpent: 0,
      checklist: [
        { id: `cl-${Date.now()}-1`, text: 'Analyze objectives', completed: false, timeEstimateMinutes: 15 },
        { id: `cl-${Date.now()}-2`, text: 'Execute flight focus sprint', completed: false, timeEstimateMinutes: 45 }
      ]
    });

    setQuickTitle('');
    setSuccessToast('New deadline logged to radar successfully.');
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleToggleTaskStatus = (task: Task) => {
    if (!onUpdateTask) return;
    const newStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    onUpdateTask({
      ...task,
      status: newStatus,
      progressScore: newStatus === 'completed' ? 100 : 0
    });
  };

  // Compile Dynamic Activity Log
  const derivedActivities = [
    ...tasks.map(t => ({
      id: `act-task-${t.id}-${t.createdAt}`,
      type: 'task',
      title: `Tactical milestone logged: "${t.title}"`,
      timestamp: t.createdAt,
      category: t.category,
      priority: t.priority
    })),
    ...tasks.filter(t => t.status === 'completed').map(t => ({
      id: `act-comp-${t.id}`,
      type: 'completed',
      title: `Milestone shored up safely: "${t.title}"`,
      timestamp: t.deadline, // or custom completed date
      category: t.category,
      priority: t.priority
    })),
    ...timeBlocks.filter(tb => tb.completed).map(tb => ({
      id: `act-block-${tb.id}`,
      type: 'focus_logged',
      title: `Focus session recorded: "${tb.title}"`,
      timestamp: `${tb.date}T${tb.endTime}:00.000Z`,
      category: tb.category,
      priority: 'low'
    }))
  ]
  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  .slice(0, 5);

  return (
    <div className="space-y-8 font-sans pb-12">
      
      {/* Dynamic Toast feedback */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            className="fixed bottom-6 right-6 bg-[#0d0d10] border border-indigo-500/30 text-indigo-200 px-4 py-3 rounded-xl shadow-2xl z-50 text-xs font-mono flex items-center gap-2.5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
          >
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin-slow" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Tower Header Greeting */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white flex items-center gap-2 tracking-tight">
            Welcome back, {user.name}
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            DeadlinePilot auto-routing active. Flight plan synchronizing across <span className="text-zinc-200 font-mono text-xs">{user.timezone}</span>.
          </p>
        </div>

        {/* Tactical Active Streak */}
        <div className="flex items-center gap-3 bg-[#0d0d10]/90 px-4 py-2.5 rounded-xl border border-white/10 shadow-lg">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
            <Flame className="w-5 h-5 fill-orange-400/20" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono block">Deadline Streak</span>
            <span className="block font-mono text-xs font-bold text-orange-400">{user.streakCount} target submissions</span>
          </div>
        </div>
      </div>

      {/* Reusable BENTO Grid - Stat Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Productivity Score" 
          value={`${productivityScore}/100`} 
          subtitle="Pilot system diagnostic score" 
          icon={Gauge}
          colorClass="from-indigo-500 to-violet-500"
        />
        <StatCard 
          title="Focus Logged" 
          value={`${totalFocusHoursCompleted.toFixed(1)} hrs`} 
          subtitle="Deep work blocks cleared" 
          icon={Clock}
          colorClass="from-emerald-500 to-teal-500"
        />
        <StatCard 
          title="Completion Ratio" 
          value={`${completedTasksCount}/${totalTasksCount}`} 
          subtitle={`${Math.round(taskCompletionRatio * 100)}% of total radar load`} 
          icon={CheckCircle}
          colorClass="from-blue-500 to-cyan-500"
        />
        <StatCard 
          title="Active Streak" 
          value={`${user.streakCount} days`} 
          subtitle="Zero critical delay record" 
          icon={Flame}
          colorClass="from-orange-500 to-amber-500"
        />
      </div>

      {/* Primary Cockpit Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left column elements (Emergency Vector, Today's Checklist, AI Insight alerts) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Emergency Alert & Live Tracker */}
          {criticalTask ? (
            <motion.div 
              className="glass-panel border-rose-500/25 bg-[#0d0d10]/95 rounded-2xl p-6 relative overflow-hidden shadow-2xl"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
              <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-indigo-500 w-full animate-pulse" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300 font-bold uppercase tracking-wider mb-2 font-mono">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>Emergency Flight Vector</span>
                  </div>
                  <h3 className="text-white font-bold text-xl tracking-tight">{criticalTask.title}</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">{criticalTask.description}</p>
                </div>

                <div className="bg-zinc-950/80 border border-white/5 p-4 rounded-xl text-center min-w-[160px] shadow-inner">
                  <span className="text-[10px] font-bold text-rose-400 tracking-wider block uppercase mb-1 font-mono">Time Remaining</span>
                  <span className="font-mono text-2xl font-bold tracking-tight text-white">{timeLeftStr}</span>
                </div>
              </div>

              {/* Survival checklist inside the critical task */}
              <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    Confidence Score: 
                    <span className={`font-semibold ${criticalTask.progressScore > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {criticalTask.progressScore}%
                    </span>
                  </span>
                  <span className="text-zinc-500 text-[11px] font-mono">
                    {criticalTask.checklist.filter(c => c.completed).length}/{criticalTask.checklist.length} milestones
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(criticalTask.checklist.filter(c => c.completed).length / Math.max(1, criticalTask.checklist.length)) * 100}%` }}
                  />
                </div>

                {/* Checklist tasks */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block font-mono">Radar Checklist Focus</span>
                  {criticalTask.checklist.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => onToggleChecklistItem(criticalTask.id, item.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        item.completed 
                        ? 'bg-zinc-900/40 border-emerald-500/10 text-zinc-500 line-through' 
                        : 'bg-[#121216] border-white/5 text-zinc-300 hover:border-white/10 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          item.completed ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-white/20'
                        }`}>
                          {item.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span>{item.text}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded">
                        {item.timeEstimateMinutes}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pilot recommendations footer */}
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs pt-1">
                <span className="text-zinc-500 italic">DeadlinePilot suggestion: Execute the flight checklist items to boost parameters.</span>
                <button 
                  onClick={() => onNavigate('assistant')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer self-end"
                >
                  Configure Rescue Autopilot
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="glass-panel border-white/5 bg-[#0d0d10]/95 rounded-2xl p-10 text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <div>
                <h3 className="text-white font-semibold text-lg">Radar Clear. All targets safe.</h3>
                <p className="text-sm text-zinc-400 mt-1 max-w-sm mx-auto">No critical issues logged on screen. Add high priority milestones or upcoming tasks to activate radar.</p>
              </div>
              <button 
                onClick={() => onNavigate('tasks')}
                className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs px-4 py-2 rounded-lg transition-all"
              >
                Log flight plan target
              </button>
            </div>
          )}

          {/* Today's Tasks Section */}
          <div className="glass-panel border-white/5 bg-[#0d0d10]/95 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                Today's Flight Checklist
                <span className="text-xs font-mono font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  {todayTasks.length} active
                </span>
              </h3>
              <button 
                onClick={() => onNavigate('tasks')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                Manage All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
              {todayTasks.length > 0 ? (
                todayTasks.map(task => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-zinc-950/40 hover:bg-zinc-950/80 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleToggleTaskStatus(task)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          task.status === 'completed' 
                          ? 'bg-emerald-500 border-emerald-600 text-white' 
                          : 'border-white/20 hover:border-indigo-400'
                        }`}
                      >
                        {task.status === 'completed' && <CheckSquare className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <h4 className={`text-sm font-semibold text-zinc-100 ${task.status === 'completed' ? 'line-through text-zinc-500' : ''}`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2.5 mt-1">
                          <span className={`text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded ${
                            task.priority === 'critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            task.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            task.priority === 'medium' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            Est: {task.estimatedHours}h
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {task.category}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border border-dashed border-white/5 rounded-xl">
                  <p className="text-xs text-zinc-500">No active flight objectives mapped for today.</p>
                  <button 
                    onClick={() => onNavigate('tasks')}
                    className="text-indigo-400 hover:underline text-xs font-semibold mt-2"
                  >
                    Add upcoming target
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* AI Suggestions / Alert Radar alerts */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              Predictive Autopilot Advisories
              <span className="text-xs font-sans font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full animate-pulse font-mono uppercase">
                AI Diagnostic Active
              </span>
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              {insights.slice(0, 2).map(insight => (
                <div 
                  key={insight.id}
                  className={`glass-panel p-5 rounded-2xl relative border bg-[#0d0d10]/95 flex flex-col justify-between hover:border-white/10 transition-colors shadow-lg ${
                    insight.type === 'danger' ? 'border-rose-500/20 shadow-rose-950/5' :
                    insight.type === 'warning' ? 'border-amber-500/20 shadow-amber-950/5' :
                    'border-white/5'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        insight.type === 'danger' ? 'bg-rose-500 animate-ping' :
                        insight.type === 'warning' ? 'bg-amber-400 animate-pulse' :
                        'bg-emerald-400'
                      }`} />
                      <span className="text-xs font-bold text-white uppercase tracking-wide font-mono">{insight.title}</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">{insight.message}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px]">
                    <span className="text-zinc-500 font-mono">{insight.timestamp}</span>
                    {insight.actionText && (
                      <button 
                        onClick={() => onApplyInsightAction(insight.actionPayload)}
                        className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer font-mono text-[11px] hover:underline"
                      >
                        {insight.actionText} <Zap className="w-3.5 h-3.5 text-indigo-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right sidebar layout (Quick Add, Focus score gauge, Upcoming milestones, Activity logs) */}
        <div className="space-y-8">
          
          {/* Quick Add Task Form */}
          {onAddTask && (
            <div className="glass-panel border-white/5 bg-[#0d0d10]/95 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Quick-Add Deadline Target
              </h3>

              <form onSubmit={handleQuickAdd} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1.5">Task Title</label>
                  <input 
                    type="text" 
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="e.g. Prepare deck deployment"
                    className="w-full bg-zinc-950 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition-all font-sans"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1.5">Priority</label>
                    <select
                      value={quickPriority}
                      onChange={(e) => setQuickPriority(e.target.value as Priority)}
                      className="w-full bg-zinc-950 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-all"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1.5">Category</label>
                    <select
                      value={quickCategory}
                      onChange={(e) => setQuickCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-all"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1.5">Estimated effort (hours)</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={40}
                    value={quickHours}
                    onChange={(e) => setQuickHours(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-950 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-all"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-3 rounded-xl border border-indigo-400/20 shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  <Plus className="w-4 h-4" />
                  Fast-Log Target
                </button>
              </form>
            </div>
          )}

          {/* Productivity Grade & Diagnostics Diagnostic Box */}
          <div className="glass-panel border-white/5 bg-[#0d0d10]/95 rounded-2xl p-6 space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            
            <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              Pilot Diagnostic Grade
            </h3>

            <div className={`p-4 rounded-xl border flex items-center gap-4 ${scoreDetails.color}`}>
              <span className="text-4xl font-extrabold font-mono tracking-tighter shrink-0">{scoreDetails.grade}</span>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest block font-mono">Autopilot Status</span>
                <p className="text-[11px] leading-snug mt-0.5">{scoreDetails.label}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-1">
              <div className="bg-zinc-950/40 border border-white/5 p-3 rounded-xl text-center">
                <span className="text-zinc-500 text-[9px] uppercase tracking-wider block">Today Focus</span>
                <span className="font-semibold text-zinc-100">{todayFocusHours.toFixed(1)} hrs</span>
              </div>
              <div className="bg-zinc-950/40 border border-white/5 p-3 rounded-xl text-center">
                <span className="text-zinc-500 text-[9px] uppercase tracking-wider block">Completed</span>
                <span className="font-semibold text-zinc-100">{completedTasksCount} items</span>
              </div>
            </div>
          </div>

          {/* Upcoming Milestones List */}
          <div className="glass-panel border-white/5 bg-[#0d0d10]/95 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
                <CalIcon className="w-4 h-4 text-indigo-400" />
                Upcoming Milestones
              </h3>
              <button 
                onClick={() => onNavigate('calendar')}
                className="text-[11px] text-zinc-500 hover:text-white"
              >
                Full Radar
              </button>
            </div>

            <div className="space-y-3">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map(task => {
                  const isOverdue = new Date(task.deadline).getTime() < new Date().getTime();
                  return (
                    <div 
                      key={task.id}
                      className="p-3 bg-zinc-950/60 hover:bg-zinc-950/80 rounded-xl border border-white/5 flex flex-col gap-1 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-zinc-100 line-clamp-1">{task.title}</h4>
                        <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          task.priority === 'critical' ? 'bg-rose-500/10 text-rose-400' :
                          task.priority === 'high' ? 'bg-orange-500/10 text-orange-400' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mt-1">
                        <span className={isOverdue ? "text-rose-400 font-semibold" : "text-zinc-400"}>
                          {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[9px] px-1 bg-white/5 rounded text-zinc-400">
                          {task.category}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 border border-dashed border-white/5 rounded-xl">
                  <p className="text-xs text-zinc-500">No active upcoming milestones mapped.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="glass-panel border-white/5 bg-[#0d0d10]/95 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="font-display font-semibold text-base text-white">Recent Radar Activity</h3>
            </div>

            <div className="space-y-3">
              {derivedActivities.length > 0 ? (
                derivedActivities.map(act => (
                  <div key={act.id} className="flex gap-2.5 items-start text-xs border-l border-white/5 pl-3 relative ml-1.5">
                    <div className="absolute -left-[4.5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500/25 border border-indigo-400/50" />
                    <div className="space-y-0.5">
                      <p className="text-zinc-300 text-[11px] leading-relaxed">{act.title}</p>
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-zinc-500">No recent operational logs available.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
