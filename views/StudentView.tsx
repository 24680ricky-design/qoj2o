import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Collection, Settings, GameChar, ScaffoldingLevel, ColorTheme, GameLog } from '../types';
import { DraggableChar } from '../components/DraggableChar';
import { DropZone } from '../components/DropZone';
import { ImpulseOverlay } from '../components/ImpulseOverlay';
import { RewardSystem } from '../components/RewardSystem';
import { speak, playAudio, unlockAudio } from '../services/speechService';
import { saveGameLog } from '../services/storageService';

const COLOR_PALETTES: ColorTheme[] = [
  { border: 'border-blue-400', bg: 'bg-blue-50', ring: 'ring-blue-200', charBg: 'bg-blue-200', charBorder: 'border-blue-400', charText: 'text-blue-900' },
  { border: 'border-green-400', bg: 'bg-green-50', ring: 'ring-green-200', charBg: 'bg-green-200', charBorder: 'border-green-400', charText: 'text-green-900' },
  { border: 'border-orange-400', bg: 'bg-orange-50', ring: 'ring-orange-200', charBg: 'bg-orange-200', charBorder: 'border-orange-400', charText: 'text-orange-900' },
  { border: 'border-purple-400', bg: 'bg-purple-50', ring: 'ring-purple-200', charBg: 'bg-purple-200', charBorder: 'border-purple-400', charText: 'text-purple-900' },
  { border: 'border-pink-400', bg: 'bg-pink-50', ring: 'ring-pink-200', charBg: 'bg-pink-200', charBorder: 'border-pink-400', charText: 'text-pink-900' },
  { border: 'border-teal-400', bg: 'bg-teal-50', ring: 'ring-teal-200', charBg: 'bg-teal-200', charBorder: 'border-teal-400', charText: 'text-teal-900' },
];

const DISTRACTOR_THEME: ColorTheme = {
  border: 'border-slate-300', bg: 'bg-slate-100', ring: 'ring-slate-200',
  charBg: 'bg-yellow-400', charBorder: 'border-yellow-600', charText: 'text-slate-900' 
};

interface StudentViewProps {
  collection: Collection;
  settings: Settings;
  onExit: () => void;
}

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
} | null;

export const StudentView: React.FC<StudentViewProps> = ({ collection, settings, onExit }) => {
  // Game State
  const [isImpulseLocked, setIsImpulseLocked] = useState(true);
  const [currentItemIndex, setCurrentItemIndex] = useState(0); 
  const [filledZones, setFilledZones] = useState<Record<string, (string | null)[]>>({});
  const [scaffoldingLevel, setScaffoldingLevel] = useState<ScaffoldingLevel>(ScaffoldingLevel.NONE);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [guideVector, setGuideVector] = useState<{x: number, y: number} | undefined>(undefined);
  const [gameSessionId, setGameSessionId] = useState(0);

  // Token Economy State
  const [stars, setStars] = useState(0);
  const [showReward, setShowReward] = useState(false);

  // Analytics State
  const [startTime, setStartTime] = useState(Date.now());
  const [mistakesCount, setMistakesCount] = useState(0);
  const [maxScaffoldUsed, setMaxScaffoldUsed] = useState<ScaffoldingLevel>(ScaffoldingLevel.NONE);

  // Refs
  const scaffoldTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusItemRef = useRef<string | undefined>(undefined);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived Data
  const isMultiMode = settings.displayMode === 'multi';
  
  const visualItems = useMemo(() => {
    if (isMultiMode) return collection.items;
    return [collection.items[currentItemIndex]];
  }, [collection, currentItemIndex, isMultiMode]);

  const focusItem = useMemo(() => {
    if (!isMultiMode) return collection.items[currentItemIndex];
    return collection.items.find(item => !completedItems.has(item.id)) || null;
  }, [isMultiMode, collection.items, currentItemIndex, completedItems]);

  // Initialization
  useEffect(() => {
    unlockAudio();
    initGame();
  }, [collection]);

  const initGame = () => {
    const initialZones: Record<string, (string | null)[]> = {};
    collection.items.forEach(item => {
      initialZones[item.id] = new Array(item.name.length).fill(null);
    });
    setFilledZones(initialZones);
    setCompletedItems(new Set());
    setCurrentItemIndex(0);
    setIsGameComplete(false);
    setFeedback(null);
    setGameSessionId(prev => prev + 1);
    setStars(0);
    
    // Reset Analytics
    setStartTime(Date.now());
    setMistakesCount(0);
    setMaxScaffoldUsed(ScaffoldingLevel.NONE);
  };

  const handleRestart = () => {
    unlockAudio();
    speak("重新開始");
    initGame();
  };

  const playItemAudio = (item: any, fallbackText: string) => {
      if (item.audio) {
          playAudio(item.audio).catch(() => speak(fallbackText));
      } else {
          speak(fallbackText);
      }
  };

  const charBank = useMemo(() => {
    let chars: GameChar[] = [];
    const itemColorMap: Record<string, ColorTheme> = {};
    collection.items.forEach((item, idx) => {
      itemColorMap[item.id] = COLOR_PALETTES[idx % COLOR_PALETTES.length];
    });

    visualItems.forEach(item => {
      const isItemCompleted = completedItems.has(item.id);
      if (!isItemCompleted) {
        const itemFilledState = filledZones[item.id] || new Array(item.name.length).fill(null);
        item.name.split('').forEach((char, index) => {
          if (itemFilledState[index] === null) {
            chars.push({
              id: `${item.id}-char-${index}`,
              char: char,
              belongsToItemId: item.id,
              targetIndex: index,
              isDistractor: false
            });
          }
        });
      }
    });

    // Errorless Mode: Do not add distractors if enabled
    if (settings.showDistractors && !settings.errorlessMode) {
       const otherNames = ['大', '小', '美', '阿', '華', '莉', '老', '師', '爸', '媽'];
       const count = isMultiMode ? 4 : 2;
       for(let i=0; i<count; i++) {
         const randomChar = otherNames[Math.floor(Math.random() * otherNames.length)];
         chars.push({
            id: `distractor-${i}-${Date.now()}`,
            char: randomChar,
            belongsToItemId: 'none',
            targetIndex: -1,
            isDistractor: true
         });
       }
    }
    return chars.sort(() => Math.random() - 0.5);
  }, [visualItems, settings.showDistractors, settings.errorlessMode, completedItems, filledZones, collection.items]);

  // Guide Vector Logic
  useEffect(() => {
    if (scaffoldingLevel === ScaffoldingLevel.GUIDE && focusItem) {
      const filledState = filledZones[focusItem.id];
      if (!filledState) return;
      const firstEmptyIndex = filledState.findIndex(c => c === null);
      if (firstEmptyIndex === -1) return;
      const targetChar = charBank.find(c => c.belongsToItemId === focusItem.id && c.targetIndex === firstEmptyIndex);
      
      if (targetChar) {
        const charEl = document.getElementById(`char-source-${targetChar.id}`);
        const slotEl = document.getElementById(`drop-slot-${focusItem.id}-${firstEmptyIndex}`);
        if (charEl && slotEl) {
          const charRect = charEl.getBoundingClientRect();
          const slotRect = slotEl.getBoundingClientRect();
          const dx = (slotRect.left + slotRect.width / 2) - (charRect.left + charRect.width / 2);
          const dy = (slotRect.top + slotRect.height / 2) - (charRect.top + charRect.height / 2);
          setGuideVector({ x: dx, y: dy });
        }
      }
    } else {
      setGuideVector(undefined);
    }
  }, [scaffoldingLevel, focusItem, charBank, filledZones]);

  // Turn Lifecycle
  useEffect(() => {
    if (!isGameComplete) {
      return resetTurn();
    }
  }, [focusItem?.id, isMultiMode, isGameComplete, gameSessionId]);

  const resetTurn = () => {
    setIsImpulseLocked(true);
    setScaffoldingLevel(ScaffoldingLevel.NONE);
    setGuideVector(undefined);
    if (scaffoldTimerRef.current) clearInterval(scaffoldTimerRef.current);

    const impulseTimer = setTimeout(() => {
      setIsImpulseLocked(false);
      startScaffoldingTimers();
    }, settings.impulseTime * 1000);

    return () => clearTimeout(impulseTimer);
  };

  const startScaffoldingTimers = () => {
    let secondsPassed = 0;
    if (scaffoldTimerRef.current) clearInterval(scaffoldTimerRef.current);

    scaffoldTimerRef.current = setInterval(() => {
      secondsPassed += 1;
      
      if (secondsPassed === settings.delayFlash) {
        setScaffoldingLevel(prev => Math.max(prev, ScaffoldingLevel.VISUAL));
      }
      
      if (secondsPassed === settings.delayHint) {
        setScaffoldingLevel(prev => Math.max(prev, ScaffoldingLevel.AUDIO));
        if (focusItemRef.current) {
             const currentTarget = collection.items.find(i => i.id === focusItemRef.current);
             if (currentTarget) playItemAudio(currentTarget, currentTarget.hint);
        }
      }

      if (secondsPassed === settings.delayGuide) {
        setScaffoldingLevel(prev => Math.max(prev, ScaffoldingLevel.GUIDE));
      }
      
      // Track max scaffold level used for analytics
      setMaxScaffoldUsed(prev => {
          // Calculate the current level based on time
          let currentLevel = ScaffoldingLevel.NONE;
          if (secondsPassed >= settings.delayGuide) currentLevel = ScaffoldingLevel.GUIDE;
          else if (secondsPassed >= settings.delayHint) currentLevel = ScaffoldingLevel.AUDIO;
          else if (secondsPassed >= settings.delayFlash) currentLevel = ScaffoldingLevel.VISUAL;
          return Math.max(prev, currentLevel);
      });

    }, 1000);
  };
  
  useEffect(() => {
      focusItemRef.current = focusItem?.id;
  }, [focusItem]);

  useEffect(() => {
    return () => {
      if (scaffoldTimerRef.current) clearInterval(scaffoldTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const triggerFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
    }, 1500);
  };

  const handleDrop = (charId: string, x: number, y: number) => {
    const elements = document.elementsFromPoint(x, y);
    const draggedChar = charBank.find(c => c.id === charId);
    
    if (!draggedChar) return;

    if (settings.errorlessMode) {
        // --- Errorless Mode: Area Detection (Permissive) ---
        // Just checking if the user dropped inside the general item container
        const dropZone = elements.find(el => el.hasAttribute('data-item-id'));
        if (dropZone) {
            const targetId = dropZone.getAttribute('data-item-id');
            if (targetId && draggedChar.belongsToItemId === targetId) {
                handleSuccess(targetId, draggedChar);
            } else {
                // In errorless mode, we silently ignore wrong drops or bounce back without "Error" feedback
                return;
            }
        }
    } else {
        // --- Normal Mode: Strict Slot Detection ---
        // User must drop on the SPECIFIC character slot (e.g., Slot 1 for Character 1)
        const slotEl = elements.find(el => el.hasAttribute('data-slot-index'));

        if (slotEl) {
            const slotIndex = parseInt(slotEl.getAttribute('data-slot-index') || '-1');
            const targetId = slotEl.getAttribute('data-parent-item-id');

            if (targetId && slotIndex !== -1) {
                // Strict check: Item ID must match AND Slot Index must match
                if (targetId === draggedChar.belongsToItemId && slotIndex === draggedChar.targetIndex) {
                    handleSuccess(targetId, draggedChar);
                } else {
                    handleFailure();
                }
            }
        } else {
            // Dropped on background or outside -> Treat as invalid move (snap back)
            // Can optionally add "Not here" feedback if they hit the card background but not the slot
        }
    }
  };

  const handleSuccess = (itemId: string, charObj: GameChar) => {
    speak(`答對了，這是${charObj.char}`); 
    triggerFeedback('success', '⭕ 答對了！');
    
    // Add star
    setStars(prev => prev + 1);

    setFilledZones(prev => {
      const currentItemState = [...(prev[itemId] || [])];
      if (charObj.targetIndex >= 0 && charObj.targetIndex < currentItemState.length) {
        currentItemState[charObj.targetIndex] = charObj.char;
      }
      return { ...prev, [itemId]: currentItemState };
    });

    const targetItem = collection.items.find(i => i.id === itemId);
    if (targetItem) {
      setTimeout(() => {
        setFilledZones(currentZones => {
          const itemState = currentZones[itemId];
          if (itemState && itemState.every(c => c !== null)) {
             setCompletedItems(prev => {
               if (!prev.has(itemId)) {
                 handleItemComplete(itemId, targetItem);
                 return new Set(prev).add(itemId);
               }
               return prev;
             });
          }
          return currentZones;
        });
      }, 0);
    }
  };
  
  const handleFailure = () => {
    setMistakesCount(prev => prev + 1);
    speak("不對喔，再試試看");
    triggerFeedback('error', '❌ 再試試看');
  };

  const handleItemComplete = (itemId: string, item: any) => {
      // Play custom audio if available
      setTimeout(() => playItemAudio(item, `${item.name}，完成！`), 800);
      
      // Check for rewards
      const newStars = stars + 1; // +1 because state update hasn't rendered yet
      if (newStars > 0 && newStars % settings.requiredStars === 0) {
          setTimeout(() => setShowReward(true), 1500);
      }

      const nextStep = () => {
        if (isMultiMode) {
            const allDone = collection.items.every(it => completedItems.has(it.id) || it.id === itemId);
            if (allDone) {
               setTimeout(finishGame, 1500);
            }
        } else {
            setTimeout(() => {
              if (currentItemIndex < collection.items.length - 1) {
                setCurrentItemIndex(prev => prev + 1);
              } else {
                finishGame();
              }
            }, 2000);
        }
      };

      // Delay slightly to let audio start
      setTimeout(nextStep, 1000);
  };

  const finishGame = () => {
     setIsGameComplete(true);
     speak("太棒了，全部完成了！");
     
     // Save Analytics
     const totalTime = (Date.now() - startTime) / 1000;
     const log: GameLog = {
         id: Date.now().toString(),
         timestamp: Date.now(),
         collectionName: collection.name,
         totalItems: collection.items.length,
         completedItems: collection.items.length,
         mistakes: mistakesCount,
         averageTimePerItem: totalTime / collection.items.length,
         mostUsedScaffold: maxScaffoldUsed
     };
     saveGameLog(log);
  };

  const shouldGuideChar = (char: GameChar): boolean => {
    if (scaffoldingLevel < ScaffoldingLevel.GUIDE) return false;
    if (char.isDistractor) return false;
    if (focusItem && char.belongsToItemId !== focusItem.id) return false;
    const filledState = filledZones[char.belongsToItemId];
    if (!filledState) return false;
    const firstEmptyIndex = filledState.findIndex(c => c === null);
    return char.targetIndex === firstEmptyIndex;
  };

  const getItemTheme = (itemId: string): ColorTheme => {
    const idx = collection.items.findIndex(i => i.id === itemId);
    if (idx === -1) return DISTRACTOR_THEME;
    return COLOR_PALETTES[idx % COLOR_PALETTES.length];
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      <ImpulseOverlay isVisible={isImpulseLocked} />
      
      <RewardSystem 
        currentStars={stars} 
        totalRequired={settings.requiredStars} 
        showReward={showReward} 
        onRewardClose={() => setShowReward(false)} 
      />

      {feedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className={`
            px-8 py-6 rounded-3xl shadow-2xl transform transition-all duration-300 scale-110 animate-bounce
            ${feedback.type === 'success' ? 'bg-green-100 border-4 border-green-500 text-green-700' : 'bg-red-100 border-4 border-red-400 text-red-600'}
          `}>
            <span className="text-4xl md:text-6xl font-bold tracking-wider">{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Game Complete Modal */}
      {isGameComplete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl flex flex-col items-center gap-8 max-w-lg w-full animate-in zoom-in-95">
            <div className="text-8xl animate-bounce">🏆</div>
            <h2 className="text-4xl font-bold text-slate-800">全部完成！</h2>
            <div className="flex flex-col w-full gap-4">
              <button 
                onClick={handleRestart}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-2xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                再來一次
              </button>
              <button 
                onClick={onExit}
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xl font-bold transition flex items-center justify-center gap-2"
              >
                退出練習
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="p-4 flex justify-between items-center bg-white shadow-sm z-10">
        <div className="flex gap-3">
          <button onClick={onExit} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition">
            離開
          </button>
          <button onClick={handleRestart} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition">
            重來
          </button>
        </div>
        
        {scaffoldingLevel >= ScaffoldingLevel.AUDIO && focusItem && (
          <button 
            onClick={() => playItemAudio(focusItem, focusItem.hint)}
            className="flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-bold animate-pulse shadow-sm active:scale-95"
          >
             🔊 提示
          </button>
        )}

        <div className="text-xl font-bold text-slate-600 mr-20"> {/* Margin for star counter */}
            {isMultiMode ? '配對挑戰' : `第 ${currentItemIndex + 1} / ${collection.items.length} 題`}
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-8 flex flex-col lg:flex-row gap-8">
        <div className={`flex-1 grid gap-8 ${isMultiMode ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 flex items-center justify-center'}`}>
          {visualItems.map((item, idx) => {
            const isCompleted = completedItems.has(item.id);
            const currentFilled = filledZones[item.id] || new Array(item.name.length).fill(null);
            const isFocusItem = focusItem?.id === item.id;
            const theme = getItemTheme(item.id);

            return (
              <div key={item.id} className={`bg-white p-4 rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-3 border-4 ${isCompleted ? 'border-green-400 opacity-60' : (isFocusItem ? `border-blue-300 ring-4 ${theme.ring}` : 'border-slate-100')}`}>
                <img 
                  src={item.image} 
                  alt={item.name} 
                  onClick={() => playItemAudio(item, item.name)}
                  className={`w-40 h-40 lg:w-48 lg:h-48 object-cover rounded-3xl shadow-sm cursor-pointer hover:opacity-90 active:scale-95 ${isImpulseLocked ? 'blur-md' : ''} transition-all duration-500`}
                />
                
                <DropZone 
                    itemId={item.id}
                    expectedName={item.name}
                    filledChars={currentFilled}
                    isFlashing={isFocusItem && scaffoldingLevel >= ScaffoldingLevel.VISUAL && !isCompleted}
                    theme={theme}
                    ref={null}
                />
              </div>
            );
          })}
        </div>

        <div className="lg:w-1/4 min-h-[160px] bg-slate-200 rounded-[2rem] p-6 shadow-inner flex flex-wrap content-start gap-4 justify-center z-20">
            {!isImpulseLocked && charBank.map((char) => {
                const isGuideActive = shouldGuideChar(char);
                const theme = char.isDistractor ? DISTRACTOR_THEME : getItemTheme(char.belongsToItemId);
                
                return (
                  <DraggableChar 
                      key={char.id}
                      char={char}
                      onDrop={handleDrop}
                      isMatched={false} 
                      isGuideActive={isGuideActive}
                      guideVector={isGuideActive ? guideVector : undefined}
                      theme={theme}
                  />
                );
            })}
            {charBank.length === 0 && !isGameComplete && (
                <div className="text-slate-500 font-bold text-xl mt-10">完成！</div>
            )}
        </div>
      </main>
    </div>
  );
};