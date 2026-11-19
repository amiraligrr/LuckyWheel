export type Language = "fa" | "en";

export interface WheelItem {
  id: string;
  name: string;
  weight: number;
  color: string;
}

export interface Wheel {
  id: string;
  name: string;
  items: WheelItem[];
  createdAt: number;
  updatedAt: number;
}

export interface HistoryEntry {
  id: string;
  wheelId: string;
  wheelName: string;
  itemName: string;
  color: string;
  timestamp: number;
}

export interface AppSettings {
  language: Language;
}

export interface AppData {
  version: 1;
  wheels: Wheel[];
  activeWheelId: string;
  history: HistoryEntry[];
  settings: AppSettings;
}

export interface Result {
  wheelName: string;
  item: WheelItem;
  probability: number;
  timestamp: number;
}
