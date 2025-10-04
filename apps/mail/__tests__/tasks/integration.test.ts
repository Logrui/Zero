/**
 * End-to-End Integration Tests
 * 
 * Tests for complete user workflows and Google Tasks sync.
 * Covers full user journeys and system integration.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskList } from '../../app/tasks/components/TaskList';
import { TaskDetailOverlay } from '../../app/tasks/components/TaskDetailOverlay';
import { QuickAddField } from '../../app/tasks/components/QuickAddField';
import { useTasks } from '../../app/tasks/hooks/useTasks';
import { useSync } from '../../app/tasks/hooks/useSync';
import { useGoogleTasks } from '../../app/tasks/hooks/useGoogleTasks';
import type { TaskWithRelations, CreateTaskData, UpdateTaskData } from '../../app/tasks/types/task';

// Mock hooks
jest.mock('../../app/tasks/hooks/useTasks');
jest.mock('../../app/tasks/hooks/useSync');
jest.mock('../../app/tasks/hooks/useGoogleTasks');

// Mock data
const mockTasks: TaskWithRelations[] = [
    {
        id: '1',
        googleTaskId: 'google-1',
        userId: 'user-1',
        title: 'Task 1',
        description: 'Description 1',
        status: 'needsAction',
        due: new Date('2024-12-25'),
        priority: 'high',
        notes: 'Notes 1',
        labels: ['work', 'urgent'],
        createdAt: new Date('2024-12-19'),
        updatedAt: new Date('2024-12-19'),
        subtasks: [],
        zeroosExtension: null,
        syncState: null,
        changes: []
    },
    {
        id: '2',
        googleTaskId: 'google-2',
        userId: 'user-1',
        title: 'Task 2',
        description: 'Description 2',
        status: 'completed',
        due: new Date('2024-12-20'),
        priority: 'normal',
        notes: 'Notes 2',
        labels: ['personal'],
        createdAt: new Date('2024-12-18'),
        updatedAt: new Date('2024-12-20'),
        subtasks: [],
        zeroosExtension: null,
        syncState: null,
        changes: []
    }
];

const mockUseTasks = {
    tasks: mockTasks,
    loading: false,
    error: null,
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    toggleTask: jest.fn(),
    refreshTasks: jest.fn()
};

const mockUseSync = {
    status: {
        isOnline: true,
        lastSync: new Date('2024-12-19'),
        pendingChanges: 0,
        conflicts: 0,
        errors: []
    },
    stats: {
        totalTasks: 2,
        syncedTasks: 2,
        pendingChanges: 0,
        conflicts: 0,
        lastSync: new Date('2024-12-19')
    },
    sync: jest.fn(),
    resolveConflicts: jest.fn(),
    forceSync: jest.fn(),
    processQueue: jest.fn()
};

const mockUseGoogleTasks = {
    isConnected: true,
    authUrl: 'https://accounts.google.com/oauth/authorize',
    connect: jest.fn(),
    disconnect: jest.fn(),
    permissions: ['https://www.googleapis.com/auth/tasks']
};

describe('End-to-End Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useTasks as jest.Mock).mockReturnValue(mockUseTasks);
        (useSync as jest.Mock).mockReturnValue(mockUseSync);
        (useGoogleTasks as jest.Mock).mockReturnValue(mockUseGoogleTasks);
    });

    describe('Complete User Workflow', () => {
        it('creates, edits, and deletes a task', async () => {
            const { rerender } = render(<TaskList { ...mockUseTasks } />);

            // Create task
            const createTask = mockUseTasks.createTask;
            createTask.mockResolvedValue({ id: '3', title: 'New Task' });

            const quickAdd = screen.getByPlaceholderText('Add a new task...');
            fireEvent.change(quickAdd, { target: { value: 'New Task' } });
            fireEvent.keyDown(quickAdd, { key: 'Enter' });

            await waitFor(() => {
                expect(createTask).toHaveBeenCalledWith({
                    title: 'New Task',
                    status: 'needsAction',
                    priority: 'normal'
                });
            });

            // Edit task
            const updateTask = mockUseTasks.updateTask;
            updateTask.mockResolvedValue({ id: '1', title: 'Updated Task' });

            const taskItem = screen.getByText('Task 1');
            fireEvent.mouseEnter(taskItem);

            const editButton = screen.getByTitle('Edit task');
            fireEvent.click(editButton);

            const input = screen.getByDisplayValue('Task 1');
            fireEvent.change(input, { target: { value: 'Updated Task' } });
            fireEvent.blur(input);

            await waitFor(() => {
                expect(updateTask).toHaveBeenCalledWith('1', { title: 'Updated Task' });
            });

            // Delete task
            const deleteTask = mockUseTasks.deleteTask;
            deleteTask.mockResolvedValue(true);

            const taskItem2 = screen.getByText('Task 2');
            fireEvent.mouseEnter(taskItem2);

            const deleteButton = screen.getByTitle('Delete task');
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(deleteTask).toHaveBeenCalledWith('2');
            });
        });

        it('toggles task completion', async () => {
            const toggleTask = mockUseTasks.toggleTask;
            toggleTask.mockResolvedValue({ id: '1', status: 'completed' });

            render(<TaskList { ...mockUseTasks } />);

            const checkbox = screen.getAllByRole('button')[0];
            fireEvent.click(checkbox);

            await waitFor(() => {
                expect(toggleTask).toHaveBeenCalledWith('1');
            });
        });

        it('filters and sorts tasks', async () => {
            render(<TaskList { ...mockUseTasks } />);

            // Filter by status
            const filterButton = screen.getByText('Filters');
            fireEvent.click(filterButton);

            const statusSelect = screen.getByDisplayValue('All statuses');
            fireEvent.change(statusSelect, { target: { value: 'needsAction' } });

            await waitFor(() => {
                expect(screen.getByText('Task 1')).toBeInTheDocument();
                expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
            });

            // Sort by priority
            const sortButton = screen.getByText('Sort');
            fireEvent.click(sortButton);

            const priorityOption = screen.getByText('Priority (High to Low)');
            fireEvent.click(priorityOption);

            await waitFor(() => {
                const taskItems = screen.getAllByTestId('task-item');
                expect(taskItems[0]).toHaveTextContent('Task 1'); // High priority
                expect(taskItems[1]).toHaveTextContent('Task 2'); // Normal priority
            });
        });
    });

    describe('Task Detail Overlay Workflow', () => {
        it('opens, edits, and closes task detail overlay', async () => {
            const updateTask = mockUseTasks.updateTask;
            updateTask.mockResolvedValue({ id: '1', title: 'Updated Task' });

            render(<TaskDetailOverlay { ...mockUseTasks } />);

            // Open overlay
            expect(screen.getByText('Task Details')).toBeInTheDocument();
            expect(screen.getByText('Task 1')).toBeInTheDocument();

            // Edit task
            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);

            const titleInput = screen.getByDisplayValue('Task 1');
            fireEvent.change(titleInput, { target: { value: 'Updated Task' } });

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(updateTask).toHaveBeenCalledWith('1', expect.objectContaining({
                    title: 'Updated Task'
                }));
            });

            // Close overlay
            const closeButton = screen.getByRole('button', { name: /close/i });
            fireEvent.click(closeButton);

            expect(mockUseTasks.onClose).toHaveBeenCalled();
        });

        it('manages subtasks in overlay', async () => {
            const createSubtask = jest.fn();
            const updateSubtask = jest.fn();
            const deleteSubtask = jest.fn();

            render(
                <TaskDetailOverlay 
          { ...mockUseTasks } 
          onSubtaskCreate = { createSubtask }
          onSubtaskUpdate = { updateSubtask }
          onSubtaskDelete = { deleteSubtask }
                />
      );

            // Create subtask
            const addButton = screen.getByText('Add subtask');
            fireEvent.click(addButton);

            const input = screen.getByPlaceholderText('Enter subtask title');
            fireEvent.change(input, { target: { value: 'New Subtask' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            await waitFor(() => {
                expect(createSubtask).toHaveBeenCalledWith({
                    title: 'New Subtask',
                    status: 'needsAction',
                    position: 0
                });
            });
        });
    });

    describe('Quick Add Field Workflow', () => {
        it('creates task with quick add', async () => {
            const createTask = mockUseTasks.createTask;
            createTask.mockResolvedValue({ id: '3', title: 'Quick Task' });

            render(<QuickAddField onTaskCreate={ createTask } />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.change(input, { target: { value: 'Quick Task' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            await waitFor(() => {
                expect(createTask).toHaveBeenCalledWith({
                    title: 'Quick Task',
                    status: 'needsAction',
                    priority: 'normal'
                });
            });
        });

        it('expands to full editor and creates task', async () => {
            const createTask = mockUseTasks.createTask;
            createTask.mockResolvedValue({ id: '3', title: 'Full Task' });

            render(<QuickAddField onTaskCreate={ createTask } />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.focus(input);

            // Fill in all fields
            fireEvent.change(screen.getByLabelText('Task Title *'), { target: { value: 'Full Task' } });
            fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Full Description' } });
            fireEvent.change(screen.getByLabelText('Due Date'), { target: { value: '2024-12-25' } });
            fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'high' } });

            // Add labels
            const labelInput = screen.getByPlaceholderText('Add a label and press Enter');
            fireEvent.change(labelInput, { target: { value: 'work' } });
            fireEvent.keyDown(labelInput, { key: 'Enter' });

            const createButton = screen.getByText('Create Task');
            fireEvent.click(createButton);

            await waitFor(() => {
                expect(createTask).toHaveBeenCalledWith({
                    title: 'Full Task',
                    description: 'Full Description',
                    due: new Date('2024-12-25'),
                    priority: 'high',
                    labels: ['work'],
                    status: 'needsAction'
                });
            });
        });
    });

    describe('Sync Integration', () => {
        it('syncs tasks after changes', async () => {
            const sync = mockUseSync.sync;
            sync.mockResolvedValue({});

            render(<TaskList { ...mockUseTasks } />);

            // Create task
            const createTask = mockUseTasks.createTask;
            createTask.mockResolvedValue({ id: '3', title: 'New Task' });

            const quickAdd = screen.getByPlaceholderText('Add a new task...');
            fireEvent.change(quickAdd, { target: { value: 'New Task' } });
            fireEvent.keyDown(quickAdd, { key: 'Enter' });

            await waitFor(() => {
                expect(createTask).toHaveBeenCalled();
                expect(sync).toHaveBeenCalled();
            });
        });

        it('handles sync errors gracefully', async () => {
            const sync = mockUseSync.sync;
            sync.mockRejectedValue(new Error('Sync failed'));

            render(<TaskList { ...mockUseTasks } />);

            // Create task
            const createTask = mockUseTasks.createTask;
            createTask.mockResolvedValue({ id: '3', title: 'New Task' });

            const quickAdd = screen.getByPlaceholderText('Add a new task...');
            fireEvent.change(quickAdd, { target: { value: 'New Task' } });
            fireEvent.keyDown(quickAdd, { key: 'Enter' });

            await waitFor(() => {
                expect(createTask).toHaveBeenCalled();
                expect(sync).toHaveBeenCalled();
            });
        });

        it('processes offline queue when coming online', async () => {
            const processQueue = mockUseSync.processQueue;
            processQueue.mockResolvedValue({});

            render(<TaskList { ...mockUseTasks } />);

            // Simulate coming online
            window.dispatchEvent(new Event('online'));

            await waitFor(() => {
                expect(processQueue).toHaveBeenCalled();
            });
        });
    });

    describe('Google Tasks Integration', () => {
        it('connects to Google Tasks', async () => {
            const connect = mockUseGoogleTasks.connect;
            connect.mockResolvedValue({});

            render(<TaskList { ...mockUseTasks } />);

            const connectButton = screen.getByText('Connect Google Tasks');
            fireEvent.click(connectButton);

            await waitFor(() => {
                expect(connect).toHaveBeenCalled();
            });
        });

        it('disconnects from Google Tasks', async () => {
            const disconnect = mockUseGoogleTasks.disconnect;
            disconnect.mockResolvedValue({});

            render(<TaskList { ...mockUseTasks } />);

            const disconnectButton = screen.getByText('Disconnect Google Tasks');
            fireEvent.click(disconnectButton);

            await waitFor(() => {
                expect(disconnect).toHaveBeenCalled();
            });
        });

        it('shows auth prompt when not connected', () => {
            (useGoogleTasks as jest.Mock).mockReturnValue({
                ...mockUseGoogleTasks,
                isConnected: false
            });

            render(<TaskList { ...mockUseTasks } />);

            expect(screen.getByText('Connect Google Tasks')).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('handles task creation errors', async () => {
            const createTask = mockUseTasks.createTask;
            createTask.mockRejectedValue(new Error('Creation failed'));

            render(<TaskList { ...mockUseTasks } />);

            const quickAdd = screen.getByPlaceholderText('Add a new task...');
            fireEvent.change(quickAdd, { target: { value: 'New Task' } });
            fireEvent.keyDown(quickAdd, { key: 'Enter' });

            await waitFor(() => {
                expect(createTask).toHaveBeenCalled();
            });
        });

        it('handles task update errors', async () => {
            const updateTask = mockUseTasks.updateTask;
            updateTask.mockRejectedValue(new Error('Update failed'));

            render(<TaskList { ...mockUseTasks } />);

            const taskItem = screen.getByText('Task 1');
            fireEvent.mouseEnter(taskItem);

            const editButton = screen.getByTitle('Edit task');
            fireEvent.click(editButton);

            const input = screen.getByDisplayValue('Task 1');
            fireEvent.change(input, { target: { value: 'Updated Task' } });
            fireEvent.blur(input);

            await waitFor(() => {
                expect(updateTask).toHaveBeenCalled();
            });
        });

        it('handles task deletion errors', async () => {
            const deleteTask = mockUseTasks.deleteTask;
            deleteTask.mockRejectedValue(new Error('Deletion failed'));

            render(<TaskList { ...mockUseTasks } />);

            const taskItem = screen.getByText('Task 1');
            fireEvent.mouseEnter(taskItem);

            const deleteButton = screen.getByTitle('Delete task');
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(deleteTask).toHaveBeenCalled();
            });
        });
    });

    describe('Performance', () => {
        it('handles large task lists efficiently', () => {
            const manyTasks = Array.from({ length: 1000 }, (_, i) => ({
                ...mockTasks[0],
                id: `task-${i}`,
                title: `Task ${i}`
            }));

            const startTime = performance.now();

            render(<TaskList { ...mockUseTasks } tasks = { manyTasks } />);

            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(1000); // Should render in < 1s
        });

        it('handles rapid user interactions', async () => {
            const createTask = mockUseTasks.createTask;
            createTask.mockResolvedValue({ id: '3', title: 'New Task' });

            render(<TaskList { ...mockUseTasks } />);

            const startTime = performance.now();

            // Rapid interactions
            for (let i = 0; i < 100; i++) {
                const quickAdd = screen.getByPlaceholderText('Add a new task...');
                fireEvent.change(quickAdd, { target: { value: `Task ${i}` } });
                fireEvent.keyDown(quickAdd, { key: 'Enter' });
            }

            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(1000); // Should handle in < 1s
        });
    });

    describe('Accessibility', () => {
        it('supports keyboard navigation', () => {
            render(<TaskList { ...mockUseTasks } />);

            const taskItem = screen.getByText('Task 1');
            fireEvent.keyDown(taskItem, { key: 'Enter' });

            expect(mockUseTasks.onTaskClick).toHaveBeenCalledWith(mockTasks[0]);
        });

        it('announces changes to screen readers', () => {
            render(<TaskList { ...mockUseTasks } />);

            const statusRegion = screen.getByRole('status');
            expect(statusRegion).toBeInTheDocument();
        });

        it('has proper ARIA labels', () => {
            render(<TaskList { ...mockUseTasks } />);

            expect(screen.getByRole('list')).toBeInTheDocument();
            expect(screen.getAllByRole('listitem')).toHaveLength(2);
        });
    });
});
