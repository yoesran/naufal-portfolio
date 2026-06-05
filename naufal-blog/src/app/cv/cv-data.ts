// CV content as data — edit here, not in the markup. The layout in
// CvDocument.tsx maps over these; the one-page fit is tuned via the CSS
// variables at the top of cv.css (--fs, --lh, --entry-gap, --section-gap).
// After adding/removing entries, nudge those knobs to refit one A4 page.

export const contact = {
  location: "Jakarta, Indonesia",
  email: "naufalyoesran@gmail.com",
  phone: "+6282151533717", // shown only in the printed/downloaded PDF
  linkedin: "https://www.linkedin.com/in/naufal-yusran/",
};

export type Experience = {
  company: string;
  industry: string;
  location: string;
  roles: { title: string; dates: string }[];
  bullets: string[];
};

export const experience: Experience[] = [
  {
    company: "DBS Bank Indonesia",
    industry: "Banking",
    location: "Hybrid, Jakarta",
    roles: [
      {
        title: "React.js Developer (Direct Contract)",
        dates: "Feb 2026 – Present",
      },
    ],
    bullets: [
      "Contributing to a webview-based application using React.js within a microfrontend architecture (Module Federation).",
      "Collaborating with cross-functional teams to ensure seamless integration between microfrontends and backend services.",
    ],
  },
  {
    company: "eDOT",
    industry: "SaaS",
    location: "Remote",
    roles: [
      {
        title: "Frontend Developer (Contract via Dikshatek)",
        dates: "Dec 2025 – Apr 2026",
      },
    ],
    bullets: [
      "Worked on a dashboard application that tracks multiple business processes for client companies, shipping four production features end-to-end.",
      "Built features using Next.js, React Query, Tailwind CSS, shadcn/ui, React Hook Form, and Zod, with unit-test coverage on core logic.",
    ],
  },
  {
    company: "Ajaib",
    industry: "Investment & Fintech Platform",
    location: "Hybrid, Jakarta",
    roles: [
      {
        title: "Fullstack Developer (Contract via Binar)",
        dates: "Aug 2025 – Feb 2026",
      },
    ],
    bullets: [
      "Migrated and revamped ajaib.co.id landing pages from WordPress to Next.js, improving maintainability and scalability.",
      "Implemented SSR/SSG, SEO optimizations (metadata, sitemap, robots.txt), and responsive UI across multiple product pages (stocks, crypto, mutual funds, etc.).",
      "Worked within the Growth Team, focusing on the public-facing website experience.",
      "Contributed to the Onboarding Team, developing a dynamic webview-based form system driven by backend responses, enabling flexible onboarding flows per product.",
      "Built and maintained features in Ajaib’s internal back-office application.",
    ],
  },
  {
    company: "Bank Danamon Indonesia",
    industry: "Banking",
    location: "Jakarta",
    roles: [
      {
        title: "Web Developer (Contract via Infosys Solusi Terpadu)",
        dates: "Aug 2024 – Aug 2025",
      },
    ],
    bullets: [
      "Developed DBankPro 2.0 Back Office Application using microfrontend architecture (Single-SPA → NX migration).",
      "Worked with React (container) and Angular (feature modules).",
      "Collaborated with international backend teams and cross-functional stakeholders (PO, BA, QA).",
      "Led one sprint as task assigner and code reviewer.",
      "Contributed to migration from Single-SPA to NX Microfrontend (latest Angular).",
      "Built features for onboarding and back-office systems.",
    ],
  },
  {
    company: "Infosys Solusi Terpadu",
    industry: "IT Services",
    location: "Hybrid, Jakarta",
    roles: [
      { title: "Front End Developer (Contract)", dates: "Apr 2024 – Aug 2025" },
    ],
    bullets: [
      "Contributed to two back-office applications using Next.js and Angular.",
      "Joined ongoing projects and delivered features aligned with established architecture and conventions.",
      "Outsourced to the client and finished the project successfully.",
    ],
  },
  {
    company: "Doubler Studio",
    industry: "Digital Agency",
    location: "Remote",
    roles: [
      {
        title: "Javascript Front End Developer (Freelance)",
        dates: "Apr 2024 – Aug 2025",
      },
      {
        title: "Javascript Front End Developer (Contract)",
        dates: "Oct 2023 – Mar 2024",
      },
    ],
    bullets: [
      "Delivered multiple client projects (including BCA) using vanilla JS, jQuery, Nunjucks, React, Next.js.",
      "Built interactive UI with animations and ensured backend integration compatibility.",
      "Acted as sole developer on several projects and collaborated in team-based deliveries.",
    ],
  },
];

// Early-career roles, kept as one-liners (recency/relevance taper).
export type CompactRole = { company: string; rest: string; dates: string };

export const compactRoles: CompactRole[] = [
  {
    company: "GeekGarden Software House,",
    rest: "Flutter Developer (Contract) (Remote)",
    dates: "2022–2023",
  },
  {
    company: "Ehealth.co.id,",
    rest: "Junior Software Engineer (Contract) (Remote)",
    dates: "2022–2023",
  },
  {
    company: "Traveloka,",
    rest: "Web Engineer (Internship) (Remote)",
    dates: "2022",
  },
];

export const education = {
  school: "Universitas Islam Indonesia",
  degree: "Bachelor of Informatics",
  dates: "2019 – 2023",
  bullets: ["Cum Laude (GPA: 3.69 / 4.00)"],
};

export type Achievement = { lead: string; rest: string };

export const achievements: Achievement[] = [
  {
    lead: "Game Developer Bootcamp (Agate / Kampus Merdeka),",
    rest: "Completed Unity-based game development program.",
  },
  {
    lead: "Funding Recipient – Pekan Kreativitas Mahasiswa,",
    rest: "Built a Flutter-based prototype as sole mobile developer in a multidisciplinary team.",
  },
];

export const skills =
  "React.js, Next.js, Angular, JavaScript, TypeScript, HTML, CSS, Tailwind, Bootstrap, Flutter, Microfrontend, React Query, React Hook Form, Zod, Playwright, Unit Testing, Git, REST API integration, jQuery, Drone CI, SonarQube, Nexus IQ, Agile/Scrum, Jira.";
