import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  COLORS, loadSettings, saveSettings, clearAll,
} from '../data';
import { scheduleDailyReminder, requestNotificationPermission } from '../notifications';

const CURRENCIES = ['₨', '£', '$', '€', 'AED'];

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const [income, setIncome] = useState('');
  const [budget, setBudget] = useState('');
  const [freedom, setFreedom] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [currency, setCurrency] = useState('₨');
  const [notifHour, setNotifHour] = useState('21');
  const [notifMinute, setNotifMinute] = useState('00');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const s = await loadSettings();
        if (!active) return;
        setIncome(s.income ? String(s.income) : '');
        setBudget(s.budget ? String(s.budget) : '');
        setFreedom(s.freedom ? String(s.freedom) : '');
        setSavingsGoal(s.savingsGoal ? String(s.savingsGoal) : '');
        setCurrency(s.currency || '₨');
        setNotifHour(String(s.notifHour ?? 21));
        setNotifMinute(String(s.notifMinute ?? 0).padStart(2, '0'));
      }
      load();
      return () => { active = false; };
    }, [])
  );

  async function handleSave() {
    const hour = parseInt(notifHour, 10);
    const minute = parseInt(notifMinute, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      Alert.alert('Invalid hour', 'Enter a valid hour (0–23)');
      return;
    }
    if (isNaN(minute) || minute < 0 || minute > 59) {
      Alert.alert('Invalid minute', 'Enter a valid minute (0–59)');
      return;
    }

    const existing = await loadSettings();
    const updated = {
      ...existing,
      currency,
      income:      parseFloat(income) || 0,
      budget:      parseFloat(budget) || 0,
      freedom:     parseFloat(freedom) || 0,
      savingsGoal: parseFloat(savingsGoal) || 0,
      notifHour:   hour,
      notifMinute: minute,
    };
    await saveSettings(updated);

    if (notifEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        await scheduleDailyReminder(hour, minute);
      } else {
        Alert.alert(
          'Notifications blocked',
          'Enable notifications for this app in your phone settings to get daily reminders.'
        );
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleClearAll() {
    Alert.alert(
      'Clear all data',
      'This will permanently delete all your expenses and settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything', style: 'destructive',
          onPress: async () => {
            await clearAll();
            setIncome(''); setBudget(''); setFreedom(''); setSavingsGoal('');
            setCurrency('₨'); setNotifHour('21'); setNotifMinute('00');
            Alert.alert('Done', 'All data cleared.');
          },
        },
      ]
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Setup</Text>
        <Text style={styles.headerSub}>Configure your personal targets</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* Currency */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CURRENCY</Text>
          <View style={styles.currencyRow}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.currencyPill, currency === c && styles.currencyPillOn]}
                onPress={() => setCurrency(c)}
                activeOpacity={0.75}
              >
                <Text style={[styles.currencyText, currency === c && styles.currencyTextOn]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Numbers */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>YOUR NUMBERS</Text>

          <Text style={styles.label}>Monthly Income ({currency})</Text>
          <TextInput
            style={styles.input}
            value={income}
            onChangeText={setIncome}
            placeholder="e.g. 80000"
            placeholderTextColor={COLORS.muted}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Monthly Spending Budget ({currency})</Text>
          <TextInput
            style={styles.input}
            value={budget}
            onChangeText={setBudget}
            placeholder="e.g. 50000"
            placeholderTextColor={COLORS.muted}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Freedom Number — monthly passive income goal ({currency})</Text>
          <TextInput
            style={styles.input}
            value={freedom}
            onChangeText={setFreedom}
            placeholder="e.g. 200000"
            placeholderTextColor={COLORS.muted}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Savings Goal — total target ({currency})</Text>
          <TextInput
            style={styles.input}
            value={savingsGoal}
            onChangeText={setSavingsGoal}
            placeholder="e.g. 1000000"
            placeholderTextColor={COLORS.muted}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Notifications */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>DAILY REMINDER</Text>
          <View style={styles.notifToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifToggleLabel}>Remind me every day</Text>
              <Text style={styles.notifToggleSub}>Notification to log your spending</Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ false: COLORS.surface3, true: COLORS.accent }}
              thumbColor={COLORS.text}
            />
          </View>

          {notifEnabled && (
            <View style={styles.timeRow}>
              <View style={styles.timeGroup}>
                <Text style={styles.label}>Hour (0–23)</Text>
                <TextInput
                  style={styles.input}
                  value={notifHour}
                  onChangeText={setNotifHour}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="21"
                  placeholderTextColor={COLORS.muted}
                />
              </View>
              <Text style={styles.timeSep}>:</Text>
              <View style={styles.timeGroup}>
                <Text style={styles.label}>Minute (0–59)</Text>
                <TextInput
                  style={styles.input}
                  value={notifMinute}
                  onChangeText={setNotifMinute}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor={COLORS.muted}
                />
              </View>
            </View>
          )}
          <Text style={styles.notifHint}>
            {notifEnabled
              ? `You'll be reminded at ${notifHour.padStart(2,'0')}:${notifMinute.padStart(2,'0')} every day`
              : 'Daily reminder is off'}
          </Text>
        </View>

        {/* Save */}
        <View style={{ marginHorizontal: 16, marginTop: 16 }}>
          <TouchableOpacity
            style={[styles.btn, saved && styles.btnSaved]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{saved ? '✓ Saved!' : 'Save Settings'}</Text>
          </TouchableOpacity>
        </View>

        {/* Danger */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>DANGER ZONE</Text>
          <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleClearAll} activeOpacity={0.85}>
            <Text style={[styles.btnText, { color: '#fff' }]}>Clear All Data</Text>
          </TouchableOpacity>
        </View>

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
  currencyRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  currencyPill: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: COLORS.surface3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currencyPillOn: { borderColor: COLORS.accent, backgroundColor: 'rgba(0,200,150,0.1)' },
  currencyText: { color: COLORS.muted, fontWeight: '700', fontSize: 15 },
  currencyTextOn: { color: COLORS.accent },
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
  notifToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifToggleLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  notifToggleSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 6 },
  timeGroup: { flex: 1 },
  timeSep: { color: COLORS.muted, fontSize: 24, fontWeight: '700', paddingBottom: 12 },
  notifHint: { fontSize: 12, color: COLORS.muted, marginTop: 10, fontStyle: 'italic' },
  btn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnSaved: { backgroundColor: '#16a34a' },
  btnDanger: { backgroundColor: COLORS.danger },
  btnText: { color: '#0a0a0a', fontSize: 16, fontWeight: '700' },
});
