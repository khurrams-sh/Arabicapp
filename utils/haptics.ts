import * as Haptics from 'expo-haptics';

/**
 * Utility functions for haptic feedback throughout the app
 */

/**
 * Triggers light haptic feedback for selection changes (buttons, toggles)
 */
export const triggerSelection = () => {
  Haptics.selectionAsync();
};

/**
 * Triggers medium impact haptic feedback for more significant actions (confirmations)
 */
export const triggerImpact = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

/**
 * Triggers light impact haptic feedback for subtle interactions
 */
export const triggerLightImpact = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Triggers heavy impact haptic feedback for major actions
 */
export const triggerHeavyImpact = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

/**
 * Triggers notification haptic feedback for success events
 */
export const triggerSuccess = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Triggers notification haptic feedback for error events
 */
export const triggerError = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

/**
 * Triggers notification haptic feedback for warning events
 */
export const triggerWarning = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}; 