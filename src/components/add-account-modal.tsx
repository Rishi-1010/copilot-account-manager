'use client';

import * as React from 'react';
import { IconPlus, IconEye, IconEyeOff } from '@tabler/icons-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateAccountInput } from '@/lib/db/types';

interface AddAccountModalProps {
  onAdd: (account: CreateAccountInput) => Promise<void>;
}

export function AddAccountModal({ onAdd }: AddAccountModalProps) {
  const [open, setOpen] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [showToken, setShowToken] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;

    setIsSubmitting(true);
    try {
      // Sanitize token: remove whitespace and non-ASCII characters
      const sanitizedToken = token.trim().replace(/[^\x00-\x7F]/g, '');
      
      // Validate token format
      if (!/^[a-zA-Z0-9_]+$/.test(sanitizedToken)) {
        toast.error('Invalid token format. Please paste only the token without any special characters.');
        setIsSubmitting(false);
        return;
      }

      // Validate token and fetch user data from our API route
      const validateResponse = await fetch('/api/github/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: sanitizedToken }),
      });

      if (!validateResponse.ok) {
        const errorData = await validateResponse.json();
        throw new Error(errorData.error || 'Invalid GitHub token or insufficient permissions');
      }

      const { login, avatarUrl, plan, accessTypeSku } = await validateResponse.json();

      // Create account input
      const accountInput: CreateAccountInput = {
        login,
        avatarUrl,
        plan,
        accessTypeSku,
        tokenEncrypted: sanitizedToken, // Use the sanitized token
      };

      await onAdd(accountInput);
      toast.success(`Account ${login} added successfully!`);
      setToken('');
      setOpen(false);
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add account');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="mr-1.5 size-4" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Copilot Account</DialogTitle>
            <DialogDescription>
              Provide a GitHub Personal Access Token. The token will be
              encrypted and stored securely in the database. It is used to fetch
              Copilot usage data from the GitHub API.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="token">GitHub Token</Label>
              <div className="relative">
                <Input
                  id="token"
                  type={showToken ? 'text' : 'password'}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="pr-10 font-mono text-sm"
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <IconEyeOff className="text-muted-foreground size-4" />
                  ) : (
                    <IconEye className="text-muted-foreground size-4" />
                  )}
                  <span className="sr-only">
                    {showToken ? 'Hide' : 'Show'} token
                  </span>
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Required scopes: <code className="text-[11px]">read:user</code>,{' '}
                <code className="text-[11px]">user</code> (for billing data).
                Classic personal access tokens (ghp_) are recommended.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!token.trim() || isSubmitting}>
              {isSubmitting ? 'Adding…' : 'Add Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
