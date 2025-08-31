import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Key, Eye, EyeOff } from 'lucide-react';

interface ApiKeySetupProps {
  onApiKeySet: (apiKey: string) => void;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [existingKey, setExistingKey] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('google_api_key');
    if (stored) {
      setExistingKey(stored);
      onApiKeySet(stored);
    }
  }, [onApiKeySet]);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('google_api_key', apiKey.trim());
      setExistingKey(apiKey.trim());
      onApiKeySet(apiKey.trim());
      setApiKey('');
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('google_api_key');
    setExistingKey(null);
    setApiKey('');
  };

  if (existingKey) {
    return (
      <Card className="p-6 max-w-md mx-auto mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Google API Key Configured</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClearKey}>
            Update Key
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-md mx-auto mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Key className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Setup Google API Key</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Enter your Google Console API key with Cloud Vision and Gemini API access enabled.
      </p>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="api-key">Google Cloud API Key</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        <Button 
          onClick={handleSaveKey} 
          disabled={!apiKey.trim()}
          className="w-full"
        >
          Save API Key & Continue
        </Button>
      </div>
    </Card>
  );
};