"use client";

import { useEffect, useState } from "react";
import { CircleUserRound, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export interface RedditStatus {
  connected: boolean;
  username?: string;
}

export function RedditConnectButton({
  onStatusChange,
}: {
  onStatusChange?: (status: RedditStatus) => void;
}) {
  const [status, setStatus] = useState<RedditStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  async function refresh() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reddit/me");
      const data = (await res.json()) as RedditStatus;
      setStatus(data);
      onStatusChange?.(data);
    } catch {
      setStatus({ connected: false });
      onStatusChange?.({ connected: false });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDisconnect() {
    setIsDisconnecting(true);
    try {
      await fetch("/api/reddit/logout", { method: "POST" });
      await refresh();
    } finally {
      setIsDisconnecting(false);
    }
  }

  if (isLoading) {
    return (
      <Button variant="secondary" size="sm" disabled>
        <Spinner className="h-3.5 w-3.5" />
        Checking Reddit...
      </Button>
    );
  }

  if (status?.connected) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
          <CircleUserRound className="h-3.5 w-3.5" />
          Connected as u/{status.username}
        </div>
        <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={isDisconnecting}>
          <LogOut className="h-3.5 w-3.5" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <a href="/api/reddit/auth">
      <Button variant="secondary" size="sm">
        Connect Reddit
      </Button>
    </a>
  );
}
