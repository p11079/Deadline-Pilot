/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Clock, 
  Zap, 
  Calendar, 
  Activity, 
  ChevronRight, 
  Check, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  ShieldAlert, 
  Coffee, 
  Flame, 
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Brain,
  Scissors,
  CornerDownRight,
  HeartPulse,
  Timer,
  ExternalLink
} from 'lucide-react';
import { Task, TimeBlock, ActivePage, ProactiveCopilotPlan } from '../types';
import { useAuth } from '../context/AuthContext';

interface AIPlannerPageProps {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  onAddTimeBlock: (newBlock: Omit<TimeBlock, 'id'>) => void;
  onSplitTask?: (originalTaskId: string, subTasks: { title: string; estimatedHours: number }[]) => void;
  onNavigate: (page: ActivePage) => void;
}

export default function AIPlannerPage({
  tasks,
  timeBlocks,
  onAddTimeBlock,
  onSplitTask,
  onNavigate
}: AIPlannerPageProps) {
  const { currentUser } = useAuth();
  
  // Input parameters
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(() => 
    tasks.filter(t => t.status !== 'completed').map(t => t.id)
  );
  const [workingStart, setWorkingStart] = useState('09:00');
  const [workingEnd, setWorkingEnd] = useState('17:00');
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>('high');
  const [strategy, setStrategy] = useState<'pomodoro' | 'frog' | 'energy' | 'marathon'>('energy');
  
  // States
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copilotPlan, setCopilotPlan] = useState<ProactiveCopilotPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'risk_audit' | 'splits' | 'rationale'>('today');
  
  // Notifications/Feedback states
  const [commitSuccess, setCommitSuccess] = useState(false);
  const [executedSplits, setExecutedSplits] = useState<string[]>([]);

  const strategies = [
    {
      id: 'energy' as const,
      name: 'Circadian Energy Matching',
      desc: 'Matches peak task difficulty with your morning high-energy slots to prevent afternoon cognitive crash.',
      icon: Zap,
      color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400'
    },
    {
      id: 'frog' as const,
      name: 'Eat the Frog',
      desc: 'Schedules the absolute hardest, most critical milestone first, clearing mental roadblocks immediately.',
      icon: Flame,
      color: 'from-rose-500/10 to-red-500/10 border-rose-500/20 text-rose-400'
    },
    {
      id: 'pomodoro' as const,
      name: 'Pomodoro Sprints',
      desc: 'Slices focus blocks into strict 25-minute extreme focus intervals with 5-minute cognitive breaks.',
      icon: Clock,
      color: 'from-indigo-500/10 to-violet-500/10 border-indigo-500/20 text-indigo-400'
    },
    {
      id: 'marathon' as const,
      name: 'Deep Work Marathon',
      desc: 'Establishes larger continuous 90-minute focus corridors with deep rest buffers for complex tasks.',
      icon: BookOpen,
      color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400'
    }
  ];

  const handleToggleTask = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const activeIds = tasks.filter(t => t.status !== 'completed').map(t => t.id);
    if (selectedTaskIds.length === activeIds.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(activeIds);
    }
  };

  const handleGeneratePlan = async () => {
    const chosenTasks = tasks.filter(t => selectedTaskIds.includes(t.id));
    if (chosenTasks.length === 0) {
      setErrorMsg('Please select at least one active milestone to schedule.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setCommitSuccess(false);

    try {
      const token = currentUser ? await currentUser.getIdToken() : '';
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          tasks: chosenTasks,
          workingHours: { start: workingStart, end: workingEnd },
          energyLevel,
          strategy,
          calendarBlocks: timeBlocks
        })
      });

      if (!response.ok) {
        throw new Error('Autopilot coordination failed. Verify server state.');
      }

      const data = await response.json();
      if (data && data.plan) {
        setCopilotPlan(data.plan);
        // Set optimal active tab
        if (data.plan.impossibleScheduleAlerts?.length > 0 || data.plan.deadlinePredictions?.some((p: any) => p.prediction === 'missed')) {
          setActiveTab('risk_audit');
        } else if (data.plan.splitTasks?.length > 0) {
          setActiveTab('splits');
        } else {
          setActiveTab('today');
        }
      } else {
        throw new Error('Mismatched copilot schema formatting.');
      }
    } catch (err: any) {
      console.error('Proactive AI planning failed:', err);
      setErrorMsg('The copilot model is currently offline or calibrating. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCommitToCalendar = () => {
    if (!copilotPlan) return;

    // Filter focus blocks from today's plan
    const focusBlocks = copilotPlan.todaysPlan.filter(block => block.type === 'focus');
    const todayStr = new Date().toISOString().split('T')[0];

    focusBlocks.forEach(block => {
      onAddTimeBlock({
        taskId: block.taskId,
        title: block.title,
        startTime: block.startTime,
        endTime: block.endTime,
        date: todayStr,
        category: 'Focus Corridor',
        completed: false
      });
    });

    setCommitSuccess(true);
    setTimeout(() => setCommitSuccess(false), 4000);
  };

  const handleExecuteSplit = (originalTaskId: string, subTasks: any[]) => {
    if (onSplitTask) {
      onSplitTask(originalTaskId, subTasks);
      setExecutedSplits(prev => [...prev, originalTaskId]);
    }
  };

  // Helper colors
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10';
    }
  };

  const getPredictionBadge = (pred: string) => {
    switch (pred) {
      case 'missed':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'at_risk':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10';
    }
  };

  return (
    <div className="space-y-6 relative font-sans">
      
      {/* Background radial highlight */}
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <Brain className="w-5.5 h-5.5 text-indigo-400 animate-pulse" /> Autopilot Planning Co-Pilot
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Actively audits your workload, predicts missed deadlines, auto-splits giant tasks, moves low-priority slots, and defends against burnout.
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] font-mono bg-zinc-900 border border-white/5 py-1.5 px-3 rounded-xl">
          <span className="text-zinc-500 uppercase">AGENT FLOW</span>
          <span className="text-indigo-400 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" /> PROACTIVE ACTIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Settings (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Active Tasks list card */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-400" /> Milestone Feed
              </span>
              <button 
                onClick={handleSelectAll}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
              >
                {selectedTaskIds.length === tasks.filter(t => t.status !== 'completed').length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar">
              {tasks.filter(t => t.status !== 'completed').length > 0 ? (
                tasks.filter(t => t.status !== 'completed').map(task => (
                  <div 
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedTaskIds.includes(task.id)
                      ? 'bg-indigo-600/10 border-indigo-500/30 text-white'
                      : 'bg-white/2 border-white/5 text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                      selectedTaskIds.includes(task.id) ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-white/20'
                    }`}>
                      {selectedTaskIds.includes(task.id) && <Check className="w-3 h-3" />}
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold block line-clamp-1">{task.title}</span>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                        <span className="bg-white/3 px-1.5 py-0.5 rounded border border-white/5">{task.estimatedHours} hrs</span>
                        <span className={`uppercase font-bold ${task.priority === 'critical' ? 'text-rose-400' : task.priority === 'high' ? 'text-amber-400' : 'text-zinc-500'}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-zinc-500 text-xs">
                  No active milestone tasks found in workspace.
                </div>
              )}
            </div>
          </div>

          {/* Time & Energy Controls */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 space-y-4">
            <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" /> Operational Context
            </span>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-500 font-semibold mb-1">Shift Start</label>
                <input 
                  type="time" 
                  value={workingStart}
                  onChange={(e) => setWorkingStart(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 focus:border-indigo-500 outline-none rounded-xl px-3 py-2 text-zinc-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-500 font-semibold mb-1">Shift End</label>
                <input 
                  type="time" 
                  value={workingEnd}
                  onChange={(e) => setWorkingEnd(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 focus:border-indigo-500 outline-none rounded-xl px-3 py-2 text-zinc-300 font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-zinc-500 font-semibold">Your Starting Energy Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEnergyLevel(level)}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider text-center transition-all cursor-pointer ${
                      energyLevel === level
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                      : 'bg-white/2 border-white/5 text-zinc-500 hover:border-white/10'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Strategies grid selectors */}
          <div className="space-y-2.5">
            <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider block px-1">
              Select Defense Focus Strategy
            </span>

            <div className="grid grid-cols-1 gap-2">
              {strategies.map(strat => {
                const StratIcon = strat.icon;
                return (
                  <div
                    key={strat.id}
                    onClick={() => setStrategy(strat.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex gap-3 items-start ${
                      strategy === strat.id
                      ? `bg-indigo-600/10 border-indigo-500/40 shadow-lg shadow-indigo-500/5`
                      : 'bg-zinc-950/40 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                      strategy === strat.id ? 'bg-indigo-600/20 border-indigo-500/30' : 'bg-white/2 border-white/5'
                    }`}>
                      <StratIcon className={`w-3.5 h-3.5 ${strategy === strat.id ? 'text-indigo-400' : 'text-zinc-500'}`} />
                    </div>

                    <div className="space-y-0.5">
                      <span className={`text-[11px] font-bold block ${strategy === strat.id ? 'text-white' : 'text-zinc-300'}`}>
                        {strat.name}
                      </span>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        {strat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generate Button block */}
          <div className="pt-2">
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating || selectedTaskIds.length === 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-zinc-800 disabled:to-zinc-800 text-white font-bold text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  AI Auditing Workload...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Activate Proactive Co-Pilot
                </>
              )}
            </button>

            {errorMsg && (
              <div className="mt-3 bg-rose-500/5 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Co-Pilot Dashboard display Panel (8 cols) */}
        <div className="lg:col-span-8">
          
          <AnimatePresence mode="wait">
            {copilotPlan ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-5"
              >
                {/* Burnout Meter and Quick Summary widget */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* Burnout Card */}
                  <div className="md:col-span-6 glass-panel p-5 rounded-2xl border-white/5 flex gap-4 items-center">
                    <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle 
                          cx="36" cy="36" r="32" 
                          className="text-white/5" 
                          strokeWidth="6" 
                          fill="transparent" 
                        />
                        <circle 
                          cx="36" cy="36" r="32" 
                          className={`transition-all duration-1000 ${
                            copilotPlan.burnoutEstimate.percentage > 70 ? 'text-red-500' :
                            copilotPlan.burnoutEstimate.percentage > 45 ? 'text-amber-400' : 'text-indigo-400'
                          }`} 
                          strokeWidth="6" 
                          fill="transparent" 
                          strokeDasharray={2 * Math.PI * 32}
                          strokeDashoffset={2 * Math.PI * 32 * (1 - copilotPlan.burnoutEstimate.percentage / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-center flex flex-col justify-center">
                        <span className="text-base font-bold font-mono text-white leading-none">
                          {copilotPlan.burnoutEstimate.percentage}%
                        </span>
                        <span className="text-[8px] text-zinc-500 uppercase font-mono mt-0.5">Burnout</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <HeartPulse className="w-4.5 h-4.5 text-zinc-400" />
                        <span className="font-bold text-zinc-200">Burnout Safety Index</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Level: <span className={`font-bold uppercase ${
                          copilotPlan.burnoutEstimate.level === 'critical' ? 'text-red-400' :
                          copilotPlan.burnoutEstimate.level === 'high' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>{copilotPlan.burnoutEstimate.level}</span>. {copilotPlan.burnoutEstimate.mitigationAction}
                      </p>
                    </div>
                  </div>

                  {/* Operational Sync Header Card */}
                  <div className="md:col-span-6 glass-panel p-5 rounded-2xl border-white/5 bg-gradient-to-r from-indigo-950/10 to-zinc-950/40 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono">PLANNING AGENT STATUS</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">Workload Shield Implemented</span>
                        </div>
                      </div>
                      
                      <span className="text-[10px] bg-white/5 text-zinc-400 py-1 px-2.5 rounded-lg border border-white/5 font-mono">
                        {workingStart} - {workingEnd}
                      </span>
                    </div>

                    <button
                      onClick={handleCommitToCalendar}
                      className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold py-2 px-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10 transition-all cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Commit Focus Slots to Calendar
                    </button>
                  </div>

                </div>

                {commitSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-400 flex items-center gap-2.5"
                  >
                    <Check className="w-5 h-5 shrink-0" />
                    <div>
                      <span className="font-bold">Focus blocks integrated!</span> Deep focus hours have been successfully added to your calendar database today. Focus corridors are highlighted.
                    </div>
                  </motion.div>
                )}

                {/* Main Proactive Navigation Tabs */}
                <div className="border-b border-white/5 flex gap-1 overflow-x-auto pb-px scrollbar-none">
                  {[
                    { 
                      id: 'today' as const, 
                      label: "Today's Plan", 
                      badge: copilotPlan.todaysPlan.filter(i => i.type === 'focus').length + " Sprints" 
                    },
                    { 
                      id: 'risk_audit' as const, 
                      label: 'Proactive Risk Audit', 
                      badge: (copilotPlan.impossibleScheduleAlerts?.length || 0) + (copilotPlan.deadlinePredictions?.filter(p => p.prediction !== 'safe').length || 0) + " Warnings" 
                    },
                    { 
                      id: 'splits' as const, 
                      label: 'Task Split suggestions', 
                      badge: (copilotPlan.splitTasks?.length || 0) + " Recommended" 
                    },
                    { 
                      id: 'tomorrow' as const, 
                      label: "Tomorrow's Setup", 
                      badge: "Pre-staged" 
                    },
                    { 
                      id: 'rationale' as const, 
                      label: 'AI Reasoning Log', 
                      badge: 'Explained' 
                    }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === tab.id
                        ? 'border-indigo-500 text-white bg-white/2'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          activeTab === tab.id ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/10' : 'bg-white/3 text-zinc-500'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab content wrapper */}
                <div className="min-h-[350px]">
                  
                  {/* Today's Strategic Plan Tab */}
                  {activeTab === 'today' && (
                    <div className="space-y-4">
                      
                      {/* Workload analysis alert banner */}
                      {copilotPlan.burnoutEstimate.stressors.length > 0 && (
                        <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl space-y-2">
                          <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5" /> Workload Stressor Audit
                          </span>
                          <ul className="space-y-1.5">
                            {copilotPlan.burnoutEstimate.stressors.map((str, sIdx) => (
                              <li key={sIdx} className="text-[11px] text-zinc-400 flex items-start gap-1.5 leading-relaxed">
                                <span className="text-zinc-600 mt-1">•</span>
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="relative border-l border-white/15 ml-3.5 pl-6 space-y-4">
                        {copilotPlan.todaysPlan.map((item, idx) => (
                          <div key={idx} className="relative">
                            
                            {/* Marker node */}
                            <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-zinc-950 flex items-center justify-center ${
                              item.type === 'focus' ? 'bg-rose-500 animate-pulse' :
                              item.type === 'break' ? 'bg-emerald-400' :
                              item.type === 'admin' ? 'bg-indigo-500' : 'bg-zinc-600'
                            }`} />

                            <div className="glass-panel p-4 rounded-xl border-white/5 space-y-1.5 hover:border-white/10 transition-all">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                <span className={`text-[9px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                                  item.type === 'focus' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/10' :
                                  item.type === 'break' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10' :
                                  item.type === 'admin' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/10' :
                                  'bg-zinc-500/15 text-zinc-400 border border-zinc-500/10'
                                }`}>
                                  {item.type} session
                                </span>

                                <span className="text-[10px] font-mono text-zinc-400 bg-white/3 px-2 py-0.5 rounded border border-white/5">
                                  {item.startTime} - {item.endTime}
                                </span>
                              </div>

                              <h4 className="text-xs font-bold text-white">{item.title}</h4>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">
                                {item.description}
                              </p>
                            </div>

                          </div>
                        ))}
                      </div>

                      {/* Recommend Breaks component block */}
                      {copilotPlan.recommendedBreaks?.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                            <Coffee className="w-4 h-4 text-emerald-400" /> Strategic Break Schedule
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {copilotPlan.recommendedBreaks.map((brk, bIdx) => (
                              <div key={bIdx} className="glass-panel p-4 rounded-xl border-white/5 bg-zinc-950/20 space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-white">{brk.activity}</span>
                                  <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                    {brk.durationMinutes}m
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-relaxed">{brk.benefit}</p>
                                <span className="block text-[9px] font-mono text-zinc-500 font-bold">Time slot: {brk.timeSlot}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Proactive Risk Audit Tab */}
                  {activeTab === 'risk_audit' && (
                    <div className="space-y-5">
                      
                      {/* 1. Impossible Schedule Warnings */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400" /> Impossible Schedule Audits
                        </span>

                        {copilotPlan.impossibleScheduleAlerts?.length > 0 ? (
                          copilotPlan.impossibleScheduleAlerts.map((alert, aIdx) => (
                            <div key={aIdx} className="glass-panel p-4 rounded-xl border-white/5 bg-gradient-to-r from-zinc-950 to-zinc-900 border-l-4 border-l-red-500 space-y-2">
                              <div className="flex justify-between items-start gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <ShieldAlert className="w-4 h-4 text-red-400" />
                                  {alert.issue}
                                </h4>
                                <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${getSeverityBadge(alert.severity)}`}>
                                  {alert.severity}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">
                                <span className="font-semibold text-zinc-300">Operational Impact:</span> {alert.impact}
                              </p>
                              <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg text-[11px] text-emerald-400 leading-relaxed">
                                <span className="font-bold">Autonomous Resolution:</span> {alert.resolution}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 bg-zinc-950/20 border border-white/5 rounded-xl text-zinc-500 text-xs">
                            No schedule collisions or overloaded work hours detected today. Safe corridor clear.
                          </div>
                        )}
                      </div>

                      {/* 2. Missed Deadline Predictions */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-indigo-400" /> Milestone Missed Deadline Predictor
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {copilotPlan.deadlinePredictions?.map((pred, pIdx) => (
                            <div key={pIdx} className="glass-panel p-4 rounded-xl border-white/5 space-y-2">
                              <div className="flex justify-between items-start gap-1">
                                <h4 className="text-xs font-bold text-white line-clamp-1">{pred.taskTitle}</h4>
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${getPredictionBadge(pred.prediction)}`}>
                                  {pred.prediction.replace('_', ' ')}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                                <span>Due: {pred.deadline}</span>
                                {pred.daysToDeadline !== undefined && (
                                  <span>• {pred.daysToDeadline} days left</span>
                                )}
                              </div>

                              <p className="text-[11px] text-zinc-400 leading-relaxed">{pred.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 3. Moved Low Priority Work */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <CornerDownRight className="w-4 h-4 text-zinc-400" /> Auto-Shifted Low Priority Work
                        </span>

                        {copilotPlan.movedLowPriorityWork?.length > 0 ? (
                          <div className="space-y-2">
                            {copilotPlan.movedLowPriorityWork.map((moved, mIdx) => (
                              <div key={mIdx} className="glass-panel p-4 rounded-xl border-white/5 flex gap-3.5 items-start bg-zinc-950/20">
                                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0 text-zinc-400">
                                  <CornerDownRight className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs font-bold text-zinc-300">{moved.title}</h4>
                                    <span className="text-[8px] font-mono uppercase bg-white/5 border border-white/5 px-1.5 py-0.2 rounded text-zinc-500">
                                      {moved.priority}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 leading-relaxed">{moved.reason}</p>
                                  <span className="text-[9px] font-mono text-indigo-400 font-bold block">Moved to queue: {moved.movedToDate}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-5 bg-zinc-950/20 border border-white/5 rounded-xl text-zinc-500 text-xs">
                            No tasks were required to be pushed to tomorrow to protect today's targets.
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* Task Split Suggestions Tab */}
                  {activeTab === 'splits' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-950/15 border border-indigo-500/10 rounded-2xl flex gap-3.5 items-start">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                          <Scissors className="w-4.5 h-4.5" />
                        </div>
                        <div className="text-xs space-y-1">
                          <span className="font-bold text-white">Task Slicing Engine</span>
                          <p className="text-zinc-400 leading-relaxed">
                            Proactively detects tasks exceeding 4 hours and breaks them down into sequence slots. This ensures continuous micro-checkpoints and reduces burnout blockages.
                          </p>
                        </div>
                      </div>

                      {copilotPlan.splitTasks?.length > 0 ? (
                        <div className="space-y-4">
                          {copilotPlan.splitTasks.map((split, sIdx) => {
                            const isExecuted = executedSplits.includes(split.originalTaskId);
                            return (
                              <div key={sIdx} className="glass-panel p-5 rounded-2xl border-white/5 space-y-4">
                                <div className="flex justify-between items-start gap-3 flex-wrap">
                                  <div>
                                    <span className="text-[10px] font-mono font-bold uppercase text-zinc-500">Original target</span>
                                    <h4 className="text-xs font-bold text-white">{split.originalTitle}</h4>
                                  </div>

                                  <button
                                    onClick={() => handleExecuteSplit(split.originalTaskId, split.subTasks)}
                                    disabled={isExecuted}
                                    className={`text-[10px] font-bold uppercase py-1.5 px-3 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                                      isExecuted 
                                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 cursor-default' 
                                      : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500'
                                    }`}
                                  >
                                    {isExecuted ? (
                                      <>
                                        <Check className="w-3.5 h-3.5" />
                                        Slices Executed
                                      </>
                                    ) : (
                                      <>
                                        <Scissors className="w-3.5 h-3.5" />
                                        Execute Slices in Workspace
                                      </>
                                    )}
                                  </button>
                                </div>

                                <p className="text-[11px] text-zinc-400 bg-white/2 border border-white/5 p-2.5 rounded-xl leading-relaxed">
                                  <span className="font-bold text-zinc-300">Co-pilot Insight:</span> {split.reasonForSplit}
                                </p>

                                <div className="space-y-2">
                                  <span className="text-[9px] font-mono font-bold uppercase text-zinc-500 tracking-wider block">Recommended Sub-Task Sequence:</span>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                    {split.subTasks.map((st, subIdx) => (
                                      <div key={subIdx} className="bg-zinc-950/40 border border-white/5 p-3 rounded-xl space-y-1.5 text-xs relative overflow-hidden">
                                        <div className="absolute top-1 right-2 text-zinc-800 font-mono font-black text-xl select-none">
                                          #{st.sequence}
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-indigo-400 block uppercase">Phase {st.sequence}</span>
                                        <p className="font-semibold text-zinc-200 line-clamp-2 pr-6 leading-normal">{st.title}</p>
                                        <span className="text-[10px] text-zinc-500 font-mono block">Budget: {st.estimatedHours} hrs</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-zinc-950/20 border border-white/5 rounded-2xl text-zinc-500 text-xs">
                          All selected active milestones fit safely under 4 hours. No manual slicing required.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tomorrow's Setup Tab */}
                  {activeTab === 'tomorrow' && (
                    <div className="space-y-4">
                      
                      {/* peace of mind banner */}
                      <div className="glass-panel p-5 rounded-2xl border-white/5 bg-gradient-to-r from-emerald-950/10 to-zinc-950/40 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                          <Check className="w-5 h-5" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <span className="font-bold text-white">Tomorrow's Focus is Pre-Staged</span>
                          <p className="text-zinc-400 leading-relaxed">
                            To help you detach from work and get peace of mind tonight, the co-pilot has pre-staged your starting focus slots for tomorrow. Close your tabs with 100% confidence.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="text-xs font-mono uppercase font-bold text-zinc-500 block px-1">Tomorrow's Scheduled Corridors:</span>
                        <div className="divide-y divide-white/5 border border-white/5 bg-zinc-950/30 rounded-2xl overflow-hidden text-xs">
                          {copilotPlan.tomorrowsPlan.map((tomBlock, tIdx) => (
                            <div key={tIdx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/1 transition-all">
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[8px] font-bold font-mono uppercase px-1.5 py-0.2 rounded ${
                                    tomBlock.type === 'focus' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/10' :
                                    tomBlock.type === 'admin' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/10' :
                                    'bg-zinc-500/15 text-zinc-400 border border-zinc-500/10'
                                  }`}>
                                    {tomBlock.type}
                                  </span>
                                  <h4 className="font-bold text-white">{tomBlock.title}</h4>
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-relaxed pr-4">{tomBlock.description}</p>
                              </div>

                              <span className="text-[10px] font-mono text-zinc-400 bg-white/3 py-1 px-2.5 rounded border border-white/5 self-start sm:self-center">
                                {tomBlock.startTime} - {tomBlock.endTime}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* AI Reasoning Log Tab */}
                  {activeTab === 'rationale' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl flex gap-3.5 items-start">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                          <Sparkles className="w-4.5 h-4.5" />
                        </div>
                        <div className="text-xs space-y-1">
                          <span className="font-bold text-white">Engineering Decisions Audit</span>
                          <p className="text-zinc-400 leading-relaxed">
                            Proactive co-pilot explanations mapping exactly why specific milestones, breaks, and shifts were executed.
                          </p>
                        </div>
                      </div>

                      <div className="divide-y divide-white/5 border border-white/5 bg-zinc-950/40 rounded-2xl overflow-hidden text-xs">
                        {copilotPlan.copilotReasoning.map((exp, idx) => (
                          <div key={idx} className="p-4 flex gap-3 items-start text-zinc-300">
                            <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{exp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </motion.div>
            ) : (
              /* Initial Landing State when no plan has been generated */
              <div className="h-full min-h-[460px] border border-dashed border-white/10 bg-zinc-950/10 rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-4 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

                <div className="w-16 h-16 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 flex items-center justify-center text-indigo-400 relative z-10">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                
                <div className="max-w-md space-y-2 relative z-10">
                  <h3 className="text-base font-bold text-white">Active Co-Pilot Is Standing By</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Set your working shift, select the milestones you wish to tackle, choose your preferred defense focus mode, and engage the planning co-pilot to run an interactive scheduling audit.
                  </p>
                </div>

                <div className="relative z-10 pt-2">
                  <button
                    onClick={handleGeneratePlan}
                    disabled={isGenerating || selectedTaskIds.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-500/15 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" /> Activate Autopilot Planner
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
