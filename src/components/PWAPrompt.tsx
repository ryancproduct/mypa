import React, { useState, useEffect } from 'react';
import { pwaService, type PWAUpdateInfo } from '../services/pwaService';

export const PWAPrompt: React.FC = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<PWAUpdateInfo | null>(null);

  useEffect(() => {
    // Check for install prompt
    const checkInstallPrompt = () => {
      if (pwaService.canInstall() && !pwaService.isStandalone()) {
        setShowInstallPrompt(true);
      }
    };

    // Listen for PWA updates
    pwaService.onUpdate((info) => {
      setUpdateInfo(info);
      if (info.needRefresh) {
        setShowUpdatePrompt(true);
      }
    });

    // Check install prompt periodically
    checkInstallPrompt();
    const interval = setInterval(checkInstallPrompt, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    const installed = await pwaService.promptInstall();
    if (installed) {
      setShowInstallPrompt(false);
    }
  };

  const handleUpdate = async () => {
    if (updateInfo?.updateSW) {
      await updateInfo.updateSW();
      setShowUpdatePrompt(false);
      window.location.reload();
    }
  };

  const dismissInstall = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  // Don't show install prompt if dismissed this session
  const installDismissed = sessionStorage.getItem('pwa-install-dismissed');

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && !installDismissed && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-80 z-40">
          <div className="mypa-card p-4 border-l-4 border-primary-500 animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  Install MyPA
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                  Add MyPA to your home screen for quick access and native app experience.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleInstall}
                    className="mypa-button-primary text-sm py-1.5 px-3"
                  >
                    Install
                  </button>
                  <button
                    onClick={dismissInstall}
                    className="mypa-button-secondary text-sm py-1.5 px-3"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Prompt */}
      {showUpdatePrompt && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:w-80 z-50">
          <div className="mypa-card p-4 border-l-4 border-green-500 animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  Update Available
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                  A new version of MyPA is ready. Update now to get the latest features.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="mypa-button-primary text-sm py-1.5 px-3"
                  >
                    Update & Reload
                  </button>
                  <button
                    onClick={dismissUpdate}
                    className="mypa-button-secondary text-sm py-1.5 px-3"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Ready Notification */}
      {updateInfo?.offlineReady && (
        <div className="fixed top-4 right-4 z-40">
          <div className="mypa-card p-3 border-l-4 border-blue-500 animate-fade-in">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Ready for offline use
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};