import { View, Text, StyleSheet, Pressable } from 'react-native';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { AudioPlayer } from './AudioPlayer';

interface ChatMessageProps {
  message: string;
  timestamp: string;
  isAI: boolean;
  media?: string;
  audio?: string;
  onMediaPress?: () => void;
}

export function ChatMessage({ 
  message, 
  timestamp, 
  isAI, 
  media, 
  audio,
  onMediaPress 
}: ChatMessageProps) {
  return (
    <View style={[styles.container, isAI ? styles.aiContainer : styles.userContainer]}>
      {media && (
        <Pressable onPress={onMediaPress}>
          <Image
            source={{ uri: media }}
            style={styles.media}
            contentFit="cover"
            transition={200}
          />
        </Pressable>
      )}
      
      {audio && (
        <AudioPlayer uri={audio} />
      )}
      
      <Text style={[styles.message, isAI ? styles.aiMessage : styles.userMessage]}>
        {message}
      </Text>
      
      <Text style={[styles.timestamp, isAI ? styles.aiTimestamp : styles.userTimestamp]}>
        {format(new Date(timestamp), 'HH:mm')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  aiContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  userContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#0073E6',
    borderBottomRightRadius: 4,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
  },
  aiMessage: {
    color: '#111827',
  },
  userMessage: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  aiTimestamp: {
    color: '#6B7280',
  },
  userTimestamp: {
    color: '#E5E7EB',
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
});