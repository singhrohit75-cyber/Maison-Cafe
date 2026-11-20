import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Plus, RotateCcw, Send, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { formatINR, useBakery } from '../context/BakeryContext';
import type { ProductCategory } from '../types/bakery';
import { SafeImage } from './BrandPrimitives';

interface ConciergeSuggestedItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  egglessOption: boolean;
  available: boolean;
  variant?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: 'gemini' | 'catalog' | 'offline';
  suggestedItems?: ConciergeSuggestedItem[];
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! Welcome to Maison Éclat. I'm Eclair AI, your personal bakery and cafe assistant. Ask me anything about our cakes, coffees, milkshakes, pricing, eggless or allergy options, custom cake quotes, delivery, or order and table lookups.",
};

const SUGGESTED_QUESTIONS = [
  'What coffees & milkshakes do you serve?',
  'Eggless chocolate cakes under ₹1,000?',
  'How much is a 2 kg eggless chocolate custom cake?',
  'Pair a coffee with a pastry',
  'Check order ME-1042 status',
  'Where is the cafe, hours & coupons?',
];

function renderFormattedContent(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-[#49372F]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function EclairConcierge() {
  const {
    conciergeOpen,
    setConciergeOpen,
    products,
    cms,
    coupons,
    addToCart,
    setQuickViewProduct,
  } = useBakery();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [catalogMode, setCatalogMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, conciergeOpen]);

  useEffect(() => {
    if (conciergeOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 180);
      return () => clearTimeout(t);
    }
  }, [conciergeOpen]);

  const generateLocalGroundedReply = async (
    query: string
  ): Promise<{ reply: string; suggestedItems: ConciergeSuggestedItem[] }> => {
    const q = query.toLowerCase().trim();

    if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(q)) {
      const picks = products
        .filter((p) => p.bestseller)
        .slice(0, 3)
        .map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          image: p.image,
          egglessOption: p.egglessOption,
          available: p.available,
          variant: p.variants?.[0],
        }));
      return {
        reply: `Hello! It is a pleasure to welcome you to Maison Éclat.\n\nI can help you browse all ${products.length} handcrafted items—including specialty coffees (${formatINR(129)}–${formatINR(219)}), milkshakes, fresh pastries, artisan breads, and custom cakes—or look up any order (e.g. ME-1042) or table reservation (e.g. TR-501). How can I help you today?`,
        suggestedItems: picks,
      };
    }

    if (q.includes('hour') || q.includes('location') || q.includes('where') || q.includes('address') || q.includes('noida')) {
      return {
        reply: `Maison Éclat is located at **${cms.address}**.\n\n• Opening Hours: ${cms.openingHours}\n• Demo Contact: ${cms.phoneDemo} · ${cms.emailDemo}\n\nSeating Zones: Sunlit Window Lounge, Espresso Bar Alcove, Garden Terrace, and Private Celebration Corner.`,
        suggestedItems: [],
      };
    }

    if (q.includes('deliver') || q.includes('pickup') || q.includes('coupon') || q.includes('offer')) {
      const activeCoupons = coupons.map((c) => `${c.code} (${c.description})`).join(', ');
      return {
        reply: `We offer Home Delivery (${formatINR(cms.deliveryFee)}, free above ${formatINR(cms.freeDeliveryThreshold)}) and free Store Pickup at Sector 62, Noida.\n\nActive Demo Codes: ${activeCoupons || 'ECLAT10'}.`,
        suggestedItems: [],
      };
    }

    const matched = products
      .filter(
        (p) =>
          q.includes(p.name.toLowerCase()) ||
          p.category.toLowerCase().includes(q) ||
          p.name
            .toLowerCase()
            .split(' ')
            .some((w) => w.length > 3 && q.includes(w))
      )
      .slice(0, 3);

    const fallbackList = (matched.length > 0 ? matched : products.filter((p) => p.bestseller).slice(0, 3)).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      image: p.image,
      egglessOption: p.egglessOption,
      available: p.available,
      variant: p.variants?.[0],
    }));

    return {
      reply: `Here are selections from our live Maison Éclat catalog (${products.length} handcrafted items in INR):\n\n${fallbackList
        .map((p) => `• **${p.name}** (${p.category}) — **${formatINR(p.price)}**`)
        .join('\n')}`,
      suggestedItems: fallbackList,
    };
  };

  const fetchBackendGroundedReply = async (
    query: string
  ): Promise<{ reply: string; suggestedItems: ConciergeSuggestedItem[]; mode: 'catalog' | 'offline' }> => {
    try {
      const groundedCtrl = new AbortController();
      const groundedTimer = setTimeout(() => groundedCtrl.abort(), 3500);
      const res = await fetch('/api/concierge/grounded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: groundedCtrl.signal,
        body: JSON.stringify({ message: query }),
      });
      clearTimeout(groundedTimer);
      if (res.ok) {
        const data = (await res.json()) as {
          reply: string;
          suggestedItems?: ConciergeSuggestedItem[];
        };
        if (data.reply) {
          return {
            reply: data.reply,
            suggestedItems: Array.isArray(data.suggestedItems) ? data.suggestedItems : [],
            mode: 'catalog',
          };
        }
      }
    } catch {
      // Fall back to local catalog resolver if server is unreachable
    }
    const local = await generateLocalGroundedReply(query);
    return { ...local, mode: 'offline' };
  };

  const handleQuickAdd = (item: ConciergeSuggestedItem) => {
    if (!item.available) return;
    addToCart({
      productId: item.id,
      name: item.name,
      category: item.category as ProductCategory,
      price: item.price,
      image: item.image,
      quantity: 1,
      variant: item.variant || 'Standard',
      eggless: item.egglessOption,
    });
  };

  const handleInspectProduct = (item: ConciergeSuggestedItem) => {
    const found = products.find((p) => p.id === item.id);
    if (found) {
      setQuickViewProduct(found);
      return;
    }
    setConciergeOpen(false);
    navigate(`/menu?category=${encodeURIComponent(item.category)}`);
  };

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || typing) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!textToSend) setInput('');
    setTyping(true);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const historyPayload = nextHistory
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const streamRes = await fetch('/api/concierge/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ message: text, history: historyPayload }),
      });

      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        const assistantId = `a-${Date.now()}`;
        let fullText = '';
        let buffer = '';
        let createdBubble = false;
        let finalSuggested: ConciergeSuggestedItem[] = [];

        const processFrame = (rawFrame: string) => {
          const dataLines = rawFrame
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.slice(5).trim())
            .filter(Boolean);

          for (const jsonStr of dataLines) {
            if (jsonStr === '[DONE]') continue;
            let payload: {
              chunk?: string;
              done?: boolean;
              suggestedItems?: ConciergeSuggestedItem[];
              error?: string;
            };
            try {
              payload = JSON.parse(jsonStr);
            } catch {
              continue;
            }
            if (payload.error) {
              throw new Error(payload.error);
            }
            if (payload.chunk) {
              fullText += payload.chunk;
              if (!createdBubble) {
                createdBubble = true;
                setTyping(false);
                setCatalogMode(false);
                setMessages((prev) => [
                  ...prev,
                  { id: assistantId, role: 'assistant', content: fullText, mode: 'gemini' },
                ]);
              } else {
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m))
                );
              }
            }
            if (payload.done && Array.isArray(payload.suggestedItems) && payload.suggestedItems.length > 0) {
              finalSuggested = payload.suggestedItems;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, suggestedItems: finalSuggested } : m
                )
              );
            }
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          const frames = buffer.split('\n\n');
          buffer = frames.pop() || '';
          for (const frame of frames) {
            processFrame(frame);
          }
        }
        if (buffer.trim()) {
          processFrame(buffer);
        }

        if (createdBubble && fullText.trim()) {
          return;
        }
      }

      // Fast backend grounded catalog & business lookup when Gemini stream is unavailable/quota-limited
      const grounded = await fetchBackendGroundedReply(text);
      setCatalogMode(grounded.mode === 'catalog' || grounded.mode === 'offline');
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: grounded.reply,
          mode: grounded.mode,
          suggestedItems: grounded.suggestedItems,
        },
      ]);
    } catch {
      const grounded = await fetchBackendGroundedReply(text);
      setCatalogMode(grounded.mode === 'catalog' || grounded.mode === 'offline');
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: grounded.reply,
          mode: grounded.mode,
          suggestedItems: grounded.suggestedItems,
        },
      ]);
    } finally {
      clearTimeout(timer);
      setTyping(false);
    }
  };

  return (
    <>
      {!conciergeOpen && (
        <button
          type="button"
          onClick={() => setConciergeOpen(true)}
          aria-label="Open Eclair AI Bakery Assistant"
          className="fixed bottom-5 right-5 z-40 h-12 px-4 sm:px-5 rounded-full bg-[#49372F] text-[#F8F3EB] shadow-xl border border-[#C6A477]/60 flex items-center gap-2.5 hover:bg-[#795B48] transition-all"
        >
          <MessageCircle className="w-5 h-5 text-[#C6A477]" />
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
            Ask Eclair AI
          </span>
        </button>
      )}

      <AnimatePresence>
        {conciergeOpen && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[410px] z-50 bg-[#FFFFFF] rounded-2xl shadow-2xl border border-[#D9C2A5] overflow-hidden flex flex-col max-h-[84vh]"
            role="dialog"
            aria-label="Eclair AI Bakery & Cafe Assistant"
          >
            {/* Header */}
            <div className="bg-[#49372F] text-[#F8F3EB] px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-semibold tracking-wide text-[#FFFFFF]">
                  Eclair AI
                </h3>
                <p className="text-[11px] text-[#D9C2A5]">
                  {catalogMode
                    ? 'Menu & Business Assistant · Live Catalog'
                    : 'Personal Bakery & Cafe Assistant · Maison Éclat'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setCatalogMode(false);
                    setMessages([WELCOME_MESSAGE]);
                  }}
                  title="Clear conversation"
                  aria-label="Clear chat"
                  className="w-8 h-8 rounded-lg hover:bg-[#FFFFFF]/10 flex items-center justify-center text-[#D9C2A5] hover:text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConciergeOpen(false)}
                  aria-label="Close assistant"
                  className="w-8 h-8 rounded-lg hover:bg-[#FFFFFF]/10 flex items-center justify-center text-[#D9C2A5] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F8F3EB]/75 min-h-[260px]"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                      m.role === 'user'
                        ? 'bg-[#49372F] text-[#F8F3EB] rounded-br-xs'
                        : 'bg-[#FFFFFF] text-[#49372F] border border-[#D9C2A5]/60 rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    {m.role === 'assistant' ? renderFormattedContent(m.content) : m.content}

                    {m.role === 'assistant' && m.suggestedItems && m.suggestedItems.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-[#D9C2A5]/40 space-y-2">
                        {m.suggestedItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-[#F8F3EB]/70 border border-[#D9C2A5]/50"
                          >
                            <button
                              type="button"
                              onClick={() => handleInspectProduct(item)}
                              className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-[#D9C2A5]/60"
                            >
                              <SafeImage
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInspectProduct(item)}
                              className="flex-1 min-w-0 text-left"
                            >
                              <p className="text-xs font-semibold text-[#49372F] truncate">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-[#795B48] tabular-nums">
                                {formatINR(item.price)}
                                {item.egglessOption ? ' · Eggless OK' : ''}
                              </p>
                            </button>
                            <button
                              type="button"
                              disabled={!item.available}
                              onClick={() => handleQuickAdd(item)}
                              className="h-8 px-2.5 rounded-lg bg-[#49372F] hover:bg-[#795B48] text-[#F8F3EB] text-[11px] font-medium inline-flex items-center gap-1 shrink-0 transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" />
                              {item.available ? 'Add' : 'Sold Out'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {(m.mode === 'catalog' || m.mode === 'offline') && (
                      <span className="block mt-2 pt-1.5 border-t border-[#D9C2A5]/40 text-[10px] text-[#795B48]">
                        Grounded in live Maison Éclat catalog &amp; business records
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex justify-start">
                  <div className="bg-[#FFFFFF] border border-[#D9C2A5]/60 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C6A477] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C6A477] animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C6A477] animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Prompts */}
            <div className="px-4 py-2.5 bg-[#FFFFFF] border-t border-[#D9C2A5]/40 flex gap-1.5 overflow-x-auto">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={typing}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-1.5 rounded-lg bg-[#F8F3EB] hover:bg-[#D9C2A5]/40 text-[11px] font-medium text-[#49372F] whitespace-nowrap shrink-0 border border-[#D9C2A5]/60 transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Quick Navigation Footer */}
            <div className="px-4 py-1.5 bg-[#F8F3EB]/60 border-t border-[#D9C2A5]/30 flex items-center justify-between text-[11px] text-[#795B48]">
              <span>Quick routes:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setConciergeOpen(false);
                    navigate('/menu?category=Specialty%20Coffee');
                  }}
                  className="hover:text-[#49372F] underline"
                >
                  Coffee Menu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConciergeOpen(false);
                    navigate('/orders');
                  }}
                  className="hover:text-[#49372F] underline"
                >
                  Custom Cakes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConciergeOpen(false);
                    navigate('/cafe');
                  }}
                  className="hover:text-[#49372F] underline"
                >
                  Book Table
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConciergeOpen(false);
                    navigate('/account');
                  }}
                  className="hover:text-[#49372F] underline"
                >
                  Sign In
                </button>
              </div>
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="p-3 bg-[#FFFFFF] border-t border-[#D9C2A5]/60 flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Eclair AI about cakes, coffee, prices, orders..."
                className="flex-1 min-w-0 h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm text-[#49372F] placeholder:text-[#795B48]/70 focus:outline-none focus:border-[#C6A477]"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                aria-label="Send message"
                className="w-10 h-10 rounded-lg bg-[#49372F] text-[#F8F3EB] flex items-center justify-center hover:bg-[#795B48] transition-colors disabled:opacity-40 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
