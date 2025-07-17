# Photo Session Sharing Feature

This feature allows photographers to share their completed photo sessions with clients, models, or other collaborators through a read-only link.

## Features

### 1. Share Button
- Located in the header of completed photo sessions
- Shows a share icon (upload arrow) next to the refresh button
- Only visible for sessions with `status: 'complete'`

### 2. QR Code Modal
- Displays when the share button is clicked
- Shows a QR code that can be scanned to access the shared session
- Includes a copyable share link
- Uses a free QR code API service (qr-server.com)

### 3. Shared Session Page
- Read-only version of the session page
- Located at `/share/[sessionId]`
- Shows all session content including:
  - Storyboard images
  - Shoot plan with locations
  - Equipment requirements
  - Special requests
  - Session timeline
- Includes "Read Only" indicator in the header
- Same navigation between storyboard and plan views

## How It Works

1. **Creating a Share Link**: When a photographer clicks the share button, the system generates a unique URL pointing to `/share/[sessionId]`

2. **QR Code Generation**: The QR code is generated using the qr-server.com API, which creates a QR code image that links to the share URL

3. **Accessing Shared Sessions**: Anyone with the link can view the session content, but cannot edit or modify anything

4. **Data Source**: Currently loads session data from localStorage (in production, this would be from a public API endpoint)

## Security & Privacy

- **Public Access**: Anyone with the link can view the session
- **Read-Only**: Shared sessions cannot be modified
- **No Authentication**: No login required to view shared sessions
- **Session Status**: Only completed sessions can be shared

## Implementation Details

### Routes
- `/share/[id]` - Public share page for session viewing

### Components
- `QRCodeModal` - Modal component for displaying QR code and share link
- `SharePage` - Read-only session viewing page

### API Integration
- Uses qr-server.com free API for QR code generation
- No backend database required (uses localStorage for demo)

## Usage

1. Complete a photo session until it reaches `status: 'complete'`
2. Click the share button (↗) in the session header
3. Copy the link or scan the QR code
4. Share with clients, models, or collaborators
5. Recipients can view the full session plan and storyboard

## Future Enhancements

- Add expiration dates for shared links
- Password protection for sensitive sessions
- Analytics to track who viewed shared sessions
- Export to PDF functionality
- Custom branding for shared sessions
- Email sharing integration 