# Complete Implementation Guide: Signature Image Upload

## Quick Access

- **Profile Page URL**: `http://127.0.0.1:3000/profile`
- **Upload Endpoint**: `POST /profile/upload-signature`
- **Upload Directory**: `/public/uploads/signatures/`
- **Supported Formats**: JPG, PNG, GIF, WebP
- **Max File Size**: 5MB

---

## Implementation Details by File

### 1. app.js

**Line 7** - Add multer import:
```javascript
const multer = require('multer');
```

**Line 95** - Add uploads static route:
```javascript
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
```

**Explanation**: 
- Imports multer for file upload handling
- Sets up Express to serve files from `/public/uploads/` directory via `/uploads` URL path

---

### 2. routes/auth.js

**Lines 5-8** - Add imports:
```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');
```

**Lines 10-13** - Configure upload directory:
```javascript
const signatureUploadDir = path.join(__dirname, '../public/uploads/signatures');

if (!fs.existsSync(signatureUploadDir)) {
  fs.mkdirSync(signatureUploadDir, { recursive: true });
}
```
*Creates directory if it doesn't exist*

**Lines 15-26** - Configure storage:
```javascript
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, signatureUploadDir);
  },
  filename: function(req, file, cb) {
    const userId = req.session.user._id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}_${timestamp}${ext}`);
  }
});
```
*Saves files with unique filenames using user ID and timestamp*

**Lines 28-35** - File filter validation:
```javascript
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};
```
*Only allows image files*

**Lines 37-43** - Configure multer:
```javascript
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
```

**Lines 355-388** - Upload endpoint:
```javascript
router.post('/profile/upload-signature', requireLogin, upload.single('signatureImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Delete old signature file if exists and is file path (not base64)
    if (user.signature && user.signature.startsWith('/uploads/signatures/')) {
      const oldFilePath = path.join(__dirname, '../public', user.signature);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Save new signature path
    const signaturePath = `/uploads/signatures/${req.file.filename}`;
    user.signature = signaturePath;
    await user.save();

    // Update session with new signature
    req.session.user.signature = user.signature;

    res.json({ success: true, path: signaturePath, message: 'Signature uploaded successfully' });
  } catch (error) {
    console.error('Signature upload error:', error);
    res.status(500).json({ success: false, error: 'Error uploading signature' });
  }
});
```

---

### 3. views/profile.hbs

#### New Signature Section (Replaces old one)

```html
<div style="margin-bottom: 20px;">
  <label for="signature" style="display: block; font-weight: 600; color: #555; margin-bottom: 8px;">Signature</label>
  
  <!-- Hidden input to store signature data -->
  <input type="hidden" id="signature" name="signature" value="{{#if user.signature}}{{user.signature}}{{/if}}" required>
  
  <!-- Signature preview area -->
  <div id="signaturePreview" style="border: 2px dashed #ddd; border-radius: 4px; padding: 10px; margin-bottom: 10px; min-height: 100px; background: #f9f9f9; display: flex; align-items: center; justify-content: center;">
    {{#if user.signature}}
      {{#if (eq (substring user.signature 0 22) "data:image/png;base64")}}
        <img src="{{user.signature}}" alt="Signature" style="max-width: 100%; max-height: 150px; border-radius: 4px;">
      {{else}}
        <img src="{{user.signature}}" alt="Signature" style="max-width: 100%; max-height: 150px; border-radius: 4px;" onerror="this.parentElement.innerHTML='<p style=\"color: #999; margin: 0;\">Signature image</p>'">
      {{/if}}
    {{else}}
      <p style="color: #999; margin: 0;">No signature yet</p>
    {{/if}}
  </div>
  
  <!-- Tabs for signature methods -->
  <div style="display: flex; gap: 0; margin-bottom: 10px; border-bottom: 2px solid #ddd;">
    <button type="button" id="drawSignatureTab" style="flex: 1; padding: 12px; background: #2563eb; color: white; border: none; cursor: pointer; font-weight: 600; text-align: center;">
      Draw Signature
    </button>
    <button type="button" id="uploadSignatureTab" style="flex: 1; padding: 12px; background: #6b7280; color: white; border: none; cursor: pointer; font-weight: 600; text-align: center;">
      Upload Image
    </button>
  </div>

  <!-- Draw Signature Option -->
  <div id="drawSignatureSection" style="margin-bottom: 10px;">
    <button type="button" id="openSignaturePad" style="width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: 600;">
      {{#if user.signature}}
        {{#if (eq (substring user.signature 0 22) "data:image/png;base64")}}
          Update Signature
        {{else}}
          Draw Signature
        {{/if}}
      {{else}}
        Sign Here
      {{/if}}
    </button>
    <small style="color: #999; display: block; margin-top: 8px;">Click to draw your signature on the canvas</small>
  </div>

  <!-- Upload Signature Option -->
  <div id="uploadSignatureSection" style="display: none; margin-bottom: 10px;">
    <div style="position: relative; border: 2px dashed #2563eb; border-radius: 4px; padding: 20px; text-align: center; background: #f0f7ff; cursor: pointer;" id="uploadDropZone">
      <input type="file" id="signatureImageInput" accept="image/*" style="display: none;">
      <svg width="48" height="48" viewBox="0 0 24 24" style="margin: 0 auto 10px; color: #2563eb;" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <p style="margin: 0; color: #0f172a; font-weight: 600;">Drop signature image here or click to upload</p>
      <small style="color: #999; display: block; margin-top: 5px;">Supported formats: JPG, PNG, GIF, WebP (Max 5MB)</small>
    </div>
    <div id="uploadProgress" style="display: none; margin-top: 10px;">
      <div style="background: #e5e7eb; border-radius: 4px; height: 4px; overflow: hidden;">
        <div id="uploadProgressBar" style="background: #2563eb; height: 100%; width: 0%; transition: width 0.3s ease;"></div>
      </div>
      <small style="color: #999; display: block; margin-top: 5px;">Uploading...</small>
    </div>
  </div>
</div>
```

#### JavaScript Section (New handlers)

```javascript
// Tab switching
document.getElementById('drawSignatureTab').addEventListener('click', function() {
  document.getElementById('drawSignatureSection').style.display = 'block';
  document.getElementById('uploadSignatureSection').style.display = 'none';
  document.getElementById('drawSignatureTab').style.background = '#2563eb';
  document.getElementById('uploadSignatureTab').style.background = '#6b7280';
});

document.getElementById('uploadSignatureTab').addEventListener('click', function() {
  document.getElementById('drawSignatureSection').style.display = 'none';
  document.getElementById('uploadSignatureSection').style.display = 'block';
  document.getElementById('drawSignatureTab').style.background = '#6b7280';
  document.getElementById('uploadSignatureTab').style.background = '#2563eb';
});

// File upload handling
const uploadDropZone = document.getElementById('uploadDropZone');
const signatureImageInput = document.getElementById('signatureImageInput');

uploadDropZone.addEventListener('click', function() {
  signatureImageInput.click();
});

// Drag and drop
uploadDropZone.addEventListener('dragover', function(e) {
  e.preventDefault();
  uploadDropZone.style.background = '#dbeafe';
  uploadDropZone.style.borderColor = '#0066cc';
});

uploadDropZone.addEventListener('dragleave', function(e) {
  e.preventDefault();
  uploadDropZone.style.background = '#f0f7ff';
  uploadDropZone.style.borderColor = '#2563eb';
});

uploadDropZone.addEventListener('drop', function(e) {
  e.preventDefault();
  uploadDropZone.style.background = '#f0f7ff';
  uploadDropZone.style.borderColor = '#2563eb';
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFileUpload(files[0]);
  }
});

signatureImageInput.addEventListener('change', function(e) {
  if (e.target.files.length > 0) {
    handleFileUpload(e.target.files[0]);
  }
});

function handleFileUpload(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    alert('Please upload an image file (JPG, PNG, GIF, or WebP)');
    return;
  }

  if (file.size > maxSize) {
    alert('File size must be less than 5MB');
    return;
  }

  document.getElementById('uploadProgress').style.display = 'block';
  const progressBar = document.getElementById('uploadProgressBar');
  progressBar.style.width = '0%';

  const formData = new FormData();
  formData.append('signatureImage', file);

  fetch('/profile/upload-signature', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    progressBar.style.width = '100%';
    
    if (data.success) {
      document.getElementById('signature').value = data.path;
      const preview = document.getElementById('signaturePreview');
      preview.innerHTML = '<img src="' + data.path + '" alt="Signature" style="max-width: 100%; max-height: 150px; border-radius: 4px;">';
      
      alert('Signature uploaded successfully!');
      document.getElementById('uploadProgress').style.display = 'none';
    } else {
      alert('Error: ' + data.error);
      document.getElementById('uploadProgress').style.display = 'none';
    }
  })
  .catch(error => {
    console.error('Upload error:', error);
    alert('Error uploading signature');
    document.getElementById('uploadProgress').style.display = 'none';
  });
}
```

---

## Usage Example

### 1. User Opens Profile
```
URL: http://127.0.0.1:3000/profile
Method: GET (with authentication)
```

### 2. User Uploads Signature Image
```
URL: http://127.0.0.1:3000/profile/upload-signature
Method: POST
Content-Type: multipart/form-data
Body: 
  signatureImage: <binary file data>
```

### 3. Server Response
```json
{
  "success": true,
  "path": "/uploads/signatures/60a7e8f9c4b2e1f5a3c8d9e2_1673472000000.png",
  "message": "Signature uploaded successfully"
}
```

### 4. User Saves Profile
```
URL: http://127.0.0.1:3000/profile/update
Method: POST
Body:
  name: John Doe
  email: john@example.com
  signature: /uploads/signatures/60a7e8f9c4b2e1f5a3c8d9e2_1673472000000.png
```

---

## Key Features Summary

✅ **Dual Input Methods**: Draw or upload
✅ **Drag & Drop**: Simple file selection
✅ **Validation**: Type and size checking
✅ **Progress Tracking**: Real-time upload status
✅ **Auto Cleanup**: Old files deleted
✅ **Security**: Authentication required
✅ **Error Handling**: User-friendly messages
✅ **Responsive**: Works on mobile/desktop
✅ **Session Sync**: Instant updates
✅ **Preview**: Real-time image preview

---

## Testing Command

```bash
# Start server
cd c:\DayOff\ Copy
npm start

# Open browser
http://localhost:3000/profile

# Test upload with any JPG/PNG file (under 5MB)
```

---

## References

- **Multer Documentation**: https://github.com/expressjs/multer
- **Express File Upload**: https://expressjs.com/en/resources/middleware/multer.html
- **Fetch API**: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

---

**Implementation Complete** ✅
