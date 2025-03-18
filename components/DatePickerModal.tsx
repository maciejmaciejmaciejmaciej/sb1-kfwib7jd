import { Modal, View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { X } from 'lucide-react-native';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onConfirm: () => void;
}

export function DatePickerModal({
  visible,
  onClose,
  selectedDate,
  onDateChange,
  onConfirm,
}: DatePickerModalProps) {
  if (!visible) return null;

  const handleDateChange = (event: any) => {
    const date = new Date(event.target.value);
    onDateChange(date);
    onConfirm();
    onClose();
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Wybierz datę</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#374151" />
            </Pressable>
          </View>

          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={handleDateChange}
            style={{
              fontSize: '16px',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              width: '100%',
              marginBottom: '16px',
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Wybierz datę</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#374151" />
            </Pressable>
          </View>

          {Platform.OS === 'ios' ? (
            <>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={(_, date) => date && onDateChange(date)}
                style={styles.picker}
              />
              <Pressable style={styles.confirmButton} onPress={onConfirm}>
                <Text style={styles.confirmButtonText}>Ustaw datę</Text>
              </Pressable>
            </>
          ) : (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              onChange={(_, date) => {
                if (date) {
                  onDateChange(date);
                  onConfirm();
                  onClose();
                }
              }}
              style={styles.picker}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxWidth: 400,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      default: {
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
    }),
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
  picker: {
    width: '100%',
    height: 200,
  },
  confirmButton: {
    backgroundColor: '#0073E6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});