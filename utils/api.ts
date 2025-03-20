import { Platform } from 'react-native';
import { WooCommerceSettings, WooCommerceSettingsSchema } from './types';
import { getStoredSettings, storeSettings } from './storage';

export async function getWooCommerceSettings(): Promise<WooCommerceSettings | null> {
  try {
    const settings = await getStoredSettings<WooCommerceSettings>('woocommerce_settings');
    if (!settings) return null;
    
    // Validate settings
    const validated = WooCommerceSettingsSchema.parse(settings);
    return validated;
  } catch (error) {
    console.error('Error getting WooCommerce settings:', error);
    return null;
  }
}

export async function validateStoreCredentials(settings: WooCommerceSettings): Promise<{ 
  isValid: boolean;
  storeName?: string;
  error?: string;
}> {
  const { storeUrl, consumerKey, consumerSecret } = settings;
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  try {
    // Try to fetch store info to validate credentials
    const response = await fetch(`${storeUrl}/wp-json/wc/v3/system_status`, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { 
          isValid: false, 
          error: 'Invalid credentials. Please check your Consumer Key and Secret.' 
        };
      }
      return { 
        isValid: false, 
        error: 'Could not connect to the store. Please check the Store URL.' 
      };
    }

    const data = await response.json();
    return {
      isValid: true,
      storeName: data.environment?.name || 'Unknown Store'
    };
  } catch (error) {
    return { 
      isValid: false, 
      error: 'Failed to connect to the store. Please check your internet connection and store URL.' 
    };
  }
}

export async function saveWooCommerceSettings(settings: WooCommerceSettings): Promise<void> {
  try {
    // Validate settings before saving
    const validated = WooCommerceSettingsSchema.parse(settings);
    await storeSettings('woocommerce_settings', validated);
  } catch (error) {
    console.error('Error saving WooCommerce settings:', error);
    throw new Error('Failed to save settings');
  }
}

export async function fetchSingleOrder(settings: WooCommerceSettings, orderId: number) {
  const { storeUrl, consumerKey, consumerSecret } = settings;
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  try {
    const response = await fetch(`${storeUrl}/wp-json/wc/v3/orders/${orderId}`, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || `Failed to fetch order: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

export async function fetchOrders(settings: WooCommerceSettings, params: Record<string, string> = {}) {
  const { storeUrl, consumerKey, consumerSecret } = settings;
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  const queryParams = new URLSearchParams({
    ...params,
    per_page: '50',
    orderby: 'date',
    order: 'desc',
  });

  const response = await fetch(`${storeUrl}/wp-json/wc/v3/orders?${queryParams}`, {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch orders: ${error}`);
  }

  return response.json();
}

export async function updateOrderStatus(
  settings: WooCommerceSettings,
  orderId: string,
  status: string
) {
  const { storeUrl, consumerKey, consumerSecret } = settings;
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  const response = await fetch(`${storeUrl}/wp-json/wc/v3/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update order status: ${response.statusText}`);
  }

  return response.json();
}

export async function updateOrder(
  settings: WooCommerceSettings,
  orderId: string,
  orderData: any
) {
  const { storeUrl, consumerKey, consumerSecret } = settings;
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  try {
    // Get current order to preserve status
    const currentOrder = await fetchSingleOrder(settings, parseInt(orderId));
    const originalStatus = currentOrder.status;

    // Create a map of existing line items by product ID
    const existingLineItems = new Map();
    currentOrder.line_items.forEach((item: any) => {
      existingLineItems.set(item.product_id, item.id);
    });

    // Create line items array with preserved IDs where possible
    const lineItems = orderData.line_items
      .filter((item: any) => item.quantity > 0) // Only include items with quantity > 0
      .map((item: any) => {
        const existingId = existingLineItems.get(item.product_id);
        return {
          id: existingId, // Include ID if it exists
          product_id: item.product_id,
          quantity: item.quantity,
        };
      });

    // Add items to be deleted (set quantity to 0)
    currentOrder.line_items.forEach((item: any) => {
      const hasNewQuantity = orderData.line_items.some(
        (newItem: any) => newItem.product_id === item.product_id && newItem.quantity > 0
      );
      if (!hasNewQuantity) {
        lineItems.push({
          id: item.id,
          product_id: item.product_id,
          quantity: 0,
        });
      }
    });

    // Prepare the update payload
    const updatePayload = {
      ...orderData,
      line_items: lineItems,
      fee_lines: orderData.fee_lines || [],
    };

    // Update the order
    const response = await fetch(`${storeUrl}/wp-json/wc/v3/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || `Failed to update order: ${response.statusText}`);
    }

    // Restore original status if it was not pending
    if (originalStatus !== 'pending') {
      await updateOrderStatus(settings, orderId, originalStatus);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

export async function fetchProducts(settings: WooCommerceSettings) {
  const { storeUrl, consumerKey, consumerSecret } = settings;
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  const response = await fetch(`${storeUrl}/wp-json/wc/v3/products?per_page=100`, {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  return response.json();
}

export async function updateProductStock(
  settings: WooCommerceSettings,
  productId: string,
  inStock: boolean
) {
  const { storeUrl, consumerKey, consumerSecret } = settings;
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  const response = await fetch(`${storeUrl}/wp-json/wc/v3/products/${productId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      stock_status: inStock ? 'instock' : 'outofstock',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update product stock: ${response.statusText}`);
  }

  return response.json();
}

export async function createOrder(settings: WooCommerceSettings, orderData: any) {
  const { storeUrl, consumerKey, consumerSecret } = settings;
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  const response = await fetch(`${storeUrl}/wp-json/wc/v3/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create order: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchCategories(settings: WooCommerceSettings) {
  const { storeUrl, consumerKey, consumerSecret } = settings;
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  // First, get the total number of categories
  const countResponse = await fetch(`${storeUrl}/wp-json/wc/v3/products/categories?per_page=1`, {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!countResponse.ok) {
    throw new Error(`Failed to fetch categories count: ${countResponse.statusText}`);
  }

  const totalCategories = parseInt(countResponse.headers.get('X-WP-Total') || '0');
  
  // Now fetch all categories in one request
  const response = await fetch(`${storeUrl}/wp-json/wc/v3/products/categories?per_page=${totalCategories}`, {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  return response.json();
}

export { getWooCommerceSettings, fetchOrders, updateOrderStatus, fetchProducts, updateProductStock, createOrder, fetchCategories, updateOrder }