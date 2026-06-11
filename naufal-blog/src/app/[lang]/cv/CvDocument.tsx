'use client'

import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'

import type { CvData } from './cv-data'

const SHEET_WIDTH = 794 // A4 @ 96dpi

type Labels = {
  download: string
  experience: string
  education: string
  projects: string
  skillsLabel: string
}

export function CvDocument({ data, labels }: { data: CvData; labels: Labels }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const { contact, experience, compactRoles, education, achievements, skills } =
    data

  // Scale the fixed A4 sheet down to fit narrow viewports via `transform: scale`
  // (consistent across engines, unlike `zoom` — see cv.css). transform doesn't
  // reflow, so we also set the wrapper's height to the sheet's *scaled* height,
  // otherwise the full-size layout box leaves a large gap below. Print resets it.
  useEffect(() => {
    const wrap = wrapRef.current
    const sheet = sheetRef.current
    if (!wrap || !sheet) return
    let lastWidth = -1
    const update = () => {
      const width = wrap.clientWidth
      // Only react to width changes — we mutate the wrapper's height below, which
      // would otherwise re-trigger the observer into a loop.
      if (width === lastWidth) return
      lastWidth = width
      const z = Math.min(1, width / SHEET_WIDTH)
      sheet.style.setProperty('--cv-zoom', String(z))
      wrap.style.height = `${sheet.getBoundingClientRect().height}px`
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="cv-stage">
      <div className="cv-actions mx-auto flex max-w-5xl justify-end px-6">
        <Button
          onClick={() => window.print()}
          variant="outline"
          size="sm"
          className="font-mono"
        >
          {labels.download}
        </Button>
      </div>

      <div ref={wrapRef} className="cv-wrap">
        <article ref={sheetRef} className="cv-sheet">
          <header>
            <h1>Naufal Yusran</h1>
            <p className="cv-contact">
              {contact.location}
              <span className="sep">|</span>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
              {/* Phone: only in the printed/downloaded PDF, hidden on the web. */}
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
            <h2>{labels.experience}</h2>

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
            <h2>{labels.education}</h2>
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
            <h2>{labels.projects}</h2>
            {achievements.map((item) => (
              <p key={item.lead}>
                <strong>{item.lead}</strong> {item.rest}
              </p>
            ))}
            <p>
              <strong>{labels.skillsLabel}</strong>: {skills}
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
