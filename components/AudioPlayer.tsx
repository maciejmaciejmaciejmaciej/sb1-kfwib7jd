import { useState, useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';
import { useToast } from '../contexts/ToastContext';

interface AudioPlayerProps {
  uri: string;
}

export function AudioPlayer({ uri }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (Platform.OS === 'web') {
      webAudioRef.current = document.createElement('audio');
      webAudioRef.current.src = uri;
      webAudioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      webAudioRef.current.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        showToast('Failed to load audio', 'error');
      });
    }

    return () => {
      cleanup();
    };
  }, [uri]);

  const cleanup = async () => {
    try {
      if (Platform.OS === 'web') {
        if (webAudioRef.current) {
          webAudioRef.current.pause();
          webAudioRef.current.src = '';
          webAudioRef.current.remove();
          webAudioRef.current = null;
        }
      } else if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  };

  const togglePlayback = async () => {
    try {
      if (Platform.OS === 'web') {
        if (!webAudioRef.current) {
          webAudioRef.current = document.createElement('audio');
          webAudioRef.current.src = uri;
          webAudioRef.current.addEventListener('ended', () => {
            setIsPlaying(false);
          });
        }

        if (isPlaying) {
          webAudioRef.current.pause();
          setIsPlaying(false);
        } else {
          try {
            await webAudioRef.current.play();
            setIsPlaying(true);
          } catch (err) {
            console.error('Web audio play error:', err);
            showToast('Failed to play audio', 'error');
          }
        }
      } else {
        if (!soundRef.current) {
          const { sound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: false }
          );
          soundRef.current = sound;
          sound.setOnPlaybackStatusUpdate(status => {
            if (status.isLoaded && !status.isPlaying) {
              setIsPlaying(false);
            }
          });
        }

        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error('Failed to toggle audio playback:', err);
      showToast('Failed to play audio', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.button,
          isPlaying && styles.buttonPlaying,
          isLoading && styles.buttonDisabled
        ]}
        onPress={togglePlayback}
        disabled={isLoading}>
        {isPlaying ? (
          <Pause size={20} color="#0073E6" />
        ) : (
          <Play size={20} color="#0073E6" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  button: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPlaying: {
    backgroundColor: '#E5E7EB',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});