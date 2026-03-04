'use client';

import * as React from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CopilotAccount } from '@/lib/db/types';

interface EditAccountModalProps {
  account: CopilotAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: number, token: string) => Promise<void>;
}

export function EditAccountModal({
  account,
  open,
  onOpenChange,
  onSave,
}: EditAccountModalProps) {
  const [token, setToken] = React.useState('');
  const [showToken, setShowToken] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset when opening
  React.useEffect(() => {
    if (open) {
      setToken('');
      setShowToken(false);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account || !token.trim()) return;

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

      await onSave(account.id, sanitizedToken);
      toast.success(`Token updated for ${account.login}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating token:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update token');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Account: {account.login}</DialogTitle>
            <DialogDescription>
              Update the GitHub token for this account. The new token will be
              encrypted and replace the existing one.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={account.avatarUrl}
                alt={account.login}
                className="size-10 rounded-full border"
              />
              <div>
                <p className="font-medium">{account.login}</p>
                <p className="text-muted-foreground text-xs">
                  {account.plan} · {account.premiumPercentRemaining.toFixed(1)}%
                  remaining
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-token">New GitHub Token</Label>
              <div className="relative">
                <Input
                  id="edit-token"
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
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Leave blank and cancel if you don&apos;t want to change the
                token.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!token.trim() || isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
