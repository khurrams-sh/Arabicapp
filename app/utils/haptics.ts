import * as Haptics from 'expo-haptics';

/**
 * Triggers a light haptic impact feedback
 * Used for button presses and UI interactions
 */
export const triggerImpact = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Fail silently - haptics might not be available on all devices
    console.log('Haptics not available', error);
  }
};

/**
 * Triggers a success haptic notification
 * Used for successful operations
 */
export const triggerSuccess = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    // Fail silently
    console.log('Haptics not available', error);
  }
};

/**
 * Triggers an error haptic notification
 * Used for errors and warnings
 */
export const triggerError = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    // Fail silently
    console.log('Haptics not available', error);
  }
};

export default {
  triggerImpact,
  triggerSuccess,
  triggerError
}; 