# Image Preview Fix - localhost_5173_.png Issue

## Problem Description

When uploading images (especially tenant ID photos), the preview would show filenames like `localhost_5173_.png` or broken image icons instead of the actual image content. This was happening because the code wasn't properly differentiating between:

1. **New File objects** (just selected, not yet uploaded)
2. **Already uploaded photos** (fetched from database with URL)

## Root Cause

The issue occurred in two components:
- `AddTenantModal.jsx` (line 367)
- `TenantEdit.jsx` (line 379)

### The Bug

```javascript
// WRONG - This causes the localhost_5173_.png issue
<img src={URL.createObjectURL(photo)} />
```

When `photo` is an **already-uploaded object** like `{url: '/uploads/abc.jpg', name: 'photo.jpg'}`, calling `URL.createObjectURL(photo)` fails because:
- `URL.createObjectURL()` only works with **File** or **Blob** objects
- Passing a plain object causes it to fail silently or create invalid URLs
- The browser then tries to load the filename as a URL relative to `localhost:5173`
- Result: `localhost_5173_photo.png` or broken image

## The Fix

### 1. Import getImageUrl Helper

```javascript
// Before
import api from '../../utils/api';

// After
import api, { getImageUrl } from '../../utils/api';
```

### 2. Check Photo Type Before Creating Preview URL

```javascript
// CORRECT - Handles both new files and existing photos
{formData.idPhotos.map((photo, index) => {
  // Check if photo is a File object (new upload) or an already-uploaded photo object
  const isFileObject = photo instanceof File;
  const imageUrl = isFileObject 
    ? URL.createObjectURL(photo)      // New file: create blob URL
    : getImageUrl(photo.url);          // Existing: use server URL
  
  return (
    <div key={index}>
      <img src={imageUrl} alt={`ID Photo ${index + 1}`} />
    </div>
  );
})}
```

### 3. Fix Upload Logic to Skip Already-Uploaded Photos

```javascript
// Upload ID photos if present
if (formData.idPhotos.length > 0) {
  for (const photo of formData.idPhotos) {
    // Check if photo is already uploaded (has url property) or is a new File
    if (photo.url) {
      // Already uploaded, just keep the existing data
      idPhotoUrls.push({
        url: photo.url,
        name: photo.name
      });
    } else {
      // New file, upload it
      const formDataUpload = new FormData();
      formDataUpload.append('file', photo);
      
      const uploadResponse = await api.post('uploads/image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      idPhotoUrls.push({
        url: uploadResponse.url,
        name: photo.name
      });
    }
  }
}
```

## Files Modified

### 1. `src/components/ui/AddTenantModal.jsx`
- ✅ Added `getImageUrl` import
- ✅ Fixed image preview to check `photo instanceof File`
- ✅ Fixed upload logic to skip already-uploaded photos

### 2. `src/pages/Tenants/TenantEdit.jsx`
- ✅ Added `getImageUrl` import
- ✅ Fixed image preview to check `photo instanceof File`
- ✅ Upload logic was already correct

## How It Works Now

### Scenario 1: Creating New Tenant
1. User selects image files → `photo instanceof File` = `true`
2. Preview uses `URL.createObjectURL(photo)` → Shows real image immediately
3. On submit, uploads file → Gets back `{url: '/uploads/...', name: '...'}`
4. Saves to database

### Scenario 2: Editing Existing Tenant
1. Loads tenant data → `idPhotos: [{url: '/uploads/...', name: '...'}]`
2. `photo instanceof File` = `false` (it's a plain object)
3. Preview uses `getImageUrl(photo.url)` → Shows image from server
4. User can add more photos (new Files) or keep existing ones
5. On submit, only uploads new Files, keeps existing URLs

### Scenario 3: Mixed (Editing + Adding New)
1. Existing photos: Use `getImageUrl(photo.url)`
2. New photos: Use `URL.createObjectURL(photo)`
3. On submit, uploads only new files, preserves existing URLs

## Technical Details

### Why `instanceof File` Works

```javascript
const newFile = new File(['content'], 'photo.jpg');
newFile instanceof File;  // true

const existingPhoto = { url: '/uploads/photo.jpg', name: 'photo.jpg' };
existingPhoto instanceof File;  // false
```

### The getImageUrl Helper

```javascript
// From src/utils/api.js
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) 
    return path;
  const serverUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${serverUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
```

This converts relative paths like `/uploads/photo.jpg` to full URLs like `http://localhost:5000/uploads/photo.jpg`.

## Testing

### Test 1: Create New Tenant with Photos
1. Go to Tenants page
2. Click "Add Tenant"
3. Upload ID photos
4. **Expected**: Photos preview correctly in modal
5. Submit form
6. **Expected**: Photos saved and display in tenant details

### Test 2: Edit Existing Tenant
1. Open tenant with existing photos
2. Click "Edit"
3. **Expected**: Existing photos display correctly in edit form
4. Add more photos
5. **Expected**: Both existing and new photos preview correctly
6. Submit
7. **Expected**: All photos saved and display in details

### Test 3: Remove and Re-add Photos
1. Edit tenant
2. Remove an existing photo
3. Add a new photo
4. **Expected**: Preview shows only remaining photos correctly
5. Submit
6. **Expected**: Changes saved correctly

## Result

✅ **No more `localhost_5173_.png` errors**  
✅ **Proper image previews for both new and existing photos**  
✅ **Efficient uploads (doesn't re-upload existing photos)**  
✅ **Works in both AddTenantModal and TenantEdit**  

## Prevention

To prevent this issue in future components:

1. **Always check photo type** before creating preview URL
2. **Use `instanceof File`** to differentiate new vs existing
3. **Use `getImageUrl()`** for server-stored images
4. **Use `URL.createObjectURL()`** only for File/Blob objects
5. **Never** use filename or relative path directly in `<img src="">`
