import { useState, useEffect, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import commentService from "../../services/commentService";
import api from "../../services/api";

const TaskComments = ({ taskId, projectId, currentUser }) => {
  const { socket } = useSocket();
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingMessage, setEditingMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const textareaRef = useRef(null);
  const mentionsRef = useRef(null);

  // 1. Fetch initial task comments & project team members
  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await commentService.getTaskComments(taskId);
        if (res.data.success) {
          setComments(res.data.comments);
        }
      } catch (err) {
        setError(err.message || "Failed to load comments.");
      } finally {
        setLoading(false);
      }
    };

    const loadTeamMembers = async () => {
      try {
        const res = await api.get(`/projects/${projectId}/team`);
        if (res.data.success) {
          setTeamMembers(res.data.members);
        }
      } catch (err) {
        console.error("Failed to load project team members for mentions:", err);
      }
    };

    loadComments();
    loadTeamMembers();
  }, [taskId, projectId]);

  // 2. Real-Time Socket Event Handling
  useEffect(() => {
    if (!socket) return;

    const handleCommentCreated = (newComment) => {
      if (newComment.task.toString() === taskId.toString()) {
        setComments((prev) => {
          if (prev.some((c) => c._id === newComment._id)) return prev;
          return [...prev, newComment];
        });
      }
    };

    const handleCommentUpdated = (updatedComment) => {
      if (updatedComment.task.toString() === taskId.toString()) {
        setComments((prev) =>
          prev.map((c) => (c._id === updatedComment._id ? updatedComment : c))
        );
      }
    };

    const handleCommentDeleted = ({ commentId, taskId: eventTaskId }) => {
      if (eventTaskId.toString() === taskId.toString()) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
    };

    socket.on("comment_created", handleCommentCreated);
    socket.on("comment_updated", handleCommentUpdated);
    socket.on("comment_deleted", handleCommentDeleted);

    return () => {
      socket.off("comment_created", handleCommentCreated);
      socket.off("comment_updated", handleCommentUpdated);
      socket.off("comment_deleted", handleCommentDeleted);
    };
  }, [socket, taskId]);

  // 3. Mentions Auto-Complete Logic
  const handleTextareaInput = (e) => {
    const val = e.target.value;
    setMessage(val);

    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, selectionStart);
    const words = textBeforeCursor.split(/[\s\n]/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith("@")) {
      setShowMentions(true);
      setMentionFilter(lastWord.slice(1).toLowerCase());
      setActiveMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (member) => {
    const val = message;
    const selectionStart = textareaRef.current.selectionStart;
    const textBeforeCursor = val.slice(0, selectionStart);
    const textAfterCursor = val.slice(selectionStart);
    
    const words = textBeforeCursor.split(/[\s\n]/);
    words.pop(); // Remove the typed @term
    
    const newTextBeforeCursor = [...words, `@${member.name} `].join(" ");
    setMessage(newTextBeforeCursor + textAfterCursor);
    setShowMentions(false);

    // Refocus and place cursor after inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPosition = newTextBeforeCursor.length;
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 50);
  };

  const handleKeyDown = (e) => {
    if (showMentions) {
      const filtered = getFilteredMembers();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[activeMentionIndex]) {
          insertMention(filtered[activeMentionIndex]);
        }
      } else if (e.key === "Escape") {
        setShowMentions(false);
      }
    }
  };

  const getFilteredMembers = () => {
    return teamMembers.filter((m) =>
      m.name.toLowerCase().includes(mentionFilter)
    );
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setError("");
      await commentService.createComment(taskId, message.trim());
      setMessage("");
    } catch (err) {
      setError(err.message || "Failed to post comment.");
    }
  };

  const handleSaveEdit = async (commentId) => {
    if (!editingMessage.trim()) return;
    try {
      await commentService.updateComment(commentId, editingMessage.trim());
      setEditingCommentId(null);
      setEditingMessage("");
    } catch (err) {
      setError(err.message || "Failed to edit comment.");
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await commentService.deleteComment(commentId);
    } catch (err) {
      setError(err.message || "Failed to delete comment.");
    }
  };

  // 4. Mention Parser / Highlight
  const renderMessageContent = (msgText) => {
    const parts = msgText.split(/(@[a-zA-Z0-9_\s.-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        const nameCandidate = part.replace("@", "").trim();
        const isProjectMember = teamMembers.some((m) => m.name.toLowerCase() === nameCandidate.toLowerCase());
        
        if (isProjectMember) {
          return (
            <span
              key={index}
              className="bg-primary/20 text-primary-light font-bold rounded px-1.5 py-0.5 border border-primary/20"
            >
              {part}
            </span>
          );
        }
      }
      return part;
    });
  };

  return (
    <div className="space-y-6 flex flex-col h-full justify-between">
      
      {/* Comments List scroll area */}
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
        {comments.length > 0 ? (
          comments.map((comment) => {
            const isAuthor = currentUser && comment.author?._id === currentUser.id;
            const isEditing = editingCommentId === comment._id;

            return (
              <div key={comment._id} className="flex gap-3 bg-bg-secondary/40 border border-border-slate/50 p-4 rounded-card">
                
                {/* Author Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden border border-border-slate bg-bg-base shrink-0">
                  {comment.author?.profilePicture ? (
                    <img src={comment.author.profilePicture} alt={comment.author.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-primary/20 text-primary-light">
                      {comment.author?.name ? comment.author.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "TF"}
                    </div>
                  )}
                </div>

                {/* Comment Body */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-white text-xs">{comment.author?.name}</span>
                      <span className="text-[10px] text-gray-500 ml-2">
                        {new Date(comment.createdAt).toLocaleString()}
                        {comment.edited && <span className="italic ml-1">(edited)</span>}
                      </span>
                    </div>

                    {/* Actions dropdown/buttons */}
                    {isAuthor && !isEditing && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingCommentId(comment._id);
                            setEditingMessage(comment.message);
                          }}
                          className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(comment._id)}
                          className="text-[10px] text-danger/80 hover:text-danger transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={editingMessage}
                        onChange={(e) => setEditingMessage(e.target.value)}
                        className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input p-2 text-white text-xs outline-none resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="px-2.5 py-1 bg-transparent border border-border-slate rounded text-[10px] text-gray-300 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(comment._id)}
                          className="px-3 py-1 bg-primary hover:bg-primary-hover text-white rounded text-[10px] font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white/85 text-xs leading-relaxed whitespace-pre-wrap">
                      {renderMessageContent(comment.message)}
                    </p>
                  )}

                </div>

              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500 text-xs">
            💬 No comments posted yet. Start the discussion below!
          </div>
        )}
      </div>

      {/* Input Form area */}
      <div className="relative pt-4 border-t border-border-slate/40 mt-4">
        {error && (
          <div className="p-2 bg-danger/10 border border-danger/20 text-danger text-[10px] rounded mb-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSendComment} className="relative flex items-end gap-2">
          <div className="relative flex-1">
            
            {/* Mentions Auto-complete Dropdown */}
            {showMentions && getFilteredMembers().length > 0 && (
              <div
                ref={mentionsRef}
                className="absolute bottom-full mb-2 left-0 w-60 bg-bg-secondary border border-border-slate rounded-card shadow-premium max-h-40 overflow-y-auto z-50 p-1"
              >
                {getFilteredMembers().map((member, index) => (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => insertMention(member)}
                    className={`w-full text-left px-3 py-2 rounded text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                      index === activeMentionIndex ? "bg-primary text-white" : "hover:bg-hover-surface text-gray-300"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-border-slate bg-bg-base shrink-0">
                      {member.profilePicture ? (
                        <img src={member.profilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-[9px] bg-primary/20 text-primary-light">
                          {member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <span className="truncate">{member.name}</span>
                  </button>
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              rows={2}
              value={message}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Post a comment... Use @name to mention a teammate"
              className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input px-3.5 py-2.5 text-white text-xs outline-none resize-none placeholder:text-gray-500"
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim()}
            className="px-4 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-btn text-xs font-bold transition-colors cursor-pointer shrink-0 h-10 flex items-center justify-center"
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
};

export default TaskComments;
