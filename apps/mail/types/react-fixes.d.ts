/**
 * React 19 TypeScript Declarations
 * Fixes JSX component type issues with React 19 and modern TypeScript
 */

declare module 'react' {
    // Ensure all React hooks are available
    export function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
    export function useState<S = undefined>(): [S | undefined, React.Dispatch<React.SetStateAction<S | undefined>>];
    export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T;
    export function useMemo<T>(factory: () => T, deps: React.DependencyList | undefined): T;
    export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
    export function forwardRef<T, P = {}>(render: React.ForwardRefRenderFunction<T, P>): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<T>>;

    namespace JSX {
        interface IntrinsicElements {
            [elemName: string]: any;
        }

        // Fix for React 19 component type issues
        type ElementType =
            | keyof JSX.IntrinsicElements
            | React.ComponentType<any>
            | React.ForwardRefExoticComponent<any>
            | ((...args: any[]) => React.ReactNode | Promise<React.ReactNode>);
    }

    // Fix for ForwardRefExoticComponent type issues
    namespace React {
        interface ForwardRefRenderFunction<T, P = {}> {
            (props: P, ref: React.Ref<T>): React.ReactNode | null;
            displayName?: string | undefined;
        }

        interface ForwardRefExoticComponent<P> extends React.NamedExoticComponent<P> {
            (props: P): React.ReactNode | null;
        }

        interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
            target: EventTarget & T;
        }

        interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
            children?: ReactNode | undefined;
            className?: string | undefined;
            [key: string]: any;
        }
    }
}

// Fix for UI component props
declare module '@/components/ui/badge' {
    interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
        variant?: 'default' | 'secondary' | 'destructive' | 'outline';
        children?: React.ReactNode;
    }

    export const Badge: React.FC<BadgeProps>;
}

declare module 'lucide-react' {

    interface IconProps extends React.SVGProps<SVGSVGElement> {
        size?: number | string;
    }

    // Export all lucide icons as proper React components
    export const Bell: React.FC<IconProps>;
    export const Search: React.FC<IconProps>;
    export const Filter: React.FC<IconProps>;
    export const Trash2: React.FC<IconProps>;
    export const MoreHorizontal: React.FC<IconProps>;
    export const CheckSquare: React.FC<IconProps>;
    export const Square: React.FC<IconProps>;
    export const ArrowUp: React.FC<IconProps>;
    export const ArrowDown: React.FC<IconProps>;
    export const X: React.FC<IconProps>;
    export const Settings: React.FC<IconProps>;
    export const Eye: React.FC<IconProps>;
    export const EyeOff: React.FC<IconProps>;
    export const Clock: React.FC<IconProps>;
    export const User: React.FC<IconProps>;
    export const Tag: React.FC<IconProps>;
    export const ChevronDown: React.FC<IconProps>;
    export const ChevronUp: React.FC<IconProps>;
    export const Key: React.FC<IconProps>;
}

// Global type fixes for React Router
declare module 'react-router' {
    interface LinkProps {
        to: string;
        children?: React.ReactNode;
        className?: string;
    }

    export const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
}