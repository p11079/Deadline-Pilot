/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { User, Settings, Shield, RefreshCw, Volume2, Cloud, Sparkles, Sliders } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsPageProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onResetDemoData: () => void;
}

export default function SettingsPage({
  user,
  onUpdateUser,
  onResetDemoData
}: SettingsPageProps) {
  
  const handlePersonaChange = (persona: UserProfile['pilotPersona']) => {
    onUpdateUser({ ...user, pilotPersona: persona });
  };

  const handleGoalChange = (hours: number) => {
    onUpdateUser({ ...user, weeklyFocusGoal: hours });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 font-sans">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-5">
        <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          Tactical Settings Panel
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Configure copilot parameters, persona characteristics, and developer system weights.
        </p>
      </div>

      {/* Profile Details Card */}
      <div className="glass-panel p-6 rounded-2xl border-white/5 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" /> Pilot Officer Profile
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          <img 
            src={user.avatarUrl} 
            alt="Profile Avatar" 
            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-lg shadow-indigo-500/10 shrink-0"
          />
          <div className="space-y-1.5 text-center sm:text-left">
            <h4 className="text-base font-semibold text-white">{user.name}</h4>
            <span className="block text-xs font-mono text-zinc-400">{user.email}</span>
            <span className="inline-block text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Vibe2Ship Participant #8912
            </span>
          </div>
        </div>
      </div>

      {/* Pilot Persona parameters selector */}
      <div className="glass-panel p-6 rounded-2xl border-white/5 space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2 mb-1">
            <Volume2 className="w-4 h-4 text-indigo-400" /> Companion Persona Voices
          </h3>
          <p className="text-xs text-zinc-500">Determine how DeadlinePilot coaches you during deadline emergency maneuvers.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { id: 'supportive', name: 'Supportive Coach', desc: 'Encouraging, collaborative, highlights milestones, and focuses on stress mitigation.' },
            { id: 'tough-love', name: 'Tough Love Commander', desc: 'Direct, persistent warnings, outlines exact risk vectors, and reminds of countdown limits.' },
            { id: 'analytical', name: 'Data Analyst', desc: 'Purely mathematical, quotes velocity trends, completion ratios, and safety variances.' },
            { id: 'hyper-focused', name: 'Hyper Focused Engine', desc: 'Urgent task breakdowns, triggers immediate focus windows, and clears schedules.' }
          ].map(persona => {
            const isActive = user.pilotPersona === persona.id;
            return (
              <div 
                key={persona.id}
                onClick={() => handlePersonaChange(persona.id as any)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isActive 
                  ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                  : 'border-white/5 bg-white/2 text-zinc-400 hover:border-white/10 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-indigo-400' : 'bg-zinc-700'}`} />
                  <span className="text-xs font-semibold text-white">{persona.name}</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{persona.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly goals slider */}
      <div className="glass-panel p-6 rounded-2xl border-white/5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" /> Operational Objectives
        </h3>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-zinc-300">
            <span>Weekly Deep Focus Target</span>
            <span className="font-mono text-indigo-400 font-bold text-sm">{user.weeklyFocusGoal} hours</span>
          </div>
          <input 
            type="range" 
            min={5} 
            max={40} 
            value={user.weeklyFocusGoal}
            onChange={(e) => handleGoalChange(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="block text-[10px] text-zinc-500">Suggested: 20 hours is the peak average for software accelerators.</span>
        </div>
      </div>

      {/* Cloud Integrations Status indicators */}
      <div className="glass-panel p-6 rounded-2xl border-white/5 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Cloud className="w-4 h-4 text-indigo-400" /> Google Cloud Integration Stack
        </h3>

        <div className="space-y-3.5 text-xs text-zinc-300">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="space-y-0.5">
              <span className="font-semibold block text-zinc-200">Google Calendar Auth API</span>
              <span className="text-[10px] text-zinc-500">Allows automatic syncing of time blocks to calendars.</span>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono font-bold px-2 py-1 rounded">
              OAUTH ENABLED
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="space-y-0.5">
              <span className="font-semibold block text-zinc-200">Gemini 2.5 Flash API Key</span>
              <span className="text-[10px] text-zinc-500">Injects custom intelligence into copilot rescue checklists.</span>
            </div>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-mono font-bold px-2 py-1 rounded">
              AUTO-INJECTED
            </span>
          </div>
        </div>
      </div>

      {/* Reset Operations Button */}
      <div className="glass-panel p-6 rounded-2xl border-rose-500/10 bg-rose-950/5 space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-rose-400" /> Emergency System Flush
          </h3>
          <p className="text-xs text-zinc-500">Restore sandbox simulation details (tasks, checkpoints, logs, and calendar time blocks) to default hackathon templates.</p>
        </div>

        <button 
          onClick={() => {
            onResetDemoData();
            alert("Database simulation flushed successfully! Sandbox details restored to defaults.");
          }}
          className="bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 text-xs font-semibold py-2.5 px-4 rounded-xl border border-rose-500/20 transition-all flex items-center gap-1.5 shadow-md"
        >
          <RefreshCw className="w-4 h-4" /> Reset Sandboxed Demo Data
        </button>
      </div>

    </div>
  );
}
