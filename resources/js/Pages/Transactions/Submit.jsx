import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import { Badge } from '@/Components/ui/badge';
import { AlertCircle, Upload, CheckCircle2, Info, Sparkles, Zap, Brain, Scan, Shield, ShieldCheck } from 'lucide-react';
import TransactionPreviewModal from '@/Components/TransactionPreviewModal';
import { MultiStepLoader } from '@/Components/ui/multi-step-loader';
import axios from 'axios';

// AI Processing Steps for Receipt Verification (Optimized)
const loadingStates = [
    { text: "Analyzing receipt image quality..." },
    { text: "Extracting text using Azure OCR..." },
    { text: "AI parsing transaction data..." },
    { text: "Validating date, time & amount..." },
    { text: "Checking integrity & duplicates..." },
    { text: "Finalizing verification results..." },
];

// Minimum loader display time (6 steps × 0.5s = 3s)
const MIN_LOADER_TIME = 3000;

export default function Submit({ todaySubmissions, maxSubmissions, canSubmit }) {
    const [preview, setPreview] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { data, setData, post, processing, errors, reset, setError } = useForm({
        receipt_image: null,
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('receipt_image', file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProcess = async (e) => {
        e.preventDefault();
        
        if (!data.receipt_image) {
            setError('receipt_image', 'Please select a receipt image to upload.');
            return;
        }

        setIsProcessing(true);
        const startTime = Date.now();
        
        try {
            // Create FormData to send file
            const formData = new FormData();
            formData.append('receipt_image', data.receipt_image);

            // Call preview endpoint
            const response = await axios.post(route('transactions.preview'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Calculate elapsed time
            const elapsed = Date.now() - startTime;
            const remainingTime = Math.max(0, MIN_LOADER_TIME - elapsed);

            // Wait for loader to finish (if API was faster than minimum time)
            setTimeout(() => {
                setPreviewData(response.data);
                setIsProcessing(false);
                setShowModal(true);
            }, remainingTime);
            
        } catch (error) {
            // Calculate elapsed time for error case
            const elapsed = Date.now() - startTime;
            const remainingTime = Math.max(0, MIN_LOADER_TIME - elapsed);

            // Wait for loader to finish before showing error
            setTimeout(() => {
                setIsProcessing(false);
                if (error.response?.data?.errors) {
                    setError('receipt_image', error.response.data.errors.receipt_image?.[0] || 'Failed to process receipt.');
                } else {
                    setError('receipt_image', 'Failed to process receipt. Please try again.');
                }
            }, remainingTime);
        }
    };

    const handleConfirmSubmit = () => {
        setIsSubmitting(true);
        
        // Submit with preview data
        router.post(route('transactions.store'), {
            preview_data: previewData,
        }, {
            onSuccess: () => {
                reset();
                setPreview(null);
                setPreviewData(null);
                setShowModal(false);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleCancel = () => {
        setShowModal(false);
        setPreviewData(null);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Submit Transaction
                </h2>
            }
        >
            <Head title="Submit Transaction" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl px-6 sm:px-6 md:px-2 lg:px-0">
                    {/* AI-Powered Header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-700">
                                <Sparkles className="h-3 w-3" />
                                AI-Powered
                            </Badge>
                            <Badge variant="outline" className="gap-1 border-green-200 bg-green-50 text-green-700">
                                <Zap className="h-3 w-3" />
                                Instant Processing
                            </Badge>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Smart Receipt Scanner</h1>
                        <p className="text-muted-foreground">
                            Upload your DuitNow receipt and let our AI extract transaction details automatically
                        </p>
                    </div>

                    {/* AI Capabilities Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                        <Card className="border-muted">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="shrink-0">
                                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <Scan className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-sm">Azure OCR</h3>
                                        <p className="text-xs text-muted-foreground">
                                            99.9% accuracy text extraction
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="border-muted">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="shrink-0">
                                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                            <ShieldCheck className="h-5 w-5 text-green-600" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-sm">Fraud Detection</h3>
                                        <p className="text-xs text-muted-foreground">
                                            Automatic duplicate checking
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="border-muted">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="shrink-0">
                                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                            <Brain className="h-5 w-5 text-purple-600" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-sm">Smart Validation</h3>
                                        <p className="text-xs text-muted-foreground">
                                            Auto-validates all fields
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Submission Counter */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Daily Submission Limit</CardTitle>
                            <CardDescription>
                                You have submitted {todaySubmissions} out of {maxSubmissions} transactions today.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                    className={`h-2.5 rounded-full ${todaySubmissions >= maxSubmissions ? 'bg-red-600' : 'bg-blue-600'}`}
                                    style={{ width: `${(todaySubmissions / maxSubmissions) * 100}%` }}
                                ></div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upload Form */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CardTitle>Upload Receipt</CardTitle>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button type="button" className="text-gray-400 hover:text-gray-600 focus:outline-none">
                                                <Info className="h-5 w-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs p-4" side="right">
                                            <div className="space-y-2 text-sm">
                                                <p className="font-semibold">Requirements:</p>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    <li>Current week only (Mon-Sun)</li>
                                                    <li>Clear photo (not edited)</li>
                                                    <li>Must have enough data (Date, Time, Amount, Reference ID)</li>
                                                    <li>Max 100 receipts/day</li>
                                                </ul>
                                                <p className="text-xs text-muted-foreground pt-2 border-t">
                                                    Verified against your DuitNow ID. Fraud = disqualification.
                                                </p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <CardDescription>
                                Upload a clear screenshot of your DuitNow transaction receipt
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProcess}>
                                <div>
                                    <InputLabel htmlFor="receipt_image" value="Receipt Screenshot" />

                                    <div className="mt-2 flex justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors px-6 py-10 bg-muted/5">
                                        <div className="text-center">
                                            {preview ? (
                                                <div className="mb-4 relative group">
                                                    <img 
                                                        src={preview} 
                                                        alt="Receipt preview" 
                                                        className="mx-auto max-h-64 rounded-lg shadow-sm"
                                                    />
                                                    <div className="absolute top-2 right-2">
                                                        <Badge variant="default" className="gap-1 bg-green-600">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Ready
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                                <label
                                                    htmlFor="receipt_image"
                                                    className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                                                >
                                                    <span>{preview ? 'Change file' : 'Upload a file'}</span>
                                                    <input
                                                        id="receipt_image"
                                                        name="receipt_image"
                                                        type="file"
                                                        className="sr-only"
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                        required
                                                    />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs leading-5 text-gray-600">
                                                PNG, JPG, JPEG up to 5MB
                                            </p>
                                        </div>
                                    </div>

                                    <InputError message={errors.receipt_image} className="mt-2" />
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-4">
                                    <PrimaryButton disabled={isProcessing || !canSubmit} className="gap-2">
                                        {isProcessing ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                AI Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4" />
                                                Analyze with AI
                                            </>
                                        )}
                                    </PrimaryButton>
                                </div>

                                {!canSubmit && (
                                    <p className="mt-2 text-sm text-red-600">
                                        You have reached the daily submission limit. Please try again tomorrow.
                                    </p>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    {/* How It Works Section */}
                    <Card className="mt-6 border-muted bg-muted/20">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Brain className="h-4 w-4" />
                                How AI Processing Works
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="flex flex-col items-center text-center space-y-2">
                                    <div className="h-10 w-10 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                                        <Upload className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">Upload</h4>
                                        <p className="text-xs text-muted-foreground">Submit receipt image</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-center text-center space-y-2">
                                    <div className="h-10 w-10 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                                        <Scan className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">Extract</h4>
                                        <p className="text-xs text-muted-foreground">AI reads all text</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-center text-center space-y-2">
                                    <div className="h-10 w-10 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">Validate</h4>
                                        <p className="text-xs text-muted-foreground">Smart verification</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-center text-center space-y-2">
                                    <div className="h-10 w-10 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">Complete</h4>
                                        <p className="text-xs text-muted-foreground">Review & submit</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trust Indicators */}
                    <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            <span>Azure AI Powered</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-blue-600" />
                            <span>Secure Processing</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-purple-600" />
                            <span>99.9% Accuracy</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Processing Loader */}
            <MultiStepLoader
                loadingStates={loadingStates}
                loading={isProcessing}
                duration={500}
                loop={false}
            />

            {/* Transaction Preview Modal */}
            <TransactionPreviewModal
                open={showModal}
                onClose={handleCancel}
                previewData={previewData}
                onConfirm={handleConfirmSubmit}
                isSubmitting={isSubmitting}
                receiptPreview={preview}
            />
        </AuthenticatedLayout>
    );
}

