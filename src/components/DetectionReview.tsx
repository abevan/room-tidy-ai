import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Plus, X, Trash2 } from 'lucide-react';

interface DetectedItem {
  id: string;
  name: string;
  confidence: number;
  location?: string;
}

interface DetectionReviewProps {
  detectedItems: DetectedItem[];
  onItemsConfirmed: (items: DetectedItem[]) => void;
  videoPreview?: string;
}

export const DetectionReview: React.FC<DetectionReviewProps> = ({
  detectedItems,
  onItemsConfirmed,
  videoPreview
}) => {
  const [items, setItems] = useState(detectedItems);
  const [newItem, setNewItem] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const addItem = () => {
    if (newItem.trim()) {
      const item: DetectedItem = {
        id: Date.now().toString(),
        name: newItem.trim(),
        confidence: 1.0,
        location: newLocation.trim() || undefined
      };
      setItems([...items, item]);
      setNewItem('');
      setNewLocation('');
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<DetectedItem>) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-foreground">Review Detected Items</h2>
        <p className="text-muted-foreground">
          Review and edit the items our AI detected in your room before generating the to-do list.
        </p>
      </div>

      {videoPreview && (
        <Card className="p-4 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4" />
            <span className="font-medium">Analyzed Video</span>
          </div>
          <video
            src={videoPreview}
            controls
            className="w-full max-h-48 rounded-lg object-cover"
          />
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
          <h3 className="font-semibold mb-4">Detected Items ({items.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                <div className="flex-1">
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                    className="font-medium mb-2"
                  />
                  {item.location && (
                    <Input
                      value={item.location}
                      onChange={(e) => updateItem(item.id, { location: e.target.value })}
                      placeholder="Location (optional)"
                      className="text-sm"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getConfidenceColor(item.confidence)}>
                    {Math.round(item.confidence * 100)}%
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
          <h3 className="font-semibold mb-4">Add Items</h3>
          <div className="space-y-4">
            <div>
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Item name (e.g., clothes, books)"
                className="mb-2"
              />
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Location (e.g., on chair, floor)"
              />
            </div>
            <Button 
              onClick={addItem} 
              disabled={!newItem.trim()}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t">
            <Button 
              variant="default" 
              size="lg" 
              onClick={() => onItemsConfirmed(items)}
              disabled={items.length === 0}
              className="w-full bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
            >
              Generate To-Do List ({items.length} items)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};