import { useQuery, useMutation } from '@tanstack/react-query';
import { getMakeSettings, sendMessage } from '../utils/makeApi';

export function useMakeSettings() {
  return useQuery({
    queryKey: ['make-settings'],
    queryFn: getMakeSettings,
  });
}

export function useSendMessage() {
  const { data: settings } = useMakeSettings();

  return useMutation({
    mutationFn: async ({ 
      message, 
      media,
      user 
    }: { 
      message: string; 
      media?: string;
      user?: { username: string; role: string } 
    }) => {
      if (!settings?.webhookUrl) {
        console.error('Make.com webhook URL is not configured');
        throw new Error('Make.com webhook URL not configured');
      }

      try {
        console.log('Attempting to send message:', message);
        const response = await sendMessage(settings, message, media, user);
        console.log('Message sent successfully, response:', response);
        
        // If response is a string, wrap it in an object
        if (typeof response === 'string') {
          return { message: response };
        }
        
        // If response is empty or undefined, return a default message
        if (!response) {
          return { message: 'No response received' };
        }

        return response;
      } catch (error) {
        console.error('Error in useSendMessage:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to send message to webhook');
      }
    },
  });
}