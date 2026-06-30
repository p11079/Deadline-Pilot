/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Clock, 
  Target, 
  Sparkles, 
  ShieldAlert, 
  Zap, 
  Kanban, 
  Calendar, 
  BarChart2, 
  ChevronDown, 
  Check, 
  Star, 
  MessageSquare, 
  Bell, 
  Cpu, 
  Lock, 
  Flame, 
  Play, 
  Layers,
  HelpCircle,
  ThumbsUp,
  Award
} from 'lucide-react';
import { ActivePage } from '../types';

interface LandingPageProps {
  onNavigate: (page: ActivePage) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  // States for interactive demos
  const [activeTab, setActiveTab] = useState<'alerts' | 'schedule' | 'analytics'>('alerts');
  const [activeScreenshot, setActiveScreenshot] = useState<'board' | 'planner' | 'analytics' | 'notifications'>('board');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // FAQ Data
  const faqs = [
    {
      q: "What makes DeadlinePilot different from a standard calendar or todo list?",
      a: "Traditional tools are passive; they wait for you to fail before sending a 'due now' notice. DeadlinePilot is proactive. It breaks down complex items into bite-sized milestones, calculates your historical velocity, and auto-schedules deep work sessions on your calendar before you fall behind."
    },
    {
      q: "How does the AI compute the Safety Score?",
      a: "Our machine learning engine evaluates your historical completion rates, estimated task sizes, and schedule density. It runs daily simulations to generate a flight risk rating, warning you of potential burnout or missed deadlines days in advance."
    },
    {
      q: "Can I use DeadlinePilot with my existing Google Calendar?",
      a: "Yes! We support full two-way calendar sync. When a deadline gets critical, the AI automatically blocks out focus times directly on your external schedule based on your actual, real-time availability."
    },
    {
      q: "Is it really free?",
      a: "During our public beta and hackathon showcase, all premium features, including real-time Gemini copilot briefings, safety diagnostic engines, and notification dispatch networks, are 100% free with no credit card required."
    },
    {
      q: "What notification channels are supported?",
      a: "We support high-fidelity browser push notifications, detailed daily morning email summaries, and active Firebase Cloud Messaging (FCM) registration endpoints for instant cross-device delivery."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden relative font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[700px] h-[700px] bg-violet-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Decorative grid pattern with radial mask */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)]" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-zinc-950/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-white">DeadlinePilot</span>
              <span className="text-[10px] block font-mono text-indigo-400 font-semibold tracking-wider uppercase -mt-1">AI Copilot Core</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">AI Engine</a>
            <a href="#screenshots" className="hover:text-white transition-colors">Interface</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('login')}
              className="text-sm font-medium text-zinc-300 hover:text-white px-4 py-2 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => onNavigate('dashboard')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl border border-indigo-400/20 transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2"
            >
              Launch App <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs text-indigo-300 font-semibold mb-6 shadow-sm shadow-indigo-500/5">
            <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Introducing Version 2.4 - The Ultimate AI Deadline Deflector</span>
          </div>
        </motion.div>

        <motion.h1 
          className="font-display text-4xl sm:text-6xl lg:text-7.5xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.08] mb-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Don't just track deadlines.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">
            Copilot them to completion.
          </span>
        </motion.h1>

        <motion.p 
          className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          An active, predictive flight-deck for your productivity. DeadlinePilot monitors project urgency, automatically time-blocks calendars, generates hourly tactical briefings, and sends smart alerts to keep you on course.
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <button 
            onClick={() => onNavigate('dashboard')}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-8 py-4 rounded-xl border border-indigo-400/20 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2.5 group transition-all"
          >
            Start Project Copiloting
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => onNavigate('login')}
            className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-medium px-8 py-4 rounded-xl transition-all"
          >
            Explore Free Guest Deck
          </button>
        </motion.div>

        {/* Dynamic Interactive Sandbox Cockpit Demo Preview */}
        <motion.div
          className="border border-white/10 rounded-2xl max-w-4xl mx-auto p-6 text-left relative shadow-2xl bg-zinc-900/40 backdrop-blur-md overflow-hidden"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {/* Top colored accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-4 mb-6 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs text-zinc-500 font-mono ml-1.5">cockpit_pilot_simulator.sh</span>
            </div>
            
            {/* Interactive demo tabs */}
            <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-white/5 text-[10px] font-mono">
              <button 
                onClick={() => setActiveTab('alerts')}
                className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'alerts' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                1. CO-PILOT ALERT
              </button>
              <button 
                onClick={() => setActiveTab('schedule')}
                className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'schedule' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                2. FOCUS CALENDAR
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'analytics' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                3. HEALTH RATING
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'alerts' && (
              <motion.div
                key="alerts"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="grid md:grid-cols-5 gap-6"
              >
                <div className="md:col-span-2 border-r border-white/5 pr-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-rose-400 font-display font-semibold text-xs mb-3">
                      <ShieldAlert className="w-4 h-4" />
                      <span>DANGER AREA IDENTIFIED</span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">Hackathon Demo submission</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                      Critical milestone due in <span className="text-rose-400 font-semibold font-mono">3 hours, 45 minutes</span>. Focus block gap detected. High risk of incomplete status.
                    </p>
                  </div>

                  <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider font-mono">Emergency Directive</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      "Split the remaining 120-minute video asset creation into 3 micro-milestones immediately."
                    </p>
                  </div>
                </div>

                <div className="md:col-span-3 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-indigo-400 font-mono font-bold uppercase tracking-wider block mb-3">Suggested Rescue Sequence</span>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 bg-white/5 p-2.5 rounded-lg border border-white/5">
                        <div className="w-5 h-5 rounded-md bg-indigo-500/20 flex items-center justify-center font-mono text-[10px] text-indigo-300 font-bold shrink-0 mt-0.5">01</div>
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-200">10:30 AM - Record Demo Video (45m)</h4>
                          <p className="text-[10px] text-zinc-400">Do not retry slides. Capture single high-quality take.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-white/5 p-2.5 rounded-lg border border-white/5">
                        <div className="w-5 h-5 rounded-md bg-violet-500/20 flex items-center justify-center font-mono text-[10px] text-violet-300 font-bold shrink-0 mt-0.5">02</div>
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-200">11:15 AM - Setup DB Configurations (30m)</h4>
                          <p className="text-[10px] text-zinc-400">Run migrations, ensure security rules are deployed.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                    <span className="text-[11px] text-zinc-500">Predicted Success Rating: <span className="text-emerald-400 font-bold font-mono">+65%</span></span>
                    <button 
                      onClick={() => onNavigate('dashboard')}
                      className="bg-indigo-600/10 hover:bg-indigo-600 hover:text-white text-indigo-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-500/20 flex items-center gap-1.5 transition-all"
                    >
                      Lock In Sequence <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="grid md:grid-cols-5 gap-6"
              >
                <div className="md:col-span-2 border-r border-white/5 pr-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-indigo-400 font-display font-semibold text-xs mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>SMART TIMESHIFT BLOCKER</span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">Automated Time Blocking</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                      Co-pilot automatically analyzes your Google Calendar events, isolating and securing deep work sessions around your target milestones.
                    </p>
                  </div>

                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase block mb-1 font-mono">Sync Status</span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 font-mono">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Two-Way Google Cal Sync Online
                    </span>
                  </div>
                </div>

                <div className="md:col-span-3 space-y-2.5">
                  <span className="text-xs text-zinc-400 font-mono font-bold block">Current Focus Windows Securely Allocated</span>
                  <div className="border border-white/5 rounded-xl p-3 bg-zinc-950/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold block">09:00 AM - 11:30 AM</span>
                      <span className="text-xs text-white font-semibold">⚡ Deep Code Focus (No Meetings)</span>
                    </div>
                    <span className="text-[10px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono px-2 py-0.5 rounded-full font-bold">LOCKED IN</span>
                  </div>
                  <div className="border border-white/5 rounded-xl p-3 bg-zinc-950/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold block">02:30 PM - 04:00 PM</span>
                      <span className="text-xs text-zinc-300 font-medium">📋 Code Review & Refactoring</span>
                    </div>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 font-mono px-2 py-0.5 rounded-full">PENDING</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="grid md:grid-cols-5 gap-6"
              >
                <div className="md:col-span-2 border-r border-white/5 pr-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-fuchsia-400 font-display font-semibold text-xs mb-3">
                      <BarChart2 className="w-4 h-4" />
                      <span>FLIGHT ENGINE ANALYSIS</span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">Safety Confidence</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                      Our proprietary safety equation weighs task estimates against active available hours.
                    </p>
                  </div>

                  <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 p-3 rounded-xl">
                    <span className="text-[10px] font-mono text-fuchsia-300 block mb-1">SAFETY FORMULA</span>
                    <code className="text-[10px] font-mono text-zinc-300 block">Conf = (AvailableHrs - EstHrs) * VelocityRatio</code>
                  </div>
                </div>

                <div className="md:col-span-3 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-zinc-400 font-mono font-bold block mb-3">Workload Burnout & Safety Metrics</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-950/60 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] text-zinc-400 block font-mono">SAFETY RATING</span>
                        <span className="text-2xl font-bold text-emerald-400 font-mono">82%</span>
                        <span className="text-[9px] text-zinc-500 block mt-1">Excellent schedule density</span>
                      </div>
                      <div className="bg-zinc-950/60 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] text-zinc-400 block font-mono">ESTIMATED EFFORT</span>
                        <span className="text-2xl font-bold text-indigo-400 font-mono">14.5 Hrs</span>
                        <span className="text-[9px] text-zinc-500 block mt-1">Across 4 core objectives</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pt-4 mt-4 border-t border-white/5">
                    <span>Telemetry node: US-WEST-2</span>
                    <span className="text-indigo-400 font-bold">CALIBRATION COMPLETED</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </section>

      {/* Core features block */}
      <section id="features" className="py-24 px-6 bg-zinc-950 max-w-7xl mx-auto border-t border-white/5 relative">
        <div className="text-center mb-16">
          <span className="text-xs text-indigo-400 font-mono uppercase tracking-widest font-bold block mb-2">OPERATIONAL SUITE</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">The Active Survival Architecture</h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
            Passive task trackers rely on you checking your notes. DeadlinePilot actively watches your back with persistent alerts and dynamic scheduling.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all">
              <Kanban className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Linear Kanban System</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Highly responsive visual workspace built for agile shipping. Define core tasks, sub-checklists, and view dynamic safety diagnostics on each card.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-violet-500/20 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 group-hover:bg-violet-500/20 group-hover:scale-105 transition-all">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Automatic Calendar Blocks</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Prevent flight delays before they happen. Our auto-blocker books deep concentration intervals into your schedule, keeping you on course.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-fuchsia-500/20 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 mb-6 group-hover:bg-fuchsia-500/20 group-hover:scale-105 transition-all">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Real-Time Risk Analytics</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Computes clear velocity metrics and a dynamic safety indicator. Identifies workload conflicts and warns you before you hit fatigue limits.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-rose-500/20 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6 group-hover:bg-rose-500/20 group-hover:scale-105 transition-all">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">High-Fidelity Dispatches</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Configure active push routes with browser notifications, morning email briefings, and FCM registration keys for immediate alerts.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">AI Copilot Chat Engine</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Discuss milestones, split huge items, or get emergency work reorganizations instantly with your Gemini-powered assistant.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-amber-500/20 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Emergency Diagnostics</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              When work accumulates rapidly, run automated safety checks to get structured rescue suggestions and keep burnout at bay.
            </p>
          </div>

        </div>
      </section>

      {/* Interactive Walkthrough / How AI Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-zinc-900/30 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs text-indigo-400 font-mono uppercase tracking-widest font-bold block mb-2">AI WORKFLOW MECHANICS</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">How the Co-pilot Protects You</h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm">
              We translate passive deadlines into a defensive sequence of focus sessions and proactive warnings.
            </p>
          </div>

          {/* Graphical timeline grid */}
          <div className="grid md:grid-cols-4 gap-8 relative">
            
            {/* Horizontal line for desktop screen layout */}
            <div className="hidden md:block absolute top-[2.25rem] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-fuchsia-500/30 pointer-events-none z-0" />

            {/* Step 1 */}
            <div className="flex flex-col items-center text-center relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center font-mono font-bold text-indigo-300 shadow-md shadow-indigo-500/10">
                01
              </div>
              <h3 className="text-white font-bold text-sm">Ingest Objectives</h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed max-w-xs">
                Quickly add tasks or log calendar milestones. Set estimations and target deadlines effortlessly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-full bg-violet-500/20 border-2 border-violet-400 flex items-center justify-center font-mono font-bold text-violet-300 shadow-md shadow-violet-500/10">
                02
              </div>
              <h3 className="text-white font-bold text-sm">Compute Confidence</h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed max-w-xs">
                The AI runs multi-factor calculations, weighing workload densities to output your safety level.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-full bg-fuchsia-500/20 border-2 border-fuchsia-400 flex items-center justify-center font-mono font-bold text-fuchsia-300 shadow-md shadow-fuchsia-500/10">
                03
              </div>
              <h3 className="text-white font-bold text-sm">Block Calendar</h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed max-w-xs">
                Securely schedule focus intervals around looming deadlines, preventing external interruptions.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center font-mono font-bold text-rose-300 shadow-md shadow-rose-500/10">
                04
              </div>
              <h3 className="text-white font-bold text-sm">Dispatch Briefs</h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed max-w-xs">
                Receive proactive briefings, overload flags, and native alerts straight to your active device deck.
              </p>
            </div>

          </div>

          <div className="mt-16 bg-zinc-950/60 border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Zero Setup Latency</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Compatible with all major browser endpoints. Sign up and safeguard schedules instantly.</p>
              </div>
            </div>
            
            <button
              onClick={() => onNavigate('dashboard')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-3 rounded-xl border border-indigo-400/20 shrink-0 flex items-center gap-2 transition-all w-full md:w-auto justify-center"
            >
              Secure Your Timeline <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Screenshots Tabbed Walkthrough Section */}
      <section id="screenshots" className="py-24 px-6 bg-zinc-950 max-w-7xl mx-auto border-t border-white/5 relative">
        <div className="text-center mb-16">
          <span className="text-xs text-indigo-400 font-mono uppercase tracking-widest font-bold block mb-2">SYSTEM INTERFACES</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">Inside the Flight Deck</h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm">
            Toggle our specialized operational views to inspect the modular interfaces powering your timeline.
          </p>
        </div>

        {/* Screenshot tab list */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
          <button 
            onClick={() => setActiveScreenshot('board')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              activeScreenshot === 'board' 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            📋 Tactical Kanban Board
          </button>
          <button 
            onClick={() => setActiveScreenshot('planner')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              activeScreenshot === 'planner' 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            ⏱️ Focus Time-Blocker
          </button>
          <button 
            onClick={() => setActiveScreenshot('analytics')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              activeScreenshot === 'analytics' 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            📊 Safety Confidence Analytics
          </button>
          <button 
            onClick={() => setActiveScreenshot('notifications')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              activeScreenshot === 'notifications' 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            🔔 Control Tower Dispatch
          </button>
        </div>

        {/* Dynamic mockup frame */}
        <div className="border border-white/10 rounded-2xl bg-zinc-950 overflow-hidden shadow-2xl relative">
          
          {/* Header bar */}
          <div className="bg-zinc-900/60 px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="text-[10px] text-zinc-500 font-mono ml-2">https://app.deadlinepilot.ai/dashboard</span>
            </div>
            <div className="bg-zinc-950 border border-white/5 px-3 py-1 rounded text-[10px] text-zinc-400 font-mono">
              PREVIEW MODE
            </div>
          </div>

          <div className="p-6 md:p-8 min-h-[350px] bg-gradient-to-br from-zinc-950 via-zinc-900/20 to-zinc-950">
            <AnimatePresence mode="wait">
              
              {activeScreenshot === 'board' && (
                <motion.div
                  key="board-mock"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <div>
                      <h3 className="text-white font-bold text-sm">Linear Kanban Controller</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Drag-and-drop task items, configure sub-items, and track instant safety ratings.</p>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400">3 Tasks Logged</span>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    
                    {/* Column 1 */}
                    <div className="space-y-3 bg-zinc-900/40 border border-white/5 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-zinc-400 font-mono block uppercase">To Do (1)</span>
                      <div className="bg-zinc-950/80 p-3 rounded-lg border border-white/5 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono px-1.5 py-0.5 rounded">HIGH PRIORITY</span>
                          <span className="text-[9px] text-zinc-500 font-mono">1.5h</span>
                        </div>
                        <h4 className="text-xs font-bold text-white">Refactor Auth Middleware</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                          <Check className="w-3 h-3 text-indigo-400" />
                          <span>0/2 milestones done</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-3 bg-zinc-900/40 border border-white/5 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-indigo-400 font-mono block uppercase">In Progress (1)</span>
                      <div className="bg-zinc-950/80 p-3 rounded-lg border border-indigo-500/30 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono px-1.5 py-0.5 rounded">DUE SOON</span>
                          <span className="text-[9px] text-zinc-500 font-mono">3.0h</span>
                        </div>
                        <h4 className="text-xs font-bold text-white">Implement Smart Alerts API</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-indigo-400">
                          <Check className="w-3 h-3 text-indigo-400" />
                          <span className="text-indigo-300">3/4 milestones completed</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 3 */}
                    <div className="space-y-3 bg-zinc-900/40 border border-white/5 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-emerald-400 font-mono block uppercase">Completed (1)</span>
                      <div className="bg-zinc-950/80 p-3 rounded-lg border border-white/5 opacity-60 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] bg-zinc-800 text-zinc-400 font-mono px-1.5 py-0.5 rounded">DONE</span>
                          <span className="text-[9px] text-zinc-500 font-mono">1.0h</span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-300 line-through">Draft System Blueprints</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>All milestones done</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {activeScreenshot === 'planner' && (
                <motion.div
                  key="planner-mock"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <div>
                      <h3 className="text-white font-bold text-sm">Focus Block Scheduler</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Visually map out focus slots and sync directly to Google Calendar endpoints.</p>
                    </div>
                    <span className="text-[10px] font-mono text-violet-400 font-bold uppercase">Auto-Pilot Active</span>
                  </div>

                  <div className="bg-zinc-950 p-4 border border-white/5 rounded-xl space-y-3 font-mono text-xs">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">Google Calendar Secure Sessions</div>
                    <div className="flex items-center justify-between p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <div>
                          <span className="text-white font-semibold">⚡ Deep Focal Sequence #1</span>
                          <span className="text-[9px] text-zinc-400 block mt-0.5">09:30 AM - 12:00 PM</span>
                        </div>
                      </div>
                      <span className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-[10px] px-2 py-0.5 rounded-md font-bold">LOCKED IN</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        <div>
                          <span className="text-zinc-300">⚡ Code Assembly Segment #2</span>
                          <span className="text-[9px] text-zinc-500 block mt-0.5">02:00 PM - 03:30 PM</span>
                        </div>
                      </div>
                      <span className="text-zinc-500 text-[10px] px-2 py-0.5 rounded-md font-bold">AUTO-QUEUED</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeScreenshot === 'analytics' && (
                <motion.div
                  key="analytics-mock"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <div>
                      <h3 className="text-white font-bold text-sm">Predictive Safety Analytics</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Calculates comprehensive flight security scores from active workload statistics.</p>
                    </div>
                    <span className="text-xs text-emerald-400 font-mono font-bold">82% SAFETY CONFIDENCE</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 text-center space-y-1">
                      <span className="text-[10px] text-zinc-500 block">COMPLETION VELOCITY</span>
                      <span className="text-xl font-bold text-white">1.8h / task</span>
                      <p className="text-[9px] text-zinc-400 leading-snug">Average velocity calculated over prior 10 objectives.</p>
                    </div>
                    
                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 text-center space-y-1">
                      <span className="text-[10px] text-zinc-500 block">ESTIMATED WORKLOAD</span>
                      <span className="text-xl font-bold text-indigo-400">14.5 Hours</span>
                      <p className="text-[9px] text-zinc-400 leading-snug">Total estimated volume assigned for active cycles.</p>
                    </div>

                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 text-center space-y-1">
                      <span className="text-[10px] text-zinc-500 block">FATIGUE RISK</span>
                      <span className="text-xl font-bold text-rose-400">Low</span>
                      <p className="text-[9px] text-zinc-400 leading-snug">Sufficient focus break frequency registered.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeScreenshot === 'notifications' && (
                <motion.div
                  key="notifications-mock"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <div>
                      <h3 className="text-white font-bold text-sm">Control Tower Dispatch</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Saves notifications directly to user firestore and triggers browser, email, or FCM channels.</p>
                    </div>
                    <span className="text-[10px] font-mono text-rose-400 font-bold uppercase">1 Unread Log</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex justify-between items-start gap-4">
                      <div className="flex gap-2.5 items-start">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <h4 className="text-xs font-bold text-white leading-snug">🚨 Heavy Payload: Focus Block Deficit</h4>
                          <p className="text-[11px] text-zinc-300 mt-0.5">Est. effort exceeds available time by 3.5 hrs. Schedule a focal window on calendar immediately.</p>
                        </div>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-mono">10:44 AM</span>
                    </div>

                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl flex justify-between items-start gap-4">
                      <div className="flex gap-2.5 items-start">
                        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-white leading-snug">☀️ Morning Brief: Clear Flight Path Ahead</h4>
                          <p className="text-[11px] text-zinc-300 mt-0.5">You have 2 high-priority milestones to secure today. Optimal velocity period begins at 09:30 AM.</p>
                        </div>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-mono">08:00 AM</span>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6 bg-zinc-900/30 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs text-indigo-400 font-mono uppercase tracking-widest font-bold block mb-2">FLIGHT FEEDBACK</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">Praised by Rapid Shippers</h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm">
              See how developers, creators, and remote teams safeguard their ship milestones using our predictive AI copilot.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Testimonial 1 */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 relative hover:border-indigo-500/20 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed italic">
                  "During the 48-hour Vibe2Ship hackathon, we were drowning in unfinished features. DeadlinePilot flagged a critical deficit 4 hours before submission, auto-blocked code windows on Google Calendar, and guided us to our winning MVP. Absolutely lifesaving!"
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0">
                  AM
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Alex Mercer</h4>
                  <span className="text-[10px] text-zinc-500 block">Lead Hackathon Winner</span>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 relative hover:border-violet-500/20 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed italic">
                  "Standard calendar apps send passive reminders. DeadlinePilot is the first tool that actively calculates completion times. The morning email briefings give me a clear tactical overview of my day before Slack notifications take over my brain."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0">
                  SK
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Sarah Kincaid</h4>
                  <span className="text-[10px] text-zinc-500 block">Senior Frontend Engineer</span>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 relative hover:border-fuchsia-500/20 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed italic">
                  "We synchronized our team's core sprint milestones with DeadlinePilot. The automated safety calculations and fatigue warnings have drastically reduced burnout while increasing our shipping predictability. A masterpiece of software craft."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0">
                  DP
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">David Park</h4>
                  <span className="text-[10px] text-zinc-500 block">Product Lead @ HyperGrowth</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section (Free Plan) */}
      <section id="pricing" className="py-24 px-6 bg-zinc-950 max-w-7xl mx-auto border-t border-white/5 relative">
        <div className="text-center mb-16">
          <span className="text-xs text-indigo-400 font-mono uppercase tracking-widest font-bold block mb-2">PRICING TIERS</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">Simple, Zero-Cost Pilot Core</h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm">
            We are currently in open public beta for our hackathon showcase. Create your guest account and protect your goals for free.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto relative group">
          {/* Animated glow border */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition-all pointer-events-none" />
          
          <div className="relative glass-panel bg-zinc-900/60 border border-white/10 rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold font-mono px-2.5 py-1 rounded-full uppercase tracking-wider block mb-2 w-max">
                  Public Beta Tier
                </span>
                <h3 className="text-white font-bold text-2xl">Pilot Console</h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-white font-mono">$0</span>
                <span className="text-[10px] text-zinc-500 block">FOREVER IN BETA</span>
              </div>
            </div>

            <p className="text-zinc-400 text-xs leading-relaxed">
              Complete, server-synced access to our predictive scheduling algorithms, linear kanban metrics, and live dispatch networks.
            </p>

            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-xl border border-indigo-400/20 flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/10"
            >
              Get Free Flight Access <ArrowRight className="w-4.5 h-4.5" />
            </button>

            {/* Checklist of premium features */}
            <div className="space-y-3 pt-4 border-t border-white/5 text-xs text-zinc-300">
              <div className="flex items-center gap-3">
                <Check className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                <span>Unlimited Linear Kanban tasks & checklists</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                <span>Active predictive Safety Score calculations</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                <span>Two-way Google Calendar auto-time blocking</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                <span>High-fidelity Browser Push alerts activation</span>
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="italic">Enterprise SLA & Custom Teams API (Soon)</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-zinc-900/30 border-t border-white/5 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs text-indigo-400 font-mono uppercase tracking-widest font-bold block mb-2">COMMON INQUIRIES</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-zinc-400 text-sm">
              Explore immediate clarifications regarding safety equations, Google configurations, and account policies.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index} 
                  className="glass-panel border border-white/5 rounded-2xl overflow-hidden transition-all bg-zinc-900/40"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-zinc-900/10"
                  >
                    <span className="font-bold text-sm text-white flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-white' : ''
                    }`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-white/5">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Footer Section */}
      <footer className="border-t border-white/5 py-16 px-6 bg-zinc-950 text-zinc-500 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-left">
          
          {/* Logo col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-base tracking-tight text-white">DeadlinePilot</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xs">
              Autonomous scheduling, risk metrics, and notification dispatch arrays to protect your delivery windows.
            </p>
          </div>

          {/* Links 1 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Operational Modules</h4>
            <div className="flex flex-col space-y-2 text-[11px]">
              <button onClick={() => onNavigate('dashboard')} className="hover:text-white transition-colors text-left">Kanban Scheduler</button>
              <button onClick={() => onNavigate('planner')} className="hover:text-white transition-colors text-left">Time Blocker</button>
              <button onClick={() => onNavigate('analytics')} className="hover:text-white transition-colors text-left">Safety Confidence</button>
              <button onClick={() => onNavigate('notifications')} className="hover:text-white transition-colors text-left">Dispatch Deck</button>
            </div>
          </div>

          {/* Links 2 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Developer Arena</h4>
            <div className="flex flex-col space-y-2 text-[11px]">
              <a href="https://cloud.google.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Google Cloud Console</a>
              <a href="https://firebase.google.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Firebase Project Hub</a>
              <span className="text-zinc-600 font-mono">Version: 2.4.0-Beta</span>
              <span className="text-indigo-400 font-mono font-bold">Vibe2Ship Hackathon</span>
            </div>
          </div>

          {/* Newsletter mock */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Safeguard Briefings</h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Get weekly tactical schedule tips and upcoming feature releases.
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="co-pilot@domain.com"
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-indigo-500 font-mono flex-1"
                disabled
              />
              <button 
                className="bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg border border-white/5 text-[11px] font-mono hover:text-white hover:bg-zinc-700 transition-colors"
                onClick={() => alert('Co-pilot notification list registered!')}
              >
                JOIN
              </button>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5 text-[11px]">
          <span>&copy; 2026 DeadlinePilot. Built with pride for the Vibe2Ship Hackathon. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-zinc-300">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-300">Terms of Use</a>
            <span className="text-zinc-600 font-mono">Timezone: UTC-7</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
