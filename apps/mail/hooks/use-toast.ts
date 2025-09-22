// Temporary shim for useToast for the calendar module until app-level toast is integrated
export function useToast() {
  return {
    toast: ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
      // eslint-disable-next-line no-console
      console[variant === 'destructive' ? 'error' : 'log'](`[Toast] ${title}${description ? `: ${description}` : ''}`)
    },
  } as const
}
