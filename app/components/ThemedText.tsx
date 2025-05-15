import React from 'react';
import { Text, TextProps, useColorScheme, TextStyle } from 'react-native';

interface ThemedTextProps extends TextProps {
  type?: 'default' | 'title' | 'subtitle' | 'body' | 'caption';
}

export function ThemedText({ 
  style, 
  type = 'default', 
  children, 
  ...rest 
}: ThemedTextProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Base text styles for different types
  const getTypeStyle = (): TextStyle => {
    switch (type) {
      case 'title':
        return { fontSize: 24, fontWeight: '700' as TextStyle['fontWeight'] };
      case 'subtitle':
        return { fontSize: 18, fontWeight: '600' as TextStyle['fontWeight'] };
      case 'body':
        return { fontSize: 16, fontWeight: '400' as TextStyle['fontWeight'] };
      case 'caption':
        return { fontSize: 14, fontWeight: '400' as TextStyle['fontWeight'], opacity: 0.8 };
      default:
        return {};
    }
  };

  return (
    <Text
      style={[
        { color: isDark ? '#FFFFFF' : '#000000' },
        getTypeStyle(),
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export default ThemedText; 