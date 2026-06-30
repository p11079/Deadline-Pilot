/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Home, 
  CheckSquare, 
  Calendar, 
  BarChart2, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ArrowRight,
  ShieldAlert,
  Zap,
  Flame,
  Bell
} from 'lucide-react';

import { ActivePage, Task, TimeBlock, AIInsight, Message, UserProfile } from './types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { 
  DEFAULT_USER, 
  DEFAULT_TASKS, 
  DEFAULT_TIME_BLOCKS, 
  DEFAULT_INSIGHTS, 
  DEFAULT_MESSAGES, 
  loadData, 
  saveData 
} from './data';
import { useAuth } from './context/AuthContext';

import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import TaskManagerPage from './components/TaskManagerPage';
import CalendarPage from './components/CalendarPage';
import AnalyticsPage from './components/AnalyticsPage';
import AIAssistantPage from './components/AIAssistantPage';
import SettingsPage from './components/SettingsPage';
import AIPlannerPage from './components/AIPlannerPage';
import NotificationsPage from './components/NotificationsPage';

export default function App() {
  const { currentUser, userProfile, loading, logout, updateUserProfile } = useAuth();

  // Navigation & Page routing
  const [currentPage, setCurrentPage] = useState<ActivePage>(() => loadData<ActivePage>('current_page', 'landing'));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core App states
  const user = userProfile || DEFAULT_USER;
  const [tasks, setTasks] = useState<Task[]>(() => loadData<Task[]>('tasks', DEFAULT_TASKS));
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(() => loadData<TimeBlock[]>('timeblocks', DEFAULT_TIME_BLOCKS));
  const [insights, setInsights] = useState<AIInsight[]>(() => loadData<AIInsight[]>('insights', DEFAULT_INSIGHTS));
  const [messages, setMessages] = useState<Message[]>(() => loadData<Message[]>('messages', DEFAULT_MESSAGES));
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  // Sync to local storage when state changes
  useEffect(() => {
    saveData('current_page', currentPage);
  }, [currentPage]);

  useEffect(() => {
    saveData('tasks', tasks);
  }, [tasks]);

  useEffect(() => {
    saveData('timeblocks', timeBlocks);
  }, [timeBlocks]);

  useEffect(() => {
    saveData('insights', insights);
  }, [insights]);

  useEffect(() => {
    saveData('messages', messages);
  }, [messages]);

  // Synchronize unread notifications unread count with server when logged in
  useEffect(() => {
    async function fetchUnreadCount() {
      if (currentUser) {
        try {
          const docRef = doc(db, 'notifications', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && data.notifications) {
              const count = data.notifications.filter((n: any) => !n.read).length;
              setUnreadNotifCount(count);
              return;
            }
          }
          
          // Fallback to API/Seed
          const token = await currentUser.getIdToken();
          const response = await fetch('/api/notifications', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.notifications) {
              const count = data.notifications.filter((n: any) => !n.read).length;
              setUnreadNotifCount(count);
              await setDoc(docRef, { notifications: data.notifications });
            }
          }
        } catch (error) {
          console.error('Error fetching notifications from Firestore/API in App:', error);
        }
      }
    }
    fetchUnreadCount();
  }, [currentUser, currentPage]);

  // Synchronize tasks with server when logged in
  useEffect(() => {
    async function fetchTasks() {
      if (currentUser) {
        try {
          const docRef = doc(db, 'tasks', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && data.tasks) {
              setTasks(data.tasks);
              return;
            }
          }

          // Fallback to API/Seed
          const token = await currentUser.getIdToken();
          const response = await fetch('/api/tasks', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.tasks) {
              setTasks(data.tasks);
              await setDoc(docRef, { tasks: data.tasks });
            }
          }
        } catch (error) {
          console.error('Error fetching tasks from Firestore/API in App:', error);
        }
      }
    }
    fetchTasks();
  }, [currentUser]);

  // Protect routes and redirect dynamically
  useEffect(() => {
    if (!loading) {
      const protectedPages: ActivePage[] = ['dashboard', 'tasks', 'calendar', 'analytics', 'assistant', 'settings'];
      if (!currentUser && protectedPages.includes(currentPage)) {
        setCurrentPage('login');
      } else if (currentUser && (currentPage === 'landing' || currentPage === 'login')) {
        setCurrentPage('dashboard');
      }
    }
  }, [currentUser, currentPage, loading]);

  // Auth helper
  const handleLoginSuccess = () => {
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentPage('landing');
    } catch (err) {
      console.error('Error during pilot sign out:', err);
    }
  };

  // Task operations
  const syncTasksToFirestore = async (userId: string, updatedTasks: Task[]) => {
    try {
      const docRef = doc(db, 'tasks', userId);
      await setDoc(docRef, { tasks: updatedTasks });
    } catch (error) {
      console.error('Error syncing tasks to Firestore:', error);
    }
  };

  const handleAddTask = async (newTask: Omit<Task, 'id' | 'createdAt' | 'progressScore'>) => {
    const task: Task = {
      ...newTask,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      progressScore: 0
    };
    
    setTasks(prev => {
      const updated = [task, ...prev];
      if (currentUser) {
        syncTasksToFirestore(currentUser.uid, updated);
      }
      return updated;
    });

    // Create a matching pilot AI insight when a high-priority task is created
    if (task.priority === 'critical' || task.priority === 'high') {
      const newInsight: AIInsight = {
        id: `ins-${Date.now()}`,
        type: 'warning',
        title: 'New High Stakes Target',
        message: `Pilot detected: '${task.title}' requires around ${task.estimatedHours} hrs of deep work. Shall I schedule focal slots for you?`,
        actionText: 'Auto-Block Slots',
        actionPayload: { taskId: task.id, title: `💻 Code sprint: ${task.title}` },
        timestamp: 'Just now'
      };
      setInsights(prev => [newInsight, ...prev]);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === updatedTask.id ? updatedTask : t);
      if (currentUser) {
        syncTasksToFirestore(currentUser.uid, updated);
      }
      return updated;
    });
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== id);
      if (currentUser) {
        syncTasksToFirestore(currentUser.uid, updated);
      }
      return updated;
    });
  };

  const handleToggleChecklistItem = async (taskId: string, itemId: string) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          const updatedChecklist = t.checklist.map(item => 
            item.id === itemId ? { ...item, completed: !item.completed } : item
          );
          const completedCount = updatedChecklist.filter(c => c.completed).length;
          const progressScore = Math.round((completedCount / updatedChecklist.length) * 100);
          return {
            ...t,
            checklist: updatedChecklist,
            progressScore
          };
        }
        return t;
      });
      if (currentUser) {
        syncTasksToFirestore(currentUser.uid, updated);
      }
      return updated;
    });
  };

  const handleBulkAction = async (ids: string[], action: 'complete' | 'delete' | 'update_priority' | 'update_category', value?: any) => {
    setTasks(prev => {
      let updated = prev;
      if (action === 'delete') {
        updated = prev.filter(t => !ids.includes(t.id));
      } else if (action === 'complete') {
        updated = prev.map(t => ids.includes(t.id) ? { ...t, status: 'completed' as const, progressScore: 100 } : t);
      } else if (action === 'update_priority') {
        updated = prev.map(t => ids.includes(t.id) ? { ...t, priority: value } : t);
      } else if (action === 'update_category') {
        updated = prev.map(t => ids.includes(t.id) ? { ...t, category: value } : t);
      }
      if (currentUser) {
        syncTasksToFirestore(currentUser.uid, updated);
      }
      return updated;
    });
  };

  // Calendar operations
  const handleAddTimeBlock = (newBlock: Omit<TimeBlock, 'id'>) => {
    const block: TimeBlock = {
      ...newBlock,
      id: `tb-${Date.now()}`
    };
    setTimeBlocks(prev => [...prev, block]);
  };

  const handleToggleTimeBlockComplete = (id: string) => {
    setTimeBlocks(prev => prev.map(b => b.id === id ? { ...b, completed: !b.completed } : b));
  };

  const handleUpdateTimeBlock = (updatedBlock: TimeBlock) => {
    setTimeBlocks(prev => prev.map(b => b.id === updatedBlock.id ? updatedBlock : b));
  };

  const handleDeleteTimeBlock = (id: string) => {
    setTimeBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleSplitTask = async (originalTaskId: string, subTasks: { title: string; estimatedHours: number }[]) => {
    const original = tasks.find(t => t.id === originalTaskId);
    if (!original) return;

    // Create new sub-tasks
    const newTasksToInsert: Task[] = subTasks.map((st, idx) => ({
      id: `task-split-${Date.now()}-${idx}`,
      title: st.title,
      description: `Sourced from proactive copilot split of: ${original.title}`,
      deadline: original.deadline,
      priority: original.priority,
      status: 'todo' as const,
      category: original.category || 'Focus Corridor',
      estimatedHours: st.estimatedHours,
      actualHoursSpent: 0,
      checklist: [],
      progressScore: 0,
      createdAt: new Date().toISOString()
    }));

    // Update original task to completed status
    const updatedTasks = tasks.map(t => {
      if (t.id === originalTaskId) {
        return {
          ...t,
          status: 'completed' as const,
          description: `${t.description} (Proactively split into ${subTasks.length} sub-tasks).`
        };
      }
      return t;
    });

    setTasks([...newTasksToInsert, ...updatedTasks]);

    // Sync to database
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        for (const nt of newTasksToInsert) {
          await fetch('/api/tasks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(nt)
          });
        }
        const origTask = updatedTasks.find(t => t.id === originalTaskId);
        if (origTask) {
          await fetch(`/api/tasks/${originalTaskId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(origTask)
          });
        }
      } catch (error) {
        console.error('Error syncing split tasks to database:', error);
      }
    }
  };

  // AI Insights triggers
  const handleApplyInsightAction = (payload: any) => {
    if (!payload) return;

    // Proactive auto-scheduling simulation based on insight CTA
    const targetTask = tasks.find(t => t.id === payload.taskId);
    if (!targetTask) return;

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Auto-create a custom time block for today
    const blockTitle = payload.title || `⚡ Deep Work focus: ${targetTask.title}`;
    const newBlock: TimeBlock = {
      id: `tb-auto-${Date.now()}`,
      taskId: targetTask.id,
      title: blockTitle,
      startTime: payload.startTime || '16:00',
      endTime: payload.endTime || '17:30',
      date: todayStr,
      category: targetTask.category || 'Focus',
      completed: false
    };

    setTimeBlocks(prev => [...prev, newBlock]);
    
    // Remove the applied insight from lists
    setInsights(prev => prev.filter(ins => ins.actionPayload?.taskId !== targetTask.id));

    alert(`Co-pilot scheduled focus sprint block successfully!\n📅 Today: ${newBlock.startTime} - ${newBlock.endTime} placed in your Calendar.`);
  };

  // AI Chat operations
  const handleSendMessage = (text: string) => {
    const newUserMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newUserMsg]);
  };

  const handleConfirmSuggestedAction = (actionType: string, payload: any) => {
    if (actionType === 'simulate_reply') {
      // Create assistant reply message
      const asstReply: Message = {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: payload.text,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: payload.suggestedAction
      };
      setMessages(prev => [...prev, asstReply]);
    } else if (actionType === 'add_time_block') {
      // Perform auto-timeblock creation directly from chat confirmation button!
      const targetTask = tasks.find(t => t.id === payload.taskId) || tasks[0];
      const todayStr = new Date().toISOString().split('T')[0];

      const newBlock: TimeBlock = {
        id: `tb-chat-${Date.now()}`,
        taskId: targetTask.id,
        title: `🔥 Rescue Session: ${targetTask.title}`,
        startTime: payload.startTime || '13:00',
        endTime: payload.endTime || '14:30',
        date: todayStr,
        category: 'Focus',
        completed: false
      };

      setTimeBlocks(prev => [...prev, newBlock]);
      
      // Send confirm feedback message
      const followUpMsg: Message = {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `Awesome! I've committed the **Rescue focus block** to your calendar today at **13:00 - 14:30**. Let's execute successfully.`,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, followUpMsg]);
    }
  };

  // Reset sandbox settings
  const handleResetDemoData = () => {
    setTasks(DEFAULT_TASKS);
    setTimeBlocks(DEFAULT_TIME_BLOCKS);
    setInsights(DEFAULT_INSIGHTS);
    setMessages(DEFAULT_MESSAGES);
    updateUserProfile(DEFAULT_USER);
    setCurrentPage('dashboard');
  };

  // Sidebar navigation panel configuration
  const navigationItems: { id: ActivePage; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tasks', label: 'Milestone Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Time Blocks', icon: Calendar },
    { id: 'planner', label: 'AI Tactical Planner', icon: Sparkles },
    { id: 'analytics', label: 'Safety Analytics', icon: BarChart2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'assistant', label: 'AI Pilot Chat', icon: MessageSquare },
    { id: 'settings', label: 'Operational Settings', icon: Settings },
  ];

  // Render correct route views
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardPage 
            tasks={tasks}
            insights={insights}
            timeBlocks={timeBlocks}
            user={user}
            onNavigate={(page) => setCurrentPage(page)}
            onToggleChecklistItem={handleToggleChecklistItem}
            onApplyInsightAction={handleApplyInsightAction}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
          />
        );
      case 'tasks':
        return (
          <TaskManagerPage 
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onBulkAction={handleBulkAction}
          />
        );
      case 'calendar':
        return (
          <CalendarPage 
            timeBlocks={timeBlocks}
            tasks={tasks}
            onAddTimeBlock={handleAddTimeBlock}
            onToggleTimeBlockComplete={handleToggleTimeBlockComplete}
            onUpdateTimeBlock={handleUpdateTimeBlock}
            onDeleteTimeBlock={handleDeleteTimeBlock}
          />
        );
      case 'planner':
        return (
          <AIPlannerPage 
            tasks={tasks}
            timeBlocks={timeBlocks}
            onAddTimeBlock={handleAddTimeBlock}
            onSplitTask={handleSplitTask}
            onNavigate={(page) => setCurrentPage(page)}
          />
        );
      case 'analytics':
        return (
          <AnalyticsPage 
            tasks={tasks}
            timeBlocks={timeBlocks}
          />
        );
      case 'assistant':
        return (
          <AIAssistantPage 
            messages={messages}
            tasks={tasks}
            onSendMessage={handleSendMessage}
            onConfirmSuggestedAction={handleConfirmSuggestedAction}
          />
        );
      case 'settings':
        return (
          <SettingsPage 
            user={user}
            onUpdateUser={updateUserProfile}
            onResetDemoData={handleResetDemoData}
          />
        );
      case 'notifications':
        return (
          <NotificationsPage 
            tasks={tasks}
            timeBlocks={timeBlocks}
            onNavigate={(page) => setCurrentPage(page)}
          />
        );
      default:
        return null;
    }
  };

  // Render Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center font-sans relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-display font-bold text-xl text-white">DeadlinePilot</h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono uppercase tracking-widest">Checking autopilot status...</p>
        </div>
      </div>
    );
  }

  // Return Landing View or Auth Card directly
  if (currentPage === 'landing') {
    return <LandingPage onNavigate={(page) => setCurrentPage(page)} />;
  }

  if (currentPage === 'login') {
    return (
      <LoginPage 
        onLoginSuccess={handleLoginSuccess}
        onNavigate={(page) => setCurrentPage(page)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Persistent Notion/Linear Side Menu */}
      <aside className="hidden lg:flex w-64 border-r border-white/5 bg-[#0b0b0d]/80 backdrop-blur-md flex-col justify-between shrink-0 relative z-30">
        
        {/* Top Header Logo */}
        <div className="p-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentPage('landing')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/15">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-base tracking-tight text-white">DeadlinePilot</span>
              <span className="text-[9px] block font-mono text-zinc-500 uppercase -mt-1">Vibe2Ship</span>
            </div>
          </div>
          
          {/* Quick Active Flight Code */}
          <div className="mt-4 bg-white/2 border border-white/5 p-2 rounded-lg flex items-center justify-between text-[10px] font-mono">
            <span className="text-zinc-500 uppercase">SYS STATUS</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> PILOT ENGAGED
            </span>
          </div>
        </div>

        {/* Primary Navigation Menu list */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.id === 'notifications' && unreadNotifCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Signout block */}
        <div className="p-4 border-t border-white/5 space-y-3 bg-white/1">
          <div className="flex items-center gap-3">
            <img 
              src={user.avatarUrl} 
              alt="User profile" 
              className="w-9 h-9 rounded-xl object-cover border border-white/10"
            />
            <div className="flex-1 overflow-hidden">
              <span className="block text-xs font-bold text-white truncate">{user.name}</span>
              <span className="block text-[10px] font-mono text-zinc-500 truncate">{user.email}</span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-zinc-400 border border-white/5 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out Pilot
          </button>
        </div>
      </aside>

      {/* Main Content Pane Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        
        {/* Mobile Responsive Header bar */}
        <header className="lg:hidden border-b border-white/5 bg-[#0b0b0d]/90 backdrop-blur-md py-4 px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('landing')}>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <span className="font-display font-bold text-sm tracking-tight text-white">DeadlinePilot</span>
          </div>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-all"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile slide-out dropdown navigation container */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="lg:hidden fixed top-[57px] left-0 right-0 border-b border-white/10 bg-[#0d0d10] z-30 p-4 space-y-2 shadow-2xl backdrop-blur-md"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-colors ${
                      isActive 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.id === 'notifications' && unreadNotifCount > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0">
                        {unreadNotifCount}
                      </span>
                    )}
                  </button>
                );
              })}
              <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />
                  <span className="text-xs font-semibold text-white">{user.name}</span>
                </div>
                <button onClick={handleLogout} className="text-xs text-rose-400 hover:underline">
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Body Content Stage */}
        <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
          <div className="max-w-6xl mx-auto">
            {renderPageContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
