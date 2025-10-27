<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ImageTamperingDetectionService
{
    /**
     * Validate image for tampering
     * 
     * @param string $imagePath Path to the image file
     * @return array ['passed' => bool, 'reason' => string|null]
     */
    public function validate($imagePath)
    {
        try {
            // 1. EXIF Metadata Analysis
            $exifCheck = $this->checkExifData($imagePath);
            if (!$exifCheck['passed']) {
                return $exifCheck;
            }

            // 2. Generate and check perceptual hash
            $hashCheck = $this->checkImageHash($imagePath);
            if (!$hashCheck['passed']) {
                return $hashCheck;
            }

            // 3. Basic file integrity check
            $integrityCheck = $this->checkFileIntegrity($imagePath);
            if (!$integrityCheck['passed']) {
                return $integrityCheck;
            }

            return ['passed' => true, 'reason' => null];
            
        } catch (Exception $e) {
            Log::error('Image tampering detection failed: ' . $e->getMessage());
            
            // On error, allow the image (fail open, not fail closed)
            // The duplicate reference_id check is more important
            return ['passed' => true, 'reason' => null];
        }
    }

    /**
     * Check EXIF metadata for signs of editing
     * 
     * @param string $imagePath
     * @return array
     */
    protected function checkExifData($imagePath)
    {
        if (!function_exists('exif_read_data')) {
            // EXIF extension not available, skip check
            return ['passed' => true, 'reason' => null];
        }

        try {
            $exif = @exif_read_data($imagePath);
            
            if ($exif === false) {
                // Could not read EXIF data (might be stripped or invalid)
                // This is suspicious but not definitive
                Log::warning('Could not read EXIF data from image: ' . $imagePath);
            }

            // Check for common photo editing software signatures
            $suspiciousSoftware = ['photoshop', 'gimp', 'paint.net', 'pixlr', 'canva'];
            
            if (isset($exif['Software'])) {
                $software = strtolower($exif['Software']);
                foreach ($suspiciousSoftware as $editorName) {
                    if (strpos($software, $editorName) !== false) {
                        return [
                            'passed' => false,
                            'reason' => 'Image appears to have been edited with photo editing software'
                        ];
                    }
                }
            }

            return ['passed' => true, 'reason' => null];
            
        } catch (Exception $e) {
            // Error reading EXIF, allow the image
            return ['passed' => true, 'reason' => null];
        }
    }

    /**
     * Generate and check perceptual hash for duplicate detection
     * 
     * @param string $imagePath
     * @return array
     */
    protected function checkImageHash($imagePath)
    {
        try {
            // Generate a simple perceptual hash
            $hash = $this->generateImageHash($imagePath);
            
            // Check if this exact image hash has been submitted before
            $existingHash = DB::table('transactions')
                ->where('parsed_data->image_hash', $hash)
                ->exists();
            
            if ($existingHash) {
                return [
                    'passed' => false,
                    'reason' => 'This exact image has already been submitted'
                ];
            }

            // Store the hash for future checks (will be added to parsed_data)
            return [
                'passed' => true,
                'reason' => null,
                'hash' => $hash
            ];
            
        } catch (Exception $e) {
            Log::error('Image hash generation failed: ' . $e->getMessage());
            return ['passed' => true, 'reason' => null];
        }
    }

    /**
     * Generate a perceptual hash for an image
     * 
     * @param string $imagePath
     * @return string
     */
    protected function generateImageHash($imagePath)
    {
        // Use MD5 hash of file content as a simple approach
        // For production, consider using perceptual hashing libraries
        return md5_file($imagePath);
    }

    /**
     * Check basic file integrity
     * 
     * @param string $imagePath
     * @return array
     */
    protected function checkFileIntegrity($imagePath)
    {
        // Check if file is a valid image
        $imageInfo = @getimagesize($imagePath);
        
        if ($imageInfo === false) {
            return [
                'passed' => false,
                'reason' => 'Uploaded file is not a valid image'
            ];
        }

        // Check file size (max 5MB as per validation)
        $fileSize = filesize($imagePath);
        if ($fileSize > 5 * 1024 * 1024) {
            return [
                'passed' => false,
                'reason' => 'Image file size exceeds maximum allowed (5MB)'
            ];
        }

        // Check for minimum dimensions (too small might indicate tampering or low quality)
        if ($imageInfo[0] < 200 || $imageInfo[1] < 200) {
            return [
                'passed' => false,
                'reason' => 'Image dimensions too small. Please upload a clear screenshot'
            ];
        }

        return ['passed' => true, 'reason' => null];
    }

    /**
     * Perform Error Level Analysis (ELA) - Advanced tampering detection
     * Note: This is a more complex implementation that can be added later
     * 
     * @param string $imagePath
     * @return array
     */
    protected function performELA($imagePath)
    {
        // TODO: Implement Error Level Analysis if needed
        // This requires ImageMagick and more complex processing
        // For MVP, the basic checks above are sufficient
        
        return ['passed' => true, 'reason' => null];
    }
}

