import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, ShoppingBag, AlertCircle } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { format } from 'date-fns';
import { useOrders } from '../../hooks/useWooCommerce';
import { getStoredSettings } from '../../utils/storage';

export default function RealizacjaScreen() {
  const [hasSettings, setHasSettings] = useState<boolean | null>(null);
  
  const { data: orders = [], isLoading, error } = useOrders({
    status: 'processing,completed',
  });

  // Filter orders with status "gotowe" or "w-produkcji"
  const filteredOrders = orders.filter(order => {
    const status = order.status;
    return status === 'gotowe' || status === 'w-produkcji';
  });

  // Sort orders by data_unix (oldest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const aUnix = a.meta_data.find(meta => meta.key === 'data_unix')?.value || 0;
    const bUnix = b.meta_data.find(meta => meta.key === 'data_unix')?.value || 0;
    return Number(aUnix) - Number(bUnix);
  });

  useEffect(() => {
    const checkSettings = async () => {
      const settings = await getStoredSettings('woocommerce_settings');
      setHasSettings(!!settings);
    };
    checkSettings();
  }, []);

  if (hasSettings === null) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.centered} size="large" color="#0073E6" />
      </SafeAreaView>
    );
  }

  if (!hasSettings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <AlertCircle size={48} color="#DC2626" />
          <Text style={styles.errorTitle}>No WooCommerce Settings</Text>
          <Text style={styles.errorMessage}>Please configure your WooCommerce settings in the Settings tab.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.centered} size="large" color="#0073E6" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <AlertCircle size={48} color="#DC2626" />
          <Text style={styles.errorTitle}>Error Loading Orders</Text>
          <Text style={styles.errorMessage}>{error instanceof Error ? error.message : 'Failed to load orders'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Realizacja</Text>

      {sortedOrders.length === 0 ? (
        <Text style={styles.emptyMessage}>Brak zamówień w realizacji</Text>
      ) : (
        <FlashList
          data={sortedOrders}
          renderItem={({ item }) => {
            const dataUnix = item.meta_data.find(meta => meta.key === 'data_unix')?.value;
            const orderTime = dataUnix ? format(new Date(Number(dataUnix) * 1000), 'HH:mm') : '--:--';
            
            return (
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.methodContainer}>
                    {item.meta_data.find(meta => meta.key === 'exwfood_order_method')?.value === 'delivery' ? (
                      <Car size={20} color="#0073E6" />
                    ) : (
                      <ShoppingBag size={20} color="#0073E6" />
                    )}
                    <Text style={styles.methodText}>
                      {item.meta_data.find(meta => meta.key === 'exwfood_order_method')?.value === 'delivery' ? 'Dowóz' : 'Odbiór'}
                    </Text>
                  </View>
                  <Text style={styles.orderTime}>{orderTime}</Text>
                </View>
                
                <Text style={styles.customerName}>
                  #{item.id} | {item.billing.first_name} {item.billing.last_name}
                </Text>
                
                {item.billing.address_1 && (
                  <Text style={styles.address}>{item.billing.address_1}</Text>
                )}
                
                {item.line_items.map((lineItem, index) => (
                  <Text key={index} style={styles.lineItem}>
                    {lineItem.quantity}x {lineItem.name}
                  </Text>
                ))}
                
                <View style={styles.footer}>
                  <Text style={styles.total}>Suma: {item.total} zł</Text>
                  <Text style={styles.status}>{item.status}</Text>
                </View>
              </View>
            );
          }}
          estimatedItemSize={200}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  list: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#0073E6',
  },
  orderTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  customerName: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  lineItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 12,
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  status: {
    fontSize: 14,
    color: '#0073E6',
    fontWeight: '500',
  },
});