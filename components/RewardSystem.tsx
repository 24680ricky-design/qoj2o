import React from 'react';

interface RewardSystemProps {
  currentStars: number;
  totalRequired: number;
  showReward: boolean;
  onRewardClose: () => void;
}

export const RewardSystem: React.FC<RewardSystemProps> = ({ currentStars, totalRequired, showReward, onRewardClose }) => {
  return (
    <>
      {/* Star Counter - Always Visible */}
      <div className="fixed top-24 right-4 z-40 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border-2 border-yellow-300 flex items-center gap-2">
         <span className="text-yellow-500 text-2xl">⭐</span>
         <div className="flex flex-col leading-none">
             <span className="text-xs font-bold text-slate-500 uppercase">集點卡</span>
             <span className="text-xl font-bold text-slate-800">{currentStars} / {totalRequired}</span>
         </div>
      </div>

      {/* Reward Modal */}
      {showReward && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm">
             {/* Confetti CSS */}
             <style>{`
                .confetti {
                  position: absolute;
                  width: 10px; height: 10px;
                  background-color: #f00;
                  animation: fall linear forwards;
                }
                @keyframes fall {
                  to { transform: translateY(100vh) rotate(720deg); }
                }
             `}</style>
             {Array.from({ length: 50 }).map((_, i) => (
                <div key={i} className="confetti" style={{
                    left: `${Math.random() * 100}vw`,
                    top: `-10px`,
                    backgroundColor: ['#ff0', '#f00', '#0f0', '#00f', '#f0f'][Math.floor(Math.random() * 5)],
                    animationDuration: `${Math.random() * 3 + 2}s`,
                    animationDelay: `${Math.random() * 2}s`
                }} />
             ))}

             <div className="bg-white p-8 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 animate-bounce-target max-w-sm mx-4 text-center relative z-10">
                 <div className="text-8xl">🎁</div>
                 <h2 className="text-4xl font-bold text-slate-800">集滿了！</h2>
                 <p className="text-slate-500 text-lg">你太棒了，獲得超級大獎勵！</p>
                 <button 
                   onClick={onRewardClose}
                   className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-8 py-3 rounded-full text-xl font-bold shadow-lg transform active:scale-95 transition"
                 >
                   繼續加油
                 </button>
             </div>
        </div>
      )}
    </>
  );
};
