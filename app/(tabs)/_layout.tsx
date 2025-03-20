import { Tabs } from 'expo-router';
import { ClipboardList, Menu, MessageSquare, Settings } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Redirect } from 'expo-router';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet } from 'react-native';
import { useOrders } from '../../hooks/useWooCommerce';
import { startOfDay, endOfDay } from 'date-fns';

function TabBarIcon({ icon: Icon, color, hasBadge, badgeCount }: { 
  icon: any;
  color: string;
  hasBadge?: boolean;
  badgeCount?: number;
}) {
  return (
    <View style={styles.iconContainer}>
      <Icon size={24} color={color} />
      {hasBadge && badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { isAuthenticated } = useAuth();
  const { data: orders = [] } = useOrders();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const currentDate = new Date();
  const pendingOrdersCount = orders.filter(order => {
    if (order.status !== 'pending') return false;

    const orderUnix = order.meta_data.find(meta => meta.key === 'data_unix')?.value;
    if (!orderUnix) return false;

    const orderDate = new Date(Number(orderUnix) * 1000);
    
    return (
      orderDate >= startOfDay(currentDate) &&
      orderDate <= endOfDay(currentDate)
    );
  }).length;

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
            title: 'Zamówienia',
            tabBarIcon: ({ color }) => (
              <TabBarIcon 
                icon={ClipboardList} 
                color={color} 
                hasBadge={pendingOrdersCount > 0}
                badgeCount={pendingOrdersCount}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Menu',
            tabBarIcon: ({ color }) => <TabBarIcon icon={Menu} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'AI Manager',
            tabBarIcon: ({ color }) => <TabBarIcon icon={MessageSquare} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Ustawienia',
            tabBarIcon: ({ color }) => <TabBarIcon icon={Settings} color={color} />,
          }}
        />
      </Tabs>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});