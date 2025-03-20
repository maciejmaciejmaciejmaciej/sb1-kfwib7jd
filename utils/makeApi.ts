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

export async function sendMessage(
  settings: MakeSettings, 
  message: string, 
  media?: string,
  user?: { username: string; role: string }
) {
  if (!settings.webhookUrl) {
    console.error('Webhook URL is not configured');
    throw new Error('Webhook URL not configured');
  }

  const payload = {
    message,
    media,
    timestamp: new Date().toISOString(),
    user: user ? {
      username: user.username,
      role: user.role
    } : undefined
  };

  console.log('Sending webhook request to:', settings.webhookUrl);
  console.log('Request payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(settings.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Webhook response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    console.log('Webhook response text:', text);
    
    // If empty response, return default message
    if (!text) {
      return { message: 'Message received' };
    }
    
    // Try to parse as JSON first
    try {
      const jsonResponse = JSON.parse(text);
      console.log('Parsed JSON response:', jsonResponse);
      return jsonResponse;
    } catch (e) {
      console.log('Response is not JSON, returning as message');
      // If not JSON, return the text as message
      return { message: text };
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}