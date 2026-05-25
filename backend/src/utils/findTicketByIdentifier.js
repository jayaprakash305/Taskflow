import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";

const findTicketByIdentifier = async (identifier, populate = false) => {
  let query = null;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query = Ticket.findOne({
      $or: [{ _id: identifier }, { ticketId: identifier }],
    });
  } else {
    query = Ticket.findOne({ ticketId: identifier });
  }

  if (populate) {
    query = query
      .populate("raisedBy", "name email role department")
      .populate("assignedTo", "name email role department");
  }

  return await query;
};

export default findTicketByIdentifier;