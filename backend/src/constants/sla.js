// ============================================================
// backend/src/constants/sla.js
// ============================================================
// Description: SLA target hours per ticket priority.
// responseHours  -> time within which first response is expected
// resolutionHours -> time within which ticket should be resolved
// ============================================================

export const SLA_HOURS = {
  urgent: { responseHours: 1, resolutionHours: 4 },
  high: { responseHours: 4, resolutionHours: 8 },
  medium: { responseHours: 8, resolutionHours: 24 },
  low: { responseHours: 24, resolutionHours: 72 }
};

export const getSlaDueDates = (priority, fromDate = new Date()) => {
  const config = SLA_HOURS[priority] || SLA_HOURS.medium;
  const from = new Date(fromDate);

  const responseDueAt = new Date(from.getTime() + config.responseHours * 60 * 60 * 1000);
  const resolutionDueAt = new Date(from.getTime() + config.resolutionHours * 60 * 60 * 1000);

  return { responseDueAt, resolutionDueAt };
};