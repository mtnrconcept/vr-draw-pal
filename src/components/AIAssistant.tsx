import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { invokeEdgeFunction } from "@/integrations/supabase/client";

interface AIAssistantProps {
  onClose: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AIAssistant = ({ onClose }: AIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Bonjour ! 🎨 Je suis votre coach de dessin personnel. Posez-moi des questions sur les techniques, demandez des conseils ou partagez votre progression. Comment puis-je vous aider aujourd'hui ?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await invokeEdgeFunction("drawing-coach", {
        body: { messages: [...messages, userMessage] },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: (data as any).choices[0].message.content,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-xl md:items-center">
      <Card className="m-0 w-full max-w-2xl rounded-t-[32px] border border-white/60 bg-white/80 shadow-[var(--shadow-soft)] backdrop-blur-2xl md:h-[720px] md:rounded-[40px]">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-[32px] border-b border-white/50 bg-gradient-to-r from-primary/90 via-primary to-secondary px-6 py-5 text-white md:rounded-t-[40px]">
            <div>
              <h2 className="text-lg font-semibold">Assistant IA · Coach personnel</h2>
              <p className="text-xs text-white/70">Posez vos questions techniques, demandez des corrections ou des variations de pose.</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-full border border-white/40 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-[24px] px-5 py-4 text-sm leading-relaxed shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-primary to-secondary text-white"
                      : "border border-white/60 bg-white/80 text-foreground backdrop-blur"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-[24px] border border-white/60 bg-white/70 px-4 py-3 text-muted-foreground shadow-inner shadow-white/50">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="rounded-b-[32px] border-t border-white/60 bg-white/70 px-6 py-5 backdrop-blur md:rounded-b-[40px]">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Posez une question sur le dessin..."
                className="h-12 flex-1 rounded-full border-white/60 bg-white px-6 text-sm"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="h-12 rounded-full bg-gradient-to-r from-primary to-secondary px-6 text-xs font-semibold uppercase tracking-widest text-white shadow-[0_18px_40px_-22px_rgba(92,80,255,0.7)] transition hover:scale-[1.01]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
