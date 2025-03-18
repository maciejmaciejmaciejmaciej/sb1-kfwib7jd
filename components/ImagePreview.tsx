import { Modal, View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';

interface ImagePreviewProps {
  visible: boolean;
  uri: string;
  onClose: () => void;
}

export function ImagePreview({ visible, uri, onClose }: ImagePreviewProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <X size={24} color="#FFFFFF" />
        </Pressable>
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="contain"
          transition={200}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
});