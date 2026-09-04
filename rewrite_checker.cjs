const fs = require('fs');

const code = `import React, { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { resolveApiPath, isNativeMobileApp } from '../services/platform';
import { Download, X } from 'lucide-react';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const TIMESTAMP_KEY = 'medexam_last_update_check';

let globalIsChecking = false;

export const UpdateChecker: React.FC<{ manualCheck?: boolean; onCheckComplete?: (msg: string) => void }> = ({ manualCheck = false, onCheckComplete }) => {
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const handleTrigger = () => checkForUpdates(true);
    window.addEventListener('TRIGGER_UPDATE_CHECK', handleTrigger);
    
    if (!manualCheck && isNativeMobileApp()) {
      checkForUpdates(false);
    }
    
    return () => window.removeEventListener('TRIGGER_UPDATE_CHECK', handleTrigger);
  }, []);

  const checkForUpdates = async (isManual = manualCheck) => {
    if (!isNativeMobileApp()) {
      if (isManual && onCheckComplete) onCheckComplete("Update check is only available in the Android app.");
      else if (isManual) alert("Update check is only available in the Android app.");
      return;
    }
    
    if (globalIsChecking) return;
    
    if (!isManual) {
      const lastCheck = localStorage.getItem(TIMESTAMP_KEY);
      if (lastCheck) {
        const lastCheckTime = parseInt(lastCheck, 10);
        if (Date.now() - lastCheckTime < THIRTY_DAYS_MS) {
          return; // Less than 30 days, suppress auto check
        }
      }
    }

    globalIsChecking = true;
    setChecking(true);
    
    try {
      const appInfo = await App.getInfo();
      const currentVersion = appInfo.version;
      
      const res = await fetch(resolveApiPath('/api/app/latest'));
      
      if (res.status === 404) {
        try {
          const data = await res.json();
          if (data && data.success === false) {
             localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
             if (isManual && onCheckComplete) onCheckComplete("You are on the latest version. No published releases found.");
             else if (isManual) alert("You are on the latest version. No published releases found.");
             return;
          }
        } catch(e) {}
      }

      if (!res.ok && res.status !== 404) {
        throw new Error('Network response was not ok');
      }

      const data = await res.json();
      
      if (data.success && data.release) {
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
        const latestVersion = data.release.version;
        if (isNewerVersion(currentVersion, latestVersion)) {
          setUpdateAvailable(data.release);
          if (isManual && onCheckComplete) onCheckComplete('New update available!');
          else if (isManual) alert("New update available!");
        } else {
          if (isManual && onCheckComplete) onCheckComplete('You are on the latest version.');
          else if (isManual) alert("You are on the latest version.");
        }
      } else if (res.status === 404) {
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
        if (isManual && onCheckComplete) onCheckComplete('You are on the latest version.');
        else if (isManual) alert("You are on the latest version.");
      } else {
        if (isManual && onCheckComplete) onCheckComplete('Failed to fetch latest version info.');
        else if (isManual) alert("Failed to fetch latest version info.");
      }
    } catch (err) {
      console.error('Update check error:', err);
      if (isManual && onCheckComplete) onCheckComplete('Error checking for updates.');
      else if (isManual) alert("Error checking for updates.");
    } finally {
      globalIsChecking = false;
      setChecking(false);
    }
  };

  const isNewerVersion = (current: string, latest: string) => {
    const currParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    for (let i = 0; i < Math.max(currParts.length, latestParts.length); i++) {
      const c = currParts[i] || 0;
      const l = latestParts[i] || 0;
      if (l > c) return true;
      if (l < c) return false;
    }
    return false;
  };

  if (!updateAvailable && manualCheck) {
    return (
      <button 
        onClick={() => checkForUpdates(true)} 
        disabled={checking}
        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        <span>{checking ? 'Checking...' : 'Check for Updates'}</span>
      </button>
    );
  }

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in sm:left-auto sm:right-4 sm:w-96">
      <div className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-2xl flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-black text-slate-900 text-sm">New Update Available!</h4>
            <p className="text-xs text-slate-600 mt-1">Version {updateAvailable.version} is ready to download.</p>
          </div>
          <button onClick={() => setUpdateAvailable(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {updateAvailable.release_notes && (
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] text-slate-600 max-h-20 overflow-y-auto font-mono text-right" dir="rtl">
            {updateAvailable.release_notes}
          </div>
        )}
        
        <div className="flex items-center gap-2 pt-2">
          <a 
            href={updateAvailable.download_url}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Update Now</span>
          </a>
          <button 
            onClick={() => setUpdateAvailable(null)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/UpdateChecker.tsx', code);
console.log('UpdateChecker rewritten');
