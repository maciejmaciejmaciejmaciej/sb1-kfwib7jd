import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { X, Calendar as CalendarIcon } from 'lucide-react-native';
import { format } from 'date-fns';
import { Picker } from '@react-native-picker/picker';

interface DateFilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateFilterModal({ visible, onClose, selectedDate, onDateChange }: DateFilterModalProps) {
  const handleDateChange = (dateString: string) => {
    const newDate = new Date(dateString);
    onDateChange(newDate);
    onClose();
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
            <Text style={styles.title}>Select Date</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#374151" />
            </Pressable>
          </View>

          <View style={styles.content}>
            <CalendarIcon size={24} color="#0073E6" style={styles.icon} />
            <Picker
              selectedValue={selectedDate.toISOString()}
              onValueChange={handleDateChange}
              style={styles.picker}>
              {Array.from({ length: 10 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i - 5); // Show 5 days before and after today
                return (
                  <Picker.Item
                    key={date.toISOString()}
                    label={format(date, 'dd/MM/yyyy')}
                    value={date.toISOString()}
                  />
                );
              })}
            </Picker>
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
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  picker: {
    width: '100%',
    height: 150,
  },
});