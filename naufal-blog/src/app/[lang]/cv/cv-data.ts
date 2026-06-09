// CV content as data, per locale. Edit here, not in the markup. The layout in
// CvDocument.tsx maps over the returned object; the one-page fit is tuned via the
// CSS variables at the top of cv.css. Locale-invariant fields (company names,
// dates, email, phone, links, school) are repeated verbatim across locales to
// keep each object self-contained and easy to edit. Indonesian is a best-effort
// draft — Naufal is the native speaker and source of truth.
import type { Locale } from '@/lib/i18n/config'

export type Experience = {
  company: string
  industry: string
  location: string
  roles: { title: string; dates: string }[]
  bullets: string[]
}
export type CompactRole = { company: string; rest: string; dates: string }
export type Achievement = { lead: string; rest: string }

export type CvData = {
  contact: { location: string; email: string; phone: string; linkedin: string }
  experience: Experience[]
  compactRoles: CompactRole[]
  education: {
    school: string
    degree: string
    dates: string
    bullets: string[]
  }
  achievements: Achievement[]
  skills: string
}

const EMAIL = 'naufalyoesran@gmail.com'
const PHONE = '+6282151533717'
const LINKEDIN = 'https://www.linkedin.com/in/naufal-yusran/'

const cv: Record<Locale, CvData> = {
  en: {
    contact: {
      location: 'Jakarta, Indonesia',
      email: EMAIL,
      phone: PHONE,
      linkedin: LINKEDIN,
    },
    experience: [
      {
        company: 'DBS Bank Indonesia',
        industry: 'Banking',
        location: 'Hybrid, Jakarta',
        roles: [
          {
            title: 'React.js Developer (Direct Contract)',
            dates: 'Feb 2026 – Present',
          },
        ],
        bullets: [
          'Contributing to a webview-based application using React.js within a microfrontend architecture (Module Federation).',
          'Collaborating with cross-functional teams to ensure seamless integration between microfrontends and backend services.',
        ],
      },
      {
        company: 'eDOT',
        industry: 'SaaS',
        location: 'Remote',
        roles: [
          {
            title: 'Frontend Developer (Contract via Dikshatek)',
            dates: 'Dec 2025 – Apr 2026',
          },
        ],
        bullets: [
          'Worked on a dashboard application that tracks multiple business processes for client companies, shipping four production features end-to-end.',
          'Built features using Next.js, React Query, Tailwind CSS, shadcn/ui, React Hook Form, and Zod, with unit-test coverage on core logic.',
        ],
      },
      {
        company: 'Ajaib',
        industry: 'Investment & Fintech Platform',
        location: 'Hybrid, Jakarta',
        roles: [
          {
            title: 'Fullstack Developer (Contract via Binar)',
            dates: 'Aug 2025 – Feb 2026',
          },
        ],
        bullets: [
          'Migrated and revamped ajaib.co.id landing pages from WordPress to Next.js, improving maintainability and scalability.',
          'Implemented SSR/SSG, SEO optimizations (metadata, sitemap, robots.txt), and responsive UI across multiple product pages (stocks, crypto, mutual funds, etc.).',
          'Worked within the Growth Team, focusing on the public-facing website experience.',
          'Contributed to the Onboarding Team, developing a dynamic webview-based form system driven by backend responses, enabling flexible onboarding flows per product.',
          'Built and maintained features in Ajaib’s internal back-office application.',
        ],
      },
      {
        company: 'Bank Danamon Indonesia',
        industry: 'Banking',
        location: 'Jakarta',
        roles: [
          {
            title: 'Web Developer (Contract via Infosys Solusi Terpadu)',
            dates: 'Aug 2024 – Aug 2025',
          },
        ],
        bullets: [
          'Developed DBankPro 2.0 Back Office Application using microfrontend architecture (Single-SPA → NX migration).',
          'Worked with React (container) and Angular (feature modules).',
          'Collaborated with international backend teams and cross-functional stakeholders (PO, BA, QA).',
          'Led one sprint as task assigner and code reviewer.',
          'Contributed to migration from Single-SPA to NX Microfrontend (latest Angular).',
          'Built features for onboarding and back-office systems.',
        ],
      },
      {
        company: 'Infosys Solusi Terpadu',
        industry: 'IT Services',
        location: 'Hybrid, Jakarta',
        roles: [
          {
            title: 'Front End Developer (Contract)',
            dates: 'Apr 2024 – Aug 2025',
          },
        ],
        bullets: [
          'Contributed to two back-office applications using Next.js and Angular.',
          'Joined ongoing projects and delivered features aligned with established architecture and conventions.',
          'Outsourced to the client and finished the project successfully.',
        ],
      },
      {
        company: 'Doubler Studio',
        industry: 'Digital Agency',
        location: 'Remote',
        roles: [
          {
            title: 'Javascript Front End Developer (Freelance)',
            dates: 'Apr 2024 – Aug 2025',
          },
          {
            title: 'Javascript Front End Developer (Contract)',
            dates: 'Oct 2023 – Mar 2024',
          },
        ],
        bullets: [
          'Delivered multiple client projects (including BCA) using vanilla JS, jQuery, Nunjucks, React, Next.js.',
          'Built interactive UI with animations and ensured backend integration compatibility.',
          'Acted as sole developer on several projects and collaborated in team-based deliveries.',
        ],
      },
    ],
    compactRoles: [
      {
        company: 'GeekGarden Software House,',
        rest: 'Flutter Developer (Contract) (Remote)',
        dates: '2022–2023',
      },
      {
        company: 'Ehealth.co.id,',
        rest: 'Junior Software Engineer (Contract) (Remote)',
        dates: '2022–2023',
      },
      {
        company: 'Traveloka,',
        rest: 'Web Engineer (Internship) (Remote)',
        dates: '2022',
      },
    ],
    education: {
      school: 'Universitas Islam Indonesia',
      degree: 'Bachelor of Informatics',
      dates: '2019 – 2023',
      bullets: ['Cum Laude (GPA: 3.69 / 4.00)'],
    },
    achievements: [
      {
        lead: 'Game Developer Bootcamp (Agate / Kampus Merdeka),',
        rest: 'Completed Unity-based game development program.',
      },
      {
        lead: 'Funding Recipient – Pekan Kreativitas Mahasiswa,',
        rest: 'Built a Flutter-based prototype as sole mobile developer in a multidisciplinary team.',
      },
    ],
    skills:
      'React.js, Next.js, Angular, JavaScript, TypeScript, HTML, CSS, Tailwind, Bootstrap, Flutter, Microfrontend, React Query, React Hook Form, Zod, Playwright, Unit Testing, Git, REST API integration, jQuery, Drone CI, SonarQube, Nexus IQ, Agile/Scrum, Jira.',
  },
  id: {
    contact: {
      location: 'Jakarta, Indonesia',
      email: EMAIL,
      phone: PHONE,
      linkedin: LINKEDIN,
    },
    experience: [
      {
        company: 'DBS Bank Indonesia',
        industry: 'Perbankan',
        location: 'Hybrid, Jakarta',
        roles: [
          {
            title: 'React.js Developer (Kontrak Langsung)',
            dates: 'Feb 2026 – Sekarang',
          },
        ],
        bullets: [
          'Berkontribusi pada aplikasi berbasis webview menggunakan React.js dalam arsitektur microfrontend (Module Federation).',
          'Berkolaborasi dengan tim lintas fungsi untuk memastikan integrasi yang mulus antara microfrontend dan layanan backend.',
        ],
      },
      {
        company: 'eDOT',
        industry: 'SaaS',
        location: 'Remote',
        roles: [
          {
            title: 'Frontend Developer (Kontrak via Dikshatek)',
            dates: 'Des 2025 – Apr 2026',
          },
        ],
        bullets: [
          'Mengerjakan aplikasi dashboard yang memantau berbagai proses bisnis perusahaan klien, merilis empat fitur produksi secara menyeluruh.',
          'Membangun fitur menggunakan Next.js, React Query, Tailwind CSS, shadcn/ui, React Hook Form, dan Zod, dengan cakupan unit test pada logika inti.',
        ],
      },
      {
        company: 'Ajaib',
        industry: 'Platform Investasi & Fintech',
        location: 'Hybrid, Jakarta',
        roles: [
          {
            title: 'Fullstack Developer (Kontrak via Binar)',
            dates: 'Agu 2025 – Feb 2026',
          },
        ],
        bullets: [
          'Memigrasikan dan merombak halaman landing ajaib.co.id dari WordPress ke Next.js, meningkatkan kemudahan pemeliharaan dan skalabilitas.',
          'Menerapkan SSR/SSG, optimasi SEO (metadata, sitemap, robots.txt), dan UI responsif di berbagai halaman produk (saham, kripto, reksa dana, dll.).',
          'Bekerja di dalam Growth Team, berfokus pada pengalaman situs yang menghadap publik.',
          'Berkontribusi pada Onboarding Team, mengembangkan sistem formulir dinamis berbasis webview yang digerakkan oleh respons backend, memungkinkan alur onboarding yang fleksibel per produk.',
          'Membangun dan memelihara fitur pada aplikasi back-office internal Ajaib.',
        ],
      },
      {
        company: 'Bank Danamon Indonesia',
        industry: 'Perbankan',
        location: 'Jakarta',
        roles: [
          {
            title: 'Web Developer (Kontrak via Infosys Solusi Terpadu)',
            dates: 'Agu 2024 – Agu 2025',
          },
        ],
        bullets: [
          'Mengembangkan DBankPro 2.0 Back Office Application menggunakan arsitektur microfrontend (migrasi Single-SPA → NX).',
          'Bekerja dengan React (container) dan Angular (feature module).',
          'Berkolaborasi dengan tim backend internasional dan pemangku kepentingan lintas fungsi (PO, BA, QA).',
          'Memimpin satu sprint sebagai pembagi tugas dan code reviewer.',
          'Berkontribusi pada migrasi dari Single-SPA ke NX Microfrontend (Angular terbaru).',
          'Membangun fitur untuk sistem onboarding dan back-office.',
        ],
      },
      {
        company: 'Infosys Solusi Terpadu',
        industry: 'Layanan TI',
        location: 'Hybrid, Jakarta',
        roles: [
          {
            title: 'Front End Developer (Kontrak)',
            dates: 'Apr 2024 – Agu 2025',
          },
        ],
        bullets: [
          'Berkontribusi pada dua aplikasi back-office menggunakan Next.js dan Angular.',
          'Bergabung dengan proyek berjalan dan merilis fitur sesuai arsitektur serta konvensi yang ada.',
          'Ditugaskan ke klien dan menyelesaikan proyek dengan sukses.',
        ],
      },
      {
        company: 'Doubler Studio',
        industry: 'Agensi Digital',
        location: 'Remote',
        roles: [
          {
            title: 'Javascript Front End Developer (Freelance)',
            dates: 'Apr 2024 – Agu 2025',
          },
          {
            title: 'Javascript Front End Developer (Kontrak)',
            dates: 'Okt 2023 – Mar 2024',
          },
        ],
        bullets: [
          'Menyelesaikan berbagai proyek klien (termasuk BCA) menggunakan vanilla JS, jQuery, Nunjucks, React, Next.js.',
          'Membangun UI interaktif dengan animasi dan memastikan kompatibilitas integrasi backend.',
          'Berperan sebagai satu-satunya developer di beberapa proyek dan berkolaborasi dalam pengerjaan berbasis tim.',
        ],
      },
    ],
    compactRoles: [
      {
        company: 'GeekGarden Software House,',
        rest: 'Flutter Developer (Kontrak) (Remote)',
        dates: '2022–2023',
      },
      {
        company: 'Ehealth.co.id,',
        rest: 'Junior Software Engineer (Kontrak) (Remote)',
        dates: '2022–2023',
      },
      {
        company: 'Traveloka,',
        rest: 'Web Engineer (Magang) (Remote)',
        dates: '2022',
      },
    ],
    education: {
      school: 'Universitas Islam Indonesia',
      degree: 'Sarjana Informatika',
      dates: '2019 – 2023',
      bullets: ['Cum Laude (IPK: 3.69 / 4.00)'],
    },
    achievements: [
      {
        lead: 'Game Developer Bootcamp (Agate / Kampus Merdeka),',
        rest: 'Menyelesaikan program pengembangan game berbasis Unity.',
      },
      {
        lead: 'Penerima Pendanaan – Pekan Kreativitas Mahasiswa,',
        rest: 'Membangun prototipe berbasis Flutter sebagai satu-satunya developer mobile dalam tim multidisiplin.',
      },
    ],
    skills:
      'React.js, Next.js, Angular, JavaScript, TypeScript, HTML, CSS, Tailwind, Bootstrap, Flutter, Microfrontend, React Query, React Hook Form, Zod, Playwright, Unit Testing, Git, integrasi REST API, jQuery, Drone CI, SonarQube, Nexus IQ, Agile/Scrum, Jira.',
  },
}

export function getCv(locale: Locale): CvData {
  return cv[locale]
}
