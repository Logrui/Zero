/**
 * Quick Add Field Component Tests
 * 
 * Tests for QuickAddField component with expansion and task creation.
 * Covers quick add functionality and form interactions.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QuickAddField } from '../../app/tasks/components/QuickAddField';

// Mock props
const defaultProps = {
    onTaskCreate: jest.fn(),
    placeholder: 'Add a new task...',
    autoFocus: false
};

describe('QuickAddField', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders input field with placeholder', () => {
            render(<QuickAddField {...defaultProps} />);

            expect(screen.getByPlaceholderText('Add a new task...')).toBeInTheDocument();
        });

        it('renders with custom placeholder', () => {
            render(<QuickAddField {...defaultProps} placeholder="Custom placeholder" />);

            expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
        });

        it('auto-focuses when autoFocus is true', () => {
            render(<QuickAddField {...defaultProps} autoFocus={true} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            expect(input).toHaveFocus();
        });

        it('shows add icon', () => {
            render(<QuickAddField {...defaultProps} />);

            expect(screen.getByTestId('add-icon')).toBeInTheDocument();
        });
    });

    describe('Quick Add Functionality', () => {
        it('creates task on Enter key press', async () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.change(input, { target: { value: 'New Task' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            await waitFor(() => {
                expect(defaultProps.onTaskCreate).toHaveBeenCalledWith({
                    title: 'New Task',
                    status: 'needsAction',
                    priority: 'normal'
                });
            });
        });

        it('does not create task with empty title', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.change(input, { target: { value: '' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(defaultProps.onTaskCreate).not.toHaveBeenCalled();
        });

        it('does not create task with whitespace only title', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.change(input, { target: { value: '   ' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(defaultProps.onTaskCreate).not.toHaveBeenCalled();
        });

        it('trims whitespace from title', async () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.change(input, { target: { value: '  New Task  ' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            await waitFor(() => {
                expect(defaultProps.onTaskCreate).toHaveBeenCalledWith({
                    title: 'New Task',
                    status: 'needsAction',
                    priority: 'normal'
                });
            });
        });

        it('clears input after task creation', async () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.change(input, { target: { value: 'New Task' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            await waitFor(() => {
                expect(input).toHaveValue('');
            });
        });
    });

    describe('Expansion to Full Editor', () => {
        it('expands on focus', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.focus(input);

            expect(screen.getByText('Task Title *')).toBeInTheDocument();
            expect(screen.getByText('Description')).toBeInTheDocument();
            expect(screen.getByText('Due Date')).toBeInTheDocument();
            expect(screen.getByText('Priority')).toBeInTheDocument();
            expect(screen.getByText('Labels')).toBeInTheDocument();
        });

        it('shows expanded form fields', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.focus(input);

            expect(screen.getByLabelText('Task Title *')).toBeInTheDocument();
            expect(screen.getByLabelText('Description')).toBeInTheDocument();
            expect(screen.getByLabelText('Due Date')).toBeInTheDocument();
            expect(screen.getByLabelText('Priority')).toBeInTheDocument();
            expect(screen.getByLabelText('Labels')).toBeInTheDocument();
        });

        it('collapses on click outside', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.focus(input);

            expect(screen.getByText('Task Title *')).toBeInTheDocument();

            fireEvent.mouseDown(document.body);

            expect(screen.queryByText('Task Title *')).not.toBeInTheDocument();
        });
    });

    describe('Full Editor Functionality', () => {
        it('creates task with all fields', async () => {
            render(<QuickAddField {...defaultProps} />);

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

            fireEvent.change(labelInput, { target: { value: 'urgent' } });
            fireEvent.keyDown(labelInput, { key: 'Enter' });

            const createButton = screen.getByText('Create Task');
            fireEvent.click(createButton);

            await waitFor(() => {
                expect(defaultProps.onTaskCreate).toHaveBeenCalledWith({
                    title: 'Full Task',
                    description: 'Full Description',
                    due: new Date('2024-12-25'),
                    priority: 'high',
                    labels: ['work', 'urgent'],
                    status: 'needsAction'
                });
            });
        });

        it('validates required fields', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.focus(input);

            const createButton = screen.getByText('Create Task');
            expect(createButton).toBeDisabled();
        });

        it('enables create button when title is provided', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.focus(input);

            fireEvent.change(screen.getByLabelText('Task Title *'), { target: { value: 'Test Task' } });

            const createButton = screen.getByText('Create Task');
            expect(createButton).not.toBeDisabled();
        });

        it('cancels creation on cancel button click', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.focus(input);

            fireEvent.change(screen.getByLabelText('Task Title *'), { target: { value: 'Test Task' } });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(screen.queryByText('Task Title *')).not.toBeInTheDocument();
            expect(defaultProps.onTaskCreate).not.toHaveBeenCalled();
        });
    });

    describe('Label Management', () => {
        it('adds labels on Enter key press', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.focus(input);

            const labelInput = screen.getByPlaceholderText('Add a label and press Enter');
            fireEvent.change(labelInput, { target: { value: 'work' } });
            fireEvent.keyDown(labelInput, { key: 'Enter' });

            expect(screen.getByText('work')).toBeInTheDocument();
        });

        it('removes labels on remove button click', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.focus(input);

            const labelInput = screen.getByPlaceholderText('Add a label and press Enter');
            fireEvent.change(labelInput, { target: { value: 'work' } });
            fireEvent.keyDown(labelInput, { key: 'Enter' });

            expect(screen.getByText('work')).toBeInTheDocument();

            const removeButton = screen.getByTitle('Remove work');
            fireEvent.click(removeButton);

            expect(screen.queryByText('work')).not.toBeInTheDocument();
        });

        it('does not add duplicate labels', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.focus(input);

            const labelInput = screen.getByPlaceholderText('Add a label and press Enter');
            fireEvent.change(labelInput, { target: { value: 'work' } });
            fireEvent.keyDown(labelInput, { key: 'Enter' });

            fireEvent.change(labelInput, { target: { value: 'work' } });
            fireEvent.keyDown(labelInput, { key: 'Enter' });

            const labels = screen.getAllByText('work');
            expect(labels).toHaveLength(1);
        });

        it('trims whitespace from labels', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.focus(input);

            const labelInput = screen.getByPlaceholderText('Add a label and press Enter');
            fireEvent.change(labelInput, { target: { value: '  work  ' } });
            fireEvent.keyDown(labelInput, { key: 'Enter' });

            expect(screen.getByText('work')).toBeInTheDocument();
        });
    });

    describe('Keyboard Shortcuts', () => {
        it('handles Escape key to cancel', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.focus(input);

            fireEvent.keyDown(input, { key: 'Escape' });

            expect(screen.queryByText('Task Title *')).not.toBeInTheDocument();
        });

        it('handles Escape key in expanded mode', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.focus(input);

            fireEvent.keyDown(input, { key: 'Escape' });

            expect(screen.queryByText('Task Title *')).not.toBeInTheDocument();
        });
    });

    describe('Loading States', () => {
        it('shows loading state during task creation', async () => {
            const mockOnTaskCreate = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
            render(<QuickAddField {...defaultProps} onTaskCreate={mockOnTaskCreate} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.change(input, { target: { value: 'New Task' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(screen.getByText('Creating...')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByText('Creating...')).not.toBeInTheDocument();
            });
        });

        it('disables input during creation', async () => {
            const mockOnTaskCreate = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
            render(<QuickAddField {...defaultProps} onTaskCreate={mockOnTaskCreate} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.change(input, { target: { value: 'New Task' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(input).toBeDisabled();

            await waitFor(() => {
                expect(input).not.toBeDisabled();
            });
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            expect(input).toHaveAttribute('aria-label');
        });

        it('supports keyboard navigation', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.keyDown(input, { key: 'Tab' });

            // Focus should move to next focusable element
            expect(document.activeElement).not.toBe(input);
        });

        it('announces task creation', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');
            fireEvent.change(input, { target: { value: 'New Task' } });
            fireEvent.keyDown(input, { key: 'Enter' });

            const statusRegion = screen.getByRole('status');
            expect(statusRegion).toBeInTheDocument();
        });
    });

    describe('Performance', () => {
        it('renders efficiently', () => {
            const startTime = performance.now();

            render(<QuickAddField {...defaultProps} />);

            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(10); // Should render in < 10ms
        });

        it('handles rapid input changes', () => {
            render(<QuickAddField {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add a new task...');

            const startTime = performance.now();

            // Rapid input changes
            for (let i = 0; i < 100; i++) {
                fireEvent.change(input, { target: { value: `Task ${i}` } });
            }

            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(50); // Should handle in < 50ms
        });
    });
});
