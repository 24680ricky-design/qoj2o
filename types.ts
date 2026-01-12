export interface Item {
  id: string;
  name: string;
  image: string; // URL or Base64
  audio?: string; // Base64 Audio Data (New)
  hint: string;
}

export interface Collection {
  id: string;
  name: string;
  items: Item[];
}

export interface Settings {
  delayFlash: number; 
  delayHint: number; 
  delayGuide: number; 
  impulseTime: number; 
  showDistractors: boolean; 
  displayMode: 'single' | 'multi';
  errorlessMode: boolean; // New: If true, wrong answers are physically rejected
  requiredStars: number; // New: Stars needed for reward
}

export const DEFAULT_SETTINGS: Settings = {
  delayFlash: 5,
  delayHint: 10,
  delayGuide: 15,
  impulseTime: 1.5,
  showDistractors: false,
  displayMode: 'single',
  errorlessMode: false,
  requiredStars: 5,
};

// Character card used in the game
export interface GameChar {
  id: string;
  char: string;
  belongsToItemId: string; 
  targetIndex: number; 
  isDistractor: boolean;
}

export enum ScaffoldingLevel {
  NONE = 0,
  VISUAL = 1,
  AUDIO = 2,
  GUIDE = 3,
}

export interface ColorTheme {
  border: string;
  bg: string;
  ring: string;
  charBg: string;
  charBorder: string;
  charText: string;
}

// Analytics Data Structure
export interface GameLog {
  id: string;
  timestamp: number;
  studentName?: string; // Optional for future
  collectionName: string;
  totalItems: number;
  completedItems: number;
  mistakes: number;
  averageTimePerItem: number;
  mostUsedScaffold: ScaffoldingLevel; // The level where they finally succeeded
}
