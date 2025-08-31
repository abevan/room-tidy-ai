import React, { useEffect, useState } from 'react';

interface FloatingDot {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export const InteractiveBackground: React.FC = () => {
  const [dots, setDots] = useState<FloatingDot[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Generate floating dots
    const generateDots = () => {
      const newDots: FloatingDot[] = [];
      for (let i = 0; i < 50; i++) {
        newDots.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 6 + 2,
          delay: Math.random() * 10,
          duration: Math.random() * 20 + 10
        });
      }
      setDots(newDots);
    };

    generateDots();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Animated gradient mesh */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
      
      {/* Floating dots grid */}
      {dots.map((dot) => {
        const distanceFromMouse = Math.sqrt(
          Math.pow(dot.x - mousePosition.x, 2) + Math.pow(dot.y - mousePosition.y, 2)
        );
        const scale = Math.max(0.5, 2 - distanceFromMouse / 20);
        
        return (
          <div
            key={dot.id}
            className="absolute rounded-full bg-gradient-primary animate-pulse-glow"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              transform: `scale(${scale})`,
              animationDelay: `${dot.delay}s`,
              animationDuration: `${dot.duration}s`,
              filter: 'blur(0.5px)'
            }}
          />
        );
      })}

      {/* Interactive light following cursor */}
      <div
        className="absolute w-96 h-96 rounded-full bg-primary/10 blur-3xl transition-all duration-1000 ease-out"
        style={{
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* Geometric shapes */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-primary/20 rotate-45 animate-drift" />
      <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border border-accent/30 animate-float" 
           style={{ animationDelay: '3s' }} />
      <div className="absolute top-2/3 left-1/3 w-16 h-16 bg-gradient-primary rounded-full animate-pulse-glow opacity-30" 
           style={{ animationDelay: '1.5s' }} />
    </div>
  );
};