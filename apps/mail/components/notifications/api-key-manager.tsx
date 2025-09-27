/**
 * ApiKeyManager Component (T043)
 * 
 * API key management interface for Zero OS notifications system.
 * Features:
 * - Create new API keys with custom names and descriptions
 * - Display existing API keys with creation dates and usage info
 * - Revoke/delete API keys with confirmation
 * - Copy API keys to clipboard with security masking
 * - Rate limiting display and management
 * - Security features (key masking, secure deletion)
 * - Integration with Zero's theme and component system
 * 
 * Used by: Settings pages, Dashboard, Admin interfaces
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
// AlertDialog not available in Zero's UI kit, using regular Dialog
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Types
export interface ApiKey {
  id: string;
  name: string;
  description?: string;
  keyPrefix: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  usage: {
    totalRequests: number;
    thisMonth: number;
  };
}

export interface ApiKeyManagerProps {
  // Data
  apiKeys: ApiKey[];
  isLoading?: boolean;
  
  // Actions
  onCreateKey: (data: { name: string; description?: string }) => Promise<{ key: string; id: string }>;
  onRevokeKey: (keyId: string) => Promise<void>;
  onUpdateKey?: (keyId: string, data: { name?: string; description?: string }) => Promise<void>;
  
  // Display options
  variant?: 'default' | 'compact';
  showUsageStats?: boolean;
  allowKeyCreation?: boolean;
  
  className?: string;
}

export const ApiKeyManager = React.forwardRef<
  HTMLDivElement,
  ApiKeyManagerProps
>(({ 
  apiKeys = [],
  isLoading = false,
  onCreateKey,
  onRevokeKey,
  onUpdateKey,
  variant = 'default',
  showUsageStats = true,
  allowKeyCreation = true,
  className,
  ...props 
}, ref) => {
  // State for UI interactions
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState<string | null>(null);
  const [maskedKeys, setMaskedKeys] = React.useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  
  // Form state for key creation
  const [createForm, setCreateForm] = React.useState({
    name: '',
    description: ''
  });
  
  // Form validation
  const isCreateFormValid = createForm.name.trim().length >= 3;
  
  // Helper functions
  const maskApiKey = React.useCallback((keyPrefix: string) => {
    if (maskedKeys.has(keyPrefix)) {
      return keyPrefix;
    }
    return keyPrefix.slice(0, 8) + '••••••••••••••••';
  }, [maskedKeys]);
  
  const toggleKeyVisibility = React.useCallback((keyPrefix: string) => {
    setMaskedKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyPrefix)) {
        newSet.delete(keyPrefix);
      } else {
        newSet.add(keyPrefix);
      }
      return newSet;
    });
  }, []);
  
  const copyToClipboard = React.useCallback(async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      toast.success('API key copied to clipboard');
      
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  }, []);
  
  const handleCreateKey = React.useCallback(async () => {
    if (!isCreateFormValid) return;
    
    try {
      const result = await onCreateKey({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined
      });
      
      toast.success('API key created successfully');
      
      // Show the new key temporarily
      setMaskedKeys(prev => new Set([...prev, result.key]));
      
      // Reset form and close dialog
      setCreateForm({ name: '', description: '' });
      setCreateDialogOpen(false);
      
    } catch (error) {
      toast.error('Failed to create API key');
    }
  }, [createForm, isCreateFormValid, onCreateKey]);
  
  const handleRevokeKey = React.useCallback(async (keyId: string) => {
    try {
      await onRevokeKey(keyId);
      toast.success('API key revoked successfully');
      setDeleteDialogOpen(null);
    } catch (error) {
      toast.error('Failed to revoke API key');
    }
  }, [onRevokeKey]);
  
  // Render key card
  const renderKeyCard = (apiKey: ApiKey) => (
    <Card 
      key={apiKey.id}
      className={cn(
        'relative group',
        !apiKey.isActive && 'opacity-60 bg-muted/20'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">
              {apiKey.name}
            </CardTitle>
            
            {apiKey.description && (
              <p className="text-sm text-muted-foreground">
                {apiKey.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={apiKey.isActive ? "default" : "secondary"}
              className="text-xs"
            >
              {apiKey.isActive ? 'Active' : 'Revoked'}
            </Badge>
            
            {/* Expiry warning */}
            {apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date() && (
              <Badge variant="destructive" className="text-xs">
                Expired
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* API Key display */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">API Key</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
              {maskApiKey(apiKey.keyPrefix)}
            </code>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleKeyVisibility(apiKey.keyPrefix)}
              className="h-8 w-8 p-0"
              title={maskedKeys.has(apiKey.keyPrefix) ? 'Hide key' : 'Show key'}
            >
              {/* Eye/EyeOff icon would go here */}
              {maskedKeys.has(apiKey.keyPrefix) ? '👁️' : '🙈'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(apiKey.keyPrefix, apiKey.id)}
              className="h-8 w-8 p-0"
              title="Copy to clipboard"
            >
              {copiedKey === apiKey.id ? '✓' : '📋'}
            </Button>
          </div>
        </div>
        
        {/* Usage stats */}
        {showUsageStats && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Total Requests</Label>
              <p className="font-medium">{apiKey.usage.totalRequests.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">This Month</Label>
              <p className="font-medium">{apiKey.usage.thisMonth.toLocaleString()}</p>
            </div>
          </div>
        )}
        
        {/* Rate limits */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Rate Limits</Label>
          <div className="flex items-center gap-4 text-sm">
            <span>{apiKey.rateLimit.requestsPerMinute}/min</span>
            <span>{apiKey.rateLimit.requestsPerHour}/hour</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Metadata */}
        <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Created:</span>
            <span>{format(new Date(apiKey.createdAt), 'MMM d, yyyy')}</span>
          </div>
          
          {apiKey.lastUsedAt && (
            <div className="flex justify-between">
              <span>Last used:</span>
              <span>{format(new Date(apiKey.lastUsedAt), 'MMM d, yyyy')}</span>
            </div>
          )}
          
          {apiKey.expiresAt && (
            <div className="flex justify-between">
              <span>Expires:</span>
              <span className={cn(
                new Date(apiKey.expiresAt) < new Date() && 'text-destructive'
              )}>
                {format(new Date(apiKey.expiresAt), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex items-center gap-2 w-full">
          {onUpdateKey && (
            <Button variant="outline" size="sm" className="flex-1">
              Edit
            </Button>
          )}
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(apiKey.id)}
            disabled={!apiKey.isActive}
            className="flex-1"
          >
            Revoke
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
  
  return (
    <div
      ref={ref}
      className={cn('space-y-6', className)}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground">
            Manage your API keys for accessing the notifications system
          </p>
        </div>
        
        {allowKeyCreation && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create API Key</Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="key-name">Name</Label>
                  <Input
                    id="key-name"
                    placeholder="My API Key"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      name: e.target.value 
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose a descriptive name for your API key
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="key-description">Description (Optional)</Label>
                  <Textarea
                    id="key-description"
                    placeholder="What will this key be used for?"
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      description: e.target.value 
                    }))}
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateKey}
                  disabled={!isCreateFormValid}
                >
                  Create Key
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {/* API Keys Grid */}
      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-8 bg-muted rounded"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-6 bg-muted rounded"></div>
                    <div className="h-6 bg-muted rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : apiKeys.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-3">
            <div className="text-4xl">🔑</div>
            <h3 className="text-lg font-medium">No API Keys</h3>
            <p className="text-muted-foreground">
              Create your first API key to start using the notifications API
            </p>
            
            {allowKeyCreation && (
              <Button
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                Create API Key
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className={cn(
          'grid gap-4',
          variant === 'compact' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'
        )}>
          {apiKeys.map(renderKeyCard)}
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog 
        open={!!deleteDialogOpen} 
        onOpenChange={(open: boolean) => !open && setDeleteDialogOpen(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to revoke this API key? This action cannot be undone.
              All applications using this key will immediately lose access to the API.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialogOpen && handleRevokeKey(deleteDialogOpen)}
            >
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

ApiKeyManager.displayName = 'ApiKeyManager';