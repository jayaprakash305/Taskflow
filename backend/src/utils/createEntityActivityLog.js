import ActivityLog from "../models/ActivityLog.js";

const createEntityActivityLog = async ({
  entityType,
  entityId,
  entityTypeRef,
  action,
  performedBy,
  message,
  metadata = {},
}) => {
  return await ActivityLog.create({
    entityType,
    entityId,
    entityTypeRef,
    action,
    performedBy,
    message,
    metadata,
  });
};

export default createEntityActivityLog;