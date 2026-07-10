import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateTasks,
  getProjectSummary,
  getSprintPlan,
  getReadme,
  getDocumentation,
  getDailyStandup,
  getProjectHealth,
  chatWithAi,
  getPromptHistory,
} from "../../services/aiService";
import { createTask } from "../../services/taskService";

const AiAssistant = ({ projectId, existingTasks = [], onTaskCreated }) => {
  // Chat states
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your AI Workspace Assistant. Ask me questions about the team, tasks, and resource list, or click a Quick Action to run project analysis.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [historyItems, setHistoryItems] = useState([]);

  // Active generation results
  const [activeOutput, setActiveOutput] = useState(null); // { type, data }
  const [suggestedActions, setSuggestedActions] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(""); // "tasks", "summary", etc.
  const [progressText, setProgressText] = useState("");
  
  // Abort controller for cancellation
  const abortControllerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Typewriter output states
  const [displayedText, setDisplayedText] = useState("");
  const typewriterTimerRef = useRef(null);

  // ─── 1. INITIAL LOAD HISTORY ─────────────────────────────────────────────
  const fetchHistory = async () => {
    try {
      const res = await getPromptHistory(projectId);
      if (res.success) {
        setHistoryItems(res.history);
      }
    } catch (e) {
      console.error("Failed to load prompt history:", e.message);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [projectId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, loading]);

  // ─── 2. TYPEWRITER EFFECT ────────────────────────────────────────────────
  const runTypewriter = (text, callback) => {
    clearInterval(typewriterTimerRef.current);
    setDisplayedText("");
    if (!text) return;

    let index = 0;
    const speed = text.length > 500 ? 5 : 12; // Speed up long texts

    typewriterTimerRef.current = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(typewriterTimerRef.current);
        if (callback) callback();
      }
    }, speed);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearInterval(typewriterTimerRef.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ─── 3. REQUEST CANCELLATION ─────────────────────────────────────────────
  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setLoadingType("");
      setProgressText("Generation canceled by user");
      clearInterval(typewriterTimerRef.current);
      setDisplayedText("Request Aborted. AI generation was canceled.");
    }
  };

  // ─── 4. GENERAL RUNNER WRAPPER ───────────────────────────────────────────
  const runAiRequest = async (type, apiCall, followUpSuggestions = []) => {
    if (loading) return;
    
    // Set up abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setLoadingType(type);
    setDisplayedText("");
    setProgressText("Initializing AI model handshake...");

    try {
      // Estimated timeline ticks
      const progressSteps = [
        "Constructing workspace context maps...",
        "Evaluating sprint Kanban backlogs...",
        "Querying OpenAI Provider tokens...",
        "Generating structured response...",
      ];
      
      let stepIndex = 0;
      const progressTimer = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          setProgressText(progressSteps[stepIndex]);
          stepIndex++;
        }
      }, 2500);

      const response = await apiCall(signal);
      clearInterval(progressTimer);
      
      setLoading(false);
      setLoadingType("");
      setProgressText("");

      // Render output with typewriter effect
      let outputData = response;
      if (type === "summary" && response && response.data) {
        outputData = response.data;
      }
      setActiveOutput({ type, data: outputData });
      setSuggestedActions(followUpSuggestions);

      // Trigger history reload
      fetchHistory();

    } catch (err) {
      if (err.name === "CanceledError" || err.message === "canceled" || signal.aborted) {
        console.log("Axios request aborted by client.");
        return;
      }
      console.error(err);
      setLoading(false);
      setLoadingType("");
      setProgressText("");
      setDisplayedText(`Error: ${err.response?.data?.message || err.message || "Failed to communicate with AI."}`);
      setActiveOutput({ type: "error", data: { message: err.message } });
    }
  };

  // ─── 5. QUICK ACTIONS TRIGGERS ───────────────────────────────────────────
  const handleGenerateTasks = () => {
    runAiRequest(
      "tasks",
      (signal) => generateTasks(projectId, signal),
      ["Documentation", "Sprint Plan", "Daily Standup"]
    );
  };

  const handleGetSummary = () => {
    runAiRequest(
      "summary",
      (signal) => getProjectSummary(projectId, signal),
      ["Daily Standup", "Health Score"]
    );
  };

  const handleGetSprintPlan = () => {
    runAiRequest(
      "sprintPlan",
      (signal) => getSprintPlan(projectId, signal),
      ["README", "Documentation"]
    );
  };

  const handleGetReadme = () => {
    runAiRequest(
      "readme",
      (signal) => getReadme(projectId, signal),
      ["Documentation", "Sprint Plan"]
    );
  };

  const handleGetDocumentation = () => {
    runAiRequest(
      "documentation",
      (signal) => getDocumentation(projectId, signal),
      ["README", "Sprint Plan"]
    );
  };

  const handleGetDailyStandup = () => {
    runAiRequest(
      "standup",
      (signal) => getDailyStandup(projectId, signal),
      ["Summary", "Health Score"]
    );
  };

  const handleGetHealth = () => {
    runAiRequest(
      "health",
      (signal) => getProjectHealth(projectId, signal),
      ["Summary", "Daily Standup", "Generate Tasks"]
    );
  };

  // ─── 6. FREE-FORM WORKSPACE CHAT ────────────────────────────────────────
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userMessage = chatInput;
    setChatInput("");
    
    // Add user message to screen
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    
    // Setup abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setLoadingType("chat");

    try {
      // Gather last 4 chat messages for history
      const history = chatMessages.slice(-4).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const res = await chatWithAi(projectId, userMessage, history, signal);
      setLoading(false);
      setLoadingType("");
      
      // Append AI response
      setChatMessages((prev) => [...prev, { role: "assistant", content: res.response }]);
      setSuggestedActions(["Generate Tasks", "Daily Standup"]);
      fetchHistory();
    } catch (err) {
      if (err.name === "CanceledError" || signal.aborted) return;
      setLoading(false);
      setLoadingType("");
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Failed to answer: ${err.response?.data?.message || err.message}` },
      ]);
    }
  };

  // ─── 7. HISTORY LOADER / REOPEN ──────────────────────────────────────────
  const handleReopenHistory = (item) => {
    const typeMap = {
      "generate-tasks": "tasks",
      "project-summary": "summary",
      "sprint-plan": "sprintPlan",
      "readme": "readme",
      "documentation": "documentation",
      "daily-standup": "standup",
      "project-health": "health",
      "chat": "chatResponse",
    };

    const type = typeMap[item.actionType] || "summary";
    const rawPayload = item.responsePayload;

    if (type === "chatResponse") {
      setChatMessages((prev) => [
        ...prev,
        { role: "user", content: item.promptText },
        { role: "assistant", content: rawPayload.response || "No data recorded" },
      ]);
      setActiveOutput(null);
    } else {
      let payload = rawPayload;
      if (type === "tasks" && rawPayload.tasks) payload = rawPayload;
      if (type === "summary" && rawPayload.data) payload = rawPayload.data;
      if (type === "sprintPlan" && rawPayload.weeks) payload = rawPayload;
      
      setActiveOutput({
        type,
        data: payload,
      });
      
      const suggestionMap = {
        tasks: ["Documentation", "Sprint Plan"],
        summary: ["Daily Standup", "Health Score"],
        sprintPlan: ["README", "Documentation"],
        readme: ["Documentation"],
        documentation: ["README"],
        standup: ["Summary"],
        health: ["Summary", "Daily Standup"],
      };
      setSuggestedActions(suggestionMap[type] || []);
    }
  };

  // ─── 8. KANBAN TASK DISPATCHER ACTIONS ───────────────────────────────────
  const handleCreateTaskItem = async (taskItem) => {
    const isDuplicate = existingTasks.some(
      (t) => t.title.toLowerCase().trim() === taskItem.title.toLowerCase().trim()
    );
    if (isDuplicate) {
      alert(`"${taskItem.title}" is already on your Kanban board! Skipping to avoid duplication.`);
      return;
    }

    try {
      const res = await createTask(projectId, {
        title: taskItem.title,
        description: taskItem.description,
        priority: taskItem.priority || "Medium",
        status: "Todo",
      });
      if (res.success) {
        if (onTaskCreated) onTaskCreated(res.task);
        alert(`Successfully created task: "${taskItem.title}"`);
      }
    } catch (e) {
      alert(`Failed to create task: ${e.message}`);
    }
  };

  const handleCreateAllTasks = async (taskList) => {
    if (!taskList || taskList.length === 0) return;

    let createdCount = 0;
    let skippedCount = 0;

    for (const t of taskList) {
      const isDuplicate = existingTasks.some(
        (exist) => exist.title.toLowerCase().trim() === t.title.toLowerCase().trim()
      );
      if (isDuplicate) {
        skippedCount++;
        continue;
      }

      try {
        await createTask(projectId, {
          title: t.title,
          description: t.description,
          priority: t.priority || "Medium",
          status: "Todo",
        });
        createdCount++;
      } catch (e) {
        console.error("Failed to batch create task:", t.title, e.message);
      }
    }

    alert(`Batch task creation complete!\nCreated: ${createdCount} task(s)\nSkipped (Duplicates): ${skippedCount} task(s)`);
    if (onTaskCreated) onTaskCreated();
  };

  // ─── 9. MARKDOWN DOWNLOAD UTILITIES ─────────────────────────────────────
  const downloadMarkdownFile = (filename, content) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 min-h-[500px] z-10 relative">
      
      {/* LEFT COLUMN: CONVERSATIONAL CHAT & HISTORY */}
      <div className="w-full xl:w-96 flex flex-col gap-6 shrink-0">
        
        {/* Workspace Chat Panel */}
        <div className="bg-bg-secondary border border-border-slate rounded-card p-4 flex flex-col h-[380px] shadow-subtle">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary-light border-b border-border-slate pb-2 mb-3">
            AI Teammate Chat
          </h3>
          
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-card px-3.5 py-2.5 leading-relaxed break-words shadow-subtle ${
                    msg.role === "user"
                      ? "bg-primary text-white font-medium animate-none"
                      : "bg-card-surface border border-border-slate text-gray-300"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && loadingType === "chat" && (
              <div className="flex justify-start">
                <div className="bg-card-surface border border-border-slate text-primary rounded-card px-4 py-3 flex items-center gap-1.5 shadow-subtle">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSendChatMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask me about this workspace..."
              className="flex-1 bg-card-surface border border-border-slate focus:border-primary rounded-input px-3 py-2 text-xs text-white outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !chatInput.trim()}
              className="px-3.5 py-2 rounded-btn bg-primary text-xs font-bold text-white hover:bg-primary-hover transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              Ask
            </button>
          </form>
        </div>

        {/* Prompt History Panel */}
        <div className="bg-bg-secondary border border-border-slate rounded-card p-4 flex flex-col h-[280px] shadow-subtle">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary-light border-b border-border-slate pb-2 mb-3">
            Prompt History Archive
          </h3>
          
          {historyItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <span className="text-gray-500 text-xs italic">No history records found</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {historyItems.map((item) => {
                const date = new Date(item.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={item._id}
                    className="p-2.5 bg-card-surface border border-border-slate hover:bg-hover-surface rounded-card flex justify-between items-center transition-all duration-200 group"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] bg-primary/10 text-primary-light px-1.5 py-0.5 rounded border border-primary/20 font-bold uppercase">
                        {item.actionType.replace("-", " ")}
                      </span>
                      <p className="text-[10px] text-gray-300 mt-1 truncate font-medium">
                        {item.promptText}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleReopenHistory(item)}
                      className="px-2.5 py-1 bg-primary/10 text-primary-light hover:bg-primary hover:text-white rounded-btn text-[9px] font-bold transition-all ml-2 cursor-pointer"
                    >
                      Reopen
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: QUICK ACTIONS DASHBOARD */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        
        {/* Quick Action Tiles Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Tasks", fn: handleGenerateTasks, type: "tasks" },
            { label: "Summary", fn: handleGetSummary, type: "summary" },
            { label: "Sprint Plan", fn: handleGetSprintPlan, type: "sprintPlan" },
            { label: "README", fn: handleGetReadme, type: "readme" },
            { label: "Docs", fn: handleGetDocumentation, type: "documentation" },
            { label: "Standup", fn: handleGetDailyStandup, type: "standup" },
            { label: "Health", fn: handleGetHealth, type: "health" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={action.fn}
              disabled={loading}
              className={`px-3 py-2.5 rounded-btn border font-bold text-xs hover:scale-[1.02] transition-all duration-200 text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                loadingType === action.type
                  ? "bg-primary border-primary text-white shadow-subtle"
                  : "bg-bg-secondary border-border-slate text-gray-400 hover:text-white hover:border-primary"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Output Panel Screen */}
        <div className="flex-grow bg-bg-secondary border border-border-slate rounded-modal p-6 flex flex-col min-h-[400px] shadow-premium relative overflow-hidden">
          
          {/* CANCELLATION LAYER OVERLAY */}
          {loading && (
            <div className="absolute inset-0 bg-bg-base/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <div className="space-y-1">
                <h4 className="font-black text-sm text-white tracking-tight animate-pulse">
                  AI Generator is building assets...
                </h4>
                <p className="text-xs text-gray-400 font-medium italic">{progressText}</p>
              </div>
              
              <button
                onClick={handleCancelGeneration}
                className="px-5 py-2.5 rounded-btn border border-danger/20 hover:border-danger bg-danger/10 text-danger hover:bg-danger hover:text-white text-xs font-bold transition-all duration-200 cursor-pointer"
              >
                Cancel Generation
              </button>
            </div>
          )}

          {/* DYNAMIC RENDERING OUTPUTS CARD */}
          {!activeOutput ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light font-black text-lg">
                🤖
              </div>
              <h3 className="font-bold text-white text-sm">No Action Running</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Click any of the Quick Action buttons above to generate tasks, documents, standups, or health metrics.
              </p>
            </div>
          ) : (
            <div className="flex-grow flex flex-col space-y-4 h-full">
              
              {/* Output Header */}
              <div className="flex justify-between items-center border-b border-border-slate pb-3 shrink-0">
                <span className="text-xs font-bold text-primary-light uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
                  Generated {activeOutput.type}
                </span>
                
                {/* Global copy/downloads for markdown formats */}
                {(activeOutput.type === "readme" || activeOutput.type === "documentation") && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(activeOutput.data.markdown)}
                      className="px-3 py-1.5 rounded-lg border border-border-slate hover:bg-hover-surface text-xs text-gray-300 hover:text-white font-semibold transition-colors cursor-pointer"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() =>
                        downloadMarkdownFile(
                          `${activeOutput.type === "readme" ? "README" : "ARCHITECTURE"}.md`,
                          activeOutput.data.markdown
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-xs font-bold text-white hover:opacity-90 transition-all cursor-pointer"
                    >
                      Download
                    </button>
                  </div>
                )}

                {activeOutput.type === "tasks" && (
                  <button
                    onClick={() => handleCreateAllTasks(activeOutput.data.tasks)}
                    className="px-4 py-1.5 rounded-btn bg-primary hover:bg-primary-hover text-xs font-bold text-white hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    Create All Tasks
                  </button>
                )}
              </div>

              {/* Output Content Card */}
              <div className="flex-1 overflow-y-auto pr-1">
                
                {/* 1. TASKS LIST SUGGESTIONS */}
                {activeOutput.type === "tasks" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeOutput.data.tasks?.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-card-surface/50 border border-border-slate rounded-card flex flex-col justify-between shadow-subtle"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                              t.priority === "High"
                                ? "bg-danger/10 text-danger border-danger/20"
                                : t.priority === "Medium"
                                ? "bg-warning/10 text-warning border-warning/20"
                                : "bg-primary/10 text-primary-light border-primary/20"
                            }`}>
                              {t.priority}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-white leading-snug">{t.title}</h4>
                          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{t.description}</p>
                        </div>
                        
                        <div className="border-t border-border-slate/50 pt-3 mt-3 flex justify-between items-center">
                          <span className="text-[10px] text-primary-light font-bold">Todo Column</span>
                          <button
                            onClick={() => handleCreateTaskItem(t)}
                            className="px-3 py-1 bg-primary/10 text-primary-light hover:bg-primary hover:text-white rounded-btn text-[9px] font-bold transition-all cursor-pointer"
                          >
                            + Add Card
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. SUMMARY CARD */}
                {activeOutput.type === "summary" && (
                  <div className="space-y-4">
                    <div className="bg-card-surface border border-border-slate rounded-card p-5 space-y-2">
                      <h4 className="text-xs font-bold text-primary-light uppercase tracking-widest">Workspace Overview</h4>
                      <p className="text-xs text-gray-300 leading-relaxed font-medium">
                        {activeOutput.data.summary}
                      </p>
                    </div>
                    <div className="bg-card-surface border border-border-slate rounded-card p-5 space-y-2">
                      <h4 className="text-xs font-bold text-warning uppercase tracking-widest">Progress Metrics</h4>
                      <p className="text-xs text-gray-300 leading-relaxed font-medium">
                        {activeOutput.data.progress}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-card-surface border border-border-slate rounded-card p-5 space-y-2">
                        <h4 className="text-xs font-bold text-danger uppercase tracking-widest">Risks & Blockers</h4>
                        <p className="text-xs text-gray-300 leading-relaxed font-medium">
                          {activeOutput.data.risks}
                        </p>
                      </div>
                      <div className="bg-card-surface border border-border-slate rounded-card p-5 space-y-2">
                        <h4 className="text-xs font-bold text-success uppercase tracking-widest">AI Recommendations</h4>
                        <p className="text-xs text-gray-300 leading-relaxed font-medium whitespace-pre-line">
                          {activeOutput.data.suggestions}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SPRINT PLAN WEEK ROADMAP */}
                {activeOutput.type === "sprintPlan" && (
                  <div className="relative border-l border-border-slate pl-6 ml-3 space-y-6 my-4">
                    {activeOutput.data.weeks?.map((w, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[31px] w-2.5 h-2.5 rounded-full bg-primary border border-bg-base" />
                        <div className="bg-card-surface border border-border-slate rounded-card p-5">
                          <h4 className="text-xs font-black text-primary-light">
                            Week {w.week} — {w.title}
                          </h4>
                          <ul className="mt-3 space-y-1.5">
                            {w.tasks?.map((tsk, taskIdx) => (
                              <li key={taskIdx} className="text-xs text-gray-400 flex items-start gap-2 leading-relaxed">
                                <span className="text-primary font-bold">•</span>
                                {tsk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. MARKDOWN TEXT PREVIEWS */}
                {(activeOutput.type === "readme" || activeOutput.type === "documentation") && (
                  <div className="bg-bg-base border border-border-slate rounded-card p-4 overflow-x-auto shadow-inner">
                    <pre className="text-[10px] text-primary-light font-mono leading-relaxed whitespace-pre-wrap select-all">
                      {activeOutput.data.markdown}
                    </pre>
                  </div>
                )}

                {/* 5. DAILY STANDUP */}
                {activeOutput.type === "standup" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-primary/5 border border-primary/20 rounded-card p-5 space-y-2">
                      <h4 className="text-xs font-bold text-primary-light uppercase tracking-widest border-b border-primary/20 pb-2">
                        Yesterday
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed font-medium">
                        {activeOutput.data.yesterday}
                      </p>
                    </div>
                    <div className="bg-warning/5 border border-warning/20 rounded-card p-5 space-y-2">
                      <h4 className="text-xs font-bold text-warning uppercase tracking-widest border-b border-warning/20 pb-2">
                        Today
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed font-medium">
                        {activeOutput.data.today}
                      </p>
                    </div>
                    <div className="bg-danger/5 border border-danger/20 rounded-card p-5 space-y-2">
                      <h4 className="text-xs font-bold text-danger uppercase tracking-widest border-b border-danger/20 pb-2">
                        Blockers
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed font-medium">
                        {activeOutput.data.blockers}
                      </p>
                    </div>
                  </div>
                )}

                {/* 6. HEALTH SCORE circular gauge */}
                {activeOutput.type === "health" && (
                  <div className="flex flex-col lg:flex-row gap-6 items-center">
                    
                    {/* circular meter */}
                    <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#334155" strokeWidth="8" />
                        <circle
                           cx="50"
                           cy="50"
                           r="40"
                           fill="transparent"
                           stroke="url(#blueGradient)"
                           strokeWidth="8"
                           strokeDasharray={251.2}
                           strokeDashoffset={251.2 - (251.2 * activeOutput.data.healthScore) / 100}
                           strokeLinecap="round"
                           className="transition-all duration-1000"
                        />
                        <defs>
                          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2563EB" />
                            <stop offset="100%" stopColor="#60A5FA" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-black text-white">{activeOutput.data.healthScore}%</span>
                        <span className="text-[10px] text-primary-light font-bold uppercase tracking-wider">
                          {activeOutput.data.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 flex-1">
                      <div className="bg-card-surface border border-border-slate rounded-card p-5 space-y-2">
                        <h4 className="text-xs font-bold text-primary-light uppercase tracking-wider">
                          Health Check Feedback
                        </h4>
                        <p className="text-xs text-gray-300 leading-relaxed font-medium">
                          {activeOutput.data.suggestions}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Suggested Follow-up Actions row */}
              {suggestedActions.length > 0 && (
                <div className="border-t border-border-slate pt-4 mt-auto shrink-0 flex items-center gap-3 overflow-x-auto">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0">
                    Suggested Actions:
                  </span>
                  
                  {suggestedActions.map((act) => {
                    const fnMap = {
                      "Tasks": handleGenerateTasks,
                      "Generate Tasks": handleGenerateTasks,
                      "Summary": handleGetSummary,
                      "Sprint Plan": handleGetSprintPlan,
                      "README": handleGetReadme,
                      "Documentation": handleGetDocumentation,
                      "Daily Standup": handleGetDailyStandup,
                      "Health Score": handleGetHealth,
                    };
                    const triggerFn = fnMap[act];
                    if (!triggerFn) return null;
                    return (
                      <button
                        key={act}
                        onClick={triggerFn}
                        className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary hover:text-white text-primary-light text-[10px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap"
                      >
                        {act}
                      </button>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default AiAssistant;
