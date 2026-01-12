import React, { forwardRef } from 'react';
import { ColorTheme } from '../types';

interface DropZoneProps {
  itemId: string;
  expectedName: string; // Full name string
  filledChars: (string | null)[]; // Array matching expectedName length
  isFlashing: boolean; // Scaffolding Level 1
  theme: ColorTheme;
}

export const DropZone = forwardRef<HTMLDivElement, DropZoneProps>(({ itemId, expectedName, filledChars, isFlashing, theme }, ref) => {
  const chars = expectedName.split('');

  return (
    <div 
      ref={ref}
      data-item-id={itemId} // Kept for Errorless Mode (Area detection)
      className={`flex flex-wrap gap-2 justify-center items-center min-h-[6rem] lg:min-h-[8rem] p-3 rounded-2xl border-2 ${theme.border} ${theme.bg} transition-colors duration-300`}
    >
      {chars.map((char, index) => {
        const isFilled = filledChars[index] !== null;
        
        // Determine if this specific slot should flash (it's the first empty one)
        const firstEmptyIndex = filledChars.findIndex(c => c === null);
        const shouldFlash = isFlashing && !isFilled && index === firstEmptyIndex;

        return (
          <div 
            key={index}
            // ID used for coordinate calculation for the guide hand
            id={`drop-slot-${itemId}-${index}`}
            // Data attributes for Strict Mode hit testing
            data-slot-index={index}
            data-parent-item-id={itemId}
            className={`
              w-16 h-16 lg:w-20 lg:h-20
              flex items-center justify-center
              rounded-xl border-4 border-dashed
              transition-all duration-300
              ${isFilled 
                ? 'bg-white border-solid shadow-none' 
                : 'bg-white/50 border-slate-300 shadow-inner'}
              ${shouldFlash ? `animate-pulse ring-4 ${theme.ring} scale-110` : ''}
              ${isFilled ? theme.border : ''}
            `}
          >
            {isFilled ? (
              <span className={`text-3xl lg:text-4xl font-bold ${theme.charText} animate-in zoom-in spin-in-6 duration-300`}>
                {filledChars[index]}
              </span>
            ) : (
              <span className="text-slate-400 text-xl font-light opacity-50">
                {index + 1}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
});

DropZone.displayName = 'DropZone';