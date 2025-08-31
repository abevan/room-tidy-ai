import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

interface PWAInstallPromptProps {
  onClose?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const { isInstallable, installApp } = usePWA();

  if (!isInstallable) return null;

  const handleInstall = async () => {
    const success = await installApp();
    if (success && onClose) {
      onClose();
    }
  };

  return (
    <Card className="fixed bottom-4 left-4 right-4 p-4 bg-white/95 backdrop-blur-sm border border-primary/20 shadow-lg z-50 mx-auto max-w-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary to-blue-500 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Install Room Tidy AI</h3>
            <p className="text-sm text-muted-foreground">Add to your home screen for quick access</p>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={handleInstall}
          className="flex-1 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
        >
          <Download className="w-4 h-4 mr-2" />
          Install App
        </Button>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Later
          </Button>
        )}
      </div>
    </Card>
  );
};