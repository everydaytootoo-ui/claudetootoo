import React from 'react';
import { NavigationContainer, CompositeNavigationProp } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { PackingScreen } from '../screens/PackingScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { VaultScreen } from '../screens/VaultScreen';
import { DepartureCheckInScreen } from '../screens/DepartureCheckInScreen';
import { GroupScreen } from '../screens/GroupScreen';
import { TemplateScreen } from '../screens/TemplateScreen';
import { TripSettingsScreen } from '../screens/TripSettingsScreen';

export type RootTabParamList = {
  Home: undefined;
  Packing: undefined;
  Search: undefined;
  Calendar: undefined;
  Vault: undefined;
};

/** 탭 바깥에서 전체 화면으로 열리는 스크린들 (출발 체크, 크루 관리, 템플릿) */
export type RootStackParamList = {
  MainTabs: undefined;
  DepartureCheckIn: undefined;
  Group: undefined;
  Templates: undefined;
  TripSettings: undefined;
};

/** 탭 화면(Home 등)에서 탭 이동과 스택 화면 이동을 모두 타입 안전하게 호출하기 위한 합성 타입 */
export type AppNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

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

function MainTabs() {
  return (
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
  );
}

/**
 * 전체 스크린을 잇는 루트 내비게이션.
 * 하단 탭(홈/캐꾸·짐싸기/검색/캘린더/바우처 보관함)을 기본 화면으로 두고,
 * "출발 전 필수품 체크"와 "여행 크루 관리"는 탭 바 없는 전체화면 스택으로 위에 쌓는다.
 */
export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="DepartureCheckIn"
          component={DepartureCheckInScreen}
          options={{ title: '출발 전 필수품 체크' }}
        />
        <Stack.Screen name="Group" component={GroupScreen} options={{ title: '여행 크루' }} />
        <Stack.Screen name="Templates" component={TemplateScreen} options={{ title: '패킹 템플릿' }} />
        <Stack.Screen name="TripSettings" component={TripSettingsScreen} options={{ title: '여행 설정' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
