"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { inviteWorkspaceMember } from "@/server/actions/workspaces";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WorkspaceInviteModalProps = {
  workspaceId: string;
  canManage: boolean;
};

export function WorkspaceInviteModal({
  workspaceId,
  canManage,
}: WorkspaceInviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!canManage) return null;

  const handleInvite = () => {
    setError(null);
    startTransition(async () => {
      try {
        await inviteWorkspaceMember(workspaceId, email, role);
        setEmail("");
      } catch (inviteError) {
        setError(
          inviteError instanceof Error
            ? inviteError.message
            : "Failed to invite member",
        );
      }
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <UserPlus className="h-4 w-4" />
          Invite member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite to workspace</DialogTitle>
          <DialogDescription>
            Add teammates as editors or viewers. They must already have a
            NotionLite account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="workspace-invite-email">Email</Label>
            <Input
              id="workspace-invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as "EDITOR" | "VIEWER")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EDITOR">Editor</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleInvite} disabled={isPending || !email.trim()}>
            Send invite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
