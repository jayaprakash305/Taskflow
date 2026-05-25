import cron from "node-cron";
import { runTicketOverdueJob } from "./ticketOverdueJob.js";

export const startJobs = () => {
  // Every 1 minute for testing
  // Format: second minute hour day-of-month month day-of-week
  cron.schedule("*/1 * * * *", async () => {
    console.log("[Cron] Running overdue ticket job...");
    await runTicketOverdueJob();
  });

  console.log("[Jobs] Scheduled background jobs successfully");
};
