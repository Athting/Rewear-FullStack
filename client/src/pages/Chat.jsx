import React, { useContext, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import { SocketContext } from '../context/SocketContext.jsx';
import Sidebar from '../components/Sidebar.jsx';

export default function Chat() {
  const { user } = useContext(AuthContext);
  const { socket, liveMessages, setLiveMessages } = useContext(SocketContext);
  const queryClient = useQueryClient();

  const [activeChatId, setActiveChatId] = useState('');
  const [activePartner, setActivePartner] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [aiCoachMode, setAiCoachMode] = useState(false);
  const [aiHistory, setAiHistory] = useState([
    { sender: 'ai', text: 'Hi! I am your ReWear AI Sustainability Coach. Ask me how to upcycle clothes, style outfits, or optimize your circular closet swaps!' }
  ]);
  const [loadingAI, setLoadingAI] = useState(false);

  const messagesEndRef = useRef(null);

  // 1. Fetch all conversations list
  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.get('/chat/conversations');
      return response.data.conversations;
    }
  });

  const conversations = convData || [];

  // 2. Fetch messages history for active chat
  const { data: msgData, isLoading: msgLoading } = useQuery({
    queryKey: ['messages', activeChatId],
    queryFn: async () => {
      if (!activeChatId || aiCoachMode) return [];
      const response = await api.get(`/chat/messages/${activeChatId}`);
      return response.data.messages;
    },
    enabled: !!activeChatId && !aiCoachMode
  });

  // Sync historical messages with Socket client context
  useEffect(() => {
    if (msgData) {
      setLiveMessages(msgData);
    }
  }, [msgData]);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages, aiHistory, partnerTyping]);

  // Join Socket Room on chat select
  useEffect(() => {
    if (socket && activeChatId && !aiCoachMode) {
      socket.emit('join_chat', activeChatId);

      // Listen for typing events
      socket.on('typing_status', (data) => {
        if (data.userId !== user.id) {
          setPartnerTyping(data.isTyping);
        }
      });

      // Listen for message read receipts
      socket.on('messages_read', (data) => {
        if (data.readerId !== user.id) {
          setLiveMessages(prev => prev.map(m => m.senderId !== user.id ? m : { ...m, read: true }));
        }
      });

      // Emit read receipt trigger
      socket.emit('read_receipt', { chatId: activeChatId, userId: user.id });

      return () => {
        socket.off('typing_status');
        socket.off('messages_read');
      };
    }
  }, [activeChatId, socket, aiCoachMode]);

  // Handle Input typing indicators
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (socket && activeChatId && !aiCoachMode) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', { chatId: activeChatId, userId: user.id, isTyping: true });
      }

      // Debounce typing timer
      const timeout = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing', { chatId: activeChatId, userId: user.id, isTyping: false });
      }, 2000);

      return () => clearTimeout(timeout);
    }
  };

  // Submit message mutation (handles real-time emitters)
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (aiCoachMode) {
      // AI Coach message Submission
      const newHistory = [...aiHistory, { sender: 'user', text: inputText }];
      setAiHistory(newHistory);
      setInputText('');
      setLoadingAI(true);

      api.post('/ai/chat', { messages: newHistory })
        .then((res) => {
          setAiHistory(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
        })
        .catch(() => {
          setAiHistory(prev => [...prev, { sender: 'ai', text: 'Sorry, I am having trouble connecting to the Gemini server.' }]);
        })
        .finally(() => {
          setLoadingAI(false);
        });
      return;
    }

    // Direct User Swapper Socket Message Emitters
    if (socket && activeChatId) {
      const partnerId = activePartner._id;
      socket.emit('send_message', {
        senderId: user.id,
        receiverId: partnerId,
        chatId: activeChatId,
        text: inputText
      });

      // Stop typing emitter
      setIsTyping(false);
      socket.emit('typing', { chatId: activeChatId, userId: user.id, isTyping: false });
      
      setInputText('');
      
      // Invalidate queries so sidebars refresh
      queryClient.invalidateQueries(['conversations']);
    }
  };

  const handleSelectConversation = (conv) => {
    setAiCoachMode(false);
    setActiveChatId(conv.id);
    setActivePartner(conv.partner);
  };

  const startAICoach = () => {
    setAiCoachMode(true);
    setActiveChatId('');
    setActivePartner({ name: 'AI Sustainability Coach', avatar: 'https://ui-avatars.com/api/?name=AI&background=2E7D32&color=fff' });
  };

  return (
    <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <Sidebar />

      {/* Main chat window */}
      <section className="flex-1 w-full bg-white/70 backdrop-blur-md border border-border-custom rounded-2xl overflow-hidden flex h-[620px] shadow-sm">
        
        {/* Left Side: Conversations */}
        <div className="w-1/3 border-r border-border-custom flex flex-col">
          <div className="p-4 border-b border-border-custom">
            <h3 className="font-primary font-bold text-sm mb-3">Chats Inbox</h3>
            
            {/* AI Assistant Special CTA */}
            <button
              onClick={startAICoach}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl transition-all border text-left ${aiCoachMode ? 'border-primary bg-primary/5' : 'border-dashed border-primary/40 hover:bg-primary/5'}`}
            >
              <span className="material-symbols-rounded text-primary text-xl">smart_toy</span>
              <div className="flex-grow min-w-0">
                <h4 className="font-bold text-xs text-primary">AI Sustainability Coach</h4>
                <p className="text-[10px] text-text-secondary truncate">Ask styling & swap help</p>
              </div>
            </button>
          </div>

          {/* User Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            {convLoading ? (
              <div className="p-4 text-center text-xs text-text-secondary">Loading messages...</div>
            ) : conversations.length > 0 ? (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectConversation(c)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeChatId === c.id ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-primary/5'}`}
                >
                  <img src={c.partner?.avatar} alt={c.partner?.name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-grow text-left min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-xs truncate max-w-[100px]">{c.partner?.name}</h4>
                      <span className="text-[9px] text-text-light">{new Date(c.lastMessage?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary truncate mt-0.5">{c.lastMessage?.text || 'Sent an attachment...'}</p>
                  </div>
                  {c.lastMessage?.senderId !== user.id && !c.lastMessage?.read && (
                    <span className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0"></span>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-12 text-text-secondary text-xs">No active chats. Start proposal from clothing details page.</div>
            )}
          </div>
        </div>

        {/* Right Side: Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50/50">
          {activePartner ? (
            <>
              {/* Header */}
              <div className="p-4 bg-white border-b border-border-custom flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <img src={activePartner.avatar} alt={activePartner.name} className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-xs text-text-primary leading-tight">{activePartner.name}</h4>
                    <p className="text-[10px] text-text-secondary">
                      {aiCoachMode ? 'Google Gemini Engine' : `Rating: ⭐ ${activePartner.rating || '5.0'}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Thread Container */}
              <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-4">
                {aiCoachMode ? (
                  aiHistory.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${m.sender === 'user' ? 'bg-primary text-white rounded-tr-none shadow-sm' : 'bg-white border border-border-custom text-text-primary rounded-tl-none shadow-sm'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))
                ) : (
                  liveMessages.map((m) => {
                    const isSelf = m.senderId === user.id;
                    return (
                      <div key={m._id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                        <div className="flex flex-col gap-0.5 max-w-[75%]">
                          {/* Offer card attachment */}
                          {m.offer && (
                            <div className="bg-emerald-950 text-white p-3 rounded-2xl shadow-md mb-1 border border-primary/20 text-xs">
                              <p className="font-bold text-[10px] uppercase text-secondary mb-1">Swap Proposal Card</p>
                              <p className="font-semibold text-xs leading-tight">Proposed direct exchange! Click to inspect request in detail.</p>
                              <div className="flex gap-2 mt-2">
                                <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold">Diff: {m.offer.difference} pts</span>
                              </div>
                            </div>
                          )}
                          <div className={`rounded-2xl px-4 py-2.5 text-xs ${isSelf ? 'bg-primary text-white rounded-tr-none shadow-sm' : 'bg-white border border-border-custom text-text-primary rounded-tl-none shadow-sm'}`}>
                            {m.text}
                          </div>
                          <span className="text-[8px] text-text-light self-end mt-0.5">
                            {isSelf && (m.read ? 'Read ✓' : 'Sent')}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Partner Typing Indicator */}
                {partnerTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-border-custom text-text-secondary rounded-2xl px-4 py-2.5 text-xs rounded-tl-none shadow-sm animate-pulse flex items-center gap-1">
                      <span>typing</span>
                      <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce delay-100"></span>
                    </div>
                  </div>
                )}

                {loadingAI && (
                  <div className="flex justify-start">
                    <div className="bg-primary/10 text-primary rounded-2xl px-4 py-2.5 text-xs rounded-tl-none shadow-sm animate-pulse flex items-center gap-1.5 font-semibold">
                      <span className="material-symbols-rounded animate-spin">sync</span>
                      <span>AI coach is generating advice...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Control */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-border-custom flex gap-3 shadow-sm">
                <input
                  type="text"
                  placeholder={aiCoachMode ? 'Ask sustainability tips, upcycling fleece blazers...' : 'Type message here...'}
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-grow px-4 py-2.5 border border-border-custom bg-gray-50 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all"
                  required
                />
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white p-2.5 rounded-full shadow-sm flex items-center justify-center">
                  <span className="material-symbols-rounded text-lg">send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 gap-4">
              <span className="material-symbols-rounded text-6xl text-text-light">forum</span>
              <h3 className="font-primary font-bold text-lg">Select a Conversation</h3>
              <p className="text-text-secondary text-sm max-w-sm">Choose an inbox member or trigger the AI Sustainability Coach to begin chatting.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
