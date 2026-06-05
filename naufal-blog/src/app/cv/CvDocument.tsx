"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  achievements,
  compactRoles,
  contact,
  education,
  experience,
  skills,
} from "./cv-data";

const SHEET_WIDTH = 794; // A4 @ 96dpi

export function CvDocument() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Scale the fixed A4 sheet down to fit narrow viewports via `zoom` (reflows,
  // so no leftover whitespace and the sheet stays centred). Print resets it.
  useEffect(() => {
    const wrap = wrapRef.current;
    const sheet = sheetRef.current;
    if (!wrap || !sheet) return;
    const update = () => {
      const z = Math.min(1, wrap.clientWidth / SHEET_WIDTH);
      sheet.style.setProperty("--cv-zoom", String(z));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="cv-chrome border-border/50 bg-background/80 sticky top-0 z-10 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3 font-mono text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← naufal.dev
          </Link>
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="font-mono cursor-pointer"
          >
            Download PDF
          </Button>
        </div>
      </header>

      <div className="cv-stage">
        <div ref={wrapRef} className="cv-wrap">
          <article ref={sheetRef} className="cv-sheet">
            <header>
              <h1>Naufal Yusran</h1>
              <p className="cv-contact">
                {contact.location}
                <span className="sep">|</span>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
                {/* Phone: only in the printed/downloaded PDF, hidden on the
                    public web page. */}
                <span className="cv-print-only">
                  <span className="sep">|</span>
                  <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                </span>
                <span className="sep">|</span>
                <a href={contact.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              </p>
            </header>

            <section className="cv-section">
              <h2>Professional Experience</h2>

              {experience.map((job) => (
                <div className="cv-entry" key={job.company}>
                  <div className="cv-row">
                    <span>
                      <strong>{job.company}</strong> / {job.industry}
                    </span>
                    <span className="meta">{job.location}</span>
                  </div>
                  {job.roles.map((role) => (
                    <div className="cv-row" key={role.title}>
                      <span className="cv-role">{role.title}</span>
                      <span className="meta">{role.dates}</span>
                    </div>
                  ))}
                  <ul>
                    {job.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="cv-entry">
                {compactRoles.map((role) => (
                  <div className="cv-oneliner" key={role.company}>
                    <span>
                      <strong>{role.company}</strong> {role.rest}
                    </span>
                    <span className="meta">{role.dates}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="cv-section">
              <h2>Education</h2>
              <div className="cv-entry">
                <div className="cv-row">
                  <span>
                    <strong>{education.school}</strong>
                  </span>
                  <span className="meta" />
                </div>
                <div className="cv-row">
                  <span>{education.degree}</span>
                  <span className="meta">{education.dates}</span>
                </div>
                <ul>
                  {education.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="cv-section">
              <h2>Projects &amp; Achievements</h2>
              {achievements.map((item) => (
                <p key={item.lead}>
                  <strong>{item.lead}</strong> {item.rest}
                </p>
              ))}
              <p>
                <strong>Skills</strong>: {skills}
              </p>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
}
