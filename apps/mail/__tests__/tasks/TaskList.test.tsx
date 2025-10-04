/**
 * Task List Component Tests
 * 
 * Tests for TaskList component with virtual scrolling and sorting.
 * Covers filtering, sorting, and task interactions.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { TaskList } from '../../app/tasks/components/TaskList';
import type { TaskFilters, TaskWithRelations } from '../../app/tasks/types/task';

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
    },
    {
        id: '3',
        googleTaskId: 'google-3',
        userId: 'user-1',
        title: 'Task 3',
        description: 'Description 3',
        status: 'needsAction',
        due: new Date('2024-12-30'),
        priority: 'low',
        notes: 'Notes 3',
        labels: ['work'],
        createdAt: new Date('2024-12-17'),
        updatedAt: new Date('2024-12-17'),
        subtasks: [],
        zeroosExtension: null,
        syncState: null,
        changes: []
    }
];

// Mock props
const defaultProps = {
    tasks: mockTasks,
    loading: false,
    error: null,
    onTaskClick: jest.fn(),
    onTaskCreate: jest.fn(),
    onTaskUpdate: jest.fn(),
    onTaskDelete: jest.fn(),
    onTaskToggle: jest.fn(),
    filters: {},
    onFiltersChange: jest.fn()
};

describe('TaskList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders task list with tasks', () => {
            render(<TaskList {...defaultProps} />);

            expect(screen.getByText('Task 1')).toBeInTheDocument();
            expect(screen.getByText('Task 2')).toBeInTheDocument();
            expect(screen.getByText('Task 3')).toBeInTheDocument();
        });

        it('renders loading state', () => {
            render(<TaskList {...defaultProps} loading={true} />);

            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('renders error state', () => {
            const errorMessage = 'Failed to load tasks';
            render(<TaskList {...defaultProps} error={errorMessage} />);

            expect(screen.getByText('Error loading tasks')).toBeInTheDocument();
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });

        it('renders empty state when no tasks', () => {
            render(<TaskList {...defaultProps} tasks={[]} />);

            expect(screen.getByText('No tasks found')).toBeInTheDocument();
        });

        it('renders empty state with filters applied', () => {
            const filters: TaskFilters = { status: 'completed' };
            render(<TaskList {...defaultProps} tasks={[]} filters={filters} />);

            expect(screen.getByText('No tasks found')).toBeInTheDocument();
            expect(screen.getByText('Try adjusting your filters to see more tasks.')).toBeInTheDocument();
        });
    });

    describe('Filtering', () => {
        it('filters tasks by status', () => {
            const filters: TaskFilters = { status: 'needsAction' };
            render(<TaskList {...defaultProps} filters={filters} />);

            expect(screen.getByText('Task 1')).toBeInTheDocument();
            expect(screen.getByText('Task 3')).toBeInTheDocument();
            expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
        });

        it('filters tasks by priority', () => {
            const filters: TaskFilters = { priority: 'high' };
            render(<TaskList {...defaultProps} filters={filters} />);

            expect(screen.getByText('Task 1')).toBeInTheDocument();
            expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
            expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
        });

        it('filters tasks by labels', () => {
            const filters: TaskFilters = { labels: ['work'] };
            render(<TaskList {...defaultProps} filters={filters} />);

            expect(screen.getByText('Task 1')).toBeInTheDocument();
            expect(screen.getByText('Task 3')).toBeInTheDocument();
            expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
        });

        it('filters tasks by search query', () => {
            const filters: TaskFilters = { search: 'Task 1' };
            render(<TaskList {...defaultProps} filters={filters} />);

            expect(screen.getByText('Task 1')).toBeInTheDocument();
            expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
            expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
        });

        it('filters tasks by due date range', () => {
            const filters: TaskFilters = {
                dueAfter: new Date('2024-12-19'),
                dueBefore: new Date('2024-12-26')
            };
            render(<TaskList {...defaultProps} filters={filters} />);

            expect(screen.getByText('Task 1')).toBeInTheDocument();
            expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
            expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
        });
    });

    describe('Sorting', () => {
        it('sorts tasks by due date ascending', () => {
            render(<TaskList {...defaultProps} />);

            const taskItems = screen.getAllByTestId('task-item');
            expect(taskItems[0]).toHaveTextContent('Task 2'); // Due 2024-12-20
            expect(taskItems[1]).toHaveTextContent('Task 1'); // Due 2024-12-25
            expect(taskItems[2]).toHaveTextContent('Task 3'); // Due 2024-12-30
        });

        it('sorts tasks by priority descending', () => {
            const { rerender } = render(<TaskList {...defaultProps} />);

            // Change sort to priority descending
            const sortButton = screen.getByText('Sort');
            fireEvent.click(sortButton);

            const priorityOption = screen.getByText('Priority (High to Low)');
            fireEvent.click(priorityOption);

            rerender(<TaskList {...defaultProps} />);

            const taskItems = screen.getAllByTestId('task-item');
            expect(taskItems[0]).toHaveTextContent('Task 1'); // High priority
            expect(taskItems[1]).toHaveTextContent('Task 2'); // Normal priority
            expect(taskItems[2]).toHaveTextContent('Task 3'); // Low priority
        });

        it('sorts tasks by title ascending', () => {
            const { rerender } = render(<TaskList {...defaultProps} />);

            // Change sort to title ascending
            const sortButton = screen.getByText('Sort');
            fireEvent.click(sortButton);

            const titleOption = screen.getByText('Title');
            fireEvent.click(titleOption);

            rerender(<TaskList {...defaultProps} />);

            const taskItems = screen.getAllByTestId('task-item');
            expect(taskItems[0]).toHaveTextContent('Task 1');
            expect(taskItems[1]).toHaveTextContent('Task 2');
            expect(taskItems[2]).toHaveTextContent('Task 3');
        });
    });

    describe('Task Interactions', () => {
        it('handles task click', () => {
            render(<TaskList {...defaultProps} />);

            const taskItem = screen.getByText('Task 1');
            fireEvent.click(taskItem);

            expect(defaultProps.onTaskClick).toHaveBeenCalledWith(mockTasks[0]);
        });

        it('handles task toggle', () => {
            render(<TaskList {...defaultProps} />);

            const toggleButton = screen.getAllByRole('button')[0]; // First checkbox
            fireEvent.click(toggleButton);

            expect(defaultProps.onTaskToggle).toHaveBeenCalledWith('1');
        });

        it('handles task edit', () => {
            render(<TaskList {...defaultProps} />);

            const taskItem = screen.getByText('Task 1');
            fireEvent.mouseEnter(taskItem);

            const editButton = screen.getByTitle('Edit task');
            fireEvent.click(editButton);

            expect(defaultProps.onTaskUpdate).toHaveBeenCalled();
        });

        it('handles task delete', () => {
            render(<TaskList {...defaultProps} />);

            const taskItem = screen.getByText('Task 1');
            fireEvent.mouseEnter(taskItem);

            const deleteButton = screen.getByTitle('Delete task');
            fireEvent.click(deleteButton);

            expect(defaultProps.onTaskDelete).toHaveBeenCalledWith('1');
        });
    });

    describe('Virtual Scrolling', () => {
        it('renders only visible items', () => {
            const manyTasks = Array.from({ length: 100 }, (_, i) => ({
                ...mockTasks[0],
                id: `task-${i}`,
                title: `Task ${i}`
            }));

            render(<TaskList {...defaultProps} tasks={manyTasks} />);

            // Should only render visible items plus buffer
            const taskItems = screen.getAllByTestId('task-item');
            expect(taskItems.length).toBeLessThan(100);
        });

        it('handles scroll events', () => {
            render(<TaskList {...defaultProps} />);

            const scrollContainer = screen.getByTestId('scroll-container');
            fireEvent.scroll(scrollContainer, { target: { scrollTop: 100 } });

            // Should update visible items
            expect(scrollContainer).toHaveProperty('scrollTop', 100);
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels', () => {
            render(<TaskList {...defaultProps} />);

            expect(screen.getByRole('list')).toBeInTheDocument();
            expect(screen.getAllByRole('listitem')).toHaveLength(3);
        });

        it('supports keyboard navigation', () => {
            render(<TaskList {...defaultProps} />);

            const taskItem = screen.getByText('Task 1');
            fireEvent.keyDown(taskItem, { key: 'Enter' });

            expect(defaultProps.onTaskClick).toHaveBeenCalledWith(mockTasks[0]);
        });

        it('announces changes to screen readers', () => {
            render(<TaskList {...defaultProps} />);

            const statusRegion = screen.getByRole('status');
            expect(statusRegion).toBeInTheDocument();
        });
    });

    describe('Performance', () => {
        it('renders large lists efficiently', () => {
            const startTime = performance.now();

            const manyTasks = Array.from({ length: 1000 }, (_, i) => ({
                ...mockTasks[0],
                id: `task-${i}`,
                title: `Task ${i}`
            }));

            render(<TaskList {...defaultProps} tasks={manyTasks} />);

            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(100); // Should render in < 100ms
        });

        it('handles rapid filter changes', () => {
            const { rerender } = render(<TaskList {...defaultProps} />);

            const startTime = performance.now();

            // Rapid filter changes
            for (let i = 0; i < 10; i++) {
                rerender(<TaskList {...defaultProps} filters={{ status: i % 2 === 0 ? 'needsAction' : 'completed' }} />);
            }

            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(50); // Should handle in < 50ms
        });
    });
});
