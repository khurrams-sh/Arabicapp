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
    console.error('Error saving reminder time:', error);
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
      console.log('No reminder time found in storage');
      return null;
    }
    
    // Validate that we have a valid hour and minute
    if (typeof reminderTime.hour !== 'number' || 
        typeof reminderTime.minute !== 'number' ||
        reminderTime.hour < 0 || reminderTime.hour > 23 ||
        reminderTime.minute < 0 || reminderTime.minute > 59) {
      console.log('Invalid reminder time format in storage:', reminderTime);
      return null;
    }
    
    return reminderTime;
  } catch (error) {
    console.error('Error getting reminder time:', error);
    return null;
  }
}

// Request notification permissions
export async function requestNotificationPermissions() {
  if (!Device.isDevice) {
    console.log('Running on simulator - will attempt to register for notifications anyway');
    // Continue with permissions request even on simulator for testing
  }

  // If running in Expo Go with SDK 53+, notify but don't attempt to register
  if (isExpoGo && Platform.OS === 'android') {
    console.warn('Push notifications are not supported in Expo Go on Android with SDK 53+');
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
    
    console.log('Notification permission status:', finalStatus);
    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
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
      console.warn('Push notifications not available in Expo Go on Android with SDK 53+');
      console.log(`Reminder time saved (${hour}:${minute < 10 ? '0' + minute : minute}) but notification not scheduled`);
      return true; // Return true to allow onboarding to continue
    }
    
    // Ensure permissions are granted for other environments
    const permissionGranted = await requestNotificationPermissions();
    if (!permissionGranted) {
      console.log('Notification permission not granted');
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
    
    console.log(`Scheduling notification for ${hour}:${minute < 10 ? '0' + minute : minute}`);
    
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
      
      console.log('Reminder scheduled with ID:', identifier);
      
      // Check that the notification is actually scheduled
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('Number of scheduled notifications:', scheduledNotifications.length);
      
      if (scheduledNotifications.length === 0) {
        console.warn('⚠️ No scheduled notifications found after scheduling. This is likely due to limitations in Expo Go.');
        console.warn('Note: Daily notifications might not work correctly in Expo Go. Use a development build for full functionality.');
      } else {
        // Log the scheduled notification details
        scheduledNotifications.forEach((notification, index) => {
          console.log(`Scheduled notification ${index + 1}:`, {
            identifier: notification.identifier,
            trigger: notification.trigger,
            content: notification.content
          });
        });
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
      console.warn('Continuing without scheduling notification');
    }
    
    return true;
  } catch (error) {
    console.error('Error in scheduleDailyReminder:', error);
    return true; // Still return true to allow onboarding to continue
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  try {
    return await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error cancelling notifications:', error);
    return false;
  }
}

// Get all scheduled notifications
export async function getAllScheduledNotifications() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
} 