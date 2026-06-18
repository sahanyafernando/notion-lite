"use client";

import { useState, useTransition } from "react";
import { Share2 } from "lucide-react";
import { sharePage, removePageShare } from "@/server/actions/share";
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

type ShareEntry = {
  id: string;
  role: "VIEW" | "EDIT";
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type ShareModalProps = {
  pageId: string;
  shares: ShareEntry[];
  canManage: boolean;
};

export function ShareModal({ pageId, shares, canManage }: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"VIEW" | "EDIT">("VIEW");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleShare = () => {
    setError(null);
    startTransition(async () => {
      try {
        await sharePage(pageId, email, role);
        setEmail("");
      } catch (shareError) {
        setError(
          shareError instanceof Error ? shareError.message : "Failed to share",
        );
      }
    });
  };

  const handleRemove = (userId: string) => {
    startTransition(async () => {
      await removePageShare(pageId, userId);
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share page</DialogTitle>
          <DialogDescription>
            Invite teammates with view or edit access to this page.
          </DialogDescription>
        </DialogHeader>

        {canManage && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="share-email">Email</Label>
              <Input
                id="share-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Permission</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as "VIEW" | "EDIT")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEW">Can view</SelectItem>
                  <SelectItem value="EDIT">Can edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={handleShare} disabled={isPending || !email.trim()}>
              Invite
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">People with access</p>
          {shares.length === 0 ? (
            <p className="text-sm text-zinc-500">No direct shares yet.</p>
          ) : (
            <ul className="space-y-2">
              {shares.map((share) => (
                <li
                  key={share.id}
                  className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
                >
                  <div>
                    <p className="font-medium">
                      {share.user.name ?? share.user.email}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {share.role === "EDIT" ? "Can edit" : "Can view"}
                    </p>
                  </div>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRemove(share.user.id)}
                    >
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
