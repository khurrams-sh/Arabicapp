import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Modal, FlatList, StyleSheet, Platform, Dimensions, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { triggerImpact } from '@/utils/haptics';
import { useDialect, DIALECTS } from '@/context/DialectContext';
import { useLearning } from '@/context/LearningContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';

// Import the Dialect type from context
import type { Dialect } from '@/context/DialectContext';

const { height } = Dimensions.get('window');

export function DialectSelector() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const { dialect, setDialect, isLoading } = useDialect();
  const { streak } = useLearning();
  const accentColor = useThemeColor({}, 'tint');
  const [selectedDialectId, setSelectedDialectId] = useState<string | null>(null);
  
  // Update local state when dialect changes
  useEffect(() => {
    if (dialect) {
      setSelectedDialectId(dialect.id);
    }
  }, [dialect]);
  
  // Handle selecting a dialect
  const handleSelectDialect = async (selectedDialect: Dialect) => {
    triggerImpact();
    setSelectedDialectId(selectedDialect.id); // Update UI immediately for responsiveness
    await setDialect(selectedDialect); // Save to context and backend
    setModalVisible(false);
  };
  
  // Main selector header component content
  const renderSelectorContent = () => {
    if (isLoading || !dialect) {
      return (
        <View style={[styles.dialectBadge, { 
          backgroundColor: colorScheme === 'dark' ? '#333333' : '#F5F5F7'
        }]}>
          <ThemedText style={styles.loadingText}>...</ThemedText>
        </View>
      );
    }
    
    return (
      <View style={[styles.dialectBadge, { 
        backgroundColor: colorScheme === 'dark' ? '#333333' : '#F5F5F7'
      }]}>
        <ThemedText style={styles.flagText}>{dialect.flag}</ThemedText>
        <ThemedText style={styles.dialectText}>{dialect.name.split(' ')[0]}</ThemedText>
        <Ionicons 
          name="chevron-down" 
          size={14} 
          color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
          style={styles.icon}
        />
      </View>
    );
  };
  
  return (
    <>
      <ThemedView style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity 
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
          style={styles.selectorTouch}
        >
          {renderSelectorContent()}
        </TouchableOpacity>

        {/* Streak counter */}
        <View style={styles.streakContainer}>
          <TouchableOpacity 
            style={[styles.streakIconContainer, { backgroundColor: accentColor }]}
            onPress={() => Alert.alert(
              'Daily Streak', 
              `You have a ${streak}-day streak! Complete at least one lesson each day to maintain your streak.`,
              [{ text: 'OK', style: 'default' }]
            )}
          >
            <FontAwesome5 name="fire" size={16} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.streakText}>{streak}</ThemedText>
        </View>
      </ThemedView>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <ThemedView 
            style={[styles.modalView, {
              paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 20
            }]}
          >
            <View style={styles.modalHandle} />
            <ThemedText type="title" style={styles.modalTitle}>Select Dialect</ThemedText>
            
            <FlatList
              data={DIALECTS}
              keyExtractor={(item) => item.id}
              style={styles.dialectList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dialectItem,
                    selectedDialectId === item.id && styles.selectedDialect,
                    { backgroundColor: colorScheme === 'dark' ? '#333333' : '#F5F5F7' }
                  ]}
                  onPress={() => handleSelectDialect(item)}
                >
                  <ThemedText style={styles.dialectFlag}>{item.flag}</ThemedText>
                  <ThemedText style={styles.dialectName}>{item.name}</ThemedText>
                  {selectedDialectId === item.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="#E5903A"
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
    zIndex: 10,
  },
  selectorTouch: {
    zIndex: 10,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  streakText: {
    fontWeight: '600',
    fontSize: 16,
  },
  dialectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  flagText: {
    fontSize: 20,
    marginRight: 8,
    lineHeight: 24,
  },
  dialectText: {
    fontSize: 14,
    fontWeight: '600',
  },
  icon: {
    marginLeft: 4,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Lighter backdrop (changed from 0.5)
  },
  modalView: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    alignSelf: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  dialectList: {
    maxHeight: height * 0.4, // Limit height to 40% of screen
  },
  dialectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedDialect: {
    borderWidth: 2,
    borderColor: '#E5903A',
  },
  dialectFlag: {
    fontSize: 30,
    width: 44,
    textAlign: 'center',
    lineHeight: 36,
  },
  dialectName: {
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 8,
  }
}); 