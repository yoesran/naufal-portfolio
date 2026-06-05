import type { Metadata } from "next";

import { CvDocument } from "./CvDocument";
import "./cv.css";

export const metadata: Metadata = {
  title: "CV",
  description:
    "Curriculum vitae of Naufal Yusran — frontend & microfrontend engineer based in Jakarta.",
};

export default function CvPage() {
  return <CvDocument />;
}
