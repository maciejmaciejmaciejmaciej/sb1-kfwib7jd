import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWooCommerceSettings, fetchOrders, updateOrderStatus, fetchProducts, updateProductStock, createOrder, fetchCategories, updateOrder } from '../utils/api';

export function useCategories() {
  const { data: settings } = useQuery({
    queryKey: ['woocommerce-settings'],
    queryFn: getWooCommerceSettings,
  });

  return useQuery({
    queryKey: ['categories'],
    queryFn: () => settings ? fetchCategories(settings) : null,
    enabled: !!settings,
  });
}

export function useOrders(params: Record<string, string> = {}) {
  const { data: settings } = useQuery({
    queryKey: ['woocommerce-settings'],
    queryFn: getWooCommerceSettings,
  });

  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => settings ? fetchOrders(settings, params) : null,
    enabled: !!settings,
    refetchInterval: 15000, // 15 seconds
    refetchIntervalInBackground: true,
    staleTime: 0, // Consider data stale immediately
    cacheTime: 0, // Don't cache the data
    retry: 3, // Retry failed requests 3 times
    retryDelay: 1000, // Wait 1 second between retries
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ['woocommerce-settings'],
    queryFn: getWooCommerceSettings,
  });

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) => {
      if (!settings) throw new Error('WooCommerce settings not found');
      return updateOrderStatus(settings, orderId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useProducts() {
  const { data: settings } = useQuery({
    queryKey: ['woocommerce-settings'],
    queryFn: getWooCommerceSettings,
  });

  return useQuery({
    queryKey: ['products'],
    queryFn: () => settings ? fetchProducts(settings) : null,
    enabled: !!settings,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    cacheTime: 0,
  });
}

export function useUpdateProductStock() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ['woocommerce-settings'],
    queryFn: getWooCommerceSettings,
  });

  return useMutation({
    mutationFn: ({ productId, inStock }: { productId: string; inStock: boolean }) => {
      if (!settings) throw new Error('WooCommerce settings not found');
      return updateProductStock(settings, productId, inStock);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ['woocommerce-settings'],
    queryFn: getWooCommerceSettings,
  });

  return useMutation({
    mutationFn: (orderData: any) => {
      if (!settings) throw new Error('WooCommerce settings not found');
      return createOrder(settings, orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ['woocommerce-settings'],
    queryFn: getWooCommerceSettings,
  });

  return useMutation({
    mutationFn: ({ orderId, orderData }: { orderId: string; orderData: any }) => {
      if (!settings) throw new Error('WooCommerce settings not found');
      return updateOrder(settings, orderId, orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}