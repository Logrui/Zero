"use client";

// Restored: Minimal, visible Chat Panel so the calendar module always has a working panel.
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { XIcon, SendIcon } from "lucide-react";

export interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToolExecution?: (result: any) => Promise<void> | void;
}

type ChatMessage = { id: string; role: "assistant" | "user"; content: string };

export function ChatPanel({ open, onOpenChange, onToolExecution }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "m1", role: "assistant", content: "Hi! How can I help with your calendar?" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClose = () => onOpenChange(false);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      await onToolExecution?.({ type: "chat.message", payload: { text } });
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "There was an error executing the action." },
      ]);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-[60vh] flex-col bg-background">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="font-medium">AI Assistant</div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose} aria-label="Close AI">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "assistant"
                  ? "max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm"
                  : "ml-auto max-w-[85%] rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm"
              }
            >
              {m.content}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      <Separator />

      <div className="flex items-center gap-2 p-2">
        <Input
          placeholder="Ask anything…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-10"
        />
        <Button onClick={handleSend} disabled={!input.trim()} className="h-10" aria-label="Send">
          <SendIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
