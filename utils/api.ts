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
    // First, get the current order to get its status and line items
    const currentOrder = await fetchSingleOrder(settings, parseInt(orderId));
    const originalStatus = currentOrder.status;

    // Set status to pending temporarily
    await updateOrderStatus(settings, orderId, 'pending');

    // Create a map of current line items by product ID
    const currentLineItems = new Map();
    currentOrder.line_items.forEach((item: any) => {
      const existingItem = currentLineItems.get(item.product_id);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        currentLineItems.set(item.product_id, {
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity
        });
      }
    });

    // Process new line items, consolidating quantities
    const newLineItems = new Map();
    orderData.line_items.forEach((item: any) => {
      const existingItem = newLineItems.get(item.product_id);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        newLineItems.set(item.product_id, {
          product_id: item.product_id,
          quantity: item.quantity
        });
      }
    });

    // Create final line items array
    const lineItems = [];
    newLineItems.forEach((newItem, productId) => {
      const currentItem = currentLineItems.get(productId);
      if (currentItem && newItem.quantity > 0) {
        // Update existing item
        lineItems.push({
          id: currentItem.id,
          product_id: productId,
          quantity: newItem.quantity
        });
      } else if (newItem.quantity > 0) {
        // Add new item
        lineItems.push({
          product_id: productId,
          quantity: newItem.quantity
        });
      }
    });

    // Add items to be deleted (those in current order but not in new order or with quantity 0)
    currentLineItems.forEach((currentItem, productId) => {
      const newItem = newLineItems.get(productId);
      if (!newItem || newItem.quantity === 0) {
        lineItems.push({
          id: currentItem.id,
          product_id: productId,
          quantity: 0
        });
      }
    });

    // Update the order with consolidated line items
    const response = await fetch(`${storeUrl}/wp-json/wc/v3/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...orderData,
        line_items: lineItems,
      }),
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

    // Set the status back to the original status
    await updateOrderStatus(settings, orderId, originalStatus);

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

  const response = await fetch(`${storeUrl}/wp-json/wc/v3/products`, {
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

  const response = await fetch(`${storeUrl}/wp-json/wc/v3/products/categories`, {
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