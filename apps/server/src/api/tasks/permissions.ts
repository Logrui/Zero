import { Context } from 'hono';
import { PermissionCheckService } from '../../services/permissionCheckService';

/**
 * Check if user has required Google Tasks permissions
 */
export async function checkPermissions(c: Context) {
    try {
        const userId = c.get('sessionUser')?.id;
        if (!userId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const result = await PermissionCheckService.checkUserPermissions(userId);
        
        return c.json({
            hasRequiredPermissions: result.hasRequiredPermissions,
            missingScopes: result.missingScopes,
            needsReauth: result.needsReauth
        });
    } catch (error) {
        console.error('Error checking permissions:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
}

/**
 * Get re-authentication URL for Google Tasks
 */
export async function getReauthUrl(c: Context) {
    try {
        const userId = c.get('sessionUser')?.id;
        if (!userId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const reauthUrl = await PermissionCheckService.getReauthUrl(userId);
        
        return c.json({
            reauthUrl,
            message: 'Please re-authenticate to grant Google Tasks permissions'
        });
    } catch (error) {
        console.error('Error getting reauth URL:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
}
