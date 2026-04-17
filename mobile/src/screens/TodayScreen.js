import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, Vibration,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  CATEGORIES, COLORS, loadSettings, loadExpenses, saveExpenses,
  todayStr, getCat, getStreak, fmtAmt,
} from '../data';

const { width: SCREEN_W } = Dimensions.get('window');
const CAT_W = (SCREEN_W - 32 - 36 - 24) / 4;

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState({ currency: '₨', budget: 0 });
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [selectedCat, setSelectedCat] = useState('food');
  const [streak, setStreak] = useState(0);
  const nameRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const [s, e] = await Promise.all([loadSettings(), loadExpenses()]);
        if (!active) return;
        setSettings(s);
        setExpenses(e);
        setStreak(getStreak(e));
      }
      load();
      return () => { active = false; };
    }, [])
  );

  const today = todayStr();
  const sym = settings.currency || '₨';
  const todayExp = expenses.filter(e => e.date === today);
  const total = todayExp.reduce((s, e) => s + e.amount, 0);
  const budget = settings.budget || 0;
  const pct = budget > 0 ? Math.min(100, (total / budget) * 100) : 0;
  const barColor = pct >= 90 ? COLORS.danger : pct >= 70 ? COLORS.warn : COLORS.accent;

  async function addExpense() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Missing description', 'What did you spend on?');
      return;
    }

    const exp = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: today,
      amount: amt,
      name: name.trim(),
      cat: selectedCat,
      note: note.trim(),
      ts: Date.now(),
    };

    const updated = [...expenses, exp];
    setExpenses(updated);
    await saveExpenses(updated);
    setStreak(getStreak(updated));

    setAmount('');
    setName('');
    setNote('');
    setSelectedCat('food');
    if (Platform.OS !== 'web') Vibration.vibrate(40);
  }

  async function deleteExpense(id) {
    Alert.alert('Delete expense', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const updated = expenses.filter(e => e.id !== id);
          setExpenses(updated);
          await saveExpenses(updated);
          setStreak(getStreak(updated));
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.headerTitle}>
            Financially<Text style={styles.headerAccent}>Free</Text>
          </Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 {streak} {streak === 1 ? 'day' : 'days'}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>TODAY'S SPENDING</Text>
          <Text style={styles.totalAmt}>{sym} {fmtAmt(total)}</Text>
          <Text style={styles.todayMeta}>
            {todayExp.length === 0
              ? 'Nothing logged yet'
              : `${todayExp.length} expense${todayExp.length === 1 ? '' : 's'} today`}
          </Text>
          {budget > 0 && (
            <View style={styles.progressWrap}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Budget: {sym}{fmtAmt(budget)}</Text>
                <Text style={[styles.progressLabel, { color: barColor }]}>{Math.round(pct)}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
              </View>
            </View>
          )}
        </View>

        {/* Add form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>LOG AN EXPENSE</Text>

          <Text style={styles.label}>Amount ({sym})</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={COLORS.muted}
            keyboardType="decimal-pad"
            returnKeyType="next"
            onSubmitEditing={() => nameRef.current?.focus()}
          />

          <Text style={styles.label}>What was it?</Text>
          <TextInput
            ref={nameRef}
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Lunch, Rickshaw, Groceries..."
            placeholderTextColor={COLORS.muted}
            maxLength={60}
            returnKeyType="done"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catPill, { width: CAT_W }, selectedCat === c.id && styles.catPillOn]}
                onPress={() => setSelectedCat(c.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.catEmoji}>{c.emoji}</Text>
                <Text style={[styles.catLabel, selectedCat === c.id && { color: COLORS.accent }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={note}
            onChangeText={setNote}
            placeholder="Any extra detail..."
            placeholderTextColor={COLORS.muted}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.btn} onPress={addExpense} activeOpacity={0.85}>
            <Text style={styles.btnText}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        {/* Today's list */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>TODAY'S LOG</Text>
          {todayExp.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 40 }}>👋</Text>
              <Text style={styles.emptyText}>Log your first expense above</Text>
            </View>
          ) : (
            [...todayExp].reverse().map((exp, i) => (
              <View key={exp.id} style={[styles.expRow, i === todayExp.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.expIcon}>
                  <Text style={{ fontSize: 22 }}>{getCat(exp.cat).emoji}</Text>
                </View>
                <View style={styles.expInfo}>
                  <Text style={styles.expName} numberOfLines={1}>{exp.name}</Text>
                  <Text style={styles.expCat}>{getCat(exp.cat).label}</Text>
                  {exp.note ? <Text style={styles.expNote} numberOfLines={1}>{exp.note}</Text> : null}
                </View>
                <Text style={styles.expAmt}>{sym}{fmtAmt(exp.amount)}</Text>
                <TouchableOpacity onPress={() => deleteExpense(exp.id)} style={styles.delBtn}>
                  <Text style={{ color: COLORS.muted, fontSize: 22, lineHeight: 26 }}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  headerAccent: { color: COLORS.accent },
  headerDate: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  streakBadge: { backgroundColor: '#7c3aed', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  streakText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  scroll: { flex: 1 },
  card: {
    backgroundColor: COLORS.surface2,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 11, fontWeight: '700', color: COLORS.muted, letterSpacing: 1, marginBottom: 12 },
  totalAmt: { fontSize: 44, fontWeight: '900', color: COLORS.text, lineHeight: 50 },
  todayMeta: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  progressWrap: { marginTop: 14 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: COLORS.muted },
  track: { height: 8, backgroundColor: COLORS.surface3, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  label: { fontSize: 12, color: COLORS.muted, fontWeight: '600', marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface3,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 16,
  },
  textarea: { height: 70 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.surface3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  catPillOn: { borderColor: COLORS.accent, backgroundColor: 'rgba(0,200,150,0.1)' },
  catEmoji: { fontSize: 20 },
  catLabel: { fontSize: 9, color: COLORS.muted, fontWeight: '600', marginTop: 3 },
  btn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  btnText: { color: '#0a0a0a', fontSize: 16, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  emptyText: { color: COLORS.muted, fontSize: 14 },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  expIcon: {
    width: 42, height: 42,
    backgroundColor: COLORS.surface3,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expInfo: { flex: 1, minWidth: 0 },
  expName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  expCat: { fontSize: 12, color: COLORS.muted },
  expNote: { fontSize: 11, color: COLORS.muted, fontStyle: 'italic' },
  expAmt: { fontSize: 15, fontWeight: '700', color: COLORS.danger, flexShrink: 0 },
  delBtn: { padding: 4 },
});
