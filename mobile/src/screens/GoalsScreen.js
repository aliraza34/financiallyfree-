import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  COLORS, loadSettings, saveSettings, loadChecklist, saveChecklist, fmtAmt,
} from '../data';

const CHECKLIST_ITEMS = [
  { text: 'Write down exact monthly income vs outgoings', sub: 'One page, no guessing' },
  { text: 'Identify your biggest unnecessary outflow', sub: 'And cut or reduce it' },
  { text: 'Automate a savings transfer on payday', sub: 'Even ₨5,000 counts — start the habit' },
  { text: 'Define your "enough" number', sub: 'What monthly income feels like freedom to you' },
];

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState({ currency: '₨', income: 0, freedom: 0, savingsGoal: 0, savings: 0 });
  const [checklist, setChecklist] = useState([false, false, false, false]);
  const [modalVisible, setModalVisible] = useState(false);
  const [savingsInput, setSavingsInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const [s, c] = await Promise.all([loadSettings(), loadChecklist()]);
        if (!active) return;
        setSettings(s);
        setChecklist(c);
      }
      load();
      return () => { active = false; };
    }, [])
  );

  const sym = settings.currency || '₨';
  const fn = settings.freedom || 0;
  const income = settings.income || 0;
  const gap = fn - income;
  const saved = settings.savings || 0;
  const goal = settings.savingsGoal || 0;
  const savingsPct = goal > 0 ? Math.min(100, Math.round((saved / goal) * 100)) : 0;
  const doneCount = checklist.filter(Boolean).length;

  async function toggleCheck(i) {
    const updated = [...checklist];
    updated[i] = !updated[i];
    setChecklist(updated);
    await saveChecklist(updated);
  }

  async function saveSavings() {
    const v = parseFloat(savingsInput);
    if (isNaN(v) || v < 0) {
      Alert.alert('Invalid', 'Enter a valid amount');
      return;
    }
    const updated = { ...settings, savings: v };
    setSettings(updated);
    await saveSettings(updated);
    setModalVisible(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Goals</Text>
        <Text style={styles.headerSub}>Track your path to financial freedom</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* Freedom number */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>FREEDOM NUMBER</Text>
          <View style={styles.freedomHero}>
            <Text style={styles.freedomBig}>{fn ? `${sym}${fmtAmt(fn)}` : '—'}</Text>
            <Text style={styles.freedomLabel}>monthly passive income goal</Text>
          </View>
          <View style={styles.divider} />
          {fn && income ? (
            gap > 0 ? (
              <Text style={styles.freedomSub}>
                You need <Text style={{ color: COLORS.warn }}>{sym}{fmtAmt(gap)}</Text> more/month to be free.
                Every expense you cut is a step closer.
              </Text>
            ) : (
              <Text style={[styles.freedomSub, { color: COLORS.accent }]}>
                Your income already meets your freedom number! 🎉 Now protect and grow it.
              </Text>
            )
          ) : (
            <Text style={styles.freedomSub}>
              Set your income &amp; freedom number in the Setup tab to see your gap.
            </Text>
          )}
        </View>

        {/* Savings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SAVINGS PROGRESS</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Saved</Text>
              <Text style={[styles.statVal, { color: COLORS.accent }]}>{sym}{fmtAmt(saved)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Goal</Text>
              <Text style={[styles.statVal, { color: '#a78bfa' }]}>{sym}{fmtAmt(goal)}</Text>
            </View>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={[styles.progressLabel, { color: COLORS.accent }]}>{savingsPct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${savingsPct}%` }]} />
          </View>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary, { marginTop: 14 }]}
            onPress={() => { setSavingsInput(String(saved || '')); setModalVisible(true); }}
            activeOpacity={0.85}
          >
            <Text style={styles.btnSecondaryText}>Update Savings Amount</Text>
          </TouchableOpacity>
        </View>

        {/* Checklist */}
        <View style={styles.card}>
          <View style={styles.checklistHeader}>
            <Text style={styles.cardTitle}>CLARITY CHECKLIST</Text>
            <Text style={styles.checkCount}>{doneCount}/4 done</Text>
          </View>
          {CHECKLIST_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.checkItem, i === CHECKLIST_ITEMS.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => toggleCheck(i)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkCircle, checklist[i] && styles.checkCircleDone]}>
                {checklist[i] && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.checkText, checklist[i] && styles.checkTextDone]}>{item.text}</Text>
                <Text style={styles.checkSub}>{item.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Savings modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Update Savings</Text>
            <Text style={styles.label}>Current savings amount ({sym})</Text>
            <TextInput
              style={styles.input}
              value={savingsInput}
              onChangeText={setSavingsInput}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={COLORS.muted}
              autoFocus
            />
            <TouchableOpacity style={styles.btn} onPress={saveSavings} activeOpacity={0.85}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  card: {
    backgroundColor: COLORS.surface2,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 11, fontWeight: '700', color: COLORS.muted, letterSpacing: 1, marginBottom: 14 },
  freedomHero: { alignItems: 'center', paddingVertical: 10 },
  freedomBig: { fontSize: 50, fontWeight: '900', color: COLORS.accent, lineHeight: 56 },
  freedomLabel: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  freedomSub: { fontSize: 14, color: COLORS.muted, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: COLORS.surface3, borderRadius: 12, padding: 14 },
  statLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '600' },
  statVal: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: COLORS.muted },
  track: { height: 8, backgroundColor: COLORS.surface3, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: COLORS.accent, borderRadius: 4 },
  btn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#0a0a0a', fontSize: 16, fontWeight: '700' },
  btnSecondary: { backgroundColor: COLORS.surface3, borderWidth: 1, borderColor: COLORS.border },
  btnSecondaryText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  checkCount: { fontSize: 12, color: COLORS.accent, fontWeight: '700' },
  checkItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'flex-start',
  },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkCircleDone: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  checkMark: { color: '#0a0a0a', fontSize: 13, fontWeight: '800' },
  checkText: { fontSize: 14, fontWeight: '600', color: COLORS.text, lineHeight: 20 },
  checkTextDone: { textDecorationLine: 'line-through', color: COLORS.muted },
  checkSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 24,
    paddingBottom: 40,
  },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 18 },
  label: { fontSize: 12, color: COLORS.muted, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: COLORS.surface3,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 14,
  },
});
