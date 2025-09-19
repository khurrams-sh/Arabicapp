# Saylo AI - Arabic Learning App

A mobile app for practicing spoken Arabic through AI-powered voice conversations.

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: AWS Lambda + Supabase Edge Functions  
- **Database**: Supabase
- **AI**: OpenAI Whisper, GPT-4o, TTS

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app:
   ```bash
   npx expo start
   ```

3. Run on device:
   - Scan QR code with Expo Go app
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## Project Structure

- `app/` - React Native app with file-based routing
- `components/` - Reusable UI components
- `backend/` - Serverless function code
- `context/` - React context providers
- `utils/` - Helper functions

## Features

- Voice chat with AI tutor
- Multiple Arabic dialects (Egyptian, Levantine, Gulf, MSA)
- Lesson tracking and progress
- User authentication and profiles
