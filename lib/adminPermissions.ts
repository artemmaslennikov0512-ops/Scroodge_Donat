export const AdminPermissions = {
  VIEW_USERS: "view_users",
  EDIT_USERS: "edit_users",
  DELETE_USERS: "delete_users",
  BAN_USERS: "ban_users",
  VERIFY_USERS: "verify_users",
  VIEW_DONATIONS: "view_donations",
  REFUND_DONATIONS: "refund_donations",
  MANAGE_DONATIONS: "manage_donations",
  VIEW_PAYMENTS: "view_payments",
  MANAGE_PAYMENTS: "manage_payments",
  VIEW_TRANSACTIONS: "view_transactions",
  VIEW_LOGS: "view_logs",
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_ADMINS: "manage_admins",
  VIEW_ANALYTICS: "view_analytics",
  VIEW_SECURITY_LOGS: "view_security_logs",
  MANAGE_SECURITY: "manage_security",
  IP_BLOCKING: "ip_blocking",
  VIEW_TICKETS: "view_tickets",
  RESPOND_TICKETS: "respond_tickets",
  CLOSE_TICKETS: "close_tickets",
} as const;

export type AdminPermission =
  (typeof AdminPermissions)[keyof typeof AdminPermissions];

export const RolePermissions: Record<string, AdminPermission[]> = {
  SUPER_ADMIN: Object.values(AdminPermissions),
  ADMIN: [
    AdminPermissions.VIEW_USERS,
    AdminPermissions.EDIT_USERS,
    AdminPermissions.BAN_USERS,
    AdminPermissions.VERIFY_USERS,
    AdminPermissions.VIEW_DONATIONS,
    AdminPermissions.VIEW_PAYMENTS,
    AdminPermissions.VIEW_LOGS,
    AdminPermissions.VIEW_ANALYTICS,
    AdminPermissions.VIEW_TICKETS,
    AdminPermissions.RESPOND_TICKETS,
  ],
  MODERATOR: [
    AdminPermissions.VIEW_USERS,
    AdminPermissions.VIEW_DONATIONS,
    AdminPermissions.VIEW_TICKETS,
    AdminPermissions.RESPOND_TICKETS,
    AdminPermissions.CLOSE_TICKETS,
  ],
  SUPPORT: [
    AdminPermissions.VIEW_TICKETS,
    AdminPermissions.RESPOND_TICKETS,
    AdminPermissions.CLOSE_TICKETS,
  ],
  FINANCE: [
    AdminPermissions.VIEW_PAYMENTS,
    AdminPermissions.VIEW_TRANSACTIONS,
    AdminPermissions.VIEW_DONATIONS,
    AdminPermissions.REFUND_DONATIONS,
  ],
};
