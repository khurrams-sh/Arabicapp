import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { REMINDER_TIME_KEY, saveProfileData, getProfileData } from './profileStorage';
import Constants from 'expo-constants';

// Define an array of notification messages for variety
const NOTIFICATION_MESSAGES = [
  "👋 Hey there! Your Arabic practice is waiting for you today. Keep your streak going! 🔥",
  "⏰ It's practice time! Just 5 minutes of Arabic will keep your skills sharp. Ready?",
  "🤔 Remember how to say 'hello' in Arabic? Open Saylo to practice!",
  "🔔 Daily reminder: Your Arabic skills need practice to grow. Let's go!",
  "🌟 Don't break your streak! Take a quick Arabic lesson today.",
  "👀 Miss your Arabic practice? We miss you too! Come back for a quick session.",
  "🧠 Your brain loves language learning! Time for your daily Arabic practice."
];

// Get a random notification message
function getRandomNotificationMessage(): string {
  const randomIndex = Math.floor(Math.random() * NOTIFICATION_MESSAGES.length);
  return NOTIFICATION_MESSAGES[randomIndex];
}

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Save the reminder time to both AsyncStorage and Supabase profile
export async function saveReminderTime(hour: number, minute: number) {
  try {
    const reminderTime = { hour, minute };
    // Save using profileStorage which handles both AsyncStorage and Supabase
    await saveProfileData(REMINDER_TIME_KEY, reminderTime);
    return reminderTime;
  } catch (error) {
    return null;
  }
}

// Get the saved reminder time from storage
export async function getReminderTime() {
  try {
    // Get from profileStorage which prioritizes AsyncStorage for speed
    const reminderTime = await getProfileData(REMINDER_TIME_KEY) as { hour: number, minute: number } | null;
    
    // If no time found
    if (!reminderTime) {
      return null;
    }
    
    // Validate that we have a valid hour and minute
    if (typeof reminderTime.hour !== 'number' || 
        typeof reminderTime.minute !== 'number' ||
        reminderTime.hour < 0 || reminderTime.hour > 23 ||
        reminderTime.minute < 0 || reminderTime.minute > 59) {
      return null;
    }
    
    return reminderTime;
  } catch (error) {
    return null;
  }
}

// Request notification permissions
export async function requestNotificationPermissions() {
  if (!Device.isDevice) {
    // Continue with permissions request even on simulator for testing
  }

  // If running in Expo Go with SDK 53+, notify but don't attempt to register
  if (isExpoGo && Platform.OS === 'android') {
    return false;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // Create default notification channel for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E5903A',
      });
    }
    
    return finalStatus === 'granted';
  } catch (error) {
    return false;
  }
}

// Schedule a daily reminder notification at a specific time
export async function scheduleDailyReminder(
  hour: number, 
  minute: number, 
  message?: string
) {
  try {
    // Save the reminder time regardless of notification capability
    await saveReminderTime(hour, minute);
    
    // If running in Expo Go with SDK 53+, just save time but don't schedule notifications
    if (isExpoGo && Platform.OS === 'android') {
      return true; // Return true to allow onboarding to continue
    }
    
    // Ensure permissions are granted for other environments
    const permissionGranted = await requestNotificationPermissions();
    if (!permissionGranted) {
      return true; // Still return true to allow onboarding to continue
    }
    
    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Create a Date object for the trigger
    const now = new Date();
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute
    );
    
    // If the time is in the past for today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    // Get random message if none provided
    const notificationMessage = message || getRandomNotificationMessage();
    
    try {
      // Schedule the notification using daily trigger
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Saylo Daily Reminder',
          body: notificationMessage,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      
      // Check that the notification is actually scheduled
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      // Handle error silently
    }
    
    return true;
  } catch (error) {
    return true; // Still return true to allow onboarding to continue
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  try {
    return await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    return false;
  }
}

// Get all scheduled notifications
export async function getAllScheduledNotifications() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    return [];
  }
} 