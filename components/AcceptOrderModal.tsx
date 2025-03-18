import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { X, Clock, ShoppingBag, Car } from 'lucide-react-native';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
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

  const getTimeDisplay = () => {
    const now = new Date();
    const orderDate = new Date(orderTime * 1000);
    const minutesDiff = differenceInMinutes(orderDate, now);
    const hoursDiff = differenceInHours(orderDate, now);

    if (Math.abs(hoursDiff) >= 1) {
      return `${Math.abs(hoursDiff)} godzin${hoursDiff < 0 ? ' temu' : ''}`;
    } else {
      return `${Math.abs(minutesDiff)} minut${minutesDiff < 0 ? ' temu' : ''}`;
    }
  };

  const handleAccept = async () => {
    try {
      await updateStatus.mutateAsync({ orderId, status: 'processing' });
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.textContent = 'Dodano do kolejki';
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
      
      // Remove success message after 1 second
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 1000);

      onClose();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (error) {
      console.error('Failed to accept order:', error);
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
            <View style={styles.infoRow}>
              {orderType === 'delivery' ? (
                <Car size={24} color="#0073E6" />
              ) : (
                <ShoppingBag size={24} color="#0073E6" />
              )}
              <Text style={styles.infoText}>
                {orderType === 'delivery' ? 'Dowóz' : 'Odbiór'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Clock size={24} color="#0073E6" />
              <Text style={styles.infoText}>{getTimeDisplay()}</Text>
            </View>
          </View>

          <Pressable style={styles.acceptButton} onPress={handleAccept}>
            <Text style={styles.acceptButtonText}>Dodaj do kolejki</Text>
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
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    gap: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
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