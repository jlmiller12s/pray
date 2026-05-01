"use client";

import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );
    
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone) {
    return null; // Don't show install button if already installed
  }

  return (
    <div className="fixed bottom-32 left-4 z-50 p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg text-white max-w-sm">
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-sm">Install App</h3>
        <p className="text-xs text-gray-300">Add this app to your home screen for quick access.</p>
        
        {isIOS ? (
          <div className="bg-black/30 p-2 rounded-md mt-2">
            <p className="text-xs text-center">
              To install on iOS: tap the <strong>Share</strong> icon and select <strong>"Add to Home Screen"</strong>
            </p>
          </div>
        ) : (
          <button
            onClick={async () => {
              if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === "accepted") {
                  setDeferredPrompt(null);
                }
              } else {
                alert("To install the app, look for the 'Install' icon in your browser's address bar (often a small monitor with a down arrow), or select 'Add to Home screen' / 'Install App' from your browser's main menu.");
              }
            }}
            className="mt-2 bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Download App
          </button>
        )}
      </div>
    </div>
  );
}
