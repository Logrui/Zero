import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConnectionNotificationProps {
    isVisible: boolean;
    onRetry?: () => void;
    onDismiss?: () => void;
    showRetry?: boolean;
}

export function ConnectionNotification({
    isVisible,
    onRetry,
    onDismiss,
    showRetry = true
}: ConnectionNotificationProps) {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        console.log('ConnectionNotification isVisible:', isVisible);
        if (isVisible) {
            // Start animation when becoming visible
            setIsAnimating(true);
        } else {
            // Reset animation when becoming invisible
            setIsAnimating(false);
        }
    }, [isVisible]);

    console.log('ConnectionNotification rendering, isVisible:', isVisible);
    if (!isVisible) return null;

    return (
        <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}>
            <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-4 shadow-lg max-w-sm">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <WifiOff className="h-5 w-5 text-yellow-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white mb-1">
                            Connection Issue
                        </h4>
                        <p className="text-xs text-[#B7B7B7] mb-3">
                            We're experiencing connection issues. You can still browse our site and learn about Zero OS.
                        </p>

                        <div className="flex gap-2">
                            {showRetry && onRetry && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={onRetry}
                                    className="text-xs h-7 px-2"
                                >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Retry
                                </Button>
                            )}

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.location.reload()}
                                className="text-xs h-7 px-2"
                            >
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="flex-shrink-0 text-[#B7B7B7] hover:text-white transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Auto-dismissing version for repeated notifications
export function ConnectionToast({
    isVisible,
    onRetry,
    onDismiss
}: ConnectionNotificationProps) {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setIsAnimating(false);
                if (onDismiss) {
                    setTimeout(onDismiss, 300);
                }
            }, 4000); // Auto-dismiss after 4 seconds
            return () => clearTimeout(timer);
        }
    }, [isVisible, onDismiss]);

    if (!isVisible) return null;

    return (
        <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}>
            <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-3 shadow-lg max-w-xs">
                <div className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#B7B7B7]">
                            Connection issues detected. Some features may be limited.
                        </p>
                    </div>
                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="flex-shrink-0 text-[#B7B7B7] hover:text-white transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
