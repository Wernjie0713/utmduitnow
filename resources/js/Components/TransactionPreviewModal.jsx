import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Calendar, Clock, DollarSign, Hash } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/animate-ui/components/buttons/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';

// Helper function to format date from YYYY-MM-DD to DD/MM/YYYY
const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return 'N/A';
    
    // Handle both Date objects and strings
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return dateString;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
};

function TransactionPreviewModal({ 
    open, 
    onClose, 
    previewData, 
    onConfirm, 
    isSubmitting,
    receiptPreview 
}) {
    if (!previewData) return null;

    const { valid, data, validations, rejection_reason } = previewData;

    const validationItems = [
        { key: 'daily_limit', label: 'Daily Limit Check', icon: CheckCircle2 },
        { key: 'ocr_extracted', label: 'Text Extraction', icon: CheckCircle2 },
        { key: 'data_parsed', label: 'Data Parsing', icon: CheckCircle2 },
        { key: 'integrity_check', label: 'Image Integrity', icon: CheckCircle2 },
        { key: 'duplicate_check', label: 'Duplicate Check', icon: CheckCircle2 },
        { key: 'date_valid', label: 'Date Validation', icon: CheckCircle2 },
    ];

    return (
        <Dialog open={open}>
            <DialogContent 
                className="max-w-3xl max-h-[90vh] overflow-y-auto [&>button]:hidden"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {valid ? 'Transaction Preview' : 'Validation Failed'}
                    </DialogTitle>
                    <DialogDescription>
                        {valid 
                            ? 'Please review the extracted transaction data before submitting.' 
                            : 'Your transaction failed validation. Please review the details below.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Validation Status */}
                    {!valid && rejection_reason && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{rejection_reason}</AlertDescription>
                        </Alert>
                    )}

                    {valid && (
                        <Alert>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertTitle>All Validations Passed</AlertTitle>
                            <AlertDescription>
                                Your transaction has passed all validation checks and is ready to be submitted.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Receipt Image Preview */}
                    {receiptPreview && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Receipt Image</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <img
                                    src={receiptPreview}
                                    alt="Receipt preview"
                                    className="w-full max-h-64 object-contain rounded border"
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Extracted Transaction Data */}
                    {data && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Extracted Transaction Data</CardTitle>
                                <CardDescription>
                                    Automatically extracted from your receipt
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Reference ID - Full Width */}
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                                        <Hash className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-500">Reference ID</p>
                                            <p className="text-base font-semibold text-gray-900 break-all">
                                                {data.reference_id || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Amount</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                RM {data.amount || '0.00'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Transaction Type */}
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <CheckCircle2 className="h-5 w-5 text-teal-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Transaction Type</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {data.transaction_type || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Transaction Date */}
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Transaction Date</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {formatDateToDDMMYYYY(data.date)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Transaction Time */}
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Transaction Time</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {data.time || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Validation Results */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Validation Checks</CardTitle>
                            <CardDescription>
                                Status of all verification checks performed
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {validationItems.map((item) => {
                                    const passed = validations && validations[item.key] === true;
                                    const failed = validations && validations[item.key] === false;
                                    const Icon = failed ? XCircle : item.icon;
                                    const colorClass = failed 
                                        ? 'text-red-600' 
                                        : passed 
                                        ? 'text-green-600' 
                                        : 'text-gray-400';

                                    return (
                                        <div
                                            key={item.key}
                                            className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Icon className={`h-4 w-4 ${colorClass}`} />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {item.label}
                                                </span>
                                            </div>
                                            {passed && (
                                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                                                    Passed
                                                </span>
                                            )}
                                            {failed && (
                                                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                                                    Failed
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    {valid && (
                        <Button
                            onClick={() => {
                                onConfirm();
                                toast.success("Transaction submitted successfully!", {
                                    description: (
                                        <span>
                                            Navigate to{' '}
                                            <a 
                                                href="/transactions/my" 
                                                className="underline font-semibold hover:text-green-700 cursor-pointer"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    window.location.href = '/transactions/my';
                                                }}
                                            >
                                                My Transactions
                                            </a>
                                            {' '}to see the record
                                        </span>
                                    ),
                                    duration: 5000,
                                });
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Confirm & Submit Transaction'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default TransactionPreviewModal;
