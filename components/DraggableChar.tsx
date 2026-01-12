import React, { useState, useRef, useEffect } from 'react';
import { GameChar, ColorTheme } from '../types';

interface DraggableCharProps {
  char: GameChar;
  onDrop: (charId: string, x: number, y: number) => void;
  isMatched: boolean;
  isGuideActive: boolean; // For scaffolding level 3
  guideVector?: { x: number, y: number }; // Vector to the target slot
  theme: ColorTheme;
}

export const DraggableChar: React.FC<DraggableCharProps> = ({ char, onDrop, isMatched, isGuideActive, guideVector, theme }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  if (isMatched) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = elementRef.current;
    if (!element) return;

    element.setPointerCapture(e.pointerId);
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;

    setPosition({ x: dx, y: dy });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const element = elementRef.current;
    if (element) {
      element.releasePointerCapture(e.pointerId);
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      onDrop(char.id, centerX, centerY);
    }

    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
  };

  // Construct dynamic keyframes for the hand animation
  const handStyle: React.CSSProperties = isGuideActive && guideVector 
    ? {
        '--tx': `${guideVector.x}px`,
        '--ty': `${guideVector.y}px`,
        animation: 'guide-move 2s infinite ease-in-out'
      } as React.CSSProperties
    : {};

  return (
    <div
      ref={elementRef}
      id={`char-source-${char.id}`} // Used for coordinate calculation
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`
        relative select-none touch-none cursor-grab active:cursor-grabbing
        w-24 h-24 lg:w-32 lg:h-32 flex items-center justify-center
        font-bold text-5xl lg:text-6xl rounded-2xl shadow-lg border-b-8
        transition-transform duration-75 z-50
        ${theme.charBg} ${theme.charBorder} ${theme.charText}
      `}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) ${isDragging ? 'scale(1.1)' : 'scale(1)'}`,
        zIndex: isDragging ? 100 : 10,
        opacity: isDragging ? 0.9 : 1
      }}
    >
      {char.char}
      
      {/* Hand Guide Visual for Level 3 Scaffolding */}
      {isGuideActive && !isDragging && (
        <>
          <style>{`
            @keyframes guide-move {
              0% { transform: translate(0, 0); opacity: 0; }
              20% { opacity: 1; }
              80% { transform: translate(var(--tx), var(--ty)); opacity: 1; }
              100% { transform: translate(var(--tx), var(--ty)); opacity: 0; }
            }
          `}</style>
          <div 
            className="absolute bottom-0 right-0 pointer-events-none z-[60]"
            style={handStyle}
          >
             <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
              <path d="M7 11V19C7 20.6569 8.34315 22 10 22H14C15.6569 22 17 20.6569 17 19V11" fill="white" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 11V7C17 5.34315 15.6569 4 14 4C12.3431 4 11 5.34315 11 7V11" fill="white" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </>
      )}
    </div>
  );
};