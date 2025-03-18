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
    mutationFn: async ({ message, media }: { message: string; media?: string }) => {
      if (!settings) throw new Error('Make.com settings not found');
      return sendMessage(settings, message, media);
    },
  });
}