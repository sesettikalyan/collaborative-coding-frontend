import { MessageSquare, X, Send, ChevronUp, ChevronDown } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { useRef, useState, useEffect } from 'react';

export interface ChatMessage {
  userId: string;
  username: string;
  text: string;
  timestamp?: string;
}

interface ChatPanelProps {
  socket: Socket | null;
  roomId: string;
  currentUserId: string | undefined;
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
  messages: ChatMessage[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  newMessage: string;
  setNewMessage: (msg: string) => void;
}

export default function ChatPanel({
  socket,
  roomId,
  currentUserId,
  isChatOpen,
  setIsChatOpen,
  messages,
  messagesEndRef,
  newMessage,
  setNewMessage,
}: ChatPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

    setShowScrollTop(scrollTop > 100);

    // Check if we are near the bottom (within 50px)
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowScrollBottom(!isAtBottom);
  };

  useEffect(() => {
    handleScroll();
  }, [messages.length, isChatOpen]);

  if (!isChatOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      socket.emit('chat:message', { roomId, text: newMessage });
      setNewMessage('');
    }
  };

  return (
    <div className="w-80 bg-[#0d0d0d] border-l border-gray-800 flex flex-col z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
      <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900/50 shrink-0">
        <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" /> Room Chat
        </h2>
        <button onClick={() => setIsChatOpen(false)} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 relative min-h-0">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto scrollbar-hide p-4 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="text-gray-600 text-sm text-center italic mt-10">No messages yet. Say hello!</div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.userId === currentUserId ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-gray-500 mb-1 font-medium px-1">{msg.username}</span>
                <div className={`px-3 py-2 max-w-[85%] text-sm ${msg.userId === currentUserId ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm' : 'bg-gray-800 text-gray-200 rounded-2xl rounded-bl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Scroll Buttons */}
        <div className="absolute right-3 bottom-3 flex flex-col gap-2 z-20">
          {showScrollTop && (
            <button
              onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-1.5 bg-gray-800/90 hover:bg-gray-700 text-gray-300 rounded-full border border-gray-600 shadow-xl backdrop-blur-sm transition-all"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
          {showScrollBottom && (
            <button
              onClick={() => scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' })}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full border border-indigo-500 shadow-xl transition-all animate-bounce"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 bg-gray-900/50 border-t border-gray-800 shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-950 border border-gray-700 rounded-full px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-9 h-9 shrink-0 rounded-full bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <Send className="w-4 h-4 -ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
