import { Button } from '@/components/ui/button';
import { ExternalLink, Home, RefreshCw, WifiOff } from 'lucide-react';
import { Link } from 'react-router';

interface OfflineFallbackProps {
    onRetry?: () => void;
    showRetry?: boolean;
}

export function OfflineFallback({ onRetry, showRetry = true }: OfflineFallbackProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] p-4">
            <div className="max-w-2xl w-full bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-8 text-center">
                <div className="flex justify-center mb-6">
                    <WifiOff className="h-20 w-20 text-yellow-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">
                    Zero OS - Offline Mode
                </h1>

                <p className="text-[#B7B7B7] mb-8 text-lg">
                    We're experiencing connection issues with our servers. You can still explore Zero OS features and learn about our platform.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-[#2A2A2A] p-4 rounded-lg">
                        <h3 className="text-white font-semibold mb-2">Available Features</h3>
                        <ul className="text-[#B7B7B7] text-sm space-y-1">
                            <li>• Browse Zero OS modules</li>
                            <li>• View documentation</li>
                            <li>• Learn about features</li>
                            <li>• Explore open source info</li>
                        </ul>
                    </div>

                    <div className="bg-[#2A2A2A] p-4 rounded-lg">
                        <h3 className="text-white font-semibold mb-2">Limited Features</h3>
                        <ul className="text-[#B7B7B7] text-sm space-y-1">
                            <li>• User authentication</li>
                            <li>• Email management</li>
                            <li>• Real-time features</li>
                            <li>• Data synchronization</li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {showRetry && onRetry && (
                        <Button
                            onClick={onRetry}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh Page
                    </Button>

                    <Button
                        variant="outline"
                        asChild
                        className="flex items-center gap-2"
                    >
                        <Link to="/">
                            <Home className="h-4 w-4" />
                            Go to Home
                        </Link>
                    </Button>
                </div>

                <div className="mt-8 p-4 bg-[#2A2A2A] rounded-lg">
                    <h3 className="text-white font-semibold mb-2">What is Zero OS?</h3>
                    <p className="text-[#B7B7B7] text-sm mb-4">
                        Zero OS is an open-source productivity platform with AI-powered modules for email, calendar, tasks, agents, and more.
                        It's designed to be self-hosted and privacy-first.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('https://github.com/your-org/zero-os', '_blank')}
                            className="flex items-center gap-2"
                        >
                            <ExternalLink className="h-4 w-4" />
                            View on GitHub
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('/PRODUCTION-DEPLOYMENT.md', '_blank')}
                            className="flex items-center gap-2"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Deployment Guide
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Component for showing a subtle offline indicator
export function OfflineIndicator() {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600 text-white p-2 text-center text-sm">
            <WifiOff className="h-4 w-4 inline mr-2" />
            You're offline. Some features may be limited.
        </div>
    );
}
