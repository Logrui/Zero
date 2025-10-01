import { Button } from '@/components/ui/button';
import {
    Bell,
    Calendar,
    Check,
    Clock,
    Cube,
    GroupPeople,
    Lightning,
    Mail,
} from '../icons/icons';

export default function SimpleHomeContent() {
    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#0F0F0F] text-white">
            {/* Hero Section */}
            <section className="relative flex flex-col items-center justify-center px-4 py-20 text-center">
                <h1 className="mb-4 text-4xl font-medium text-white md:text-6xl">
                    Zero OS: The Open-Source Productivity Platform
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-base font-medium text-[#B7B7B7] md:text-lg">
                    AI-powered modules for email, calendar, tasks, agents, and more. Self-hosted, privacy-first, and fully customizable. Originally forked from Mail-0/Zero
                </p>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Button
                        size="lg"
                        onClick={() => window.location.href = '/auth/login'}
                    >
                        Get Started
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

            {/* Zero OS Features Section */}
            <section id="features" className="relative mt-20 flex flex-col items-center px-4">
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
                            View on GitHub
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.open('/PRODUCTION-DEPLOYMENT.md', '_blank')}
                            className="flex items-center gap-2"
                        >
                            Deployment Guide
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}
