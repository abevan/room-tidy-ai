import React, { useEffect, useState } from 'react';

interface FloatingDot {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

export const FloatingBackground: React.FC = () => {
  const [dots, setDots] = useState<FloatingDot[]>([]);

  useEffect(() => {
    const colors = [
      'hsl(var(--primary) / 0.1)',
      'hsl(var(--accent) / 0.1)', 
      'hsl(var(--primary-glow) / 0.08)',
      'hsl(var(--success) / 0.06)',
    ];

    const newDots = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      delay: Math.random() * 20,
      duration: Math.random() * 30 + 20,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    setDots(newDots);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {dots.map((dot) => (
        <div
          key={dot.id}
          className="absolute rounded-full animate-drift opacity-50"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            backgroundColor: dot.color,
            animationDelay: `${dot.delay}s`,
            animationDuration: `${dot.duration}s`,
          }}
        />
      ))}
      
      {/* Animated gradient mesh overlay */}
      <div 
        className="absolute inset-0 bg-gradient-mesh opacity-30 animate-pulse"
        style={{ animationDuration: '8s' }}
      />
    </div>
  );
};