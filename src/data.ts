/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, TimeBlock, UserProfile, AIInsight, Message } from './types';

// Helper to calculate relative times for high-fidelity demo data
const getRelativeDateString = (daysOffset: number, hoursOffset: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(date.getHours() + hoursOffset);
  return date.toISOString();
};

export const DEFAULT_USER: UserProfile = {
  name: "Alex Rivera",
  email: "alex.rivera@vibe2ship.io",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
  timezone: "America/Los_Angeles",
  streakCount: 8,
  pilotPersona: "supportive",
  weeklyFocusGoal: 20
};

export const DEFAULT_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Vibe2Ship Hackathon Project Submission",
    description: "Submit final source code, architecture diagram, and writeup for DeadlinePilot.",
    deadline: getRelativeDateString(0, 4), // 4 hours from now - CRITICAL!
    priority: "critical",
    status: "in_progress",
    category: "Hackathon",
    estimatedHours: 5,
    actualHoursSpent: 3.5,
    createdAt: getRelativeDateString(-2),
    aiSuggestedReason: "Due in 4 hours. You have 2 checklist items remaining. Action needed.",
    progressScore: 78,
    checklist: [
      { id: "c1-1", text: "Record 2-minute demo video", completed: false, timeEstimateMinutes: 45 },
      { id: "c1-2", text: "Write architecture documentation", completed: true, timeEstimateMinutes: 30 },
      { id: "c1-3", text: "Submit Devpost submission form", completed: false, timeEstimateMinutes: 20 },
      { id: "c1-4", text: "Configure production metadata.json", completed: true, timeEstimateMinutes: 10 }
    ]
  },
  {
    id: "task-2",
    title: "Google Cloud Run Deployment Setup",
    description: "Build Docker container and configure environment secrets on Google Cloud Console.",
    deadline: getRelativeDateString(0, 18), // 18 hours from now - HIGH!
    priority: "high",
    status: "todo",
    category: "DevOps",
    estimatedHours: 3,
    actualHoursSpent: 0,
    createdAt: getRelativeDateString(-1),
    aiSuggestedReason: "Recommended focal block today between 14:00 - 16:00 to avoid deployment-day stress.",
    progressScore: 40,
    checklist: [
      { id: "c2-1", text: "Create Dockerfile & test locally", completed: false, timeEstimateMinutes: 60 },
      { id: "c2-2", text: "Set up Cloud Build trigger", completed: false, timeEstimateMinutes: 45 },
      { id: "c2-3", text: "Provision secret keys in Secret Manager", completed: false, timeEstimateMinutes: 30 }
    ]
  },
  {
    id: "task-3",
    title: "Refactor Tailwind Global Layout & Themes",
    description: "Ensure glassmorphism and custom animation effects are consistent across all landing sections.",
    deadline: getRelativeDateString(1, 6), // tomorrow
    priority: "medium",
    status: "completed",
    category: "Design",
    estimatedHours: 4,
    actualHoursSpent: 4.5,
    createdAt: getRelativeDateString(-3),
    aiSuggestedReason: "Completed 2 hours ahead of schedule! Streak preserved.",
    progressScore: 100,
    checklist: [
      { id: "c3-1", text: "Configure custom theme variables", completed: true, timeEstimateMinutes: 60 },
      { id: "c3-2", text: "Implement navigation layout animations", completed: true, timeEstimateMinutes: 120 },
      { id: "c3-3", text: "Verify responsive flexbox spacing", completed: true, timeEstimateMinutes: 90 }
    ]
  },
  {
    id: "task-4",
    title: "Write Pitch Deck Slides",
    description: "Draft narrative about the AI-powered deadline engine and business model.",
    deadline: getRelativeDateString(2, 12), // 2 days
    priority: "medium",
    status: "backlog",
    category: "Business",
    estimatedHours: 6,
    actualHoursSpent: 0,
    createdAt: getRelativeDateString(-1),
    progressScore: 15,
    checklist: [
      { id: "c4-1", text: "Problem slide & the Vibe2Ship challenge", completed: false, timeEstimateMinutes: 60 },
      { id: "c4-2", text: "Solution & core architecture mapping", completed: false, timeEstimateMinutes: 90 },
      { id: "c4-3", text: "Scale & market fit sizing", completed: false, timeEstimateMinutes: 60 }
    ]
  }
];

export const DEFAULT_TIME_BLOCKS: TimeBlock[] = [
  // Today's schedule blocks
  {
    id: "tb-1",
    taskId: "task-1",
    title: "🎥 Demo Video Recording Focus",
    startTime: "10:30",
    endTime: "11:30",
    date: new Date().toISOString().split('T')[0],
    category: "Hackathon",
    completed: false
  },
  {
    id: "tb-2",
    taskId: "task-1",
    title: "📝 Writeup & Submission Form Wrap-up",
    startTime: "12:30",
    endTime: "13:30",
    date: new Date().toISOString().split('T')[0],
    category: "Hackathon",
    completed: false
  },
  {
    id: "tb-3",
    taskId: "task-2",
    title: "⚡ Docker Setup & Secrets Config",
    startTime: "14:30",
    endTime: "16:30",
    date: new Date().toISOString().split('T')[0],
    category: "DevOps",
    completed: false
  }
];

export const DEFAULT_INSIGHTS: AIInsight[] = [
  {
    id: "ins-1",
    type: "danger",
    title: "Critical Deadline Warning",
    message: "'Vibe2Ship Hackathon Project Submission' is due in 4 hours. You have 2 unfinished tasks including the '2-minute demo video' which takes around 45 mins. Start now!",
    actionText: "Focus Mode",
    timestamp: "Just now"
  },
  {
    id: "ins-2",
    type: "warning",
    title: "Proactive Schedule Gap Detected",
    message: "Cloud Run Deployment Setup (due in 18 hrs) has zero allocated focus blocks. Let me generate a 1.5 hr block for you today at 14:30?",
    actionText: "Auto-Block Schedule",
    actionPayload: { taskId: "task-2", durationMinutes: 90 },
    timestamp: "10 mins ago"
  },
  {
    id: "ins-3",
    type: "success",
    title: "Streak Safe",
    message: "Tailwind Refactoring completed 2 hours early! You've maintained an 8-task on-time submission streak.",
    timestamp: "2 hours ago"
  }
];

export const DEFAULT_MESSAGES: Message[] = [
  {
    id: "m-1",
    sender: "assistant",
    text: "Hi Alex! I am your DeadlinePilot. I've analyzed your upcoming commitments and detected a critical deadline: your **Vibe2Ship Hackathon Project Submission** is due in **4 hours**! Let me help you cruise through. Should I structure an optimized micro-timeline for your remaining checklist items?",
    timestamp: "09:30 AM"
  },
  {
    id: "m-2",
    sender: "user",
    text: "Yes, please! Break it down so I don't feel overwhelmed.",
    timestamp: "09:32 AM"
  },
  {
    id: "m-3",
    sender: "assistant",
    text: "Perfect. I've engineered a high-focus **Deadline Survival Sequence**:\n\n1. **10:30 - 11:15 (45m):** 🎥 *Record 2-minute demo video* (Script first, record in one-take, don't over-edit).\n2. **11:15 - 11:30 (15m):** ☕ *Quick break & upload video rendering*.\n3. **12:30 - 12:50 (20m):** 📝 *Submit Devpost submission form* (Fill text fields with pre-written outline).\n\nI have automatically staged these focus blocks in your Pilot calendar. Click below to confirm them!",
    timestamp: "09:33 AM",
    suggestedAction: {
      type: "add_time_block",
      label: "Confirm survival calendar blocks",
      payload: { taskId: "task-1" }
    }
  }
];

// LocalStorage helpers
export const loadData = <T>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(`deadlinepilot_${key}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error loading localStorage key", key, e);
  }
  return defaultValue;
};

export const saveData = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(`deadlinepilot_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error("Error saving localStorage key", key, e);
  }
};
