import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  CATEGORIES, COLORS, loadSettings, loadExpenses, saveExpenses,
  formatDayLabel, getCat, fmtAmt,
} from '../data';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState({ currency: '₨', budget: 0 });
  const [expenses, setExpenses] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const [s, e] = await Promise.all([loadSettings(), loadExpenses()]);
        if (!active) return;
        setSettings(s);
        setExpenses(e);
      }
      load();
      return () => { active = false; };
    }, [])
  );

  const sym = settings.currency || '₨';
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthExp = expenses.filter(e => new Date(e.date + 'T12:00:00') >= monthStart);
  const monthTotal = monthExp.reduce((s, e) => s + e.amount, 0);
  const daysLogged = new Set(monthExp.map(e => e.date)).size;
  const dailyAvg = daysLogged > 0 ? monthTotal / daysLogged : 0;
  const remaining = (settings.budget || 0) - monthTotal;

  const catTotals = {};
  CATEGORIES.forEach(c => { catTotals[c.id] = 0; });
  monthExp.forEach(e => { catTotals[e.cat] = (catTotals[e.cat] || 0) + e.amount; });
  const maxCat = Math.max(...Object.values(catTotals), 1);
  const activeCats = CATEGORIES.filter(c => catTotals[c.id] > 0)
    .sort((a, b) => catTotals[b.id] - catTotals[a.id]);

  const byDay = {};
  expenses.forEach(e => {
    if (!byDay[e.date]) byDay[e.date] = [];
    byDay[e.date].push(e);
  });
  const sortedDays = Object.keys(byDay).sort((a, b) => b.localeCompare(a));

  async function deleteExpense(id) {
    Alert.alert('Delete expense', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const updated = expenses.filter(e => e.id !== id);
          setExpenses(updated);
          await saveExpenses(updated);
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSub}>
          {now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Monthly stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>THIS MONTH</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={[styles.statVal, { color: COLORS.danger }]}>{sym}{fmtAmt(monthTotal)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Daily Avg</Text>
              <Text style={[styles.statVal, { color: COLORS.warn }]}>{sym}{fmtAmt(dailyAvg)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={[styles.statVal, { color: remaining < 0 ? COLORS.danger : COLORS.accent }]}>
                {remaining < 0 ? '-' : ''}{sym}{fmtAmt(Math.abs(remaining))}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Days Logged</Text>
              <Text style={[styles.statVal, { color: '#a78bfa' }]}>{daysLogged}</Text>
            </View>
          </View>
        </View>

        {/* Category breakdown */}
        {activeCats.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>BY CATEGORY</Text>
            {activeCats.map(c => (
              <View key={c.id} style={styles.catRow}>
                <Text style={styles.catEmoji}>{c.emoji}</Text>
                <View style={styles.catTrack}>
                  <View
                    style={[styles.catFill, { width: `${Math.round(catTotals[c.id] / maxCat * 100)}%` }]}
                  />
                </View>
                <Text style={styles.catAmt}>{sym}{fmtAmt(catTotals[c.id])}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Day groups */}
        {sortedDays.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 44 }}>📅</Text>
            <Text style={styles.emptyText}>No expenses logged yet</Text>
          </View>
        ) : (
          sortedDays.map(day => {
            const dayExp = byDay[day];
            const dayTotal = dayExp.reduce((s, e) => s + e.amount, 0);
            return (
              <View key={day} style={styles.card}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayDate}>{formatDayLabel(day)}</Text>
                  <Text style={styles.dayTotal}>{sym}{fmtAmt(dayTotal)}</Text>
                </View>
                {[...dayExp].reverse().map((exp, i) => (
                  <View key={exp.id} style={[styles.expRow, i === dayExp.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.expIcon}>
                      <Text style={{ fontSize: 20 }}>{getCat(exp.cat).emoji}</Text>
                    </View>
                    <View style={styles.expInfo}>
                      <Text style={styles.expName} numberOfLines={1}>{exp.name}</Text>
                      <Text style={styles.expCat}>{getCat(exp.cat).label}</Text>
                      {exp.note ? <Text style={styles.expNote} numberOfLines={1}>{exp.note}</Text> : null}
                    </View>
                    <Text style={styles.expAmt}>{sym}{fmtAmt(exp.amount)}</Text>
                    <TouchableOpacity onPress={() => deleteExpense(exp.id)} style={styles.delBtn}>
                      <Text style={{ color: COLORS.muted, fontSize: 20, lineHeight: 24 }}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '44%', backgroundColor: COLORS.surface3, borderRadius: 12, padding: 14 },
  statLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '600' },
  statVal: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  catEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  catTrack: { flex: 1, height: 10, backgroundColor: COLORS.surface3, borderRadius: 5, overflow: 'hidden' },
  catFill: { height: 10, backgroundColor: COLORS.accent, borderRadius: 5 },
  catAmt: { fontSize: 12, color: COLORS.muted, width: 70, textAlign: 'right' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: COLORS.muted, fontSize: 15 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dayDate: { fontSize: 13, fontWeight: '700', color: COLORS.muted },
  dayTotal: { fontSize: 15, fontWeight: '700', color: COLORS.danger },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  expIcon: {
    width: 38, height: 38,
    backgroundColor: COLORS.surface3,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expInfo: { flex: 1, minWidth: 0 },
  expName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  expCat: { fontSize: 11, color: COLORS.muted },
  expNote: { fontSize: 10, color: COLORS.muted, fontStyle: 'italic' },
  expAmt: { fontSize: 14, fontWeight: '700', color: COLORS.danger, flexShrink: 0 },
  delBtn: { padding: 4 },
});
