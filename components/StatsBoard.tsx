import React from 'react';
import { GameLog, ScaffoldingLevel } from '../types';
import { clearGameLogs } from '../services/storageService';

interface StatsBoardProps {
  logs: GameLog[];
  onClose: () => void;
  onRefresh: () => void;
}

export const StatsBoard: React.FC<StatsBoardProps> = ({ logs, onClose, onRefresh }) => {
  const handleClear = () => {
    if(confirm('確定要清除所有紀錄嗎？')) {
        clearGameLogs();
        onRefresh();
    }
  };

  const getScaffoldName = (level: ScaffoldingLevel) => {
      switch(level) {
          case ScaffoldingLevel.NONE: return '獨立完成';
          case ScaffoldingLevel.VISUAL: return '視覺提示';
          case ScaffoldingLevel.AUDIO: return '語音提示';
          case ScaffoldingLevel.GUIDE: return '手勢引導';
          default: return '-';
      }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-800">📊 學習數據分析</h2>
          <div className="flex gap-2">
             <button onClick={handleClear} className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-bold">清除紀錄</button>
             <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold">關閉</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
           {logs.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <span className="text-4xl mb-4">📉</span>
                   <p>目前還沒有練習紀錄</p>
               </div>
           ) : (
               <table className="w-full text-left border-collapse">
                   <thead>
                       <tr className="bg-slate-100 text-slate-600 text-sm uppercase tracking-wider">
                           <th className="p-4 rounded-tl-xl">時間</th>
                           <th className="p-4">教材</th>
                           <th className="p-4 text-center">完成/總題</th>
                           <th className="p-4 text-center">錯誤次數</th>
                           <th className="p-4 text-center">平均反應 (秒)</th>
                           <th className="p-4 rounded-tr-xl">最終提示層級</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                       {logs.map((log, i) => (
                           <tr key={i} className="hover:bg-blue-50 transition">
                               <td className="p-4 text-sm text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                               <td className="p-4 font-bold text-slate-700">{log.collectionName}</td>
                               <td className="p-4 text-center font-mono">
                                   <span className="text-green-600 font-bold">{log.completedItems}</span>
                                   <span className="text-slate-400"> / {log.totalItems}</span>
                               </td>
                               <td className="p-4 text-center font-mono text-red-500">{log.mistakes}</td>
                               <td className="p-4 text-center font-mono">{log.averageTimePerItem.toFixed(1)}s</td>
                               <td className="p-4 text-sm">
                                   <span className={`px-2 py-1 rounded-full text-xs font-bold
                                       ${log.mostUsedScaffold === ScaffoldingLevel.NONE ? 'bg-green-100 text-green-700' : 
                                         log.mostUsedScaffold === ScaffoldingLevel.GUIDE ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                       }
                                   `}>
                                       {getScaffoldName(log.mostUsedScaffold)}
                                   </span>
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           )}
        </div>
      </div>
    </div>
  );
};
