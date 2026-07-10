import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  getConversations,
  getDirectMessages,
  getProjectMessages,
} from "../services/chatService";
import { formatDate } from "../utils/helpers";

const Chat = () => {
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected conversation params
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null); // { type: 'direct'|'project', id, name, details }
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const scrollRef = useRef(null);

  // ─── 1. FETCH CONVERSATION LIST ───────────────────────────────────────────
  const fetchConversations = useCallback(async (selectId = null, selectType = null) => {
    try {
      setConversationsLoading(true);
      const res = await getConversations();
      if (res.success) {
        setConversations(res.conversations);

        // Auto-select a chat if specified
        if (selectId && selectType) {
          const matched = res.conversations.find((c) => {
            if (selectType === "direct" && c.type === "direct") {
              return c.partner.id === selectId;
            }
            if (selectType === "project" && c.type === "project") {
              return c.project.id === selectId;
            }
            return false;
          });

          if (matched) {
            handleSelectChat(matched);
          } else if (selectType === "direct") {
            try {
              setSelectedChat({
                type: "direct",
                id: selectId,
                name: "Direct Message",
                details: "Candidate Workspace",
              });
              await fetchMessages(selectId, "direct");
            } catch (err) {
              console.error(err);
              setError("Conversation could not be initialized");
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to load active chats list:", err.message);
      setError("Failed to load chats list");
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  // ─── 2. SELECT CONVERSATION ON CLICK ──────────────────────────────────────
  const handleSelectChat = async (chat) => {
    setError("");
    const chatId = chat.type === "direct" ? chat.partner.id : chat.project.id;
    const chatName = chat.type === "direct" ? chat.partner.name : chat.project.title;
    const chatDetails =
      chat.type === "direct"
        ? `${chat.partner.college} • Yr ${chat.partner.year}`
        : `${chat.project.category} Workspace`;

    const chatPayload = {
      type: chat.type,
      id: chatId,
      name: chatName,
      details: chatDetails,
    };

    setSelectedChat(chatPayload);
    
    // Update Search Params in router url
    setSearchParams({ type: chat.type, id: chatId });

    await fetchMessages(chatId, chat.type);
  };

  // ─── 3. FETCH HISTORICAL MESSAGES (REST API FIRST) ───────────────────────
  const fetchMessages = async (chatId, type) => {
    try {
      setMessagesLoading(true);
      setError("");
      
      let data;
      if (type === "direct") {
        data = await getDirectMessages(chatId);
      } else {
        data = await getProjectMessages(chatId);
      }

      if (data.success) {
        setMessages(data.messages);
      } else {
        setError(data.message || "Failed to load chat history");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Unauthorized access to this chat room"
      );
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  // ─── 4. LISTEN FOR ACTIVE ROOM SOCKET BROADCASTS ────────────────────────
  useEffect(() => {
    if (!socket || !selectedChat) return;

    if (selectedChat.type === "project") {
      // Join backend WebSocket project group room
      socket.emit("join_project_room", { projectId: selectedChat.id });

      const handleProjectMessage = (message) => {
        if (message.project === selectedChat.id) {
          setMessages((prev) => [...prev, message]);
        }
      };

      socket.on("message_received", handleProjectMessage);

      return () => {
        socket.emit("leave_project_room", { projectId: selectedChat.id });
        socket.off("message_received", handleProjectMessage);
      };
    } else {
      // Direct Message socket handler (uses global user notification room)
      const handleDM = (message) => {
        const isFromPartner = message.sender._id === selectedChat.id;
        const isFromMe = message.sender._id === currentUser.id && message.recipient === selectedChat.id;

        if (isFromPartner || isFromMe) {
          setMessages((prev) => [...prev, message]);
        }
      };

      socket.on("dm_received", handleDM);

      return () => {
        socket.off("dm_received", handleDM);
      };
    }
  }, [socket, selectedChat, currentUser]);

  // Handle URL query parameters initialization
  useEffect(() => {
    const qId = searchParams.get("id");
    const qType = searchParams.get("type");
    fetchConversations(qId, qType);
  }, [searchParams, fetchConversations]);

  // Automatic scrolling down to last message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ─── 5. SEND MESSAGE EVENTS ──────────────────────────────────────────────
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !selectedChat) return;

    const payload = {
      content: inputText.trim(),
    };

    if (selectedChat.type === "direct") {
      socket.emit("send_dm", {
        recipientId: selectedChat.id,
        content: payload.content,
      });
    } else {
      socket.emit("send_project_message", {
        projectId: selectedChat.id,
        content: payload.content,
      });
    }

    setInputText("");
  };

  const filteredConversations = conversations.filter((c) => {
    const name = c.type === "direct" ? c.partner.name : c.project.title;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-bg-base text-white pt-24 pb-6 px-4 md:px-6 relative overflow-hidden flex items-center justify-center">
      <div className="w-full max-w-6xl h-[85vh] bg-bg-secondary border border-border-slate rounded-card overflow-hidden flex shadow-premium relative z-10">
        
        {/* LEFT COLUMN: ACTIVE CHATS LIST */}
        <div className="w-full md:w-80 border-r border-border-slate bg-bg-secondary flex flex-col shrink-0">
          
          {/* List Header Search */}
          <div className="p-4 border-b border-border-slate space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight">Active Messages</h2>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2 pl-9 pr-3 text-xs text-white placeholder:text-gray-500 outline-none transition-colors"
              />
              <svg className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Conversations feed */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversationsLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-3 bg-card-surface/40 border border-border-slate/50 rounded-card animate-pulse h-16" />
              ))
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs">
                No active conversations.
              </div>
            ) : (
              filteredConversations.map((chat) => {
                const isSelected = selectedChat && selectedChat.id === (chat.type === "direct" ? chat.partner.id : chat.project.id);
                const name = chat.type === "direct" ? chat.partner.name : chat.project.title;
                const details = chat.type === "direct" ? chat.partner.college : "Team Room";
                const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

                return (
                  <button
                    key={chat.type + (chat.type === "direct" ? chat.partner.id : chat.project.id)}
                    onClick={() => handleSelectChat(chat)}
                    className={`w-full p-3 flex gap-3 items-center rounded-card hover:bg-hover-surface transition-all text-left border ${
                      isSelected
                        ? "bg-primary/10 border-primary/20 text-white"
                        : "border-transparent text-gray-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      chat.type === "direct" ? "gradient-bg" : "bg-primary/10 border border-primary/20 text-primary-light"
                    }`}>
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-bold text-xs text-white truncate pr-2">{name}</h4>
                        <span className="text-[9px] text-gray-500 shrink-0">{formatDate(chat.lastMessageTime)}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{details}</p>
                      <p className="text-[11px] text-gray-400 truncate">{chat.lastMessage}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CONVERSATION BOX */}
        <div className="flex-grow bg-bg-secondary/40 flex flex-col h-full min-w-0">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border-slate bg-bg-secondary flex items-center justify-between z-10 shrink-0">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-white text-sm tracking-tight">{selectedChat.name}</h3>
                  <p className="text-[10px] text-gray-500">{selectedChat.details}</p>
                </div>
                {error && (
                  <span className="text-danger text-xs font-medium border border-danger/20 bg-danger/10 px-2.5 py-1 rounded-lg">
                    {error}
                  </span>
                )}
              </div>

              {/* Chat messages roll */}
              <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4">
                {messagesLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.sender?._id === currentUser.id || msg.sender === currentUser.id;
                    const initials = msg.sender?.name
                      ? msg.sender.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : "TF";

                    return (
                      <div
                        key={msg._id || index}
                        className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${
                          isMe ? "ml-auto flex-row-reverse" : ""
                        }`}
                      >
                        {/* Avatar */}
                        {!isMe && (
                          <div className="w-8 h-8 rounded-lg bg-card-surface border border-border-slate flex items-center justify-center font-bold text-[10px] text-gray-400 shrink-0">
                            {initials}
                          </div>
                        )}

                        {/* Content text */}
                        <div className="space-y-1 text-xs">
                          {!isMe && selectedChat.type === "project" && (
                            <span className="text-[9px] text-primary-light font-bold block ml-1">
                              {msg.sender?.name || "Member"}
                            </span>
                          )}
                          <div
                            className={`p-3.5 rounded-card leading-normal text-xs md:text-sm whitespace-pre-wrap break-words ${
                              isMe
                                ? "bg-primary text-white rounded-tr-none shadow-subtle"
                                : "bg-card-surface text-gray-300 rounded-tl-none border border-border-slate"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className={`text-[9px] text-gray-500 block px-1.5 ${isMe ? "text-right" : ""}`}>
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>

              {/* Message Input Footer */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border-slate bg-bg-secondary flex gap-3 shrink-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow bg-card-surface border border-border-slate focus:border-primary rounded-input py-3 px-4 text-xs text-white placeholder:text-gray-500 outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-5 py-3 rounded-btn bg-primary text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-40 flex items-center justify-center cursor-pointer transition-colors duration-200"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center p-8 text-center bg-bg-secondary/20">
              <svg className="w-16 h-16 text-primary-light/20 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-bold text-white mb-2">My Messages</h3>
              <p className="text-gray-500 text-xs max-w-sm leading-relaxed">
                Select an active direct conversation or project team group channel to start messaging. Messaging is permitted between accepted applicants and project creators.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
