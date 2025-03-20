import { Modal, View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { X, Clock, ShoppingBag, Car } from 'lucide-react-native';
import { format } from 'date-fns';
import { useUpdateOrderStatus } from '../hooks/useWooCommerce';
import { useQueryClient } from '@tanstack/react-query';

interface AcceptOrderModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  orderType: 'delivery' | 'pickup';
  orderTime: number;
}

export function AcceptOrderModal({ visible, onClose, orderId, orderType, orderTime }: AcceptOrderModalProps) {
  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();

  const handleAccept = async () => {
    try {
      await updateStatus.mutateAsync({ orderId, status: 'processing' });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      Alert.alert(
        'Zamówienie zaakceptowane',
        'Zamówienie zostało dodane do kolejki',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to accept order:', error);
      Alert.alert(
        'Błąd',
        'Nie udało się zaakceptować zamówienia',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Potwierdź zamówienie</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#374151" />
            </Pressable>
          </View>

          <View style={styles.content}>
            <Text style={styles.info}>
              Zamówienie trafi do kolejki zamówień. Zaakceptowane zamówienie możesz edytować oraz zmieniać jego status.
            </Text>

            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Na kiedy:</Text>
              <View style={styles.detailsRow}>
                <Clock size={24} color="#0073E6" />
                <Text style={styles.detailsText}>
                  {format(new Date(orderTime * 1000), 'HH:mm')}
                </Text>
              </View>
              <View style={styles.detailsRow}>
                {orderType === 'delivery' ? (
                  <Car size={24} color="#0073E6" />
                ) : (
                  <ShoppingBag size={24} color="#0073E6" />
                )}
                <Text style={styles.detailsText}>
                  {orderType === 'delivery' ? 'Dowóz' : 'Odbiór'}
                </Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.acceptButton} onPress={handleAccept}>
            <Text style={styles.acceptButtonText}>OK - przyjęte</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    gap: 24,
    marginBottom: 24,
  },
  info: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  detailsContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsText: {
    fontSize: 16,
    color: '#374151',
  },
  acceptButton: {
    backgroundColor: '#0073E6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});