"use client";

import { PageHead } from "@/components/shared";

/** Título de página. Los metadatos del protocolo viven en la banda superior. */
export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return <PageHead title={title} subtitle={subtitle} />;
}
