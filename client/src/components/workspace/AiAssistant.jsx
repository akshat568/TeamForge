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
      content: "Hello! I am your AI Workspace Copilot. Ask me about tasks, project milestones, or click a Quick Action above to plan sprints and generate specifications.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [historyItems, setHistoryItems] = useState([]);

  // Active generation results
  const [activeOutput, setActiveOutput] = useState(null);
  const [suggestedActions, setSuggestedActions] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [progressText, setProgressText] = useState("");
  
  const abortControllerRef = useRef(null);
  const chatEndRef = useRef(null);
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
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setLoadingType(type);
    setDisplayedText("");
    setProgressText("Connecting to Gemini AI engine...");

    try {
      const progressSteps = [
        "Analyzing workspace repository & backlogs...",
        "Formulating structured task cards...",
        "Evaluating sprint dependencies...",
        "Synthesizing production recommendations...",
      ];
      
      let stepIndex = 0;
      const progressTimer = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          setProgressText(progressSteps[stepIndex]);
          stepIndex++;
        }
      }, 2000);

      const response = await apiCall(signal);
      clearInterval(progressTimer);
      
      setLoading(false);
      setLoadingType("");
      setProgressText("");

      let outputData = response;
      if (type === "summary" && response && response.data) {
        outputData = response.data;
      }
      setActiveOutput({ type, data: outputData });
      setSuggestedActions(followUpSuggestions);

      fetchHistory();

    } catch (err) {
      if (err.name === "CanceledError" || err.message === "canceled" || signal.aborted) {
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
    
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setLoadingType("chat");

    try {
      const history = chatMessages.slice(-4).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const res = await chatWithAi(projectId, userMessage, history, signal);
      setLoading(false);
      setLoadingType("");
      
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
        alert(`Successfully added task to board: "${taskItem.title}"`);
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
    <div className="flex flex-col xl:flex-row gap-6 min-h-[500px]">
      
      {/* LEFT COLUMN: CONVERSATIONAL CHAT & HISTORY */}
      <div className="w-full xl:w-96 flex flex-col gap-5 shrink-0">
        
        {/* Workspace Chat Panel */}
        <div className="bg-[#FAF8F4] border border-border-slate rounded-card p-4 flex flex-col h-[380px] shadow-subtle">
          <div className="flex items-center justify-between border-b border-border-slate pb-2.5 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
              <span className="text-primary font-black">AI</span>
              <span>Copilot Chat</span>
            </h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs mb-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-card px-3.5 py-2.5 leading-relaxed break-words shadow-subtle ${
                    msg.role === "user"
                      ? "bg-primary text-white font-medium"
                      : "bg-white border border-border-slate text-charcoal font-medium"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && loadingType === "chat" && (
              <div className="flex justify-start">
                <div className="bg-white border border-border-slate text-primary rounded-card px-3.5 py-2.5 flex items-center gap-1.5 shadow-subtle">
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
              placeholder="Ask about tasks, sprints..."
              className="flex-1 bg-white border border-border-slate focus:border-primary rounded-input px-3 py-2 text-xs text-charcoal outline-none placeholder:text-text-muted"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !chatInput.trim()}
              className="px-3.5 py-2 rounded-btn bg-primary text-xs font-bold text-white hover:bg-primary-hover shadow-orange-sm transition-all cursor-pointer disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>

        {/* Prompt History Panel */}
        <div className="bg-[#FAF8F4] border border-border-slate rounded-card p-4 flex flex-col h-[260px] shadow-subtle">
          <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal border-b border-border-slate pb-2.5 mb-2.5">
            Prompt History Archive
          </h3>
          
          {historyItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <span className="text-text-muted text-xs italic">No prior prompts recorded</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {historyItems.map((item) => (
                <div
                  key={item._id}
                  className="p-2.5 bg-white border border-border-slate hover:border-primary/40 rounded-card flex justify-between items-center transition-all shadow-subtle group"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] bg-primary-tint text-primary px-1.5 py-0.5 rounded border border-primary/20 font-bold uppercase">
                      {item.actionType.replace("-", " ")}
                    </span>
                    <p className="text-[11px] text-charcoal mt-1 truncate font-medium">
                      {item.promptText}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleReopenHistory(item)}
                    className="px-2 py-1 bg-[#F8F5EF] hover:bg-primary hover:text-white rounded text-[10px] font-bold text-text-secondary transition-all ml-2 cursor-pointer shrink-0"
                  >
                    Reopen
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: QUICK ACTIONS DASHBOARD */}
      <div className="flex-1 flex flex-col gap-5 min-w-0">
        
        {/* Quick Action Tiles Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
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
              className={`px-2.5 py-2 rounded-btn border text-xs font-bold transition-all text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                loadingType === action.type
                  ? "bg-primary border-primary text-white shadow-orange-sm"
                  : "bg-white border-border-slate text-charcoal hover:border-primary/50 hover:bg-primary-tint"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Output Panel Screen */}
        <div className="flex-grow bg-[#FAF8F4] border border-border-slate rounded-card p-6 flex flex-col min-h-[400px] shadow-subtle relative overflow-hidden">
          
          {/* CANCELLATION LAYER OVERLAY */}
          {loading && (
            <div className="absolute inset-0 bg-white/92 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="space-y-1">
                <h4 className="font-black text-sm text-charcoal tracking-tight">
                  Gemini AI Copilot is building output...
                </h4>
                <p className="text-xs text-text-muted font-medium italic">{progressText}</p>
              </div>
              
              <button
                onClick={handleCancelGeneration}
                className="px-4 py-2 rounded-btn border border-red-200 bg-red-50 text-danger hover:bg-red-100 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel Request
              </button>
            </div>
          )}

          {/* DYNAMIC RENDERING OUTPUTS CARD */}
          {!activeOutput ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary font-black text-lg">
                🤖
              </div>
              <h3 className="font-extrabold text-charcoal text-sm">Select an AI Capability</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Click any of the action buttons above to generate backlogs, architecture docs, daily standups, or health metrics.
              </p>
            </div>
          ) : (
            <div className="flex-grow flex flex-col space-y-4 h-full">
              
              {/* Output Header */}
              <div className="flex justify-between items-center border-b border-border-slate pb-3 shrink-0">
                <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary-tint px-2.5 py-1 rounded-full border border-primary/20">
                  Generated {activeOutput.type}
                </span>
                
                {/* Global copy/downloads for markdown formats */}
                {(activeOutput.type === "readme" || activeOutput.type === "documentation") && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(activeOutput.data.markdown)}
                      className="px-3 py-1.5 rounded-btn border border-border-slate bg-white hover:bg-[#F8F5EF] text-xs text-charcoal font-bold transition-colors cursor-pointer"
                    >
                      Copy Markdown
                    </button>
                    <button
                      onClick={() =>
                        downloadMarkdownFile(
                          `${activeOutput.type === "readme" ? "README" : "ARCHITECTURE"}.md`,
                          activeOutput.data.markdown
                        )
                      }
                      className="px-3 py-1.5 rounded-btn bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-orange-sm transition-all cursor-pointer"
                    >
                      Download .md
                    </button>
                  </div>
                )}

                {activeOutput.type === "tasks" && (
                  <button
                    onClick={() => handleCreateAllTasks(activeOutput.data.tasks)}
                    className="px-4 py-1.5 rounded-btn bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-orange-sm transition-all cursor-pointer"
                  >
                    Add All to Board
                  </button>
                )}
              </div>

              {/* Output Content Card */}
              <div className="flex-1 overflow-y-auto pr-1">
                
                {/* 1. TASKS LIST SUGGESTIONS */}
                {activeOutput.type === "tasks" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {activeOutput.data.tasks?.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white border border-border-slate rounded-card flex flex-col justify-between shadow-subtle space-y-3"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                              t.priority === "High"
                                ? "bg-red-50 text-danger border-red-200"
                                : t.priority === "Medium"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-sky-50 text-sky-700 border-sky-200"
                            }`}>
                              {t.priority} Priority
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-charcoal leading-snug">{t.title}</h4>
                          <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{t.description}</p>
                        </div>
                        
                        <div className="border-t border-border-slate pt-2.5 flex justify-between items-center">
                          <span className="text-[10px] text-text-muted font-semibold">To Do Column</span>
                          <button
                            onClick={() => handleCreateTaskItem(t)}
                            className="px-3 py-1 bg-primary-tint text-primary hover:bg-primary hover:text-white rounded-btn text-[10px] font-bold transition-all cursor-pointer"
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
                    <div className="bg-white border border-border-slate rounded-card p-5 space-y-2 shadow-subtle">
                      <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Workspace Overview</h4>
                      <p className="text-xs text-text-secondary leading-relaxed font-medium">
                        {activeOutput.data.summary}
                      </p>
                    </div>
                    <div className="bg-white border border-border-slate rounded-card p-5 space-y-2 shadow-subtle">
                      <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest">Progress Metrics</h4>
                      <p className="text-xs text-text-secondary leading-relaxed font-medium">
                        {activeOutput.data.progress}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white border border-border-slate rounded-card p-5 space-y-2 shadow-subtle">
                        <h4 className="text-xs font-bold text-danger uppercase tracking-widest">Risks & Blockers</h4>
                        <p className="text-xs text-text-secondary leading-relaxed font-medium">
                          {activeOutput.data.risks}
                        </p>
                      </div>
                      <div className="bg-white border border-border-slate rounded-card p-5 space-y-2 shadow-subtle">
                        <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest">AI Recommendations</h4>
                        <p className="text-xs text-text-secondary leading-relaxed font-medium whitespace-pre-line">
                          {activeOutput.data.suggestions}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SPRINT PLAN WEEK ROADMAP */}
                {activeOutput.type === "sprintPlan" && (
                  <div className="relative border-l border-border-slate pl-5 ml-2.5 space-y-5 my-3">
                    {activeOutput.data.weeks?.map((w, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[25px] top-3.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white" />
                        <div className="bg-white border border-border-slate rounded-card p-4 shadow-subtle space-y-2">
                          <h4 className="text-xs font-black text-charcoal">
                            Week {w.week} — {w.title}
                          </h4>
                          <ul className="space-y-1">
                            {w.tasks?.map((tsk, taskIdx) => (
                              <li key={taskIdx} className="text-xs text-text-secondary flex items-start gap-2 leading-relaxed">
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
                  <div className="bg-white border border-border-slate rounded-card p-4 overflow-x-auto shadow-subtle">
                    <pre className="text-xs text-charcoal font-mono leading-relaxed whitespace-pre-wrap select-all">
                      {activeOutput.data.markdown}
                    </pre>
                  </div>
                )}

                {/* 5. DAILY STANDUP */}
                {activeOutput.type === "standup" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white border border-border-slate rounded-card p-4 space-y-2 shadow-subtle">
                      <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider border-b border-border-slate pb-2">
                        Yesterday Completed
                      </h4>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {activeOutput.data.yesterday}
                      </p>
                    </div>
                    <div className="bg-white border border-border-slate rounded-card p-4 space-y-2 shadow-subtle">
                      <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider border-b border-border-slate pb-2">
                        Today Planned
                      </h4>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {activeOutput.data.today}
                      </p>
                    </div>
                    <div className="bg-white border border-border-slate rounded-card p-4 space-y-2 shadow-subtle">
                      <h4 className="text-xs font-bold text-danger uppercase tracking-wider border-b border-border-slate pb-2">
                        Current Blockers
                      </h4>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {activeOutput.data.blockers}
                      </p>
                    </div>
                  </div>
                )}

                {/* 6. HEALTH SCORE Circular Meter */}
                {activeOutput.type === "health" && (
                  <div className="flex flex-col lg:flex-row gap-6 items-center bg-white border border-border-slate rounded-card p-6 shadow-subtle">
                    <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E9E4DA" strokeWidth="8" />
                        <circle
                           cx="50"
                           cy="50"
                           r="40"
                           fill="transparent"
                           stroke="url(#orangeHealthGradient)"
                           strokeWidth="8"
                           strokeDasharray={251.2}
                           strokeDashoffset={251.2 - (251.2 * activeOutput.data.healthScore) / 100}
                           strokeLinecap="round"
                           className="transition-all duration-1000"
                        />
                        <defs>
                          <linearGradient id="orangeHealthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FF6B2C" />
                            <stop offset="100%" stopColor="#E8591C" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-black text-charcoal">{activeOutput.data.healthScore}%</span>
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                          {activeOutput.data.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1">
                      <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                        Health Check Diagnostics
                      </h4>
                      <p className="text-xs text-text-secondary leading-relaxed font-medium">
                        {activeOutput.data.suggestions}
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Suggested Follow-up Actions row */}
              {suggestedActions.length > 0 && (
                <div className="border-t border-border-slate pt-3 mt-auto shrink-0 flex items-center gap-2 overflow-x-auto">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider shrink-0">
                    Suggested Next:
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
                        className="px-3 py-1 rounded-full border border-primary/30 bg-primary-tint hover:bg-primary hover:text-white text-primary text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap"
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
