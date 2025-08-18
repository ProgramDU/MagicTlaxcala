// src/components/AdminOnly.tsx
import React from "react";
import { useIsAdmin } from "../hooks/useIsAdmin";

type AdminOnlyProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode; // opcional
};

export default function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { isAdmin } = useIsAdmin();

  // isAdmin === null -> cargando; mostramos fallback si viene
  if (isAdmin === null) return <>{fallback}</>;

  // No admin -> nada (o fallback si prefieres)
  if (!isAdmin) return null;

  // Es admin -> renderiza children
  return <>{children}</>;
}
