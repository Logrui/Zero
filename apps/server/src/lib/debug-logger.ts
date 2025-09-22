// Safe debug logger that avoids environment variable issues in workflows
export const logDebug = (message: string) => {
  try {
    // Use a simple console.log with a prefix for now to avoid env issues
    console.log(`[EMAIL_SYNC_DEBUG] ${message}`);
  } catch {
    // Silently fail to prevent crashes
  }
};

// Alternative logger that takes env as parameter to avoid global access issues
export const logDebugWithEnv = (message: string, debugEnabled?: boolean) => {
  try {
    if (debugEnabled) {
      console.log(`[EMAIL_SYNC_DEBUG] ${message}`);
    }
  } catch {
    // Silently fail to prevent crashes
  }
};
