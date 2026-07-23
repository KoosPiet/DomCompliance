/**
 * Domain-level leave types. Values intentionally mirror the Prisma
 * `LeaveType` enum so they map 1:1 at the persistence boundary, while
 * keeping the domain layer free of any Prisma import (clean architecture).
 */
export enum LeaveType {
  ANNUAL = "ANNUAL",
  SICK = "SICK",
  FAMILY_RESPONSIBILITY = "FAMILY_RESPONSIBILITY",
  MATERNITY = "MATERNITY",
  UNPAID = "UNPAID",
}
