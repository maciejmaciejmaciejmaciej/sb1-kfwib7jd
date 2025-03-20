import { View, Text, Pressable, StyleSheet } from 'react-native';

interface OrderStatusTabsProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

export function OrderStatusTabs({ currentStatus, onStatusChange }: OrderStatusTabsProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.tab, currentStatus === 'w-kolejce' && styles.activeTab]}
        onPress={() => onStatusChange('w-kolejce')}>
        <Text style={[styles.tabText, currentStatus === 'w-kolejce' && styles.activeTabText]}>
          W kolejce
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, currentStatus === 'w-realizacji' && styles.activeTab]}
        onPress={() => onStatusChange('w-realizacji')}>
        <Text style={[styles.tabText, currentStatus === 'w-realizacji' && styles.activeTabText]}>
          W realizacji
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, currentStatus === 'zakonczone' && styles.activeTab]}
        onPress={() => onStatusChange('zakonczone')}>
        <Text style={[styles.tabText, currentStatus === 'zakonczone' && styles.activeTabText]}>
          Zakończone
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#0073E6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
});