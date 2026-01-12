import React, { useState, useEffect } from 'react';
import { Collection, Settings, Item } from '../types';
import { ItemEditor } from '../components/ItemEditor';
import { StatsBoard } from '../components/StatsBoard';
import { getCollections, saveCollections, getSettings, saveSettings, saveActiveCollectionId, getGameLogs } from '../services/storageService';

interface TeacherViewProps {
  onStartGame: (collection: Collection, settings: Settings) => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({ onStartGame }) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string>('');
  const [settings, setSettings] = useState<Settings>(getSettings());
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const loadedCollections = getCollections();
    setCollections(loadedCollections);
    if (loadedCollections.length > 0) {
      setActiveCollectionId(loadedCollections[0].id);
    }
  }, []);

  useEffect(() => {
    if (collections.length > 0) {
        saveCollections(collections);
    }
  }, [collections]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const activeCollection = collections.find(c => c.id === activeCollectionId);

  const handleAddCollection = () => {
    const newCollection: Collection = {
      id: Date.now().toString(),
      name: '新教材集',
      items: []
    };
    setCollections([...collections, newCollection]);
    setActiveCollectionId(newCollection.id);
  };

  const handleDeleteCollection = (id: string) => {
    if (collections.length <= 1) {
      alert("至少需要保留一組教材");
      return;
    }
    if (confirm("確定要刪除這組教材嗎？")) {
      const newCols = collections.filter(c => c.id !== id);
      setCollections(newCols);
      setActiveCollectionId(newCols[0].id);
    }
  };

  const handleUpdateCollectionName = (name: string) => {
    setCollections(cols => cols.map(c => c.id === activeCollectionId ? { ...c, name } : c));
  };

  const handleAddItem = () => {
    if (!activeCollection) return;
    const newItem: Item = {
      id: Date.now().toString(),
      name: '',
      image: '',
      hint: ''
    };
    const updatedCollection = {
      ...activeCollection,
      items: [...activeCollection.items, newItem]
    };
    setCollections(cols => cols.map(c => c.id === activeCollectionId ? updatedCollection : c));
  };

  const handleUpdateItem = (updatedItem: Item) => {
    if (!activeCollection) return;
    const updatedItems = activeCollection.items.map(i => i.id === updatedItem.id ? updatedItem : i);
    setCollections(cols => cols.map(c => c.id === activeCollectionId ? { ...c, items: updatedItems } : c));
  };

  const handleDeleteItem = (itemId: string) => {
    if (!activeCollection) return;
    const updatedItems = activeCollection.items.filter(i => i.id !== itemId);
    setCollections(cols => cols.map(c => c.id === activeCollectionId ? { ...c, items: updatedItems } : c));
  };

  const handleStart = () => {
    if (activeCollection && activeCollection.items.length > 0) {
      saveActiveCollectionId(activeCollection.id);
      onStartGame(activeCollection, settings);
    } else {
      alert("請至少新增一個項目才能開始遊戲");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-8 font-sans">
      {showStats && (
          <StatsBoard 
             logs={getGameLogs()} 
             onClose={() => setShowStats(false)} 
             onRefresh={() => setShowStats(false)} 
          />
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar: Collection List & Settings */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="bg-blue-500 text-white p-2 rounded-lg text-sm">教</span>
              配對王
            </h1>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-500 text-sm uppercase">教材列表</h3>
                <button onClick={handleAddCollection} className="text-blue-500 hover:bg-blue-50 p-1 rounded">
                  + 新增
                </button>
              </div>
              <ul className="space-y-2">
                {collections.map(col => (
                  <li 
                    key={col.id}
                    onClick={() => setActiveCollectionId(col.id)}
                    className={`
                      p-3 rounded-xl cursor-pointer transition flex justify-between items-center group
                      ${col.id === activeCollectionId ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}
                    `}
                  >
                    <span>{col.name}</span>
                    {collections.length > 1 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col.id); }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 px-2"
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            <button 
               onClick={() => setShowStats(true)}
               className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-bold transition mb-4"
             >
               📊 檢視學習數據
             </button>

            <div className="border-t pt-4">
               <button 
                 onClick={() => setIsEditingSettings(!isEditingSettings)}
                 className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition mb-2"
               >
                 ⚙️ 遊戲設定
               </button>
               
               {isEditingSettings && (
                 <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
                    <label className="block text-sm">
                      <span className="text-slate-600">衝動控制 (秒): {settings.impulseTime}</span>
                      <input type="range" min="0" max="5" step="0.5" 
                        value={settings.impulseTime} 
                        onChange={e => setSettings({...settings, impulseTime: Number(e.target.value)})} 
                        className="w-full accent-blue-500"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-slate-600">閃爍提示 (秒): {settings.delayFlash}</span>
                      <input type="range" min="1" max="10" 
                        value={settings.delayFlash} 
                        onChange={e => setSettings({...settings, delayFlash: Number(e.target.value)})} 
                        className="w-full accent-yellow-400"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-slate-600">語音提示 (秒): {settings.delayHint}</span>
                      <input type="range" min="5" max="20" 
                        value={settings.delayHint} 
                        onChange={e => setSettings({...settings, delayHint: Number(e.target.value)})} 
                        className="w-full accent-green-500"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-slate-600">手勢引導 (秒): {settings.delayGuide}</span>
                      <input type="range" min="10" max="30" 
                        value={settings.delayGuide} 
                        onChange={e => setSettings({...settings, delayGuide: Number(e.target.value)})} 
                        className="w-full accent-purple-500"
                      />
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-red-50 p-2 rounded-lg">
                      <input type="checkbox" 
                        checked={settings.errorlessMode}
                        onChange={e => setSettings({...settings, errorlessMode: e.target.checked})}
                        className="w-4 h-4 rounded text-red-500"
                      />
                      <span className="text-sm font-bold text-red-700">啟用無錯誤學習</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" 
                        checked={settings.showDistractors}
                        onChange={e => setSettings({...settings, showDistractors: e.target.checked})}
                        className="w-4 h-4 rounded text-blue-500"
                      />
                      <span className="text-sm text-slate-700">啟用干擾字卡</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" 
                        checked={settings.displayMode === 'multi'}
                        onChange={e => setSettings({...settings, displayMode: e.target.checked ? 'multi' : 'single'})}
                        className="w-4 h-4 rounded text-blue-500"
                      />
                      <span className="text-sm text-slate-700">多題同時顯示 (大螢幕)</span>
                    </label>
                    <label className="block text-sm">
                      <span className="text-slate-600">集滿幾顆星獎勵: {settings.requiredStars}</span>
                      <input type="number" min="1" max="20"
                        value={settings.requiredStars}
                        onChange={e => setSettings({...settings, requiredStars: Number(e.target.value)})}
                        className="w-full p-1 border rounded"
                      />
                    </label>
                 </div>
               )}
            </div>
          </div>
        </aside>

        {/* Right Content: Active Collection Editor */}
        <main className="lg:col-span-9 flex flex-col gap-6">
          {activeCollection ? (
            <>
              {/* Header */}
              <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <input 
                  type="text" 
                  value={activeCollection.name}
                  onChange={(e) => handleUpdateCollectionName(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-blue-500 outline-none px-2 py-1 w-full md:w-auto transition"
                />
                <button 
                  onClick={handleStart}
                  className="bg-green-500 hover:bg-green-600 text-white text-lg font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition transform active:scale-95 flex items-center gap-2"
                >
                  ▶ 開始上課
                </button>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
                {activeCollection.items.map(item => (
                  <ItemEditor 
                    key={item.id} 
                    item={item} 
                    onUpdate={handleUpdateItem} 
                    onDelete={() => handleDeleteItem(item.id)}
                  />
                ))}
                
                {/* Add New Item Button */}
                <button 
                  onClick={handleAddItem}
                  className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-200 hover:border-slate-400 transition min-h-[160px] text-slate-500"
                >
                  <span className="text-4xl">+</span>
                  <span className="font-bold">新增同學 / 物品</span>
                </button>
              </div>
            </>
          ) : (
             <div className="flex items-center justify-center h-full text-slate-400">
               請選擇或建立一組教材
             </div>
          )}
        </main>

      </div>
    </div>
  );
};
