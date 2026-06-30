/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { authenticateFirebaseToken } from './server/middleware/auth';
import { getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Load config dynamically to support dynamic project ID and custom databases
let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('[Server] Loaded firebase configuration successfully.');
  }
} catch (err) {
  console.error('[Server] Failed to parse firebase-applet-config.json', err);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Standard Express body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // In-memory fallback database for development sandbox
  const inMemoryTasks = new Map<string, any[]>();
  const inMemoryProfiles = new Map<string, any>();

  // Helper to save user profile to either Firestore or in-memory
  async function saveProfileForUser(uid: string, profile: any) {
    try {
      const apps = getApps();
      if (apps.length > 0) {
        const databaseId = firebaseConfig?.firestoreDatabaseId;
        const db = databaseId ? getFirestore(apps[0], databaseId) : getFirestore();
        await db.collection('users').doc(uid).set(profile);
        return;
      }
    } catch (error) {
      console.warn('Could not save user profile to Firestore, using in-memory backup', error);
    }
    inMemoryProfiles.set(uid, profile);
  }

  // Helper to retrieve user profile
  async function getProfileForUser(uid: string): Promise<any | null> {
    try {
      const apps = getApps();
      if (apps.length > 0) {
        const databaseId = firebaseConfig?.firestoreDatabaseId;
        const db = databaseId ? getFirestore(apps[0], databaseId) : getFirestore();
        const docSnap = await db.collection('users').doc(uid).get();
        if (docSnap.exists) {
          return docSnap.data() || null;
        }
      }
    } catch (error) {
      console.warn('Could not read user profile from Firestore, using in-memory backup', error);
    }
    return inMemoryProfiles.get(uid) || null;
  }

  // Helper to save tasks to either Firestore or in-memory
  async function saveTasksForUser(uid: string, tasks: any[]) {
    try {
      const apps = getApps();
      if (apps.length > 0) {
        const databaseId = firebaseConfig?.firestoreDatabaseId;
        const db = databaseId ? getFirestore(apps[0], databaseId) : getFirestore();
        await db.collection('tasks').doc(uid).set({ tasks });
        return;
      }
    } catch (error) {
      console.warn('Could not save to Firestore, using in-memory backup', error);
    }
    inMemoryTasks.set(uid, tasks);
  }

  // GET helper to retrieve tasks array
  async function getTasksForUser(uid: string): Promise<any[]> {
    try {
      const apps = getApps();
      if (apps.length > 0) {
        const databaseId = firebaseConfig?.firestoreDatabaseId;
        const db = databaseId ? getFirestore(apps[0], databaseId) : getFirestore();
        const docSnap = await db.collection('tasks').doc(uid).get();
        if (docSnap.exists) {
          return docSnap.data()?.tasks || [];
        }
      }
    } catch (error) {
      console.warn('Could not read from Firestore, using in-memory backup', error);
    }
    if (!inMemoryTasks.has(uid)) {
      return [];
    }
    return inMemoryTasks.get(uid) || [];
  }

  // Notification fallback maps
  const inMemoryNotifications = new Map<string, any[]>();
  const inMemoryNotificationSettings = new Map<string, any>();

  // Helpers to get and save user notifications
  async function getNotificationsForUser(uid: string): Promise<any[]> {
    try {
      const apps = getApps();
      if (apps.length > 0) {
        const databaseId = firebaseConfig?.firestoreDatabaseId;
        const db = databaseId ? getFirestore(apps[0], databaseId) : getFirestore();
        const docSnap = await db.collection('notifications').doc(uid).get();
        if (docSnap.exists) {
          return docSnap.data()?.notifications || [];
        }
      }
    } catch (error) {
      console.warn('Could not read notifications from Firestore, using in-memory backup', error);
    }
    return inMemoryNotifications.get(uid) || [];
  }

  async function saveNotificationsForUser(uid: string, notifications: any[]) {
    try {
      const apps = getApps();
      if (apps.length > 0) {
        const databaseId = firebaseConfig?.firestoreDatabaseId;
        const db = databaseId ? getFirestore(apps[0], databaseId) : getFirestore();
        await db.collection('notifications').doc(uid).set({ notifications });
        return;
      }
    } catch (error) {
      console.warn('Could not save notifications to Firestore, using in-memory backup', error);
    }
    inMemoryNotifications.set(uid, notifications);
  }

  // Helpers to get and save user notification settings
  async function getNotificationSettingsForUser(uid: string): Promise<any> {
    try {
      const apps = getApps();
      if (apps.length > 0) {
        const databaseId = firebaseConfig?.firestoreDatabaseId;
        const db = databaseId ? getFirestore(apps[0], databaseId) : getFirestore();
        const docSnap = await db.collection('notificationSettings').doc(uid).get();
        if (docSnap.exists) {
          return docSnap.data() || null;
        }
      }
    } catch (error) {
      console.warn('Could not read notificationSettings from Firestore, using in-memory backup', error);
    }
    return inMemoryNotificationSettings.get(uid) || {
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
      }
    };
  }

  async function saveNotificationSettingsForUser(uid: string, settings: any) {
    try {
      const apps = getApps();
      if (apps.length > 0) {
        const databaseId = firebaseConfig?.firestoreDatabaseId;
        const db = databaseId ? getFirestore(apps[0], databaseId) : getFirestore();
        await db.collection('notificationSettings').doc(uid).set(settings);
        return;
      }
    } catch (error) {
      console.warn('Could not save notificationSettings to Firestore, using in-memory backup', error);
    }
    inMemoryNotificationSettings.set(uid, settings);
  }

  // API Routes (must go BEFORE Vite middleware)
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'DeadlinePilot Authentication Control Tower'
    });
  });

  // Example of an authenticated, protected route using our backend middleware
  app.get('/api/protected/profile', authenticateFirebaseToken, (req, res) => {
    res.json({
      message: 'Access granted by control tower. Authenticated successfully.',
      user: req.user
    });
  });

  // User Profile API Endpoints
  app.get('/api/profile', authenticateFirebaseToken, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const profile = await getProfileForUser(uid);
      res.json({ profile });
    } catch (error) {
      console.error('Error in GET /api/profile:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/profile', authenticateFirebaseToken, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    try {
      await saveProfileForUser(uid, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error in POST /api/profile:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // --- Smart Notification API Endpoints ---
  app.get('/api/notifications', authenticateFirebaseToken, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const notifications = await getNotificationsForUser(uid);
      res.json({ notifications });
    } catch (error) {
      console.error('Error in GET /api/notifications:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/notifications', authenticateFirebaseToken, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { notifications } = req.body;
      await saveNotificationsForUser(uid, notifications || []);
      res.json({ success: true });
    } catch (error) {
      console.error('Error in POST /api/notifications:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/api/notifications/settings', authenticateFirebaseToken, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const settings = await getNotificationSettingsForUser(uid);
      res.json({ settings });
    } catch (error) {
      console.error('Error in GET /api/notifications/settings:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/notifications/settings', authenticateFirebaseToken, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    try {
      await saveNotificationSettingsForUser(uid, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error in POST /api/notifications/settings:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // AI Smart Generation: generates alerts, briefs or warning diagnostics using Gemini (or fallback)
  app.post('/api/notifications/generate-ai', authenticateFirebaseToken, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const { mode, tasks, timeBlocks } = req.body;

    const mockNotificationsMap = {
      morning_brief: {
        id: `brief-${Date.now()}`,
        type: 'brief',
        title: '☀️ Morning Briefing: Optimal Flight Plan',
        message: 'You have 3 critical checklist items on deck today. High concentration window forecast from 09:30 to 12:00. Eat the frog early!',
        timestamp: new Date().toISOString(),
        read: false,
        severity: 'info',
        actionUrl: '/planner',
        channels: ['system', 'browser']
      },
      evening_summary: {
        id: `summary-${Date.now()}`,
        type: 'summary',
        title: '🌙 Operational Flight Debrief',
        message: 'High productivity day completed! You finalized 4 major milestones, extending your streak to 6 days. Operational confidence score stands at 95%.',
        timestamp: new Date().toISOString(),
        read: false,
        severity: 'info',
        actionUrl: '/analytics',
        channels: ['system', 'email']
      },
      check_warnings: [
        {
          id: `warn-overload-${Date.now()}`,
          type: 'overload',
          title: '⚠️ Heavy Payload: Schedule Overload Risk',
          message: 'Estimated workload for today exceeds 9.5 hours. To prevent flight fatigue, we suggest off-loading or shifting secondary tasks.',
          timestamp: new Date().toISOString(),
          read: false,
          severity: 'warning',
          actionUrl: '/tasks',
          channels: ['system', 'browser']
        },
        {
          id: `warn-burnout-${Date.now()}`,
          type: 'burnout',
          title: '🚨 Heat Threshold Warning: Burnout Danger',
          message: 'High intensity tasks consecutive focus logged without corresponding breaks. Take an immediate offline sensor recess of 15 minutes.',
          timestamp: new Date().toISOString(),
          read: false,
          severity: 'critical',
          actionUrl: '/planner',
          channels: ['system', 'browser', 'fcm']
        }
      ]
    };

    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI, Type } = await import('@google/genai');
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const systemContext = `
          You are the Advanced Co-Pilot for a smart task management and focus interval logging application.
          Analyze the user's workload metrics to generate alerts, warning briefs, or scheduling logs.
          Tasks list: ${JSON.stringify((tasks || []).map((t: any) => ({ title: t.title, deadline: t.deadline, priority: t.priority, status: t.status, estimatedHours: t.estimatedHours })))}
          Timeblocks: ${JSON.stringify((timeBlocks || []).map((b: any) => ({ title: b.title, startTime: b.startTime, endTime: b.endTime, completed: b.completed })))}
        `;

        if (mode === 'morning_brief') {
          const prompt = `${systemContext}\nGenerate a highly polished, short, encouraging "Morning Brief" (under 30 words) emphasizing key high-priority items and advising on concentration periods. Use professional, motivating tone. Return JSON format with title and message fields.`;
          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  message: { type: Type.STRING }
                },
                required: ["title", "message"]
              }
            }
          });
          const text = response.text || "{}";
          const data = JSON.parse(text);
          const briefNotif = {
            id: `brief-${Date.now()}`,
            type: 'brief',
            title: data.title || '☀️ Morning Briefing: Clear Flight Course',
            message: data.message || 'Ready for takeoff. Your focus sequence is organized and calibrated.',
            timestamp: new Date().toISOString(),
            read: false,
            severity: 'info',
            actionUrl: '/planner',
            channels: ['system', 'browser']
          };

          const existing = await getNotificationsForUser(uid);
          existing.unshift(briefNotif);
          await saveNotificationsForUser(uid, existing);
          return res.json({ notifications: [briefNotif] });

        } else if (mode === 'evening_summary') {
          const prompt = `${systemContext}\nGenerate a warm, professional, relaxing "Evening Summary" (under 30 words) acknowledging today's completed focus tasks and reminding the user to rest. Return JSON format with title and message fields.`;
          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  message: { type: Type.STRING }
                },
                required: ["title", "message"]
              }
            }
          });
          const text = response.text || "{}";
          const data = JSON.parse(text);
          const summaryNotif = {
            id: `summary-${Date.now()}`,
            type: 'summary',
            title: data.title || '🌙 Evening Flight Debriefing',
            message: data.message || 'Operational shift ended. High concentration maintained throughout. Unwind and recharge.',
            timestamp: new Date().toISOString(),
            read: false,
            severity: 'info',
            actionUrl: '/analytics',
            channels: ['system', 'email']
          };

          const existing = await getNotificationsForUser(uid);
          existing.unshift(summaryNotif);
          await saveNotificationsForUser(uid, existing);
          return res.json({ notifications: [summaryNotif] });

        } else if (mode === 'check_warnings') {
          const prompt = `${systemContext}\nEvaluate flight risk. Detect if the user has a schedule overload (sum of estimated hours of active tasks exceeds 8.5 hours), high burnout likelihood (continuous deep work intervals without breaks), or critical looming deadlines in the next 24 hours. Keep warning titles dramatic but concise and alert messages constructive (under 25 words).
          Return a JSON array of warning items. If no threats are detected, return an empty array.`;
          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING }, // "overload", "burnout", "deadline", "ai_warning"
                    title: { type: Type.STRING },
                    message: { type: Type.STRING },
                    severity: { type: Type.STRING } // "warning", "critical"
                  },
                  required: ["type", "title", "message", "severity"]
                }
              }
            }
          });
          const text = response.text || "[]";
          const items = JSON.parse(text);

          const newNotifs = (items || []).map((item: any, idx: number) => ({
            id: `warn-${Date.now()}-${idx}`,
            type: item.type || 'ai_warning',
            title: item.title || '⚠️ Copilot Warning Signal',
            message: item.message || 'Heavy schedule density detected.',
            timestamp: new Date().toISOString(),
            read: false,
            severity: item.severity || 'warning',
            actionUrl: item.type === 'burnout' ? '/planner' : '/tasks',
            channels: ['system', 'browser']
          }));

          if (newNotifs.length > 0) {
            const existing = await getNotificationsForUser(uid);
            existing.unshift(...newNotifs);
            await saveNotificationsForUser(uid, existing);
          }
          return res.json({ notifications: newNotifs });
        }
      } catch (err) {
        console.error('Gemini error inside notification generator:', err);
      }
    }

    // Default fallbacks if Gemini is not set up
    const existing = await getNotificationsForUser(uid);
    let fallbackNotifs: any[] = [];
    if (mode === 'morning_brief') {
      fallbackNotifs = [mockNotificationsMap.morning_brief];
    } else if (mode === 'evening_summary') {
      fallbackNotifs = [mockNotificationsMap.evening_summary];
    } else {
      fallbackNotifs = mockNotificationsMap.check_warnings;
    }
    existing.unshift(...fallbackNotifs);
    await saveNotificationsForUser(uid, existing);
    return res.json({ notifications: fallbackNotifs });
  });

  // Test send endpoint: simulates sending across channels (Email Ready, FCM Ready, Browser)
  app.post('/api/notifications/send-test', authenticateFirebaseToken, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const { notification, settings } = req.body;
    if (!notification) return res.status(400).json({ error: 'Notification body required' });

    const logs: string[] = [];
    logs.push(`[System Core] Dispatching notification ID ${notification.id}`);

    // Browser Notification Simulation
    if (settings?.enableBrowser) {
      logs.push(`[Browser Channel] Native push notification queued: "${notification.title}"`);
    }

    // Email Dispatch Ready
    if (settings?.enableEmail) {
      const emailTo = settings.emailAddress || req.user?.email || 'user@example.com';
      logs.push(`[Email Engine] Sent email alert to ${emailTo}. Ready with template: ${notification.title}`);
    }

    // FCM Push Ready
    if (settings?.enableFCM) {
      const fcmToken = settings.fcmToken || 'fcm_token_test_12345';
      logs.push(`[FCM Push Engine] Dispatched payload with FCM registration token: ${fcmToken.substring(0, 15)}...`);
    }

    res.json({
      success: true,
      logs,
      message: `Dispatched test notifications for: ${notification.title}`
    });
  });

  // Task API Endpoints
  app.get('/api/tasks', authenticateFirebaseToken, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    try {
      let tasks = await getTasksForUser(uid);
      if (tasks.length === 0 && !inMemoryTasks.has(uid)) {
        // Seed default tasks for demo/new user
        const seedTasks = [
          {
            id: "task-1",
            title: "Vibe2Ship Hackathon Project Submission",
            description: "Submit final source code, architecture diagram, and writeup for DeadlinePilot.",
            deadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
            priority: "critical",
            status: "in_progress",
            category: "Hackathon",
            estimatedHours: 5,
            actualHoursSpent: 3.5,
            createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
            aiSuggestedReason: "Due in 4 hours. You have 2 checklist items remaining. Action needed.",
            progressScore: 78,
            checklist: [
              { id: "c1-1", text: "Record 2-minute demo video", completed: false, timeEstimateMinutes: 45 },
              { id: "c1-2", text: "Write architecture documentation", completed: true, timeEstimateMinutes: 30 },
              { id: "c1-3", text: "Submit Devpost submission form", completed: false, timeEstimateMinutes: 20 },
              { id: "c1-4", text: "Configure production metadata.json", completed: true, timeEstimateMinutes: 10 }
            ],
            difficulty: "hard",
            energyRequired: "high",
            isRecurring: false,
            recurringInterval: "none"
          },
          {
            id: "task-2",
            title: "Google Cloud Run Deployment Setup",
            description: "Build Docker container and configure environment secrets on Google Cloud Console.",
            deadline: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
            priority: "high",
            status: "todo",
            category: "DevOps",
            estimatedHours: 3,
            actualHoursSpent: 0,
            createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
            aiSuggestedReason: "Recommended focal block today between 14:00 - 16:00 to avoid deployment-day stress.",
            progressScore: 40,
            checklist: [
              { id: "c2-1", text: "Create Dockerfile & test locally", completed: false, timeEstimateMinutes: 60 },
              { id: "c2-2", text: "Set up Cloud Build trigger", completed: false, timeEstimateMinutes: 45 },
              { id: "c2-3", text: "Provision secret keys in Secret Manager", completed: false, timeEstimateMinutes: 30 }
            ],
            difficulty: "medium",
            energyRequired: "high",
            isRecurring: false,
            recurringInterval: "none"
          }
        ];
        await saveTasksForUser(uid, seedTasks);
        tasks = seedTasks;
      }
      res.json({ tasks });
    } catch (error) {
      console.error('Error in GET /api/tasks:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/tasks', authenticateFirebaseToken, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const newTask = req.body;
    if (!newTask || !newTask.title) {
      return res.status(400).json({ error: 'Bad Request', message: 'Task title is required.' });
    }

    try {
      const tasks = await getTasksForUser(uid);
      const taskToAdd = {
        id: newTask.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: newTask.createdAt || new Date().toISOString(),
        actualHoursSpent: newTask.actualHoursSpent || 0,
        progressScore: newTask.progressScore || 0,
        checklist: newTask.checklist || [],
        difficulty: newTask.difficulty || 'medium',
        energyRequired: newTask.energyRequired || 'medium',
        isRecurring: newTask.isRecurring || false,
        recurringInterval: newTask.recurringInterval || 'none',
        ...newTask
      };
      tasks.push(taskToAdd);
      await saveTasksForUser(uid, tasks);
      res.status(201).json({ task: taskToAdd });
    } catch (error) {
      console.error('Error in POST /api/tasks:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.put('/api/tasks/:id', authenticateFirebaseToken, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    try {
      const tasks = await getTasksForUser(uid);
      const index = tasks.findIndex(t => t.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Not Found', message: 'Task not found.' });
      }

      tasks[index] = { ...tasks[index], ...req.body, id };
      await saveTasksForUser(uid, tasks);
      res.json({ task: tasks[index] });
    } catch (error) {
      console.error('Error in PUT /api/tasks/:id:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.delete('/api/tasks/:id', authenticateFirebaseToken, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    try {
      let tasks = await getTasksForUser(uid);
      const initialLength = tasks.length;
      tasks = tasks.filter(t => t.id !== id);
      if (tasks.length === initialLength) {
        return res.status(404).json({ error: 'Not Found', message: 'Task not found.' });
      }
      await saveTasksForUser(uid, tasks);
      res.json({ success: true, message: 'Task deleted successfully.' });
    } catch (error) {
      console.error('Error in DELETE /api/tasks/:id:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/tasks/bulk', authenticateFirebaseToken, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const { ids, action, value } = req.body;
    if (!ids || !Array.isArray(ids) || !action) {
      return res.status(400).json({ error: 'Bad Request', message: 'ids array and action string are required.' });
    }

    try {
      let tasks = await getTasksForUser(uid);
      if (action === 'delete') {
        tasks = tasks.filter(t => !ids.includes(t.id));
      } else if (action === 'complete') {
        tasks = tasks.map(t => ids.includes(t.id) ? { ...t, status: 'completed', progressScore: 100 } : t);
      } else if (action === 'update_priority') {
        tasks = tasks.map(t => ids.includes(t.id) ? { ...t, priority: value } : t);
      } else if (action === 'update_category') {
        tasks = tasks.map(t => ids.includes(t.id) ? { ...t, category: value } : t);
      } else {
        return res.status(400).json({ error: 'Bad Request', message: `Unknown bulk action: ${action}` });
      }

      await saveTasksForUser(uid, tasks);
      res.json({ success: true, count: ids.length });
    } catch (error) {
      console.error('Error in POST /api/tasks/bulk:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // AI Planner generation API
  app.post('/api/plan', authenticateFirebaseToken, async (req, res) => {
    const { tasks, workingHours, energyLevel, strategy, calendarBlocks } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Bad Request', message: 'tasks array is required.' });
    }

    const startHr = workingHours?.start || '09:00';
    const endHr = workingHours?.end || '17:00';
    const currentEnergy = energyLevel || 'medium';
    const activeStrategy = strategy || 'energy';

    // Build fallback data first so we have a completely safe contingency
    const getFallbackPlan = () => {
      // Prioritize tasks
      const sorted = [...tasks].sort((a, b) => {
        // Critical / High priority first
        const aPriority = a.priority === 'critical' ? 4 : a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1;
        const bPriority = b.priority === 'critical' ? 4 : b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1;
        if (bPriority !== aPriority) return bPriority - aPriority;
        // Earliest deadline first
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      // 1. Detect impossible schedules & predictions
      const impossibleScheduleAlerts = [];
      const deadlinePredictions = [];
      const splitTasks = [];
      const movedLowPriorityWork = [];
      
      const parsedStart = parseInt(startHr.split(':')[0]) || 9;
      const parsedEnd = parseInt(endHr.split(':')[0]) || 17;
      const totalAvailableHours = parsedEnd - parsedStart;
      let totalEstHours = 0;

      // Check for large tasks and split them
      tasks.forEach(t => {
        if (t.status !== 'completed' && t.estimatedHours > 4) {
          splitTasks.push({
            originalTaskId: t.id,
            originalTitle: t.title,
            reasonForSplit: `Estimated duration (${t.estimatedHours} hrs) exceeds standard focus sprint safety limits (4 hrs). Slicing into manageable chunks to prevent focus decay.`,
            subTasks: [
              { title: `${t.title} [Part 1: Research & Base Config]`, estimatedHours: Math.round(t.estimatedHours * 0.4 * 10) / 10, sequence: 1 },
              { title: `${t.title} [Part 2: Core Engineering & Implementation]`, estimatedHours: Math.round(t.estimatedHours * 0.4 * 10) / 10, sequence: 2 },
              { title: `${t.title} [Part 3: Testing & Polish Sync]`, estimatedHours: Math.round(t.estimatedHours * 0.2 * 10) / 10, sequence: 3 }
            ]
          });
        }
      });

      // Predict missed deadlines & filter today's tasks
      const todayTasks = [];
      const tomorrowTasks = [];

      sorted.forEach((task, idx) => {
        if (task.status === 'completed') return;
        
        totalEstHours += task.estimatedHours;
        const daysLeft = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 3600 * 24);
        
        let prediction = 'safe';
        let explanation = 'On track for scheduled completion.';
        if (daysLeft < 1 && task.estimatedHours > totalAvailableHours) {
          prediction = 'missed';
          explanation = `Milestone deadline is critical (${task.deadline}) but total remaining task workload (${task.estimatedHours} hrs) exceeds today's full shift capability (${totalAvailableHours} hrs).`;
        } else if (daysLeft < 2 && task.priority === 'critical') {
          prediction = 'at_risk';
          explanation = 'Tight timeline boundary relative to high-criticality task weight.';
        }

        deadlinePredictions.push({
          taskId: task.id,
          taskTitle: task.title,
          deadline: task.deadline,
          estimatedHoursLeft: task.estimatedHours,
          prediction,
          daysToDeadline: Math.max(0, Math.round(daysLeft * 10) / 10),
          explanation
        });

        // Simple allocation logic
        if (idx < 2) {
          todayTasks.push(task);
        } else if (task.priority === 'low') {
          movedLowPriorityWork.push({
            taskId: task.id,
            title: task.title,
            priority: task.priority,
            movedToDate: tomorrowStr,
            reason: "Shifted to tomorrow's queue to establish necessary focus buffers for today's high-criticality deadlines."
          });
          tomorrowTasks.push(task);
        } else {
          tomorrowTasks.push(task);
        }
      });

      // Burnout calculation
      let burnoutScore = 25;
      const stressors = [];
      if (totalEstHours > totalAvailableHours) {
        burnoutScore += 35;
        stressors.push(`Overbooked workload: Total estimated active hours (${totalEstHours} hrs) exceeds daily shift window (${totalAvailableHours} hrs).`);
      }
      if (currentEnergy === 'low') {
        burnoutScore += 20;
        stressors.push('High fatigue / low starting metabolic energy levels.');
      }
      if (tasks.filter(t => t.priority === 'critical').length > 1) {
        burnoutScore += 15;
        stressors.push('Multiple high-stress critical milestone deadlines overlapping.');
      }
      burnoutScore = Math.min(95, burnoutScore);
      let burnoutLevel = 'low';
      if (burnoutScore >= 75) burnoutLevel = 'critical';
      else if (burnoutScore >= 50) burnoutLevel = 'high';
      else if (burnoutScore >= 30) burnoutLevel = 'moderate';

      if (totalEstHours > totalAvailableHours) {
        impossibleScheduleAlerts.push({
          severity: 'critical',
          issue: 'Workload Exceeds Clock Resource Capacity',
          impact: `You are booked for ${totalEstHours} hours of tasks within a ${totalAvailableHours}-hour working shifts model. Missed deadlines are mathematically guaranteed without intervention.`,
          resolution: 'We have proactively moved low-priority backlog items to tomorrow and split larger sprints.'
        });
      }

      // Generate Today's Plan
      const todaysPlan = [];
      let currentHour = parsedStart;
      
      todaysPlan.push({
        startTime: `${String(currentHour).padStart(2, '0')}:00`,
        endTime: `${String(currentHour).padStart(2, '0')}:30`,
        type: "admin",
        title: "Strategic Standup & Blueprint Sync",
        description: `Map out focus corridors, configure targets, and calibrate parameters for the day using the ${activeStrategy.toUpperCase()} strategy.`
      });
      currentHour += 1;

      todayTasks.forEach(task => {
        if (currentHour < parsedEnd) {
          const nextHour = Math.min(parsedEnd, currentHour + 2);
          todaysPlan.push({
            startTime: `${String(currentHour).padStart(2, '0')}:00`,
            endTime: `${String(nextHour).padStart(2, '0')}:00`,
            type: "focus",
            title: `🔥 Focus Corridor: ${task.title}`,
            description: `Uninterrupted progress on high-priority task: ${task.description || 'Deliverable implementation'}.`,
            taskId: task.id
          });
          currentHour = nextHour;

          if (currentHour < parsedEnd) {
            todaysPlan.push({
              startTime: `${String(currentHour).padStart(2, '0')}:00`,
              endTime: `${String(currentHour).padStart(2, '0')}:30`,
              type: "break",
              title: "Cognitive Rejuvenation rest stop",
              description: "Complete a quick hydration cycle, practice deep breathing, and rest visual cortex."
            });
            currentHour += 1;
          }
        }
      });

      if (currentHour < parsedEnd) {
        todaysPlan.push({
          startTime: `${String(currentHour).padStart(2, '0')}:00`,
          endTime: `${String(parsedEnd).padStart(2, '0')}:00`,
          type: "rest",
          title: "End-of-Day Review & Handover Log",
          description: "Verify milestone progress, record completed sub-tasks, and hand over backlog slots."
        });
      }

      // Generate Tomorrow's Plan (overview)
      const tomorrowsPlan = [];
      let tomHour = parsedStart;
      tomorrowsPlan.push({
        startTime: `${String(tomHour).padStart(2, '0')}:00`,
        endTime: `${String(tomHour).padStart(2, '0')}:30`,
        type: "admin",
        title: "Morning Alignment Strategy",
        description: "Re-sync milestone statuses and adjust agenda priorities based on yesterday's remaining task parameters."
      });
      tomHour += 1;

      const nextTask = tomorrowTasks[0] || sorted[0];
      if (nextTask && tomHour < parsedEnd) {
        tomorrowsPlan.push({
          startTime: `${String(tomHour).padStart(2, '0')}:00`,
          endTime: `${String(tomHour + 2).padStart(2, '0')}:00`,
          type: "focus",
          title: `🔥 Staged Focus Block: ${nextTask.title}`,
          description: `Strategic morning focus block for milestone progression: ${nextTask.description || 'Primary implementation'}.`
        });
      }

      const recommendedBreaks = [
        { timeSlot: "After Focus Block 1", durationMinutes: 15, activity: "Sensory Recharge / Screens Off", benefit: "Reduces visual cortex fatigue and counters digital eye strain after deep concentration." },
        { timeSlot: "Mid-Shift Power Interval", durationMinutes: 20, activity: "Light Stretching & Walk", benefit: "Resets physical energy levels, stimulates metabolic circulation, and mitigates posture stress." }
      ];

      const copilotReasoning = [
        "Proactively flagged impossible schedule capacity to maintain sanity and protect delivery quality.",
        "Slices high-duration milestones into micro-checkpoints so you can maintain dynamic momentum without cognitive overwhelm.",
        "Pushed low-priority non-critical deliverables to tomorrow's window to clear a dedicated focus corridor for looming deadlines.",
        `Calibrated the schedule matching strategy to your starting energy profile (${currentEnergy.toUpperCase()}) and preferred mode (${activeStrategy.toUpperCase()}).`
      ];

      return {
        impossibleScheduleAlerts,
        splitTasks,
        deadlinePredictions,
        movedLowPriorityWork,
        burnoutEstimate: {
          percentage: burnoutScore,
          level: burnoutLevel,
          stressors,
          mitigationAction: burnoutScore > 50 ? "Recommend implementing Pomodoro constraints and off-loading secondary tasks." : "Workload levels are balanced. Keep focus intervals under 90 minutes."
        },
        todaysPlan,
        tomorrowsPlan,
        recommendedBreaks,
        copilotReasoning
      };
    };

    // If API key is available, run Gemini!
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI, Type } = await import('@google/genai');
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `
          You are an expert Proactive AI Planning Personal Assistant. Analyze the user's current workload, working hours, energy, strategy, and calendar.
          Formulate a complete plan.
          
          User Inputs & Constraints:
          - Working Shift Hours: ${startHr} to ${endHr}
          - User Starting Energy level right now: ${currentEnergy} (High, Medium, or Low)
          - Chosen Strategy: ${activeStrategy} (Strategy modes: 
             'pomodoro': frequent short breaks and 25-minute focus intervals; 
             'frog': Eat the Frog first, schedule the most critical/hardest task first in the morning; 
             'energy': map high energy required tasks to early sessions and low energy to later; 
             'marathon': long continuous focus corridors with deep breaks).
          - Existing Calendar Blocks to avoid: ${JSON.stringify(calendarBlocks || [])}
          
          Active Milestone Tasks Checklist Database:
          ${JSON.stringify(tasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            deadline: t.deadline,
            priority: t.priority,
            estimatedHours: t.estimatedHours,
            difficulty: t.difficulty,
            energyRequired: t.energyRequired,
            category: t.category,
            checklistSize: t.checklist?.length || 0
          })))}
          
          You MUST act as an advanced co-pilot that:
          1. Detects impossible schedules: Compare total estimated hours for the active tasks against shift duration. Also inspect overlaps. Raise severe alerts if total hours exceed shift limit.
          2. Splits large tasks: Identify ANY task with estimated hours > 4. Suggest slicing it into 3 sensible sub-tasks (Part 1, Part 2, Part 3) with fractional estimated hours.
          3. Predicts missed deadlines: Calculate days to deadline and predict whether the user is "safe", "at_risk" (due soon, high difficulty), or "missed" (due tomorrow but task takes longer than remaining shift time).
          4. Moves low priority work: If tasks exceed the available shift hours, explicitly shift low priority tasks to Tomorrow's backlog to safeguard today's critical items.
          5. Generates Today's Plan: Hourly timeline including admin/startup sync, focus sprints (mapping focus slots to specific tasks by id), breaks, and end-of-day reviews.
          6. Generates Tomorrow's Plan: Schedulable items for tomorrow so the user is proactively set up for success tomorrow.
          7. Recommends Breaks: Custom activities matching the strategy to reduce cognitive strain.
          8. Estimates Burnout Rate (0-100%): Estimate based on starting energy, overbooked hours, and deadline pressure. Detail specific stressors and mitigation actions.
          9. Explains every single AI decision in the copilotReasoning array.
          
          Format the response exactly as a JSON matching the requested responseSchema.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                impossibleScheduleAlerts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      severity: { type: Type.STRING }, // "info", "warning", "critical"
                      issue: { type: Type.STRING },
                      impact: { type: Type.STRING },
                      resolution: { type: Type.STRING }
                    },
                    required: ["severity", "issue", "impact", "resolution"]
                  }
                },
                splitTasks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      originalTaskId: { type: Type.STRING },
                      originalTitle: { type: Type.STRING },
                      reasonForSplit: { type: Type.STRING },
                      subTasks: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING },
                            estimatedHours: { type: Type.NUMBER },
                            sequence: { type: Type.INTEGER }
                          },
                          required: ["title", "estimatedHours", "sequence"]
                        }
                      }
                    },
                    required: ["originalTaskId", "originalTitle", "reasonForSplit", "subTasks"]
                  }
                },
                deadlinePredictions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      taskId: { type: Type.STRING },
                      taskTitle: { type: Type.STRING },
                      deadline: { type: Type.STRING },
                      estimatedHoursLeft: { type: Type.NUMBER },
                      prediction: { type: Type.STRING }, // "safe", "at_risk", "missed"
                      daysToDeadline: { type: Type.NUMBER },
                      explanation: { type: Type.STRING }
                    },
                    required: ["taskId", "taskTitle", "deadline", "estimatedHoursLeft", "prediction", "explanation"]
                  }
                },
                movedLowPriorityWork: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      taskId: { type: Type.STRING },
                      title: { type: Type.STRING },
                      priority: { type: Type.STRING },
                      movedToDate: { type: Type.STRING },
                      reason: { type: Type.STRING }
                    },
                    required: ["taskId", "title", "priority", "movedToDate", "reason"]
                  }
                },
                burnoutEstimate: {
                  type: Type.OBJECT,
                  properties: {
                    percentage: { type: Type.INTEGER },
                    level: { type: Type.STRING }, // "low", "moderate", "high", "critical"
                    stressors: { type: Type.ARRAY, items: { type: Type.STRING } },
                    mitigationAction: { type: Type.STRING }
                  },
                  required: ["percentage", "level", "stressors", "mitigationAction"]
                },
                todaysPlan: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      startTime: { type: Type.STRING },
                      endTime: { type: Type.STRING },
                      type: { type: Type.STRING }, // "focus", "break", "admin", "rest"
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      taskId: { type: Type.STRING }
                    },
                    required: ["startTime", "endTime", "type", "title", "description"]
                  }
                },
                tomorrowsPlan: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      startTime: { type: Type.STRING },
                      endTime: { type: Type.STRING },
                      type: { type: Type.STRING }, // "focus", "break", "admin", "rest"
                      title: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["startTime", "endTime", "type", "title", "description"]
                  }
                },
                recommendedBreaks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      timeSlot: { type: Type.STRING },
                      durationMinutes: { type: Type.INTEGER },
                      activity: { type: Type.STRING },
                      benefit: { type: Type.STRING }
                    },
                    required: ["timeSlot", "durationMinutes", "activity", "benefit"]
                  }
                },
                copilotReasoning: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: [
                "impossibleScheduleAlerts",
                "splitTasks",
                "deadlinePredictions",
                "movedLowPriorityWork",
                "burnoutEstimate",
                "todaysPlan",
                "tomorrowsPlan",
                "recommendedBreaks",
                "copilotReasoning"
              ]
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json({ plan: parsed, mode: 'gemini' });
        }
      } catch (err) {
        console.error('Gemini content generation failed, defaulting to tactical algorithm fallback:', err);
      }
    }

    // Return algorithm-based fallback
    return res.json({ plan: getFallbackPlan(), mode: 'fallback' });
  });

  // Vite static/middleware server mounting
  if (process.env.NODE_ENV !== 'production') {
    console.log('Mounting Vite dev server middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production static build files from /dist...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DeadlinePilot Server] Running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[DeadlinePilot Server] Startup failure:', err);
  process.exit(1);
});
