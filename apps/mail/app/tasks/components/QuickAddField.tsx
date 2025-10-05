/**
 * Quick Add Field Component
 * 
 * Quick task creation field that expands to full editor.
 * Provides fast task creation with minimal UI.
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { CreateTaskData } from '../types/task';

export interface QuickAddFieldProps {
    onTaskCreate: (data: CreateTaskData) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export function QuickAddField({
    onTaskCreate,
    placeholder = "Add a new task...",
    autoFocus = false
}: QuickAddFieldProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [due, setDue] = useState('');
    const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
    const [labels, setLabels] = useState<string[]>([]);
    const [newLabel, setNewLabel] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputRef = { current: null as HTMLInputElement | null };
    const titleInputRef = { current: null as HTMLInputElement | null };

    // Auto-focus on mount
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Handle input change
    const handleInputChange = useCallback((e: any) => {
        setTitle(e.target.value);
    }, []);

    // Handle input key down
    const handleInputKeyDown = useCallback((e: any) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (title.trim()) {
                handleQuickCreate();
            }
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    }, [title]);

    // Handle input focus
    const handleInputFocus = useCallback(() => {
        setIsExpanded(true);
    }, []);

    // Handle quick create
    const handleQuickCreate = useCallback(async () => {
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            await onTaskCreate({
                title: title.trim(),
                status: 'needsAction',
                priority: 'normal'
            });
            setTitle('');
            setDescription('');
            setDue('');
            setPriority('normal');
            setLabels([]);
            setIsExpanded(false);
        } catch (error) {
            console.error('Failed to create task:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [title, onTaskCreate]);

    // Handle full create
    const handleFullCreate = useCallback(async () => {
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            await onTaskCreate({
                title: title.trim(),
                description: description.trim() || undefined,
                due: due ? new Date(due) : undefined,
                priority,
                labels: labels.length > 0 ? labels : undefined,
                status: 'needsAction'
            });
            setTitle('');
            setDescription('');
            setDue('');
            setPriority('normal');
            setLabels([]);
            setIsExpanded(false);
        } catch (error) {
            console.error('Failed to create task:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [title, description, due, priority, labels, onTaskCreate]);

    // Handle cancel
    const handleCancel = useCallback(() => {
        setTitle('');
        setDescription('');
        setDue('');
        setPriority('normal');
        setLabels([]);
        setIsExpanded(false);
    }, []);

    // Handle label add
    const handleLabelAdd = useCallback((e: any) => {
        if (e.key === 'Enter' && newLabel.trim()) {
            e.preventDefault();
            if (!labels.includes(newLabel.trim())) {
                setLabels([...labels, newLabel.trim()]);
            }
            setNewLabel('');
        }
    }, [newLabel, labels]);

    // Handle label remove
    const handleLabelRemove = useCallback((labelToRemove: string) => {
        setLabels(labels.filter(label => label !== labelToRemove));
    }, [labels]);

    // Handle click outside
    useEffect(() => {
        if (typeof document === 'undefined') return;

        const handleClickOutside = (event: MouseEvent) => {
            if (isExpanded && !(event.target as Element).closest('.quick-add-container')) {
                handleCancel();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded, handleCancel]);

    return (
        <div className="quick-add-container">
            {!isExpanded ? (
                <div className="relative">
                    <Input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        onFocus={handleInputFocus}
                        placeholder={placeholder}
                        disabled={isSubmitting}
                        className="pr-10"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Plus className="w-4 h-4 text-muted-foreground" />
                    </div>
                </div>
            ) : (
                <div className="bg-card border rounded-lg shadow-sm p-4 space-y-4">
                    {/* Title */}
                    <div>
                        <Label htmlFor="task-title">Task Title *</Label>
                        <Input
                            ref={titleInputRef}
                            id="task-title"
                            type="text"
                            value={title}
                            onChange={handleInputChange}
                            placeholder="Enter task title"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="task-description">Description</Label>
                        <Textarea
                            id="task-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter task description"
                            rows={3}
                        />
                    </div>

                    {/* Due Date and Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="task-due">Due Date</Label>
                            <Input
                                id="task-due"
                                type="date"
                                value={due}
                                onChange={(e) => setDue(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="task-priority">Priority</Label>
                            <Select value={priority} onValueChange={(value: 'low' | 'normal' | 'high') => setPriority(value)}>
                                <SelectTrigger id="task-priority">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Labels */}
                    <div>
                        <Label htmlFor="task-labels">Labels</Label>
                        <div className="space-y-2">
                            <Input
                                id="task-labels"
                                type="text"
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                onKeyDown={handleLabelAdd}
                                placeholder="Add a label and press Enter"
                            />
                            {labels.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {labels.map((label, index) => (
                                        <div key={index} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                            {label}
                                            <button
                                                onClick={() => handleLabelRemove(label)}
                                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleFullCreate}
                            disabled={!title.trim() || isSubmitting}
                            isLoading={isSubmitting}
                            loadingText="Creating..."
                        >
                            Create Task
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
