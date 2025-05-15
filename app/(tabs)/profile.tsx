import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Switch, Platform, useColorScheme, TextInput, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getReminderTime, scheduleDailyReminder, cancelAllNotifications } from '../utils/notifications';
import { triggerImpact } from '../utils/haptics';
import { saveProfileData, getAllProfileData, UserProfile, USER_NAME_KEY, NATIVE_LANGUAGE_KEY, DIALECT_KEY, ARABIC_LEVEL_KEY, LEARNING_SOURCE_KEY, DAILY_GOAL_KEY } from '../utils/profileStorage';
import { router } from 'expo-router';
import ProfileOptionSelector, { OptionItem } from '../components/ProfileOptionSelector';
import { LANGUAGES, DIALECTS, ARABIC_LEVELS, getLearningSourceOptions, ACCENT_COLOR } from '../constants/profileOptions';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const accentColor = ACCENT_COLOR;
  const { signOut } = useAuth();
  
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [name, setName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // New editing states
  const [isEditingNativeLanguage, setIsEditingNativeLanguage] = useState(false);
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [isEditingDialect, setIsEditingDialect] = useState(false);
  const [dialect, setDialect] = useState('');
  const [isEditingArabicLevel, setIsEditingArabicLevel] = useState(false);
  const [arabicLevel, setArabicLevel] = useState('');
  const [isEditingLearningSource, setIsEditingLearningSource] = useState(false);
  const [learningSource, setLearningSource] = useState('');
  const [isEditingDailyGoal, setIsEditingDailyGoal] = useState(false);
  const [dailyGoal, setDailyGoal] = useState('');
  
  // Modal state for time picker
  const [timePickerModal, setTimePickerModal] = useState(false);
  
  // Logout confirmation modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Option selector modal states
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const [showDialectOptions, setShowDialectOptions] = useState(false);
  const [showLevelOptions, setShowLevelOptions] = useState(false);
  const [showSourceOptions, setShowSourceOptions] = useState(false);

  // Load profile data and notification settings
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get profile data from Supabase
        const profileData = await getAllProfileData();
        setProfileData(profileData);
        
        if (profileData?.name) {
          setName(profileData.name);
        }
        
        if (profileData?.native_language) {
          setNativeLanguage(profileData.native_language);
        }
        
        if (profileData?.dialect) {
          setDialect(profileData.dialect);
        }
        
        if (profileData?.arabic_level) {
          setArabicLevel(profileData.arabic_level);
        }
        
        if (profileData?.learning_source) {
          setLearningSource(profileData.learning_source);
        }
        
        if (profileData?.daily_goal_minutes) {
          setDailyGoal(profileData.daily_goal_minutes.toString());
        }
        
        // Get notification settings
        const savedTime = await getReminderTime();
        
        if (savedTime) {
          const date = new Date();
          date.setHours(savedTime.hour, savedTime.minute, 0, 0);
          setReminderTime(date);
          setNotificationsEnabled(true);
        } else {
          // Default time 8:00 AM
          const defaultDate = new Date();
          defaultDate.setHours(8, 0, 0, 0);
          setReminderTime(defaultDate);
          setNotificationsEnabled(false);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading profile data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Format time for display
  const formatTime = (date: Date) => {
    if (!date) return '';
    
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${hours}:${formattedMinutes} ${ampm}`;
  };

  // Handle time change
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setTimePickerModal(false);
    }
    
    const currentDate = selectedDate || reminderTime;
    if (currentDate) {
      setReminderTime(currentDate);
      
      // Update notification schedule if enabled
      if (notificationsEnabled) {
        scheduleDailyReminder(currentDate.getHours(), currentDate.getMinutes());
      }
    }
  };

  // Toggle notifications on/off
  const toggleNotifications = async (value: boolean) => {
    triggerImpact();
    setNotificationsEnabled(value);
    
    if (value && reminderTime) {
      // Schedule notification
      await scheduleDailyReminder(reminderTime.getHours(), reminderTime.getMinutes());
    } else {
      // Cancel all notifications
      await cancelAllNotifications();
    }
  };

  // Open time picker modal
  const openTimePicker = () => {
    triggerImpact();
    if (Platform.OS === 'ios') {
      setTimePickerModal(true);
    } else {
      setIsTimePickerVisible(true);
    }
  };
  
  // Handle user logout
  const handleLogout = async () => {
    triggerImpact();
    setShowLogoutConfirm(true);
  };
  
  // Confirm and execute logout
  const confirmLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };
  
  // Generic save function for all profile fields
  const saveField = async (key: string, value: any, fieldName: string) => {
    if (typeof value === 'string' && value.trim().length === 0) {
      Alert.alert('Invalid Input', `Please select a valid ${fieldName}`);
      return false;
    }
    
    try {
      await saveProfileData(key, value);
      Alert.alert('Success', `Your ${fieldName} has been updated`);
      return true;
    } catch (error) {
      console.error(`Error saving ${fieldName}:`, error);
      Alert.alert('Error', `Failed to update your ${fieldName}`);
      return false;
    }
  };
  
  // Save profile name
  const saveName = async () => {
    const success = await saveField(USER_NAME_KEY, name.trim(), 'name');
    if (success) setIsEditingName(false);
  };
  
  // Save native language
  const handleLanguageSelect = async (language: OptionItem) => {
    const success = await saveField(NATIVE_LANGUAGE_KEY, language.name, 'native language');
    if (success) setNativeLanguage(language.name);
  };
  
  // Save dialect
  const handleDialectSelect = async (dialect: OptionItem) => {
    const success = await saveField(DIALECT_KEY, dialect.name, 'dialect');
    if (success) setDialect(dialect.name);
  };
  
  // Save Arabic level
  const handleArabicLevelSelect = async (level: OptionItem) => {
    const success = await saveField(ARABIC_LEVEL_KEY, level.name, 'Arabic level');
    if (success) setArabicLevel(level.name);
  };
  
  // Save learning source
  const handleLearningSourceSelect = async (source: OptionItem) => {
    const success = await saveField(LEARNING_SOURCE_KEY, source.name, 'learning source');
    if (success) setLearningSource(source.name);
  };
  
  // Save daily goal
  const saveDailyGoal = async () => {
    const goal = parseInt(dailyGoal);
    if (isNaN(goal) || goal <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of minutes');
      return;
    }
    
    const success = await saveField(DAILY_GOAL_KEY, goal, 'daily goal');
    if (success) setIsEditingDailyGoal(false);
  };

  // Find selected IDs for option lists
  const findSelectedLanguageId = () => {
    const selected = LANGUAGES.find((lang: { name: string; id: string }) => lang.name === nativeLanguage);
    return selected?.id;
  };

  const findSelectedDialectId = () => {
    const selected = DIALECTS.find((d: { name: string; id: string }) => d.name === dialect);
    return selected?.id;
  };

  const findSelectedLevelId = () => {
    const selected = ARABIC_LEVELS.find((level: { name: string; id: string }) => level.name === arabicLevel);
    return selected?.id;
  };

  const findSelectedSourceId = () => {
    const sources = getLearningSourceOptions(accentColor);
    const selected = sources.find((source: { name: string; id: string }) => source.name === learningSource);
    return selected?.id;
  };

  // Render an editable setting row with option selector
  const renderOptionSelectorRow = (
    emoji: string,
    label: string, 
    value: string, 
    onPress: () => void
  ) => (
    <View style={[
      styles.settingRow,
      { backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7' }
    ]}>
      <View style={styles.settingLabelContainer}>
        <ThemedText style={styles.settingEmoji}>{emoji}</ThemedText>
        <ThemedText style={styles.settingLabel}>{label}</ThemedText>
      </View>
      
      <TouchableOpacity
        style={styles.valueContainer}
        onPress={() => {
          triggerImpact();
          onPress();
        }}
      >
        <ThemedText style={styles.settingValue}>{value || 'Not set'}</ThemedText>
        <Ionicons 
          name="chevron-forward" 
          size={18} 
          color={colorScheme === 'dark' ? '#FFFFFF80' : '#00000080'} 
          style={styles.editIcon}
        />
      </TouchableOpacity>
    </View>
  );
  
  // Render a section header
  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    </View>
  );

  // Render an editable setting row with text input
  const renderSettingRow = (
    emoji: string,
    label: string,
    value: string,
    isEditing: boolean,
    setIsEditing: (value: boolean) => void,
    setValue: (value: string) => void,
    onSave: () => void
  ) => (
    <View style={[
      styles.settingRow,
      { backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7' }
    ]}>
      <View style={styles.settingLabelContainer}>
        <ThemedText style={styles.settingEmoji}>{emoji}</ThemedText>
        <ThemedText style={styles.settingLabel}>{label}</ThemedText>
      </View>
      
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={[
              styles.editInput,
              {
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
                backgroundColor: colorScheme === 'dark' ? '#333333' : '#FFFFFF',
              }
            ]}
            value={value}
            onChangeText={setValue}
            autoFocus
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={onSave}
          >
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => {
            triggerImpact();
            setIsEditing(true);
          }}
        >
          <View style={styles.valueContainer}>
            <ThemedText style={styles.settingValue}>{value || 'Not set'}</ThemedText>
            <Ionicons 
              name="create-outline" 
              size={18} 
              color={colorScheme === 'dark' ? '#FFFFFF80' : '#00000080'} 
              style={styles.editIcon}
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.pageTitle}>Settings</ThemedText>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accentColor} />
            <ThemedText style={{marginTop: 16}}>Loading profile...</ThemedText>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Personal Information Section */}
            {renderSectionHeader('Personal Information')}
            <View style={styles.sectionContent}>
              {renderSettingRow(
                '👤', 
                'Name', 
                name, 
                isEditingName, 
                setIsEditingName, 
                setName, 
                saveName
              )}
            </View>
            
            {/* Language Settings Section */}
            {renderSectionHeader('Language Settings')}
            <View style={styles.sectionContent}>
              {renderOptionSelectorRow(
                '🗣️', 
                'Native Language', 
                nativeLanguage,
                () => setShowLanguageOptions(true)
              )}
              
              {renderOptionSelectorRow(
                '🔊', 
                'Dialect', 
                dialect,
                () => setShowDialectOptions(true)
              )}
              
              {renderOptionSelectorRow(
                '📊', 
                'Arabic Level', 
                arabicLevel,
                () => setShowLevelOptions(true)
              )}
              
              {renderOptionSelectorRow(
                '📚', 
                'Learning Source', 
                learningSource,
                () => setShowSourceOptions(true)
              )}
            </View>
            
            {/* Learning Goals Section */}
            {renderSectionHeader('Learning Goals')}
            <View style={styles.sectionContent}>
              {renderSettingRow(
                '🎯', 
                'Daily Goal', 
                dailyGoal ? `${dailyGoal} minutes` : 'Not set', 
                isEditingDailyGoal, 
                setIsEditingDailyGoal, 
                setDailyGoal, 
                saveDailyGoal
              )}
            </View>
            
            {/* Notification Settings */}
            {renderSectionHeader('Notification Settings')}
            <View style={styles.sectionContent}>
              {/* Daily Reminder Toggle */}
              <View style={[
                styles.settingRow,
                { backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7' }
              ]}>
                <View style={styles.settingLabelContainer}>
                  <ThemedText style={styles.settingEmoji}>⏰</ThemedText>
                  <ThemedText style={styles.settingLabel}>Daily Reminder</ThemedText>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: '#767577', true: `${accentColor}80` }}
                  thumbColor={notificationsEnabled ? accentColor : '#f4f3f4'}
                />
              </View>
              
              {/* Reminder Time */}
              {notificationsEnabled && (
                <TouchableOpacity
                  style={[
                    styles.settingRow,
                    { backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7' }
                  ]}
                  onPress={openTimePicker}
                  disabled={!notificationsEnabled}
                >
                  <View style={styles.settingLabelContainer}>
                    <ThemedText style={styles.settingEmoji}>🕒</ThemedText>
                    <ThemedText style={styles.settingLabel}>Reminder Time</ThemedText>
                  </View>
                  <View style={styles.timeContainer}>
                    <ThemedText style={styles.settingValue}>
                      {reminderTime ? formatTime(reminderTime) : 'Not set'}
                    </ThemedText>
                    <Ionicons 
                      name="chevron-forward-outline" 
                      size={18} 
                      color={colorScheme === 'dark' ? '#FFFFFF80' : '#00000080'} 
                    />
                  </View>
                </TouchableOpacity>
              )}
            </View>
                        
            {/* Interests Section - Read-only */}
            {profileData?.interests && profileData.interests.length > 0 && (
              <>
                {renderSectionHeader('Interests')}
                <View style={styles.sectionContent}>
                  <View style={[
                    styles.settingRow,
                    { backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7' }
                  ]}>
                    <View style={styles.settingLabelContainer}>
                      <ThemedText style={styles.settingEmoji}>❤️</ThemedText>
                      <ThemedText style={styles.settingLabel}>Topics</ThemedText>
                    </View>
                    <View style={styles.valueTextContainer}>
                      <ThemedText style={styles.settingValue} numberOfLines={1} ellipsizeMode="tail">
                        {profileData.interests.join(', ')}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </>
            )}
            
            {/* Skills Section - Read-only */}
            {profileData?.skills && profileData.skills.length > 0 && (
              <>
                {renderSectionHeader('Skills')}
                <View style={styles.sectionContent}>
                  <View style={[
                    styles.settingRow,
                    { backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7' }
                  ]}>
                    <View style={styles.settingLabelContainer}>
                      <ThemedText style={styles.settingEmoji}>🛠️</ThemedText>
                      <ThemedText style={styles.settingLabel}>Current Skills</ThemedText>
                    </View>
                    <View style={styles.valueTextContainer}>
                      <ThemedText style={styles.settingValue} numberOfLines={1} ellipsizeMode="tail">
                        {profileData.skills.join(', ')}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </>
            )}
            
            {/* Account Section */}
            {renderSectionHeader('Account')}
            <View style={styles.sectionContent}>
              <TouchableOpacity
                style={[
                  styles.settingRow,
                  { backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7' }
                ]}
                onPress={handleLogout}
              >
                <View style={styles.settingLabelContainer}>
                  <ThemedText style={styles.settingEmoji}>🚪</ThemedText>
                  <ThemedText style={styles.settingLabel}>Log Out</ThemedText>
                </View>
                <Ionicons 
                  name="log-out-outline" 
                  size={22} 
                  color={colorScheme === 'dark' ? '#FFFFFF80' : '#00000080'} 
                />
              </TouchableOpacity>
            </View>
            
            {/* Bottom padding */}
            <View style={{ height: 40 }} />
            
            {/* Time Picker Modal for iOS */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={timePickerModal}
              onRequestClose={() => setTimePickerModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[
                  styles.modalContent, 
                  { backgroundColor: colorScheme === 'dark' ? '#252525' : '#FFFFFF' }
                ]}>
                  <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>Select Reminder Time</ThemedText>
                    <TouchableOpacity onPress={() => setTimePickerModal(false)}>
                      <Ionicons name="close" size={24} color={accentColor} />
                    </TouchableOpacity>
                  </View>
                  
                  <DateTimePicker
                    value={reminderTime || new Date()}
                    mode="time"
                    is24Hour={false}
                    display="spinner"
                    onChange={handleTimeChange}
                    style={styles.datePicker}
                  />
                  
                  <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: accentColor }]}
                    onPress={() => setTimePickerModal(false)}
                  >
                    <ThemedText style={styles.confirmButtonText}>Confirm</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            
            {/* Logout Confirmation Modal */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={showLogoutConfirm}
              onRequestClose={() => setShowLogoutConfirm(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[
                  styles.modalContent, 
                  { backgroundColor: colorScheme === 'dark' ? '#252525' : '#FFFFFF' }
                ]}>
                  <ThemedText style={styles.logoutTitle}>Confirm Logout</ThemedText>
                  <ThemedText style={styles.logoutMessage}>
                    Are you sure you want to log out of your account?
                  </ThemedText>
                  
                  <View style={styles.logoutButtons}>
                    <TouchableOpacity
                      style={[styles.logoutButton, styles.cancelButton, 
                        { borderColor: colorScheme === 'dark' ? '#444444' : '#DDDDDD' }
                      ]}
                      onPress={() => setShowLogoutConfirm(false)}
                    >
                      <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.logoutButton, { backgroundColor: '#E53935' }]}
                      onPress={confirmLogout}
                    >
                      <ThemedText style={styles.logoutText}>Log Out</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
            
            {/* Android time picker */}
            {isTimePickerVisible && Platform.OS === 'android' && (
              <DateTimePicker
                value={reminderTime || new Date()}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </ScrollView>
        )}
        
        {/* Options Selector Modals */}
        <ProfileOptionSelector
          isVisible={showLanguageOptions}
          onClose={() => setShowLanguageOptions(false)}
          onSelect={handleLanguageSelect}
          title="Select Your Native Language"
          options={LANGUAGES}
          selectedId={findSelectedLanguageId()}
        />
        
        <ProfileOptionSelector
          isVisible={showDialectOptions}
          onClose={() => setShowDialectOptions(false)}
          onSelect={handleDialectSelect}
          title="Select Arabic Dialect"
          options={DIALECTS}
          selectedId={findSelectedDialectId()}
        />
        
        <ProfileOptionSelector
          isVisible={showLevelOptions}
          onClose={() => setShowLevelOptions(false)}
          onSelect={handleArabicLevelSelect}
          title="Select Your Arabic Level"
          options={ARABIC_LEVELS}
          selectedId={findSelectedLevelId()}
        />
        
        <ProfileOptionSelector
          isVisible={showSourceOptions}
          onClose={() => setShowSourceOptions(false)}
          onSelect={handleLearningSourceSelect}
          title="Select Learning Source"
          options={getLearningSourceOptions(accentColor)}
          selectedId={findSelectedSourceId()}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // Section styling
  sectionHeader: {
    paddingHorizontal: 4,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  sectionContent: {
    marginBottom: 8,
  },
  // Settings rows
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 16,
    marginRight: 6,
    opacity: 0.8,
  },
  editInput: {
    fontSize: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.3)',
    borderRadius: 6,
    width: 150,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#E5903A',
    borderRadius: 6,
    padding: 6,
    marginLeft: 8,
  },
  valueTextContainer: {
    maxWidth: '50%',
  },
  editIcon: {
    marginLeft: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  datePicker: {
    height: 200,
    marginBottom: 20,
  },
  confirmButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  // Logout modal styles
  logoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  logoutMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  logoutButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logoutButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  cancelText: {
    fontWeight: '500',
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
  }
}); 