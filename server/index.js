import cors from "cors";
import express from "express";
import multer from "multer";
import { z } from "zod";
import { prisma, seedIfEmpty } from "./db.js";

const upload = multer({ storage: multer.memoryStorage() });

const loginSchema = z.object({
  email: z.string().email(),
  role: z.enum(["manager", "ambassador"])
});

const submissionSchema = z.object({
  ambassadorId: z.string().min(1),
  proofUrl: z.string().url().optional(),
  notes: z.string().min(4).max(250)
});

function getBadges(points, streak) {
  const badges = [];
  if (points >= 1000) badges.push("Growth Driver");
  if (points >= 1500) badges.push("Impact Pro");
  if (streak >= 7) badges.push("Week Warrior");
  if (badges.length === 0) badges.push("Rising Star");
  return badges;
}

function computeStats(ambassadors, tasks) {
  const totalPoints = ambassadors.reduce((sum, item) => sum + item.points, 0);
  const activeTasks = tasks.filter((task) => task.status === "active").length;
  const avgStreak = Math.round(ambassadors.reduce((sum, item) => sum + item.streak, 0) / ambassadors.length);
  return {
    totalAmbassadors: ambassadors.length,
    activeTasks,
    totalPoints,
    averageStreak: avgStreak
  };
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "CampusConnect API" });
  });

  app.post("/api/auth/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid login payload." });
    }

    const { email, role } = parsed.data;
    const ambassadors = await prisma.ambassador.findMany();
    const selectedAmbassador = ambassadors.find((item) => email.toLowerCase().includes(item.name.split(" ")[0].toLowerCase()));
    return res.json({
      token: `${role}-token-demo`,
      user: role === "manager"
        ? { id: "MGR-001", name: "Program Manager", email, role }
        : { id: selectedAmbassador?.id ?? "CA-000", name: selectedAmbassador?.name ?? "Campus Ambassador", email, role }
    });
  });

  app.get("/api/overview", async (_req, res) => {
    const [ambassadors, tasks, recentSubmissions] = await Promise.all([
      prisma.ambassador.findMany(),
      prisma.task.findMany(),
      prisma.submission.findMany({
        orderBy: { submittedAt: "desc" },
        take: 5,
        include: { ambassador: true, task: true }
      })
    ]);
    const stats = computeStats(ambassadors, tasks);
    const topPerformer = [...ambassadors].sort((a, b) => b.points - a.points)[0];
    return res.json({
      stats,
      topPerformer,
      recentSubmissions: recentSubmissions.map((entry) => ({
        id: entry.id,
        taskId: entry.taskId,
        taskTitle: entry.task.title,
        ambassadorId: entry.ambassadorId,
        ambassadorName: entry.ambassador.name,
        notes: entry.notes,
        proofUrl: entry.proofUrl,
        hasFileProof: entry.hasFileProof,
        awardedPoints: entry.awardedPoints,
        submittedAt: entry.submittedAt
      }))
    });
  });

  app.get("/api/ambassadors", async (_req, res) => {
    const ambassadors = await prisma.ambassador.findMany();
    return res.json(
      ambassadors.map((item) => ({
        ...item,
        badges: getBadges(item.points, item.streak)
      }))
    );
  });

  app.get("/api/tasks", async (_req, res) => {
    const tasks = await prisma.task.findMany();
    return res.json(tasks);
  });

  app.get("/api/leaderboard", async (_req, res) => {
    const ambassadors = await prisma.ambassador.findMany();
    const ranked = [...ambassadors]
      .sort((a, b) => b.points - a.points)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
        badges: getBadges(item.points, item.streak)
      }));
    return res.json(ranked);
  });

  app.post("/api/tasks/:taskId/submit", upload.single("proofFile"), async (req, res) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) return res.status(404).json({ error: "Task not found." });

    const parsed = submissionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid submission payload." });

    const ambassador = await prisma.ambassador.findUnique({ where: { id: parsed.data.ambassadorId } });
    if (!ambassador) return res.status(404).json({ error: "Ambassador not found." });

    const awardedPoints = task.points + (req.file ? 40 : 0);
    const submissionCount = await prisma.submission.count();
    const submissionId = `SUB-${String(submissionCount + 1).padStart(3, "0")}`;

    const [updatedAmbassador, createdSubmission] = await prisma.$transaction([
      prisma.ambassador.update({
        where: { id: ambassador.id },
        data: {
          points: { increment: awardedPoints },
          streak: { increment: 1 },
          referrals: task.type === "referrals" ? { increment: 3 } : undefined,
          contentPosts: task.type === "content" ? { increment: 1 } : undefined,
          events: task.type === "event" ? { increment: 1 } : undefined
        }
      }),
      prisma.submission.create({
        data: {
          id: submissionId,
          taskId: task.id,
          ambassadorId: ambassador.id,
          notes: parsed.data.notes,
          proofUrl: parsed.data.proofUrl ?? null,
          hasFileProof: Boolean(req.file),
          awardedPoints
        }
      })
    ]);

    return res.status(201).json({
      message: "Submission recorded and points awarded.",
      submission: {
        id: createdSubmission.id,
        taskId: task.id,
        taskTitle: task.title,
        ambassadorId: updatedAmbassador.id,
        ambassadorName: updatedAmbassador.name,
        notes: createdSubmission.notes,
        proofUrl: createdSubmission.proofUrl,
        hasFileProof: createdSubmission.hasFileProof,
        awardedPoints: createdSubmission.awardedPoints,
        submittedAt: createdSubmission.submittedAt
      }
    });
  });

  return app;
}

const port = process.env.PORT || 8787;
if (process.env.NODE_ENV !== "test") {
  const app = createApp();
  seedIfEmpty()
    .then(() => {
      app.listen(port, () => {
        console.log(`CampusConnect API running on http://localhost:${port}`);
      });
    })
    .catch((error) => {
      console.error("Failed to initialize database:", error);
      process.exit(1);
    });
}
