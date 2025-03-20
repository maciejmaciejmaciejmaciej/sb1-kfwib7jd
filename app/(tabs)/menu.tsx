import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoreDomainSection } from '../../components/StoreDomainSection';
import { FlashList } from '@shopify/flash-list';
import { AlertCircle } from 'lucide-react-native';
import { useProducts } from '../../hooks/useWooCommerce';
import { getStoredSettings } from '../../utils/storage';
import { WooCommerceSettings } from '../../utils/types';

export default function MenuScreen() {
  const [settings, setSettings] = useState<WooCommerceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: allProducts = [], isLoading: productsLoading } = useProducts();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await getStoredSettings<WooCommerceSettings>('woocommerce_settings');
        setSettings(stored);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const products = settings?.preferredCategory
    ? allProducts.filter(product => 
        product.categories?.some(cat => cat.id.toString() === settings.preferredCategory)
      )
    : [];

  if (isLoading || productsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Menu</Text>
        </View>
        <StoreDomainSection />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0073E6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!settings?.preferredCategory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Menu</Text>
        </View>
        <StoreDomainSection />
        <View style={styles.centered}>
          <AlertCircle size={48} color="#DC2626" />
          <Text style={styles.errorTitle}>No Category Selected</Text>
          <Text style={styles.errorMessage}>
            Please select a preferred category in Settings first.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Menu</Text>
        </View>
        <StoreDomainSection />
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No Products Found</Text>
          <Text style={styles.emptyMessage}>
            No products available in the selected category.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
      </View>
      <StoreDomainSection />
      <FlashList
        data={products}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{item.price} zł</Text>
            </View>
            <Switch
              value={item.stock_status === 'instock'}
              onValueChange={() => {/* Handle stock toggle */}}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
              thumbColor={item.stock_status === 'instock' ? '#0073E6' : '#9CA3AF'}
            />
          </View>
        )}
        estimatedItemSize={80}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
});