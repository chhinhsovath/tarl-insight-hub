# Participant Portal

A dedicated portal for training participants to access their personal training dashboard.

## Features

### 🔐 Simple Authentication
- Login with name and phone number
- No complex passwords or usernames
- Secure session management

### 📊 Personal Dashboard
- Training history and progress tracking
- Attendance statistics and rates
- Profile information management

### 📋 Training Records
- View all attended training sessions
- See registration status and dates
- Track completion certificates

### 📥 Material Downloads
- Download training materials for attended sessions
- Organized zip files with session materials
- Access handouts, presentations, and resources

### 🌐 Localization
- Full Khmer and English support
- Easy language switching
- Culturally appropriate translations

### 📱 Mobile-Friendly
- Responsive design for all devices
- Touch-friendly interface
- Works on smartphones and tablets

## How It Works

### For Participants:
1. Visit `/participant` to access the portal
2. Enter your full name and phone number (as registered for training)
3. Access your personal dashboard with:
   - Training history
   - Attendance statistics
   - Material downloads
   - Certificate tracking

### Security:
- Participants must have attended at least one training session
- Authentication based on registered name and phone combination
- Session-based access control
- Download activity logging

### Material Access:
- Materials only available for attended sessions
- Automatic zip file generation
- Includes session information and materials list
- Download tracking for audit purposes

## Database Tables

The portal uses these existing tables plus new ones:

### Existing:
- `tbl_tarl_training_registrations` - Participant registrations
- `tbl_tarl_training_sessions` - Training session details
- `tbl_tarl_training_materials` - Available materials

### New:
- `tbl_tarl_material_downloads` - Download activity tracking
- `tbl_tarl_participant_sessions` - Session management (optional)

## API Endpoints

- `POST /api/participant/auth` - Participant authentication
- `POST /api/participant/trainings` - Get training history
- `POST /api/participant/materials/[sessionId]` - Download materials

## Setup

1. Run the database script: `scripts/create-participant-portal-tables.sql`
2. Ensure training materials exist in `tbl_tarl_training_materials`
3. Portal is accessible at `/participant`

## Benefits

- **Separate from main platform**: Completely isolated participant access
- **No complex permissions**: Simple name/phone authentication
- **Self-service**: Participants can access their own data
- **Material distribution**: Easy way to share training resources
- **Progress tracking**: Participants can monitor their learning journey
- **Mobile accessible**: Works on any device
- **Multilingual**: Supports local language preferences