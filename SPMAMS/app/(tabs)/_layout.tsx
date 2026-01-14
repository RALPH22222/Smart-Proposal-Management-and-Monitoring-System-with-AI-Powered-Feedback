import React from 'react';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // 1. Hide the Top Header for all screens in this folder
        headerShown: false,
        
        // 2. Hide the Bottom Tab Bar for all screens in this folder
        tabBarStyle: { display: 'none' },
      }}>
      
      {/* 3. Render only the Index (Landing Page) */}
      <Tabs.Screen name="index" />

    </Tabs>
  );
}