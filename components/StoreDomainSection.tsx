import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getWooCommerceSettings } from '../utils/api';

export function StoreDomainSection() {
  const { data: settings } = useQuery({
    queryKey: ['woocommerce-settings'],
    queryFn: getWooCommerceSettings,
  });

  const storeDomain = settings?.storeUrl 
    ? new URL(settings.storeUrl).hostname 
    : null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {storeDomain || 'Dodaj sklep w ustawieniach'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});