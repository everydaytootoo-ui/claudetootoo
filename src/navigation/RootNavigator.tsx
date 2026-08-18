import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { PackingScreen } from '../screens/PackingScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { VaultScreen } from '../screens/VaultScreen';

export type RootTabParamList = {
  Home: undefined;
  Packing: undefined;
  Search: undefined;
  Calendar: undefined;
  Vault: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICON: Record<keyof RootTabParamList, string> = {
  Home: '🏠',
  Packing: '🎒',
  Search: '🔍',
  Calendar: '🗓',
  Vault: '📄',
};

const TAB_LABEL: Record<keyof RootTabParamList, string> = {
  Home: '홈',
  Packing: '짐싸기',
  Search: '검색',
  Calendar: '캘린더',
  Vault: '보관함',
};

/** 전체 스크린을 하나로 잇는 하단 탭 네비게이션 — 홈 / 캐꾸·짐싸기 / 검색 / 캘린더 / 바우처 보관함 */
export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#FF8A5B',
          tabBarInactiveTintColor: '#B0B0B4',
          tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#F0EDE6' },
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICON[route.name as keyof RootTabParamList]}</Text>,
          tabBarLabel: TAB_LABEL[route.name as keyof RootTabParamList],
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Packing" component={PackingScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Calendar" component={CalendarScreen} />
        <Tab.Screen name="Vault" component={VaultScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
