import React, { useState, useRef } from 'react';

interface AudioRecorderProps {
  initialAudio?: string;
  onSave: (base64Audio: string | undefined) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ initialAudio, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(initialAudio);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setAudioUrl(base64);
          onSave(base64);
        };
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("無法存取麥克風，請確認權限設定。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const deleteAudio = () => {
    setAudioUrl(undefined);
    onSave(undefined);
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      {!isRecording && !audioUrl && (
        <button 
          onClick={startRecording}
          className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold hover:bg-red-200 transition"
        >
          ● 錄音
        </button>
      )}

      {isRecording && (
        <button 
          onClick={stopRecording}
          className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold animate-pulse"
        >
          ■ 停止
        </button>
      )}

      {audioUrl && !isRecording && (
        <>
          <button 
            onClick={playAudio}
            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold hover:bg-green-200 transition"
          >
            ▶ 播放
          </button>
          <button 
            onClick={deleteAudio}
            className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-red-500 transition"
            title="刪除錄音"
          >
            🗑️
          </button>
        </>
      )}
      <span className="text-[10px] text-slate-400">
        {isRecording ? '錄音中...' : (audioUrl ? '已錄製' : '未錄製 (使用系統語音)')}
      </span>
    </div>
  );
};
