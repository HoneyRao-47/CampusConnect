import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

const initialAmbassadors = [
  { id: "CA-001", name: "Aarav Sharma", college: "IIT Delhi", referrals: 29, contentPosts: 8, events: 3, points: 1760, streak: 6 },
  { id: "CA-002", name: "Mira Nair", college: "BITS Pilani", referrals: 24, contentPosts: 10, events: 2, points: 1680, streak: 8 },
  { id: "CA-003", name: "Rohan Mehta", college: "NIT Trichy", referrals: 21, contentPosts: 7, events: 4, points: 1510, streak: 4 },
  { id: "CA-004", name: "Sana Iqbal", college: "VIT Vellore", referrals: 17, contentPosts: 9, events: 1, points: 1320, streak: 5 },
  { id: "CA-005", name: "Dev Patel", college: "SRM Chennai", referrals: 14, contentPosts: 6, events: 2, points: 1105, streak: 3 }
];

const initialTasks = [
  { id: "TSK-101", title: "Drive 10 Event Signups", type: "referrals", description: "Bring in at least 10 valid registrations for the upcoming webinar.", points: 300, status: "active", dueDate: "2026-05-01" },
  { id: "TSK-102", title: "Campus Reel Challenge", type: "content", description: "Post one Instagram reel featuring CampusConnect with CTA + hashtag.", points: 220, status: "active", dueDate: "2026-04-30" },
  { id: "TSK-103", title: "Host a Micro Meetup", type: "event", description: "Conduct a 30-minute in-college product awareness meetup.", points: 450, status: "active", dueDate: "2026-05-05" }
];

export async function seedIfEmpty() {
  const ambassadorCount = await prisma.ambassador.count();
  if (ambassadorCount === 0) {
    await prisma.ambassador.createMany({ data: initialAmbassadors });
  }

  const taskCount = await prisma.task.count();
  if (taskCount === 0) {
    await prisma.task.createMany({ data: initialTasks });
  }
}
