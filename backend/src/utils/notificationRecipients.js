export const uniqueIds = (ids = []) => {
  return [...new Set(ids.filter(Boolean).map((id) => String(id)))];
};

export const removeActor = (ids = [], actorId) => {
  return ids.filter((id) => String(id) !== String(actorId));
};

export const getProjectTeamRecipientIds = (project, actorId) => {
  const ids = [
    project?.managerId?._id || project?.managerId,
    project?.leadId?._id || project?.leadId,
    ...(project?.memberIds || []).map((m) => m?._id || m),
  ];

  return removeActor(uniqueIds(ids), actorId);
};

export const getTicketRecipientIds = (ticket, project, actorId) => {
  const ids = [
    ticket?.raisedBy?._id || ticket?.raisedBy,
    ...(ticket?.assignedTo || []).map((a) => a?._id || a),
    project?.leadId?._id || project?.leadId,
    project?.managerId?._id || project?.managerId,
  ];

  return removeActor(uniqueIds(ids), actorId);
};
