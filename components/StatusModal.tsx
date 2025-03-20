import { Modal, View, Text, StyleSheet, Pressable, Alert } from 'react-native';
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
      onClose();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      // Show success feedback
      const statusLabel = STATUS_OPTIONS.find(opt => opt.value === status)?.label;
      Alert.alert(
        'Status zmieniony',
        `Status zamówienia został zmieniony na: ${statusLabel}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert(
        'Błąd',
        'Nie udało się zmienić statusu zamówienia',
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