import { createAuthClient } from 'better-auth/client';

const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_PUBLIC_BACKEND_URL,
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [],
});

export const authProxy = {
  api: {
    getSession: async ({ headers }: { headers: Headers }) => {
      try {
        const session = await authClient.getSession({
          fetchOptions: { headers, credentials: 'include' },
        });
        if (session.error) {
          console.error(`Failed to get session: ${session.error}`, session);
          return null;
        }
        return session.data;
      } catch (error) {
        // Log and swallow all errors to prevent upstream failures
        console.error('Auth proxy getSession failed:', error);
        return null;
      }
    },
  },
};
