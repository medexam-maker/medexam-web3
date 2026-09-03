import React, { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { resolveApiPath, isNativeMobileApp } from '../services/platform';
import { Download, X } from 'lucide-react';

export const UpdateChecker: React.FC<{ manualCheck?: boolean; onCheckComplete?: (msg: string) => void }> = ({ manualCheck = false, onCheckComplete }) => {
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const handleTrigger = () => checkForUpdates(true);
    window.addEventListener('TRIGGER_UPDATE_CHECK', handleTrigger);
    return () => window.removeEventListener('TRIGGER_UPDATE_CHECK', handleTrigger);
  }, []);


  useEffect(() => {
    if (!manualCheck && isNativeMobileApp()) {
      checkForUpdates();
    }
  }, [manualCheck]);

  const checkForUpdates = async (isManual = manualCheck) => {
    if (!isNativeMobileApp()) {
      if (isManual && onCheckComplete) onCheckComplete("Update check is only available in the Android app.");
      else if (isManual) alert("Update check is only available in the Android app.");
      return;
    }
    
    setChecking(true);
    try {
      const appInfo = await App.getInfo();
      const currentVersion = appInfo.version; // e.g. "1.0.4"
      
      const res = await fetch(resolveApiPath('/api/app/latest'));
      const data = await res.json();
      
      if (res.ok && data.success && data.release) {
        const latestVersion = data.release.version;
        // Simple string comparison for versions (assuming format x.y.z)
        if (isNewerVersion(currentVersion, latestVersion)) {
          setUpdateAvailable(data.release);
          if (isManual && onCheckComplete) onCheckComplete('New update available!');
          else if (isManual) alert("New update available!");
        } else {
          if (isManual && onCheckComplete) onCheckComplete('You are on the latest version.');
          else if (isManual) alert("You are on the latest version.");
        }
      } else {
        if (isManual && onCheckComplete) onCheckComplete('Failed to fetch latest version info.');
          else if (isManual) alert("Failed to fetch latest version info.");
      }
    } catch (err) {
      console.error('Update check error:', err);
      if (isManual && onCheckComplete) onCheckComplete('Error checking for updates.');
      else if (isManual) alert("Error checking for updates.");
    } finally {
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
        onClick={checkForUpdates} 
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
