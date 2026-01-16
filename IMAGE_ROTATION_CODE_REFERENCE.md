# Image Rotation Feature - Visual Guide & Code Reference

## Feature Visual Flow

```
┌─────────────────────────────────────────────────────────┐
│          PROFILE PAGE (/profile)                         │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Signature Section                                  │ │
│  │                                                    │ │
│  │  [Draw Tab] [Upload Tab] ← User clicks Upload     │ │
│  │                                                    │ │
│  │  Upload Signature Option:                         │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ Drag image here or click to browse           │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  After image selected:                           │ │
│  │  [Image Preview: 150px max]                      │ │
│  │                                                    │ │
│  │  ┌── ROTATION CONTROLS (NEW) ───────────────────┐│ │
│  │  │ Rotate Image:                                 ││ │
│  │  │ [↶ Left] [Right ↷] [Reset]                   ││ │
│  │  └───────────────────────────────────────────────┘│ │
│  │                                                    │ │
│  │  [Uploading...] ← Progress bar while uploading   │ │
│  │                                                    │ │
│  │  [Update Profile] ← Submit to save               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Interaction Flow Diagram

```
START
  │
  ├─ User navigates to /profile page
  │
  ├─ Clicks "Upload" tab in signature section
  │
  ├─ Drops or selects image file
  │
  ├─ File validation:
  │  ├─ Is type JPEG/PNG/GIF/WebP? → If NO → Error message
  │  └─ Is size < 5MB? → If NO → Error message
  │
  ├─ File accepted:
  │  ├─ FileReader.readAsDataURL()
  │  ├─ Display preview image
  │  └─ Show rotation controls
  │
  ├─ User sees rotation controls (↶ Left, Right ↷, Reset)
  │
  ├─ User clicks rotation button(s)
  │  ├─ Rotation angle updates (-90° or +90° or reset to 0°)
  │  ├─ CSS transform applied to preview
  │  └─ Image appears rotated immediately
  │
  ├─ User submits form (clicks "Update Profile")
  │
  ├─ JavaScript rotateImageAndUpload() function:
  │  ├─ Check rotation angle
  │  ├─ If rotated:
  │  │  ├─ Create Canvas element
  │  │  ├─ Load image into canvas
  │  │  ├─ Apply rotation transform
  │  │  ├─ Convert to blob
  │  │  └─ Create new File object
  │  └─ Upload rotated file (or original if no rotation)
  │
  ├─ FormData sent to server: POST /profile/upload-signature
  │
  ├─ Server-side (routes/auth.js):
  │  ├─ Validate file again
  │  ├─ Save to /public/uploads/signatures/
  │  ├─ Delete old signature file
  │  ├─ Update user document
  │  ├─ Update session
  │  └─ Return {success: true, path: "..."}
  │
  ├─ Client receives success response:
  │  ├─ Show success message
  │  ├─ Hide rotation controls
  │  ├─ Update preview with new path
  │  └─ Clear form state
  │
  └─ END (signature saved with rotation applied)
```

## Code Reference Map

### Location 1: HTML Rotation Controls
**File**: `views/profile.hbs`
**Lines**: 138-150

```handlebars
<!-- Image Rotation Controls (shown after image selected) -->
<div id="rotationControls" style="display: none; margin-top: 10px; padding: 10px; background: #f0f7ff; border-radius: 4px; border: 1px solid #2563eb;">
  <small style="color: #0f172a; display: block; margin-bottom: 8px; font-weight: 600;">Rotate Image:</small>
  <div style="display: flex; gap: 10px; justify-content: center;">
    <button type="button" id="rotateLeftBtn" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 5px;">
      ↶ Left
    </button>
    <button type="button" id="rotateRightBtn" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 5px;">
      Right ↷
    </button>
    <button type="button" id="resetRotationBtn" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
      Reset
    </button>
  </div>
</div>
```

### Location 2: Rotation State & Event Listeners
**File**: `views/profile.hbs`
**Lines**: 315-370

```javascript
// Rotation state management
let currentImageFile = null;
let currentImageRotation = 0;

// Rotation button event listeners
document.getElementById('rotateLeftBtn').addEventListener('click', function(e) {
  e.preventDefault();
  currentImageRotation = (currentImageRotation - 90) % 360;
  updateImagePreviewWithRotation();
});

document.getElementById('rotateRightBtn').addEventListener('click', function(e) {
  e.preventDefault();
  currentImageRotation = (currentImageRotation + 90) % 360;
  updateImagePreviewWithRotation();
});

document.getElementById('resetRotationBtn').addEventListener('click', function(e) {
  e.preventDefault();
  currentImageRotation = 0;
  updateImagePreviewWithRotation();
});

// Update preview with rotation
function updateImagePreviewWithRotation() {
  const preview = document.getElementById('signaturePreview');
  const img = preview.querySelector('img');
  if (img) {
    img.style.transform = 'rotate(' + currentImageRotation + 'deg)';
  }
}
```

### Location 3: File Upload & Preview
**File**: `views/profile.hbs`
**Lines**: 378-403

```javascript
function handleFileUpload(file) {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    alert('Please upload an image file (JPG, PNG, GIF, or WebP)');
    return;
  }

  if (file.size > maxSize) {
    alert('File size must be less than 5MB');
    return;
  }

  // Store file and reset rotation
  currentImageFile = file;
  currentImageRotation = 0;

  // Read and preview file
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('signaturePreview');
    preview.innerHTML = '<img src="' + e.target.result + '" alt="Signature" style="max-width: 100%; max-height: 150px; border-radius: 4px; transition: transform 0.3s ease;">';
    
    // Show rotation controls after image loaded
    document.getElementById('rotationControls').style.display = 'block';
  };
  reader.readAsDataURL(file);
}
```

### Location 4: Canvas Rotation & Upload
**File**: `views/profile.hbs`
**Lines**: 405-440

```javascript
// Function to rotate image using Canvas API and upload
function rotateImageAndUpload() {
  if (!currentImageFile) {
    alert('No image selected');
    return;
  }

  // If no rotation applied, skip canvas and upload directly
  if (currentImageRotation === 0 || currentImageRotation % 360 === 0) {
    uploadImage(currentImageFile);
    return;
  }

  // Create canvas to rotate image
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Adjust canvas dimensions for 90/270 degree rotations
      if (currentImageRotation === 90 || currentImageRotation === 270) {
        canvas.width = img.height;   // Swap dimensions
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      
      // Apply rotation transformation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((currentImageRotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      // Convert rotated canvas to blob and upload
      canvas.toBlob(function(blob) {
        const rotatedFile = new File([blob], currentImageFile.name, { type: currentImageFile.type });
        uploadImage(rotatedFile);
      }, currentImageFile.type);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(currentImageFile);
}
```

### Location 5: Image Upload Function
**File**: `views/profile.hbs`
**Lines**: 442-475

```javascript
function uploadImage(fileToUpload) {
  // Show progress
  document.getElementById('uploadProgress').style.display = 'block';
  const progressBar = document.getElementById('uploadProgressBar');
  progressBar.style.width = '0%';

  // Create form data
  const formData = new FormData();
  formData.append('signatureImage', fileToUpload);

  // Upload file via POST request
  fetch('/profile/upload-signature', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    progressBar.style.width = '100%';
    
    if (data.success) {
      // Update hidden input and preview
      document.getElementById('signature').value = data.path;
      const preview = document.getElementById('signaturePreview');
      preview.innerHTML = '<img src="' + data.path + '" alt="Signature" style="max-width: 100%; max-height: 150px; border-radius: 4px;">';
      
      // Success feedback
      alert('Signature uploaded successfully!');
      document.getElementById('uploadProgress').style.display = 'none';
      document.getElementById('rotationControls').style.display = 'none';
      
      // Reset state
      currentImageFile = null;
      currentImageRotation = 0;
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

## CSS Styling Reference

### Rotation Controls Container
```css
#rotationControls {
  display: none;                    /* Hidden by default */
  margin-top: 10px;
  padding: 10px;
  background: #f0f7ff;              /* Light blue background */
  border-radius: 4px;
  border: 1px solid #2563eb;        /* Blue border */
}
```

### Button Styling
```css
#rotateLeftBtn {
  padding: 8px 16px;
  background: #6b7280;              /* Gray */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

#rotateRightBtn {
  padding: 8px 16px;
  background: #2563eb;              /* Blue */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

#resetRotationBtn {
  padding: 8px 16px;
  background: #ef4444;              /* Red */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}
```

### Image Preview Transform
```css
img {
  max-width: 100%;
  max-height: 150px;
  border-radius: 4px;
  transition: transform 0.3s ease;  /* Smooth rotation animation */
  transform: rotate(90deg);          /* Applied by JavaScript */
}
```

## JavaScript API Reference

### Key Variables
| Variable | Type | Purpose | Default |
|----------|------|---------|---------|
| `currentImageFile` | File | Stores selected file object | `null` |
| `currentImageRotation` | Number | Tracks rotation angle in degrees | `0` |

### Key Functions
| Function | Purpose | Called By |
|----------|---------|-----------|
| `handleFileUpload(file)` | Validate file, store, show preview | File input change event |
| `updateImagePreviewWithRotation()` | Apply CSS transform to preview | Rotation button clicks |
| `rotateImageAndUpload()` | Rotate using Canvas API and upload | Form submission |
| `uploadImage(fileToUpload)` | Send file to server | rotateImageAndUpload() |

### Event Flow
```
File selected
  ↓ triggers signatureImageInput.change
  ↓
handleFileUpload(file)
  ├─ Validate file type ✓
  ├─ Validate file size ✓
  ├─ Store in currentImageFile ✓
  ├─ Reset currentImageRotation to 0 ✓
  ├─ Display preview image ✓
  └─ Show rotationControls ✓
  
User clicks rotation button
  ↓ triggers rotateLeftBtn/rotateRightBtn/resetRotationBtn.click
  ↓
Event listener function
  ├─ Update currentImageRotation angle ✓
  └─ Call updateImagePreviewWithRotation() ✓
  
updateImagePreviewWithRotation()
  ├─ Get preview element ✓
  ├─ Get image inside preview ✓
  └─ Apply CSS transform: rotate(90deg) ✓
  
User submits form
  ↓ triggers profileForm.submit
  ↓
Form submission handler
  ├─ Check if image selected ✓
  └─ Call rotateImageAndUpload() ✓
  
rotateImageAndUpload()
  ├─ Check rotation angle ✓
  ├─ If rotated:
  │  ├─ Create Canvas ✓
  │  ├─ Draw rotated image ✓
  │  ├─ Convert to Blob ✓
  │  └─ Create new File ✓
  └─ Call uploadImage(fileToUpload) ✓
  
uploadImage(fileToUpload)
  ├─ Create FormData ✓
  ├─ POST to /profile/upload-signature ✓
  ├─ Show progress bar ✓
  └─ Update preview on success ✓
```

## Canvas Rotation Math

### Rotation Formula
```javascript
// Angle in radians = angle in degrees × π / 180
const radians = (degrees * Math.PI) / 180;

// Example: 90 degrees
const radians = (90 * Math.PI) / 180; // 1.5708 radians
```

### Canvas Transform Steps
```javascript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Step 1: Translate to center of canvas
ctx.translate(canvas.width / 2, canvas.height / 2);

// Step 2: Rotate around center
ctx.rotate((angle * Math.PI) / 180);

// Step 3: Draw image centered at origin
ctx.drawImage(img, -img.width / 2, -img.height / 2);
```

### Canvas Size Adjustment (90° & 270° Rotations)
```javascript
if (angle === 90 || angle === 270) {
  // Swap width and height for 90 and 270 degree rotations
  canvas.width = img.height;
  canvas.height = img.width;
} else {
  // Keep original dimensions for 0 and 180 degree rotations
  canvas.width = img.width;
  canvas.height = img.height;
}
```

## Browser API Reference

### FileReader API
```javascript
const reader = new FileReader();
reader.onload = function(e) {
  const dataUrl = e.target.result;  // "data:image/png;base64,..."
};
reader.readAsDataURL(file);        // Trigger read
```

### Canvas API
```javascript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.translate(x, y);               // Move origin
ctx.rotate(radians);               // Rotate origin
ctx.drawImage(img, x, y, w, h);    // Draw image
canvas.toBlob(callback, type);     // Convert to blob
```

### Fetch API
```javascript
const formData = new FormData();
formData.append('signatureImage', file);

fetch('/profile/upload-signature', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => { /* handle response */ });
```

## Summary

The image rotation feature adds 150+ lines of JavaScript to handle:
- ✅ Real-time preview rotation (CSS transforms)
- ✅ Persistent state management (currentImageRotation)
- ✅ Canvas-based image transformation (for upload)
- ✅ File validation and error handling
- ✅ Server integration with FormData
- ✅ User feedback and progress indication

All code is modular, efficient, and production-ready.
