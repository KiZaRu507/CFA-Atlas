import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Brain,
  Calendar,
  Calculator,
  Check,
  ChevronRight,
  Clock,
  Download,
  Flame,
  GraduationCap,
  Gamepad2,
  GitBranch,
  LayoutDashboard,
  Library,
  Menu,
  Moon,
  Play,
  Search,
  Settings,
  Shield,
  Shuffle,
  Sparkles,
  Sun,
  Target,
  Trophy,
  Upload,
  X,
  Zap,
} from "lucide-react";
import type {
  Progress,
  Profile,
  Concept,
  Question,
  Summary,
  Attempt,
} from "./types";
import { topics, catalog, loadTopic, loadConcepts } from "./data/content";
import { beginnerBrief } from "./data/beginner";
import {
  findObjective,
  knowledgeMeta,
  knowledgeStats,
  learningObjectives,
  modulesForTopic,
  objectiveGuide,
} from "./data/knowledge";
import { conceptGames, type Direction } from "./data/games";
import {
  calculatorChecklist,
  calculatorDrills,
  calculatorSources,
} from "./data/calculator";
import {
  DAY,
  blankMemory,
  dateKey,
  retention,
  state,
  updateMemory,
} from "./engine/memory";
import {
  freshProgress,
  accuracy,
  streak,
  readiness,
  recommend,
  topicStats,
  achievements,
  score,
} from "./engine/learning";
import {
  readProgress,
  writeProgress,
  validateProgress,
  backup,
} from "./engine/storage";
import "./styles.css";
import { newId } from "./engine/id";
import { finalizeSession } from "./engine/session";
import { registerStudyTools } from "./engine/webmcp";
const modes = [
  "Daily Quest",
  "Practice",
  "Mixed Practice",
  "Quick Recall",
  "Memory Rescue",
  "Weakness Hunt",
  "Error Repair",
  "Formula Forge",
  "Ethics Court",
  "Boss Battle",
  "Mock Examination",
];
const errors = [
  "Concept not understood",
  "Formula forgotten",
  "Calculation error",
  "Misread question",
  "Confident misconception",
  "Guess",
  "Repeated error",
];
const navigate = (path: string) => {
  location.hash = path;
};
function useRoute() {
  const [route, setRoute] = useState(location.hash.slice(1) || "/");
  useEffect(() => {
    const f = () => {
      setRoute(location.hash.slice(1) || "/");
      window.scrollTo(0, 0);
    };
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  return route;
}
function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      className={secondary ? "button secondary" : "button"}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
function Bar({ value, color }: { value: number; color?: string }) {
  return (
    <div
      className="bar"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: color,
        }}
      />
    </div>
  );
}
function Ring({
  value,
  label,
  size = 150,
}: {
  value: number;
  label: string;
  size?: number;
}) {
  return (
    <div
      className="ring"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--accent) ${value * 3.6}deg,var(--line) 0)`,
      }}
    >
      <div>
        <b>
          {value}
          <small>%</small>
        </b>
        <span>{label}</span>
      </div>
    </div>
  );
}
function Title({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {children}
    </header>
  );
}
function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty">
      <Check size={32} />
      <h2>{title}</h2>
      <p>{body}</p>
      <Button onClick={() => navigate("/curriculum")}>
        Explore the curriculum <ArrowRight size={16} />
      </Button>
    </div>
  );
}
const fmt = (n: number) => new Intl.NumberFormat().format(n);
function App() {
  const route = useRoute();
  const [p, setP] = useState<Progress>(freshProgress);
  const [ready, setReady] = useState(false);
  const [storageOK, setStorageOK] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mobile, setMobile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    readProgress()
      .then(setP)
      .catch((e) => {
        setStorageOK(false);
        setError(
          "Saved data could not be loaded: " +
            e.message +
            ". Automatic saving is paused to preserve the stored record. Import a valid backup in Settings.",
        );
      })
      .finally(() => setReady(true));
    const t = setInterval(() => setTick(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (ready && !demo && storageOK)
      writeProgress(p).catch(() =>
        setError(
          "Progress could not be saved. Export a backup now; your current session remains available.",
        ),
      );
  }, [p, ready, demo, storageOK]);
  useEffect(() => registerStudyTools(p), [p]);
  useEffect(() => {
    document.documentElement.dataset.theme = p.theme;
  }, [p.theme]);
  useEffect(() => setMobile(false), [route]);
  const [session, setSession] = useState<{
    mode: string;
    questions: Question[];
    concepts: Concept[];
    id: string;
    started: number;
  } | null>(null);
  async function launch(mode: string, ids?: string[]) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const count =
        mode === "Mock Examination"
          ? catalog.length
          : mode === "Boss Battle"
            ? 30
            : Math.max(
                4,
                Math.min(20, Math.round((p.profile?.sessionMinutes || 20) / 2)),
              );
      const cs = await loadConcepts(
        ids || recommend(p, catalog, mode, count).map((c) => c.id),
      );
      let qs = cs.flatMap((c, ci) => {
        if (mode === "Daily Quest" && p.memory[c.id]?.attempts && ci % 3 === 0)
          return c.questions.filter(
            (q) => q.type === (c.formula ? "formula" : "recall"),
          );
        if (mode === "Quick Recall")
          return c.questions.filter((q) => q.type === "recall");
        if (mode === "Formula Forge")
          return c.questions.filter((q) => q.type === "formula");
        const candidates = c.questions.filter((q) => q.choices.length);
        if (mode === "Mock Examination")
          return [...candidates].sort(() => Math.random() - 0.5);
        const seen = p.attempts
          .filter((a) => a.conceptId === c.id)
          .map((a) => a.questionId);
        return candidates
          .sort(
            (a, b) =>
              seen.filter((x) => x === a.id).length -
              seen.filter((x) => x === b.id).length,
          )
          .slice(0, 1);
      });
      if (mode === "Mock Examination") {
        // Round-robin across topics: no invented official weights.
        const groups = topics.map((t) => qs.filter((q) => q.topicId === t.id));
        qs = [];
        while (qs.length < 180 && groups.some((g) => g.length))
          for (const g of groups)
            if (g.length && qs.length < 180) qs.push(g.shift()!);
      } else if (mode === "Practice" && ids) qs = qs.slice(0, 30);
      if (!qs.length) {
        setNotice(
          "No eligible questions yet. Try Daily Quest or explore another module.",
        );
        return;
      }
      setSession({
        mode,
        questions: qs,
        concepts: cs,
        id: newId(),
        started: Date.now(),
      });
      navigate("/quiz");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function mutate(fn: (old: Progress) => Progress) {
    setP(fn);
  }
  function openDemo() {
    let d = freshProgress();
    d.profile = {
      name: "Demo candidate",
      examDate: new Date(Date.now() + 90 * DAY).toISOString().slice(0, 10),
      attempt: 1,
      hours: 10,
      sessionMinutes: 20,
      studied: true,
      completionDate: "",
      confidence: {},
    };
    for (let day = 12; day >= 0; day--)
      for (let j = 0; j < 8; j++) {
        const c = catalog[(day * 3 + j) % catalog.length];
        const at = Date.now() - day * DAY - j * 60000;
        const correct = (day + j) % 4 !== 0;
        const confidence = (day + j) % 4;
        const u = updateMemory(
          d.memory[c.id],
          correct,
          confidence,
          2,
          day % 2 ? "recall" : "application",
          at,
        );
        d.memory[c.id] = u.memory;
        d.attempts.push({
          id: newId(),
          questionId: c.questionIds[0],
          conceptId: c.id,
          topicId: c.topicId,
          at,
          correct,
          confidence,
          difficulty: 2,
          format: "application",
          seconds: 75,
          xp: u.xp,
          error: correct
            ? ""
            : confidence === 3
              ? "Confident misconception"
              : "Concept not understood",
          mode: "Demo",
        });
      }
    setDemo(true);
    setP(d);
    navigate("/");
  }
  async function exitDemo() {
    setBusy(true);
    try {
      setP(await readProgress());
      setDemo(false);
      setSession(null);
      navigate("/");
    } finally {
      setBusy(false);
    }
  }
  if (!ready)
    return (
      <div className="boot">
        <GraduationCap size={48} />
        <h1>CFA Atlas</h1>
        <p>Opening your study workspace…</p>
      </div>
    );
  const xp = p.attempts.reduce((s, a) => s + a.xp, 0);
  const due = catalog.filter(
    (c) => p.memory[c.id]?.attempts && p.memory[c.id].due <= tick,
  ).length;
  const nav = [
    ["/", "Command center", LayoutDashboard],
    ["/learn", "Learn from zero", GraduationCap],
    ["/knowledge", "Knowledge mind maps", GitBranch],
    ["/games", "Concept arcade", Gamepad2],
    ["/curriculum", "Curriculum map", BookOpen],
    ["/study", "Study arena", Target],
    ["/review", "Memory rescue", Brain],
    ["/formulas", "Formula library", Library],
    ["/calculator", "BA II Plus lab", Calculator],
    ["/mistakes", "Mistake intelligence", Shield],
    ["/analytics", "Analytics", Activity],
    ["/profile", "Achievements", Trophy],
  ] as const;
  return (
    <div className="app">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <a className="brand" href="#/">
          <div className="brand-icon">
            <GraduationCap />
          </div>
          <div>
            CFA <b>ATLAS</b>
            <small>LEVEL I · 2026</small>
          </div>
        </a>
        <button
          className="icon-button mobile-toggle drawer-close"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        >
          <X size={18} />
        </button>
        <p className="nav-label">YOUR WORKSPACE</p>
        <nav>
          {nav.map(([path, label, Icon]) => (
            <a
              key={path}
              href={"#" + path}
              className={route === path ? "active" : ""}
            >
              <Icon size={19} />
              {label}
              {path === "/review" && due > 0 && (
                <span className="count">{due}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="level-badge">
            <Zap size={19} />
            <div>
              Level {Math.floor(xp / 250) + 1}
              <small>{fmt(xp)} learning XP</small>
            </div>
          </div>
          <a href="#/settings">
            <Settings size={18} /> Settings & backup
          </a>
          <p>Private. Local. Yours.</p>
        </div>
      </aside>
      <div className="workspace">
        <div className="topbar">
          <button
            className="icon-button mobile-toggle"
            aria-label="Toggle navigation"
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>
          <span className="breadcrumb">
            CFA Atlas <ChevronRight size={14} /> <b>Level I journey</b>
          </span>
          <div>
            <span className="streak">
              <Flame size={17} />
              {streak(p)} day streak
            </span>
            <button
              className="icon-button"
              aria-label="Toggle color theme"
              onClick={() =>
                mutate((o) => ({
                  ...o,
                  theme: o.theme === "dark" ? "light" : "dark",
                }))
              }
            >
              {p.theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <a className="avatar" href="#/profile">
              {(p.profile?.name || "You").slice(0, 1).toUpperCase()}
            </a>
          </div>
        </div>
        {demo && (
          <div className="demo-banner">
            DEMO MODE · Example activity; your real progress is untouched.
            <button onClick={exitDemo}>Exit demo</button>
          </div>
        )}
        <main id="main">
          {error && (
            <div className="alert" role="alert">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {!p.profile && route !== "/settings" ? (
            <Onboarding
              initial={p.profile}
              save={(profile) => mutate((o) => ({ ...o, profile }))}
              demo={openDemo}
            />
          ) : route === "/quiz" && session ? (
            <Quiz
              key={session.id}
              session={session}
              p={p}
              mutate={mutate}
              finish={() => {
                setSession(null);
                navigate("/analytics");
              }}
            />
          ) : route.startsWith("/objective/") ? (
            <ObjectiveLesson id={route.split("/")[2]} launch={launch} />
          ) : route.startsWith("/concept/") ? (
            <ConceptPage
              id={route.split("/")[2]}
              p={p}
              mutate={mutate}
              launch={launch}
            />
          ) : route.startsWith("/topic/") ||
            route.startsWith("/module/") ||
            route === "/curriculum" ? (
            <Curriculum route={route} p={p} launch={launch} />
          ) : route === "/settings" ? (
            <SettingsPage
              p={p}
              mutate={mutate}
              notice={setNotice}
              demo={demo}
              openDemo={openDemo}
              restored={() => setStorageOK(true)}
            />
          ) : route === "/analytics" ? (
            <Analytics p={p} />
          ) : route === "/profile" ? (
            <ProfilePage p={p} />
          ) : route === "/formulas" ? (
            <FormulaLibrary p={p} launch={launch} />
          ) : route === "/calculator" ? (
            <CalculatorLab />
          ) : route === "/knowledge" ? (
            <KnowledgeRepository />
          ) : route === "/games" ? (
            <GameArcade p={p} mutate={mutate} />
          ) : route === "/learn" ? (
            <LearnAcademy p={p} />
          ) : route === "/review" || route === "/mistakes" ? (
            <Review p={p} launch={launch} mistakes={route === "/mistakes"} />
          ) : route === "/study" ? (
            <StudyArena p={p} launch={launch} busy={busy} />
          ) : (
            <Dashboard p={p} launch={launch} busy={busy} />
          )}
        </main>
        <footer>
          Independent study companion · Based on your supplied 2026 curriculum ·
          Not affiliated with CFA Institute
        </footer>
      </div>
    </div>
  );
}
type Launcher = (mode: string, ids?: string[]) => Promise<void>;
type Mutator = (fn: (old: Progress) => Progress) => void;
function Onboarding({
  initial,
  save,
  demo,
}: {
  initial: Profile | null;
  save: (p: Profile) => void;
  demo?: () => void;
}) {
  const [form, setForm] = useState<Profile>(
    initial || {
      name: "",
      examDate: "",
      attempt: 1,
      hours: 10,
      sessionMinutes: 20,
      studied: false,
      completionDate: "",
      confidence: Object.fromEntries(topics.map((t) => [t.id, 1])),
    },
  );
  const [message, setMessage] = useState("");
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dateInput = e.currentTarget.elements.namedItem(
      "examDate",
    ) as HTMLInputElement;
    const date = dateInput.value;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date))
    ) {
      setMessage("Enter a valid exam date.");
      return;
    }
    const completionDate = (
      e.currentTarget.elements.namedItem("completionDate") as HTMLInputElement
    ).value;
    const profile = { ...form, examDate: date, completionDate };
    if (profile.completionDate && profile.completionDate > profile.examDate) {
      setMessage("Target completion must be on or before the exam date.");
      return;
    }
    save(profile);
    navigate("/");
  }
  return (
    <div className="onboarding">
      <section className="onboarding-intro">
        <span className="pill">2026 CURRICULUM · ALL 10 TOPICS</span>
        <h1>
          Build knowledge.
          <br />
          <em>Make it stay.</em>
        </h1>
        <p>
          A study journey that remembers what you’re forgetting. Set your pace;
          Atlas will assemble your next useful session.
        </p>
        <div className="intro-steps">
          <span>
            <BookOpen /> Understand
          </span>
          <span>
            <Target /> Retrieve
          </span>
          <span>
            <Brain /> Retain
          </span>
        </div>
        <div className="coverage-note">
          <b>Your complete curriculum map. A growing practice bank.</b>
          <p>
            {catalog.length} original concept cards across the supplied modules.
            Detailed section coverage and limitations are visible in the map.
          </p>
        </div>
        {demo && (
          <Button secondary onClick={demo}>
            Explore a labeled demo <ArrowRight size={16} />
          </Button>
        )}
      </section>
      <form className="panel onboarding-form" onSubmit={submit}>
        <p className="eyebrow">YOUR STUDY PROFILE</p>
        <h2>{initial ? "Adjust your journey" : "Make this your workspace"}</h2>
        <label>
          Your name
          <input
            required
            maxLength={60}
            placeholder="What should we call you?"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <div className="two-col">
          <label>
            Exam date
            <input
              aria-label="Exam date"
              name="examDate"
              required
              type="date"
              value={form.examDate}
              onChange={(e) => setForm({ ...form, examDate: e.target.value })}
            />
          </label>
          <label>
            Attempt
            <select
              value={form.attempt}
              onChange={(e) => setForm({ ...form, attempt: +e.target.value })}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n === 4 ? "4 or later" : n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Study hours / week
            <input
              required
              type="number"
              min={1}
              max={100}
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: +e.target.value })}
            />
          </label>
          <label>
            Session length
            <select
              value={form.sessionMinutes}
              onChange={(e) =>
                setForm({ ...form, sessionMinutes: +e.target.value })
              }
            >
              {[10, 15, 20, 30, 45, 60].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Target first-pass completion (optional)
          <input
            type="date"
            name="completionDate"
            value={form.completionDate}
            onChange={(e) =>
              setForm({ ...form, completionDate: e.target.value })
            }
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={form.studied}
            onChange={(e) => setForm({ ...form, studied: e.target.checked })}
          />{" "}
          I have studied this curriculum before
        </label>
        <details>
          <summary>Set confidence by subject</summary>
          <div className="confidence-list">
            {topics.map((t) => (
              <label key={t.id}>
                {t.title}
                <select
                  aria-label={t.title + " confidence"}
                  value={form.confidence[t.id] ?? 1}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      confidence: {
                        ...form.confidence,
                        [t.id]: +e.target.value,
                      },
                    })
                  }
                >
                  <option value={0}>New to this</option>
                  <option value={1}>Low</option>
                  <option value={2}>Medium</option>
                  <option value={3}>High</option>
                </select>
              </label>
            ))}
          </div>
        </details>
        {message && <p role="alert">{message}</p>}
        <button className="button" type="submit">
          {initial ? "Save study profile" : "Enter my command center"}{" "}
          <ArrowRight size={17} />
        </button>
        <small>
          No account or API key required. Progress stays in this browser.
        </small>
      </form>
    </div>
  );
}
function Dashboard({
  p,
  launch,
  busy,
}: {
  p: Progress;
  launch: Launcher;
  busy: boolean;
}) {
  const r = readiness(p, catalog);
  const stats = topicStats(p, catalog);
  const days = Math.ceil(
    (new Date(p.profile!.examDate + "T23:59:59").getTime() - Date.now()) / DAY,
  );
  const xp = p.attempts.reduce((s, a) => s + a.xp, 0);
  const quest = recommend(p, catalog, "Daily Quest", 6);
  const touched = catalog.filter((c) => p.memory[c.id]?.seen).length;
  const allModules = topics
    .flatMap((t) => t.modules)
    .filter((m) => !m.supplement);
  const startedModules = allModules.filter((m) =>
    catalog.some((c) => c.moduleId === m.id && p.memory[c.id]?.seen),
  ).length;
  const weeks = Math.max(1, days / 7);
  const target = p.profile!.completionDate || p.profile!.examDate;
  const targetWeeks = Math.max(
    1,
    (new Date(target).getTime() - Date.now()) / DAY / 7,
  );
  const needed = (allModules.length - startedModules) / targetWeeks;
  const studyDays = new Set(p.attempts.map((a) => dateKey(a.at))).size;
  const elapsed = p.attempts.length
    ? Math.max(1, (Date.now() - Math.min(...p.attempts.map((a) => a.at))) / DAY)
    : 0;
  const pace = elapsed ? startedModules / elapsed : 0;
  const eta = pace
    ? new Date(
        Date.now() + ((allModules.length - startedModules) / pace) * DAY,
      ).toLocaleDateString()
    : null;
  return (
    <>
      <Title
        eyebrow="YOUR COMMAND CENTER"
        title={`Welcome${p.profile?.name ? ", " + p.profile.name.split(" ")[0] : ""}.`}
      >
        <span className="date-label">
          <Calendar size={16} />
          {Math.max(0, days)} days to exam{days < 0 ? " · update date" : ""}
        </span>
      </Title>
      <div className="dashboard-top">
        <section className="quest-card">
          <div className="quest-copy">
            <span className="pill">
              <Sparkles size={14} /> YOUR NEXT BEST SESSION
            </span>
            <h2>
              Small session.
              <br />
              Stronger recall.
            </h2>
            <p>
              {stats.due
                ? `${stats.due} concepts are due for review. Let’s recover them and keep moving.`
                : "Start with a few core ideas, then retrieve them from memory."}
            </p>
            <div className="quest-meta">
              <span>
                <Clock size={16} />
                {p.profile?.sessionMinutes} min
              </span>
              <span>
                <Shuffle size={16} />
                Mixed topics
              </span>
              <span>
                <Target size={16} />
                Adaptive selection
              </span>
            </div>
            <Button disabled={busy} onClick={() => launch("Daily Quest")}>
              {busy ? "Preparing…" : "Start today’s quest"}
              <ArrowRight size={18} />
            </Button>
          </div>
          <div className="quest-orbit">
            <Brain size={68} strokeWidth={1} />
            <span className="orbit-tag">LEARN → RECALL → RETURN</span>
          </div>
        </section>
        <section className="panel readiness">
          <p className="eyebrow">READINESS SIGNAL</p>
          <Ring value={r.score} label="of authored bank" />
          <a href="#/analytics">
            How this is calculated <ChevronRight size={14} />
          </a>
          <small>
            Not a pass probability. Uncovered curriculum is excluded.
          </small>
        </section>
      </div>
      <div className="stats-grid">
        <Stat
          label="Cards introduced"
          value={`${touched}/${catalog.length}`}
          detail={`${Math.round((touched / catalog.length) * 100)}% of authored cards`}
          icon={<BookOpen />}
        />
        <Stat
          label="Review due"
          value={String(stats.due)}
          detail="Keep memories from fading"
          icon={<Brain />}
        />
        <Stat
          label="Recent accuracy"
          value={
            p.attempts.length ? `${accuracy(p.attempts.slice(-50))}%` : "—"
          }
          detail={`${fmt(p.attempts.length)} retrieval attempts`}
          icon={<Target />}
        />
        <Stat
          label="Learning XP"
          value={fmt(xp)}
          detail={`Level ${Math.floor(xp / 250) + 1} · ${studyDays} active days`}
          icon={<Zap />}
        />
      </div>
      <div className="two-col dashboard-lower">
        <section className="panel">
          <div className="section-head">
            <h2>On your route today</h2>
            <a href="#/study">
              Study arena <ArrowRight size={15} />
            </a>
          </div>
          {quest.map((c, i) => (
            <a key={c.id} className="quest-row" href={"#/concept/" + c.id}>
              <span className="number">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <b>{c.name}</b>
                <small>{topics.find((t) => t.id === c.topicId)?.title}</small>
              </div>
              <span className="status">{state(p.memory[c.id])}</span>
              <ChevronRight size={17} />
            </a>
          ))}
        </section>
        <section className="panel">
          <div className="section-head">
            <h2>Your study rhythm</h2>
            <span className="pill">THIS WEEK</span>
          </div>
          <Weekly p={p} />
          <div className="pace">
            <b>{needed.toFixed(1)} modules / week</b>
            <p>
              First-pass pace to{" "}
              {new Date(target + "T12:00:00").toLocaleDateString()}.{" "}
              {p.profile?.hours} study hours available per week; about{" "}
              {(p.profile!.hours / Math.max(0.1, needed)).toFixed(1)} hours per
              remaining module.
            </p>
            <p>
              {eta
                ? `Observed first-card pace points to ${eta}. This is not a forecast of full module mastery.`
                : "Study for several days to establish a completion trajectory."}
            </p>
            <small>
              {startedModules}/{allModules.length} modules started ·{" "}
              {Math.round(weeks)} weeks remaining. Cards are a starting point;
              complete the source sections too.
            </small>
          </div>
        </section>
      </div>
      <div className="section-head">
        <h2>The ten territories</h2>
        <a href="#/curriculum">
          Open curriculum map <ArrowRight size={16} />
        </a>
      </div>
      <div className="topic-mini-grid">
        {topics.map((t) => {
          const s = topicStats(
            p,
            catalog.filter((c) => c.topicId === t.id),
          );
          return (
            <a
              className="topic-mini"
              href={"#/topic/" + t.id}
              key={t.id}
              style={{ borderTopColor: t.color }}
            >
              <span>{String(t.volume).padStart(2, "0")}</span>
              <b>{t.title}</b>
              <Bar value={s.mastery} color={t.color} />
              <small>{s.mastery}% memory strength</small>
            </a>
          );
        })}
      </div>
    </>
  );
}
function Stat({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="stat">
      <div>
        {label}
        {icon}
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
function Weekly({ p }: { p: Progress }) {
  return (
    <div className="weekly">
      {Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 6 + i);
        const a = p.attempts.filter((a) => dateKey(a.at) === dateKey(+d));
        const mins = Math.round(a.reduce((s, a) => s + a.seconds, 0) / 60);
        return (
          <div key={i} title={`${mins} active minutes`}>
            <strong>{mins || "·"}</strong>
            <span
              className="activity-bar"
              style={{ height: Math.max(4, Math.min(100, mins * 3)) }}
            />
            <small>
              {d.toLocaleDateString(undefined, { weekday: "short" })}
            </small>
          </div>
        );
      })}
    </div>
  );
}

function LearnAcademy({ p }: { p: Progress }) {
  const totalModules = topics.reduce(
    (sum, t) => sum + t.modules.filter((m) => !m.supplement).length,
    0,
  );
  const introduced = catalog.filter((c) => p.memory[c.id]?.seen).length;
  return (
    <>
      <Title eyebrow="BEGIN WITH NO ASSUMED FINANCE KNOWLEDGE" title="Learn the syllabus from zero">
        <Button onClick={() => navigate("/topic/v1")}>
          Start at the beginning <ArrowRight size={16} />
        </Button>
      </Title>
      <section className="learn-hero panel">
        <div>
          <span className="pill">BEGINNER PATH</span>
          <h2>Understand first. Calculate second. Retrieve third.</h2>
          <p className="lead">
            Every module now opens with a plain-English briefing, assumed
            knowledge, translated vocabulary, a source-mapped concept path,
            worked examples, exam traps, and retrieval practice. Formula-heavy
            lessons connect to the BA II Plus lab.
          </p>
        </div>
        <div className="learning-sequence" aria-label="Learning sequence">
          {["Mental model", "Key language", "Worked example", "Calculator", "Recall", "Mixed practice"].map((x, i) => (
            <div key={x}><b>{i + 1}</b><span>{x}</span></div>
          ))}
        </div>
      </section>
      <div className="academy-stats">
        <Stat label="Topics" value="10" detail="All supplied 2026 volumes" icon={<BookOpen />} />
        <Stat label="Learning modules" value={String(totalModules)} detail="Complete module map" icon={<GraduationCap />} />
        <Stat label="Foundation lessons" value={String(catalog.length)} detail={`${introduced} introduced`} icon={<Brain />} />
        <Stat label="Source sections" value={fmt(topics.flatMap((t) => t.modules).reduce((s, m) => s + m.sections.length, 0))} detail="Indexed for syllabus navigation" icon={<Library />} />
      </div>
      <h2 className="block-heading">Choose your starting territory</h2>
      <div className="learn-topic-list">
        {topics.map((t, i) => {
          const cs = catalog.filter((c) => c.topicId === t.id);
          const st = topicStats(p, cs);
          const first = t.modules.find((m) => !m.supplement);
          return (
            <article className="panel learn-topic" key={t.id} style={{ "--topic": t.color } as React.CSSProperties}>
              <div className="learn-number">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <span className="eyebrow">{t.modules.filter((m) => !m.supplement).length} MODULES · {cs.length} FOUNDATION LESSONS</span>
                <h2>{t.title}</h2>
                <p>{beginnerBrief(t, first!).mentalModel.split(" In this module")[0]}</p>
                <Bar value={st.mastery} color={t.color} />
              </div>
              <div className="learn-topic-actions">
                <span>{st.mastery}% memory strength</span>
                <Button secondary onClick={() => navigate("/topic/" + t.id)}>Open topic</Button>
              </div>
            </article>
          );
        })}
      </div>
      <section className="panel calculator-callout">
        <Calculator size={34} />
        <div><span className="eyebrow">EXAM-DAY MECHANICS</span><h2>Do not postpone calculator fluency.</h2><p>Train worksheet clearing, signs, TVM, NPV/IRR, statistics, interest conversion, bonds, and amortization alongside the related concepts.</p></div>
        <Button onClick={() => navigate("/calculator")}>Open BA II Plus lab</Button>
      </section>
    </>
  );
}

function CalculatorLab() {
  const [selected, setSelected] = useState(calculatorDrills[0].id);
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState("Press the highlighted key to begin.");
  const drill = calculatorDrills.find((d) => d.id === selected)!;
  const complete = step >= drill.keys.length;
  const keypad = [
    { key: "CPT", second: "QUIT", tone: "dark" },
    { key: "ENTER", second: "SET", tone: "dark" },
    { key: "↑", second: "DEL", tone: "dark" },
    { key: "↓", second: "INS", tone: "dark" },
    { key: "≡", second: "", tone: "dark" },
    { key: "2ND", second: "", tone: "second" },
    { key: "CF", second: "", tone: "dark" },
    { key: "NPV", second: "", tone: "dark" },
    { key: "IRR", second: "", tone: "dark" },
    { key: "→", second: "", tone: "dark" },
    { key: "N", second: "xP/Y", tone: "light" },
    { key: "I/Y", second: "P/Y", tone: "light" },
    { key: "PV", second: "AMORT", tone: "light" },
    { key: "PMT", second: "BGN", tone: "light" },
    { key: "FV", second: "CLR TVM", tone: "light" },
    { key: "%", second: "K", tone: "dark" },
    { key: "√x", second: "", tone: "dark math" },
    { key: "x²", second: "", tone: "dark math" },
    { key: "1/x", second: "", tone: "dark math" },
    { key: "÷", second: "RAND", tone: "dark" },
    { key: "INV", second: "HYP", tone: "dark" },
    { key: "(", second: "SIN", tone: "dark math" },
    { key: ")", second: "COS", tone: "dark math" },
    { key: "yˣ", second: "TAN", tone: "dark math" },
    { key: "×", second: "x!", tone: "dark" },
    { key: "LN", second: "eˣ", tone: "dark" },
    { key: "7", second: "DATA", tone: "number" },
    { key: "8", second: "STAT", tone: "number" },
    { key: "9", second: "BOND", tone: "number" },
    { key: "−", second: "nPr", tone: "dark" },
    { key: "STO", second: "ROUND", tone: "dark" },
    { key: "4", second: "DEPR", tone: "number" },
    { key: "5", second: "Δ%", tone: "number" },
    { key: "6", second: "BRKEVN", tone: "number" },
    { key: "+", second: "nCr", tone: "dark" },
    { key: "RCL", second: "", tone: "dark" },
    { key: "1", second: "DATE", tone: "number" },
    { key: "2", second: "ICONV", tone: "number" },
    { key: "3", second: "PROFIT", tone: "number" },
    { key: "=", second: "ANS", tone: "dark equals" },
    { key: "CE/C", second: "CLR WORK", tone: "dark" },
    { key: "0", second: "MEM", tone: "number" },
    { key: ".", second: "FORMAT", tone: "number" },
    { key: "+/−", second: "RESET", tone: "number" },
  ];
  function choose(id: string) {
    setSelected(id); setStep(0); setMistakes(0); setFeedback("Press the highlighted key to begin.");
  }
  function press(key: string) {
    if (complete) return;
    const expected = drill.keys[step];
    if (key === expected) {
      setStep(step + 1);
      setFeedback(step + 1 === drill.keys.length ? "Sequence complete. Read the result and explain why it makes sense." : `Correct — ${drill.display[step] || key}`);
    } else {
      setMistakes(mistakes + 1);
      setFeedback(`Not yet. The next key is ${expected}. Clear, slow, accurate sequences become fast sequences.`);
    }
  }
  const groups = ["Foundation", "Core CFA", "Exam ready"] as const;
  return (
    <>
      <Title eyebrow="PHYSICAL-CALCULATOR MUSCLE MEMORY" title="BA II Plus lab">
        <span className="pill">12 GUIDED DRILLS</span>
      </Title>
      <div className="calculator-intro panel">
        <div><h2>Your calculator remembers more than you think.</h2><p>The BA II Plus stores worksheet values after you leave a worksheet and even after power-off. Train a fixed pre-question routine so a hidden PMT, BGN setting, frequency, or stale cash flow cannot silently cost a mark.</p></div>
        <div className="source-links"><a href={calculatorSources.guide} target="_blank" rel="noreferrer">Official TI guidebook</a><a href={calculatorSources.policy} target="_blank" rel="noreferrer">CFA calculator policy</a></div>
      </div>
      <div className="calculator-layout">
        <aside className="panel drill-menu">
          {groups.map((g) => <div key={g}><span className="eyebrow">{g}</span>{calculatorDrills.filter((d) => d.level === g).map((d) => <button className={d.id === selected ? "active" : ""} key={d.id} onClick={() => choose(d.id)}>{d.title}<small>{d.purpose}</small></button>)}</div>)}
        </aside>
        <section className="panel drill-workspace">
          <div className="section-head"><span className="pill">{drill.level}</span><span className="muted">{Math.min(step, drill.keys.length)} / {drill.keys.length} keys · {mistakes} misses</span></div>
          <h2>{drill.title}</h2><p className="lead">{drill.problem}</p>
          <div className="calculator-device">
            <div className="calculator-brandline"><span>BA II PLUS™</span><b>FINANCIAL CALCULATOR</b></div>
            <div className="calculator-display"><small>{complete ? "COMPLETE" : step === 0 ? "" : drill.display[Math.max(0, step - 2)] || ""}</small><strong>{complete ? drill.answer : step === 0 ? "0.0000" : drill.display[step - 1] || "0"}</strong><span>{complete ? "✓" : `NEXT ${drill.keys[step]}`}</span></div>
            <div className="keypad">{keypad.map((k, i) => <div className={`calc-key-wrap ${k.tone.includes("equals") ? "equals-wrap" : ""}`} key={`${k.key}-${i}`}><span>{k.second}</span><button aria-label={k.key} className={`${k.tone} ${k.key === drill.keys[step] ? "next-key" : ""}`} onClick={() => press(k.key)}>{k.key}</button></div>)}</div>
          </div>
          <p className={feedback.startsWith("Not") ? "calc-feedback wrong" : "calc-feedback"}>{feedback}</p>
          <div className="sequence-strip">{drill.keys.map((k, i) => <span className={i < step ? "done" : i === step ? "current" : ""} key={i}>{k}</span>)}</div>
          {complete && <div className="calc-explain"><p><b>Why it works:</b> {drill.why}</p><p><b>Exam trap:</b> {drill.trap}</p><Button secondary onClick={() => choose(calculatorDrills[(calculatorDrills.indexOf(drill) + 1) % calculatorDrills.length].id)}>Next drill <ArrowRight size={15} /></Button></div>}
        </section>
      </div>
      <section className="panel exam-checklist"><h2>Exam-day calculator checklist</h2>{calculatorChecklist.map((x) => <p key={x}><Check size={17} />{x}</p>)}</section>
      <p className="coverage-note">The trainer reproduces guided key sequences and expected displays; it is not a complete electronic emulator. Verify physical key labels on your own model and practice every drill on that calculator.</p>
    </>
  );
}

function GameArcade({ p, mutate }: { p: Progress; mutate: Mutator }) {
  const [selected, setSelected] = useState(conceptGames[0].topicId);
  const [objectiveId, setObjectiveId] = useState("");
  const [phase, setPhase] = useState<"brief" | "lab" | "play" | "done">("brief");
  const [driver, setDriver] = useState(conceptGames[0].start);
  const [prediction, setPrediction] = useState<Direction | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [graded, setGraded] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [points, setPoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [started, setStarted] = useState(0);
  const [loading, setLoading] = useState(false);
  const game = conceptGames.find((item) => item.topicId === selected)!;
  const topic = topics.find((item) => item.id === selected)!;
  const objectives = learningObjectives.filter((item) => item.studyModule.topicId === selected);
  const q = questions[index];
  const output = game.calculate(driver);
  const gameAttempts = p.attempts.filter((attempt) => attempt.mode === `Game: ${game.title}`);
  const gameAccuracy = accuracy(gameAttempts);

  function chooseGame(topicId: string) {
    const next = conceptGames.find((item) => item.topicId === topicId)!;
    setSelected(topicId);
    setObjectiveId("");
    setPhase("brief");
    setDriver(next.start);
    setPrediction(null);
    setQuestions([]);
  }

  async function beginCampaign() {
    setLoading(true);
    try {
      const selectedObjective = objectiveId ? findObjective(objectiveId) : undefined;
      const allowedModules = selectedObjective ? [selectedObjective.studyModule.moduleId] : topic.modules.filter((module) => !module.supplement).map((module) => module.id);
      const concepts = (await loadTopic(selected)).filter((concept) => allowedModules.includes(concept.moduleId));
      const pool = concepts.flatMap((concept) => concept.questions.filter((question) => question.choices.length === 3));
      const leastSeen = [...pool].sort((a, b) => p.attempts.filter((attempt) => attempt.questionId === a.id).length - p.attempts.filter((attempt) => attempt.questionId === b.id).length || Math.random() - .5);
      const campaign: Question[] = [];
      for (const concept of concepts) {
        const next = leastSeen.find((question) => question.conceptId === concept.id && !campaign.includes(question));
        if (next) campaign.push(next);
        if (campaign.length === 8) break;
      }
      for (const question of leastSeen) {
        if (campaign.length === 8) break;
        if (!campaign.includes(question)) campaign.push(question);
      }
      setQuestions(campaign);
      setIndex(0);
      setChoice(null);
      setConfidence(null);
      setGraded(false);
      setResults([]);
      setPoints(prediction === game.prediction ? 100 : 0);
      setCombo(0);
      setLives(3);
      setStarted(Date.now());
      setPhase("play");
    } finally {
      setLoading(false);
    }
  }

  function commitMove() {
    if (!q || choice === null || confidence === null || graded) return;
    const correct = choice === q.answer;
    const when = Date.now();
    const updated = updateMemory(p.memory[q.conceptId], correct, confidence, q.difficulty, `game-${game.visual}`, when);
    const nextCombo = correct ? combo + 1 : 0;
    const movePoints = correct ? 100 + q.difficulty * 35 + nextCombo * 20 : 0;
    mutate((old) => ({
      ...old,
      memory: { ...old.memory, [q.conceptId]: updated.memory },
      attempts: [...old.attempts, {
        id: newId(), questionId: q.id, conceptId: q.conceptId, topicId: q.topicId, at: when,
        correct, confidence, difficulty: q.difficulty, format: `game-${game.visual}`,
        seconds: Math.min(1800, Math.round((when - started) / 1000)), xp: updated.xp,
        error: correct ? "" : confidence === 3 ? "Confident misconception" : confidence === 0 ? "Guess" : "Concept not understood",
        mode: `Game: ${game.title}`,
      }],
    }));
    setResults((items) => [...items, correct]);
    setPoints((value) => value + movePoints);
    setCombo(nextCombo);
    if (!correct) setLives((value) => Math.max(0, value - 1));
    setGraded(true);
  }

  function nextMove() {
    if (index + 1 >= questions.length) {
      const correct = results.filter(Boolean).length;
      mutate((old) => ({ ...old, sessions: [...old.sessions, { id: newId(), mode: `Game: ${game.title}`, at: Date.now(), total: questions.length, correct, seconds: Math.round((Date.now() - started) / 1000) }] }));
      setPhase("done");
      return;
    }
    setIndex((value) => value + 1);
    setChoice(null);
    setConfidence(null);
    setGraded(false);
  }

  const focus = q ? learningObjectives.find((item) => item.studyModule.moduleId === q.moduleId) : undefined;
  if (phase === "play" && q) return (
    <>
      <Title eyebrow={`${topic.title} / LIVE CAMPAIGN`} title={game.title}><Button secondary onClick={() => setPhase("brief")}>Exit game</Button></Title>
      <div className={`game-shell game-${game.visual}`}>
        <div className="game-hud panel"><div><small>MISSION</small><b>{objectiveId ? "Targeted outcome" : "Topic campaign"}</b></div><div><small>ROUND</small><b>{index + 1}/{questions.length}</b></div><div><small>SHIELDS</small><b className="game-lives">{"◆".repeat(lives)}{"◇".repeat(3 - lives)}</b></div><div><small>COMBO</small><b>×{combo}</b></div><div><small>SCORE</small><b>{points}</b></div></div>
        <div className="game-stage panel">
          <div className="game-scene" aria-hidden="true"><span></span><span></span><span></span><div>{game.role}</div></div>
          <div className="game-briefing"><span className="eyebrow">{game.mechanic}</span><h2>{q.prompt}</h2>{focus && <a href={`#/objective/${focus.objective.id}`}>Outcome focus {focus.objective.code}: open teaching</a>}</div>
          <div className="game-moves">
            {q.choices.map((answer, answerIndex) => <button disabled={graded} className={`${choice === answerIndex ? "selected " : ""}${graded ? answerIndex === q.answer ? "correct" : choice === answerIndex ? "wrong" : "" : ""}`} onClick={() => setChoice(answerIndex)} key={answer}><span>{["A", "B", "C"][answerIndex]}</span><p>{answer}</p></button>)}
          </div>
          {!graded && <div className="game-console"><fieldset className="confidence"><legend>Lock your confidence before committing the move</legend>{["Guess", "Low", "Medium", "High"].map((label, confidenceIndex) => <button className={confidence === confidenceIndex ? "selected" : ""} onClick={() => setConfidence(confidenceIndex)} key={label}>{label}</button>)}</fieldset><Button disabled={choice === null || confidence === null} onClick={commitMove}>Commit move <Zap size={16} /></Button></div>}
          {graded && <div className={`game-debrief ${choice === q.answer ? "win" : "repair"}`}><span>{choice === q.answer ? "MOVE CLEARED" : confidence === 3 ? "CRITICAL MISCONCEPTION" : "REPAIR WINDOW"}</span><h3>{choice === q.answer ? `+${100 + q.difficulty * 35 + combo * 20} game points` : "The shield is lost; the knowledge is not."}</h3><p>{q.explanation}</p>{q.distractors[choice === q.answer ? 0 : choice || 0] && choice !== q.answer && <p><b>Why that move failed:</b> {q.distractors[choice!]}</p>}<div className="actions">{focus && <Button secondary onClick={() => navigate(`/objective/${focus.objective.id}`)}>Study the outcome</Button>}<Button onClick={nextMove}>{index + 1 === questions.length ? "Finish campaign" : "Next move"}<ArrowRight size={16} /></Button></div></div>}
        </div>
      </div>
    </>
  );

  if (phase === "done") {
    const correct = results.filter(Boolean).length;
    const pct = Math.round(correct / (questions.length || 1) * 100);
    return <><Title eyebrow="CAMPAIGN COMPLETE" title={game.title} /><section className="panel game-victory"><Trophy /><span className="eyebrow">{pct >= 80 ? "DESK MASTERED" : pct >= 60 ? "MISSION SURVIVED" : "REPAIR MISSION CREATED"}</span><h2>{correct}/{questions.length} moves cleared</h2><div className="victory-score">{points}<small>game points</small></div><p>{pct >= 80 ? "Strong decisions. The next challenge is delayed retrieval: return after the review interval, not immediately." : "The failed moves are now part of your learning history. Memory Rescue will bring weak concepts back."}</p><div className="actions"><Button onClick={() => { setPrediction(null); setDriver(game.start); setPhase("lab"); }}>Play again</Button><Button secondary onClick={() => navigate("/review")}>Open Memory Rescue</Button><Button secondary onClick={() => setPhase("brief")}>Choose another mission</Button></div></section></>;
  }

  return (
    <>
      <Title eyebrow="TEN SUBJECTS · TEN WAYS TO THINK" title="Concept arcade"><span className="pill">REAL LEARNING GAMES</span></Title>
      <div className="game-tabs" role="tablist" aria-label="Choose a concept game">{conceptGames.map((item, i) => <button role="tab" aria-selected={selected === item.topicId} className={selected === item.topicId ? "active" : ""} onClick={() => chooseGame(item.topicId)} key={item.topicId}><span>{String(i + 1).padStart(2, "0")}</span><b>{item.title}</b><small>{topics.find((topic) => topic.id === item.topicId)?.title}</small></button>)}</div>
      <div className={`game-launch game-${game.visual}`}>
        <section className="panel game-profile"><div className="game-emblem"><Gamepad2 /></div><span className="eyebrow">YOU ARE THE {game.role.toUpperCase()}</span><h2>{game.title}</h2><p className="lead">{game.mission}</p><div className="mechanic-card"><b>How this game works</b><p>{game.mechanic}</p><span>Prediction lab → 8 decision rounds → instant repair → spaced review</span></div><dl><dt>Topic outcomes available</dt><dd>{objectives.length}</dd><dt>Previous game accuracy</dt><dd>{gameAttempts.length ? `${gameAccuracy}%` : "New"}</dd><dt>Recorded game moves</dt><dd>{gameAttempts.length}</dd></dl></section>
        {phase === "brief" ? <section className="panel game-mission-select"><span className="eyebrow">SELECT A CAMPAIGN</span><h2>Play broadly or attack one outcome.</h2><button className={!objectiveId ? "mission-option active" : "mission-option"} onClick={() => setObjectiveId("")}><Shuffle /><div><b>Full topic campaign</b><p>Interleaved questions across the subject. Best for flexible exam recall.</p></div><Check /></button><label className={objectiveId ? "mission-option active objective-pick" : "mission-option objective-pick"}><Target /><div><b>Target one learning outcome</b><p>Choose any mapped outcome; the campaign uses its parent module’s concept bank.</p><select value={objectiveId} onChange={(event) => setObjectiveId(event.target.value)}><option value="">Choose an outcome…</option>{objectives.map(({ objective, studyModule }) => <option value={objective.id} key={objective.id}>{objective.code} · {studyModule.title.toLowerCase()}</option>)}</select></div></label><Button onClick={() => setPhase("lab")}>Enter prediction lab <ArrowRight size={16} /></Button></section> : <section className="panel prediction-lab"><span className="eyebrow">INTUITION BEFORE FORMULA</span><h2>Predict first. Then move the control.</h2><p>{game.predictionPrompt}</p><div className="prediction-buttons">{(["Rises", "Falls", "Depends"] as Direction[]).map((direction) => <button className={prediction === direction ? "selected" : ""} onClick={() => setPrediction(direction)} key={direction}>{direction}</button>)}</div>{prediction && <div className={prediction === game.prediction ? "prediction-result correct" : "prediction-result wrong"}><b>{prediction === game.prediction ? "Prediction correct." : `Not quite—the direction is ${game.prediction.toLowerCase()}.`}</b><p>{game.intuition}</p></div>}<label className="game-slider"><span>{game.driver}<b>{driver} {game.unit}</b></span><input aria-label={game.driver} type="range" min={game.min} max={game.max} step={game.step} value={driver} onChange={(event) => setDriver(Number(event.target.value))} /></label><div className="sim-output"><span>{output.label}</span><b>{output.value}</b><small>{output.note}</small></div><Button disabled={!prediction || loading} onClick={beginCampaign}>{loading ? "Loading campaign…" : "Launch decision rounds"}<Play size={16} /></Button></section>}
      </div>
      <p className="coverage-note">Games use original CFA Atlas questions and simplified teaching simulations. Simulation outputs state their assumptions and are not market forecasts. Correct game moves update the same confidence-sensitive mastery and review schedule as formal practice.</p>
    </>
  );
}

function KnowledgeRepository() {
  const [selected, setSelected] = useState(topics[0].id);
  const [search, setSearch] = useState("");
  const topic = topics.find((item) => item.id === selected)!;
  const grouped = modulesForTopic(selected);
  const query = search.trim().toLowerCase();
  const visible = grouped.filter((item) =>
    `${item.title} ${item.objectives.map((objective) => objective.text).join(" ")}`
      .toLowerCase()
      .includes(query),
  );
  const stats = knowledgeStats(selected);
  const byOfficial = topic.modules
    .filter((item) => !item.supplement)
    .map((official) => ({
      official,
      branches: visible.filter((item) => item.moduleId === official.id),
    }))
    .filter((item) => item.branches.length);
  return (
    <>
      <Title eyebrow="THE COMPLETE LEARNING-OUTCOME CROSSWALK" title="Knowledge mind maps">
        <span className="pill">{knowledgeMeta.learningObjectives} OUTCOMES</span>
      </Title>
      <section className="panel knowledge-hero">
        <div>
          <span className="eyebrow">CURRICULUM → MODULE → TEACHING UNIT → OUTCOME</span>
          <h2>See the syllabus before you memorize it.</h2>
          <p>This map joins the official 2026 curriculum structure to the more granular teaching sequence in your four study-note books. Every outcome opens a beginner route, relevant foundation cards, formulas where applicable, and module practice.</p>
        </div>
        <div className="knowledge-total"><b>{knowledgeMeta.studyModules}</b><span>teaching units</span><b>{knowledgeMeta.pages}</b><span>pages audited</span></div>
      </section>
      <div className="topic-tabs" role="tablist" aria-label="CFA topics">
        {topics.map((item) => <button role="tab" aria-selected={selected === item.id} className={selected === item.id ? "active" : ""} onClick={() => setSelected(item.id)} key={item.id}><span>{item.volume}</span>{item.title}</button>)}
      </div>
      <div className="mindmap-toolbar">
        <div><span className="eyebrow">TOPIC {topic.volume}</span><h2>{topic.title}</h2><p>{stats.officialModules} official modules · {stats.studyModules} teaching units · {stats.objectives} learning outcomes · {stats.cards} deep foundation lessons</p></div>
        <label className="search"><Search size={18} /><input aria-label="Search this mind map" placeholder="Find an outcome or concept…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      </div>
      <div className="mindmap" style={{ "--topic": topic.color } as React.CSSProperties}>
        <div className="mind-root"><GitBranch /><b>{topic.title}</b><small>{stats.objectives} outcome nodes</small></div>
        <div className="mind-trunk">
          {byOfficial.map(({ official, branches }, moduleIndex) => <details className="mind-official" open={!query && moduleIndex < 2 || !!query} key={official.id}>
            <summary><span>MODULE {official.number}</span><b>{official.title}</b><small>{branches.reduce((sum, item) => sum + item.objectives.length, 0)} outcomes</small></summary>
            <div className="mind-branches">
              {branches.map((studyModule) => <div className="mind-study" key={studyModule.id}>
                <a href={`#/module/${official.id}`}><span>{studyModule.reading}.{studyModule.part}</span><b>{studyModule.title.toLowerCase()}</b><small>Book {studyModule.book} · PDF p. {studyModule.pdfPage}</small></a>
                <div className="mind-leaves">
                  {studyModule.objectives.map((objective) => <a href={`#/objective/${objective.id}`} key={objective.id}><span>{objective.code}</span><p>{objective.text}</p><ChevronRight size={15} /></a>)}
                  {!studyModule.objectives.length && <a href={`#/module/${official.id}`}><span>GUIDE</span><p>Open this teaching unit through the official module lesson path.</p><ChevronRight size={15} /></a>}
                </div>
              </div>)}
            </div>
          </details>)}
        </div>
      </div>
      {!byOfficial.length && <Empty title="No matching outcomes" body="Clear the search or try a broader term." />}
      <p className="coverage-note">The study-note layer is used as a secondary teaching map. CFA Institute curriculum files remain authoritative. Outcome labels are source-indexed; explanations, examples, memory cues, and practice in CFA Atlas are original.</p>
    </>
  );
}

function ObjectiveLesson({ id, launch }: { id: string; launch: Launcher }) {
  const found = findObjective(id);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!found) return;
    setConcepts([]);
    loadTopic(found.studyModule.topicId)
      .then((items) => setConcepts(items.filter((item) => item.moduleId === found.studyModule.moduleId)))
      .catch((reason) => setError(reason.message));
  }, [id]);
  if (!found) return <Empty title="Learning outcome not found" body="Return to the knowledge mind maps and choose another node." />;
  const { objective, studyModule } = found;
  const topic = topics.find((item) => item.id === studyModule.topicId)!;
  const official = topic.modules.find((item) => item.id === studyModule.moduleId)!;
  const brief = beginnerBrief(topic, official);
  const guide = objectiveGuide(objective.text);
  const formulas = concepts.flatMap((concept) => concept.formula ? [{ ...concept.formula, conceptId: concept.id }] : []);
  const questionCount = concepts.reduce((sum, concept) => sum + concept.questions.filter((question) => question.choices.length > 0).length, 0);
  return (
    <>
      <Title eyebrow={`${topic.title} / OUTCOME ${objective.code}`} title={studyModule.title.toLowerCase()}>
        <Button secondary onClick={() => navigate("/knowledge")}>Back to mind map</Button>
      </Title>
      {error && <div className="alert">{error}</div>}
      <div className="objective-layout">
        <article className="panel objective-lesson">
          <div className="section-head"><span className="pill">BEGINNER PATH</span><span className="muted">READ → SEE → RETRIEVE → APPLY</span></div>
          <h2>What you must be able to do</h2>
          <p className="objective-source-text">{objective.text}</p>
          <div className="beginner-callout"><Sparkles /><div><b>Plain-English mission</b><p>{guide.mission}</p></div></div>
          <h2>Build the mental picture first</h2>
          <p className="lead">{brief.mentalModel}</p>
          <div className="brief-columns">
            <div><h3>Start with these foundations</h3>{brief.beforeYouStart.map((item) => <p key={item}><Check size={16} />{item}</p>)}</div>
            <div><h3>Translate the vocabulary</h3>{brief.vocabulary.map((item) => <p key={item.term}><b>{item.term}</b><span>{item.plain}</span></p>)}</div>
          </div>
          <h2>Your five-pass learning method</h2>
          <ol className="learning-passes">{guide.steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
          <h2>Deep lessons for this outcome</h2>
          <p className="muted">These authored foundation cards teach the parent module from first principles. Work them in order, then return for mixed retrieval.</p>
          <div className="objective-cards">
            {concepts.map((concept) => <a href={`#/concept/${concept.id}`} key={concept.id}><Brain size={19} /><div><b>{concept.name}</b><p>{concept.explanation}</p></div><ChevronRight size={17} /></a>)}
          </div>
          {!concepts.length && !error && <p>Loading the deep lessons…</p>}
          <h2>Formula helper</h2>
          {formulas.length ? formulas.map((formula) => <div className="objective-formula" key={formula.conceptId}><div><span className="eyebrow">{formula.name}</span><div className="formula-expression">{formula.expression}</div><p>{formula.variables}</p></div><div><b>When to use it</b><p>{formula.when}</p><b>Beginner intuition</b><p>{formula.intuition}</p><a href={`#/concept/${formula.conceptId}`}>Open worked example</a></div></div>) : <div className="conceptual-note"><Brain /><div><b>This outcome is mainly conceptual.</b><p>No formula is assigned to its current foundation cards. Build the classification or cause-and-effect rule, then practise applying it to a scenario.</p></div></div>}
          <div className="actions"><Button disabled={!concepts.length} onClick={() => launch("Practice", concepts.map((item) => item.id))}>Practise this outcome’s module <ArrowRight size={16} /></Button><Button secondary onClick={() => navigate("/calculator")}>Open BA II Plus lab</Button></div>
        </article>
        <aside className="objective-side">
          <div className="panel"><span className="eyebrow">SOURCE TRACE</span><h3>Study-note crosswalk</h3><p>Book {objective.book} · PDF p. {objective.pdfPage}<br />Teaching unit {studyModule.reading}.{studyModule.part}</p><h3>Official authority</h3><p>{topic.file}<br />PDF pp. {official.pdfPage}–{official.endPdfPage}<br />{official.title}</p><small>Use the official curriculum if wording or scope appears to conflict.</small></div>
          <div className="panel"><span className="eyebrow">RETRIEVAL COVERAGE</span><dl><dt>Foundation lessons</dt><dd>{concepts.length}</dd><dt>Original MCQs</dt><dd>{questionCount}</dd><dt>Relevant formulas</dt><dd>{formulas.length}</dd></dl><a href={`#/module/${official.id}`}>Open the complete module pathway</a></div>
        </aside>
      </div>
    </>
  );
}

function Curriculum({
  route,
  p,
  launch,
}: {
  route: string;
  p: Progress;
  launch: Launcher;
}) {
  const [search, setSearch] = useState("");
  const tid = route.startsWith("/topic/") ? route.split("/")[2] : null;
  const mid = route.startsWith("/module/") ? route.split("/")[2] : null;
  const module = topics.flatMap((t) => t.modules).find((m) => m.id === mid);
  const topic = topics.find((t) => t.id === (tid || module?.topicId));
  if (module) {
    const cs = catalog.filter((c) => c.moduleId === mid);
    const s = topicStats(p, cs);
    const brief = beginnerBrief(topic!, module);
    return (
      <>
        <Title
          eyebrow={`${topic?.title} / MODULE ${module.number}`}
          title={module.title}
        >
          <Button secondary onClick={() => navigate("/topic/" + topic?.id)}>
            Back to topic
          </Button>
        </Title>
        <div className="module-summary panel">
          <Ring value={s.mastery} label="memory strength" size={120} />
          <div>
            <h2>{cs.length} authored concept cards</h2>
            <p>
              {module.sections.length} source sections indexed · {s.mastered}{" "}
              cards mastered · {s.due} due for review
            </p>
            <p className="muted">
              Start with the beginner briefing, then work through the concept
              lessons and finish with retrieval practice.
            </p>
            {cs.length > 0 && (
              <Button
                onClick={() =>
                  launch(
                    "Practice",
                    cs.map((c) => c.id),
                  )
                }
              >
                Practice this module <Play size={15} />
              </Button>
            )}
          </div>
        </div>
        <section className="panel beginner-brief">
          <div className="section-head">
            <span className="pill">START HERE · NO PRIOR FINANCE ASSUMED</span>
            <span className="muted">FOUNDATION BRIEFING</span>
          </div>
          <h2>The mental model</h2>
          <p className="lead">{brief.mentalModel}</p>
          <div className="brief-columns">
            <div>
              <h3>Know these first</h3>
              {brief.beforeYouStart.map((x) => <p key={x}><Check size={16} />{x}</p>)}
            </div>
            <div>
              <h3>Translate the language</h3>
              {brief.vocabulary.map((x) => <p key={x.term}><b>{x.term}</b><span>{x.plain}</span></p>)}
            </div>
          </div>
          <details open>
            <summary>What this module expects you to explain and apply</summary>
            <div className="outcome-list">{brief.outcomes.map((x, i) => <div key={x}><span>{i + 1}</span>{x}</div>)}</div>
          </details>
          <div className="study-order">{brief.studyOrder.map((x, i) => <span key={x}><b>{i + 1}</b>{x}</span>)}</div>
        </section>
        <h2 className="block-heading">Concept pathway</h2>
        <div className="concept-path">
          {cs.map((c, i) => (
            <a key={c.id} href={"#/concept/" + c.id} className="concept-node">
              <div
                className={"node-circle " + (p.memory[c.id]?.seen ? "lit" : "")}
              >
                {state(p.memory[c.id]) === "Mastered" ? <Check /> : i + 1}
              </div>
              <div>
                <b>{c.name}</b>
                <small>
                  {state(p.memory[c.id])} · {retention(p.memory[c.id])}%
                  retention signal
                </small>
              </div>
              <ChevronRight />
            </a>
          ))}
        </div>
        {module.supplement && (
          <p className="notice">
            Reference supplement: statistical tables. Use the supplied volume;
            this is not an independently scored learning module.
          </p>
        )}
        <section className="panel">
          <h2>Source section map</h2>
          <p className="muted">
            Navigation metadata from the supplied PDF. Section headings are not
            additional completed lessons.
          </p>
          {module.sections.map((s, i) => (
            <div className="source-section" key={i}>
              <span>{s.title}</span>
              <small>
                PDF p. {s.pdfPage} · printed p. {s.printedPage}
              </small>
            </div>
          ))}
          <SourceRef
            source={{
              file: topic!.file,
              pdfPage: module.pdfPage,
              endPdfPage: module.endPdfPage,
              section: module.title,
            }}
          />
        </section>
      </>
    );
  }
  return (
    <>
      <Title
        eyebrow={
          topic ? "CURRICULUM / TOPIC " + topic.volume : "YOUR KNOWLEDGE WORLD"
        }
        title={topic ? topic.title : "The curriculum map"}
      >
        {topic && (
          <Button secondary onClick={() => navigate("/curriculum")}>
            All topics
          </Button>
        )}
      </Title>
      <div className="toolbar">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Search curriculum"
            placeholder="Find a topic, module or concept…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <span className="pill">ALL PATHS OPEN</span>
      </div>
      {!topic && (
        <p className="coverage-note">
          All supplied learning modules are mapped. {catalog.length} teaching
          cards provide a focused starting bank; they do not cover every
          learning outcome. Open a module to see its complete source-section
          list.
        </p>
      )}
      <div className={topic ? "module-grid" : "territory-grid"}>
        {(topic ? [topic] : topics).map((t) => {
          const cs = catalog.filter((c) => c.topicId === t.id);
          const st = topicStats(p, cs);
          return topic ? (
            <React.Fragment key={t.id}>
              {t.modules
                .filter((m) =>
                  (
                    m.title +
                    " " +
                    catalog
                      .filter((c) => c.moduleId === m.id)
                      .map((c) => c.name)
                      .join(" ")
                  )
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((m) => {
                  const s = topicStats(
                    p,
                    catalog.filter((c) => c.moduleId === m.id),
                  );
                  return (
                    <a
                      className="panel module-card"
                      href={"#/module/" + m.id}
                      key={m.id}
                    >
                      <span className="eyebrow">
                        {m.supplement
                          ? "REFERENCE SUPPLEMENT"
                          : "MODULE " + String(m.number).padStart(2, "0")}
                      </span>
                      <h2>{m.title}</h2>
                      <Bar value={s.mastery} color={t.color} />
                      <div className="card-meta">
                        <span>
                          {catalog.filter((c) => c.moduleId === m.id).length}{" "}
                          cards · {m.sections.length} sections
                        </span>
                        <span>{s.mastery}%</span>
                      </div>
                      <span className="card-link">
                        Open pathway <ArrowRight size={16} />
                      </span>
                    </a>
                  );
                })}
            </React.Fragment>
          ) : (t.title + " " + t.modules.map((m) => m.title).join(" "))
              .toLowerCase()
              .includes(search.toLowerCase()) ? (
            <a
              className="territory"
              key={t.id}
              href={"#/topic/" + t.id}
              style={{ "--topic": t.color } as React.CSSProperties}
            >
              <div className="territory-top">
                <span>{String(t.volume).padStart(2, "0")}</span>
                <span>
                  {t.modules.filter((m) => !m.supplement).length} MODULES
                </span>
              </div>
              <h2>{t.title}</h2>
              <Bar value={st.mastery} color={t.color} />
              <div className="territory-stats">
                <b>
                  {st.mastery}%<small>Memory strength</small>
                </b>
                <b>
                  {st.xp}
                  <small>XP earned</small>
                </b>
                <b>
                  {st.attempts ? st.accuracy + "%" : "—"}
                  <small>Accuracy</small>
                </b>
              </div>
              <div className="card-meta">
                {st.mastered} mastered · {st.due} due · {st.unseen} not studied
              </div>
              <div className="card-meta">
                Confidence:{" "}
                {
                  ["New", "Low", "Medium", "High"][
                    p.profile?.confidence[t.id] ?? 1
                  ]
                }{" "}
                · Recent trend:{" "}
                {st.attempts >= 20
                  ? `${st.trend >= 0 ? "+" : ""}${st.trend} pts`
                  : "not enough attempts"}
              </div>
              <span className="card-link">
                Explore modules <ArrowRight size={17} />
              </span>
            </a>
          ) : null;
        })}
      </div>
    </>
  );
}
function SourceRef({ source }: { source: Concept["source"] }) {
  return (
    <div className="source-ref">
      <BookOpen size={16} />
      <div>
        <b>Verify against your curriculum</b>
        <span>
          {source.file} · PDF pp. {source.pdfPage}–{source.endPdfPage}
        </span>
        <small>
          {source.section} · Module-level reference, not a claimed exact formula
          page.
        </small>
      </div>
    </div>
  );
}
function ConceptPage({
  id,
  p,
  mutate,
  launch,
}: {
  id: string;
  p: Progress;
  mutate: Mutator;
  launch: Launcher;
}) {
  const [c, setC] = useState<Concept | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setC(null);
    setError("");
    const item = catalog.find((x) => x.id === id);
    if (!item) {
      setError("Concept not found.");
      return;
    }
    let active = true;
    loadTopic(item.topicId)
      .then((cs) => {
        if (active) setC(cs.find((x) => x.id === id) || null);
      })
      .catch((e) => setError(e.message));
    return () => {
      active = false;
    };
  }, [id]);
  if (error)
    return (
      <Empty
        title={error}
        body="Return to the map and choose another concept."
      />
    );
  if (!c) return <p>Loading concept…</p>;
  const m = p.memory[id];
  const module = topics.flatMap((t) => t.modules).find((x) => x.id === c.moduleId);
  const moduleConcepts = catalog.filter((x) => x.moduleId === c.moduleId);
  const position = moduleConcepts.findIndex((x) => x.id === id);
  const nextConcept = moduleConcepts[position + 1];
  const explanationSteps = c.explanation.split(/(?<=[.!?])\s+/).filter(Boolean);
  return (
    <>
      <Title
        eyebrow={`${topics.find((t) => t.id === c.topicId)?.title} / LEARN`}
        title={c.name}
      >
        <Button secondary onClick={() => navigate("/module/" + c.moduleId)}>
          Module pathway
        </Button>
      </Title>
      <div className="learning-grid">
        <article className="panel lesson">
          <div className="section-head">
            <span className="pill">{state(m)}</span>
            <span className="muted">3–5 MINUTE READ</span>
          </div>
          <h2>The idea, plainly.</h2>
          <p className="lead">{c.explanation}</p>
          <div className="beginner-ladder">
            <div><span>01</span><b>In everyday language</b><p>{c.definition}</p></div>
            <div><span>02</span><b>What changes?</b><p>{c.why}</p></div>
            <div><span>03</span><b>What the exam may disguise</b><p>{c.trap}</p></div>
          </div>
          <div className="objective">
            <b>Learning target</b>
            <p>
              {c.objective} This is a paraphrased card objective, not the full
              official LOS list.
            </p>
          </div>
          <h3>Make it concrete</h3>
          <div className="worked">
            <span className="eyebrow">ORIGINAL WORKED EXAMPLE</span>
            <p>{c.example}</p>
          </div>
          <details open>
            <summary>Reason through it step by step</summary>
            <ol className="reasoning-steps">
              <li><b>Name the decision.</b> Restate what is being measured, compared, or classified.</li>
              <li><b>Extract only the relevant facts.</b> Put dates, signs, units, and conditions beside the numbers or claims.</li>
              {explanationSteps.map((x, i) => <li key={i}><b>{i === explanationSteps.length - 1 ? "Conclude and check." : "Connect the idea."}</b> {x}</li>)}
              <li><b>Sanity-check.</b> Ask whether the direction and size of the answer fit the economic story.</li>
            </ol>
          </details>
          {c.formula && (
            <>
              <h3>The relationship</h3>
              <div className="formula-expression">{c.formula.expression}</div>
              <p>{c.formula.variables}</p>
              <details>
                <summary>Intuition, use and related formulas</summary>
                <p>{c.formula.intuition}</p>
                <p>{c.formula.mistake}</p>
                <a href="#/formulas">
                  Explore related relationships in the formula library
                </a>
              </details>
              <div className="calculator-link">
                <Calculator size={22} />
                <div><b>Translate formula into keystrokes</b><p>Practice clearing worksheets, signs, timing, frequency, and the relevant BA II Plus workflow before relying on the result.</p></div>
                <Button secondary onClick={() => navigate("/calculator")}>Calculator lab</Button>
              </div>
            </>
          )}
          <div className="trap">
            <Shield size={22} />
            <div>
              <b>The trap to avoid</b>
              <p>{c.trap}</p>
            </div>
          </div>
          <details>
            <summary>Definition & exam application</summary>
            <p>{c.definition}</p>
            <p>{c.why}</p>
          </details>
          <details>
            <summary>Memory cue</summary>
            <p>{c.mnemonic}</p>
          </details>
          <SourceRef source={c.source} />
          <div className="actions">
            <Button
              onClick={() => {
                mutate((o) => ({
                  ...o,
                  memory: {
                    ...o.memory,
                    [id]: { ...(o.memory[id] || blankMemory()), seen: true },
                  },
                }));
                launch("Practice", [id]);
              }}
            >
              I’ve studied this — practice <ArrowRight size={16} />
            </Button>
            <Button
              secondary
              onClick={() => {
                mutate((o) => ({
                  ...o,
                  memory: {
                    ...o.memory,
                    [id]: { ...(o.memory[id] || blankMemory()), seen: true },
                  },
                }));
                navigate("/module/" + c.moduleId);
              }}
            >
              Mark introduced
            </Button>
            {nextConcept && <Button secondary onClick={() => navigate("/concept/" + nextConcept.id)}>Next lesson <ChevronRight size={16} /></Button>}
          </div>
          <p className="lesson-position">Lesson {position + 1} of {moduleConcepts.length} in {module?.title}</p>
        </article>
        <aside className="lesson-side">
          <div className="panel">
            <p className="eyebrow">MEMORY STATUS</p>
            <Ring value={retention(m)} label="retention signal" size={130} />
            <dl>
              <dt>Successful recall days</dt>
              <dd>{m?.successDays.length || 0}</dd>
              <dt>Retrieval formats</dt>
              <dd>{m?.formats.length || 0}</dd>
              <dt>Next review</dt>
              <dd>
                {m?.due
                  ? new Date(m.due).toLocaleString()
                  : "After first retrieval"}
              </dd>
            </dl>
            <small>
              Mastery requires ≥80% strength, four successful recall dates
              spanning at least seven days, and two formats.
            </small>
          </div>
          <div className="panel recall-prompt">
            <Brain />
            <h3>Close the notes.</h3>
            <p>{c.recall}</p>
            <Button secondary onClick={() => launch("Quick Recall", [id])}>
              Try active recall
            </Button>
            {c.formula && (
              <Button secondary onClick={() => launch("Formula Forge", [id])}>
                Forge this formula
              </Button>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
function StudyArena({
  p,
  launch,
  busy,
}: {
  p: Progress;
  launch: Launcher;
  busy: boolean;
}) {
  const [topic, setTopic] = useState("all");
  const descriptions: Record<string, string> = {
    "Daily Quest":
      "A balanced session of new ideas, due reviews and weak areas.",
    Practice: "Original multiple-choice questions in your chosen subject.",
    "Mixed Practice":
      "Interleave subjects so the method is not given away by context.",
    "Quick Recall":
      "Retrieve an explanation before revealing a comparison answer.",
    "Memory Rescue": "Recover due and confidently wrong concepts.",
    "Weakness Hunt": "Target studied concepts with accuracy below 70%.",
    "Error Repair": "Return to concepts associated with previous mistakes.",
    "Formula Forge":
      "Reconstruct formulas from memory, then check every variable.",
    "Ethics Court":
      "Judge original professional scenarios and understand the duty.",
    "Boss Battle":
      "A longer, 30-concept mixed session with immediate feedback.",
    "Mock Examination":
      "Custom timed simulation: up to 180 unique MCQs at 90 seconds each; feedback follows submission.",
  };
  return (
    <>
      <Title eyebrow="CHOOSE YOUR CHALLENGE" title="The study arena" />
      <div className="toolbar">
        <p>Understanding earns a foothold. Retrieval builds strength.</p>
        <label>
          Practice topic
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="all">All topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mode-grid">
        {modes.map((mode, i) => (
          <section className="panel mode-card" key={mode}>
            <span className="mode-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h2>{mode}</h2>
            <p>{descriptions[mode]}</p>
            {["Memory Rescue", "Weakness Hunt", "Error Repair"].includes(
              mode,
            ) && (
              <small>
                {recommend(p, catalog, mode, catalog.length).length} eligible
                concepts
              </small>
            )}
            {mode === "Mock Examination" && (
              <small>
                Equal-topic fallback sampling; no official topic weights found
                in the supplied book introductions. This is an original practice
                simulation.
              </small>
            )}
            <Button
              secondary
              disabled={busy}
              onClick={() =>
                launch(
                  mode,
                  mode === "Practice" && topic !== "all"
                    ? catalog
                        .filter((c) => c.topicId === topic)
                        .map((c) => c.id)
                    : undefined,
                )
              }
            >
              Start session <Play size={15} />
            </Button>
          </section>
        ))}
      </div>
    </>
  );
}
function Quiz({
  session,
  p,
  mutate,
  finish,
}: {
  session: {
    mode: string;
    questions: Question[];
    concepts: Concept[];
    id: string;
    started: number;
  };
  p: Progress;
  mutate: Mutator;
  finish: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [graded, setGraded] = useState(false);
  const [typed, setTyped] = useState("");
  const [at, setAt] = useState(Date.now());
  const [seconds, setSeconds] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const [results, setResults] = useState<
    {
      q: Question;
      correct: boolean;
      confidence: number;
      seconds: number;
      choice: number | null;
      xp: number;
    }[]
  >([]);
  const [done, setDone] = useState(false);
  const [errorType, setErrorType] = useState("Concept not understood");
  const [lastId, setLastId] = useState("");
  const [confirmQuit, setConfirmQuit] = useState(false);
  const mock = session.mode === "Mock Examination";
  const q = session.questions[index];
  const duration = session.questions.length * 90;
  const remaining = Math.max(
    0,
    duration - Math.floor((clock - session.started) / 1000),
  );
  useEffect(() => {
    const timer = setInterval(() => {
      setClock(Date.now());
      if (document.visibilityState === "visible") setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (mock && remaining === 0 && !done) complete(results);
  }, [remaining]);
  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => {
      if (!done) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    addEventListener("beforeunload", fn);
    return () => removeEventListener("beforeunload", fn);
  }, [done]);
  const [qSeconds, setQSeconds] = useState(0);
  useEffect(() => {
    if (!graded) setQSeconds((s) => s + 1);
  }, [seconds]);
  function commit(correct: boolean) {
    if (graded || confidence === null) return;
    const when = Date.now();
    const id = session.id + "-" + q.id;
    let xp = 0;
    if (!mock) {
      const u = updateMemory(
        p.memory[q.conceptId],
        correct,
        confidence,
        q.difficulty,
        q.type,
        when,
      );
      xp = u.xp;
      mutate((old) => ({
        ...old,
        memory: { ...old.memory, [q.conceptId]: u.memory },
        attempts: [
          ...old.attempts,
          {
            id,
            questionId: q.id,
            conceptId: q.conceptId,
            topicId: q.topicId,
            at: when,
            correct,
            confidence,
            difficulty: q.difficulty,
            format: q.type,
            seconds: Math.min(1800, qSeconds),
            xp: u.xp,
            error: correct
              ? ""
              : confidence === 3
                ? "Confident misconception"
                : confidence === 0
                  ? "Guess"
                  : errorType,
            mode: session.mode,
          },
        ],
      }));
      setLastId(id);
      if (!correct)
        setErrorType(
          confidence === 3
            ? "Confident misconception"
            : confidence === 0
              ? "Guess"
              : errorType,
        );
    }
    setResults((old) => [
      ...old,
      { q, correct, confidence, seconds: Math.min(1800, qSeconds), choice, xp },
    ]);
    setGraded(true);
    setRevealed(true);
  }
  function complete(res = results) {
    if (done) return;
    setDone(true);
    const total = session.questions.length;
    mutate((old) =>
      finalizeSession(
        old,
        session.id,
        session.mode,
        session.questions,
        res,
        seconds,
      ),
    );
  }

  function next() {
    if (index === session.questions.length - 1) {
      complete();
      return;
    }
    setIndex((i) => i + 1);
    setChoice(null);
    setConfidence(null);
    setRevealed(false);
    setGraded(false);
    setTyped("");
    setAt(Date.now());
    setQSeconds(0);
  }
  function tag(value: string) {
    setErrorType(value);
    if (lastId)
      mutate((old) => ({
        ...old,
        attempts: old.attempts.map((a) =>
          a.id === lastId ? { ...a, error: value } : a,
        ),
      }));
  }
  if (done)
    return (
      <>
        <Title eyebrow={session.mode.toUpperCase()} title="Session complete." />
        <div className="session-result panel">
          <Trophy size={48} />
          <h2>
            {Math.round(
              (results.filter((r) => r.correct).length /
                session.questions.length) *
                100,
            )}
            % correct
          </h2>
          <p>
            {results.filter((r) => r.correct).length} correct of{" "}
            {session.questions.length} scheduled · {Math.round(seconds / 60)}{" "}
            active minutes
          </p>
          <p>
            {mock
              ? "Answers and memory updates are now available below. Unanswered items count as incorrect."
              : "Your recalls have updated your memory schedule. Come back when they’re due."}
          </p>
          <Button onClick={finish}>
            See my progress <ArrowRight size={16} />
          </Button>
        </div>
        {session.questions.map((question) => {
          const r = results.find((r) => r.q.id === question.id);
          return (
            <details className="panel review-answer" key={question.id}>
              <summary>
                {r?.correct ? "✓" : "↺"} {question.prompt}
              </summary>
              {question.choices.length > 0 && (
                <p>
                  <b>Correct answer: {question.choices[question.answer]}</b>
                </p>
              )}
              <p>{question.explanation}</p>
              <a href={"#/concept/" + question.conceptId}>
                Repair this concept
              </a>
            </details>
          );
        })}
      </>
    );
  return (
    <>
      <Title
        eyebrow={session.mode.toUpperCase()}
        title={
          mock
            ? "Stay focused. Trust your process."
            : "Retrieve. Check. Strengthen."
        }
      >
        <Button secondary onClick={() => setConfirmQuit(true)}>
          End session
        </Button>
      </Title>
      {confirmQuit && (
        <div
          className="panel quit-confirm"
          role="dialog"
          aria-label="End session"
        >
          <p>
            {mock
              ? "Submit now? Unanswered questions count as incorrect."
              : "Finish early? Your answered questions are already saved; unfinished questions do not affect memory."}
          </p>
          <Button
            onClick={() => {
              if (mock) complete();
              else finish();
            }}
          >
            Confirm end
          </Button>
          <Button secondary onClick={() => setConfirmQuit(false)}>
            Keep studying
          </Button>
        </div>
      )}
      <div className="quiz-progress">
        <span>
          Question {index + 1} / {session.questions.length}
        </span>
        <span>
          <Clock size={16} />
          {mock
            ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
            : `${Math.floor(seconds / 60)} min active`}
        </span>
      </div>
      <Bar value={(index / session.questions.length) * 100} />
      {mock && index === 90 && (
        <p className="notice">
          Second 90-question block. The clock continues; this practice simulator
          does not impose an official break policy.
        </p>
      )}
      <div className="quiz-layout">
        <section className="panel question">
          <div className="section-head">
            <span className="pill">
              {topics.find((t) => t.id === q.topicId)?.title}
            </span>
            <span className="muted">
              {q.type.toUpperCase()} ·{" "}
              {["", "FOUNDATION", "STANDARD", "CHALLENGE"][q.difficulty]}
            </span>
          </div>
          <h2>{q.prompt}</h2>
          {q.choices.length > 0 ? (
            <div className="choices">
              {q.choices.map((c, i) => (
                <button
                  key={i}
                  className={
                    "choice " +
                    (choice === i ? "selected " : "") +
                    (!mock && graded
                      ? i === q.answer
                        ? "correct"
                        : choice === i
                          ? "incorrect"
                          : ""
                      : "")
                  }
                  disabled={graded}
                  onClick={() => setChoice(i)}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {c}
                  {!mock && graded && i === q.answer && <Check size={18} />}
                </button>
              ))}
            </div>
          ) : (
            <label>
              Your answer from memory
              <textarea
                value={typed}
                disabled={revealed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Write the relationship or explanation before revealing it."
                rows={5}
              />
            </label>
          )}
          <fieldset className="confidence">
            <legend>Before checking: how confident are you?</legend>
            {["Guessing", "Low", "Medium", "High"].map((v, i) => (
              <button
                disabled={revealed || graded}
                key={v}
                className={confidence === i ? "selected" : ""}
                onClick={() => setConfidence(i)}
              >
                {v}
              </button>
            ))}
          </fieldset>
          {!graded && q.choices.length > 0 && (
            <Button
              disabled={choice === null || confidence === null}
              onClick={() => commit(score(q, choice!))}
            >
              {mock ? "Lock answer" : "Check answer"} <ArrowRight size={16} />
            </Button>
          )}
          {!graded && !q.choices.length && !revealed && (
            <Button
              disabled={!typed.trim() || confidence === null}
              onClick={() => setRevealed(true)}
            >
              Reveal comparison answer
            </Button>
          )}
          {revealed && !q.choices.length && !graded && (
            <div className="feedback">
              <p className="eyebrow">COMPARE YOUR RECALL</p>
              <p className="preline">{q.explanation}</p>
              <p>
                Self-assessment: only count a complete answer with correct
                direction, variables and assumptions.
              </p>
              <div className="actions">
                <Button secondary onClick={() => commit(false)}>
                  Missed or incomplete
                </Button>
                <Button onClick={() => commit(true)}>Recalled correctly</Button>
              </div>
            </div>
          )}
          {graded && !mock && (
            <div
              className={
                "feedback " +
                (results.at(-1)?.correct ? "positive" : "negative")
              }
              role="status"
            >
              <h3>
                {results.at(-1)?.correct
                  ? "Correct — keep this connection."
                  : confidence === 3
                    ? "Confidently wrong. Worth repairing."
                    : "A useful gap to repair."}
              </h3>
              <p className="preline">{q.explanation}</p>
              <span className="pill">+{results.at(-1)?.xp || 0} XP</span>
              {!results.at(-1)?.correct && (
                <label>
                  What went wrong?
                  <select
                    value={errorType}
                    onChange={(e) => tag(e.target.value)}
                  >
                    {errors.map((e) => (
                      <option key={e}>{e}</option>
                    ))}
                  </select>
                </label>
              )}
              <SourceRef source={q.source} />
            </div>
          )}
          {graded && (
            <Button onClick={next}>
              {index === session.questions.length - 1
                ? "Finish session"
                : "Next question"}{" "}
              <ArrowRight size={16} />
            </Button>
          )}
        </section>
        <aside className="quiz-aside panel">
          <Brain size={30} />
          <h3>Make the effort count.</h3>
          <p>
            {mock
              ? "Feedback is held until you submit. Answer every item; there is no negative marking in this simulation."
              : "Choose your confidence before seeing the answer. A lucky guess is useful, but it is not yet a strong memory."}
          </p>
          <dl>
            <dt>Completed</dt>
            <dd>{results.length}</dd>
            {!mock && (
              <>
                <dt>Correct</dt>
                <dd>{results.filter((r) => r.correct).length}</dd>
                <dt>Session XP</dt>
                <dd>{results.reduce((s, r) => s + r.xp, 0)}</dd>
              </>
            )}
          </dl>
          {!mock && <a href={"#/concept/" + q.conceptId}>Study this concept</a>}
          <small>
            Answered practice items save immediately. The live question queue is
            not restored after a page reload.
          </small>
        </aside>
      </div>
    </>
  );
}
function Review({
  p,
  launch,
  mistakes,
}: {
  p: Progress;
  launch: Launcher;
  mistakes: boolean;
}) {
  const list = mistakes
    ? catalog.filter((c) =>
        p.attempts.some((a) => a.conceptId === c.id && !a.correct),
      )
    : recommend(p, catalog, "Memory Rescue", catalog.length);
  const wrong = catalog.filter((c) => p.memory[c.id]?.confidentWrong);
  return (
    <>
      <Title
        eyebrow={
          mistakes ? "TURN ERRORS INTO EVIDENCE" : "PROTECT WHAT YOU KNOW"
        }
        title={mistakes ? "Mistake intelligence" : "Memory rescue"}
      >
        <Button
          onClick={() => launch(mistakes ? "Error Repair" : "Memory Rescue")}
        >
          {mistakes ? "Start error repair" : "Rescue my memory"}{" "}
          <ArrowRight size={16} />
        </Button>
      </Title>
      <div className="stats-grid three">
        <Stat
          label="Confidently wrong"
          value={String(wrong.length)}
          detail="Priority misconceptions"
          icon={<Shield />}
        />
        <Stat
          label={mistakes ? "Concepts with errors" : "Eligible for rescue"}
          value={String(list.length)}
          detail="Selected from your own history"
          icon={<Brain />}
        />
        <Stat
          label="Weak concepts"
          value={String(
            recommend(p, catalog, "Weakness Hunt", catalog.length).length,
          )}
          detail="Studied accuracy below 70%"
          icon={<Target />}
        />
      </div>
      {mistakes && (
        <section className="panel">
          <h2>What is causing the mistakes?</h2>
          <div className="error-tags">
            {[...errors, "Unanswered"].map((e) => (
              <div key={e}>
                <span>{e}</span>
                <b>
                  {p.attempts.filter((a) => !a.correct && a.error === e).length}
                </b>
              </div>
            ))}
          </div>
          <p className="muted">
            Confidence-based labels are assigned automatically; tag the cause
            after a practice error. These are learning labels, not a diagnosis.
          </p>
        </section>
      )}
      <div className="actions">
        <Button secondary onClick={() => launch("Weakness Hunt")}>
          Launch weakness hunt <Target size={16} />
        </Button>
      </div>
      {!list.length ? (
        <Empty
          title={
            mistakes ? "No mistakes logged yet." : "Nothing due right now."
          }
          body={
            mistakes
              ? "Practice to discover which ideas need a closer look."
              : "Keep learning. Completed recalls will return on their scheduled dates."
          }
        />
      ) : (
        <section className="panel">
          {list.map((c) => {
            const m = p.memory[c.id];
            return (
              <div className="review-row" key={c.id}>
                <div>
                  <a href={"#/concept/" + c.id}>
                    <b>{c.name}</b>
                  </a>
                  <small>
                    {topics.find((t) => t.id === c.topicId)?.title} ·{" "}
                    {m?.lapses || 0} misses · {m?.attempts || 0} attempts
                  </small>
                </div>
                <span className={m?.confidentWrong ? "pill warning" : "pill"}>
                  {m?.confidentWrong ? "Confidently wrong" : state(m)}
                </span>
                <div className="mini-retention">
                  <b>{retention(m)}%</b>
                  <small>strength</small>
                </div>
                <Button secondary onClick={() => launch("Practice", [c.id])}>
                  Repair
                </Button>
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}
function FormulaLibrary({ p, launch }: { p: Progress; launch: Launcher }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [cs, setCs] = useState<Concept[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    loadConcepts(catalog.filter((c) => c.formula).map((c) => c.id))
      .then(setCs)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <Title eyebrow="RELATIONSHIPS WORTH REMEMBERING" title="Formula library">
        <Button onClick={() => launch("Formula Forge")}>
          Enter Formula Forge <Zap size={16} />
        </Button>
      </Title>
      <div className="toolbar">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Search formulas"
            placeholder="Find a relationship…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Topic
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All topics</option>
            {topics.map((t) => (
              <option value={t.id} key={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted">
        {catalog.filter((c) => c.formula).length} selected formulas. These share
        the parent concept’s memory state; recognition alone does not establish
        mastery.
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="formula-grid">
        {cs
          .filter(
            (c) =>
              (filter === "all" || c.topicId === filter) &&
              (c.name + " " + c.formula!.name)
                .toLowerCase()
                .includes(search.toLowerCase()),
          )
          .map((c) => (
            <article key={c.id} className="panel formula-card">
              <div className="section-head">
                <span className="eyebrow">
                  {topics.find((t) => t.id === c.topicId)?.title}
                </span>
                <span className="pill">{state(p.memory[c.id])}</span>
              </div>
              <h2>{c.formula!.name}</h2>
              <div className="formula-expression">{c.formula!.expression}</div>
              <p>{c.formula!.variables}</p>
              <details>
                <summary>When, why & worked example</summary>
                <p>{c.formula!.when}</p>
                <div className="worked">{c.formula!.example}</div>
                <p>
                  <b>Watch for:</b> {c.formula!.mistake}
                </p>
                <p>
                  <b>Related:</b>{" "}
                  {cs
                    .filter((x) => x.topicId === c.topicId && x.id !== c.id)
                    .slice(0, 3)
                    .map((x) => (
                      <a
                        className="related-link"
                        key={x.id}
                        href={"#/concept/" + x.id}
                      >
                        {x.formula!.name}
                      </a>
                    ))}
                </p>
                <SourceRef source={c.source} />
              </details>
              <div className="actions">
                <Button
                  secondary
                  onClick={() => launch("Formula Forge", [c.id])}
                >
                  Retrieve formula
                </Button>
                <Button secondary onClick={() => launch("Practice", [c.id])}>
                  Apply it
                </Button>
              </div>
            </article>
          ))}
      </div>
      {cs.length > 0 &&
        !cs.some(
          (c) =>
            (filter === "all" || c.topicId === filter) &&
            (c.name + " " + c.formula!.name)
              .toLowerCase()
              .includes(search.toLowerCase()),
        ) && (
          <Empty
            title="No authored formulas in this selection."
            body="Try a different topic or search. This library is a selected set, not every curriculum formula."
          />
        )}
    </>
  );
}
function Analytics({ p }: { p: Progress }) {
  const r = readiness(p, catalog);
  const a = p.attempts;
  const sorted = topics
    .map((t) => ({
      t,
      s: topicStats(
        p,
        catalog.filter((c) => c.topicId === t.id),
      ),
    }))
    .sort((a, b) => b.s.mastery - a.s.mastery);
  const missed = catalog
    .map((c) => ({
      c,
      n: a.filter((a) => a.conceptId === c.id && !a.correct).length,
    }))
    .filter((x) => x.n)
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);
  return (
    <>
      <Title eyebrow="MEASURE WHAT STAYS" title="Your learning, in focus" />
      <div className="stats-grid">
        <Stat
          label="Readiness signal"
          value={`${r.score}%`}
          detail="Authored-bank measure"
          icon={<Target />}
        />
        <Stat
          label="Active study time"
          value={`${Math.round(a.reduce((s, a) => s + a.seconds, 0) / 60)} min`}
          detail="Visible question time, capped per item"
          icon={<Clock />}
        />
        <Stat
          label="Retrieval attempts"
          value={String(a.length)}
          detail={`${accuracy(a)}% overall accuracy`}
          icon={<Activity />}
        />
        <Stat
          label="Completed sessions"
          value={String(p.sessions.length)}
          detail="Includes timed and recall modes"
          icon={<Trophy />}
        />
      </div>
      <details className="panel readiness-explainer">
        <summary>Exactly how the readiness signal works</summary>
        <p>
          Score = 15% coverage + 35% decayed memory strength + 25% recent
          difficulty-weighted accuracy + 15% spaced recall + 10% mock accuracy.
          Each non-mock component is averaged equally across the ten topics
          because official exam weights were not identified in these volumes.
        </p>
        <ul>
          <li>
            Coverage: authored concepts with at least one retrieval, not pages
            read.
          </li>
          <li>Memory: current decayed strength for each authored concept.</li>
          <li>
            Performance: last 50 attempts per topic, weighted by difficulty 1–3.
          </li>
          <li>
            Spaced recall: 25 points per additional successful calendar date,
            capped at 100.
          </li>
          <li>
            Mock: mean accuracy of the last three completed mock sessions; zero
            until attempted.
          </li>
        </ul>
        <p>
          <b>
            This excludes source sections without authored lessons. It is not
            exam readiness, a pass probability, or official CFA weighting.
          </b>
        </p>
        <div className="formula-expression">
          {r.coverage.toFixed(1)} × .15 + {r.mastery.toFixed(1)} × .35 +{" "}
          {r.performance.toFixed(1)} × .25 + {r.delayed.toFixed(1)} × .15 +{" "}
          {r.mock.toFixed(1)} × .10 = {r.score}%
        </div>
      </details>
      <div className="two-col">
        <section className="panel">
          <h2>Topic strength · strongest first</h2>
          {sorted.map(({ t, s }) => (
            <a className="analytics-row" key={t.id} href={"#/topic/" + t.id}>
              <span>{t.title}</span>
              <Bar value={s.mastery} color={t.color} />
              <b>{s.mastery}%</b>
              <small>
                {s.attempts ? s.accuracy + "% accuracy" : "Not attempted"}
              </small>
            </a>
          ))}
        </section>
        <section className="panel">
          <h2>Confidence calibration</h2>
          <p className="muted">Does your confidence match your results?</p>
          {["Guessing", "Low", "Medium", "High"].map((v, i) => {
            const b = a.filter((a) => a.confidence === i);
            return (
              <div className="calibration" key={v}>
                <span>{v}</span>
                <Bar value={accuracy(b)} />
                <b>{b.length ? accuracy(b) + "%" : "—"}</b>
                <small>{b.length} attempts</small>
              </div>
            );
          })}
          <h3>Accuracy by difficulty</h3>
          {[1, 2, 3].map((n) => {
            const b = a.filter((a) => a.difficulty === n);
            return (
              <div className="source-section" key={n}>
                <span>{["", "Foundation", "Standard", "Challenge"][n]}</span>
                <b>
                  {b.length ? accuracy(b) + "%" : "—"}{" "}
                  <small>({b.length} attempts)</small>
                </b>
              </div>
            );
          })}
          <h3>Mastery distribution</h3>
          <div className="error-tags">
            {[
              "Not studied",
              "Introduced",
              "Learning",
              "Practicing",
              "Strong",
              "Mastered",
              "Review due",
            ].map((s) => (
              <div key={s}>
                <span>{s}</span>
                <b>
                  {catalog.filter((c) => state(p.memory[c.id]) === s).length}
                </b>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="two-col">
        <section className="panel">
          <h2>Seven-day activity</h2>
          <Weekly p={p} />
          <h3>XP history</h3>
          {Array.from({ length: 7 }, (_, i) => {
            const d = Date.now() - (6 - i) * DAY;
            return (
              <div className="source-section" key={i}>
                <span>{new Date(d).toLocaleDateString()}</span>
                <b>
                  +
                  {a
                    .filter((a) => dateKey(a.at) === dateKey(d))
                    .reduce((s, a) => s + a.xp, 0)}{" "}
                  XP
                </b>
              </div>
            );
          })}
        </section>
        <section className="panel">
          <h2>Most frequently missed</h2>
          {missed.length ? (
            missed.map(({ c, n }) => (
              <a className="quest-row" key={c.id} href={"#/concept/" + c.id}>
                <div>
                  <b>{c.name}</b>
                  <small>{n} incorrect retrievals</small>
                </div>
                <ChevronRight />
              </a>
            ))
          ) : (
            <p className="muted">
              No errors recorded. Your own patterns will appear here.
            </p>
          )}
          <h3>Revision backlog</h3>
          <p>
            {
              catalog.filter(
                (c) =>
                  p.memory[c.id]?.attempts && p.memory[c.id].due <= Date.now(),
              ).length
            }{" "}
            due now ·{" "}
            {
              catalog.filter(
                (c) =>
                  p.memory[c.id]?.due > Date.now() &&
                  p.memory[c.id].due < Date.now() + 7 * DAY,
              ).length
            }{" "}
            due in the next seven days.
          </p>
          <p>
            Average strength lost since last recall:{" "}
            {(
              catalog.reduce(
                (s, c) =>
                  s +
                  Math.max(
                    0,
                    (p.memory[c.id]?.strength || 0) - retention(p.memory[c.id]),
                  ),
                0,
              ) /
              Math.max(
                1,
                catalog.filter((c) => p.memory[c.id]?.attempts).length,
              )
            ).toFixed(1)}{" "}
            points.
          </p>
        </section>
      </div>
      <section className="panel">
        <h2>Session history</h2>
        {p.sessions.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Score</th>
                  <th>Minutes</th>
                </tr>
              </thead>
              <tbody>
                {p.sessions
                  .slice(-20)
                  .reverse()
                  .map((s) => (
                    <tr key={s.id}>
                      <td>{new Date(s.at).toLocaleDateString()}</td>
                      <td>{s.mode}</td>
                      <td>
                        {s.correct}/{s.total}
                      </td>
                      <td>{Math.round(s.seconds / 60)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Complete a session to add the first result.</p>
        )}
      </section>
    </>
  );
}
function ProfilePage({ p }: { p: Progress }) {
  const xp = p.attempts.reduce((s, a) => s + a.xp, 0);
  const awards = achievements(p, catalog);
  return (
    <>
      <Title
        eyebrow="YOUR PROGRESS HAS A HISTORY"
        title={p.profile?.name || "Your profile"}
      >
        <Button secondary onClick={() => navigate("/settings")}>
          Edit study profile
        </Button>
      </Title>
      <section className="panel profile-hero">
        <div className="profile-mark">
          <GraduationCap size={48} />
        </div>
        <div>
          <span className="eyebrow">
            LEVEL {Math.floor(xp / 250) + 1} · CFA LEVEL I
          </span>
          <h2>{xp} learning XP</h2>
          <Bar value={((xp % 250) / 250) * 100} />
          <p>
            {250 - (xp % 250)} XP to next level · {streak(p)} day streak
          </p>
        </div>
        <Ring
          value={Math.round(
            (awards.filter((a) => a.earned).length / awards.length) * 100,
          )}
          label="achievements"
          size={120}
        />
      </section>
      <div className="achievement-grid">
        {awards.map((a) => (
          <section
            className={"panel achievement " + (a.earned ? "earned" : "")}
            key={a.name}
          >
            <Trophy size={26} />
            <span className="pill">{a.earned ? "EARNED" : "IN PROGRESS"}</span>
            <h2>{a.name}</h2>
            <p>{a.description}</p>
          </section>
        ))}
      </div>
      <section className="panel">
        <h2>Personal bests</h2>
        <div className="two-col">
          {["Boss Battle", "Mock Examination"].map((mode) => {
            const ss = p.sessions.filter((s) => s.mode === mode);
            return (
              <div key={mode}>
                <h3>{mode}</h3>
                <strong className="big-number">
                  {ss.length
                    ? Math.max(
                        ...ss.map((s) =>
                          Math.round((s.correct / s.total) * 100),
                        ),
                      ) + "%"
                    : "—"}
                </strong>
                <p>{ss.length} completed sessions</p>
              </div>
            );
          })}
        </div>
        <h3>Module milestones</h3>
        <p>
          {
            topics
              .flatMap((t) => t.modules)
              .filter((m) => {
                const cs = catalog.filter((c) => c.moduleId === m.id);
                return (
                  cs.length &&
                  cs.every((c) => state(p.memory[c.id]) === "Mastered")
                );
              }).length
          }{" "}
          modules have all authored cards mastered. This does not certify
          completion of every source section.
        </p>
        <h3>Topic milestones</h3>
        <p>
          {
            topics.filter((t) =>
              catalog
                .filter((c) => c.topicId === t.id)
                .every((c) => state(p.memory[c.id]) === "Mastered"),
            ).length
          }{" "}
          topics have all authored cards mastered.
        </p>
      </section>
    </>
  );
}
function SettingsPage({
  p,
  mutate,
  notice,
  demo,
  openDemo,
  restored,
}: {
  p: Progress;
  mutate: Mutator;
  notice: (s: string) => void;
  demo: boolean;
  openDemo: () => void;
  restored: () => void;
}) {
  const [pending, setPending] = useState<Progress | null>(null);
  const [reset, setReset] = useState(false);
  const [err, setErr] = useState("");
  function download() {
    const blob = new Blob([backup(p)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cfa-atlas-progress-${dateKey(Date.now())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notice(
      "Backup exported. Keep it somewhere safe before clearing browser storage.",
    );
  }
  async function file(file?: File) {
    if (!file) return;
    try {
      if (file.size > 25 * 1024 * 1024)
        throw Error("Backup exceeds the 25 MB import limit.");
      const parsed = validateProgress(JSON.parse(await file.text()));
      setPending(parsed);
      setErr("");
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  return (
    <>
      <Title eyebrow="YOUR DATA. YOUR PACE." title="Settings & backup" />
      <section className="panel">
        <h2>Bring your progress with you.</h2>
        <p>
          Progress lives in this browser’s IndexedDB. Export before changing
          browsers, ports or PCs, or clearing website data.
        </p>
        <div className="actions">
          <Button onClick={download}>
            <Download size={17} /> Export progress JSON
          </Button>
          <label className="button secondary file-button">
            <Upload size={17} /> Import backup
            <input
              aria-label="Import progress backup"
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                file(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {err && (
          <p role="alert" className="error-text">
            {err}
          </p>
        )}
        {pending && (
          <div className="notice">
            <div>
              Valid backup: {pending.attempts.length} attempts,{" "}
              {pending.sessions.length} sessions. Import replaces the current{" "}
              {demo ? "demo" : "real"} progress.
            </div>
            <Button
              onClick={() => {
                mutate(() => pending);
                restored();
                setPending(null);
                notice("Progress restored from your backup.");
              }}
            >
              Replace with this backup
            </Button>
            <Button secondary onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
        )}
        <details>
          <summary>Local privacy & storage</summary>
          <p>
            No account, telemetry, paid API or network-based AI is used. Lessons
            are local JSON files served by your PC. A storage failure shows an
            error instead of silently claiming a save. Exported files contain
            your study profile and history.
          </p>
        </details>
      </section>
      <section className="panel">
        <h2>Demo & fresh start</h2>
        <p>
          Demo activity is explicitly labeled and never saved over your real
          progress.
        </p>
        <div className="actions">
          <Button secondary disabled={demo} onClick={openDemo}>
            Explore demo activity
          </Button>
          <Button secondary onClick={() => setReset(true)}>
            Reset learning history
          </Button>
        </div>
        {reset && (
          <div className="notice">
            <p>
              Delete this profile’s learning history? Export a backup first if
              you want to keep it.
            </p>
            <Button
              onClick={() => {
                mutate((o) => ({
                  ...freshProgress(),
                  profile: o.profile,
                  theme: o.theme,
                }));
                setReset(false);
                notice("Learning history reset. Study profile retained.");
              }}
            >
              Confirm reset
            </Button>
            <Button secondary onClick={() => setReset(false)}>
              Cancel
            </Button>
          </div>
        )}
      </section>
      <Onboarding
        initial={p.profile}
        save={(profile) => {
          mutate((o) => ({ ...o, profile }));
          notice("Study profile updated.");
        }}
      />
    </>
  );
}
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  render() {
    return this.state.error ? (
      <div className="boot">
        <h1>Atlas hit a problem.</h1>
        <p>{this.state.error}</p>
        <p>
          Your saved history is still in this browser. Reload, or return to
          settings after reloading to export a backup.
        </p>
        <button
          className="button"
          onClick={() => {
            location.hash = "/settings";
            location.reload();
          }}
        >
          Reload settings
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
const rootHost = document.getElementById("root")!;
const rootWindow = window as typeof window & {
  __cfaAtlasRoot?: ReturnType<typeof createRoot>;
};
const appRoot = rootWindow.__cfaAtlasRoot || createRoot(rootHost);
rootWindow.__cfaAtlasRoot = appRoot;
appRoot.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
