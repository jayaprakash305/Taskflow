import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "./src/models/User.js";
import Project from "./src/models/Project.js";
import Ticket from "./src/models/Ticket.js";
import { runTicketOverdueJob } from "./src/jobs/ticketOverdueJob.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const runTest = async () => {
  await connectDB();
  console.log("Running overdue job manually...");
  await runTicketOverdueJob();
  console.log("Job finished.");
  process.exit(0);
};

runTest();
