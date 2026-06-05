import type { Metadata } from "next";

import { CvDocument } from "./CvDocument";
// Carlito is metric-compatible with Calibri (identical advance widths + line
// metrics). Bundling it means devices without Calibri (Android, Linux, etc.)
// render the sheet identically to Windows — keeping the replica pixel-faithful
// AND preserving the one-A4-page fit when printing. 400 = body, 700 = headings.
import "@fontsource/carlito/400.css";
import "@fontsource/carlito/700.css";
import "./cv.css";

export const metadata: Metadata = {
  title: "CV",
  description:
    "Curriculum vitae of Naufal Yusran — frontend & microfrontend engineer based in Jakarta.",
};

export default function CvPage() {
  return <CvDocument />;
}
