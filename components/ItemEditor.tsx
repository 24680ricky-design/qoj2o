import React, { useState } from 'react';
import { Item } from '../types';
import { fileToBase64, compressImage } from '../services/imageService';
import { AudioRecorder } from './AudioRecorder';

interface ItemEditorProps {
  item: Item;
  onUpdate: (updatedItem: Item) => void;
  onDelete: () => void;
}

export const ItemEditor: React.FC<ItemEditorProps> = ({ item, onUpdate, onDelete }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessing(true);
      try {
        const rawBase64 = await fileToBase64(e.target.files[0]);
        // 壓縮圖片後再儲存
        const optimizedBase64 = await compressImage(rawBase64);
        onUpdate({ ...item, image: optimizedBase64 });
      } catch (err) {
        console.error("Image processing failed", err);
        alert("圖片處理失敗，請更換一張試試看。");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3 transition-opacity ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex gap-4 items-start">
        {/* Image Preview / Upload */}
        <div className="relative w-24 h-24 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-300">
          {item.image ? (
            <img src={item.image} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center p-1">
              {isProcessing ? '處理中...' : '無照片'}
            </div>
          )}
          
          <label className="absolute inset-0 bg-black/0 hover:bg-black/10 flex flex-col justify-end transition-all cursor-pointer">
            <div className="bg-black/50 backdrop-blur-sm text-white text-[10px] text-center py-1 w-full font-bold">
              {item.image ? '更換' : '上傳'}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        {/* Text Fields */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="名字 (如: 小明)" 
              value={item.name}
              onChange={(e) => onUpdate({ ...item, name: e.target.value })}
              className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none select-text text-sm"
            />
            <button 
              onClick={onDelete}
              className="px-2 py-1 text-red-500 hover:bg-red-50 rounded-lg transition"
              title="刪除"
            >
              🗑️
            </button>
          </div>
          
          <div className="flex flex-col gap-1">
            <input 
              type="text" 
              placeholder="提示語 (例如：戴著藍色眼鏡)" 
              value={item.hint}
              onChange={(e) => onUpdate({ ...item, hint: e.target.value })}
              className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-xs select-text"
            />
            {/* Audio Recorder Integration */}
            <AudioRecorder 
              initialAudio={item.audio} 
              onSave={(audio) => onUpdate({ ...item, audio })} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
