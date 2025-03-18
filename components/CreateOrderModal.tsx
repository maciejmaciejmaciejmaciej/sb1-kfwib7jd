import { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, TextInput, ScrollView, Switch, Platform, ActivityIndicator } from 'react-native';
import { X, Plus, Minus, AlertCircle } from 'lucide-react-native';
import { format, addDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useProducts, useCreateOrder } from '../hooks/useWooCommerce';
import { Picker } from '@react-native-picker/picker';
import { getStoredSettings } from '../utils/storage';
import { WooCommerceSettings } from '../utils/types';

interface CreateOrderModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ProductQuantity {
  [key: string]: number;
}

const DELIVERY_TIMES = Array.from({ length: 29 }, (_, i) => {
  const hour = Math.floor(i / 4) + 11;
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

export function CreateOrderModal({ visible, onClose }: CreateOrderModalProps) {
  const [isDelivery, setIsDelivery] = useState(false);
  const [quantities, setQuantities] = useState<ProductQuantity>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(DELIVERY_TIMES[0]);
  const [clientName, setClientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [city, setCity] = useState('');
  const [deliveryCost, setDeliveryCost] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [settings, setSettings] = useState<WooCommerceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: allProducts = [], isLoading: productsLoading } = useProducts();
  const createOrder = useCreateOrder();

  const products = settings?.preferredCategory
    ? allProducts.filter(product => 
        product.categories?.some(cat => cat.id.toString() === settings.preferredCategory)
      )
    : [];

  const totalPrice = products.reduce((sum, product) => {
    const quantity = quantities[product.id] || 0;
    return sum + (parseFloat(product.price) * quantity);
  }, 0);

  const nextTenDays = Array.from({ length: 10 }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const stored = await getStoredSettings<WooCommerceSettings>('woocommerce_settings');
        setSettings(stored);
        if (!stored?.preferredCategory) {
          setError('Please set a preferred category in Settings first');
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  useEffect(() => {
    const validate = () => {
      if (!settings?.preferredCategory) {
        setIsValid(false);
        return;
      }

      if (!clientName || !phoneNumber) {
        setIsValid(false);
        return;
      }

      if (isDelivery && (!street || !streetNumber || !city)) {
        setIsValid(false);
        return;
      }

      const hasProducts = Object.values(quantities).some(q => q > 0);
      if (!hasProducts) {
        setIsValid(false);
        return;
      }

      setIsValid(true);
    };

    validate();
  }, [settings, clientName, phoneNumber, street, streetNumber, city, isDelivery, quantities]);

  const handleQuantityChange = (productId: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + change),
    }));
  };

  const handleSubmit = async () => {
    if (!isValid || !settings?.preferredCategory) return;

    // Create Unix timestamp from selected date and time
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const orderDateTime = new Date(selectedDate);
    orderDateTime.setHours(hours, minutes, 0, 0);
    const unixTimestamp = Math.floor(orderDateTime.getTime() / 1000);

    const orderData = {
      payment_method: "cod",
      payment_method_title: "Płatność przy odbiorze",
      set_paid: false,
      billing: {
        first_name: clientName,
        phone: phoneNumber,
        address_1: isDelivery ? `${street} ${streetNumber}${flatNumber ? `/${flatNumber}` : ''}` : '',
        city: isDelivery ? city : '',
      },
      line_items: Object.entries(quantities)
        .filter(([_, quantity]) => quantity > 0)
        .map(([productId, quantity]) => ({
          product_id: parseInt(productId),
          quantity,
        })),
      fee_lines: isDelivery ? [
        {
          name: "Koszt dowozu",
          total: deliveryCost || "0"
        }
      ] : [],
      meta_data: [
        {
          key: "exwfood_order_method",
          value: isDelivery ? "delivery" : "pickup"
        },
        {
          key: "data_unix",
          value: unixTimestamp.toString()
        }
      ]
    };

    try {
      await createOrder.mutateAsync(orderData);
      onClose();
    } catch (error) {
      console.error('Failed to create order:', error);
      setError('Failed to create order. Please try again.');
    }
  };

  const resetForm = () => {
    setQuantities({});
    setClientName('');
    setPhoneNumber('');
    setStreet('');
    setStreetNumber('');
    setFlatNumber('');
    setCity('');
    setDeliveryCost('');
    setError(null);
    setIsDelivery(false);
    setSelectedDate(new Date());
    setSelectedTime(DELIVERY_TIMES[0]);
  };

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  if (isLoading || productsLoading) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>New Order</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#374151" />
            </Pressable>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0073E6" />
          </View>
        </View>
      </Modal>
    );
  }

  if (!settings?.preferredCategory) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>New Order</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#374151" />
            </Pressable>
          </View>
          <View style={styles.errorContainer}>
            <AlertCircle size={48} color="#DC2626" />
            <Text style={styles.errorTitle}>No Category Selected</Text>
            <Text style={styles.errorMessage}>
              Please select a preferred category in Settings first.
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (products.length === 0) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>New Order</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#374151" />
            </Pressable>
          </View>
          <View style={styles.errorContainer}>
            <AlertCircle size={48} color="#DC2626" />
            <Text style={styles.errorTitle}>No Products Available</Text>
            <Text style={styles.errorMessage}>
              No products found in the selected category.
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>New Order</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#374151" />
          </Pressable>
        </View>

        {error && (
          <View style={styles.errorAlert}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <ScrollView style={styles.content}>
          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>Products</Text>
            {products.map(product => (
              <View key={product.id} style={styles.productRow}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>{product.price} zł</Text>
                <View style={styles.quantityControls}>
                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(product.id, -1)}>
                    <Minus size={16} color="#374151" />
                  </Pressable>
                  <Text style={styles.quantity}>{quantities[product.id] || 0}</Text>
                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(product.id, 1)}>
                    <Plus size={16} color="#374151" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalPrice}>{totalPrice.toFixed(2)} zł</Text>
          </View>

          <View style={styles.deliverySection}>
            <Text style={styles.sectionTitle}>Delivery Method</Text>
            <View style={styles.deliveryToggle}>
              <Text>Pickup</Text>
              <Switch
                value={isDelivery}
                onValueChange={setIsDelivery}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={isDelivery ? '#0073E6' : '#9CA3AF'}
              />
              <Text>Delivery</Text>
            </View>
            {isDelivery && (
              <TextInput
                style={[styles.input, { marginTop: 12 }]}
                placeholder="Koszt dowozu"
                value={deliveryCost}
                onChangeText={setDeliveryCost}
                keyboardType="numeric"
              />
            )}
          </View>

          <View style={styles.dateTimeSection}>
            <Text style={styles.sectionTitle}>Date & Time</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedDate.toISOString()}
                onValueChange={(value) => setSelectedDate(new Date(value))}
                style={styles.picker}>
                {nextTenDays.map(date => (
                  <Picker.Item
                    key={date.toISOString()}
                    label={format(date, 'd MMMM yyyy', { locale: pl })}
                    value={date.toISOString()}
                  />
                ))}
              </Picker>
              <Picker
                selectedValue={selectedTime}
                onValueChange={setSelectedTime}
                style={styles.picker}>
                {DELIVERY_TIMES.map(time => (
                  <Picker.Item
                    key={time}
                    label={time}
                    value={time}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.clientSection}>
            <Text style={styles.sectionTitle}>Customer Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={clientName}
              onChangeText={setClientName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            {isDelivery && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Street"
                  value={street}
                  onChangeText={setStreet}
                />
                <View style={styles.addressRow}>
                  <TextInput
                    style={[styles.input, styles.numberInput]}
                    placeholder="Number"
                    value={streetNumber}
                    onChangeText={setStreetNumber}
                  />
                  <TextInput
                    style={[styles.input, styles.numberInput]}
                    placeholder="Apt/Suite"
                    value={flatNumber}
                    onChangeText={setFlatNumber}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  value={city}
                  onChangeText={setCity}
                />
              </>
            )}
          </View>
        </ScrollView>

        <Pressable
          style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid}>
          <Text style={styles.submitButtonText}>Create Order</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
  content: {
    flex: 1,
    padding: 16,
  },
  errorAlert: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  productsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  productName: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  productPrice: {
    fontSize: 16,
    color: '#374151',
    marginRight: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    padding: 8,
  },
  quantity: {
    width: 32,
    textAlign: 'center',
    fontSize: 16,
    color: '#111827',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0073E6',
  },
  deliverySection: {
    marginBottom: 24,
  },
  deliveryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  dateTimeSection: {
    marginBottom: 24,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  picker: {
    flex: 1,
    height: 40,
  },
  clientSection: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#111827',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  numberInput: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#0073E6',
    padding: 16,
    alignItems: 'center',
    margin: 16,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});