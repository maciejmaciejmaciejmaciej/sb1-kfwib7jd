import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Save, Trash2 } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useCategories } from '../../hooks/useWooCommerce';
import { WooCommerceSettings } from '../../utils/types';
import { getStoredSettings, storeSettings } from '../../utils/storage';
import { useQueryClient } from '@tanstack/react-query';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<WooCommerceSettings>({
    consumerKey: '',
    consumerSecret: '',
    storeUrl: '',
    preferredCategory: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorLog, setErrorLog] = useState('');
  const [showErrorLog, setShowErrorLog] = useState(false);
  
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  // Load stored settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await getStoredSettings<WooCommerceSettings>('woocommerce_settings');
        if (stored) {
          setSettings(stored);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        setSaveError('Failed to load settings');
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await storeSettings('woocommerce_settings', settings);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setSettings(prev => ({ ...prev, preferredCategory: value }));
  };

  if (showErrorLog) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Error Log</Text>
          <Pressable
            style={styles.backButton}
            onPress={() => setShowErrorLog(false)}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.errorLog}>
          <Text style={styles.errorLogText}>{errorLog || 'No errors logged.'}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {saveError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{saveError}</Text>
          </View>
        )}

        {saveSuccess && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>Settings saved successfully!</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WooCommerce Settings</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Store URL"
            value={settings.storeUrl}
            onChangeText={(text) => setSettings(prev => ({ ...prev, storeUrl: text }))}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Consumer Key"
            value={settings.consumerKey}
            onChangeText={(text) => setSettings(prev => ({ ...prev, consumerKey: text }))}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Consumer Secret"
            value={settings.consumerSecret}
            onChangeText={(text) => setSettings(prev => ({ ...prev, consumerSecret: text }))}
          />

          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>Preferred Category</Text>
            {categoriesLoading ? (
              <ActivityIndicator size="small" color="#0073E6" />
            ) : (
              <Picker
                selectedValue={settings.preferredCategory}
                onValueChange={handleCategoryChange}
                style={styles.categoryPicker}>
                <Picker.Item label="Select a category" value="" />
                {categories.map((category: any) => (
                  <Picker.Item
                    key={category.id}
                    label={category.name}
                    value={category.id.toString()}
                  />
                ))}
              </Picker>
            )}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={saveSettings}
            disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.errorLogButton}
            onPress={() => setShowErrorLog(true)}>
            <Text style={styles.errorLogButtonText}>View Error Log</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#111827',
  },
  categoryContainer: {
    marginTop: 12,
  },
  categoryLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  categoryPicker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonContainer: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#0073E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  errorLogButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorLogButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#E5E7EB',
    padding: 8,
    borderRadius: 8,
    position: 'absolute',
    right: 16,
    top: 16,
  },
  backButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  errorLog: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  errorLogText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'monospace',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: '#15803D',
    fontSize: 14,
  },
});