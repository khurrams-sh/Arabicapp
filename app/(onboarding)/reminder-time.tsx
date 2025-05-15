import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, useColorScheme, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import TransitionWrapper from '../../components/TransitionWrapper';
import { triggerImpact } from '../../utils/haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { saveReminderTime } from '../../utils/notifications';

export function ReminderTime() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { setProgressByScreen } = useOnboarding();
  
  // Secondary accent color from design tokens
  const accentColor = '#E5903A';
  
  // Default time (8:00 AM)
  const [time, setTime] = useState(new Date(new Date().setHours(8, 0, 0, 0)));
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');
  
  useEffect(() => {
    setProgressByScreen('reminder-time');
  }, []);
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setTime(selectedTime);
    }
    
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
  };
  
  const requestNotificationPermission = async () => {
    triggerImpact();
    
    try {
      // Get the selected time
      const selectedTime = {
        hour: time.getHours(),
        minute: time.getMinutes()
      };
      
      // Save the reminder time to AsyncStorage
      await saveReminderTime(selectedTime.hour, selectedTime.minute);
      
      console.log('User preferred reminder time saved:', selectedTime);
      
      // Navigate to next screen
      router.push('/(onboarding)/your-name');
      
    } catch (error) {
      console.log("Error saving reminder time:", error);
      // If there's an error, still proceed to next screen
      router.push('/(onboarding)/your-name');
    }
  };
  
  // Format time as 12-hour with AM/PM
  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${hours}:${formattedMinutes} ${ampm}`;
  };
  
  // For iOS/Android, generate time options at 1-minute intervals for the wheel picker
  const generateTimeOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute++) {
        const time = new Date(now);
        time.setHours(hour, minute, 0, 0);
        options.push({
          label: formatTime(time),
          value: time.toISOString(),
        });
      }
    }
    
    return options;
  };
  
  const timeOptions = generateTimeOptions();
  
  // Render the appropriate time picker based on platform
  const renderTimePicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <View style={styles.iosPickerContainer}>
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={handleTimeChange}
            textColor={colorScheme === 'dark' ? 'white' : 'black'}
            style={styles.iosPicker}
          />
        </View>
      );
    } else if (Platform.OS === 'android') {
      if (!showTimePicker) {
        return (
          <TouchableOpacity
            style={[
              styles.androidTimeButton,
              { 
                backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7',
                borderColor: colorScheme === 'dark' ? '#333333' : '#EBEBEB'
              }
            ]}
            onPress={() => setShowTimePicker(true)}
          >
            <ThemedText style={styles.selectedTime}>{formatTime(time)}</ThemedText>
            <Ionicons 
              name="time-outline" 
              size={24} 
              color={accentColor} 
            />
          </TouchableOpacity>
        );
      }
      
      return (
        showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={handleTimeChange}
          />
        )
      );
    } else {
      // Fallback for web/other platforms
      return (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={time.toISOString()}
            onValueChange={(itemValue) => setTime(new Date(itemValue))}
            style={[
              styles.picker,
              { 
                backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000'
              }
            ]}
            itemStyle={{ color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }}
          >
            {timeOptions.map((option, index) => (
              <Picker.Item key={index} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>
      );
    }
  };
  
  return (
    <ThemedView style={[styles.container, { paddingTop: 120, paddingBottom: insets.bottom }]}>
      <TransitionWrapper>
        <View style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>When would you like your daily practice reminder?</ThemedText>
          
          <ThemedText style={styles.description}>
            Setting a consistent daily practice time helps build a language learning habit.
          </ThemedText>
          
          {/* Time Picker */}
          <View style={styles.pickerWrapper}>
            {renderTimePicker()}
          </View>
          
          {/* Continue Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                { backgroundColor: accentColor }
              ]}
              onPress={requestNotificationPermission}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.buttonText}>Continue</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </TransitionWrapper>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '800',
    fontSize: 28,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 24,
    lineHeight: 22,
  },
  pickerWrapper: {
    marginTop: 20,
    alignItems: 'center',
  },
  iosPickerContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  iosPicker: {
    width: '100%',
    height: 180,
  },
  androidTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  selectedTime: {
    fontSize: 18,
    fontWeight: '600',
  },
  pickerContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  picker: {
    width: '100%',
    height: 180,
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: 20,
    width: '100%',
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default function Page() {
  return <ReminderTime />;
}