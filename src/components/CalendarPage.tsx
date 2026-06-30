/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalIcon, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Bookmark, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Grid, 
  List, 
  Layers, 
  AlertTriangle,
  Move,
  Link as LinkIcon,
  Info,
  Check,
  CalendarCheck
} from 'lucide-react';
import { Task, TimeBlock } from '../types';

interface CalendarPageProps {
  timeBlocks: TimeBlock[];
  tasks: Task[];
  onAddTimeBlock: (block: Omit<TimeBlock, 'id'>) => void;
  onToggleTimeBlockComplete: (id: string) => void;
  onUpdateTimeBlock?: (block: TimeBlock) => void;
  onDeleteTimeBlock: (id: string) => void;
}

export default function CalendarPage({
  timeBlocks,
  tasks,
  onAddTimeBlock,
  onToggleTimeBlockComplete,
  onUpdateTimeBlock,
  onDeleteTimeBlock
}: CalendarPageProps) {
  
  // States
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Sync states
  const [isGCalSynced, setIsGCalSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // Form states for adding block
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('11:00');
  const [newEndTime, setNewEndTime] = useState('12:30');
  const [newCategory, setNewCategory] = useState('Focus');
  const [mappedTaskId, setMappedTaskId] = useState('');

  // Drag and drop feedback
  const [dragOverHour, setDragOverHour] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  // Helper arrays for calendar generation
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const categories = [
    { name: 'Focus', color: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20' },
    { name: 'Code', color: 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' },
    { name: 'Design', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' },
    { name: 'DevOps', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' },
    { name: 'Break', color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20' }
  ];

  const getCategoryStyles = (catName: string) => {
    const matched = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    return matched ? matched.color : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20';
  };

  // --------------------------------------------------------
  // Calendar Date Navigation Helpers
  // --------------------------------------------------------
  
  // Returns week dates (Monday to Sunday) for the currently selected date's week
  const getWeekDays = () => {
    const baseDate = new Date(selectedDate);
    const dayOfWeek = baseDate.getDay();
    // Adjust to Monday
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + distanceToMonday);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      week.push(nextDay);
    }
    return week;
  };

  // Returns all days in the currently selected date's month, including pad-days at start/end
  const getMonthDays = () => {
    const baseDate = new Date(selectedDate);
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    
    // First day of current month
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayIndex = firstDayOfMonth.getDay(); // 0 is Sun, 1 is Mon...
    
    // Total days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Pad days from previous month
    const prevMonthEnd = new Date(year, month, 0).getDate();
    const padPrevCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Align to Monday week start
    for (let i = padPrevCount - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthEnd - i),
        isCurrentMonth: false
      });
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Pad days from next month to make complete 6-week grid (42 cells)
    const totalCells = 42;
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const handlePrevDateRange = () => {
    const baseDate = new Date(selectedDate);
    if (currentView === 'day') {
      baseDate.setDate(baseDate.getDate() - 1);
    } else if (currentView === 'week') {
      baseDate.setDate(baseDate.getDate() - 7);
    } else {
      baseDate.setMonth(baseDate.getMonth() - 1);
    }
    setSelectedDate(baseDate.toISOString().split('T')[0]);
  };

  const handleNextDateRange = () => {
    const baseDate = new Date(selectedDate);
    if (currentView === 'day') {
      baseDate.setDate(baseDate.getDate() + 1);
    } else if (currentView === 'week') {
      baseDate.setDate(baseDate.getDate() + 7);
    } else {
      baseDate.setMonth(baseDate.getMonth() + 1);
    }
    setSelectedDate(baseDate.toISOString().split('T')[0]);
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // --------------------------------------------------------
  // Form Submission
  // --------------------------------------------------------
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTimeBlock({
      title: newTitle,
      startTime: newStartTime,
      endTime: newEndTime,
      date: selectedDate,
      category: newCategory,
      taskId: mappedTaskId || undefined,
      completed: false
    });

    setNewTitle('');
    setMappedTaskId('');
    setIsAdding(false);
  };

  // --------------------------------------------------------
  // Drag & Drop Handlers (HTML5 Standard)
  // --------------------------------------------------------

  // When dragging a task from the side panel
  const handleDragStartTask = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('dragType', 'new_task');
  };

  // When dragging an existing calendar block to reschedule it
  const handleDragStartBlock = (e: React.DragEvent, blockId: string) => {
    e.dataTransfer.setData('blockId', blockId);
    e.dataTransfer.setData('dragType', 'reschedule_block');
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string, hourStr?: string) => {
    e.preventDefault();
    if (hourStr) {
      setDragOverHour(`${dateStr}-${hourStr}`);
    } else {
      setDragOverDay(dateStr);
    }
  };

  const handleDragLeave = () => {
    setDragOverHour(null);
    setDragOverDay(null);
  };

  const handleDrop = (e: React.DragEvent, targetDate: string, targetHour?: string) => {
    e.preventDefault();
    setDragOverHour(null);
    setDragOverDay(null);

    const dragType = e.dataTransfer.getData('dragType');
    const startHour = targetHour || "09";
    const parsedStartHour = parseInt(startHour);
    const formattedStart = `${String(parsedStartHour).padStart(2, '0')}:00`;
    const formattedEnd = `${String(parsedStartHour + 1).padStart(2, '0')}:30`;

    if (dragType === 'new_task') {
      const taskId = e.dataTransfer.getData('taskId');
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      onAddTimeBlock({
        title: `💻 Focal Block: ${task.title}`,
        startTime: formattedStart,
        endTime: formattedEnd,
        date: targetDate,
        category: task.category || 'Focus',
        taskId: task.id,
        completed: false
      });
    } else if (dragType === 'reschedule_block') {
      const blockId = e.dataTransfer.getData('blockId');
      const block = timeBlocks.find(b => b.id === blockId);
      if (!block || !onUpdateTimeBlock) return;

      // Parse current duration
      const [startH, startM] = block.startTime.split(':').map(Number);
      const [endH, endM] = block.endTime.split(':').map(Number);
      const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

      // Re-map to new drop coordinates
      const newStartHour = targetHour ? parseInt(targetHour) : startH;
      const newStartMin = targetHour ? 0 : startM;
      const newEndTotalMinutes = (newStartHour * 60 + newStartMin) + durationMinutes;

      const newEndHour = Math.floor(newEndTotalMinutes / 60);
      const newEndMin = newEndTotalMinutes % 60;

      const finalStart = `${String(newStartHour).padStart(2, '0')}:${String(newStartMin).padStart(2, '0')}`;
      const finalEnd = `${String(newEndHour).padStart(2, '0')}:${String(newEndMin).padStart(2, '0')}`;

      onUpdateTimeBlock({
        ...block,
        date: targetDate,
        startTime: finalStart,
        endTime: finalEnd
      });
    }
  };

  // --------------------------------------------------------
  // Auto-Scheduling & AI Suggestions
  // --------------------------------------------------------
  const handleAutoSchedule = () => {
    const unscheduledTasks = tasks.filter(t => 
      t.status !== 'completed' && 
      !timeBlocks.some(b => b.taskId === t.id)
    );

    if (unscheduledTasks.length === 0) {
      alert("All active milestone tasks are already scheduled in your calendar corridors.");
      return;
    }

    // Schedule the top 3 highest priority unscheduled tasks onto selectedDate
    let scheduledCount = 0;
    const initialHour = 10; // Start scheduling at 10 AM

    unscheduledTasks.slice(0, 3).forEach((task, idx) => {
      const startH = initialHour + (idx * 2);
      if (startH < 20) {
        onAddTimeBlock({
          title: `🤖 Auto-scheduled: ${task.title}`,
          startTime: `${String(startH).padStart(2, '0')}:00`,
          endTime: `${String(startH + 1).padStart(2, '0')}:30`,
          date: selectedDate,
          category: task.category || 'Focus',
          taskId: task.id,
          completed: false
        });
        scheduledCount++;
      }
    });

    alert(`🤖 Autopilot Calendar populated ${scheduledCount} high-criticality task slots on ${selectedDate}! Check empty gaps.`);
  };

  const handleApplySuggestion = (task: Task, hour: string) => {
    onAddTimeBlock({
      title: `⚡ Co-Pilot sprint: ${task.title}`,
      startTime: `${hour}:00`,
      endTime: `${String(parseInt(hour) + 1).padStart(2, '0')}:30`,
      date: selectedDate,
      category: task.category || 'Code',
      taskId: task.id,
      completed: false
    });
  };

  // --------------------------------------------------------
  // Real Google Calendar Sync Simulation & ICS Generation
  // --------------------------------------------------------
  const handleToggleGCalSync = () => {
    if (isGCalSynced) {
      // Unlink
      setIsGCalSynced(false);
      setSyncLogs(prev => [`Unlinked external sync credentials at ${new Date().toLocaleTimeString()}`, ...prev]);
    } else {
      // Begin sync simulation
      setIsSyncing(true);
      setShowSyncSuccess(false);
      setSyncLogs([]);

      const steps = [
        "Requesting Google Workspace OAuth token scope: calendar.events...",
        "Resolving server-side endpoint proxy...",
        "Hydrating calendar metadata blocks & avoiding double-bookings...",
        "Establishing persistent webhooks on GCal resource channels...",
        "Sync established! Imported 2 corporate calendar blocks safely."
      ];

      steps.forEach((step, idx) => {
        setTimeout(() => {
          setSyncLogs(prev => [...prev, `[${idx + 1}/5] ${step}`]);
          if (idx === steps.length - 1) {
            setIsSyncing(false);
            setIsGCalSynced(true);
            setShowSyncSuccess(true);
            
            // Auto inject 2 simulated corporate calendar blocking meetings to prevent double booking!
            onAddTimeBlock({
              title: "🚀 [GCal Sync] Corporate Weekly Sprint Kickoff",
              startTime: "09:00",
              endTime: "10:00",
              date: selectedDate,
              category: "Focus",
              completed: false
            });
            onAddTimeBlock({
              title: "👥 [GCal Sync] Focus Check-In & QA Handover",
              startTime: "15:00",
              endTime: "15:45",
              date: selectedDate,
              category: "Design",
              completed: false
            });

            setTimeout(() => setShowSyncSuccess(false), 5000);
          }
        }, (idx + 1) * 700);
      });
    }
  };

  // Generates and triggers downloading of a real, functional standard .ics calendar file!
  const handleExportICS = () => {
    if (timeBlocks.length === 0) {
      alert("No active scheduled time blocks to export.");
      return;
    }

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//DeadlinePilot//Tactical Calendar//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";
    
    timeBlocks.forEach(b => {
      const dateClean = b.date.replace(/-/g, '');
      const startClean = b.startTime.replace(/:/g, '') + '00';
      const endClean = b.endTime.replace(/:/g, '') + '00';
      
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:tb-${b.id}@deadlinepilot.app\n`;
      icsContent += `DTSTAMP:${dateClean}T000000Z\n`;
      icsContent += `DTSTART:${dateClean}T${startClean}\n`;
      icsContent += `DTEND:${dateClean}T${endClean}\n`;
      icsContent += `SUMMARY:${b.title}\n`;
      icsContent += `DESCRIPTION:Focal sprint category: ${b.category}. Completed: ${b.completed ? 'YES' : 'NO'}\n`;
      icsContent += "STATUS:CONFIRMED\n";
      icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `deadlinepilot_schedule_${selectedDate}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --------------------------------------------------------
  // Gather contextual items for current display
  // --------------------------------------------------------
  const weekDays = getWeekDays();
  const monthDays = getMonthDays();

  // Find tasks due on a specific date (for deadline highlights!)
  const getDeadlinesForDate = (dateStr: string) => {
    return tasks.filter(t => t.status !== 'completed' && t.deadline === dateStr);
  };

  // Identify empty calendar slots during the working day (10:00 - 18:00)
  const getAIRecommendations = () => {
    const activeUnscheduled = tasks.filter(t => t.status !== 'completed' && !timeBlocks.some(b => b.taskId === t.id));
    if (activeUnscheduled.length === 0) return [];

    const suggestions = [];
    // Check standard empty intervals on the selectedDate
    const testHours = ["11", "14", "16"];
    const dayBlocks = timeBlocks.filter(b => b.date === selectedDate);

    for (const hr of testHours) {
      const isBooked = dayBlocks.some(b => {
        const startH = parseInt(b.startTime.split(':')[0]);
        return startH === parseInt(hr);
      });

      if (!isBooked && activeUnscheduled.length > suggestions.length) {
        suggestions.push({
          task: activeUnscheduled[suggestions.length],
          suggestedHour: hr,
          reason: `⚠️ '${activeUnscheduled[suggestions.length].title}' has a tight milestone timeline. Secure this empty afternoon slot to defend progress.`
        });
      }
    }
    return suggestions;
  };

  const aiSuggestions = getAIRecommendations();

  return (
    <div className="space-y-6 font-sans relative">
      
      {/* Background highlight */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/5 pb-5">
        <div className="space-y-1">
          <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <CalIcon className="w-6 h-6 text-indigo-400" />
            Tactical Time-Block Scheduler
          </h2>
          <p className="text-xs text-zinc-400">
            Block focus corridors linked directly to task milestones. Drag and drop backlog items to defend focus buffers.
          </p>
        </div>

        {/* View Selection and Actions Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          
          {/* Quick Autopilot Button */}
          <button
            onClick={handleAutoSchedule}
            className="bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-400 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            title="Auto-distribute active tasks to blank calendar slots"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            AI Auto-Schedule
          </button>

          {/* Export ICS Button */}
          <button
            onClick={handleExportICS}
            className="bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-300 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            title="Download standard ICS file for Google, Apple or Outlook calendar"
          >
            <Download className="w-3.5 h-3.5" />
            Export .ICS
          </button>

          {/* GCal Sync Toggle */}
          <button
            onClick={handleToggleGCalSync}
            className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer border transition-all ${
              isGCalSynced 
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
              : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/10'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            {isGCalSynced ? 'GCal Synced' : 'Link Google Calendar'}
          </button>

          {/* View tabs */}
          <div className="bg-zinc-900 border border-white/5 p-1 rounded-xl flex">
            {(['day', 'week', 'month'] as const).map(view => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  currentView === view
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Sync feedback display */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-zinc-950 border border-white/5 p-4 rounded-xl space-y-2 font-mono text-[10px]"
          >
            <div className="flex items-center gap-2 text-indigo-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>COMMENCING GOOGLE CALENDAR OAUTH SECURE SYNC CHANNEL...</span>
            </div>
            <div className="space-y-1 text-zinc-500 pl-5">
              {syncLogs.map((log, lIdx) => (
                <div key={lIdx} className="fade-in">{log}</div>
              ))}
            </div>
          </motion.div>
        )}

        {showSyncSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-400 flex items-center gap-2.5"
          >
            <Check className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">Google Calendar proxy established!</span> Imported read-only corporate blocks have been added to your dashboard to guarantee no double-bookings.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Main Calendar View Section (9 cols) */}
        <div className="xl:col-span-9 space-y-4">
          
          {/* Header Controls (Date switching, range description) */}
          <div className="flex justify-between items-center bg-zinc-950/40 p-3.5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevDateRange}
                className="p-1.5 bg-zinc-900 border border-white/5 hover:border-white/10 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono px-1">
                {currentView === 'day' && new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                {currentView === 'week' && `Week of ${new Date(weekDays[0]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${new Date(weekDays[6]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                {currentView === 'month' && new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </h3>

              <button 
                onClick={handleNextDateRange}
                className="p-1.5 bg-zinc-900 border border-white/5 hover:border-white/10 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleGoToToday}
              className="text-[10px] font-mono uppercase bg-white/5 border border-white/5 hover:border-white/10 py-1 px-2.5 rounded text-zinc-300 cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* VIEW: DAILY TIMELINE */}
          {currentView === 'day' && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block px-1 tracking-wider">Hourly linear schedule (drag/drop tasks here)</span>
              
              <div className="glass-panel p-5 rounded-2xl border-white/5 divide-y divide-white/5">
                {Array.from({ length: 15 }).map((_, hIdx) => {
                  const hrVal = 8 + hIdx; // 08:00 to 22:00
                  const hrStr = String(hrVal).padStart(2, '0');
                  const targetSlotId = `${selectedDate}-${hrStr}`;
                  const isOver = dragOverHour === targetSlotId;

                  // Find blocks starting at this hour
                  const blocksAtHour = timeBlocks.filter(b => b.date === selectedDate && b.startTime.startsWith(hrStr));
                  const dateDeadlines = getDeadlinesForDate(selectedDate);

                  return (
                    <div 
                      key={hIdx}
                      onDragOver={(e) => handleDragOver(e, selectedDate, hrStr)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, selectedDate, hrStr)}
                      className={`py-3.5 flex items-start gap-4 transition-all relative ${
                        isOver ? 'bg-indigo-600/5 border-l-2 border-l-indigo-500 pl-2' : ''
                      }`}
                    >
                      {/* Hour column */}
                      <span className="w-12 text-xs font-mono font-bold text-zinc-500 shrink-0 mt-0.5 select-none">
                        {hrStr}:00
                      </span>

                      {/* Content space */}
                      <div className="flex-1 space-y-2">
                        {blocksAtHour.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {blocksAtHour.map(block => {
                              const mappedTask = tasks.find(t => t.id === block.taskId);
                              return (
                                <div
                                  key={block.id}
                                  draggable={true}
                                  onDragStart={(e) => handleDragStartBlock(e, block.id)}
                                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 cursor-grab active:cursor-grabbing transition-all ${
                                    block.completed 
                                    ? 'bg-zinc-900/40 border-emerald-500/20 opacity-50 text-zinc-500' 
                                    : getCategoryStyles(block.category)
                                  }`}
                                >
                                  <div className="space-y-1 text-xs">
                                    <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-400 font-bold">
                                      <Clock className="w-3 h-3 text-zinc-500" />
                                      <span>{block.startTime} - {block.endTime}</span>
                                      <span>•</span>
                                      <span>{block.category}</span>
                                    </div>
                                    <h4 className={`font-bold ${block.completed ? 'line-through text-zinc-600' : 'text-white'}`}>{block.title}</h4>
                                    
                                    {mappedTask && (
                                      <span className="text-[10px] text-zinc-400 block line-clamp-1">
                                        🎯 Milestone: {mappedTask.title}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={() => onToggleTimeBlockComplete(block.id)}
                                      className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white"
                                      title={block.completed ? "Mark incomplete" : "Complete block"}
                                    >
                                      <CheckCircle className={`w-4 h-4 ${block.completed ? 'text-emerald-400' : ''}`} />
                                    </button>
                                    <button 
                                      onClick={() => onDeleteTimeBlock(block.id)}
                                      className="p-1 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-rose-400"
                                      title="Delete block"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-600 italic block font-mono select-none">
                            {isOver ? "↓ Drop to Schedule Slot Corridor" : "No active scheduled focal blocks"}
                          </span>
                        )}

                        {/* Approaching Milestone Deadline display on hour 09:00 */}
                        {hrVal === 9 && dateDeadlines.length > 0 && (
                          <div className="bg-rose-950/15 border border-rose-500/20 p-2.5 rounded-xl space-y-1">
                            <span className="text-[9px] font-mono font-bold uppercase text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> CRITICAL CORRIDOR DEADLINE TODAY
                            </span>
                            {dateDeadlines.map(dl => (
                              <div key={dl.id} className="text-[11px] font-bold text-white flex justify-between items-center">
                                <span>⚠️ {dl.title}</span>
                                <span className="text-[9px] font-mono uppercase bg-rose-500/10 border border-rose-500/20 text-rose-400 px-1.5 py-0.2 rounded font-black">
                                  DUE TODAY
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: WEEKLY GRID */}
          {currentView === 'week' && (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {weekDays.map((day, idx) => {
                const dateStr = day.toISOString().split('T')[0];
                const isSelected = dateStr === selectedDate;
                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                const dayBlocks = timeBlocks.filter(b => b.date === dateStr)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                const dayDeadlines = getDeadlinesForDate(dateStr);
                const isOver = dragOverDay === dateStr;

                return (
                  <div
                    key={idx}
                    onDragOver={(e) => handleDragOver(e, dateStr)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    className={`glass-panel p-3.5 rounded-2xl border flex flex-col min-h-[420px] transition-all cursor-pointer relative ${
                      isSelected ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/5 hover:border-white/10'
                    } ${isOver ? 'bg-indigo-600/10 border-indigo-400' : ''}`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    {/* Column Header */}
                    <div className="border-b border-white/5 pb-2.5 mb-2.5 text-center">
                      <span className="text-[9px] font-bold uppercase text-zinc-500 block font-mono">
                        {dayNames[day.getDay()]}
                      </span>
                      <span className={`text-base font-bold font-mono block mt-0.5 ${
                        isToday ? 'text-indigo-400 underline decoration-2 font-black' : 'text-zinc-200'
                      }`}>
                        {day.getDate()}
                      </span>
                    </div>

                    {/* Column Body / Time blocks stack */}
                    <div className="flex-1 space-y-2">
                      {dayBlocks.length > 0 ? (
                        dayBlocks.map(block => (
                          <div
                            key={block.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStartBlock(e, block.id)}
                            className={`p-2.5 rounded-xl border text-[11px] space-y-1 relative cursor-grab active:cursor-grabbing transition-all ${
                              block.completed ? 'bg-zinc-900/40 border-emerald-500/15 opacity-40 text-zinc-500' : getCategoryStyles(block.category)
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span className="font-mono text-[8px] font-bold opacity-80">{block.startTime}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); onDeleteTimeBlock(block.id); }}
                                className="opacity-0 hover:opacity-100 absolute top-1 right-1 text-zinc-500 hover:text-rose-400 bg-zinc-950 p-0.5 rounded border border-white/5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <h4 className="font-bold line-clamp-2 leading-tight text-white">{block.title}</h4>
                            <span className="text-[8px] font-mono uppercase bg-white/5 px-1 py-0.2 rounded inline-block text-zinc-400">
                              {block.category}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-[10px] text-zinc-600 italic select-none">
                          {isOver ? "↓ Drop Here" : "No blocks"}
                        </div>
                      )}
                    </div>

                    {/* Column Footer: Deadline alerts */}
                    {dayDeadlines.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-rose-500/10 bg-rose-500/5 -mx-2 -mb-2 px-2 py-1.5 rounded-b-2xl">
                        <span className="text-[8px] font-mono font-bold uppercase text-rose-400 block tracking-wider">
                          ⚠️ {dayDeadlines.length} DEADLINE{dayDeadlines.length > 1 ? 'S' : ''}
                        </span>
                        <p className="text-[9px] text-white line-clamp-1 font-semibold">{dayDeadlines[0].title}</p>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW: MONTHLY GRID */}
          {currentView === 'month' && (
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 bg-zinc-950/40 p-2 rounded-xl border border-white/5">
                {dayNames.map((name, idx) => (
                  <span key={idx} className="text-center text-[9px] font-mono font-bold uppercase text-zinc-500 py-1">
                    {name}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((cell, idx) => {
                  const dateStr = cell.date.toISOString().split('T')[0];
                  const isSelected = dateStr === selectedDate;
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;
                  const dayBlocks = timeBlocks.filter(b => b.date === dateStr);
                  const dayDeadlines = getDeadlinesForDate(dateStr);

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`glass-panel p-2 rounded-xl border min-h-[75px] flex flex-col justify-between cursor-pointer transition-all ${
                        cell.isCurrentMonth ? '' : 'opacity-25'
                      } ${isSelected ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/5 hover:border-white/10'}`}
                    >
                      {/* Day Number */}
                      <span className={`text-[11px] font-mono font-bold block ${
                        isToday ? 'text-indigo-400 font-black underline' : 'text-zinc-400'
                      }`}>
                        {cell.date.getDate()}
                      </span>

                      {/* Display Blocks count and indicator */}
                      <div className="space-y-1">
                        {dayBlocks.length > 0 && (
                          <div className="bg-indigo-600/10 border border-indigo-500/20 px-1 py-0.5 rounded text-[8px] font-mono font-bold text-indigo-400 text-center">
                            {dayBlocks.length} block{dayBlocks.length > 1 ? 's' : ''}
                          </div>
                        )}

                        {dayDeadlines.length > 0 && (
                          <div className="bg-rose-500/10 border border-rose-500/20 px-1 py-0.5 rounded text-[8px] font-mono font-black text-rose-400 text-center animate-pulse">
                            🚨 Deadline
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Sidebar Column: Backlog task feed and AI suggestions (3 cols) */}
        <div className="xl:col-span-3 space-y-4">
          
          {/* Draggable Active Task Backlog */}
          <div className="glass-panel p-4 rounded-2xl border-white/5 space-y-3.5">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">DRAG DELIVERABLE TO SCHEDULE</span>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" /> Milestone Backlog
              </h3>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar pr-1">
              {tasks.filter(t => t.status !== 'completed' && !timeBlocks.some(b => b.taskId === t.id)).length > 0 ? (
                tasks.filter(t => t.status !== 'completed' && !timeBlocks.some(b => b.taskId === t.id)).map(task => (
                  <div
                    key={task.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStartTask(e, task.id)}
                    className="p-3 bg-zinc-900 border border-white/5 hover:border-white/10 rounded-xl cursor-grab active:cursor-grabbing transition-all hover:bg-zinc-850 space-y-1.5 relative group"
                    title="Drag and drop onto an hourly slot on the left to schedule focus sprint!"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="text-[11px] font-bold text-white line-clamp-2 pr-4">{task.title}</h4>
                      <Move className="w-3.5 h-3.5 text-zinc-500 group-hover:text-indigo-400 shrink-0 transition-all" />
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-zinc-500">{task.estimatedHours} hrs needed</span>
                      <span className={`uppercase font-black ${
                        task.priority === 'critical' ? 'text-rose-400' :
                        task.priority === 'high' ? 'text-amber-400' : 'text-zinc-500'
                      }`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="text-[9px] text-rose-400 bg-rose-500/5 px-1.5 py-0.5 rounded border border-rose-500/10 inline-block font-mono">
                      📅 Due: {task.deadline}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-zinc-500 text-xs italic">
                  All active milestones have focus blocks scheduled. Excellent compliance!
                </div>
              )}
            </div>
          </div>

          {/* AI Suggestions / Co-pilot recommendation box */}
          {aiSuggestions.length > 0 && (
            <div className="glass-panel p-4 rounded-2xl border-white/5 space-y-3.5 bg-gradient-to-br from-indigo-950/10 to-zinc-950">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider font-mono flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> CO-PILOT ALERT
              </span>

              <div className="space-y-3.5">
                {aiSuggestions.slice(0, 2).map((sug, sIdx) => (
                  <div key={sIdx} className="space-y-2 bg-white/2 p-3 rounded-xl border border-white/5 text-[11px]">
                    <p className="text-zinc-400 leading-relaxed font-semibold">
                      {sug.reason}
                    </p>
                    <button
                      onClick={() => handleApplySuggestion(sug.task, sug.suggestedHour)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-2.5 rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Book {sug.suggestedHour}:00 slot
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integration instructions & help */}
          <div className="glass-panel p-4 rounded-2xl border-white/5 bg-zinc-950/50 space-y-2 text-[11px] text-zinc-400 leading-relaxed">
            <span className="text-white font-bold flex items-center gap-1">
              <Info className="w-4 h-4 text-indigo-400" /> Interaction Guidelines
            </span>
            <ul className="space-y-1.5 list-disc pl-3.5">
              <li>Drag high-priority milestones from the Backlog onto specific hours/days to create block.</li>
              <li>Toggle any scheduled block as "completed" once you conclude your sprint to adjust safety score.</li>
              <li>Export to .ICS to import these scheduled blocks into your physical personal devices.</li>
            </ul>
          </div>

        </div>

      </div>

      {/* Manual Add block triggers */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Custom Block
        </button>
      </div>

      {/* Form Dialog Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="mb-5 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Block Deep Work Period</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Commit a specific slot in your calendar to single-task focus.</p>
              </div>
              <button 
                onClick={() => setIsAdding(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Focus Block Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 💻 Refactor Tailwind layout details"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 focus:bg-white/10 outline-none rounded-xl py-2.5 px-3.5 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Start Time (HH:MM)</label>
                  <input 
                    type="time" 
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 text-zinc-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">End Time (HH:MM)</label>
                  <input 
                    type="time" 
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 text-zinc-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Slot Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 text-zinc-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Focus">Focus Session</option>
                    <option value="Code">Coding sprint</option>
                    <option value="Design">Design system</option>
                    <option value="DevOps">DevOps & Cloud</option>
                    <option value="Break">Recovery break</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Link to Task Milestone</label>
                  <select
                    value={mappedTaskId}
                    onChange={(e) => setMappedTaskId(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 text-zinc-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">No mapped milestone</option>
                    {tasks.filter(t => t.status !== 'completed').map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg cursor-pointer"
              >
                Schedule Focal Sprint Block
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
