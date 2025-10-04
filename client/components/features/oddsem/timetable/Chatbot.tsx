import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "./types";

export function Chatbot({
  messages,
  onSend,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="mt-4 rounded-md border">
      <div className="p-3 bg-muted font-medium">AI Assistant</div>
      <div className="h-48 overflow-auto p-3 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <div className={
              m.role === "user"
                ? "inline-block rounded-lg bg-primary text-primary-foreground px-3 py-2"
                : "inline-block rounded-lg bg-secondary px-3 py-2"
            }>
              <div className="text-xs opacity-80">
                {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div>{m.content}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form
        className="flex gap-2 p-3 border-t"
        onSubmit={(e) => {
          e.preventDefault();
          const v = ref.current?.value?.trim();
          if (!v) return;
          onSend(v);
          if (ref.current) ref.current.value = "";
        }}
      >
        <Input ref={ref} placeholder="Ask me to check conflicts or suggest slots..." />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
