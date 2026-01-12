import { Collection, Settings, DEFAULT_SETTINGS, Item, GameLog } from '../types';

const STORAGE_KEY_COLLECTIONS = 'matching_king_collections';
const STORAGE_KEY_SETTINGS = 'matching_king_settings';
const STORAGE_KEY_ACTIVE_COLLECTION = 'matching_king_active_collection';
const STORAGE_KEY_LOGS = 'matching_king_logs';

const DEFAULT_COLLECTION: Collection = {
  id: 'default-class',
  name: '認識班上同學',
  items: [
    { id: '1', name: '小明', image: 'https://picsum.photos/id/1/300/300', hint: '戴著藍色眼鏡的男生' },
    { id: '2', name: '美美', image: 'https://picsum.photos/id/64/300/300', hint: '綁著馬尾的女生' },
    { id: '3', name: '阿豪', image: 'https://picsum.photos/id/103/300/300', hint: '笑得很開心的男生' },
  ]
};

export const getCollections = (): Collection[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_COLLECTIONS);
    return data ? JSON.parse(data) : [DEFAULT_COLLECTION];
  } catch (e) {
    console.error("Failed to load collections", e);
    return [DEFAULT_COLLECTION];
  }
};

export const saveCollections = (collections: Collection[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(collections));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      alert("儲存空間已滿！請嘗試刪除一些不必要的教材，或是減少照片/錄音數量。");
    }
    console.error("Save collections failed", e);
  }
};

export const getSettings = (): Settings => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: Settings) => {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error("Save settings failed", e);
  }
};

export const getActiveCollectionId = (): string => {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_COLLECTION) || 'default-class';
};

export const saveActiveCollectionId = (id: string) => {
  localStorage.setItem(STORAGE_KEY_ACTIVE_COLLECTION, id);
};

// --- Analytics Logs ---

export const getGameLogs = (): GameLog[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_LOGS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveGameLog = (log: GameLog) => {
  try {
    const currentLogs = getGameLogs();
    // Keep only last 50 logs to save space
    const newLogs = [log, ...currentLogs].slice(0, 50);
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(newLogs));
  } catch (e) {
    console.error("Failed to save log", e);
  }
};

export const clearGameLogs = () => {
    localStorage.removeItem(STORAGE_KEY_LOGS);
};
