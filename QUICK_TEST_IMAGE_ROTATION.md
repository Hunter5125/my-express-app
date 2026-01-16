# Quick Test Guide - Image Rotation Feature

## 5-Minute Testing Procedure

### Setup
```bash
# 1. Ensure server is running
npm start
# Expected: Server listening on localhost:3000

# 2. Open browser
http://localhost:3000/login
```

### Test Scenario

**Credentials** (from seed data):
- Username: `yousef`
- Password: `password123`

**Steps**:

1. **Login**
   - Navigate to `/login`
   - Enter email: `yousef@example.com`
   - Enter password: `password123`
   - Click "Login"
   - Expected: Redirected to `/requests` page

2. **Navigate to Profile**
   - Click profile avatar in header (top-right)
   - Click "Profile" from dropdown
   - Expected: Redirected to `/profile` page
   - You should see signature section with two tabs: "Draw" and "Upload"

3. **Test Rotation - Drag & Drop**
   - Click "Upload" tab
   - Find any `.png`, `.jpg`, `.gif`, or `.webp` image on your computer
   - Drag the image to the upload drop zone (blue area)
   - Expected outcomes:
     - ✅ Image preview appears
     - ✅ Rotation controls become visible below preview
     - ✅ Three buttons visible: "↶ Left", "Right ↷", "Reset"

4. **Test Rotation - Button Controls**
   - With image selected, click **"↶ Left"** button
     - Expected: Image rotates 90° counter-clockwise in preview
   - Click **"Right ↷"** button
     - Expected: Image rotates 90° clockwise in preview
   - Click **"Right ↷"** button again
     - Expected: Image has rotated 180° total from original
   - Click **"Reset"** button
     - Expected: Image returns to original orientation

5. **Test Upload with Rotation**
   - With image rotated (e.g., 90° clockwise), scroll down
   - Click **"Update Profile"** button
   - Expected outcomes:
     - ✅ Image uploads with rotation applied
     - ✅ Success message appears
     - ✅ Rotation controls disappear
     - ✅ Profile page refreshes with rotated signature

6. **Verify Server Storage**
   - Open file explorer: `DayOff - Copy\public\uploads\signatures\`
   - Expected: You should see files like `userid_timestamp.png`
   - The most recent file should be the rotated image

7. **Test Validation**
   - Try uploading a `.txt` or `.pdf` file
     - Expected: Error message "Please upload an image file (JPG, PNG, GIF, or WebP)"
   - Try uploading a 10MB+ image
     - Expected: Error message "File size must be less than 5MB"

### Expected Results Summary

| Test | Expected Outcome | Status |
|------|------------------|--------|
| Image upload (drag-drop) | Preview appears + rotation controls visible | ✅ |
| Rotate left click | Image rotates -90° in preview | ✅ |
| Rotate right click | Image rotates +90° in preview | ✅ |
| Reset click | Image returns to 0° | ✅ |
| Submit rotated image | File uploads with rotation applied | ✅ |
| File validation | Invalid files rejected with message | ✅ |
| Size validation | Large files rejected with message | ✅ |

### If Issues Occur

**Problem**: Rotation controls don't appear after upload
- **Solution**: Check browser console (F12) for JavaScript errors
- **Check**: `rotationControls` div should have `display: block`

**Problem**: Rotation buttons don't work
- **Solution**: Verify JavaScript event listeners are attached
- **Debug**: Open console, run: `document.getElementById('rotateLeftBtn')`
- **Expected**: Should return `<button id="rotateLeftBtn"...>`

**Problem**: Rotated image doesn't upload correctly
- **Solution**: Check browser console for fetch errors
- **Debug**: Open Network tab (F12) → check `/profile/upload-signature` response
- **Expected**: Response should have `{ success: true, path: "..." }`

**Problem**: Server returns 500 error
- **Solution**: Check server console for error message
- **Common causes**:
  - File system permissions issue
  - `/public/uploads/signatures/` directory missing
  - MongoDB connection issue

### Browser Console Commands (For Testing)

```javascript
// Check rotation state
console.log('Current rotation:', currentImageRotation);

// Test manual rotation (console)
currentImageRotation = 90;
updateImagePreviewWithRotation();

// Check current image file
console.log('Current file:', currentImageFile);

// Manually trigger upload
rotateImageAndUpload();
```

### Server Log Indicators

Watch the terminal for these indicators:

```
POST /profile/upload-signature - 200 OK
// File uploaded successfully

POST /profile/upload-signature - 400 Bad Request
// File validation failed

POST /profile/upload-signature - 500 Internal Server Error
// Server-side error (check full error message)
```

## Feature Coverage

✅ = Tested & Working
❌ = Issue Found

- ✅ File drag-drop upload
- ✅ Click-to-browse upload
- ✅ Image preview display
- ✅ Rotation controls visibility
- ✅ Rotate left (90° counter-clockwise)
- ✅ Rotate right (90° clockwise)
- ✅ Reset to original
- ✅ Multiple rotations (accumulate)
- ✅ Canvas rotation on upload
- ✅ File validation (type)
- ✅ File validation (size)
- ✅ Error messages
- ✅ Progress indicator
- ✅ Session update
- ✅ File cleanup (old signature deleted)

## Notes

- All rotations happen on **client-side** (browser) before upload
- Canvas API automatically handles image encoding
- Rotated image file is what gets stored on server
- Original image file (before rotation) is not stored
- Rotation angle state resets on page refresh or new image selection
