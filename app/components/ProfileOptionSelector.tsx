import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, FlatList, useColorScheme } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerImpact } from '../utils/haptics';

export interface OptionItem {
  id: string;
  name: string;
  flag?: string;
  icon?: React.ReactNode;
  description?: string;
  code?: string;
  iconName?: string;
  iconType?: string;
}

interface ProfileOptionSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (option: OptionItem) => void;
  title: string;
  options: OptionItem[];
  selectedId?: string;
}

export default function ProfileOptionSelector({
  isVisible,
  onClose,
  onSelect,
  title,
  options,
  selectedId
}: ProfileOptionSelectorProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const accentColor = '#E5903A';

  const handleSelect = (option: OptionItem) => {
    triggerImpact();
    onSelect(option);
    onClose();
  };

  // Helper function to render an icon based on its type and name
  const renderIcon = (item: OptionItem) => {
    if (item.icon) {
      return item.icon;
    }
    
    if (item.iconName && item.iconType) {
      const iconColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
      const size = 22;
      
      switch (item.iconType) {
        case 'Ionicons':
          return <Ionicons name={item.iconName as any} size={size} color={iconColor} />;
        case 'MaterialCommunityIcons':
          return <MaterialCommunityIcons name={item.iconName as any} size={size} color={iconColor} />;
        case 'FontAwesome5':
          return <FontAwesome5 name={item.iconName as any} size={size} color={iconColor} />;
        default:
          return null;
      }
    }
    
    return null;
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[
        styles.modalContainer,
        { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)' }
      ]}>
        <View style={[
          styles.modalContent,
          {
            backgroundColor: colorScheme === 'dark' ? '#181818' : '#FFFFFF',
            paddingBottom: insets.bottom + 20,
            paddingTop: 20,
          }
        ]}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
            <ThemedText style={styles.title}>{title}</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item.id}
            style={styles.optionsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7',
                    borderColor: item.id === selectedId ? accentColor : 'transparent',
                    borderWidth: item.id === selectedId ? 2 : 0,
                  }
                ]}
                onPress={() => handleSelect(item)}
              >
                {item.flag && (
                  <View style={[
                    styles.iconContainer,
                    { backgroundColor: colorScheme === 'dark' ? '#333333' : '#E8E8ED' }
                  ]}>
                    <ThemedText style={styles.flagText}>{item.flag}</ThemedText>
                  </View>
                )}
                
                {(item.icon || (item.iconName && item.iconType)) && (
                  <View style={[
                    styles.iconContainer,
                    { backgroundColor: colorScheme === 'dark' ? '#333333' : '#E8E8ED' }
                  ]}>
                    {renderIcon(item)}
                  </View>
                )}
                
                {item.code && (
                  <View style={[
                    styles.codeContainer,
                    { backgroundColor: colorScheme === 'dark' ? '#333333' : '#FFFFFF' }
                  ]}>
                    <ThemedText style={[styles.codeText, { color: accentColor }]}>
                      {item.code}
                    </ThemedText>
                  </View>
                )}
                
                <View style={styles.textContainer}>
                  <ThemedText style={styles.optionName}>{item.name}</ThemedText>
                  {item.description && (
                    <ThemedText style={styles.optionDescription}>{item.description}</ThemedText>
                  )}
                </View>
                
                {item.id === selectedId && (
                  <Ionicons name="checkmark-circle" size={24} color={accentColor} style={styles.checkmark} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 34, // Match the width of the close button for centering
  },
  optionsList: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  codeContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 3,
  },
  flagText: {
    fontSize: 24,
  },
  codeText: {
    fontSize: 20,
    fontWeight: '700',
  },
  checkmark: {
    marginLeft: 10,
  }
}); 