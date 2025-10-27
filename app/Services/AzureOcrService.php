<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;

class AzureOcrService
{
    protected $endpoint;
    protected $key;

    public function __construct()
    {
        $this->endpoint = config('services.azure.vision_endpoint');
        $this->key = config('services.azure.vision_key');
    }

    /**
     * Extract text from an image using Azure Computer Vision API
     * 
     * @param string $imagePath Path to the image file
     * @return string|null Extracted OCR text
     */
    public function extractText($imagePath)
    {
        try {
            // Check if Azure credentials are configured
            if (empty($this->endpoint) || empty($this->key) || $this->endpoint === 'your_azure_endpoint_here') {
                throw new Exception('Azure Vision API credentials are not configured. Please set AZURE_VISION_ENDPOINT and AZURE_VISION_KEY in your .env file.');
            }

            // Read the image file
            $imageData = file_get_contents($imagePath);
            
            // Prepare the API endpoint
            $url = rtrim($this->endpoint, '/') . '/vision/v3.2/read/analyze';
            
            Log::info('Azure OCR Request', [
                'url' => $url,
                'endpoint' => $this->endpoint,
                'has_key' => !empty($this->key),
            ]);
            
            // Initialize cURL session
            $ch = curl_init();
            
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $imageData,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/octet-stream',
                    'Ocp-Apim-Subscription-Key: ' . $this->key,
                ],
                CURLOPT_HEADER => true,
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
            $header = substr($response, 0, $headerSize);
            $body = substr($response, $headerSize);
            
            curl_close($ch);
            
            // Log response details
            Log::info('Azure OCR Response', [
                'http_code' => $httpCode,
                'header_size' => $headerSize,
                'body_preview' => substr($body, 0, 500),
            ]);
            
            // Check for errors
            if ($httpCode !== 202) {
                Log::error('Azure OCR API Error', [
                    'http_code' => $httpCode,
                    'response_body' => $body,
                    'request_url' => $url,
                ]);
                throw new Exception("Azure OCR API returned error code: {$httpCode}. Response: {$body}");
            }
            
            // Extract the operation location from headers (case-insensitive, handle different line endings)
            preg_match('/operation-location:\s*(.+)/i', $header, $matches);
            if (empty($matches[1])) {
                // Log the full header for debugging
                Log::error('Operation-Location header not found', [
                    'header' => $header,
                    'header_length' => strlen($header),
                ]);
                throw new Exception("Could not find Operation-Location in response headers");
            }
            
            // Trim whitespace and any carriage returns/newlines
            $operationUrl = trim(str_replace(["\r", "\n"], '', $matches[1]));
            
            Log::info('Operation-Location found', ['url' => $operationUrl]);
            
            // Poll the operation URL until the result is ready
            $maxAttempts = 10;
            $attempt = 0;
            $result = null;
            
            while ($attempt < $maxAttempts) {
                sleep(1); // Wait 1 second between attempts
                
                $ch = curl_init();
                curl_setopt_array($ch, [
                    CURLOPT_URL => $operationUrl,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_HTTPHEADER => [
                        'Ocp-Apim-Subscription-Key: ' . $this->key,
                    ],
                ]);
                
                $resultJson = curl_exec($ch);
                curl_close($ch);
                
                $result = json_decode($resultJson, true);
                
                if (isset($result['status']) && $result['status'] === 'succeeded') {
                    break;
                }
                
                $attempt++;
            }
            
            if (!isset($result['analyzeResult']['readResults'])) {
                throw new Exception("OCR analysis did not complete successfully");
            }
            
            // Extract all text lines
            $text = '';
            foreach ($result['analyzeResult']['readResults'] as $page) {
                foreach ($page['lines'] as $line) {
                    $text .= $line['text'] . "\n";
                }
            }
            
            return trim($text);
            
        } catch (Exception $e) {
            Log::error('Azure OCR extraction failed: ' . $e->getMessage());
            throw $e;
        }
    }
}

