# Quick Reference: Signature Image Upload Feature

## What's New?

Users can now **upload signature images** on their profile page, in addition to drawing signatures with the signature pad.

## Where?
**URL**: `http://127.0.0.1:3000/profile`

## How to Use?

### Method 1: Upload Image File
1. Go to profile page
2. Click the **"Upload Image"** tab
3. Either:
   - **Click the drop zone** to browse and select a signature image
   - **Drag & drop** a signature image onto the upload area
4. System validates file (must be JPG/PNG/GIF/WebP, max 5MB)
5. Image appears in preview
6. Click "Update Profile" to save

### Method 2: Draw Signature (Existing)
1. Go to profile page
2. Click the **"Draw Signature"** tab
3. Click "Sign Here" button
4. Draw signature on canvas
5. Click "Save Signature"
6. Drawing appears in preview
7. Click "Update Profile" to save

## Supported Image Formats
- JPG/JPEG
- PNG
- GIF
- WebP

## File Size Limit
**Maximum 5MB per image**

## What Gets Stored?
- **Drawn signatures**: Stored as PNG data (base64)
- **Uploaded images**: Stored as file path (`/uploads/signatures/...`)

System automatically displays whichever type is stored.

## Features
✅ Drag-and-drop support
✅ Click-to-upload browser
✅ Real-time preview
✅ File validation
✅ Progress indicator
✅ Automatic old file cleanup
✅ No page reload required

## API Endpoint (For Developers)

```
POST /profile/upload-signature
Content-Type: multipart/form-data

Body:
- signatureImage: <File>

Success Response:
{
  "success": true,
  "path": "/uploads/signatures/userId_timestamp.ext",
  "message": "Signature uploaded successfully"
}
```

## Files Changed
1. `app.js` - Added multer and uploads route
2. `routes/auth.js` - Added upload endpoint and configuration
3. `views/profile.hbs` - Added upload UI and handlers
4. Created: `public/uploads/signatures/` (directory)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Only image files allowed" | Upload JPG, PNG, GIF, or WebP files only |
| "File size must be less than 5MB" | Use a smaller image file |
| Upload not working | Ensure you're logged in and at `/profile` |
| Preview not showing | Check browser console for errors |
| Drag-drop not working | Your browser may not support HTML5 drag-drop |

## Mobile Friendly?
Yes! The upload feature works on mobile browsers that support file input and the fetch API.
