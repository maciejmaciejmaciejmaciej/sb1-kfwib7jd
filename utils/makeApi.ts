import { MakeSettings, MakeSettingsSchema } from './types';
import { getStoredSettings, saveMakeSettings as saveSettings } from './storage';

export type { MakeSettings };

export async function getMakeSettings(): Promise<MakeSettings | null> {
  try {
    const settings = await getStoredSettings<MakeSettings>('make_settings');
    if (!settings) return null;
    return MakeSettingsSchema.parse(settings);
  } catch (error) {
    console.error('Error getting Make.com settings:', error);
    return null;
  }
}

export async function saveMakeSettings(settings: MakeSettings): Promise<void> {
  try {
    await saveSettings(settings);
  } catch (error) {
    console.error('Error saving Make.com settings:', error);
    throw new Error('Failed to save settings');
  }
}

export async function sendMessage(settings: MakeSettings, message: string, media?: string) {
  const response = await fetch(settings.webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      media,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  return response.json();
}