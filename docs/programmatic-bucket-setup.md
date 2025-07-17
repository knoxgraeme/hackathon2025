# Programmatic Bucket Creation for Storyboard Images

This document explains how the edge function automatically creates and manages the Supabase storage bucket for storyboard images.

## Overview

Instead of manually creating a bucket or using migrations, the edge function automatically:
1. **Checks if the bucket exists** on every image generation
2. **Creates the bucket** if it doesn't exist
3. **Saves images** to the bucket
4. **Returns public URLs** instead of base64 data

## How It Works

### Automatic Bucket Creation

```typescript
const ensureBucketExists = async (): Promise<boolean> => {
  // 1. Check if 'storyboard-images' bucket exists
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(bucket => bucket.name === 'storyboard-images')
  
  // 2. Create bucket if it doesn't exist
  if (!bucketExists) {
    await supabase.storage.createBucket('storyboard-images', {
      public: true,                    // Public read access
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10 * 1024 * 1024  // 10MB limit
    })
  }
  
  return true
}
```

### Image Storage Flow

```typescript
const saveImageToStorage = async (imageBase64: string, fileName: string) => {
  // 1. Ensure bucket exists (creates if needed)
  await ensureBucketExists()
  
  // 2. Convert base64 to bytes
  const imageData = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))
  
  // 3. Upload to Supabase Storage
  await supabase.storage
    .from('storyboard-images')
    .upload(fileName, imageData, {
      contentType: 'image/jpeg',
      upsert: true
    })
  
  // 4. Get public URL
  const { data: publicURL } = supabase.storage
    .from('storyboard-images')
    .getPublicUrl(fileName)
  
  return publicURL.publicUrl
}
```

## Benefits

✅ **Zero Setup Required**: No manual bucket creation needed
✅ **Self-Healing**: Recreates bucket if accidentally deleted
✅ **Consistent**: Same bucket configuration every time
✅ **Secure**: Proper public read access with size limits
✅ **Efficient**: Only creates bucket once, then reuses it

## Environment Variables Required

Make sure these are set in your Supabase project:

```bash
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

## File Naming Convention

Images are stored with unique filenames:
```
storyboard-{conversationId}-shot-{shotNumber}-{timestamp}.jpg
```

Example:
```
storyboard-conv-abc123-shot-1-2024-01-15T10-30-00-000Z.jpg
storyboard-conv-abc123-shot-2-2024-01-15T10-30-15-000Z.jpg
```

## What Happens

1. **User completes conversation** in the app
2. **Edge function processes** the conversation
3. **AI generates images** as base64 data
4. **Function checks** if bucket exists (creates if needed)
5. **Images are uploaded** to `storyboard-images` bucket
6. **Public URLs are returned** to the frontend
7. **Frontend displays images** using the URLs
8. **localStorage stores URLs** (not base64 data)

## Troubleshooting

### Bucket Creation Fails
- Check that `SUPABASE_SERVICE_ROLE_KEY` has admin permissions
- Verify the service role key is correct
- Check Supabase project quotas

### Images Don't Load
- Verify the bucket is public (should be automatic)
- Check browser console for CORS errors
- Ensure the URLs are accessible

### Storage Quota Issues
- Monitor storage usage in Supabase dashboard
- Consider implementing cleanup for old images
- Adjust file size limits if needed

## Testing

1. **Create a new session** in the app
2. **Complete the conversation** flow
3. **Check the response** - images should be URLs like:
   ```
   https://your-project.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv-123-shot-1-2024-01-15T10-30-00-000Z.jpg
   ```
4. **Verify in Supabase dashboard** that the bucket was created
5. **Check that images display** correctly in the app

This approach ensures your image storage works seamlessly without any manual setup! 