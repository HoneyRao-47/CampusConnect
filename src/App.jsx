import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Award,
  Bell,
  ChartNoAxesCombined,
  CircleCheck,
  Download,
  Gauge,
  Gem,
  GitBranch,
  Home,
  LayoutGrid,
  Search,
  Sparkles,
  Target,
  Trophy
} from "lucide-react";
import { api } from "./api";
import "./App.css";

const defaultSubmissionForm = {
  taskId: "",
  ambassadorId: "",
  proofUrl: "",
  notes: "",
  proofFile: null
};

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: Home, targetId: "dashboard" },
  { key: "challenges", label: "Challenges", icon: Target, targetId: "challenges" },
  { key: "leaderboard", label: "Leaderboard", icon: Trophy, targetId: "leaderboard" },
  { key: "insights", label: "Insights", icon: ChartNoAxesCombined, targetId: "insights" },
  { key: "rewards", label: "Rewards", icon: Gem, targetId: "rewards" }
];

const contributionData = [
  { week: "W1", points: 420, tasks: 18 },
  { week: "W2", points: 560, tasks: 24 },
  { week: "W3", points: 630, tasks: 27 },
  { week: "W4", points: 720, tasks: 33 },
  { week: "W5", points: 790, tasks: 35 },
  { week: "W6", points: 920, tasks: 42 }
];

const timeline = [
  { time: "10m ago", title: "Referral challenge submitted", detail: "Aayushi uploaded proof for Design Sprint referrals." },
  { time: "45m ago", title: "New badge unlocked", detail: "Rohan earned the Consistency Streak badge at 14 days." },
  { time: "2h ago", title: "Task auto-verified", detail: "Content challenge scored and points released instantly." },
  { time: "4h ago", title: "Weekly leaderboard updated", detail: "Top 3 ambassadors changed after campus workshop activity." }
];

function getGitHubScore(username) {
  const base = username.trim().length * 7 + 41;
  return Math.min(98, Math.max(52, base));
}

function Sidebar({ activeNav, onNavigate }) {
  return (
    <aside className="sidebar glass-card">
      <div className="brand-wrap">
        <div className="brand-badge">
          <Sparkles size={18} />
        </div>
        <div>
          <h2>CampusConnect</h2>
          <p>Ambassador OS</p>
        </div>
      </div>
      <nav className="nav-list">
        {navItems.map((item) => (
          <button
            className={`nav-item ${activeNav === item.key ? "active" : ""}`}
            key={item.key}
            type="button"
            onClick={() => onNavigate(item.key)}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function MetricCard({ title, value, hint, icon: Icon }) {
  return (
    <motion.article className="glass-card metric-card" whileHover={{ y: -8, scale: 1.01 }} transition={{ duration: 0.25 }}>
      <div className="metric-header">
        <p>{title}</p>
        <span>
          <Icon size={16} />
        </span>
      </div>
      <h3>{value}</h3>
      <small>{hint}</small>
    </motion.article>
  );
}

function AnimatedScore({ score }) {
  return (
    <div className="score-ring-wrap">
      <svg className="score-ring" viewBox="0 0 120 120">
        <circle className="track" cx="60" cy="60" r="50" />
        <motion.circle
          className="progress"
          cx="60"
          cy="60"
          r="50"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: score / 100 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="score-center">
        <strong>{score}</strong>
        <span>/100</span>
      </div>
    </div>
  );
}

function App() {
  const [overview, setOverview] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [ambassadors, setAmbassadors] = useState([]);
  const [submissionForm, setSubmissionForm] = useState(defaultSubmissionForm);
  const [githubInput, setGithubInput] = useState("");
  const [githubScore, setGithubScore] = useState(74);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStreakPanel, setShowStreakPanel] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [githubMessage, setGithubMessage] = useState("");
  const [leaderboardMode, setLeaderboardMode] = useState("all");
  const [claimedRewards, setClaimedRewards] = useState({});
  const [activeBadge, setActiveBadge] = useState("Mentor");
  const [streakDays, setStreakDays] = useState(12);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: "n1", text: "Leaderboard reshuffled after workshop challenge.", read: false },
    { id: "n2", text: "Two task proofs were auto-verified.", read: false },
    { id: "n3", text: "New referral campaign goes live tomorrow.", read: false }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [overviewData, boardData, ambassadorData, taskData] = await Promise.all([
        api.getOverview(),
        api.getLeaderboard(),
        api.getAmbassadors(),
        api.getTasks()
      ]);
      setOverview(overviewData);
      setLeaderboard(boardData);
      setAmbassadors(ambassadorData);
      setTasks(taskData);
      setSubmissionForm((prev) => ({
        ...prev,
        taskId: prev.taskId || taskData[0]?.id || "",
        ambassadorId: prev.ambassadorId || ambassadorData[0]?.id || ""
      }));
    } catch (err) {
      setError(err.message || "Unable to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const activityData = useMemo(
    () =>
      ambassadors.map((item, idx) => ({
        name: item.name.split(" ")[0],
        progress: Math.min(100, 35 + item.streak * 4 + idx * 6)
      })),
    [ambassadors]
  );

  const suggestions = useMemo(() => {
    if (githubScore < 68) {
      return [
        { type: "weak", title: "Archive low-signal repos", text: "Hide practice repositories with unfinished README and no deployment." },
        { type: "weak", title: "Improve documentation", text: "Add recruiter-friendly README with impact, architecture, and setup steps." },
        { type: "strong", title: "Push consistency", text: "Maintain weekly contributions to improve activity quality indicators." }
      ];
    }
    return [
      { type: "strong", title: "Strong profile depth", text: "Your commits and repo variety already show healthy product execution." },
      { type: "strong", title: "Highlight best repos", text: "Pin 3 production-ready projects with demo video and concise metrics." },
      { type: "weak", title: "Refine older projects", text: "Move outdated duplicates to archive and keep your profile focused." }
    ];
  }, [githubScore]);

  const displayLeaderboard = useMemo(() => {
    const weighted = leaderboard.map((person, index) => {
      if (leaderboardMode === "all") {
        return { ...person, displayPoints: person.points };
      }
      const weeklyBoost = Math.max(18, 58 - index * 4);
      return { ...person, displayPoints: person.points + weeklyBoost };
    });

    return weighted
      .sort((a, b) => b.displayPoints - a.displayPoints)
      .map((person, index) => ({
        ...person,
        displayRank: index + 1
      }));
  }, [leaderboard, leaderboardMode]);

  const topThree = displayLeaderboard.slice(0, 3);
  const unreadAlerts = notifications.filter((item) => !item.read).length;
  const rewardItems = [
    { id: "swag", title: "Campus Swag Pack", cost: 1200, info: "Hoodie + sticker kit for consistent performers." },
    { id: "cert", title: "Verified Certificate", cost: 1500, info: "Recruiter-shareable contribution credential." },
    { id: "meet", title: "Founder AMA Pass", cost: 1800, info: "Access to live product + career mentoring session." }
  ];
  const badgeDescriptions = {
    Mentor: "Prioritizes community support, event guidance, and ambassador onboarding.",
    "Top Referrer": "Leads referral-driven growth with consistent invite-to-signup conversion.",
    "Content Pro": "Creates high-performing content assets that drive campaign visibility."
  };

  function handleAnalyze() {
    if (!githubInput.trim()) {
      setGithubMessage("Enter a GitHub username or repository link first.");
      return;
    }
    setGithubScore(getGitHubScore(githubInput));
    setGithubMessage("Profile analyzed. Scroll suggestions for next improvements.");
  }

  async function handleTaskSubmit(event) {
    event.preventDefault();
    setSubmitMessage("");
    setError("");
    try {
      const payload = new FormData();
      payload.append("ambassadorId", submissionForm.ambassadorId);
      payload.append("notes", submissionForm.notes);
      if (submissionForm.proofUrl.trim()) payload.append("proofUrl", submissionForm.proofUrl.trim());
      if (submissionForm.proofFile) payload.append("proofFile", submissionForm.proofFile);

      const result = await api.submitTask(submissionForm.taskId, payload);
      setSubmitMessage(`${result.message} (+${result.submission.awardedPoints} points)`);
      setSubmissionForm((prev) => ({
        ...defaultSubmissionForm,
        taskId: prev.taskId,
        ambassadorId: prev.ambassadorId
      }));
      await loadData();
    } catch (err) {
      setError(err.message || "Task submission failed.");
    }
  }

  function handleNavigate(navKey) {
    setActiveNav(navKey);
    const item = navItems.find((entry) => entry.key === navKey);
    const target = item ? document.getElementById(item.targetId) : null;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleExportLeaderboard() {
    const csvRows = [
      ["Rank", "Name", "College", "Points"],
      ...displayLeaderboard.map((item) => [item.displayRank, item.name, item.college, item.displayPoints])
    ];
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `campusconnect-${leaderboardMode}-leaderboard.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleClaimReward(rewardId) {
    setClaimedRewards((prev) => ({ ...prev, [rewardId]: true }));
    setGithubMessage("Reward claimed. Your rewards wallet has been updated.");
    setActiveNav("rewards");
  }

  function handleBellClick() {
    setShowNotifications((prev) => !prev);
    setShowStreakPanel(false);
    setShowProfileMenu(false);
  }

  function handleStreakClick() {
    setShowStreakPanel((prev) => !prev);
    setShowNotifications(false);
    setShowProfileMenu(false);
  }

  function handleProfileClick() {
    setShowProfileMenu((prev) => !prev);
    setShowNotifications(false);
    setShowStreakPanel(false);
  }

  function handleCheckIn() {
    if (checkedInToday) return;
    setCheckedInToday(true);
    setStreakDays((prev) => prev + 1);
    setGithubMessage("Daily check-in complete. Streak increased by 1 day.");
    setShowStreakPanel(false);
  }

  function markNotificationAsRead(notificationId) {
    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item))
    );
  }

  function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  return (
    <motion.main className="app-shell" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Sidebar activeNav={activeNav} onNavigate={handleNavigate} />
      <section className="workspace">
        <header className="topbar glass-card">
          <div>
            <p className="eyebrow">Campus Ambassador Management Platform</p>
            <h1>CampusConnect Control Center</h1>
          </div>
          <div className="top-actions">
            <button className="icon-btn btn-base" type="button" onClick={handleBellClick}>
              <Bell size={17} />
              <span className="notify-count">{unreadAlerts}</span>
            </button>
            <button className="streak-pill top-action-btn" type="button" onClick={handleStreakClick}>
              <Award size={16} /> {streakDays} day streak
            </button>
            <button className="avatar top-action-btn" type="button" onClick={handleProfileClick}>HC</button>
          </div>
          {showNotifications && (
            <div className="notification-panel">
              <p>{unreadAlerts} new updates</p>
              <div className="notification-list">
                {notifications.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`notification-item ${item.read ? "read" : ""}`}
                    onClick={() => markNotificationAsRead(item.id)}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="ghost-btn notification-action"
                onClick={markAllNotificationsRead}
              >
                Mark all as read
              </button>
            </div>
          )}
          {showStreakPanel && (
            <div className="notification-panel streak-panel">
              <p>Streak Tracker</p>
              <small>Stay active daily to unlock premium rewards faster.</small>
              <button type="button" className="ghost-btn notification-action" onClick={handleCheckIn}>
                {checkedInToday ? "Checked in today" : "Daily Check-in +1"}
              </button>
            </div>
          )}
          {showProfileMenu && (
            <div className="profile-modal-overlay" onClick={() => setShowProfileMenu(false)}>
              <div className="profile-modal glass-card" onClick={(event) => event.stopPropagation()}>
                <h3>Honey Choudhary</h3>
                <p>Campus Lead • Growth Mentor</p>
                <div className="profile-stats">
                  <span>Rewards claimed: {Object.keys(claimedRewards).length}</span>
                  <span>Current streak: {streakDays} days</span>
                </div>
                <button
                  type="button"
                  className="ghost-btn notification-action"
                  onClick={() => {
                    setGithubMessage("Profile settings opened.");
                    setShowProfileMenu(false);
                  }}
                >
                  Open Profile
                </button>
              </div>
            </div>
          )}
        </header>

        {error && <p className="alert error">{error}</p>}
        {submitMessage && <p className="alert success">{submitMessage}</p>}

        <section className="metrics-grid" id="dashboard">
          <MetricCard title="Points Earned" value={overview?.stats?.totalPoints ?? "--"} hint="Program-wide contribution engine" icon={Gauge} />
          <MetricCard title="Tasks Active" value={overview?.stats?.activeTasks ?? "--"} hint="Live campaigns this week" icon={LayoutGrid} />
          <MetricCard title="Current Rank" value={`#${topThree[0]?.rank ?? 1}`} hint="Top performing ambassador" icon={Trophy} />
        </section>

        <section className="panel-grid" id="insights">
          <article className="glass-card chart-card">
            <div className="section-head">
              <h3>Performance Analytics</h3>
              <button className="ghost-btn btn-base" type="button" onClick={loadData} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={contributionData}>
                <defs>
                  <linearGradient id="pointGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 6" stroke="#1f2a44" />
                <XAxis dataKey="week" stroke="#9fb1d9" />
                <YAxis stroke="#9fb1d9" />
                <Tooltip contentStyle={{ background: "#101a30", border: "1px solid #2f436d", borderRadius: 12 }} />
                <Area type="monotone" dataKey="points" stroke="#7c8cff" strokeWidth={3} fill="url(#pointGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </article>

          <article className="glass-card activity-card">
            <h3>Activity Timeline</h3>
            <div className="timeline">
              {timeline.map((item) => (
                <div className="timeline-item" key={item.title}>
                  <span className="dot" />
                  <div>
                    <p className="time">{item.time}</p>
                    <h4>{item.title}</h4>
                    <small>{item.detail}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="glass-card points-breakdown">
          <div className="section-head">
            <h3>Points by Work</h3>
            <p>Exact points awarded per challenge type.</p>
          </div>
          <div className="points-list">
            {tasks.slice(0, 6).map((task) => (
              <div className="points-item" key={task.id}>
                <div>
                  <h4>{task.title}</h4>
                  <small>{task.id} • Due {task.dueDate}</small>
                </div>
                <strong>+{task.points} pts</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel-grid" id="leaderboard">
          <article className="glass-card">
            <div className="section-head">
              <h3>Leaderboard Podium</h3>
              <div className="leaderboard-controls">
                <button
                  type="button"
                  className={`ghost-btn btn-base ${leaderboardMode === "all" ? "mode-active" : ""}`}
                  onClick={() => setLeaderboardMode("all")}
                >
                  All Time
                </button>
                <button
                  type="button"
                  className={`ghost-btn btn-base ${leaderboardMode === "weekly" ? "mode-active" : ""}`}
                  onClick={() => setLeaderboardMode("weekly")}
                >
                  Weekly
                </button>
                <button type="button" className="ghost-btn btn-base" onClick={handleExportLeaderboard}>
                  <Download size={14} />
                  Export
                </button>
              </div>
            </div>
            <div className="podium">
              {topThree.map((person, index) => (
                <motion.div
                  className={`podium-block block-${index + 1}`}
                  key={person.id}
                  whileHover={{ y: -8, scale: 1.03 }}
                  transition={{ duration: 0.22 }}
                  layout
                >
                  <span>#{person.displayRank}</span>
                  <h4>{person.name}</h4>
                  <small>{person.displayPoints} pts</small>
                </motion.div>
              ))}
            </div>
            <div className="badge-row">
              {["Mentor", "Top Referrer", "Content Pro"].map((badge) => (
                <button
                  type="button"
                  className={`badge badge-button ${activeBadge === badge ? "badge-active" : ""}`}
                  key={badge}
                  onClick={() => setActiveBadge(badge)}
                >
                  {badge}
                </button>
              ))}
            </div>
            <p className="badge-description">{badgeDescriptions[activeBadge]}</p>
          </article>

          <article className="glass-card">
            <h3>Ambassador Progress</h3>
            <div className="progress-list">
              {activityData.slice(0, 5).map((item) => (
                <div key={item.name}>
                  <div className="progress-label">
                    <span>{item.name}</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="progress-track">
                    <motion.span initial={{ width: 0 }} animate={{ width: `${item.progress}%` }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="glass-card rewards-section" id="rewards">
          <div className="section-head">
            <h3>Rewards Vault</h3>
            <p>Redeem impact points into ambassador perks.</p>
          </div>
          <div className="reward-grid">
            {rewardItems.map((reward) => (
              <motion.article key={reward.id} className="reward-card" whileHover={{ y: -5, scale: 1.01 }}>
                <div>
                  <h4>{reward.title}</h4>
                  <p>{reward.info}</p>
                </div>
                <div className="reward-footer">
                  <span>{reward.cost} pts</span>
                  <button
                    type="button"
                    className="ghost-btn btn-base"
                    disabled={claimedRewards[reward.id]}
                    onClick={() => handleClaimReward(reward.id)}
                  >
                    {claimedRewards[reward.id] ? "Claimed" : "Claim Reward"}
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="glass-card github-section" id="challenges">
          <div className="section-head">
            <h3>GitHub Analysis</h3>
            <p>Know what recruiters notice first in under 2 minutes.</p>
          </div>
          <div className="github-layout">
            <div>
              <label htmlFor="githubInput">GitHub profile or repository link</label>
              <div className="search-wrap">
                <GitBranch size={16} />
                <input
                  id="githubInput"
                  value={githubInput}
                  onChange={(event) => setGithubInput(event.target.value)}
                  placeholder="https://github.com/username"
                />
                <button type="button" className="btn-base" onClick={handleAnalyze}>
                  <Search size={15} />
                  Analyze
                </button>
              </div>
              {githubMessage && <p className="github-message">{githubMessage}</p>}

              <div className="suggestions">
                {suggestions.map((item) => (
                  <motion.article
                    className={`suggestion ${item.type}`}
                    key={item.title}
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </motion.article>
                ))}
              </div>
            </div>
            <div className="score-panel">
              <AnimatedScore score={githubScore} />
              <p className="score-note">Recruiter-readiness index based on consistency, portfolio signal, and repository quality.</p>
              <div className="score-tags">
                <span><CircleCheck size={14} /> Strengths surfaced</span>
                <span><Target size={14} /> Priority next steps</span>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card submission-section">
          <div className="section-head">
            <h3>Task Submission</h3>
            <p>Submit proof link, notes, and optional file for scoring.</p>
          </div>
          <form className="submission-form" onSubmit={handleTaskSubmit}>
            <label>
              Challenge
              <select
                value={submissionForm.taskId}
                onChange={(event) => setSubmissionForm((prev) => ({ ...prev, taskId: event.target.value }))}
                required
              >
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>{task.id} - {task.title} (+{task.points})</option>
                ))}
              </select>
            </label>
            <label>
              Ambassador
              <select
                value={submissionForm.ambassadorId}
                onChange={(event) => setSubmissionForm((prev) => ({ ...prev, ambassadorId: event.target.value }))}
                required
              >
                {ambassadors.map((item) => (
                  <option key={item.id} value={item.id}>{item.id} - {item.name}</option>
                ))}
              </select>
            </label>
            <label className="form-wide">
              Proof Link
              <input
                type="url"
                placeholder="https://drive.google.com/... or post link"
                value={submissionForm.proofUrl}
                onChange={(event) => setSubmissionForm((prev) => ({ ...prev, proofUrl: event.target.value }))}
              />
            </label>
            <label className="form-wide">
              Notes
              <textarea
                placeholder="What work did you complete and what impact did it create?"
                value={submissionForm.notes}
                onChange={(event) => setSubmissionForm((prev) => ({ ...prev, notes: event.target.value }))}
                required
              />
            </label>
            <label className="form-wide">
              Upload Proof File (optional)
              <input
                type="file"
                onChange={(event) =>
                  setSubmissionForm((prev) => ({ ...prev, proofFile: event.target.files?.[0] ?? null }))
                }
              />
            </label>
            <button type="submit" className="ghost-btn btn-base form-submit-btn">Submit Task</button>
          </form>
        </section>
      </section>
    </motion.main>
  );
}

export default App;
