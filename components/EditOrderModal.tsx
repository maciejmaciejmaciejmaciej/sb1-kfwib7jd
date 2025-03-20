import { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, TextInput, ScrollView, Switch, Platform, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useProducts, useUpdateOrder } from '../hooks/useWooCommerce';
import { Picker } from '@react-native-picker/picker';
import { getStoredSettings } from '../utils/storage';
import { WooCommerceSettings } from '../utils/types';

interface EditOrderModalProps {
  visible: boolean;
  onClose: () => void;
  order: any;
}

const DELIVERY_TIMES = Array.from({ length: 29 }, (_, i) => {
  const hour = Math.floor(i / 4) + 11;
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

export function EditOrderModal({ visible, onClose, order }: EditOrderModalProps) {
  const [isDelivery, setIsDelivery] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(DELIVERY_TIMES[0]);
  const [clientName, setClientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [city, setCity] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [settings, setSettings] = useState<WooCommerceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateOrder = useUpdateOrder();

  useEffect(() => {
    if (visible && order) {
      const orderMethod = order.meta_data.find((meta: any) => meta.key === 'exwfood_order_method')?.value;
      setIsDelivery(orderMethod === 'delivery');
      
      const orderUnix = order.meta_data.find((meta: any) => meta.key === 'data_unix')?.value;
      if (orderUnix) {
        const orderDate = new Date(Number(orderUnix) * 1000);
        setSelectedDate(orderDate);
        setSelectedTime(format(orderDate, 'HH:mm'));
      }

      setClientName(order.billing.first_name);
      setPhoneNumber(order.billing.phone);
      
      if (order.billing.address_1) {
        const addressParts = order.billing.address_1.split(' ');
        const streetNumber = addressParts.pop();
        const street = addressParts.join(' ');
        setStreet(street);
        
        if (streetNumber.includes('/')) {
          const [number, flat] = streetNumber.split('/');
          setStreetNumber(number);
          setFlatNumber(flat);
        } else {
          setStreetNumber(streetNumber);
        }
      }
      
      setCity(order.billing.city || '');

      // Get existing note if any
      const existingNote = order.meta_data.find((meta: any) => meta.key === 'order_note')?.value;
      setNote(existingNote || '');
    }
  }, [visible, order]);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const stored = await getStoredSettings<WooCommerceSettings>('woocommerce_settings');
        setSettings(stored);
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

      if (!clientName.trim() || !phoneNumber.trim()) {
        setIsValid(false);
        return;
      }

      if (isDelivery) {
        if (!street.trim() || !streetNumber.trim() || !city.trim()) {
          setIsValid(false);
          return;
        }
      }

      setIsValid(true);
    };

    validate();
  }, [settings, clientName, phoneNumber, street, streetNumber, city, isDelivery]);

  const handleSubmit = async () => {
    if (!isValid || !settings?.preferredCategory || !order) {
      setError('Please fill in all required fields');
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const orderDateTime = new Date(selectedDate);
    orderDateTime.setHours(hours, minutes, 0, 0);
    const unixTimestamp = Math.floor(orderDateTime.getTime() / 1000);

    // Preserve existing line items and fee lines
    const orderData = {
      billing: {
        first_name: clientName,
        phone: phoneNumber,
        address_1: isDelivery ? `${street} ${streetNumber}${flatNumber ? `/${flatNumber}` : ''}` : '',
        city: isDelivery ? city : '',
      },
      line_items: order.line_items.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity
      })),
      fee_lines: order.fee_lines,
      meta_data: [
        {
          key: "exwfood_order_method",
          value: isDelivery ? "delivery" : "pickup"
        },
        {
          key: "data_unix",
          value: unixTimestamp.toString()
        },
        {
          key: "order_note",
          value: note.trim()
        }
      ]
    };

    try {
      await updateOrder.mutateAsync({ orderId: order.id, orderData });
      onClose();

      const successMessage = document.createElement('div');
      successMessage.textContent = 'Zamówienie zaktualizowane';
      successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #DCFCE7;
        color: #15803D;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 9999;
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 1000);
    } catch (error) {
      console.error('Failed to update order:', error);
      setError('Failed to update order. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Edycja - #{order?.id}</Text>
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Edycja - #{order?.id}</Text>
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
            <Text style={styles.sectionTitle}>Produkty</Text>
            {order?.line_items.map((item: any, index: number) => (
              <View key={index} style={styles.productRow}>
                <Text style={styles.productName}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.productPrice}>{item.total} zł</Text>
              </View>
            ))}
          </View>

          <View style={styles.noteSection}>
            <Text style={styles.sectionTitle}>Notatka</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Dodaj notatkę do zamówienia (max 600 znaków)"
              value={note}
              onChangeText={(text) => setNote(text.slice(0, 600))}
              multiline
              numberOfLines={4}
              maxLength={600}
            />
            <Text style={styles.charCount}>{note.length}/600</Text>
          </View>

          <View style={styles.deliverySection}>
            <Text style={styles.sectionTitle}>Sposób dostawy</Text>
            <View style={styles.deliveryToggle}>
              <Text>Odbiór</Text>
              <Switch
                value={isDelivery}
                onValueChange={setIsDelivery}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={isDelivery ? '#0073E6' : '#9CA3AF'}
              />
              <Text>Dowóz</Text>
            </View>
          </View>

          <View style={styles.dateTimeSection}>
            <Text style={styles.sectionTitle}>Data i godzina</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedDate.toISOString()}
                onValueChange={(value) => setSelectedDate(new Date(value))}
                style={styles.picker}>
                {Array.from({ length: 10 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  return (
                    <Picker.Item
                      key={date.toISOString()}
                      label={format(date, 'd MMMM yyyy', { locale: pl })}
                      value={date.toISOString()}
                    />
                  );
                })}
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
            <Text style={styles.sectionTitle}>Dane klienta</Text>
            <TextInput
              style={styles.input}
              placeholder="Imię i nazwisko"
              value={clientName}
              onChangeText={setClientName}
            />
            <TextInput
              style={styles.input}
              placeholder="Telefon"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            {isDelivery && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Ulica"
                  value={street}
                  onChangeText={setStreet}
                />
                <View style={styles.addressRow}>
                  <TextInput
                    style={[styles.input, styles.numberInput]}
                    placeholder="Numer"
                    value={streetNumber}
                    onChangeText={setStreetNumber}
                  />
                  <TextInput
                    style={[styles.input, styles.numberInput]}
                    placeholder="Mieszkanie"
                    value={flatNumber}
                    onChangeText={setFlatNumber}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Miasto"
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
          <Text style={[styles.submitButtonText, !isValid && styles.submitButtonTextDisabled]}>
            Zatwierdź zmiany
          </Text>
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
    marginLeft: 16,
  },
  noteSection: {
    marginBottom: 24,
  },
  noteInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0073E6',
    padding: 16,
    alignItems: 'center',
    margin: 16,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
  submitButtonText: {
    color: '#0073E6',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButtonTextDisabled: {
    color: '#9CA3AF',
  },
});