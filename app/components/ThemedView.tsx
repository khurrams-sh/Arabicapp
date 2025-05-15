import React from 'react';
import { View, ViewProps, useColorScheme } from 'react-native';

export function ThemedView({ 
  style, 
  children, 
  ...rest 
}: ViewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        { backgroundColor: isDark ? '#121212' : '#FFFFFF' },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

export default ThemedView; 