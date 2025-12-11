"use client";

import { useMemo, useState, type ReactElement } from "react";
import {
  Activity,
  CheckCircle2,
  CircleDot,
  Clock,
  Cpu,
  Goal,
  Rocket,
  Sparkles,
  TimerReset,
  TriangleAlert,
} from "lucide-react";
import {
  AgentActivity,
  AgentInsight,
  MaintenanceTask,
  buildAgentResponse,
  computeHealthScore,
  createActivity,
  generateInsight,
} from "@/lib/agent";

type TaskColumn = {
  title: string;
  status: MaintenanceTask["status"];
  accent: string;
  icon: ReactElement;
};

const seededTasks: MaintenanceTask[] = [
  {
    id: "task-1",
    title: "Resolve Core Web Vitals regression",
    description:
      "Investigate LCP spike on the pricing page and ship image optimization patch.",
    category: "performance",
    status: "in-progress",
    priority: "high",
    owner: "Performance Guild",
    dueInDays: 2,
  },
  {
    id: "task-2",
    title: "Rebuild marketing sitemap",
    description:
      "Sync sitemap.xml with the latest product launches and submit to Search Console.",
    category: "seo",
    status: "backlog",
    priority: "medium",
    owner: "Agent",
    dueInDays: 5,
  },
  {
    id: "task-3",
    title: "Accessibility sweep (Q1)",
    description:
      "Validate keyboard navigation across hero modules and patch missing aria labels.",
    category: "accessibility",
    status: "blocked",
    priority: "high",
    owner: "Frontend Squad",
    dueInDays: 4,
  },
  {
    id: "task-4",
    title: "Automate content freshness checks",
    description:
      "Build cron that flags pages older than 6 months and notifies editors.",
    category: "content",
    status: "in-progress",
    priority: "medium",
    owner: "Content Ops",
    dueInDays: 6,
  },
  {
    id: "task-5",
    title: "Rotate legacy API keys",
    description:
      "Audit integrations and rotate credentials older than 90 days across environments.",
    category: "devops",
    status: "done",
    priority: "medium",
    owner: "Platform",
    dueInDays: 0,
  },
];

const initialActivities: AgentActivity[] = [
  createActivity("Nightly lighthouse run completed (92.4 score).", "success"),
  createActivity("Queued image optimization job for /pricing hero media."),
  createActivity("Blocked accessibility task awaiting designer specs.", "warning"),
];

const statusColumns: TaskColumn[] = [
  {
    title: "Backlog",
    status: "backlog",
    accent: "border-slate-800 bg-slate-900/60",
    icon: <TimerReset className="size-4 text-slate-400" />,
  },
  {
    title: "In Progress",
    status: "in-progress",
    accent: "border-blue-500/30 bg-blue-500/10",
    icon: <CircleDot className="size-4 text-blue-300" />,
  },
  {
    title: "Blocked",
    status: "blocked",
    accent: "border-amber-500/40 bg-amber-500/10",
    icon: <TriangleAlert className="size-4 text-amber-300" />,
  },
  {
    title: "Shipped",
    status: "done",
    accent: "border-emerald-500/30 bg-emerald-500/10",
    icon: <CheckCircle2 className="size-4 text-emerald-300" />,
  },
];

function formatTimeAgo(timestamp: string) {
  const then = new Date(timestamp).getTime();
  const now = Date.now();
  const diff = Math.max(1, now - then);
  const minutes = Math.round(diff / 1000 / 60);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function formatDue(days: number) {
  if (days < 0) return "overdue";
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `due in ${days} days`;
}

export default function Home() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>(seededTasks);
  const [activities, setActivities] = useState<AgentActivity[]>(initialActivities);
  const [insights, setInsights] = useState<AgentInsight[]>(generateInsight(""));
  const [lastSummary, setLastSummary] = useState<string>(
    "No directive received. Running default maintenance loop.",
  );
  const [command, setCommand] = useState("");

  const healthScore = useMemo(() => computeHealthScore(tasks), [tasks]);
  const activeCount = useMemo(
    () =>
      tasks.filter((task) => task.status === "in-progress" || task.status === "blocked")
        .length,
    [tasks],
  );
  const criticalCount = useMemo(
    () =>
      tasks.filter((task) => task.priority === "high" && task.status !== "done").length,
    [tasks],
  );

  const dueSoon = useMemo(
    () => tasks.filter((task) => task.dueInDays > -1 && task.dueInDays <= 2).length,
    [tasks],
  );

  const handleStatusUpdate = (id: string, status: MaintenanceTask["status"]) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              status,
            }
          : task,
      ),
    );

    const task = tasks.find((item) => item.id === id);
    if (task) {
      const statusToMessage: Record<MaintenanceTask["status"], string> = {
        backlog: "reset to backlog",
        "in-progress": "moved to active work",
        blocked: "flagged as blocked",
        done: "shipped successfully",
      };

      setActivities((prev) => [
        createActivity(
          `Task "${task.title}" ${statusToMessage[status]}.`,
          status === "blocked" ? "warning" : status === "done" ? "success" : "info",
        ),
        ...prev,
      ]);
    }
  };

  const handleRunCommand = () => {
    const { summary, insights, recommendedTasks } = buildAgentResponse(command, tasks);

    setLastSummary(summary);
    setInsights(insights);

    if (recommendedTasks.length) {
      setTasks((prev) => [
        ...recommendedTasks,
        ...prev.map((task) => ({ ...task, dueInDays: Math.max(task.dueInDays - 1, 0) })),
      ]);
      setActivities((prev) => [
        createActivity(
          `Queued ${recommendedTasks.length} follow-up ${
            recommendedTasks.length > 1 ? "tasks" : "task"
          } from directive.`,
          "success",
        ),
        ...prev,
      ]);
    } else {
      setActivities((prev) => [
        createActivity("Directive aligned with current roadmap. No new tasks queued."),
        ...prev,
      ]);
    }

    if (command.trim()) {
      setActivities((prev) => [
        createActivity(`Received directive: "${command.trim()}".`, "info"),
        ...prev,
      ]);
    }

    setCommand("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 pt-16 md:px-10 xl:px-14">
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-slate-400">
                <Sparkles className="size-4 text-indigo-300" />
                Autonomous Maintainer
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Agentic Control Room
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
                Run a continuous maintenance loop, triage regressions before they ship,
                and keep your website fast, findable, and reliable.
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-6 py-4">
              <p className="text-sm uppercase tracking-wide text-indigo-200">
                Agent heartbeat
              </p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-5xl font-semibold text-white">{healthScore}</span>
                <span className="pb-2 text-sm text-indigo-200">/100 health</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatusCard
              title="Active initiatives"
              value={activeCount}
              trend="+2 live"
              icon={<Rocket className="size-5 text-blue-200" />}
              description="Monitoring mission-critical upgrades in-flight."
            />
            <StatusCard
              title="Critical alerts"
              value={criticalCount}
              trend="3 thresholds"
              icon={<TriangleAlert className="size-5 text-amber-200" />}
              description="High priority items requiring next action."
            />
            <StatusCard
              title="Due soon"
              value={dueSoon}
              trend="48h window"
              icon={<Clock className="size-5 text-emerald-200" />}
              description="Tasks approaching service level targets."
            />
            <StatusCard
              title="Automation coverage"
              value="68%"
              trend="+5% M/M"
              icon={<Cpu className="size-5 text-purple-200" />}
              description="Maintenance checks handled by agentic workflows."
            />
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <AgentConsole
            command={command}
            onCommandChange={setCommand}
            lastSummary={lastSummary}
            insights={insights}
            onRunCommand={handleRunCommand}
          />
          <ActivityFeed activities={activities} />
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">Maintenance pipeline</h2>
            <p className="text-sm text-slate-400">
              Structured backlog grouped by execution state.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {statusColumns.map((column) => {
              const filtered = tasks.filter((task) => task.status === column.status);
              return (
                <div
                  key={column.status}
                  className={`flex min-h-[280px] flex-col gap-4 rounded-2xl border p-5 ${column.accent}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-white/5">
                        {column.icon}
                      </span>
                      <div>
                        <p className="text-sm uppercase tracking-wide text-slate-300">
                          {column.title}
                        </p>
                        <p className="text-lg font-semibold text-white">
                          {filtered.length}{" "}
                          <span className="text-xs font-normal text-slate-400">
                            {filtered.length === 1 ? "item" : "items"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-4">
                    {filtered.length ? (
                      filtered.map((task) => (
                        <TaskCard key={task.id} task={task} onUpdateStatus={handleStatusUpdate} />
                      ))
                    ) : (
                      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-sm text-slate-500">
                        Agent backlog clear.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusCard({
  title,
  value,
  trend,
  icon,
  description,
}: {
  title: string;
  value: number | string;
  trend: string;
  icon: ReactElement;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-white/20 hover:bg-white/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{title}</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-semibold text-white">{value}</span>
            <span className="text-xs text-slate-400">{trend}</span>
          </div>
        </div>
        <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-slate-100">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-300">{description}</p>
    </div>
  );
}

function AgentConsole({
  command,
  lastSummary,
  insights,
  onRunCommand,
  onCommandChange,
}: {
  command: string;
  lastSummary: string;
  insights: AgentInsight[];
  onRunCommand: () => void;
  onCommandChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Directive console
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">Send maintenance command</h2>
        </div>
        <Goal className="size-6 text-indigo-200" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Mission brief
        </label>
        <textarea
          value={command}
          onChange={(event) => onCommandChange(event.target.value)}
          placeholder="Example: investigate SEO drop for /docs after redesign"
          className="mt-3 h-28 w-full resize-none rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
        />
        <button
          onClick={onRunCommand}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/50 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/30"
        >
          <Sparkles className="size-4" />
          Execute directive
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Latest summary
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-200">{lastSummary}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-indigo-200" />
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Active insights
          </p>
        </div>
        <div className="mt-4 space-y-4">
          {insights.map((insight, index) => (
            <div
              key={`${insight.title}-${index}`}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-white">{insight.title}</p>
                <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs uppercase text-indigo-200">
                  {insight.category}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{insight.detail}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-500">
                Impact: {insight.impact}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityFeed({ activities }: { activities: AgentActivity[] }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Activity log
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Autonomous maintenance journal
          </h2>
        </div>
        <Activity className="size-6 text-slate-300" />
      </div>

      <div className="flex flex-col gap-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-white">{activity.message}</span>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {formatTimeAgo(activity.timestamp)}
              </span>
            </div>
            <span
              className={`mt-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] ${
                activity.level === "success"
                  ? "text-emerald-300"
                  : activity.level === "warning"
                    ? "text-amber-300"
                    : "text-slate-400"
              }`}
            >
              {activity.level}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onUpdateStatus,
}: {
  task: MaintenanceTask;
  onUpdateStatus: (id: string, status: MaintenanceTask["status"]) => void;
}) {
  const controls: Array<{
    label: string;
    status: MaintenanceTask["status"];
    intent: "primary" | "ghost";
  }> = [];

  if (task.status === "backlog") {
    controls.push({ label: "Start", status: "in-progress", intent: "primary" });
  } else if (task.status === "in-progress") {
    controls.push({ label: "Complete", status: "done", intent: "primary" });
    controls.push({ label: "Block", status: "blocked", intent: "ghost" });
  } else if (task.status === "blocked") {
    controls.push({ label: "Unblock", status: "in-progress", intent: "primary" });
    controls.push({ label: "Defer", status: "backlog", intent: "ghost" });
  } else if (task.status === "done") {
    controls.push({ label: "Reopen", status: "backlog", intent: "ghost" });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            {task.category}
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">{task.title}</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200">
          {task.priority} priority
        </span>
      </div>
      <p className="line-clamp-3 text-sm text-slate-300">{task.description}</p>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{task.owner}</span>
        <span>{formatDue(task.dueInDays)}</span>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        {controls.map((control) => (
          <button
            key={control.label}
            onClick={() => onUpdateStatus(task.id, control.status)}
            className={`rounded-xl px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] transition ${
              control.intent === "primary"
                ? "border border-emerald-400/40 bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/30"
                : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            {control.label}
          </button>
        ))}
      </div>
    </div>
  );
}
