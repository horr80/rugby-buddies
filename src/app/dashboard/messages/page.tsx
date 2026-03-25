"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Mail, MailOpen, AlertCircle } from "lucide-react";

type Sender = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type MessageRow = {
  id: string;
  subject: string;
  body: string;
  isRead: boolean;
  sentAt: string;
  sender: Sender;
};

function senderLabel(s: Sender) {
  const name = `${s.firstName} ${s.lastName}`.trim();
  return name || s.email;
}

export default function MessagesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [patching, setPatching] = useState(false);
  const prevSelectedIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    prevSelectedIdRef.current = null;
    try {
      const res = await fetch("/api/messages");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not load messages");
        setMessages([]);
        return;
      }
      const list = json as MessageRow[];
      setMessages(list);
      setSelectedId((prev) => {
        if (prev && list.some((m) => m.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch {
      setError("Something went wrong. Please try again.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => messages.find((m) => m.id === selectedId) ?? null,
    [messages, selectedId]
  );

  const unreadCount = useMemo(() => messages.filter((m) => !m.isRead).length, [messages]);

  const markReadState = useCallback((id: string, isRead: boolean) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead } : m)));
  }, []);

  const patchMessage = useCallback(
    async (id: string, isRead: boolean) => {
      setPatching(true);
      try {
        const res = await fetch(`/api/messages/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Could not update message");
          return;
        }
        markReadState(id, (json as MessageRow).isRead);
      } catch {
        setError("Could not update message");
      } finally {
        setPatching(false);
      }
    },
    [markReadState]
  );

  useEffect(() => {
    if (selectedId === prevSelectedIdRef.current) return;
    prevSelectedIdRef.current = selectedId;
    if (!selectedId) return;
    const m = messages.find((x) => x.id === selectedId);
    if (m && !m.isRead) {
      void patchMessage(selectedId, true);
    }
  }, [selectedId, messages, patchMessage]);

  const selectMessage = (id: string) => {
    setError(null);
    setSelectedId(id);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-[#2D5F2D]">
        <Loader2 className="h-10 w-10 animate-spin text-[#D4A843]" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading your inbox…</p>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="border-destructive/40 bg-destructive/5 p-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <h2 className="font-semibold text-destructive">Couldn’t load messages</h2>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <Button type="button" className="mt-4" variant="outline" onClick={() => load()}>
                Try again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D5F2D]">Messages</h1>
          <p className="mt-1 text-muted-foreground">Notes and updates from the Rugby Buddy team.</p>
        </div>
        <Card className="flex flex-col items-center justify-center border-dashed border-[#2D5F2D]/25 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2D5F2D]/10">
            <Mail className="h-8 w-8 text-[#D4A843]" aria-hidden />
          </div>
          <p className="mt-4 text-lg font-semibold text-[#2D5F2D]">No messages yet</p>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            When we send you something, it will show up here.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#2D5F2D]">Messages</h1>
            {unreadCount > 0 ? (
              <Badge className="border-[#2D5F2D]/30 bg-[#2D5F2D] text-white">
                {unreadCount} unread
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-muted-foreground">Your inbox from Rugby Buddy.</p>
        </div>
      </div>

      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex min-h-[min(70vh,640px)] flex-col overflow-hidden rounded-xl border border-[#2D5F2D]/15 bg-card shadow-md md:flex-row">
        <div
          className="flex max-h-[40vh] flex-col border-b border-[#2D5F2D]/10 md:max-h-none md:w-[min(100%,320px)] md:border-b-0 md:border-r"
          role="navigation"
          aria-label="Message list"
        >
          <div className="border-b border-[#2D5F2D]/10 bg-[#2D5F2D]/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#2D5F2D]">
            Inbox
          </div>
          <ul className="flex-1 overflow-y-auto">
            {messages.map((m) => {
              const active = m.id === selectedId;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => selectMessage(m.id)}
                    className={cn(
                      "flex w-full flex-col gap-1 border-b border-[#2D5F2D]/5 px-3 py-3 text-left transition-colors hover:bg-[#2D5F2D]/5",
                      active && "bg-[#D4A843]/15 ring-1 ring-inset ring-[#D4A843]/40"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!m.isRead ? (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#2D5F2D]"
                          aria-hidden
                        />
                      ) : (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-transparent" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "line-clamp-2 text-sm",
                            !m.isRead ? "font-bold text-foreground" : "font-medium text-foreground/90"
                          )}
                        >
                          {m.subject}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {formatDate(m.sentAt)}
                        </span>
                      </div>
                      {m.isRead ? (
                        <MailOpen className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      ) : (
                        <Mail className="h-4 w-4 shrink-0 text-[#D4A843]" aria-hidden />
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex min-h-[50vh] flex-1 flex-col bg-muted/20 md:min-h-0">
          {selected ? (
            <>
              <div className="border-b border-[#2D5F2D]/10 bg-background px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-[#2D5F2D] sm:text-xl">
                      {selected.subject}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      From <span className="font-medium text-foreground">{senderLabel(selected.sender)}</span>
                      {" · "}
                      {formatDate(selected.sentAt)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={patching}
                    className="shrink-0 border-[#2D5F2D]/30"
                    onClick={() => patchMessage(selected.id, !selected.isRead)}
                  >
                    {selected.isRead ? "Mark as unread" : "Mark as read"}
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {selected.body}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
              <Mail className="h-10 w-10 text-[#D4A843]/60" />
              <p>Select a message to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
