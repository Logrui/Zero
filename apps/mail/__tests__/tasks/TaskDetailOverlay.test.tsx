/**
 * Task Detail Overlay Component Tests
 * 
 * Tests for TaskDetailOverlay component with editing and save functionality.
 * Covers overlay display, editing, and user interactions.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TaskDetailOverlay } from '../../app/tasks/components/TaskDetailOverlay';
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
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    onDelete: jest.fn(),
    onSubtaskCreate: jest.fn(),
    onSubtaskUpdate: jest.fn(),
    onSubtaskDelete: jest.fn(),
    onSubtaskReorder: jest.fn()
};

describe('TaskDetailOverlay', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders overlay when open', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            expect(screen.getByText('Task Details')).toBeInTheDocument();
            expect(screen.getByText('Test Task')).toBeInTheDocument();
        });

        it('does not render when closed', () => {
            render(<TaskDetailOverlay {...defaultProps} isOpen={false} />);

            expect(screen.queryByText('Task Details')).not.toBeInTheDocument();
        });

        it('renders task information', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            expect(screen.getByText('Test Task')).toBeInTheDocument();
            expect(screen.getByText('Test Description')).toBeInTheDocument();
            expect(screen.getByText('Test Notes')).toBeInTheDocument();
        });

        it('renders task status', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            expect(screen.getByText('Pending')).toBeInTheDocument();
        });

        it('renders task priority', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            expect(screen.getByText('high')).toBeInTheDocument();
        });

        it('renders task labels', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            expect(screen.getByText('work')).toBeInTheDocument();
            expect(screen.getByText('urgent')).toBeInTheDocument();
        });

        it('renders task due date', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            expect(screen.getByText('12/25/2024')).toBeInTheDocument();
        });

        it('renders subtasks', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            expect(screen.getByText('Subtasks')).toBeInTheDocument();
            expect(screen.getByText('Subtask 1')).toBeInTheDocument();
        });

        it('renders ZeroOS extension', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            expect(screen.getByText('ZeroOS Details')).toBeInTheDocument();
            expect(screen.getByText('Test Workspace')).toBeInTheDocument();
        });
    });

    describe('Editing', () => {
        it('enters edit mode on edit button click', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);

            expect(screen.getByText('Edit Task')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
        });

        it('saves changes on save button click', async () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);

            const titleInput = screen.getByDisplayValue('Test Task');
            fireEvent.change(titleInput, { target: { value: 'Updated Task' } });

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(defaultProps.onSave).toHaveBeenCalledWith('1', expect.objectContaining({
                    title: 'Updated Task'
                }));
            });
        });

        it('cancels changes on cancel button click', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);

            const titleInput = screen.getByDisplayValue('Test Task');
            fireEvent.change(titleInput, { target: { value: 'Updated Task' } });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(screen.getByText('Test Task')).toBeInTheDocument();
            expect(defaultProps.onSave).not.toHaveBeenCalled();
        });

        it('shows unsaved changes warning', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);

            const titleInput = screen.getByDisplayValue('Test Task');
            fireEvent.change(titleInput, { target: { value: 'Updated Task' } });

            expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
        });

        it('handles keyboard shortcuts', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);

            // Test Ctrl+S shortcut
            fireEvent.keyDown(document, { key: 's', ctrlKey: true });

            expect(defaultProps.onSave).toHaveBeenCalled();
        });

        it('handles Escape key to cancel', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(screen.getByText('Test Task')).toBeInTheDocument();
        });
    });

    describe('Subtask Management', () => {
        it('creates new subtask', async () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const addButton = screen.getByText('Add subtask');
            fireEvent.click(addButton);

            const input = screen.getByPlaceholderText('Enter subtask title');
            fireEvent.change(input, { target: { value: 'New Subtask' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            await waitFor(() => {
                expect(defaultProps.onSubtaskCreate).toHaveBeenCalledWith({
                    title: 'New Subtask',
                    status: 'needsAction',
                    position: 1
                });
            });
        });

        it('updates existing subtask', async () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const subtask = screen.getByText('Subtask 1');
            fireEvent.click(subtask);

            const input = screen.getByDisplayValue('Subtask 1');
            fireEvent.change(input, { target: { value: 'Updated Subtask' } });
            fireEvent.blur(input);

            await waitFor(() => {
                expect(defaultProps.onSubtaskUpdate).toHaveBeenCalledWith('subtask-1', {
                    title: 'Updated Subtask'
                });
            });
        });

        it('deletes subtask', async () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const deleteButton = screen.getByTitle('Delete subtask');
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(defaultProps.onSubtaskDelete).toHaveBeenCalledWith('subtask-1');
            });
        });

        it('toggles subtask completion', async () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const checkbox = screen.getByRole('checkbox');
            fireEvent.click(checkbox);

            await waitFor(() => {
                expect(defaultProps.onSubtaskUpdate).toHaveBeenCalledWith('subtask-1', {
                    status: 'completed'
                });
            });
        });
    });

    describe('Overlay Interactions', () => {
        it('closes overlay on close button click', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const closeButton = screen.getByRole('button', { name: /close/i });
            fireEvent.click(closeButton);

            expect(defaultProps.onClose).toHaveBeenCalled();
        });

        it('closes overlay on overlay click', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const overlay = screen.getByTestId('overlay');
            fireEvent.click(overlay);

            expect(defaultProps.onClose).toHaveBeenCalled();
        });

        it('does not close overlay on content click', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const content = screen.getByTestId('content');
            fireEvent.click(content);

            expect(defaultProps.onClose).not.toHaveBeenCalled();
        });

        it('shows confirmation for unsaved changes', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);

            const titleInput = screen.getByDisplayValue('Test Task');
            fireEvent.change(titleInput, { target: { value: 'Updated Task' } });

            const closeButton = screen.getByRole('button', { name: /close/i });
            fireEvent.click(closeButton);

            expect(screen.getByText('You have unsaved changes. Are you sure you want to close?')).toBeInTheDocument();
        });
    });

    describe('Task Deletion', () => {
        it('deletes task on delete button click', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const deleteButton = screen.getByText('Delete');
            fireEvent.click(deleteButton);

            expect(defaultProps.onDelete).toHaveBeenCalledWith('1');
        });

        it('shows confirmation dialog for deletion', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const deleteButton = screen.getByText('Delete');
            fireEvent.click(deleteButton);

            expect(screen.getByText('Are you sure you want to delete this task?')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByLabelText('Task Details')).toBeInTheDocument();
        });

        it('supports keyboard navigation', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const editButton = screen.getByText('Edit');
            fireEvent.keyDown(editButton, { key: 'Enter' });

            expect(screen.getByText('Edit Task')).toBeInTheDocument();
        });

        it('traps focus within overlay', () => {
            render(<TaskDetailOverlay {...defaultProps} />);

            const firstButton = screen.getByText('Edit');
            firstButton.focus();

            fireEvent.keyDown(firstButton, { key: 'Tab' });

            // Focus should move to next focusable element
            expect(document.activeElement).not.toBe(firstButton);
        });
    });

    describe('Performance', () => {
        it('renders efficiently', () => {
            const startTime = performance.now();

            render(<TaskDetailOverlay {...defaultProps} />);

            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(50); // Should render in < 50ms
        });

        it('handles rapid updates', () => {
            const { rerender } = render(<TaskDetailOverlay {...defaultProps} />);

            const startTime = performance.now();

            // Rapid updates
            for (let i = 0; i < 50; i++) {
                rerender(<TaskDetailOverlay {...defaultProps} task={{ ...mockTask, title: `Task ${i}` }} />);
            }

            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(100); // Should handle in < 100ms
        });
    });
});
