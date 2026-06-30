/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  List, 
  Kanban, 
  Eye, 
  CheckSquare, 
  Square,
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Trash2, 
  Calendar, 
  Target, 
  HelpCircle, 
  X, 
  Filter, 
  ArrowUpDown, 
  Repeat, 
  Zap 
} from 'lucide-react';
import { Task, TaskStatus, Priority, ChecklistItem } from '../types';

interface TaskManagerPageProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'progressScore'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onBulkAction?: (ids: string[], action: 'complete' | 'delete' | 'update_priority' | 'update_category', value?: any) => void;
}

export default function TaskManagerPage({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onBulkAction
}: TaskManagerPageProps) {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Form states for new task
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newCategory, setNewCategory] = useState('Work');
  const [newEstHours, setNewEstHours] = useState(3);
  const [newChecklistRaw, setNewChecklistRaw] = useState('Draft core milestones\nTest deployment parameters');
  
  // New properties form states
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [newEnergy, setNewEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [newIsRecurring, setNewIsRecurring] = useState(false);
  const [newRecurringInterval, setNewRecurringInterval] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');

  // Task filtering and sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterEnergy, setFilterEnergy] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'difficulty' | 'energy' | 'title'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Multi-selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const checklistItems: ChecklistItem[] = newChecklistRaw
      .split('\n')
      .filter(line => line.trim())
      .map((line, idx) => ({
        id: `c-new-${idx}-${Date.now()}`,
        text: line.trim(),
        completed: false,
        timeEstimateMinutes: Math.round((newEstHours * 60) / 3) || 30
      }));

    onAddTask({
      title: newTitle,
      description: newDesc,
      deadline: new Date(newDeadline).toISOString(),
      priority: newPriority,
      status: 'todo',
      category: newCategory,
      estimatedHours: Number(newEstHours),
      actualHoursSpent: 0,
      checklist: checklistItems,
      aiSuggestedReason: `Configured with ${checklistItems.length} focal checkpoints.`,
      difficulty: newDifficulty,
      energyRequired: newEnergy,
      isRecurring: newIsRecurring,
      recurringInterval: newRecurringInterval
    });

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewChecklistRaw('Draft core milestones\nTest deployment parameters');
    setNewDifficulty('medium');
    setNewEnergy('medium');
    setNewIsRecurring(false);
    setNewRecurringInterval('none');
    setIsAdding(false);
  };

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    onUpdateTask({
      ...task,
      status: newStatus,
      progressScore: newStatus === 'completed' ? 100 : task.progressScore
    });
    if (selectedTask?.id === task.id) {
      setSelectedTask({ ...task, status: newStatus, progressScore: newStatus === 'completed' ? 100 : task.progressScore });
    }
  };

  const handlePriorityChange = (task: Task, newPriority: Priority) => {
    onUpdateTask({ ...task, priority: newPriority });
    if (selectedTask?.id === task.id) {
      setSelectedTask({ ...task, priority: newPriority });
    }
  };

  const handleToggleChecklistItem = (task: Task, itemId: string) => {
    const updatedChecklist = task.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    const completedCount = updatedChecklist.filter(c => c.completed).length;
    const progressScore = Math.round((completedCount / updatedChecklist.length) * 100);

    const updatedTask = {
      ...task,
      checklist: updatedChecklist,
      progressScore
    };
    
    onUpdateTask(updatedTask);
    if (selectedTask?.id === task.id) {
      setSelectedTask(updatedTask);
    }
  };

  // Filtering calculations
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesDifficulty = filterDifficulty === 'all' || t.difficulty === filterDifficulty;
    const matchesEnergy = filterEnergy === 'all' || t.energyRequired === filterEnergy;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesPriority && matchesDifficulty && matchesEnergy && matchesStatus;
  });

  // Sorting weight helpers
  const getPriorityWeight = (p: Priority) => {
    switch (p) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  const getDifficultyWeight = (d?: string) => {
    switch (d) {
      case 'hard': return 3;
      case 'medium': return 2;
      case 'easy': return 1;
      default: return 0;
    }
  };

  const getEnergyWeight = (e?: string) => {
    switch (e) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  // Sorted tasks output
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'deadline') {
      comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    } else if (sortBy === 'priority') {
      comparison = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    } else if (sortBy === 'difficulty') {
      comparison = getDifficultyWeight(b.difficulty) - getDifficultyWeight(a.difficulty);
    } else if (sortBy === 'energy') {
      comparison = getEnergyWeight(b.energyRequired) - getEnergyWeight(a.energyRequired);
    } else if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Selection toggle functions
  const handleToggleSelectTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredTasks = () => {
    const allFilteredIds = sortedTasks.map(t => t.id);
    const areAllSelected = allFilteredIds.every(id => selectedTaskIds.includes(id));
    
    if (areAllSelected) {
      setSelectedTaskIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedTaskIds(prev => {
        const newSelection = [...prev];
        allFilteredIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const columns: { label: string; status: TaskStatus; color: string }[] = [
    { label: 'Backlog', status: 'backlog', color: 'border-white/5 bg-black/10' },
    { label: 'To Do', status: 'todo', color: 'border-white/5 bg-zinc-950/20' },
    { label: 'In Progress', status: 'in_progress', color: 'border-indigo-500/10 bg-indigo-950/5' },
    { label: 'Completed', status: 'completed', color: 'border-emerald-500/10 bg-emerald-950/5' },
  ];

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6">
      {/* Header and top tools */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" /> Operational Milestones
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Linear-style strategic tracking engine. Set target deadlines and let the co-pilot schedule rescue blocks.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* View Switcher */}
          <div className="bg-zinc-900 border border-white/5 p-1 rounded-xl flex items-center">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Board
            </button>
          </div>

          <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-500/15 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Milestone
          </button>
        </div>
      </div>

      {/* Advanced Filters and Sort options */}
      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col gap-3.5">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search bar */}
          <input 
            type="text"
            placeholder="Filter issue title, description, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 focus:border-indigo-500 focus:bg-white/10 outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 transition-all"
          />

          {/* Quick Clear selections button */}
          {selectedTaskIds.length > 0 && (
            <button
              onClick={() => setSelectedTaskIds([])}
              className="bg-zinc-900 border border-white/10 text-xs text-zinc-300 rounded-xl px-4 py-2.5 outline-none hover:text-white hover:border-white/20 transition-all font-semibold flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Reset Selection ({selectedTaskIds.length})
            </button>
          )}
        </div>

        {/* Filter select list */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs text-zinc-300">
          <div>
            <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1 tracking-wider">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-zinc-300"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical Only</option>
              <option value="high">High Only</option>
              <option value="medium">Medium Only</option>
              <option value="low">Low Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1 tracking-wider">Difficulty</label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-zinc-300"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1 tracking-wider">Energy Need</label>
            <select
              value={filterEnergy}
              onChange={(e) => setFilterEnergy(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-zinc-300"
            >
              <option value="all">All Energies</option>
              <option value="low">Low Energy</option>
              <option value="medium">Medium Energy</option>
              <option value="high">High Energy</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1 tracking-wider">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-zinc-300"
            >
              <option value="all">All Statuses</option>
              <option value="backlog">Backlog</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1 tracking-wider">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-zinc-300"
            >
              <option value="deadline">Target Deadline</option>
              <option value="priority">Priority Weight</option>
              <option value="difficulty">Difficulty Index</option>
              <option value="energy">Energy Required</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={toggleSortOrder}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-center transition-all flex items-center justify-center gap-1.5 font-semibold text-zinc-300 hover:text-white"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
              Order: <span className="text-indigo-400 uppercase">{sortOrder}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'list' ? (
        /* Linear-like detailed list */
        <div className="glass-panel rounded-2xl border-white/5 overflow-hidden">
          <div className="grid grid-cols-12 px-6 py-3.5 border-b border-white/5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest bg-white/2 items-center">
            {/* Multi selection Master box */}
            <div className="col-span-1 flex items-center">
              <input 
                type="checkbox"
                checked={sortedTasks.length > 0 && sortedTasks.every(t => selectedTaskIds.includes(t.id))}
                onChange={handleSelectAllFilteredTasks}
                className="w-4 h-4 rounded border-white/20 bg-transparent text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
            <div className="col-span-4">Milestone Task</div>
            <div className="col-span-2">Deadline</div>
            <div className="col-span-2 text-center">Attributes</div>
            <div className="col-span-1 text-center">Recurrence</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          <div className="divide-y divide-white/5">
            {sortedTasks.length > 0 ? (
              sortedTasks.map(task => (
                <div 
                  key={task.id}
                  className={`grid grid-cols-12 px-6 py-4 items-center hover:bg-white/2 transition-colors text-sm text-zinc-300 ${
                    selectedTaskIds.includes(task.id) ? 'bg-indigo-500/5' : ''
                  }`}
                >
                  {/* Select task item checkbox */}
                  <div className="col-span-1 flex items-center">
                    <input 
                      type="checkbox"
                      checked={selectedTaskIds.includes(task.id)}
                      onChange={(e) => handleToggleSelectTask(task.id, e)}
                      className="w-4 h-4 rounded border-white/20 bg-transparent text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div className="col-span-4 flex items-start gap-3 pr-2">
                    <input 
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => handleStatusChange(task, task.status === 'completed' ? 'todo' : 'completed')}
                      className="mt-1 w-4 h-4 rounded border-white/20 bg-transparent text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="space-y-1 overflow-hidden">
                      <span 
                        onClick={() => setSelectedTask(task)}
                        className={`font-semibold cursor-pointer text-white hover:text-indigo-400 transition-colors block truncate ${
                          task.status === 'completed' ? 'line-through text-zinc-500' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                      <p className="text-xs text-zinc-400 line-clamp-1">{task.description}</p>
                      <span className="inline-block text-[9px] bg-white/5 border border-white/10 text-zinc-400 font-mono px-2 py-0.5 rounded">
                        {task.category}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 font-mono text-xs">
                    {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                    <span className="text-[10px] text-zinc-500 block sm:inline">
                      {new Date(task.deadline).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Attributes: Priority / Difficulty / Energy */}
                  <div className="col-span-2 text-center flex flex-col sm:flex-row items-center justify-center gap-1">
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                      task.priority === 'critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' :
                      task.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      task.priority === 'medium' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}>
                      {task.priority}
                    </span>
                    
                    {task.difficulty && (
                      <span className={`text-[9px] font-medium uppercase px-1.5 py-0.5 rounded border ${
                        task.difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/15' :
                        task.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/15' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/15'
                      }`}>
                        {task.difficulty}
                      </span>
                    )}

                    {task.energyRequired && (
                      <span className="text-[9px] text-zinc-400 flex items-center gap-0.5 bg-zinc-900 border border-white/5 px-1.5 py-0.5 rounded" title="Energy level needed">
                        <Zap className={`w-2.5 h-2.5 ${task.energyRequired === 'high' ? 'text-yellow-400' : 'text-zinc-500'}`} />
                        {task.energyRequired}
                      </span>
                    )}
                  </div>

                  {/* Recurrence */}
                  <div className="col-span-1 text-center font-mono text-xs">
                    {task.isRecurring && task.recurringInterval ? (
                      <span className="text-zinc-400 inline-flex items-center gap-1 bg-indigo-500/5 border border-indigo-500/10 px-1.5 py-0.5 rounded text-[10px]">
                        <Repeat className="w-2.5 h-2.5 text-indigo-400" />
                        {task.recurringInterval}
                      </span>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </div>

                  <div className="col-span-1 text-center">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                      className={`text-[11px] rounded-lg px-2 py-1 bg-zinc-950 border font-medium ${
                        task.status === 'completed' ? 'text-emerald-400 border-emerald-500/20' :
                        task.status === 'in_progress' ? 'text-indigo-400 border-indigo-500/20' :
                        'text-zinc-300 border-white/10'
                      }`}
                    >
                      <option value="backlog">Backlog</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="col-span-1 text-right flex justify-end gap-1">
                    <button 
                      onClick={() => setSelectedTask(task)}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                      title="Inspect Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 hover:bg-rose-500/10 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Delete Milestone"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No matching workspace milestones found.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Kanban Board view */
        <div className="grid md:grid-cols-4 gap-6">
          {columns.map(col => {
            const colTasks = sortedTasks.filter(t => t.status === col.status);
            return (
              <div key={col.status} className={`rounded-2xl border p-4 flex flex-col h-[600px] ${col.color}`}>
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{col.label}</span>
                  <span className="text-xs font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {colTasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="glass-panel glass-panel-hover p-4 rounded-xl border-white/5 cursor-pointer relative"
                    >
                      {task.priority === 'critical' && (
                        <div className="absolute top-0 left-4 right-4 h-0.5 bg-rose-500 rounded-full" />
                      )}
                      
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded">
                          {task.category}
                        </span>
                        <div className="flex gap-1">
                          <span className={`text-[9px] font-bold uppercase ${
                            task.priority === 'critical' ? 'text-rose-400' :
                            task.priority === 'high' ? 'text-orange-400' :
                            'text-zinc-500'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-semibold text-white line-clamp-1 mb-1">{task.title}</h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-3">{task.description}</p>

                      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                        {task.difficulty && (
                          <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-400 border border-white/5">
                            {task.difficulty}
                          </span>
                        )}
                        {task.energyRequired && (
                          <span className="text-[9px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 border border-white/5 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 text-yellow-500" /> {task.energyRequired}
                          </span>
                        )}
                        {task.isRecurring && (
                          <span className="text-[9px] bg-indigo-500/10 px-1.5 py-0.5 rounded text-indigo-400 border border-indigo-500/10 flex items-center gap-0.5">
                            <Repeat className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-zinc-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span>{task.progressScore}% confidence</span>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="text-center py-10 text-zinc-600 text-xs border border-dashed border-white/5 rounded-xl">
                      Drop cards here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedTaskIds.length > 0 && onBulkAction && (
          <motion.div 
            initial={{ y: 50, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 50, opacity: 0, x: '-50%' }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-950 border border-indigo-500/30 backdrop-blur-md px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-6 max-w-full overflow-x-auto"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-semibold text-zinc-300">
                <span className="text-indigo-400 font-bold">{selectedTaskIds.length}</span> items selected
              </span>
            </div>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => {
                  onBulkAction(selectedTaskIds, 'complete');
                  setSelectedTaskIds([]);
                }}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Complete
              </button>

              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onBulkAction(selectedTaskIds, 'update_priority', e.target.value);
                    setSelectedTaskIds([]);
                    e.target.value = '';
                  }
                }}
                className="bg-zinc-900 border border-white/10 text-zinc-300 py-1.5 px-3 rounded-xl font-medium outline-none cursor-pointer"
              >
                <option value="">Set Priority...</option>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Priority</option>
              </select>

              <button
                onClick={() => {
                  const cat = prompt("Enter new category name:");
                  if (cat) {
                    onBulkAction(selectedTaskIds, 'update_category', cat);
                    setSelectedTaskIds([]);
                  }
                }}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl font-medium transition-colors cursor-pointer"
              >
                Change Category
              </button>

              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${selectedTaskIds.length} tasks?`)) {
                    onBulkAction(selectedTaskIds, 'delete');
                    setSelectedTaskIds([]);
                  }
                }}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>

            <div className="h-4 w-px bg-white/10" />

            <button
              onClick={() => setSelectedTaskIds([])}
              className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              title="Cancel selection"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal/Overlay: Task Detail Inspector */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {/* Top gradient strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

            <button 
              onClick={() => setSelectedTask(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              {/* Category and title */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-indigo-400 font-semibold tracking-wider uppercase block">
                  {selectedTask.category} Milestone
                </span>
                <h3 className="text-xl font-bold font-display text-white">{selectedTask.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{selectedTask.description}</p>
              </div>

              {/* Status and priority controls */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-y border-white/5 py-4 text-xs">
                <div>
                  <span className="text-zinc-500 block mb-1">Status Code</span>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleStatusChange(selectedTask, e.target.value as TaskStatus)}
                    className="bg-zinc-900 border border-white/10 text-zinc-200 rounded-lg py-1.5 px-2.5 outline-none focus:border-indigo-500 w-full"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <span className="text-zinc-500 block mb-1">Priority Weight</span>
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => handlePriorityChange(selectedTask, e.target.value as Priority)}
                    className="bg-zinc-900 border border-white/10 text-zinc-200 rounded-lg py-1.5 px-2.5 outline-none focus:border-indigo-500 w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <span className="text-zinc-500 block mb-1">Target Deadline</span>
                  <div className="bg-white/5 border border-white/10 rounded-lg py-1.5 px-2.5 text-zinc-300 font-mono text-center">
                    {new Date(selectedTask.deadline).toLocaleDateString()} at {new Date(selectedTask.deadline).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>

                <div>
                  <span className="text-zinc-500 block mb-1">Difficulty</span>
                  <select
                    value={selectedTask.difficulty || 'medium'}
                    onChange={(e) => {
                      const updated = { ...selectedTask, difficulty: e.target.value as 'easy' | 'medium' | 'hard' };
                      onUpdateTask(updated);
                      setSelectedTask(updated);
                    }}
                    className="bg-zinc-900 border border-white/10 text-zinc-200 rounded-lg py-1.5 px-2.5 outline-none focus:border-indigo-500 w-full"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <span className="text-zinc-500 block mb-1">Energy Demand</span>
                  <select
                    value={selectedTask.energyRequired || 'medium'}
                    onChange={(e) => {
                      const updated = { ...selectedTask, energyRequired: e.target.value as 'low' | 'medium' | 'high' };
                      onUpdateTask(updated);
                      setSelectedTask(updated);
                    }}
                    className="bg-zinc-900 border border-white/10 text-zinc-200 rounded-lg py-1.5 px-2.5 outline-none focus:border-indigo-500 w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <span className="text-zinc-500 block mb-1">Recurrence</span>
                  <select
                    value={selectedTask.recurringInterval || 'none'}
                    onChange={(e) => {
                      const val = e.target.value as 'none' | 'daily' | 'weekly' | 'monthly';
                      const updated = { 
                        ...selectedTask, 
                        isRecurring: val !== 'none',
                        recurringInterval: val 
                      };
                      onUpdateTask(updated);
                      setSelectedTask(updated);
                    }}
                    className="bg-zinc-900 border border-white/10 text-zinc-200 rounded-lg py-1.5 px-2.5 outline-none focus:border-indigo-500 w-full"
                  >
                    <option value="none">One-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Pilot Checklist Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    Pilot Micro-Checklist Focus
                  </span>
                  <span className="text-xs text-zinc-500">
                    Completion Index: <span className="text-indigo-400 font-semibold">{selectedTask.progressScore}%</span>
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedTask.checklist && selectedTask.checklist.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => handleToggleChecklistItem(selectedTask, item.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        item.completed 
                        ? 'bg-zinc-900/40 border-emerald-500/10 text-zinc-500 line-through' 
                        : 'bg-zinc-900/80 border-white/5 text-zinc-300 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4.5 h-4.5 rounded-lg border flex items-center justify-center transition-all ${
                          item.completed ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-white/20'
                        }`}>
                          {item.completed && <CheckSquare className="w-3.5 h-3.5" />}
                        </div>
                        <span>{item.text}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-white/5 text-zinc-500 px-2 py-0.5 rounded">
                        {item.timeEstimateMinutes} mins
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Pilot suggestions block */}
              {selectedTask.aiSuggestedReason && (
                <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-indigo-300">Predictive Pilot Analysis</span>
                    <p className="text-zinc-400 leading-relaxed">{selectedTask.aiSuggestedReason}</p>
                  </div>
                </div>
              )}

              {/* Action bar */}
              <div className="flex justify-between items-center pt-2">
                <button 
                  onClick={() => {
                    onDeleteTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Milestone
                </button>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="bg-white/10 hover:bg-white/20 text-white font-medium text-xs px-4 py-2 rounded-xl border border-white/10 transition-colors cursor-pointer"
                >
                  Close Operational Panel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal/Overlay: Add Milestone Form */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="mb-5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold font-display text-white">Create Tactical Milestone</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Define your target, deadline weights, and core checklist files.</p>
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
                <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Milestone Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Build Google Cloud Build Trigger"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 focus:bg-white/10 outline-none rounded-xl py-2.5 px-3.5 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Mission description</label>
                <textarea 
                  placeholder="What are you trying to accomplish before the clock runs out?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 focus:bg-white/10 outline-none rounded-xl py-2.5 px-3.5 text-zinc-200 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Strategic Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full bg-zinc-900 border border-white/10 text-zinc-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">CRITICAL (Alert pulse enabled)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Operational Category</label>
                  <input 
                    type="text" 
                    placeholder="Work, Hackathon, Life, DevOps"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 focus:bg-white/10 outline-none rounded-xl py-2.5 px-3.5 text-zinc-200"
                  />
                </div>
              </div>

              {/* Attributes: Difficulty, Energy and Recurrence Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    className="w-full bg-zinc-900 border border-white/10 text-zinc-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Energy Demand</label>
                  <select
                    value={newEnergy}
                    onChange={(e) => setNewEnergy(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full bg-zinc-900 border border-white/10 text-zinc-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="low">Low Energy</option>
                    <option value="medium">Medium Energy</option>
                    <option value="high">High Energy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Recurrence</label>
                  <select
                    value={newRecurringInterval}
                    onChange={(e) => {
                      const val = e.target.value as 'none' | 'daily' | 'weekly' | 'monthly';
                      setNewRecurringInterval(val);
                      setNewIsRecurring(val !== 'none');
                    }}
                    className="w-full bg-zinc-900 border border-white/10 text-zinc-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="none">One-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Hard Deadline Date/Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 text-zinc-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Estimated Hours Required</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={100}
                    value={newEstHours}
                    onChange={(e) => setNewEstHours(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 focus:bg-white/10 outline-none rounded-xl py-2.5 px-3.5 text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-zinc-400 font-semibold uppercase tracking-wider">
                    Pilot Micro-Checklist (One per line)
                  </label>
                  <span className="text-[10px] text-indigo-400 font-semibold">Parsed automatically</span>
                </div>
                <textarea 
                  rows={3}
                  value={newChecklistRaw}
                  onChange={(e) => setNewChecklistRaw(e.target.value)}
                  placeholder="Checklist point 1&#10;Checklist point 2&#10;Checklist point 3"
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 focus:bg-white/10 outline-none rounded-xl py-2.5 px-3.5 text-zinc-200 font-mono"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg cursor-pointer"
              >
                Assemble Milestone Task
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
