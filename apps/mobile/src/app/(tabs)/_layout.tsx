import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useTheme } from '@/theme/useTheme';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  };
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Armario', tabBarIcon: icon('shirt-outline') }} />
      <Tabs.Screen name="add" options={{ title: 'Añadir', tabBarIcon: icon('add-circle-outline') }} />
      <Tabs.Screen name="settings" options={{ title: 'Ajustes', tabBarIcon: icon('settings-outline') }} />
    </Tabs>
  );
}
