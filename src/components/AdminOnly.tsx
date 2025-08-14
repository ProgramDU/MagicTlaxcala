import React from "react";
import { useIsAdmin } from "../hooks/useIsAdmin";

interface AdminOnlyProps {
  children: React.ReactNode;
}

export default function AdminOnly({ children }: AdminOnlyProps) {
  const isAdmin = useIsAdmin();

  if (isAdmin === null) {
    return null; // mientras carga
  }

  return isAdmin ? <>{children}</> : null;
}
