import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { useUpdateOrderStatus } from '../hooks/useWooCommerce';
import { useQueryClient } from '@tanstack/react-query';

interface StatusModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  currentStatus: string;
}

const STATUS_OPTIONS = [
  { label: 'Aktywne', value: 'processing' },
  { label: 'W produkcji', value: 'w-produkcji' },
  { label: 'Gotowe', value: 'gotowe' },
  { label: 'Zakończone', value: 'completed' },
  { label: 'Anulowane', value: 'cancelled' },
  { label: 'Oczekujące (test)', value: 'pending' },
];

export function StatusModal({ visible, onClose, orderId, currentStatus }: StatusModalProps) {
  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status });
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.textContent = 'Status zmieniony';
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

      // Close modal and refresh data
      onClose();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (error) {
      console.error('Failed to update status:', error);
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
            <Text style={styles.title}>Zmień status</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#374151" />
            </Pressable>
          </View>

          <View style={styles.options}>
            {STATUS_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.option,
                  currentStatus === option.value && styles.selectedOption,
                ]}
                onPress={() => handleStatusChange(option.value)}>
                <Text
                  style={[
                    styles.optionText,
                    currentStatus === option.value && styles.selectedOptionText,
                  ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  options: {
    gap: 8,
  },
  option: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: '#0073E6',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});