export const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-TW';
  utterance.rate = 0.9; 
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const chineseVoice = voices.find(v => v.lang.includes('zh-TW') || v.lang.includes('zh-CN'));
  if (chineseVoice) {
    utterance.voice = chineseVoice;
  }

  window.speechSynthesis.speak(utterance);
};

/**
 * Plays a base64 encoded audio string
 */
export const playAudio = (base64Audio: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Cancel TTS if playing
    window.speechSynthesis.cancel();

    try {
      const audio = new Audio(base64Audio);
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play().catch(e => reject(e));
    } catch (e) {
      reject(e);
    }
  });
};

export const unlockAudio = () => {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance('');
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
};
