import { useState, useRef } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, StopCircle } from 'lucide-react-native';
import { useToast } from '../contexts/ToastContext';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string) => void;
}

export function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | MediaRecorder | null>(null);
  const { showToast } = useToast();

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(blob);
          onRecordingComplete(audioUrl);
          
          // Clean up the stream
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        recordingRef.current = mediaRecorder;
        setIsRecording(true);
        showToast('Recording started', 'success');
      } else {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        recordingRef.current = recording;
        setIsRecording(true);
        showToast('Recording started', 'success');
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
      showToast('Failed to start recording', 'error');
    }
  };

  const stopRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        const mediaRecorder = recordingRef.current as MediaRecorder;
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
          setIsRecording(false);
          showToast('Recording completed', 'success');
        }
      } else {
        const recording = recordingRef.current as Audio.Recording;
        if (!recording) return;

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        if (uri) {
          onRecordingComplete(uri);
          showToast('Recording completed', 'success');
        }
        setIsRecording(false);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      showToast('Failed to stop recording', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, isRecording && styles.buttonRecording]}
        onPress={isRecording ? stopRecording : startRecording}>
        {isRecording ? (
          <StopCircle size={24} color="#DC2626" />
        ) : (
          <Mic size={24} color="#0073E6" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  button: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  buttonRecording: {
    backgroundColor: '#FEE2E2',
  },
});