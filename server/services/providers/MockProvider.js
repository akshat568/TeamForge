export const MockProvider = {
  name: "MockAI",

  async generateTasks(context) {
    const title = context.title || "Project";
    const desc = context.description || "development";
    
    // Custom tasks tailored to project context
    return {
      success: true,
      tasks: [
        {
          title: `Set up repository and folder structure for ${title}`,
          description: `Create workspace directories, configure dependencies, and scaffold clean entry points for ${title} MVP.`,
          priority: "High",
        },
        {
          title: `Design database schemas mapping ${title} requirements`,
          description: `Create Mongoose database model collections mapping: ${desc.slice(0, 100)}...`,
          priority: "High",
        },
        {
          title: `Build REST API endpoints and controllers for ${title} backend`,
          description: "Develop, secure, and test REST endpoints. Hook validation middleware routes.",
          priority: "Medium",
        },
        {
          title: `Design responsive glassmorphism UI for ${title} pages`,
          description: "Build premium dark-themed React views. Implement Framer Motion transitions.",
          priority: "Medium",
        },
        {
          title: `Integrate real-time Socket.io updates for collaborative tools`,
          description: "Hook websocket listeners on the client and server to push real-time event updates.",
          priority: "High",
        },
        {
          title: `Write automated Jest test suites and verify build compilation`,
          description: "Create units test suites, run lint checks, and confirm client production build compiles.",
          priority: "Low",
        },
      ],
    };
  },

  async getProjectSummary(context) {
    const title = context.title || "Project";
    const taskCount = context.tasks.length;
    const completedCount = context.tasks.filter((t) => t.status === "Completed").length;
    const pendingCount = taskCount - completedCount;
    const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

    return {
      summary: `The project "${title}" is currently in development. Team members are building collaborative assets and tracking milestone deliverables.`,
      progress: `Workspace progress is currently at ${progress}% with ${completedCount} completed task(s) and ${pendingCount} pending task(s) on the board.`,
      risks: pendingCount > 4 
        ? `⚠️ High volume of pending tasks (${pendingCount}). Ensure workloads are distributed evenly across team members.`
        : "Low risk. Task completion frequency is healthy and matching due dates.",
      suggestions: [
        "Prioritize outstanding High-priority tasks in the backlog.",
        "Ensure all resources links are up-to-date and shared in the workspace.",
        "Schedule a brief sync to clear any blockers in the In Progress column.",
      ].join("\n"),
    };
  },

  async getSprintPlan(context) {
    const title = context.title || "Project";
    return {
      weeks: [
        {
          week: 1,
          title: "System Scaffolding & Setup",
          tasks: [
            "Initialize Node/Express backend and Vite React app.",
            "Establish database connection setup and verify schemas.",
            "Scaffold core Tailwind CSS assets and glassmorphism layouts.",
          ],
        },
        {
          week: 2,
          title: "Database Models & Core CRUD APIs",
          tasks: [
            `Develop Mongoose schemas and indexes matching ${title} rules.`,
            "Write controllers, request validators, and routes.",
            "Manually verify CRUD endpoints using REST tests.",
          ],
        },
        {
          week: 3,
          title: "Frontend Integration & State Management",
          tasks: [
            "Build services layer interacting with backend REST APIs.",
            "Wire React Router routes and setup Context providers.",
            "Add form validations, load indicators, and warning panels.",
          ],
        },
        {
          week: 4,
          title: "Aesthetics, Real-Time Sync & QA",
          tasks: [
            "Inject smooth Framer Motion micro-animations.",
            "Setup Socket.io connection loops for real-time sync.",
            "Run production build checks and clear compiler warnings.",
          ],
        },
      ],
    };
  },

  async getReadme(context) {
    const title = context.title || "Project";
    const desc = context.description || "A collaborative MERN app.";
    const teamMembers = context.team.map((m) => `- ${m.name} (${m.role})`).join("\n");

    const markdown = `# ${title}

${desc}

## Features
- **Kanban Board**: Real-time task cards creation, priority badges, and status column updates.
- **Shared Resources**: Central repository for sharing workspace asset links.
- **Messenger Workspace**: Live chat channels for direct communication.
- **AI Workspace Assistant**: Intelligent roadmap planning and document templates generator.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Framer Motion, Axios, Socket.io-client
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB Atlas, Mongoose

## Installation
\`\`\`bash
# Install dependencies
npm install

# Start development servers
npm run dev
\`\`\`

## Contributors
${teamMembers}
`;
    return { markdown };
  },

  async getDocumentation(context) {
    const title = context.title || "Project";
    const markdown = `# Developer Architecture Documentation — ${title}

## System Overview
The ${title} workspace is built on a decoupled MERN stack architecture with real-time websocket synchronization and JWT authentication guards.

## Database Architecture (MongoDB + Mongoose)
- **Projects**: Persists listings, categories, team capacity, and sub-vacancy roles.
- **Tasks**: Stores Kanban status states, priority indicators, and assignee objects.
- **Messages & Notifications**: Records chat histories and real-time alerts feeds.
- **AI Histories**: Keeps logs of generated roadmap documents and task arrays.

## API Endpoints
- \`/api/auth\` — Login, registration, and profile me query.
- \`/api/projects\` — Projects search and details.
- \`/api/tasks\` — Tasks updates, deletion, and column movements.
- \`/api/ai\` — Prompt generations, health metrics, and document creations.

## WebSockets Channels (Socket.io)
- \`project_\${projectId}\` room: Synchronizes Kanban moves, resource additions, and activities logs in real-time.
`;
    return { markdown };
  },

  async getDailyStandup(context) {
    const name = context.team[0]?.name || "Lead Developer";
    const defaultYesterday = context.activities.slice(0, 2).join(", ") || `Worked on ${context.title} initial tasks.`;
    const defaultToday = "Focusing on backend controllers and testing routes.";

    return {
      yesterday: `Yesterday: Completed work on: ${defaultYesterday}`,
      today: `Today: ${defaultToday}`,
      blockers: "Blockers: None reported. Awaiting feedback on the Figma board.",
    };
  },

  async getProjectHealth(context) {
    const taskCount = context.tasks.length;
    const completedCount = context.tasks.filter((t) => t.status === "Completed").length;
    const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 100;

    // Calculate score based on tasks and progress
    let healthScore = 75; // Default healthy score
    if (taskCount > 0) {
      healthScore = Math.min(100, 50 + Math.round(progress * 0.5));
    }

    let status = "Healthy";
    let suggestions = "All metrics are stable. The sprint is moving forward on schedule.";

    if (healthScore < 60) {
      status = "At Risk";
      suggestions = "Backlog tasks are accumulating. Consider holding a sprint sync to redistribute assignees.";
    } else if (healthScore < 85) {
      status = "Needs Attention";
      suggestions = "Some tasks are lagging in In Progress. Verify there are no active blockers on the team.";
    }

    return {
      healthScore,
      status,
      suggestions,
    };
  },

  async askChatQuestion(context, message, history) {
    const title = context.title || "Project";
    const msgLower = message.toLowerCase();

    // Custom matching logic to reply specifically using the project context
    if (msgLower.includes("member") || msgLower.includes("team") || msgLower.includes("who")) {
      const names = context.team.map((t) => `${t.name} (${t.role})`).join(", ");
      return {
        response: `The team roster for "${title}" consists of: ${names}.`,
      };
    }

    if (msgLower.includes("task") || msgLower.includes("todo") || msgLower.includes("progress")) {
      const todo = context.tasks.filter((t) => t.status === "Todo");
      const inProgress = context.tasks.filter((t) => t.status === "In Progress");
      const completed = context.tasks.filter((t) => t.status === "Completed");
      
      return {
        response: `Currently, the workspace board has ${context.tasks.length} task(s) total: ${todo.length} in Todo, ${inProgress.length} in Progress, and ${completed.length} Completed.`,
      };
    }

    if (msgLower.includes("resource") || msgLower.includes("link")) {
      if (context.resources.length === 0) {
        return {
          response: "No resource links have been shared in this workspace yet. You can add links under the Resources tab.",
        };
      }
      const links = context.resources.map((r) => `${r.name} (${r.url})`).join(", ");
      return {
        response: `The following resources have been shared in this workspace: ${links}.`,
      };
    }

    if (msgLower.includes("description") || msgLower.includes("what")) {
      return {
        response: `"${title}" description: ${context.description}`,
      };
    }

    // Default reply
    return {
      response: `Hello! I am your AI assistant for the "${title}" workspace. I can help you plan sprints, organize tasks, generate docs, or analyze project health. Ask me about your team members, Kanban board, or resources!`,
    };
  },
};
