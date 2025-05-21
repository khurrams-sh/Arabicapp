import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getProfileData, saveProfileData, DIALECT_KEY } from '@/utils/profileStorage';

// Dialect interface
export interface Dialect {
  id: string;
  name: string;
  flag: string;
  description: string;
}

// Arabic dialects with appropriate flags/emoji
export const DIALECTS: Dialect[] = [
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

// Context interface
interface DialectContextType {
  dialect: Dialect | null;
  setDialect: (dialect: Dialect) => Promise<void>;
  isLoading: boolean;
}

// Create the context
const DialectContext = createContext<DialectContextType>({
  dialect: null,
  setDialect: async () => {},
  isLoading: true,
});

// Hook to use the dialect context
export const useDialect = () => useContext(DialectContext);

// Provider component
export function DialectProvider({ children }: { children: ReactNode }) {
  const [dialect, setDialectState] = useState<Dialect | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load dialect from storage on initial render
  useEffect(() => {
    const loadDialect = async () => {
      try {
        const dialectName = await getProfileData(DIALECT_KEY);
        if (dialectName) {
          const foundDialect = DIALECTS.find(d => d.name === dialectName);
          setDialectState(foundDialect || DIALECTS[0]);
        } else {
          // Default to the first dialect if none is saved
          setDialectState(DIALECTS[0]);
        }
      } catch (error) {
        setDialectState(DIALECTS[0]); // Fallback to first dialect
      } finally {
        setIsLoading(false);
      }
    };

    loadDialect();
  }, []);

  // Function to update dialect
  const setDialect = async (newDialect: Dialect) => {
    try {
      setDialectState(newDialect);
      await saveProfileData(DIALECT_KEY, newDialect.name);
    } catch (error) {
      // Handle error silently
    }
  };

  return (
    <DialectContext.Provider value={{ dialect, setDialect, isLoading }}>
      {children}
    </DialectContext.Provider>
  );
} 