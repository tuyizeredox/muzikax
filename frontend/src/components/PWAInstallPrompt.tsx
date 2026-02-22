"use client";

import { useState, useEffect } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const beforeInstallPromptEvent = e as any;
      // Prevent the mini-infobar from appearing on mobile
      beforeInstallPromptEvent.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(beforeInstallPromptEvent);
      // Show the install prompt
      setShowInstallPrompt(true);
      console.log('PWA install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handler as any);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as any);
    };
  }, []);

  const installApp = () => {
    if (!deferredPrompt) {
      console.warn('Install prompt is not available');
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }

        // Clear the deferred prompt
        setDeferredPrompt(null);
        // Hide the install prompt
        setShowInstallPrompt(false);
      });
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const closePrompt = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-20 right-4 left-4 md:left-auto md:w-80 bg-white rounded-lg shadow-xl p-4 z-[10000] border border-gray-200 md:bottom-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-gray-900">Install MuzikaX App</h3>
          <p className="text-gray-600 mt-1">Add to your home screen for faster access and improved experience.</p>
        </div>
        <button 
          onClick={closePrompt}
          className="text-gray-400 hover:text-gray-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={installApp}
          className="flex-1 bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
        >
          Install
        </button>
        <button
          onClick={closePrompt}
          className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;