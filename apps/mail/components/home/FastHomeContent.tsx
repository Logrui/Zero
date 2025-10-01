import { PixelatedBackground } from '@/components/home/pixelated-bg';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    Bell,
    Calendar,
    Check,
    Clock,
    Cube,
    Docx,
    GitHub,
    GroupPeople,
    Lightning,
    Mail,
    Tag
} from '../icons/icons';
import { Navigation } from '../navigation';
import Footer from './footer';

const firstRowQueries: string[] = [
    'Show recent design feedback',
    'Reply to Nick',
    'Find invoice from Stripe',
];

const secondRowQueries: string[] = [
    'Schedule meeting with Sarah',
    'What did alex say about the design',
];

const tabs = [
    { label: 'Chat With Your Inbox', value: 'smart-categorization' },
    { label: 'Smart Labels', value: 'ai-features' },
    { label: 'Write Better Emails', value: 'feature-3' },
];

export default function FastHomeContent() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGetStarted = async () => {
        console.log('🚀 Get Started button clicked - handler triggered!');

        // Show feedback
        console.log('📢 Showing test toast...');
        toast.info('Testing connection...');

        setIsLoading(true);
        console.log('⏳ Loading state set to true');

        try {
            console.log('🌐 Testing backend connection...');
            // Try to check if the backend is available
            const response = await fetch('/api/auth/get-session', {
                method: 'GET',
                credentials: 'include'
            });

            console.log('📡 Backend response:', response.status, response.statusText);
            console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

            if (response.ok) {
                // Backend is available, redirect to login
                console.log('✅ Backend is available, redirecting to login');
                toast.success('Backend is available! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/auth/login';
                }, 1000);
            } else {
                // Backend is down, show error
                console.log('❌ Backend returned error status:', response.status);
                const errorMessage = `Server is currently unavailable (Status: ${response.status}). Please try again later.`;
                console.log('📢 Showing error toast:', errorMessage);
                toast.error(errorMessage);
            }
        } catch (error) {
            // Network error or backend is down
            console.error('💥 Backend connection failed:', error);
            const errorMessage = 'Unable to connect to the server. Please check your connection and try again.';
            console.log('📢 Showing network error toast:', errorMessage);
            toast.error(errorMessage);
        } finally {
            console.log('🏁 Finally block - setting loading to false');
            setIsLoading(false);
        }
    };

    return (
        <main className="relative flex h-full flex-1 flex-col overflow-x-hidden bg-[#0F0F0F] px-2">
            <PixelatedBackground
                className="z-1 absolute left-1/2 top-[-40px] h-auto w-screen min-w-[1920px] -translate-x-1/2 object-cover"
                style={{
                    mixBlendMode: 'screen',
                    maskImage: 'linear-gradient(to bottom, black, transparent)',
                }}
            />

            <Navigation />

            <section className="z-10 mt-32 flex flex-col items-center px-4">
                <h1 className="text-center text-4xl font-medium md:text-6xl">
                    <span className="mb-3 max-w-[1130px]">
                        Zero OS: The Open-Source Productivity Platform
                    </span>
                </h1>
                <p className="mx-auto mb-4 max-w-2xl text-center text-base font-medium text-[#B7B7B7] md:text-lg">
                    AI-powered modules for email, calendar, tasks, agents, and more. Self-hosted, privacy-first, and fully customizable. Originally forked from Mail-0/Zero
                </p>

                {/* CTA buttons visible for mobile screens */}
                <div className="mb-8 flex flex-col gap-4 sm:hidden">
                    <Button
                        size="lg"
                        onClick={handleGetStarted}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Checking...' : 'Get Started'}
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        Explore Features
                    </Button>
                </div>

                {/* CTA buttons visible for desktop screens */}
                <div className="hidden flex-col gap-4 sm:flex sm:flex-row">
                    <Button
                        size="lg"
                        onClick={handleGetStarted}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Checking...' : 'Get Started'}
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        Explore Features
                    </Button>
                </div>
            </section>

            <section className="relative mt-10 hidden flex-col justify-center md:flex">
                <div className="mx-auto max-w-4xl">
                    <Tabs defaultValue="smart-categorization" className="w-full">
                        <div className="mb-8 flex justify-center">
                            <div className="flex gap-2 rounded-lg bg-[#1E1E1E] p-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.value}
                                        className="rounded-md px-4 py-2 text-sm font-medium text-[#B7B7B7] transition-colors hover:text-white data-[state=active]:bg-[#2A2A2A] data-[state=active]:text-white"
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <TabsContent value="smart-categorization" className="mt-8">
                            <div className="relative">
                                <div className="mx-auto max-w-4xl rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-8">
                                    <div className="mb-6 text-center">
                                        <h3 className="mb-2 text-xl font-medium text-white">
                                            Chat With Your Inbox
                                        </h3>
                                        <p className="text-[#B7B7B7]">
                                            Ask questions about your emails and get instant answers
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            {firstRowQueries.map((query, index) => (
                                                <div
                                                    key={index}
                                                    className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 text-sm text-[#B7B7B7]"
                                                >
                                                    {query}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {secondRowQueries.map((query, index) => (
                                                <div
                                                    key={index}
                                                    className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 text-sm text-[#B7B7B7]"
                                                >
                                                    {query}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="ai-features" className="mt-8">
                            <div className="relative">
                                <div className="mx-auto max-w-4xl rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-8">
                                    <div className="mb-6 text-center">
                                        <h3 className="mb-2 text-xl font-medium text-white">
                                            Smart Labels
                                        </h3>
                                        <p className="text-[#B7B7B7]">
                                            AI automatically categorizes and labels your emails
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-4">
                                            <div className="mb-2 flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                                <span className="text-sm font-medium text-white">Important</span>
                                            </div>
                                            <p className="text-xs text-[#B7B7B7]">High priority emails</p>
                                        </div>
                                        <div className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-4">
                                            <div className="mb-2 flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                                <span className="text-sm font-medium text-white">Work</span>
                                            </div>
                                            <p className="text-xs text-[#B7B7B7]">Professional communications</p>
                                        </div>
                                        <div className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-4">
                                            <div className="mb-2 flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                                                <span className="text-sm font-medium text-white">Social</span>
                                            </div>
                                            <p className="text-xs text-[#B7B7B7]">Personal and social emails</p>
                                        </div>
                                        <div className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-4">
                                            <div className="mb-2 flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                                <span className="text-sm font-medium text-white">Updates</span>
                                            </div>
                                            <p className="text-xs text-[#B7B7B7]">Newsletters and updates</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="feature-3" className="mt-8">
                            <div className="relative">
                                <div className="mx-auto max-w-4xl rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-8">
                                    <div className="mb-6 text-center">
                                        <h3 className="mb-2 text-xl font-medium text-white">
                                            Write Better Emails
                                        </h3>
                                        <p className="text-[#B7B7B7]">
                                            AI-powered writing assistance for professional emails
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-4">
                                            <div className="mb-2 flex items-center gap-2">
                                                <Lightning className="h-4 w-4 text-yellow-500" />
                                                <span className="text-sm font-medium text-white">Smart Suggestions</span>
                                            </div>
                                            <p className="text-xs text-[#B7B7B7]">Get AI-powered writing suggestions</p>
                                        </div>
                                        <div className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-4">
                                            <div className="mb-2 flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-500" />
                                                <span className="text-sm font-medium text-white">Grammar Check</span>
                                            </div>
                                            <p className="text-xs text-[#B7B7B7]">Automatic grammar and tone checking</p>
                                        </div>
                                        <div className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-4">
                                            <div className="mb-2 flex items-center gap-2">
                                                <Tag className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm font-medium text-white">Tone Adjustment</span>
                                            </div>
                                            <p className="text-xs text-[#B7B7B7]">Adjust tone for different audiences</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </section>

            {/* Zero OS Features Section */}
            <section id="features" className="relative mt-32 flex flex-col items-center px-4">
                <div className="mb-12 text-center">
                    <h2 className="mb-4 text-3xl font-medium text-white md:text-4xl">
                        Zero OS Features
                    </h2>
                    <p className="mx-auto max-w-2xl text-base text-[#B7B7B7] md:text-lg">
                        A comprehensive productivity platform with AI-powered modules for every aspect of your workflow.
                    </p>
                </div>

                <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Mail Module */}
                    <div className="group rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-6 transition-all hover:border-[#3A3A3A] hover:bg-[#252525]">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2A2A2A]">
                                <Mail className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-lg font-medium text-white">Mail</h3>
                        </div>
                        <p className="mb-4 text-sm text-[#B7B7B7]">
                            AI-powered email client with smart categorization, auto-replies, and intelligent inbox management.
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = '/mail'}
                            className="text-[#B7B7B7] hover:text-white"
                        >
                            Explore Mail →
                        </Button>
                    </div>

                    {/* Calendar Module */}
                    <div className="group rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-6 transition-all hover:border-[#3A3A3A] hover:bg-[#252525]">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2A2A2A]">
                                <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-lg font-medium text-white">Calendar</h3>
                        </div>
                        <p className="mb-4 text-sm text-[#B7B7B7]">
                            Smart scheduling with AI-powered meeting coordination and time management.
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = '/calendar'}
                            className="text-[#B7B7B7] hover:text-white"
                        >
                            Explore Calendar →
                        </Button>
                    </div>

                    {/* Tasks Module */}
                    <div className="group rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-6 transition-all hover:border-[#3A3A3A] hover:bg-[#252525]">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2A2A2A]">
                                <Check className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-lg font-medium text-white">Tasks</h3>
                        </div>
                        <p className="mb-4 text-sm text-[#B7B7B7]">
                            Intelligent task management with AI-powered prioritization and automation.
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = '/tasks'}
                            className="text-[#B7B7B7] hover:text-white"
                        >
                            Explore Tasks →
                        </Button>
                    </div>

                    {/* Agents Module */}
                    <div className="group rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-6 transition-all hover:border-[#3A3A3A] hover:bg-[#252525]">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2A2A2A]">
                                <Lightning className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-lg font-medium text-white">Agents</h3>
                        </div>
                        <p className="mb-4 text-sm text-[#B7B7B7]">
                            AI agents that automate workflows and handle routine tasks intelligently.
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = '/agents'}
                            className="text-[#B7B7B7] hover:text-white"
                        >
                            Explore Agents →
                        </Button>
                    </div>

                    {/* Notifications Module */}
                    <div className="group rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-6 transition-all hover:border-[#3A3A3A] hover:bg-[#252525]">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2A2A2A]">
                                <Bell className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-lg font-medium text-white">Notifications</h3>
                        </div>
                        <p className="mb-4 text-sm text-[#B7B7B7]">
                            Smart notification system with intelligent filtering and priority management.
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = '/notifications'}
                            className="text-[#B7B7B7] hover:text-white"
                        >
                            Explore Notifications →
                        </Button>
                    </div>

                    {/* Scheduling Module */}
                    <div className="group rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-6 transition-all hover:border-[#3A3A3A] hover:bg-[#252525]">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2A2A2A]">
                                <Clock className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-lg font-medium text-white">Scheduling</h3>
                        </div>
                        <p className="mb-4 text-sm text-[#B7B7B7]">
                            Advanced scheduling tools with AI-powered meeting optimization.
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = '/scheduling'}
                            className="text-[#B7B7B7] hover:text-white"
                        >
                            Explore Scheduling →
                        </Button>
                    </div>

                    {/* Workspaces Module */}
                    <div className="group rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-6 transition-all hover:border-[#3A3A3A] hover:bg-[#252525]">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2A2A2A]">
                                <GroupPeople className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-lg font-medium text-white">Workspaces</h3>
                        </div>
                        <p className="mb-4 text-sm text-[#B7B7B7]">
                            Collaborative workspaces with team management and project organization.
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = '/workspaces'}
                            className="text-[#B7B7B7] hover:text-white"
                        >
                            Explore Workspaces →
                        </Button>
                    </div>

                    {/* Extensibility */}
                    <div className="group rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-6 transition-all hover:border-[#3A3A3A] hover:bg-[#252525]">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2A2A2A]">
                                <Cube className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-lg font-medium text-white">Extensibility</h3>
                        </div>
                        <p className="mb-4 text-sm text-[#B7B7B7]">
                            APIs and integrations to connect with your existing tools and workflows.
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open('https://github.com/your-org/zero-os', '_blank')}
                            className="text-[#B7B7B7] hover:text-white"
                        >
                            View Documentation →
                        </Button>
                    </div>
                </div>
            </section>

            {/* Speed is Everything Section */}
            <section className="relative mt-32 flex flex-col items-center px-4">
                <div className="mb-12 text-center">
                    <h2 className="mb-4 text-3xl font-medium text-white md:text-4xl">
                        Speed is Everything
                    </h2>
                    <p className="mx-auto max-w-2xl text-base text-[#B7B7B7] md:text-lg">
                        Built for speed and efficiency. Zero OS is designed to handle your workflow without slowing you down.
                    </p>
                </div>

                <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-8">
                        <div className="mb-4 flex items-center gap-3">
                            <Lightning className="h-6 w-6 text-yellow-500" />
                            <h3 className="text-xl font-medium text-white">Lightning Fast</h3>
                        </div>
                        <p className="text-[#B7B7B7]">
                            Optimized for speed with instant search, real-time updates, and minimal latency.
                        </p>
                    </div>

                    <div className="rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-8">
                        <div className="mb-4 flex items-center gap-3">
                            <Check className="h-6 w-6 text-green-500" />
                            <h3 className="text-xl font-medium text-white">Reliable</h3>
                        </div>
                        <p className="text-[#B7B7B7]">
                            Built with reliability in mind. Your data is safe and your workflow is uninterrupted.
                        </p>
                    </div>
                </div>
            </section>

            {/* Open Source & Self-Hosting Band */}
            <section className="relative mt-20 flex flex-col items-center px-4">
                <div className="w-full max-w-4xl rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-8 text-center">
                    <h3 className="mb-4 text-2xl font-medium text-white">
                        Open Source & Self-Hosted
                    </h3>
                    <p className="mb-6 text-[#B7B7B7]">
                        Zero OS is completely open source and designed to be self-hosted. Take control of your data and customize the platform to your needs.
                    </p>
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                        <Button
                            variant="outline"
                            onClick={() => window.open('https://github.com/your-org/zero-os', '_blank')}
                            className="flex items-center gap-2"
                        >
                            <GitHub className="h-4 w-4" />
                            View on GitHub
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.open('/PRODUCTION-DEPLOYMENT.md', '_blank')}
                            className="flex items-center gap-2"
                        >
                            <Docx className="h-4 w-4" />
                            Deployment Guide
                        </Button>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
