import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, X, Send, AlertCircle, RefreshCw, Bot, User, CheckCircle2 } from 'lucide-react';

import { useUserRole } from '../hooks/useUserRole';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  addedCartItem?: {
    id: string;
    title: string;
    price: number;
    type: string;
  };
}

export default function ChatWidget() {
  const { isAdmin } = useUserRole();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I am your EcoMarket AI Shopping Assistant. Ask me anything like *'I want to start terrace organic farming, what do I need?'*",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isAdmin) {
      scrollToBottom();
    }
  }, [messages, isLoading, isAdmin]);

  if (isAdmin) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    setErrorMsg(null);
    const userMessage = input.trim();
    setInput('');

    const userMsgObj: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setIsLoading(true);

    const assistantMsgId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: 'assistant', content: '' },
    ]);

    try {
      const token = await getToken();
      if (!token) {
        setErrorMsg('Please sign in to chat with the AI assistant.');
        setIsLoading(false);
        return;
      }

      const rawApiEnv = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const cleanBaseUrl = rawApiEnv.endsWith('/api/v1')
        ? rawApiEnv
        : `${rawApiEnv.replace(/\/$/, '')}/api/v1`;
      const requestUrl = `${cleanBaseUrl}/ai/chat`;

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        let errDetails = 'AI Assistant is temporarily unavailable.';
        try {
          const errJson = await response.json();
          errDetails = errJson?.error?.message || errJson?.message || errDetails;
        } catch (_) {}
        throw new Error(errDetails);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (!reader) {
        throw new Error('Stream reader unavailable');
      }

      let done = false;
      let accumulatedText = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkStr = decoder.decode(value);
          const lines = chunkStr.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.replace('data: ', ''));

                if (data.type === 'delta') {
                  accumulatedText += data.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, content: accumulatedText }
                        : msg
                    )
                  );
                } else if (data.type === 'cart_action') {
                  // Invalidate cart query & add card
                  queryClient.invalidateQueries({ queryKey: ['cart'] });
                  if (data.addedItems?.[0]) {
                    const item = data.addedItems[0];
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMsgId
                          ? {
                              ...msg,
                              addedCartItem: {
                                id: item.id,
                                title: item.title,
                                price: item.price,
                                type: item.type,
                              },
                            }
                          : msg
                      )
                    );
                  }
                } else if (data.type === 'error') {
                  setErrorMsg(data.message);
                }
              } catch (err) {
                // Ignore SSE chunk parse errors
              }
            }
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          'Assistant is temporarily unavailable. Please browse the shop directly.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Trigger FAB Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-5 py-3 bg-ai text-white rounded-full font-semibold text-xs shadow-card hover:bg-ai/90 hover:scale-105 transition-all cursor-pointer group"
        >
          <Sparkles className="w-4 h-4 animate-spin text-white group-hover:rotate-45" />
          <span>Ask Eco AI Assistant</span>
        </button>
      )}

      {/* Chat Box Drawer */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] bg-background-card/95 backdrop-blur-md border border-text-muted/20 rounded-3xl shadow-card flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-ai p-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/10 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm">EcoMarket AI Assistant</h3>
                <span className="text-[10px] text-white/80 block">Grounded Catalog Advisor</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-2 ${
                    isAssistant ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {isAssistant && (
                    <div className="w-6 h-6 rounded-full bg-ai/10 border border-ai/30 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-ai" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl p-3 space-y-2 leading-relaxed ${
                      isAssistant
                        ? 'bg-background-muted/70 text-text-primary border border-text-muted/15'
                        : 'bg-primary text-white font-medium ml-auto'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Added to Cart Card */}
                    {msg.addedCartItem && (
                      <div className="bg-success-light text-success border border-success/30 rounded-xl p-2.5 flex items-center space-x-2 text-[11px] font-semibold mt-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <div>
                          <span>Added to Cart:</span>
                          <strong className="block truncate">{msg.addedCartItem.title}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center space-x-2 text-text-muted text-[11px] p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-ai" />
                <span>Searching grounded catalog & analyzing...</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-error-light border border-error/30 rounded-xl p-3 text-error flex items-center space-x-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 border-t border-text-muted/15 bg-background-card flex items-center space-x-2">
            <input
              type="text"
              placeholder={isSignedIn ? "Ask about products, bundles, courses..." : "Sign in to chat..."}
              disabled={!isSignedIn || isLoading}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-background-muted border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-ai/40"
            />
            <button
              type="submit"
              disabled={!isSignedIn || isLoading || !input.trim()}
              className="p-2.5 bg-ai text-white rounded-xl hover:bg-ai/90 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
