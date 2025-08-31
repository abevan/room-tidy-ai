import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    console.log('🔧 PWA: Initializing PWA hook');
    
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = 'standalone' in window.navigator && (window.navigator as any).standalone;
    
    console.log('🔧 PWA: Standalone mode:', isStandalone);
    console.log('🔧 PWA: iOS standalone:', isIOSStandalone);
    
    if (isStandalone || isIOSStandalone) {
      console.log('🔧 PWA: App is already installed');
      setIsInstalled(true);
    } else {
      console.log('🔧 PWA: App is not installed, listening for install prompt');
      // For testing, make it immediately installable
      setTimeout(() => {
        console.log('🔧 PWA: Setting installable to true for testing');
        setIsInstallable(true);
      }, 2000);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('🔧 PWA: beforeinstallprompt event received');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('🔧 PWA: App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Check if PWA criteria are met
    const checkPWACriteria = () => {
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasManifest = document.querySelector('link[rel="manifest"]');
      const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
      
      console.log('🔧 PWA: Service Worker support:', hasServiceWorker);
      console.log('🔧 PWA: Manifest found:', !!hasManifest);
      console.log('🔧 PWA: HTTPS:', isHTTPS);
      
      if (hasServiceWorker && hasManifest && isHTTPS) {
        console.log('🔧 PWA: All PWA criteria met');
        return true;
      }
      return false;
    };
    
    if (checkPWACriteria()) {
      setTimeout(() => {
        if (!isInstalled && !deferredPrompt) {
          console.log('🔧 PWA: Force enabling installable state');
          setIsInstallable(true);
        }
      }, 3000);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    console.log('🔧 PWA: Install app called, deferred prompt:', !!deferredPrompt);
    
    if (!deferredPrompt) {
      console.log('🔧 PWA: No deferred prompt, showing manual install instructions');
      
      // Show manual install instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      if (isIOS) {
        alert('To install this app on your iPhone/iPad:\n1. Tap the Share button\n2. Select "Add to Home Screen"');
      } else if (isAndroid) {
        alert('To install this app:\n1. Tap the menu button (⋮)\n2. Select "Add to Home Screen" or "Install App"');
      } else {
        alert('To install this app:\n1. Look for an install icon in your browser\'s address bar\n2. Or check your browser\'s menu for "Install" or "Add to Home Screen"');
      }
      
      return false;
    }

    try {
      console.log('🔧 PWA: Prompting user to install');
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      console.log('🔧 PWA: User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      
      setDeferredPrompt(null);
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('🔧 PWA: Error installing app:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    installApp
  };
};