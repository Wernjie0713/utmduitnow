import { Dialog, DialogContent } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { AlertCircle, Calendar, CheckCircle2, Info } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export default function CompetitionAnnouncementModal({ show }) {
    const [isAcknowledging, setIsAcknowledging] = useState(false);

    const handleAcknowledge = () => {
        setIsAcknowledging(true);
        
        // Send acknowledgment to backend
        // Backend will redirect back, refreshing the page
        // Modal will automatically close because showCompetitionAnnouncement will be false
        router.post(route('competition.acknowledge-announcement'), {}, {
            preserveScroll: false, // Allow page to refresh naturally
            onFinish: () => {
                // Reset loading state if something goes wrong
                setIsAcknowledging(false);
            },
        });
    };

    return (
        <Dialog open={show} onOpenChange={() => {}}>
            <DialogContent 
                className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                hideCloseButton={true}
            >
                <div className="space-y-6 py-4">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Calendar className="h-6 w-6" />
                                Important Competition Update
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Please read this carefully
                            </p>
                        </div>
                    </div>

                    {/* Apology Message */}
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                            We Apologize for the Confusion
                        </h3>
                        <p className="text-sm text-red-800 dark:text-red-200">
                            Due to a programming error in our system, we have removed all transaction records 
                            that were dated <strong>before November 1, 2025</strong>. We understand this may have 
                            caused inconvenience, and we sincerely apologize for this mistake.
                        </p>
                    </div>

                    {/* Corrected Competition Period */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Official Competition Period
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                                        Week 1 (Special - 9 Days)
                                    </p>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        November 1 - November 9, 2025
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                        Saturday to Sunday (includes today and tomorrow + next Monday-Sunday)
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                                        Week 2 Onwards (Standard - 7 Days Each)
                                    </p>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        Monday 00:00 - Sunday 23:59
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                                        Competition Ends
                                    </p>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        December 28, 2025 at 11:59 PM
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Important Note */}
                    <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <h3 className="text-base font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                            📌 Important Reminders
                        </h3>
                        <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                                <span>Only receipts from the <strong>current competition week</strong> are accepted</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                                <span>If you had previous transactions, please <strong>resubmit them</strong> if they fall within Week 1 (Nov 1-9)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                                <span>Your competition progress starts fresh from <strong>today</strong></span>
                            </li>
                        </ul>
                    </div>

                    {/* Acknowledgment Button */}
                    <div className="flex flex-col items-center gap-3 pt-2">
                        <Button
                            onClick={handleAcknowledge}
                            disabled={isAcknowledging}
                            className="w-full sm:w-auto px-8 py-6 text-base font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            {isAcknowledging ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    I Understand - Continue to Competition
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            By clicking above, you acknowledge that you have read and understood this announcement
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

