import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const ERROR_LOG_FILE = 'error.log';
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB

export async function logError(error: Error | string, context?: string) {
  if (Platform.OS === 'web') {
    console.error(error);
    return;
  }

  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : error;
  const logEntry = `[${timestamp}] ${context ? `[${context}] ` : ''}${errorMessage}\n`;

  try {
    const logPath = `${FileSystem.documentDirectory}${ERROR_LOG_FILE}`;
    
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(logPath);
    
    if (!fileInfo.exists) {
      await FileSystem.writeAsStringAsync(logPath, logEntry);
      return;
    }

    // Rotate log if too large
    if (fileInfo.size > MAX_LOG_SIZE) {
      await FileSystem.deleteAsync(logPath);
      await FileSystem.writeAsStringAsync(logPath, logEntry);
      return;
    }

    // Append to existing log
    await FileSystem.writeAsStringAsync(logPath, logEntry, { encoding: FileSystem.EncodingType.UTF8 });
  } catch (err) {
    console.error('Failed to write to error log:', err);
  }
}

export async function readErrorLog(): Promise<string> {
  if (Platform.OS === 'web') {
    return 'Error logging not available in web environment';
  }

  try {
    const logPath = `${FileSystem.documentDirectory}${ERROR_LOG_FILE}`;
    const fileInfo = await FileSystem.getInfoAsync(logPath);
    
    if (!fileInfo.exists) {
      return '';
    }

    return await FileSystem.readAsStringAsync(logPath);
  } catch (err) {
    console.error('Failed to read error log:', err);
    return 'Failed to read error log';
  }
}

export async function clearErrorLog(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const logPath = `${FileSystem.documentDirectory}${ERROR_LOG_FILE}`;
    await FileSystem.deleteAsync(logPath, { idempotent: true });
  } catch (err) {
    console.error('Failed to clear error log:', err);
  }
}