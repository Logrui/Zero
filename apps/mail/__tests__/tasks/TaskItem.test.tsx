/**
 * Task Item Component Tests
 * 
 * Tests for TaskItem component with status updates and interactions.
 * Covers task display, editing, and user interactions.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TaskItem } from '../../app/tasks/components/TaskItem';
import type { TaskWithRelations } from '../../app/tasks/types/task';

// Mock data
const mockTask: TaskWithRelations = {
    id: '1',
    googleTaskId: 'google-1',
    userId: 'user-1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'needsAction',
    due: new Date('2024-12-25'),
    priority: 'high',
    notes: 'Test Notes',
    labels: ['work', 'urgent'],
    createdAt: new Date('2024-12-19'),
    updatedAt: new Date('2024-12-19'),
    subtasks: [
        {
            id: 'subtask-1',
            taskId: '1',
            title: 'Subtask 1',
            status: 'needsAction',
            position: 0,
            createdAt: new Date('2024-12-19'),
            updatedAt: new Date('2024-12-19')
        }
    ],
    zeroosExtension: {
        id: 'ext-1',
        taskId: '1',
        workspace: 'Test Workspace',
        associatedPeople: ['John Doe'],
        associatedCompanies: ['Acme Corp'],
        linkedGmailThreads: ['thread-1'],
        internalNotes: 'Internal notes',
        tags: ['important'],
        createdAt: new Date('2024-12-19'),
        updatedAt: new Date('2024-12-19')
    },
    syncState: {
        id: 'sync-1',
        taskId: '1',
        lastSyncTimestamp: new Date('2024-12-19'),
        conflictResolution: 'local',
        retryCount: 0,
        lastError: null,
        createdAt: new Date('2024-12-19'),
        updatedAt: new Date('2024-12-19')
    },
    changes: []
};

// Mock props
const defaultProps = {
    task: mockTask,
    onClick: jest.fn(),
    onToggle: jest.fn(),
    onUpdate: jest.fn(),
    onDelete: jest.fn()
};

describe('TaskItem', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders task title', () => {
            render(<TaskItem {...defaultProps} />);

            expect(screen.getByText('Test Task')).toBeInTheDocument();
        });

        it('renders task description', () => {
            render(<TaskItem {...defaultProps} />);

            expect(screen.getByText('Test Description')).toBeInTheDocument();
        });

        it('renders task status', () => {
            render(<TaskItem {...defaultProps} />);

            expect(screen.getByText('Pending')).toBeInTheDocument();
        });

        it('renders completed task with strikethrough', () => {
            const completedTask = { ...mockTask, status: 'completed' as const };
            render(<TaskItem {...defaultProps} task={completedTask} />);

            const title = screen.getByText('Test Task');
            expect(title).toHaveClass('line-through');
        });

        it('renders task priority', () => {
            render(<TaskItem {...defaultProps} />);

            expect(screen.getByText('high')).toBeInTheDocument();
        });

        it('renders task labels', () => {
            render(<TaskItem {...defaultProps} />);

            expect(screen.getByText('work')).toBeInTheDocument();
            expect(screen.getByText('urgent')).toBeInTheDocument();
        });

        it('renders task due date', () => {
            render(<TaskItem {...defaultProps} />);

            expect(screen.getByText('In 6 days')).toBeInTheDocument();
        });

        it('renders overdue task with warning', () => {
            const overdueTask = {
                ...mockTask,
                due: new Date('2024-12-15'),
                status: 'needsAction' as const
            };
            render(<TaskItem {...defaultProps} task={overdueTask} />);

            expect(screen.getByText('4 days ago')).toBeInTheDocument();
        });

        it('renders subtasks count', () => {
            render(<TaskItem {...defaultProps} />);

            expect(screen.getByText('0/1 subtasks')).toBeInTheDocument();
        });
    });

    describe('Interactions', () => {
        it('handles task click', () => {
            render(<TaskItem {...defaultProps} />);

            const taskItem = screen.getByText('Test Task');
            fireEvent.click(taskItem);

            expect(defaultProps.onClick).toHaveBeenCalledWith(mockTask);
        });

        it('handles task toggle', () => {
            render(<TaskItem {...defaultProps} />);

            const toggleButton = screen.getByRole('button');
            fireEvent.click(toggleButton);

            expect(defaultProps.onToggle).toHaveBeenCalledWith('1');
        });

        it('handles task edit', () => {
            render(<TaskItem {...defaultProps} />);

            const taskItem = screen.getByText('Test Task');
            fireEvent.mouseEnter(taskItem);

            const editButton = screen.getByTitle('Edit task');
            fireEvent.click(editButton);

            expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
        });

        it('handles task delete', () => {
            render(<TaskItem {...defaultProps} />);

            const taskItem = screen.getByText('Test Task');
            fireEvent.mouseEnter(taskItem);

            const deleteButton = screen.getByTitle('Delete task');
            fireEvent.click(deleteButton);

            expect(defaultProps.onDelete).toHaveBeenCalledWith('1');
        });

        it('handles hover state', () => {
            render(<TaskItem {...defaultProps} />);

            const taskItem = screen.getByText('Test Task');
            fireEvent.mouseEnter(taskItem);

            expect(screen.getByTitle('Edit task')).toBeInTheDocument();
            expect(screen.getByTitle('Delete task')).toBeInTheDocument();
        });

        it('handles mouse leave', () => {
            render(<TaskItem {...defaultProps} />);

            const taskItem = screen.getByText('Test Task');
            fireEvent.mouseEnter(taskItem);
            fireEvent.mouseLeave(taskItem);

            expect(screen.queryByTitle('Edit task')).not.toBeInTheDocument();
            expect(screen.queryByTitle('Delete task')).not.toBeInTheDocument();
        });
    });

    describe('Editing', () => {
        it('enters edit mode on edit button click', () => {
            render(<TaskItem {...defaultProps} />);

            const taskItem = screen.getByText('Test Task');
            fireEvent.mouseEnter(taskItem);

            const editButton = screen.getByTitle('Edit task');
            fireEvent.click(editButton);

            expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
        });

        it('saves changes on blur', async () => {
            render(<TaskItem {...defaultProps} />);

            const taskItem = screen.getByText('Test Task');
            fireEvent.mouseEnter(taskItem);

            const editButton = screen.getByTitle('Edit task');
            fireEvent.click(editButton);

            const input = screen.getByDisplayValue('Test Task');
            fireEvent.change(input, { target: { value: 'Updated Task' } });
            fireEvent.blur(input);

            await waitFor(() => {
                expect(defaultProps.onUpdate).toHaveBeenCalledWith('1', { title: 'Updated Task' });
            });
        });

        it('saves changes on Enter key', async () => {
            render(<TaskItem {...defaultProps} />);

            const taskItem = screen.getByText('Test Task');
            fireEvent.mouseEnter(taskItem);

            const editButton = screen.getByTitle('Edit task');
            fireEvent.click(editButton);

            const input = screen.getByDisplayValue('Test Task');
            fireEvent.change(input, { target: { value: 'Updated Task' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            await waitFor(() => {
                expect(defaultProps.onUpdate).toHaveBeenCalledWith('1', { title: 'Updated Task' });
            });
        });

        it('cancels changes on Escape key', () => {
            render(<TaskItem {...defaultProps} />);

            const taskItem = screen.getByText('Test Task');
            fireEvent.mouseEnter(taskItem);

            const editButton = screen.getByTitle('Edit task');
            fireEvent.click(editButton);

            const input = screen.getByDisplayValue('Test Task');
            fireEvent.change(input, { target: { value: 'Updated Task' } });
            fireEvent.keyDown(input, { key: 'Escape' });

            expect(screen.getByText('Test Task')).toBeInTheDocument();
            expect(defaultProps.onUpdate).not.toHaveBeenCalled();
        });

        it('does not save empty title', () => {
            render(<TaskItem {...defaultProps} />);

            const taskItem = screen.getByText('Test Task');
            fireEvent.mouseEnter(taskItem);

            const editButton = screen.getByTitle('Edit task');
            fireEvent.click(editButton);

            const input = screen.getByDisplayValue('Test Task');
            fireEvent.change(input, { target: { value: '' } });
            fireEvent.blur(input);

            expect(defaultProps.onUpdate).not.toHaveBeenCalled();
        });
    });

    describe('Priority Display', () => {
        it('displays high priority with red color', () => {
            render(<TaskItem {...defaultProps} />);

            const priorityBadge = screen.getByText('high');
            expect(priorityBadge).toHaveClass('text-red-600');
        });

        it('displays normal priority with gray color', () => {
            const normalTask = { ...mockTask, priority: 'normal' as const };
            render(<TaskItem {...defaultProps} task={normalTask} />);

            const priorityBadge = screen.getByText('normal');
            expect(priorityBadge).toHaveClass('text-gray-600');
        });

        it('displays low priority with green color', () => {
            const lowTask = { ...mockTask, priority: 'low' as const };
            render(<TaskItem {...defaultProps} task={lowTask} />);

            const priorityBadge = screen.getByText('low');
            expect(priorityBadge).toHaveClass('text-green-600');
        });

        it('shows priority icon for non-normal priority', () => {
            render(<TaskItem {...defaultProps} />);

            expect(screen.getByText('🔴')).toBeInTheDocument();
        });

        it('does not show priority icon for normal priority', () => {
            const normalTask = { ...mockTask, priority: 'normal' as const };
            render(<TaskItem {...defaultProps} task={normalTask} />);

            expect(screen.queryByText('🔴')).not.toBeInTheDocument();
            expect(screen.queryByText('🟡')).not.toBeInTheDocument();
            expect(screen.queryByText('🟢')).not.toBeInTheDocument();
        });
    });

    describe('Date Formatting', () => {
        it('formats due date correctly', () => {
            render(<TaskItem {...defaultProps} />);

            expect(screen.getByText('In 6 days')).toBeInTheDocument();
        });

        it('formats today\'s date', () => {
            const todayTask = { ...mockTask, due: new Date() };
            render(<TaskItem {...defaultProps} task={todayTask} />);

            expect(screen.getByText('Today')).toBeInTheDocument();
        });

        it('formats tomorrow\'s date', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowTask = { ...mockTask, due: tomorrow };
            render(<TaskItem {...defaultProps} task={tomorrowTask} />);

            expect(screen.getByText('Tomorrow')).toBeInTheDocument();
        });

        it('formats yesterday\'s date', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayTask = { ...mockTask, due: yesterday };
            render(<TaskItem {...defaultProps} task={yesterdayTask} />);

            expect(screen.getByText('Yesterday')).toBeInTheDocument();
        });

        it('formats overdue date', () => {
            const overdue = new Date();
            overdue.setDate(overdue.getDate() - 5);
            const overdueTask = { ...mockTask, due: overdue };
            render(<TaskItem {...defaultProps} task={overdueTask} />);

            expect(screen.getByText('5 days ago')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels', () => {
            render(<TaskItem {...defaultProps} />);

            expect(screen.getByRole('button')).toHaveAttribute('aria-label');
        });

        it('supports keyboard navigation', () => {
            render(<TaskItem {...defaultProps} />);

            const taskItem = screen.getByText('Test Task');
            fireEvent.keyDown(taskItem, { key: 'Enter' });

            expect(defaultProps.onClick).toHaveBeenCalledWith(mockTask);
        });

        it('announces status changes', () => {
            render(<TaskItem {...defaultProps} />);

            const statusRegion = screen.getByRole('status');
            expect(statusRegion).toBeInTheDocument();
        });
    });

    describe('Performance', () => {
        it('renders efficiently', () => {
            const startTime = performance.now();

            render(<TaskItem {...defaultProps} />);

            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(10); // Should render in < 10ms
        });

        it('handles rapid updates', () => {
            const { rerender } = render(<TaskItem {...defaultProps} />);

            const startTime = performance.now();

            // Rapid updates
            for (let i = 0; i < 100; i++) {
                rerender(<TaskItem {...defaultProps} task={{ ...mockTask, title: `Task ${i}` }} />);
            }

            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(100); // Should handle in < 100ms
        });
    });
});
