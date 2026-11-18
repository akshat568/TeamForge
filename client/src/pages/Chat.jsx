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
              return c.partner?.id === selectId || c.partner?._id === selectId;
            }
            if (selectType === "project" && c.type === "project") {
              return c.project?.id === selectId || c.project?._id === selectId;
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
    const chatId = chat.type === "direct" ? (chat.partner?.id || chat.partner?._id) : (chat.project?.id || chat.project?._id);
    const chatName = chat.type === "direct" ? chat.partner?.name : chat.project?.title;
    const chatDetails =
      chat.type === "direct"
        ? `${chat.partner?.college || "Campus"} • Yr ${chat.partner?.year || "1"}`
        : `${chat.project?.category || "Project"} Room`;

    const chatPayload = {
      type: chat.type,
      id: chatId,
      name: chatName,
      details: chatDetails,
    };

    setSelectedChat(chatPayload);
    setSearchParams({ type: chat.type, id: chatId });

    await fetchMessages(chatId, chat.type);
  };

  // ─── 3. FETCH HISTORICAL MESSAGES ─────────────────────────────────────────
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
      const handleDM = (message) => {
        const myId = currentUser?.id || currentUser?._id;
        const senderId = message.sender?._id || message.sender;
        const recipientId = message.recipient?._id || message.recipient;

        const isFromPartner = senderId === selectedChat.id;
        const isFromMe = senderId === myId && recipientId === selectedChat.id;

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
    const name = c.type === "direct" ? c.partner?.name : c.project?.title;
    return (name || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-bg-base text-primary-text pt-24 pb-8 px-4 sm:px-6 relative overflow-hidden flex items-center justify-center">
      <div className="w-full max-w-6xl h-[84vh] bg-card-surface border border-border-slate rounded-card overflow-hidden flex shadow-card relative z-10">
        {/* LEFT COLUMN: ACTIVE CHATS LIST */}
        <div className={`w-full md:w-80 border-r border-border-slate bg-[#FAF7F2] flex-col shrink-0 ${
          selectedChat ? "hidden md:flex" : "flex"
        }`}>
          {/* List Header Search */}
          <div className="p-4 border-b border-border-slate space-y-3 bg-white">
            <h2 className="text-base font-black text-primary-text tracking-tight">Active Messages</h2>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-[#FAF7F2] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2 pl-9 pr-3 text-xs text-primary-text placeholder:text-muted-text/60 outline-none transition-colors"
              />
              <svg className="w-3.5 h-3.5 text-muted-text absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Conversations feed */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {conversationsLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-3 bg-white border border-border-slate rounded-card animate-pulse h-16" />
              ))
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-muted-text text-xs font-semibold">
                No active conversations.
              </div>
            ) : (
              filteredConversations.map((chat) => {
                const targetId = chat.type === "direct" ? (chat.partner?.id || chat.partner?._id) : (chat.project?.id || chat.project?._id);
                const isSelected = selectedChat && selectedChat.id === targetId;
                const name = chat.type === "direct" ? chat.partner?.name : chat.project?.title;
                const details = chat.type === "direct" ? chat.partner?.college : "Team Room";
                const initials = (name || "TF").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

                return (
                  <button
                    key={chat.type + targetId}
                    onClick={() => handleSelectChat(chat)}
                    className={`w-full p-3 flex gap-3 items-center rounded-card transition-all text-left border cursor-pointer ${
                      isSelected
                        ? "bg-white border-primary shadow-subtle text-primary-text"
                        : "border-transparent text-primary-text hover:bg-white/70"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      chat.type === "direct"
                        ? "bg-primary/10 border border-primary/20 text-primary"
                        : "bg-[#242424] text-white"
                    }`}>
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-bold text-xs text-primary-text truncate pr-2">{name}</h4>
                        <span className="text-[10px] text-muted-text shrink-0">{formatDate(chat.lastMessageTime)}</span>
                      </div>
                      <p className="text-[10px] text-muted-text truncate font-medium">{details}</p>
                      <p className="text-[11px] text-muted-text truncate">{chat.lastMessage}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CONVERSATION BOX */}
        <div className={`flex-grow bg-card-surface flex-col h-full min-w-0 ${
          !selectedChat ? "hidden md:flex" : "flex"
        }`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border-slate bg-card-surface flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden p-1.5 rounded-lg hover:bg-[#FAF7F2] text-muted-text hover:text-charcoal transition-colors cursor-pointer"
                    title="Back to conversations"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-primary-text text-sm tracking-tight">{selectedChat.name}</h3>
                    <p className="text-[10px] text-muted-text font-medium">{selectedChat.details}</p>
                  </div>
                </div>
                {error && (
                  <span className="text-danger text-xs font-semibold border border-danger/20 bg-danger/10 px-2.5 py-1 rounded-lg">
                    {error}
                  </span>
                )}
              </div>

              {/* Chat messages roll */}
              <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-3.5 bg-[#FAF7F2]/30 custom-scrollbar">
                {messagesLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const myId = currentUser?.id || currentUser?._id;
                    const senderId = msg.sender?._id || msg.sender;
                    const isMe = senderId === myId;
                    const initials = msg.sender?.name
                      ? msg.sender.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : "TF";

                    return (
                      <div
                        key={msg._id || index}
                        className={`flex gap-2.5 max-w-[85%] md:max-w-[70%] ${
                          isMe ? "ml-auto flex-row-reverse" : ""
                        }`}
                      >
                        {!isMe && (
                          <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-[10px] text-primary shrink-0 mt-0.5">
                            {initials}
                          </div>
                        )}

                        <div className="space-y-1 text-xs">
                          {!isMe && selectedChat.type === "project" && (
                            <span className="text-[10px] text-primary font-bold block ml-1">
                              {msg.sender?.name || "Member"}
                            </span>
                          )}
                          <div
                            className={`p-3 rounded-card leading-normal text-xs md:text-sm whitespace-pre-wrap break-words ${
                              isMe
                                ? "bg-primary text-white rounded-tr-xs shadow-subtle"
                                : "bg-card-surface text-primary-text rounded-tl-xs border border-border-slate shadow-subtle"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className={`text-[9px] text-muted-text block px-1.5 ${isMe ? "text-right" : ""}`}>
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
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-border-slate bg-card-surface flex gap-2.5 shrink-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow bg-[#FAF7F2] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2.5 px-4 text-xs text-primary-text placeholder:text-muted-text/60 outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-5 py-2.5 rounded-btn bg-primary text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-40 flex items-center justify-center cursor-pointer shadow-subtle transition-all duration-200"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center p-8 text-center bg-[#FAF7F2]/20">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl mb-4 shadow-inner-soft">
                💬
              </div>
              <h3 className="text-lg font-black text-primary-text mb-1">Select a Conversation</h3>
              <p className="text-muted-text text-xs max-w-sm leading-relaxed">
                Choose a direct message channel or project workspace group room to begin collaborating with your team.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
