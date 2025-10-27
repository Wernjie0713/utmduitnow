# File Storage Path Resolution Fix

## Issue
Receipt images were being stored in `storage/app/private/receipts/` but the application was trying to access them from `storage/app/receipts/`, causing "File not found" errors during OCR processing and image tampering detection.

## Root Cause
Laravel's `'local'` filesystem disk is configured with:
```php
'local' => [
    'driver' => 'local',
    'root' => storage_path('app/private'),
    // ...
],
```

This means when using `$file->storeAs('receipts', $filename)`, the file is stored at:
- **Actual location**: `storage/app/private/receipts/receipt_xxx.jpg`

But the code was trying to access it using:
```php
$ocrText = $this->ocrService->extractText(storage_path('app/' . $imagePath));
```

Which constructed the path as:
- **Attempted access**: `storage/app/receipts/receipt_xxx.jpg` ❌

## Solution
Updated `TransactionVerificationService.php` to use Laravel's `Storage::path()` method, which automatically resolves the correct full path based on the disk configuration:

```php
// Before (incorrect):
$ocrText = $this->ocrService->extractText(storage_path('app/' . $imagePath));
$tamperingCheck = $this->tamperingService->validate(storage_path('app/' . $imagePath));

// After (correct):
$fullPath = Storage::path($imagePath);
$ocrText = $this->ocrService->extractText($fullPath);
$tamperingCheck = $this->tamperingService->validate($fullPath);
```

## Benefits
1. ✅ **Works with any disk configuration** - The `Storage::path()` method respects the disk's root setting
2. ✅ **No hardcoded paths** - More maintainable and flexible
3. ✅ **Future-proof** - If you change storage location or use cloud storage, the code still works
4. ✅ **Laravel best practices** - Using the Storage facade is the recommended approach

## Files Modified
- `app/Services/TransactionVerificationService.php`
  - Line ~53: Added `Storage::path()` for OCR processing
  - Line ~66: Updated tampering detection to use resolved path

## Testing
After this fix:
1. Upload a receipt image through the submission page
2. Check `storage/logs/laravel.log` - should see no path-related errors
3. Transaction should be processed successfully (approved or rejected based on validation)
4. Image should be stored in `storage/app/private/receipts/`
5. OCR and tampering detection should access the file correctly

## Note on Storage Disks
For future reference:
- **`'local'` disk**: Stores files in `storage/app/private/` - not web-accessible
- **`'public'` disk**: Stores files in `storage/app/public/` - web-accessible via `/storage/` URL after running `php artisan storage:link`
- **Receipt images** are correctly stored in the `'local'` (private) disk since they contain sensitive transaction data
- **Avatar images** use the `'public'` disk since they need to be web-accessible

