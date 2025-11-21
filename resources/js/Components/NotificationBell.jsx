import { useState, useEffect } from 'react';
import { Bell, X, Trophy, Gift, Target } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/Components/ui/popover';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'utmduitnow_encouragement_dismissed';

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        // Check if user has dismissed the notification
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (!dismissed) {
            setHasUnread(true);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setHasUnread(false);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="View encouragement message"
                >
                    <Bell className="h-5 w-5 text-gray-700" />
                    {hasUnread && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent 
                align="end" 
                side="bottom"
                className="w-96 max-w-[calc(100vw-2rem)] p-0"
            >
                <div className="bg-white">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm">
                                Keep Going
                            </h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-muted"
                            onClick={handleDismiss}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Even if you're not in the Top 3 right now, <strong className="text-foreground">every transaction counts</strong> and gives you more chances to win amazing prizes.
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                                <div className="mt-0.5">
                                    <Gift className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h4 className="font-medium text-sm text-foreground">
                                        Grand Prize Lucky Draw
                                    </h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Every <strong className="text-foreground">50 eligible transactions</strong> = <strong className="text-foreground">1 entry</strong> to win an <strong className="text-foreground">iPad</strong>. Your transactions keep accumulating, so keep uploading receipts.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                                <div className="mt-0.5">
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h4 className="font-medium text-sm text-foreground">
                                        Weekly & Monthly Prizes
                                    </h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Need <strong className="text-foreground">30 transactions/week</strong> for weekly prizes and <strong className="text-foreground">120 transactions/month</strong> for monthly prizes. <strong className="text-foreground">Top winners can only win once</strong>, so next week could be your week.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border bg-muted/30">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                <strong className="text-foreground">Remember:</strong> The current Top 3 have already won their prizes. Once they've claimed their reward, they won't be eligible for the next week's prizes. This means you have a real chance to become next week's winner.
                            </p>
                        </div>

                        <Button
                            onClick={handleDismiss}
                            className="w-full"
                            variant="default"
                        >
                            Got it! Let's keep uploading
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

