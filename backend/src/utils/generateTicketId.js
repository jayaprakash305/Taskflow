import Counter from "../models/Counter.js";

const generateTicketId = async (projectName, departmentName) => {
  let prefix = "TKT";
  
  if (projectName) {
    const words = projectName.trim().split(/\s+/);
    if (words.length > 1) {
      prefix = words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
    } else {
      prefix = projectName.substring(0, 4).toUpperCase();
    }
  } else if (departmentName) {
    const words = departmentName.trim().split(/\s+/);
    if (words.length > 1) {
      prefix = words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
    } else {
      prefix = departmentName.substring(0, 4).toUpperCase();
    }
  }

  const counter = await Counter.findByIdAndUpdate(
    prefix,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `${prefix}-${counter.seq}`;
};

export default generateTicketId;