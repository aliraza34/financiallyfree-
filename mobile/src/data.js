import AsyncStorage from '@react-native-async-storage/async-storage';

export const CATEGORIES = [
  { id: 'food',    emoji: '🍔', label: 'Food' },
  { id: 'coffee',  emoji: '☕', label: 'Coffee' },
  { id: 'travel',  emoji: '🚗', label: 'Travel' },
  { id: 'grocery', emoji: '🛒', label: 'Grocery' },
  { id: 'bills',   emoji: '💡', label: 'Bills' },
  { id: 'health',  emoji: '💊', label: 'Health' },
  { id: 'shop',    emoji: '🛍️', label: 'Shopping' },
  { id: 'other',   emoji: '📌', label: 'Other' },
];

export const COLORS = {
  bg:       '#0a0a0a',
  surface:  '#141414',
  surface2: '#1e1e1e',
  surface3: '#282828',
  accent:   '#00c896',
  accent2:  '#7c3aed',
  danger:   '#ef4444',
  warn:     '#f59e0b',
  text:     '#f5f5f5',
  muted:    '#888888',
  border:   '#2a2a2a',
};

const KEYS = {
  settings:  'ff_settings',
  expenses:  'ff_expenses',
  checklist: 'ff_checklist',
};

const DEFAULT_SETTINGS = {
  currency:    '₨',
  income:      0,
  budget:      0,
  freedom:     0,
  savingsGoal: 0,
  savings:     0,
  notifHour:   21,
  notifMinute: 0,
};

export async function loadSettings() {
  const v = await AsyncStorage.getItem(KEYS.settings);
  return v ? { ...DEFAULT_SETTINGS, ...JSON.parse(v) } : { ...DEFAULT_SETTINGS };
}

export async function saveSettings(s) {
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(s));
}

export async function loadExpenses() {
  const v = await AsyncStorage.getItem(KEYS.expenses);
  return v ? JSON.parse(v) : [];
}

export async function saveExpenses(e) {
  await AsyncStorage.setItem(KEYS.expenses, JSON.stringify(e));
}

export async function loadChecklist() {
  const v = await AsyncStorage.getItem(KEYS.checklist);
  return v ? JSON.parse(v) : [false, false, false, false];
}

export async function saveChecklist(c) {
  await AsyncStorage.setItem(KEYS.checklist, JSON.stringify(c));
}

export async function clearAll() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDayLabel(str) {
  const d = new Date(str + 'T12:00:00');
  const today = todayStr();
  const yDate = new Date(Date.now() - 86400000);
  const yesterday = dateStr(yDate);
  if (str === today) return 'Today';
  if (str === yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function fmtAmt(n) {
  return Math.round(n).toLocaleString('en-US');
}

export function getCat(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[7];
}

export function getStreak(expenses) {
  const days = new Set(expenses.map(e => e.date));
  let streak = 0;
  const d = new Date();
  while (true) {
    const s = dateStr(d);
    if (days.has(s)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
