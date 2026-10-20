import React, { useState, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/googleSheetsSync';
import {
  Settings,
  Clock,
  Globe,
  RotateCcw,
  Download,
  Calendar,
  Shield,
  Layers,
  Database,
  Lock,
  KeyRound,
  Check,
  Cloud,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Copy,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToDemoData,
    exportPeople,
    exportCourses,
    exportTraining,
    exportConflicts,
    appPassword,
    setAppPassword,
    lockApp,
    googleSheetsUrl,
    setGoogleSheetsUrl,
    syncStatus,
    lastSyncedAt,
    syncError,
    pullFromCloud,
    pushToCloud,
    showToast,
  } = usePlanner();

  const [confirmReset, setConfirmReset] = useState(false);
  const [passwordInput, setPasswordInput] = useState(appPassword);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [sheetsUrlInput, setSheetsUrlInput] = useState(googleSheetsUrl);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    setPasswordInput(appPassword);
  }, [appPassword]);

  useEffect(() => {
    setSheetsUrlInput(googleSheetsUrl);
  }, [googleSheetsUrl]);

  const handleSaveSheetsUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sheetsUrlInput.trim();
    setGoogleSheetsUrl(cleaned);
    if (cleaned) {
      showToast('info', 'Connecting to Google Sheets', 'Syncing with your Google Sheet...');
    } else {
      showToast('info', 'Cloud Sync Disconnected', 'Switched back to local browser storage.');
    }
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopiedScript(true);
      showToast('success', 'Script Copied', 'Paste this code into Extensions → Apps Script in your Google Sheet.');
      setTimeout(() => setCopiedScript(false), 3000);
    } catch {
      showToast('error', 'Copy Failed', 'Could not copy automatically. You can also copy google-apps-script.js from the project root.');
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setAppPassword(passwordInput.trim());
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  const handleResetDemo = () => {
    resetToDemoData();
    setConfirmReset(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Application Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure Google Sheets cloud sync, working hours, language, and database backups
        </p>
      </div>

      {/* Google Sheets Cloud Sync (Multi-Device Persistence) */}
      <div className="bg-white rounded-xl border border-emerald-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-gray-900">Google Sheets Cloud Database Sync</h2>
                {googleSheetsUrl ? (
                  syncStatus === 'syncing' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Syncing...
                    </span>
                  ) : syncStatus === 'error' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertCircle className="w-3 h-3" />
                      Sync Error
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Cloud Connected
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                    Local Browser Only
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Keep People, Courses, and Trainings automatically synced across all your devices via Google Sheets
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>{showSetupGuide ? 'Hide Setup Guide' : '2-Minute Setup Guide'}</span>
            {showSetupGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Step-by-step Setup Guide */}
        {showSetupGuide && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-slate-900">How to connect your Google Sheet (Free):</span>
              <button
                type="button"
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Copied Apps Script!' : 'Copy Google Apps Script Code'}</span>
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed">
              <li>
                Create a new blank Google Sheet at{' '}
                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline font-semibold"
                >
                  sheets.new
                </a>
                .
              </li>
              <li>
                In your Google Sheet, click <strong>Extensions &rarr; Apps Script</strong>, delete any starter code in{' '}
                <code className="bg-white px-1 py-0.5 rounded border font-mono">Code.gs</code>, and paste the script using the{' '}
                <strong>Copy Google Apps Script Code</strong> button above (also saved in{' '}
                <code className="bg-white px-1 py-0.5 rounded border font-mono">google-apps-script.js</code>).
              </li>
              <li>
                Click <strong>Deploy &rarr; New deployment</strong>, choose type <strong>Web app</strong>, set{' '}
                <em>Execute as:</em> <strong>Me</strong> and <em>Who has access:</em> <strong>Anyone</strong>, then click{' '}
                <strong>Deploy</strong>.
              </li>
              <li>
                Copy the generated <strong>Web app URL</strong> (<code className="bg-white px-1 py-0.5 rounded border font-mono">https://script.google.com/macros/s/.../exec</code>) and paste it below!
              </li>
              <li>
                <em>Tip for publishing:</em> To avoid pasting the URL on every new device, add{' '}
                <code className="bg-white px-1 py-0.5 rounded border font-mono">VITE_GOOGLE_SHEETS_URL=your_url_here</code> in your hosting provider&apos;s Environment Variables (e.g. Vercel / Netlify).
              </li>
            </ol>
          </div>
        )}

        <form onSubmit={handleSaveSheetsUrl} className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end gap-2.5">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Google Apps Script Web App URL
              </label>
              <input
                type="url"
                value={sheetsUrlInput}
                onChange={(e) => setSheetsUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-mono"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save &amp; Connect</span>
            </button>
          </div>

          {googleSheetsUrl && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={syncStatus === 'syncing'}
                  onClick={() => pullFromCloud(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <DownloadCloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pull from Sheet</span>
                </button>

                <button
                  type="button"
                  disabled={syncStatus === 'syncing'}
                  onClick={() => pushToCloud(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Push to Sheet Now</span>
                </button>
              </div>

              <div className="text-[11px] text-gray-500">
                {syncError ? (
                  <span className="text-rose-600 font-medium">Error: {syncError}</span>
                ) : lastSyncedAt ? (
                  <span>Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}</span>
                ) : (
                  <span>Auto-saves all changes to Google Sheets</span>
                )}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Access Password & Security */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="font-bold text-sm text-gray-900">Access Security &amp; Password Gate</h2>
              <p className="text-xs text-gray-500">
                Protect the planner from unauthorized access with a startup password
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={lockApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Screen Now</span>
          </button>
        </div>

        <form onSubmit={handleSavePassword} className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 max-w-lg">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Access Password
              </label>
              <input
                type="text"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter new password..."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              {passwordSaved ? <Check className="w-3.5 h-3.5" /> : <KeyRound className="w-3.5 h-3.5" />}
              <span>{passwordSaved ? 'Saved!' : 'Update Password'}</span>
            </button>
          </div>
          <p className="text-[11px] text-gray-500">
            Default system password is <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold text-gray-800">admin2026</code>. When locked, users will be required to enter this password to view or modify schedules.
          </p>
        </form>
      </div>

      {/* Calendar Working Hours */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="font-bold text-sm text-gray-900">Calendar Working Hours &amp; Grid</h2>
            <p className="text-xs text-gray-500">Defines the horizontal/vertical time grid bounds</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Start Hour</label>
            <select
              value={settings.workingHoursStart}
              onChange={(e) => updateSettings({ workingHoursStart: Number(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value={7}>07:00 AM</option>
              <option value={8}>08:00 AM (Default)</option>
              <option value={9}>09:00 AM</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">End Hour</label>
            <select
              value={settings.workingHoursEnd}
              onChange={(e) => updateSettings({ workingHoursEnd: Number(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value={20}>20:00 (08:00 PM)</option>
              <option value={21}>21:00 (09:00 PM)</option>
              <option value={22}>22:00 (10:00 PM - Default)</option>
              <option value={23}>23:00 (11:00 PM)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Time Slot Increment</label>
            <select
              value={settings.timeSlotMinutes}
              onChange={(e) => updateSettings({ timeSlotMinutes: Number(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes (Default)</option>
              <option value={60}>60 Minutes</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Default Duration</label>
            <select
              value={settings.defaultDurationDays}
              onChange={(e) => updateSettings({ defaultDurationDays: Number(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value={1}>1 Day</option>
              <option value={2}>2 Days</option>
              <option value={3}>3 Days</option>
              <option value={4}>4 Days</option>
              <option value={5}>5 Days (Default)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Language & Localization */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Globe className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="font-bold text-sm text-gray-900">Language &amp; Layout</h2>
            <p className="text-xs text-gray-500">Multilingual readiness with RTL support architecture</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Primary Display Language</label>
            <select
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value as any })}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="en">English (LTR) - Default</option>
              <option value="ar">Arabic / العربية (RTL Layout)</option>
            </select>
            <span className="text-[11px] text-gray-400 mt-1 block">
              Architected for future bi-directional medical translation.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Weekend Columns</label>
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showWeekends}
                  onChange={(e) => updateSettings({ showWeekends: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700">Display weekend days (Sat &amp; Sun) with subtle visual styling</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Backup and Data Export */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Database className="w-5 h-5 text-teal-600" />
          <div>
            <h2 className="font-bold text-sm text-gray-900">Data Management &amp; CSV Backup</h2>
            <p className="text-xs text-gray-500">Export database collections as structured CSV files</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={exportTraining}
            className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center text-xs font-semibold text-gray-800 flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Calendar CSV</span>
          </button>

          <button
            onClick={exportPeople}
            className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center text-xs font-semibold text-gray-800 flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>People CSV</span>
          </button>

          <button
            onClick={exportCourses}
            className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center text-xs font-semibold text-gray-800 flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-purple-600" />
            <span>Courses CSV</span>
          </button>

          <button
            onClick={exportConflicts}
            className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center text-xs font-semibold text-gray-800 flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>Conflicts CSV</span>
          </button>
        </div>
      </div>

      {/* Clear All Data Box */}
      <div className="bg-white rounded-xl border border-rose-200 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-sm text-rose-900 flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Clear All Database Records</span>
          </h2>
          <p className="text-xs text-rose-700 mt-1 max-w-lg leading-relaxed">
            Permanently removes all people, courses, and scheduled training sessions from both local storage and your connected Google Sheet.
          </p>
        </div>

        {confirmReset ? (
          <div className="flex items-center gap-2 animate-in fade-in shrink-0">
            <span className="text-xs text-rose-800 font-bold">Clear all data?</span>
            <button
              onClick={handleResetDemo}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              Yes, Clear All
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Clear All Data
          </button>
        )}
      </div>
    </div>
  );
};
