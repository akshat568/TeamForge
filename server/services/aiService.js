import { OpenAIProvider } from "./providers/OpenAIProvider.js";
import { MockProvider } from "./providers/MockProvider.js";

// Unified helper to construct project context string for prompt templates
const getPromptContextString = (context) => {
  return `
PROJECT DETAILS:
- Title: ${context.title}
- Description: ${context.description}

TEAM MEMBERS:
${context.team.map((t) => `- ${t.name} (${t.role})`).join("\n")}

ACTIVE KANBAN TASKS:
${
  context.tasks.length === 0
    ? "No tasks currently on the board."
    : context.tasks.map((t) => `- [${t.status}] ${t.title} (Assignee: ${t.assignee})`).join("\n")
}

WORKSPACE SHARED RESOURCES:
${
  context.resources.length === 0
    ? "No resources linked."
    : context.resources.map((r) => `- ${r.name}: ${r.url}`).join("\n")
}

WORKSPACE UPLOADED DOCUMENTS AND ATTACHMENTS:
${
  !context.documents || context.documents.length === 0
    ? "No documents uploaded."
    : context.documents.map((d) => `- ${d.name} (Uploaded by: ${d.uploadedBy})`).join("\n")
}

RECENT ACTIVITY HISTORY LOGS:
${
  context.activities.length === 0
    ? "No activities logged yet."
    : context.activities.map((a) => `- ${a}`).join("\n")
}
`;
};

// Check if OpenAI provider is available
const isApiKeyConfigured = !!process.env.OPENAI_API_KEY;

export const aiService = {
  // ─── 1. GENERATE SPRINT TASKS ─────────────────────────────────────────────
  async generateTasks(context) {
    if (!isApiKeyConfigured) {
      console.warn("⚠️ [aiService] OpenAI API Key missing. Invoking mock fallback...");
      return await MockProvider.generateTasks(context);
    }

    try {
      const systemPrompt = `You are a Senior Project Manager and Agile Coordinator. 
Your job is to analyze the project details and suggest 4-6 highly specific, actionable development tasks.
Respond ONLY in structured JSON matching this schema:
{
  "success": true,
  "tasks": [
    {
      "title": "Short descriptive task name",
      "description": "Clear explanation of what needs to be done",
      "priority": "Low" | "Medium" | "High"
    }
  ]
}`;
      const userPrompt = `Generate tasks for the following workspace context:\n${getPromptContextString(context)}`;
      
      return await OpenAIProvider.generateCompletion(systemPrompt, userPrompt, true);
    } catch (error) {
      console.error("❌ [aiService] GenerateTasks OpenAI call failed, falling back to mock provider:", error.message);
      return await MockProvider.generateTasks(context);
    }
  },

  // ─── 2. GENERATE PROJECT SUMMARY ──────────────────────────────────────────
  async getProjectSummary(context) {
    if (!isApiKeyConfigured) {
      console.warn("⚠️ [aiService] OpenAI API Key missing. Invoking mock fallback...");
      return await MockProvider.getProjectSummary(context);
    }

    try {
      const systemPrompt = `You are a Senior Product Manager.
Analyze the project details, activities, and task statuses to produce a progress summary.
Respond ONLY in structured JSON matching this schema:
{
  "summary": "High-level summary of what the project is about and current status",
  "progress": "Detailed description of the task metrics, milestones, and task board progress",
  "risks": "Any blocker alerts, capacity limits, or deadline risks",
  "suggestions": "Bullets/Lines detailing recommendations for next steps"
}`;
      const userPrompt = `Generate a project summary for the following workspace context:\n${getPromptContextString(context)}`;

      return await OpenAIProvider.generateCompletion(systemPrompt, userPrompt, true);
    } catch (error) {
      console.error("❌ [aiService] ProjectSummary OpenAI call failed, falling back to mock provider:", error.message);
      return await MockProvider.getProjectSummary(context);
    }
  },

  // ─── 3. GENERATE SPRINT PLAN (ROADMAP) ────────────────────────────────────
  async getSprintPlan(context) {
    if (!isApiKeyConfigured) {
      console.warn("⚠️ [aiService] OpenAI API Key missing. Invoking mock fallback...");
      return await MockProvider.getSprintPlan(context);
    }

    try {
      const systemPrompt = `You are a Lead Scrum Master. 
Build a structured, week-by-week sprint roadmap timeline (4 weeks).
Respond ONLY in structured JSON matching this schema:
{
  "weeks": [
    {
      "week": 1,
      "title": "Summary of week goal",
      "tasks": ["Task detail item 1", "Task detail item 2"]
    }
  ]
}`;
      const userPrompt = `Build a sprint plan for the following workspace context:\n${getPromptContextString(context)}`;

      return await OpenAIProvider.generateCompletion(systemPrompt, userPrompt, true);
    } catch (error) {
      console.error("❌ [aiService] SprintPlan OpenAI call failed, falling back to mock provider:", error.message);
      return await MockProvider.getSprintPlan(context);
    }
  },

  // ─── 4. GENERATE README.MD ────────────────────────────────────────────────
  async getReadme(context) {
    if (!isApiKeyConfigured) {
      console.warn("⚠️ [aiService] OpenAI API Key missing. Invoking mock fallback...");
      return await MockProvider.getReadme(context);
    }

    try {
      const systemPrompt = `You are a Technical Writer.
Generate a professional, fully styled README.md file using the project context.
Respond ONLY in structured JSON matching this schema:
{
  "markdown": "# Project Title\\n\\nMarkdown contents..."
}`;
      const userPrompt = `Generate a README.md markdown file for the following workspace context:\n${getPromptContextString(context)}`;

      return await OpenAIProvider.generateCompletion(systemPrompt, userPrompt, true);
    } catch (error) {
      console.error("❌ [aiService] Readme OpenAI call failed, falling back to mock provider:", error.message);
      return await MockProvider.getReadme(context);
    }
  },

  // ─── 5. GENERATE DEVELOPER DOCUMENTATION ──────────────────────────────────
  async getDocumentation(context) {
    if (!isApiKeyConfigured) {
      console.warn("⚠️ [aiService] OpenAI API Key missing. Invoking mock fallback...");
      return await MockProvider.getDocumentation(context);
    }

    try {
      const systemPrompt = `You are a Systems Architect.
Generate developer documentation covering the system architecture, database models, route outlines, and directory structure.
Respond ONLY in structured JSON matching this schema:
{
  "markdown": "# Architecture Documentation\\n\\nMarkdown contents..."
}`;
      const userPrompt = `Generate developer documentation for the following workspace context:\n${getPromptContextString(context)}`;

      return await OpenAIProvider.generateCompletion(systemPrompt, userPrompt, true);
    } catch (error) {
      console.error("❌ [aiService] Documentation OpenAI call failed, falling back to mock provider:", error.message);
      return await MockProvider.getDocumentation(context);
    }
  },

  // ─── 6. GENERATE DAILY STANDUP ────────────────────────────────────────────
  async getDailyStandup(context) {
    if (!isApiKeyConfigured) {
      console.warn("⚠️ [aiService] OpenAI API Key missing. Invoking mock fallback...");
      return await MockProvider.getDailyStandup(context);
    }

    try {
      const systemPrompt = `You are an Agile Coach.
Using the recent activities and logs of team members, generate a daily standup report.
Respond ONLY in structured JSON matching this schema:
{
  "yesterday": "Summary of achievements compiled from logs",
  "today": "Planned tasks based on project priorities",
  "blockers": "Potential blockers, risks, or resource requirements"
}`;
      const userPrompt = `Generate a daily standup for the following workspace context:\n${getPromptContextString(context)}`;

      return await OpenAIProvider.generateCompletion(systemPrompt, userPrompt, true);
    } catch (error) {
      console.error("❌ [aiService] DailyStandup OpenAI call failed, falling back to mock provider:", error.message);
      return await MockProvider.getDailyStandup(context);
    }
  },

  // ─── 7. ANALYZE PROJECT HEALTH ────────────────────────────────────────────
  async getProjectHealth(context) {
    if (!isApiKeyConfigured) {
      console.warn("⚠️ [aiService] OpenAI API Key missing. Invoking mock fallback...");
      return await MockProvider.getProjectHealth(context);
    }

    try {
      const systemPrompt = `You are a Senior Devops Lead and QA Manager.
Analyze tasks count, completion %, resources, and activity logs to produce a health score (0-100), status label, and suggestions.
Respond ONLY in structured JSON matching this schema:
{
  "healthScore": 85,
  "status": "Healthy" | "Needs Attention" | "At Risk",
  "suggestions": "Suggestions to improve sprint pace, clear backlog, or balance assignee load"
}`;
      const userPrompt = `Evaluate project health for the following workspace context:\n${getPromptContextString(context)}`;

      return await OpenAIProvider.generateCompletion(systemPrompt, userPrompt, true);
    } catch (error) {
      console.error("❌ [aiService] ProjectHealth OpenAI call failed, falling back to mock provider:", error.message);
      return await MockProvider.getProjectHealth(context);
    }
  },

  // ─── 8. AI WORKSPACE CHAT (FREE-FORM CONVERSATIONAL INTERFACE) ───────────
  async askChatQuestion(context, message, history = []) {
    if (!isApiKeyConfigured) {
      console.warn("⚠️ [aiService] OpenAI API Key missing. Invoking mock fallback...");
      return await MockProvider.askChatQuestion(context, message, history);
    }

    try {
      const systemPrompt = `You are an intelligent AI workspace assistant for the TeamForge project.
You answer user questions referencing the active project workspace context.
Here is the conversation history:
${history.map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`).join("\n")}

Respond ONLY in structured JSON matching this schema:
{
  "response": "Your conversational answer text, referencing team members, tasks, or resources from the context when relevant."
}`;
      const userPrompt = `Workspace Context:\n${getPromptContextString(context)}\n\nUser Question: ${message}`;

      return await OpenAIProvider.generateCompletion(systemPrompt, userPrompt, true);
    } catch (error) {
      console.error("❌ [aiService] Chat OpenAI call failed, falling back to mock provider:", error.message);
      return await MockProvider.askChatQuestion(context, message, history);
    }
  },
};
