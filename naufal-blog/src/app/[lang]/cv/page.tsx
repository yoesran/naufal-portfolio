import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { alternates } from "@/lib/i18n/alternates";
import { CvDocument } from "./CvDocument";
import { getCv } from "./cv-data";
// Carlito is metric-compatible with Calibri (identical advance widths + line
// metrics): non-Windows devices (Android, Linux) render the sheet identically
// to Windows, keeping the replica pixel-faithful AND one A4 page when printing.
import "@fontsource/carlito/400.css";
import "@fontsource/carlito/700.css";
import "./cv.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.meta.cvTitle,
    description: dict.meta.cvDescription,
    alternates: alternates(lang, "cv"),
  };
}

export default async function CvPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  return <CvDocument data={getCv(lang)} labels={dict.cv} />;
}
