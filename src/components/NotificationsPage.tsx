/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Settings, 
  Sparkles, 
  Mail, 
  Chrome, 
  Flame, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Trash2, 
  Compass, 
  Volume2, 
  Hourglass, 
  User, 
  Tv, 
  Cpu, 
  RefreshCw,
  Sun,
  Moon,
  TrendingDown,
  ExternalLink
} from 'lucide-react';
import { SmartNotification, NotificationSettings, Task, TimeBlock, ActivePage } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface NotificationsPageProps {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  onNavigate: (page: ActivePage) => void;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enableBrowser: true,
  enableEmail: true,
  enableFCM: true,
  alertTypes: {
    deadline: true,
    ai_warning: true,
    brief: true,
    summary: true,
    overload: true,
    burnout: true
  },
  emailAddress: '',
  fcmToken: ''
};

export default function NotificationsPage({ tasks, timeBlocks, onNavigate }: NotificationsPageProps) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [filter, setFilter] = useState<'all' | 'alert' | 'brief' | 'warning'>('all');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  // Simulated console feed logs for email / fcm tests
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<string>('default');

  // Load notifications and settings from Firestore directly (with API fallback)
  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        const notifDocRef = doc(db, 'notifications', currentUser.uid);
        const notifSnap = await getDoc(notifDocRef);
        if (notifSnap.exists()) {
          const data = notifSnap.data();
          setNotifications(data?.notifications || []);
        } else {
          // Fallback to API/Seed
          const token = await currentUser.getIdToken();
          const notifRes = await fetch('/api/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (notifRes.ok) {
            const data = await notifRes.json();
            setNotifications(data.notifications || []);
            await setDoc(notifDocRef, { notifications: data.notifications || [] });
          }
        }

        const settingsDocRef = doc(db, 'notificationSettings', currentUser.uid);
        const settingsSnap = await getDoc(settingsDocRef);
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data) {
            setSettings({
              ...DEFAULT_SETTINGS,
              ...data,
              emailAddress: data.emailAddress || currentUser.email || '',
              fcmToken: data.fcmToken || `fcm-tok-${Math.random().toString(36).substring(2, 10)}`
            });
          }
        } else {
          // Fallback to API/Seed
          const token = await currentUser.getIdToken();
          const settingsRes = await fetch('/api/notifications/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (settingsRes.ok) {
            const data = await settingsRes.json();
            if (data.settings) {
              const mergedSettings = {
                ...DEFAULT_SETTINGS,
                ...data.settings,
                emailAddress: data.settings.emailAddress || currentUser.email || '',
                fcmToken: data.settings.fcmToken || `fcm-tok-${Math.random().toString(36).substring(2, 10)}`
              };
              setSettings(mergedSettings);
              await setDoc(settingsDocRef, mergedSettings);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load notifications/settings from Firestore/API:', err);
      }
    }

    if ("Notification" in window) {
      setBrowserPermission(Notification.permission);
    }
    loadData();
  }, [currentUser]);

  // Request browser notification permission
  const handleRequestPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setBrowserPermission(result);
      if (result === 'granted') {
        const updated = { ...settings, enableBrowser: true };
        setSettings(updated);
        await saveSettings(updated);
        addConsoleLog('🔑 [Browser Channel] Permission granted for system alerts!');
        // Fire real browser notification to celebrate!
        new Notification('🚀 Smart Notifications Activated!', {
          body: 'You will now receive high-fidelity copilot warnings and scheduling briefs directly on your flight deck.',
          icon: '/favicon.ico'
        });
      } else {
        addConsoleLog('❌ [Browser Channel] Notification permission denied.');
      }
    }
  };

  // Add a message to the simulation log feed
  const addConsoleLog = (text: string) => {
    setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`].slice(-10));
    setShowConsole(true);
  };

  // Save Settings helper directly to Firestore
  const saveSettings = async (updatedSettings: NotificationSettings) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, 'notificationSettings', currentUser.uid);
      await setDoc(docRef, updatedSettings);
    } catch (err) {
      console.error('Failed to save notification settings directly to Firestore:', err);
    }
  };

  // Toggle specific alert channel
  const handleToggleChannel = async (key: 'enableBrowser' | 'enableEmail' | 'enableFCM') => {
    if (key === 'enableBrowser' && browserPermission !== 'granted') {
      await handleRequestPermission();
      return;
    }
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await saveSettings(updated);
    addConsoleLog(`⚙️ [Config] Toggled ${key === 'enableBrowser' ? 'Browser' : key === 'enableEmail' ? 'Email ready' : 'FCM Push ready'} channel to ${updated[key] ? 'ENABLED' : 'DISABLED'}`);
  };

  // Toggle alert preference subscription
  const handleToggleAlertType = async (key: keyof NotificationSettings['alertTypes']) => {
    const updated = {
      ...settings,
      alertTypes: {
        ...settings.alertTypes,
        [key]: !settings.alertTypes[key]
      }
    };
    setSettings(updated);
    await saveSettings(updated);
    addConsoleLog(`⚙️ [Config] Alert preference "${key}" updated.`);
  };

  // Submit profile email edit
  const handleUpdateEmail = async (val: string) => {
    const updated = { ...settings, emailAddress: val };
    setSettings(updated);
    await saveSettings(updated);
  };

  // Submit FCM token edit
  const handleUpdateFCMToken = async (val: string) => {
    const updated = { ...settings, fcmToken: val };
    setSettings(updated);
    await saveSettings(updated);
  };

  // Sync notifications to Firestore helper
  const syncNotificationsToFirestore = async (userId: string, updatedNotifications: SmartNotification[]) => {
    try {
      const docRef = doc(db, 'notifications', userId);
      await setDoc(docRef, { notifications: updatedNotifications });
    } catch (err) {
      console.error('Failed to sync notifications to Firestore:', err);
    }
  };

  // Trigger AI Smart Generator endpoint
  const handleGenerateAI = async (mode: 'morning_brief' | 'evening_summary' | 'check_warnings') => {
    if (!currentUser) return;
    setLoadingAction(mode);
    addConsoleLog(`🤖 [Gemini Co-Pilot] Triggering AI generation: ${mode.toUpperCase()}...`);
    
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/notifications/generate-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mode, tasks, timeBlocks })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.notifications && data.notifications.length > 0) {
          // Save the newly generated notifications directly to Firestore
          const updated = [...data.notifications, ...notifications];
          setNotifications(updated);
          await syncNotificationsToFirestore(currentUser.uid, updated);
          
          data.notifications.forEach((notif: SmartNotification) => {
            addConsoleLog(`✨ [Success] Generated: "${notif.title}"`);
            
            // Fire native browser notification if allowed and toggled
            if (settings.enableBrowser && browserPermission === 'granted') {
              new Notification(notif.title, {
                body: notif.message,
                icon: '/favicon.ico'
              });
            }
          });
        } else {
          addConsoleLog('ℹ️ [Diagnostics] Workload looks perfect! No safety warnings or overload alerts detected.');
        }
      }
    } catch (err) {
      console.error('Failed to trigger notification generation:', err);
      addConsoleLog('❌ [Error] Failed to communicate with Gemini generator endpoint.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    if (!currentUser) return;
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    await syncNotificationsToFirestore(currentUser.uid, updated);
  };

  // Delete notification
  const handleDeleteNotification = async (id: string) => {
    if (!currentUser) return;
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    addConsoleLog('🗑️ [System Core] Erased notification from flight logs');
    await syncNotificationsToFirestore(currentUser.uid, updated);
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (!currentUser) return;
    setNotifications([]);
    addConsoleLog('🗑️ [System Core] Complete flight notification logs cleared.');
    await syncNotificationsToFirestore(currentUser.uid, []);
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    addConsoleLog('✔️ [System Core] Marked all inbox entries as read.');
    await syncNotificationsToFirestore(currentUser.uid, updated);
  };

  // Send simulation test dispatch
  const handleSendTest = async (notif: SmartNotification) => {
    if (!currentUser) return;
    addConsoleLog(`🚀 [Dispatch] Initializing real-time simulation send payload...`);
    
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/notifications/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notification: notif,
          settings: settings
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.logs) {
          data.logs.forEach((log: string) => addConsoleLog(log));
        }
        
        // Celebrate with a native browser notice if enabled
        if (settings.enableBrowser && browserPermission === 'granted') {
          new Notification(`[TEST] ${notif.title}`, {
            body: notif.message,
            icon: '/favicon.ico'
          });
        }
      }
    } catch (err) {
      console.error('Failed to send simulation test:', err);
      addConsoleLog('❌ [Dispatch Error] Push routing error.');
    }
  };

  // Filter notifications based on tab
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'alert') return n.type === 'deadline';
    if (filter === 'brief') return n.type === 'brief' || n.type === 'summary';
    if (filter === 'warning') return n.type === 'overload' || n.type === 'burnout' || n.type === 'ai_warning';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-8 font-sans pb-12">
      
      {/* Header */}
      <div className="border-b border-zinc-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-400" />
            Control Tower Notifications
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Stay on schedule with automated deadline warnings, AI burnout checks, and browser push syncing.
          </p>
        </div>

        {unreadCount > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-semibold px-3 py-1.5 rounded-xl">
            {unreadCount} Unread Logs Pending Action
          </div>
        )}
      </div>

      {/* Main Grid Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Col: Inbox Feed */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filters & Actions bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 border border-zinc-800 p-3 rounded-2xl">
            {/* Filter buttons */}
            <div className="flex bg-zinc-950 p-1 rounded-xl">
              <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                All Logs
              </button>
              <button 
                onClick={() => setFilter('alert')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filter === 'alert' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Deadlines
              </button>
              <button 
                onClick={() => setFilter('brief')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filter === 'brief' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Briefings
              </button>
              <button 
                onClick={() => setFilter('warning')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filter === 'warning' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Warnings
              </button>
            </div>

            {/* Mass actions */}
            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllRead}
                  className="px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-all"
                >
                  Mark All Read
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/10 border border-rose-950/20 rounded-lg transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Logs
                </button>
              </div>
            )}
          </div>

          {/* Inbox List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16 border border-zinc-800/80 rounded-3xl bg-zinc-950/10 space-y-4">
                <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5 text-zinc-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-white text-sm">Clear Flight Logs</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    No matching notifications found. Use the Copilot Smart Trigger panel to generate fresh briefings or safety diagnostics.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {filteredNotifications.map((notif) => {
                    // Determine styling based on severity
                    let borderClass = 'border-zinc-800 bg-zinc-900/10 hover:border-zinc-700';
                    let iconBg = 'bg-zinc-800/50 text-zinc-400';
                    let IconComponent = Bell;

                    if (notif.severity === 'warning') {
                      borderClass = 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/30';
                      iconBg = 'bg-amber-500/10 text-amber-400';
                      IconComponent = AlertTriangle;
                    } else if (notif.severity === 'critical') {
                      borderClass = 'border-rose-500/20 bg-rose-500/5 hover:border-rose-500/30';
                      iconBg = 'bg-rose-500/10 text-rose-400';
                      IconComponent = Flame;
                    } else if (notif.type === 'brief') {
                      iconBg = 'bg-indigo-500/10 text-indigo-400';
                      IconComponent = Sun;
                    } else if (notif.type === 'summary') {
                      iconBg = 'bg-purple-500/10 text-purple-400';
                      IconComponent = Moon;
                    }

                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-4 rounded-2xl border transition-all ${borderClass} relative flex gap-4 items-start ${
                          notif.read ? 'opacity-70' : ''
                        }`}
                      >
                        {/* Unread Indicator Dot */}
                        {!notif.read && (
                          <span className="absolute top-4 left-4 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                          </span>
                        )}

                        {/* Icon Container */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${!notif.read ? 'mt-2' : ''}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>

                        {/* Content details */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-4">
                            <h4 className="text-sm font-bold text-white leading-snug">{notif.title}</h4>
                            <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                              {new Date(notif.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <p className="text-xs text-zinc-300 leading-relaxed">{notif.message}</p>

                          <div className="flex flex-wrap items-center gap-3 pt-2">
                            {/* Target Navigation button */}
                            {notif.actionUrl && (
                              <button
                                onClick={() => {
                                  handleMarkAsRead(notif.id);
                                  onNavigate(notif.actionUrl as ActivePage);
                                }}
                                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                              >
                                View Operational Sector <ExternalLink className="w-3 h-3" />
                              </button>
                            )}

                            {/* Mark as read */}
                            {!notif.read && (
                              <button
                                onClick={() => handleMarkAsRead(notif.id)}
                                className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-200"
                              >
                                Mark as Read
                              </button>
                            )}

                            {/* Simulation Test Trigger button */}
                            <button
                              onClick={() => handleSendTest(notif)}
                              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 ml-auto"
                              title="Trigger Email dispatch, Native Browser notifications and FCM Token route simulations!"
                            >
                              <Send className="w-3 h-3" />
                              Test Dispatch
                            </button>
                          </div>
                        </div>

                        {/* Dismiss Button */}
                        <button
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800/40 shrink-0 self-start"
                        >
                          <X className="w-4 h-4" />
                        </button>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Interactive Simulation Console Logs Overlay */}
          {showConsole && (
            <div className="glass-panel border-white/5 bg-black/40 rounded-2xl p-4 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
              
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  Live Notification Dispatch Console
                </span>
                <button 
                  onClick={() => setShowConsole(false)} 
                  className="text-zinc-500 hover:text-zinc-300 text-xs font-mono font-bold"
                >
                  [HIDE]
                </button>
              </div>

              <div className="space-y-1.5 font-mono text-[10px] text-zinc-300 bg-zinc-950 p-3 rounded-xl border border-zinc-900 h-32 overflow-y-auto">
                {consoleLogs.length === 0 ? (
                  <span className="text-zinc-600 italic">No logs on route. Trigger a simulated test send above.</span>
                ) : (
                  consoleLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed truncate">
                      <span className="text-emerald-500 font-bold">&gt;</span> {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Col: Preferences & Trigger Control Deck */}
        <div className="space-y-6">
          
          {/* Smart Trigger Panel */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 bg-gradient-to-br from-zinc-900/60 to-indigo-950/10 space-y-4">
            <div>
              <h3 className="font-display font-semibold text-sm text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Copilot Smart Triggers
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Employ advanced machine learning diagnostics to synthesize tactical briefings.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleGenerateAI('morning_brief')}
                disabled={loadingAction !== null}
                className="w-full p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-between group"
              >
                <span className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-300" />
                  Synthesize Morning Brief
                </span>
                {loadingAction === 'morning_brief' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span className="bg-white/10 text-[9px] px-1.5 py-0.5 rounded group-hover:bg-white/20 font-mono">GENERATE</span>
                )}
              </button>

              <button
                onClick={() => handleGenerateAI('evening_summary')}
                disabled={loadingAction !== null}
                className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-between group border border-zinc-700/50"
              >
                <span className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-purple-300" />
                  Request Evening Summary
                </span>
                {loadingAction === 'evening_summary' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span className="bg-white/5 text-[9px] px-1.5 py-0.5 rounded group-hover:bg-white/10 font-mono">GENERATE</span>
                )}
              </button>

              <button
                onClick={() => handleGenerateAI('check_warnings')}
                disabled={loadingAction !== null}
                className="w-full p-3 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-between group border border-amber-500/20"
              >
                <span className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                  Run Safety Diagnostic
                </span>
                {loadingAction === 'check_warnings' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span className="bg-amber-500/10 text-amber-400 text-[9px] px-1.5 py-0.5 rounded border border-amber-500/10 font-mono">DIAGNOSE</span>
                )}
              </button>
            </div>
          </div>

          {/* Alert Preferences Panel */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 bg-zinc-900/40 space-y-6">
            
            {/* Delivery Channels */}
            <div className="space-y-4">
              <div>
                <h3 className="font-display font-semibold text-sm text-white flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-zinc-400" />
                  Dispatch Channels
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Configure active endpoints for push routing and email integrations.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                
                {/* Browser channel */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-900">
                  <div className="flex items-center gap-2.5">
                    <Chrome className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="block text-xs font-semibold text-white">Browser Push</span>
                      <span className="block text-[9px] text-zinc-500 uppercase tracking-wide font-mono">
                        Permission: {browserPermission.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleChannel('enableBrowser')}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${
                      settings.enableBrowser ? 'bg-indigo-600' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ${
                      settings.enableBrowser ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Email integration channel */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="block text-xs font-semibold text-white">Email Delivery Ready</span>
                        <span className="block text-[9px] text-zinc-500 font-mono">Nodemailer / SendGrid template ready</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleChannel('enableEmail')}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${
                        settings.enableEmail ? 'bg-indigo-600' : 'bg-zinc-800'
                      }`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ${
                        settings.enableEmail ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                  
                  {settings.enableEmail && (
                    <input
                      type="email"
                      placeholder="Enter target dispatch email"
                      value={settings.emailAddress || ''}
                      onChange={(e) => handleUpdateEmail(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  )}
                </div>

                {/* FCM Cloud Messaging channel */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Cpu className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="block text-xs font-semibold text-white">FCM Registration Token</span>
                        <span className="block text-[9px] text-zinc-500 font-mono">Web push cloud synced</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleChannel('enableFCM')}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${
                        settings.enableFCM ? 'bg-indigo-600' : 'bg-zinc-800'
                      }`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ${
                        settings.enableFCM ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                  
                  {settings.enableFCM && (
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="FCM Registration Token"
                        value={settings.fcmToken || ''}
                        onChange={(e) => handleUpdateFCMToken(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      <span className="text-[9px] text-zinc-500 block">Firebase Cloud Messaging endpoint configured in rules</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Alert Preferences */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Alert Subscriptions</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">Define which categories trigger pilot interruptions.</p>
              </div>

              <div className="space-y-2 font-mono">
                {Object.keys(settings.alertTypes).map((key) => {
                  const alertKey = key as keyof NotificationSettings['alertTypes'];
                  
                  // Human-readable labels
                  const labelMap: { [key: string]: string } = {
                    deadline: '⏳ Deadline Reminders',
                    ai_warning: '🤖 Copilot Advisories',
                    brief: '☀️ Morning Briefings',
                    summary: '🌙 Evening Summaries',
                    overload: '⚠️ Schedule Overload Alerts',
                    burnout: '🚨 Fatigue/Burnout Limits'
                  };

                  return (
                    <label 
                      key={key} 
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/40 hover:bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 cursor-pointer transition-all"
                    >
                      <span className="font-semibold">{labelMap[key] || key}</span>
                      <input
                        type="checkbox"
                        checked={settings.alertTypes[alertKey] || false}
                        onChange={() => handleToggleAlertType(alertKey)}
                        className="rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-0"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
