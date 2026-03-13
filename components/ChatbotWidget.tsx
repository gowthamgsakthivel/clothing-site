"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
};

const buildId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const defaultGreeting =
  "Hi! I am Sparrow Support. Ask about products, shipping, returns, order tracking, or contact info.";

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const hasMessages = messages.length > 0;

  const initialMessages = useMemo(
    () => [{ id: buildId(), role: "bot" as const, text: defaultGreeting }],
    []
  );

  useEffect(() => {
    if (isOpen && !hasMessages) {
      setMessages(initialMessages);
    }
  }, [hasMessages, initialMessages, isOpen]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) {
      return;
    }

    const userMessage: ChatMessage = { id: buildId(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed })
      });

      if (!response.ok) {
        throw new Error("Chatbot request failed");
      }

      const data = (await response.json()) as { reply?: string };
      const replyText = data.reply || "Sorry, I could not process that. Please try again.";

      const botMessage: ChatMessage = { id: buildId(), role: "bot", text: replyText };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const botMessage: ChatMessage = {
        id: buildId(),
        role: "bot",
        text: "Sorry, something went wrong. Please try again in a moment."
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chatbot-container" aria-live="polite">
      {isOpen ? (
        <div className="chatbot-panel" role="dialog" aria-label="Chat support">
          <div className="chatbot-header">
            <div>
              <div className="chatbot-title">Sparrow Support</div>
              <div className="chatbot-subtitle">Usually replies instantly</div>
            </div>
            <button
              type="button"
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              x
            </button>
          </div>

          <div className="chatbot-messages" ref={listRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-message ${message.role === "user" ? "user" : "bot"}`}
              >
                <div className="chatbot-bubble">{message.text}</div>
              </div>
            ))}
          </div>

          <div className="chatbot-input-row">
            <input
              className="chatbot-input"
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
            />
            <button
              type="button"
              className="chatbot-send"
              onClick={sendMessage}
              disabled={isSending || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="chatbot-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M6 6l12 12M18 6l-12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M4 5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
            />
          </svg>
        )}
      </button>
    </div>
  );
};

export default ChatbotWidget;
