"use client";

import { usePathname } from "next/navigation";
import AdminShell from "./AdminShell";

const NO_SHELL_PATHS = ["/admin/login", "/admin/change-password"];

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const noShell = NO_SHELL_PATHS.some((p) => pathname === p);

  if (noShell) {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}
