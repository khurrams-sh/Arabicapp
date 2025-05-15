import React from 'react';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons'; 

// Constants for profile settings
export const ACCENT_COLOR = '#E5903A';

// Common languages with their flags
export const LANGUAGES = [
  { id: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'es', name: 'Spanish', flag: '🇪🇸' },
  { id: 'fr', name: 'French', flag: '🇫🇷' },
  { id: 'de', name: 'German', flag: '🇩🇪' },
  { id: 'it', name: 'Italian', flag: '🇮🇹' },
  { id: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { id: 'ru', name: 'Russian', flag: '🇷🇺' },
  { id: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { id: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { id: 'ko', name: 'Korean', flag: '🇰🇷' },
  { id: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { id: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { id: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { id: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { id: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { id: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { id: 'pl', name: 'Polish', flag: '🇵🇱' },
  { id: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { id: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { id: 'fa', name: 'Farsi', flag: '🇮🇷' },
  { id: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { id: 'el', name: 'Greek', flag: '🇬🇷' },
  { id: 'cs', name: 'Czech', flag: '🇨🇿' },
  { id: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { id: 'th', name: 'Thai', flag: '🇹🇭' },
];

// Arabic dialects with appropriate flags/emoji
export const DIALECTS = [
  { 
    id: 'egyptian', 
    name: 'Egyptian Arabic', 
    flag: '🇪🇬',
    description: 'The most widely understood dialect due to Egypt\'s media influence'
  },
  { 
    id: 'gulf', 
    name: 'Gulf Arabic', 
    flag: '🇸🇦',
    description: 'Spoken in Saudi Arabia, UAE, Kuwait, and other Gulf countries'
  },
  { 
    id: 'levantine', 
    name: 'Levantine Arabic', 
    flag: '🇱🇧',
    description: 'Spoken in Jordan, Lebanon, Syria, and Palestine'
  },
  { 
    id: 'classical', 
    name: 'Classical Arabic', 
    flag: '🏛️',
    description: 'Formal Arabic used in literature, media, and formal settings'
  }
];

// Arabic proficiency levels using CEFR standard
export const ARABIC_LEVELS = [
  { 
    id: 'a1', 
    name: 'I\'m new to this language',
    code: 'A1',
    description: 'Beginner' 
  },
  { 
    id: 'a2', 
    name: 'I know a few sentences',
    code: 'A2',
    description: 'Elementary' 
  },
  { 
    id: 'b1', 
    name: 'I can manage simple conversations',
    code: 'B1',
    description: 'Intermediate' 
  },
  { 
    id: 'b2', 
    name: 'I can communicate comfortably with native speakers',
    code: 'B2',
    description: 'Upper Intermediate' 
  },
  { 
    id: 'c1', 
    name: 'I\'m an expert',
    code: 'C1',
    description: 'Advanced' 
  },
  { 
    id: 'c2', 
    name: 'I\'m a native-level speaker',
    code: 'C2',
    description: 'Mastery' 
  }
];

// Function to get learning source options with icon names instead of JSX
export const getLearningSourceOptions = (iconColor: string) => [
  { 
    id: 'school', 
    name: 'School', 
    iconName: 'school',
    iconType: 'Ionicons'
  },
  { 
    id: 'language-school', 
    name: 'Language School', 
    iconName: 'book-education',
    iconType: 'MaterialCommunityIcons'
  },
  { 
    id: 'university', 
    name: 'College/University', 
    iconName: 'school-outline',
    iconType: 'Ionicons'
  },
  { 
    id: 'personal-tutor', 
    name: 'Personal Tutor', 
    iconName: 'person',
    iconType: 'Ionicons'
  },
  { 
    id: 'religious', 
    name: 'Religious Institution', 
    iconName: 'mosque',
    iconType: 'FontAwesome5'
  },
  { 
    id: 'self-taught', 
    name: 'Self-taught', 
    iconName: 'book-open-variant',
    iconType: 'MaterialCommunityIcons'
  },
  { 
    id: 'none', 
    name: 'No prior learning', 
    iconName: 'book-open-page-variant',
    iconType: 'MaterialCommunityIcons'
  }
];

export default {
  ACCENT_COLOR,
  LANGUAGES,
  DIALECTS,
  ARABIC_LEVELS,
  getLearningSourceOptions
};