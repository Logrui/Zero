/**
 * React 19 TypeScript Compatibility Fixes
 * Addresses specific type issues with React 19 and modern TypeScript
 */

declare module 'react' {
    // Ensure all React hooks are available
    export function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
    export function useState<S = undefined>(): [S | undefined, React.Dispatch<React.SetStateAction<S | undefined>>];
    export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
    export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T;
    export function useMemo<T>(factory: () => T, deps: React.DependencyList | undefined): T;

    namespace JSX {
        // Fix for React 19 JSX component type issues
        type ElementType =
            | keyof JSX.IntrinsicElements
            | React.ComponentType<any>
            | React.ForwardRefExoticComponent<any>
            | ((...args: any[]) => React.ReactNode | Promise<React.ReactNode>);
    }

    // Fix for React 19 ForwardRefExoticComponent type issues
    namespace React {
        interface ForwardRefExoticComponent<P> extends React.NamedExoticComponent<P> {
            (props: P): React.ReactNode | null;
        }
    }
}
