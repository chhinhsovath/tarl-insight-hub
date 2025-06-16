"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DeleteSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (forceDelete?: boolean) => Promise<void>;
  sessionTitle: string;
  participantCount: number;
  loading?: boolean;
}

export default function DeleteSessionDialog({
  isOpen,
  onClose,
  onConfirm,
  sessionTitle,
  participantCount,
  loading = false
}: DeleteSessionDialogProps) {
  const [showForceOption, setShowForceOption] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFirstAttempt = async () => {
    if (participantCount === 0) {
      // No participants, proceed with normal delete
      setIsDeleting(true);
      try {
        await onConfirm(false);
        onClose();
      } catch (error) {
        console.error('Delete error:', error);
      } finally {
        setIsDeleting(false);
      }
    } else {
      // Has participants, show force delete option
      setShowForceOption(true);
    }
  };

  const handleForceDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(true);
      onClose();
    } catch (error) {
      console.error('Force delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setShowForceOption(false);
    onClose();
  };

  const resetDialog = () => {
    setShowForceOption(false);
    setIsDeleting(false);
  };

  // Reset dialog state when it opens
  React.useEffect(() => {
    if (isOpen) {
      resetDialog();
    }
  }, [isOpen]);

  if (!showForceOption) {
    // First confirmation dialog
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Training Session
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the session:
            </DialogDescription>
            <div className="space-y-3">
              <div className="font-medium text-foreground bg-muted p-3 rounded">
                {sessionTitle}
              </div>
              {participantCount > 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <Users className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    This session has <Badge variant="secondary" className="mx-1">{participantCount}</Badge>
                    registered participant{participantCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleFirstAttempt}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Session
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Force delete confirmation dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete Session with Participants
          </DialogTitle>
          <DialogDescription>
            Deleting this session will permanently remove all data and cannot be undone.
          </DialogDescription>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                <AlertTriangle className="h-4 w-4" />
                Warning: This action cannot be undone
              </div>
              <p className="text-sm text-red-700">
                Deleting this session will permanently remove:
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1 ml-4">
                <li>• The training session "{sessionTitle}"</li>
                <li>• All {participantCount} participant registration{participantCount !== 1 ? 's' : ''}</li>
                <li>• Any associated attendance records</li>
                <li>• Related QR codes and materials</li>
              </ul>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <strong>Alternative options:</strong>
              <ul className="mt-1 space-y-1 ml-4">
                <li>• Cancel and manually remove participants first</li>
                <li>• Change session status to "Cancelled" instead of deleting</li>
                <li>• Export participant data before deletion</li>
              </ul>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleForceDelete}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Delete Everything
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}