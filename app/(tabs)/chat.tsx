import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Image, Send, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { ChatMessage } from '../../components/ChatMessage';
import { ImagePreview } from '../../components/ImagePreview';
import { ErrorModal } from '../../components/ErrorModal';
import { useSendMessage } from '../../hooks/useMake';

interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: string;
  media?: string;
}

export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! How can I help you today?',
      isAI: true,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlashList<Message>>(null);
  const { mutateAsync: sendMessage, isPending } = useSendMessage();

  const handleSend = async () => {
    if ((!message.trim() && !selectedImage) || isPending) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isAI: false,
      timestamp: new Date().toISOString(),
      media: selectedImage || undefined,
    };

    setMessages(prev => [newMessage, ...prev]);
    setMessage('');
    setSelectedImage(null);

    try {
      const response = await sendMessage({
        message: message.trim(),
        media: selectedImage || undefined,
      });

      if (response.message) {
        setMessages(prev => [{
          id: (Date.now() + 1).toString(),
          text: response.message,
          isAI: true,
          timestamp: new Date().toISOString(),
        }, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Manager</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlashList
          ref={listRef}
          data={messages}
          estimatedItemSize={80}
          inverted
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ChatMessage
              message={item.text}
              timestamp={item.timestamp}
              isAI={item.isAI}
              media={item.media}
              onMediaPress={() => item.media && setPreviewImage(item.media)}
            />
          )}
        />

        <View style={styles.inputContainer}>
          {selectedImage && (
            <View style={styles.imagePreview}>
              <Pressable
                style={styles.removeImage}
                onPress={() => setSelectedImage(null)}>
                <X size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
          <View style={styles.inputRow}>
            <Pressable
              style={styles.imageButton}
              onPress={handleImagePick}>
              <Image size={24} color="#6B7280" />
            </Pressable>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type your message..."
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <Pressable
              style={[
                styles.sendButton,
                (!message.trim() && !selectedImage) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={(!message.trim() && !selectedImage) || isPending}>
              <Send
                size={20}
                color={(!message.trim() && !selectedImage) ? '#9CA3AF' : '#FFFFFF'}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ImagePreview
        visible={!!previewImage}
        uri={previewImage || ''}
        onClose={() => setPreviewImage(null)}
      />

      <ErrorModal
        visible={!!error}
        message={error || ''}
        onClose={() => setError(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  imagePreview: {
    height: 100,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
  },
  imageButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: '#111827',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0073E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});