import { Tabs } from 'expo-router';
import { ClipboardList, Menu, MessageSquare, Settings } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Redirect } from 'expo-router';
import { NavigationContainer } from '@react-navigation/native';

export default function TabLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <NavigationContainer independent={true}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#0073E6',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            backgroundColor: '#FFFFFF',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Menu',
            tabBarIcon: ({ color }) => <Menu size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'AI Manager',
            tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          }}
        />
      </Tabs>
    </NavigationContainer>
  );
}