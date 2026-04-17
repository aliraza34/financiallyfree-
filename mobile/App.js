import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { loadSettings } from './src/data';
import { scheduleDailyReminder, requestNotificationPermission } from './src/notifications';
import TodayScreen from './src/screens/TodayScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import SetupScreen from './src/screens/SetupScreen';

const Tab = createBottomTabNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const TAB_ICONS = {
  Today:   'time-outline',
  History: 'calendar-outline',
  Goals:   'trending-up-outline',
  Setup:   'settings-outline',
};

export default function App() {
  useEffect(() => {
    async function setup() {
      const granted = await requestNotificationPermission();
      if (granted) {
        const s = await loadSettings();
        await scheduleDailyReminder(s.notifHour ?? 21, s.notifMinute ?? 0);
      }
    }
    setup();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#141414',
              borderTopColor: '#2a2a2a',
              borderTopWidth: 1,
              height: Platform.OS === 'ios' ? 82 : 62,
              paddingBottom: Platform.OS === 'ios' ? 22 : 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: '#00c896',
            tabBarInactiveTintColor: '#888888',
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            tabBarIcon: ({ color }) => (
              <Ionicons name={TAB_ICONS[route.name]} size={22} color={color} />
            ),
          })}
        >
          <Tab.Screen name="Today"   component={TodayScreen} />
          <Tab.Screen name="History" component={HistoryScreen} />
          <Tab.Screen name="Goals"   component={GoalsScreen} />
          <Tab.Screen name="Setup"   component={SetupScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
