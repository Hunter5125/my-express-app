# Signature Image Upload Implementation

## Overview
Users can now upload signature images directly on the profile page at `http://127.0.0.1:3000/profile`. The system supports both **drawing signatures** (using the existing signature pad) and **uploading signature images**.

## Features Implemented

### 1. **Dual Signature Methods**
   - **Draw Signature**: Continue using the existing canvas-based signature pad
   - **Upload Image**: New feature to upload pre-existing signature images

### 2. **Image Upload Support**
   - **Supported Formats**: JPG, PNG, GIF, WebP
   - **Maximum File Size**: 5MB
   - **Upload Methods**:
     - Click to browse and select file
     - Drag and drop image onto upload zone

### 3. **File Management**
   - Uploaded signatures stored in `/public/uploads/signatures/`
   - Old uploaded signature files are automatically deleted when replaced
   - Files named as: `{userId}_{timestamp}.{extension}`

### 4. **User Experience**
   - Tab-based interface: "Draw Signature" | "Upload Image"
   - Visual preview of current signature
   - Drag-and-drop upload area
   - Upload progress indicator
   - Success/error feedback messages

## Technical Implementation

### Dependencies Added
- **multer** (v2.0.2): Handles file uploads with multipart/form-data

### Files Modified

#### 1. `app.js`
- Imported multer module
- Added static route to serve uploaded files: `/uploads`
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
```

#### 2. `routes/auth.js`
- **Multer Configuration**:
  - Storage location: `public/uploads/signatures/`
  - Filename pattern: `{userId}_{timestamp}.{ext}`
  - File filter: Only image files (jpeg, png, gif, webp)
  - Size limit: 5MB

- **New Endpoint**: `POST /profile/upload-signature`
  - Accepts multipart/form-data with `signatureImage` field
  - Validates file type and size
  - Deletes old uploaded signature if exists
  - Returns JSON response with upload status and file path
  - Updates user session with new signature path

#### 3. `views/profile.hbs`
- **UI Changes**:
  - Added tab interface for signature methods
  - Created upload drop zone with drag-and-drop support
  - Added file input (hidden) for click-to-upload
  - Signature preview area supports both base64 and file path images

- **JavaScript Enhancements**:
  - Tab switching between draw and upload methods
  - Drag-and-drop event handlers
  - File validation (type and size)
  - Fetch-based upload without page reload
  - Upload progress tracking
  - Dynamic preview update

### Directory Structure
```
public/
├── uploads/
│   └── signatures/          (Created for storing uploaded signatures)
├── styles.css
├── requests.css
└── images/
```

## Data Storage

### User Model
The existing `signature` field stores:
- **Base64 Data URLs** for drawn signatures: `data:image/png;base64,...`
- **File Paths** for uploaded signatures: `/uploads/signatures/{userId}_{timestamp}.ext`

The system intelligently differentiates between the two types when displaying.

## API Endpoint

### Upload Signature Image
```
POST /profile/upload-signature
Content-Type: multipart/form-data

Parameters:
- signatureImage: File (image only, max 5MB)

Response (JSON):
{
  "success": true,
  "path": "/uploads/signatures/userId_timestamp.png",
  "message": "Signature uploaded successfully"
}

Error Response:
{
  "success": false,
  "error": "Error message describing the issue"
}
```

## Usage Flow

1. **User navigates to Profile**: `http://127.0.0.1:3000/profile`

2. **Choose Signature Method**:
   - Click "Draw Signature" tab → Use existing signature pad
   - Click "Upload Image" tab → Upload signature image

3. **Upload Image**:
   - Drag image onto drop zone OR
   - Click drop zone to browse and select file
   - System validates file type and size
   - Progress indicator shows upload status
   - Success message confirms upload

4. **Update Profile**:
   - Click "Update Profile" button to save changes
   - Signature is stored (either as base64 or file path)
   - Session updated with new signature

5. **View Signature**:
   - Displays in preview area on profile page
   - Used throughout system (approvals, requests, etc.)

## Security Features

✅ **File Type Validation**: Only image files accepted (mime type check)
✅ **Size Limit**: Maximum 5MB per file
✅ **User Session Required**: Upload requires authentication
✅ **File Naming**: Includes user ID and timestamp for uniqueness
✅ **Automatic Cleanup**: Old files deleted when new signature uploaded

## Browser Compatibility

- ✅ Chrome/Edge (Drag-drop, fetch API)
- ✅ Firefox (Drag-drop, fetch API)
- ✅ Safari (Drag-drop, fetch API)
- ✅ Modern mobile browsers (file input)

## Testing Checklist

- [ ] Navigate to profile page
- [ ] Try drawing a signature with signature pad
- [ ] Try uploading a JPG/PNG image (should succeed)
- [ ] Try uploading oversized file (>5MB, should fail)
- [ ] Try uploading non-image file (should fail)
- [ ] Test drag-drop functionality
- [ ] Verify preview updates after upload
- [ ] Verify session persists after page reload
- [ ] Verify uploaded file accessible at path
- [ ] Test with different image formats (JPG, PNG, GIF, WebP)

## Notes

- Uploaded signatures appear in subsequent request approvals
- System detects image type automatically on display
- Failed uploads don't affect existing signature
- Users can switch between drawing and uploading anytime
- Upload happens without page reload (fetch API)

---

**Version**: 1.0
**Last Updated**: January 12, 2026
