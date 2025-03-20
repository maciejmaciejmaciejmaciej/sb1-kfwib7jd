import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Save, AlertCircle } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useCategories } from '../../hooks/useWooCommerce';
import { WooCommerceSettings, MakeSettings } from '../../utils/types';
import { getStoredSettings, storeSettings } from '../../utils/storage';
import { validateStoreCredentials } from '../../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import { StoreDomainSection } from '../../components/StoreDomainSection';
import { useToast } from '../../contexts/ToastContext';
import { readErrorLog, clearErrorLog } from '../../utils/errorLogger';
import { ErrorModal } from '../../components/ErrorModal';

export default function SettingsScreen() {
  const [wooSettings, setWooSettings] = useState<WooCommerceSettings>({
    consumerKey: '',
    consumerSecret: '',
    storeUrl: '',
    preferredCategory: '',
  });
  const [makeSettings, setMakeSettings] = useState<MakeSettings>({
    webhookUrl: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showErrorLog, setShowErrorLog] = useState(false);
  const [errorLogContent, setErrorLogContent] = useState('');
  const { showToast } = useToast();
  
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedWoo = await getStoredSettings<WooCommerceSettings>('woocommerce_settings');
        const storedMake = await getStoredSettings<MakeSettings>('make_settings');
        
        if (storedWoo) {
          setWooSettings(storedWoo);
        }
        if (storedMake) {
          setMakeSettings(storedMake);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        showToast('Failed to load settings', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const validateSettings = async () => {
    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await validateStoreCredentials(wooSettings);
      
      if (!result.isValid) {
        setValidationError(result.error || 'Invalid store settings');
        return false;
      }

      showToast(`Successfully connected to ${result.storeName}`, 'success');
      return true;
    } catch (error) {
      setValidationError('Failed to validate store settings');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);

    try {
      // Validate store credentials first
      const isValid = await validateSettings();
      if (!isValid) {
        return;
      }

      await storeSettings('woocommerce_settings', wooSettings);
      await storeSettings('make_settings', makeSettings);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      showToast('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setWooSettings(prev => ({ ...prev, preferredCategory: value }));
  };

  const handleViewErrorLog = async () => {
    const log = await readErrorLog();
    setErrorLogContent(log);
    setShowErrorLog(true);
  };

  const handleClearErrorLog = async () => {
    await clearErrorLog();
    setErrorLogContent('');
    setShowErrorLog(false);
    showToast('Error log cleared', 'success');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0073E6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <StoreDomainSection />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WooCommerce Settings</Text>
          
          {validationError && (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color="#DC2626" />
              <Text style={styles.errorText}>{validationError}</Text>
            </View>
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Store URL"
            value={wooSettings.storeUrl}
            onChangeText={(text) => {
              setValidationError(null);
              setWooSettings(prev => ({ ...prev, storeUrl: text }));
            }}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Consumer Key"
            value={wooSettings.consumerKey}
            onChangeText={(text) => {
              setValidationError(null);
              setWooSettings(prev => ({ ...prev, consumerKey: text }));
            }}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Consumer Secret"
            value={wooSettings.consumerSecret}
            onChangeText={(text) => {
              setValidationError(null);
              setWooSettings(prev => ({ ...prev, consumerSecret: text }));
            }}
          />

          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>Preferred Category</Text>
            {categoriesLoading ? (
              <ActivityIndicator size="small" color="#0073E6" />
            ) : (
              <Picker
                selectedValue={wooSettings.preferredCategory}
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Make.com Settings</Text>
          <TextInput
            style={styles.input}
            placeholder="Webhook URL"
            value={makeSettings.webhookUrl}
            onChangeText={(text) => setMakeSettings(prev => ({ ...prev, webhookUrl: text }))}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error Log</Text>
          <View style={styles.errorLogButtons}>
            <Pressable
              style={styles.errorLogButton}
              onPress={handleViewErrorLog}>
              <Text style={styles.errorLogButtonText}>View Error Log</Text>
            </Pressable>
            <Pressable
              style={[styles.errorLogButton, styles.errorLogClearButton]}
              onPress={handleClearErrorLog}>
              <Text style={[styles.errorLogButtonText, styles.errorLogClearButtonText]}>
                Clear Log
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={[
              styles.saveButton, 
              (isSaving || isValidating) && styles.saveButtonDisabled
            ]}
            onPress={saveSettings}
            disabled={isSaving || isValidating}>
            {(isSaving || isValidating) ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <ErrorModal
        visible={showErrorLog}
        message={errorLogContent || 'No errors logged'}
        onClose={() => setShowErrorLog(false)}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 14,
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
  errorLogButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  errorLogButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0073E6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorLogButtonText: {
    color: '#0073E6',
    fontSize: 14,
    fontWeight: '500',
  },
  errorLogClearButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  errorLogClearButtonText: {
    color: '#DC2626',
  },
});