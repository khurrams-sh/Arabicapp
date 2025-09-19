# Backend Serverless Functions

This directory contains the serverless function code for the Saylo AI Arabic learning app.

## Structure

- `lambda-functions/` - AWS Lambda functions (voice processing, AI conversation)
- `supabase-functions/` - Supabase Edge Functions (voice cloning, TTS)

## Current Endpoints

### AWS Lambda (via API Gateway)
- Voice processing: `https://w64z7ms51i.execute-api.us-east-1.amazonaws.com/voice`
- TTS processing: `https://kzbszaiq6l.execute-api.us-east-1.amazonaws.com/tts`

### Supabase Edge Functions
- Voice clone: `https://sayloai.supabase.co/functions/v1/voice-clone`
- Text-to-speech: `https://sayloai.supabase.co/functions/v1/text-to-speech`

## TODO
Add the actual function code files to these directories.
