import { EvidenceReport, MicroTask } from "../types";

export interface DemoProfile {
  id: string;
  name: string;
  role: string;
  githubUsername: string;
  description: string;
  resumeSnippet: string;
  jobDescription: string;
  report: EvidenceReport;
}

export const TARGET_ROLE_DESCRIPTIONS: Record<string, string> = {
  "Frontend Developer": `We are looking for a Junior to Mid-Level Frontend Developer to join our product team.
Key Responsibilities:
- Build responsive, accessible web interfaces using React and modern JavaScript/TypeScript.
- Collaborate with designers to implement pixel-perfect Tailwind CSS or CSS module designs.
- Integrate REST APIs and manage client-side state cleanly.
- Write unit and component tests using Vitest, Jest, or React Testing Library.
- Package and deploy applications using Docker containers and CI/CD pipelines.
- Practice clean Git workflows with descriptive commit messages and pull requests.
Requirements:
- Strong foundations in React, JavaScript (ES6+), HTML5, and CSS3/Tailwind.
- Proven experience with Git version control and GitHub workflows.
- Exposure to TypeScript, component testing, and containerization with Docker.`,

  "Backend Developer": `Seeking an enthusiastic Backend Developer to build scalable APIs and distributed microservices.
Key Responsibilities:
- Design, build, and maintain RESTful and GraphQL APIs using Node.js and Express or Python.
- Model relational data schemas and write performant SQL queries using PostgreSQL or MySQL.
- Implement caching with Redis and secure authentication using JWT/OAuth.
- Write comprehensive integration tests with Jest, Supertest, or PyTest.
- Containerize services using Docker and orchestrate with basic Kubernetes or Docker Compose.
- Monitor application logs and set up automated GitHub Actions CI/CD pipelines.
Requirements:
- Proficiency in Node.js, Express, and SQL databases.
- Hands-on Git collaboration experience.
- Familiarity with Docker, API testing, and cloud deployment basics.`,

  "Python Developer": `We are hiring a Python Software Engineer to build data processing engines and backend automation services.
Key Responsibilities:
- Develop maintainable Python services using FastAPI, Flask, or Django.
- Interact with SQL databases, write ORM models, and perform data transformations with Pandas.
- Implement background workers and task queues with Celery or Redis.
- Write unit tests with PyTest and maintain 80%+ test coverage.
- Create reproducible environments with Docker and virtualenv/Poetry.
Requirements:
- Strong core Python skills (OOP, typing, generators, async programming).
- Experience with SQL databases and Git.
- Exposure to Docker containerization and automated testing.`,

  "Data Analyst": `Looking for a Data Analyst to translate raw metrics into strategic business insights.
Key Responsibilities:
- Extract, clean, and manipulate structured datasets using SQL and Python (Pandas, NumPy).
- Build intuitive dashboards and visual reports using Tableau, Power BI, or Matplotlib/Seaborn.
- Formulate business hypotheses, perform cohort and regression analyses, and validate data integrity.
- Document analytical methodology and push reproducible exploratory notebooks to GitHub.
Requirements:
- Advanced SQL querying (Window functions, CTEs, complex joins).
- Practical Python data analysis (Pandas, Jupyter Notebooks).
- Strong data visualization and storytelling skills.`,

  "Full Stack Developer": `We are seeking an adaptable Full Stack Developer to build end-to-end features across web and server.
Key Responsibilities:
- Develop modern reactive frontend applications using React and Tailwind CSS.
- Build reliable backend REST APIs using Node.js, TypeScript, and SQL databases.
- Write automated tests across both frontend and backend layers.
- Build Docker container images and deploy to cloud environments (Vercel, AWS, or GCP).
- Collaborate using GitHub issues, pull request reviews, and continuous integration.
Requirements:
- Working knowledge of React, Node.js, SQL, and Git.
- Demonstrated ability to ship full-stack web applications.
- Exposure to TypeScript, Docker, and testing.`,
};

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "frontend-alex",
    name: "Alex Chen",
    role: "Frontend Developer",
    githubUsername: "alex-chen-dev",
    description: "Final-year CS student with a strong React portfolio, seeking to prove full readiness for Frontend roles.",
    resumeSnippet: `ALEX CHEN
San Francisco, CA | alex.chen@example.edu | github.com/alex-chen-dev

EDUCATION
B.S. in Computer Science, University of California | Expected May 2026
Relevant Coursework: Web Development, Software Engineering, Algorithms, Database Systems

TECHNICAL SKILLS
Languages: JavaScript (ES6+), HTML5, CSS3, TypeScript, Python
Frameworks & Libraries: React, Tailwind CSS, Next.js, Redux Toolkit
Developer Tools: Git, GitHub, Docker, Vite, npm, Postman
Databases & Cloud: SQL, Supabase, Firebase, Vercel

PROJECTS
TaskFlow - Collaborative Project Board (React, Tailwind CSS, Firebase)
- Built a Kanban task manager with drag-and-drop support and real-time synchronization.
- Implemented responsive mobile-first UI with dark mode support using Tailwind CSS.
- Deployed to Vercel with automated GitHub workflow triggers.

DevPulse - Developer Activity Tracker (React, Chart.js, GitHub API)
- Developed an interactive dashboard visualising commit heatmaps and repository statistics.
- Handled OAuth authentication and asynchronous REST API consumption.`,
    jobDescription: TARGET_ROLE_DESCRIPTIONS["Frontend Developer"],
    report: {
      id: "report-alex-chen",
      studentName: "Alex Chen",
      githubUsername: "alex-chen-dev",
      githubAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      targetRole: "Frontend Developer",
      jobDescriptionSnippet: "Junior to Mid-Level Frontend Developer specializing in React, responsive CSS, component testing, and containerized deployments.",
      matchScore: 69, // (5.5 earned / 8 required) * 100 = 68.75% -> 69%
      totalRequiredSkills: 8,
      earnedPoints: 5.5,
      encouragingSummary: "You have strong, undeniable evidence in React, JavaScript, and Git across multiple public repositories. Strengthening your Docker, automated testing, and TypeScript evidence will elevate your portfolio to a top-tier candidate level.",
      topLearningGaps: [
        {
          skill: "Docker",
          impact: "Modern frontend teams expect reproducible development and containerized staging environments.",
          recommendation: "Containerize your TaskFlow React project with a production multi-stage Dockerfile and push it to GitHub.",
          priority: "High",
        },
        {
          skill: "Automated Testing (Vitest / Jest)",
          impact: "Testing proves your code will not regress when features scale, which distinguishes mature junior developers.",
          recommendation: "Add 3-5 unit and component tests for core TaskFlow UI components using Vitest and React Testing Library.",
          priority: "High",
        },
        {
          skill: "TypeScript",
          impact: "TypeScript is standard in modern frontend codebases for type safety and maintainability.",
          recommendation: "Convert your TaskFlow helper utilities and component prop interfaces from JS to TS.",
          priority: "Medium",
        },
      ],
      skills: [
        {
          id: "skill-react",
          skillName: "React",
          status: "Proven",
          evidenceStrength: 95,
          explanation: "High-quality, recent evidence across 3 active repositories featuring hooks, context, custom components, and clean component architecture.",
          evidenceChips: [
            "Repository: taskflow-app",
            "src/components/TaskBoard.jsx",
            "README explains React hooks & architecture",
            "18+ React commits in past 60 days",
            "Live on Vercel",
          ],
          proofs: [
            {
              id: "p1",
              type: "repo",
              label: "GitHub Repository: taskflow-app",
              detail: "Public React 18 Kanban board with custom hooks and context providers.",
              url: "https://github.com/alex-chen-dev/taskflow-app",
              repoName: "taskflow-app",
            },
            {
              id: "p2",
              type: "code_file",
              label: "Component Source: TaskBoard.jsx",
              detail: "Demonstrates useState, useEffect, and custom drag-and-drop state management.",
              filePath: "src/components/TaskBoard.jsx",
              codeSnippet: `export const TaskBoard = ({ columns, onTaskMove }) => {
  const [activeTask, setActiveTask] = useState(null);
  // Real-time optimistic update handler
  const handleDrop = (colId) => {
    onTaskMove(activeTask.id, colId);
  };
  return <div className="grid grid-cols-3 gap-4">{/* Columns */}</div>;
};`,
            },
            {
              id: "p3",
              type: "deployment",
              label: "Production Deployment",
              detail: "Active live link verified at https://taskflow-demo.vercel.app",
              url: "https://taskflow-demo.vercel.app",
            },
          ],
          category: "Frontend",
        },
        {
          id: "skill-js",
          skillName: "JavaScript (ES6+)",
          status: "Proven",
          evidenceStrength: 92,
          explanation: "Consistent modern JavaScript throughout 4 repositories with async/await, array pipelines, object destructuring, and closures.",
          evidenceChips: [
            "Repository: devpulse-tracker",
            "src/lib/githubApi.js",
            "README documentation of API client",
            "ES6+ module syntax throughout",
          ],
          proofs: [
            {
              id: "p4",
              type: "code_file",
              label: "API Client: githubApi.js",
              detail: "Clean asynchronous fetch pipeline with error boundary wrapping and caching.",
              filePath: "src/lib/githubApi.js",
              codeSnippet: `export async function fetchUserHeatmap(username) {
  const res = await fetch(\`https://api.github.com/users/\${username}/events\`);
  if (!res.ok) throw new Error("GitHub rate limit reached");
  const events = await res.json();
  return events.reduce((acc, evt) => {
    const day = evt.created_at.slice(0, 10);
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
}`,
            },
          ],
          category: "Core Languages",
        },
        {
          id: "skill-git",
          skillName: "Git & GitHub",
          status: "Proven",
          evidenceStrength: 88,
          explanation: "Active GitHub profile with 142 commits in the past year, feature branches, descriptive commit messages, and clean pull request merges.",
          evidenceChips: [
            "142 public contributions",
            "Clear commit conventions ('feat:', 'fix:')",
            "Meaningful README in every repository",
            "Multi-branch development history",
          ],
          proofs: [
            {
              id: "p5",
              type: "commit",
              label: "Recent Commit History",
              detail: "feat(board): add optimistic task repositioning with undo toast",
              commitHash: "9a2f7c1",
            },
          ],
          category: "Tools",
        },
        {
          id: "skill-tailwind",
          skillName: "Tailwind CSS",
          status: "Proven",
          evidenceStrength: 90,
          explanation: "Deep usage of utility-first CSS, responsive breakpoints, dark mode class toggles, and customized Tailwind color palettes.",
          evidenceChips: [
            "tailwind.config.js configured",
            "Dark theme toggle implemented",
            "Responsive layout across mobile/tablet/desktop",
          ],
          proofs: [
            {
              id: "p6",
              type: "code_file",
              label: "Design Tokens & Styles",
              detail: "Clean configuration of brand colors, typography scales, and plugins.",
              filePath: "tailwind.config.js",
            },
          ],
          category: "Frontend",
        },
        {
          id: "skill-typescript",
          skillName: "TypeScript",
          status: "Partial",
          evidenceStrength: 45,
          explanation: "TypeScript is listed on your resume and tsconfig.json exists in devpulse-tracker, but most components still use .jsx without full type definitions.",
          evidenceChips: [
            "Repository: devpulse-tracker",
            "tsconfig.json present",
            "Only 2 of 14 files typed with .tsx",
            "Missing interface definitions for API responses",
          ],
          proofs: [
            {
              id: "p7",
              type: "code_file",
              label: "Partial Types: src/types.ts",
              detail: "Basic interface defined, but component props are not yet strictly typed.",
              filePath: "src/types.ts",
            },
          ],
          category: "Frontend",
        },
        {
          id: "skill-docker",
          skillName: "Docker",
          status: "Claimed-only",
          evidenceStrength: 10,
          explanation: "Claimed in resume under 'Developer Tools', but no Dockerfile, docker-compose.yml, or container configuration exists in any public repository.",
          evidenceChips: [
            "No Dockerfile detected",
            "No docker-compose.yml found",
            "0 Docker container references in README files",
          ],
          proofs: [],
          category: "DevOps & Cloud",
        },
        {
          id: "skill-testing",
          skillName: "Automated Testing (Vitest/Jest)",
          status: "Claimed-only",
          evidenceStrength: 5,
          explanation: "Mentioned in resume coursework, but no __tests__ folder, test files (*.test.js), or test runner scripts found in package.json.",
          evidenceChips: [
            "No test suite found",
            "Missing 'npm test' script",
            "0 test assertions in project repositories",
          ],
          proofs: [],
          category: "Testing & Quality",
        },
        {
          id: "skill-html-css",
          skillName: "HTML5 & Web Accessibility",
          status: "Proven",
          evidenceStrength: 85,
          explanation: "Semantic markup found in JSX with aria-labels, button roles, and accessible form inputs.",
          evidenceChips: [
            "Semantic HTML tags used",
            "Form labels properly bound",
            "Passes basic lighthouse accessibility audits",
          ],
          proofs: [],
          category: "Frontend",
        },
      ],
      comparisonTable: [
        {
          requiredSkill: "React",
          studentStatus: "Proven",
          evidenceFound: "Verified across 3 repos (taskflow-app, devpulse-tracker). Component hooks, context, state management.",
          recommendedAction: "Maintain momentum. Consider adding a small custom hook unit test to reinforce reliability.",
          points: 1.0,
        },
        {
          requiredSkill: "JavaScript (ES6+)",
          studentStatus: "Proven",
          evidenceFound: "Modern async/await API consumption, array methods, and clean modular code in githubApi.js.",
          recommendedAction: "Solid foundation. Ready for live coding and code review discussions.",
          points: 1.0,
        },
        {
          requiredSkill: "HTML5 & Tailwind CSS",
          studentStatus: "Proven",
          evidenceFound: "Responsive layouts, mobile-first design, dark mode theme switcher implemented cleanly.",
          recommendedAction: "Ready. Ensure accessibility attributes (aria-labels) remain consistent.",
          points: 1.0,
        },
        {
          requiredSkill: "Git & Version Control",
          studentStatus: "Proven",
          evidenceFound: "142+ commits with conventional prefixing ('feat:', 'fix:'), feature branches, and active PRs.",
          recommendedAction: "Excellent practice. Keep commit messages descriptive.",
          points: 1.0,
        },
        {
          requiredSkill: "TypeScript",
          studentStatus: "Partial",
          evidenceFound: "tsconfig.json initialized, but only ~15% of codebase is typed with strict definitions.",
          recommendedAction: "Complete the 30-min micro-task: migrate 2 core components from .jsx to .tsx with prop interfaces.",
          points: 0.5,
        },
        {
          requiredSkill: "Automated Testing (Vitest/Jest)",
          studentStatus: "Claimed-only",
          evidenceFound: "No test files or test scripts found in any repository. Listed in resume coursework only.",
          recommendedAction: "Complete the 25-min micro-task: install Vitest and write 3 tests for TaskBoard state transitions.",
          points: 0.0,
        },
        {
          requiredSkill: "Docker Containerization",
          studentStatus: "Claimed-only",
          evidenceFound: "No Dockerfile or container configuration found across public GitHub repositories.",
          recommendedAction: "Complete the 30-min micro-task: write a multi-stage Dockerfile for taskflow-app and push to GitHub.",
          points: 0.0,
        },
        {
          requiredSkill: "CI/CD & Cloud Deployment",
          studentStatus: "Proven",
          evidenceFound: "Live Vercel deployments linked directly from GitHub READMEs with automated preview builds.",
          recommendedAction: "Strong evidence. Mention deployment automation in mentor reviews.",
          points: 1.0,
        },
      ],
      microTasks: [
        {
          id: "task-docker-1",
          skill: "Docker",
          title: "Containerize Your Existing React Project",
          estimatedMinutes: 30,
          whyItMatters: "Hiring managers and mentors look for candidates who understand how modern apps are built, packaged, and run reliably in cloud environments.",
          whatToBuild: "Create a production-grade multi-stage Dockerfile and .dockerignore for taskflow-app that builds the static assets with Node.js and serves them using lightweight Nginx.",
          stepByStep: [
            "In your local taskflow-app repository, create a new file named `Dockerfile`.",
            "Define Stage 1 (build environment): use `node:20-alpine`, copy package.json, run `npm install`, and execute `npm run build`.",
            "Define Stage 2 (production server): use `nginx:alpine`, copy built `/dist` assets to `/usr/share/nginx/html`, and expose port 80.",
            "Add a `.dockerignore` file containing `node_modules`, `.git`, and `dist`.",
            "Test locally by running `docker build -t taskflow .` and verify on `localhost:8080`.",
            "Commit and push `Dockerfile` and `.dockerignore` to your GitHub repository with commit message `feat(docker): add production multi-stage container build`.",
          ],
          expectedDeliverable: "Committed `Dockerfile` in root of taskflow-app repository with container run instructions added to README.",
          checklist: [
            { id: "c1", text: "Create multi-stage Dockerfile with Node build and Nginx serve", completed: false },
            { id: "c2", text: "Create .dockerignore excluding node_modules and dist", completed: false },
            { id: "c3", text: "Add 'Run with Docker' command instructions in README.md", completed: false },
            { id: "c4", text: "Push changes to GitHub on main branch", completed: false },
          ],
          isCompleted: false,
          repoNameTarget: "taskflow-app",
        },
        {
          id: "task-testing-1",
          skill: "Automated Testing",
          title: "Add Unit & Component Tests with Vitest",
          estimatedMinutes: 25,
          whyItMatters: "Proving you can write unit tests shows you write resilient, defensive code that won't break in production when other engineers touch it.",
          whatToBuild: "Install Vitest and React Testing Library, then create a test suite verifying that a TaskCard renders task title, priority badge, and handles clicks.",
          stepByStep: [
            "Install testing dependencies: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`.",
            "Add `\"test\": \"vitest run\"` to your `package.json` scripts.",
            "Create `src/components/__tests__/TaskCard.test.jsx`.",
            "Write Test 1: renders task title and tag correctly.",
            "Write Test 2: fires onClick callback when the card is selected.",
            "Run `npm test` locally to ensure green passing checks.",
            "Push the `__tests__` directory and updated package.json to GitHub with commit message `test: add Vitest component test suite for TaskCard`.",
          ],
          expectedDeliverable: "Passing test suite committed under `src/components/__tests__/` and test script configured in package.json.",
          checklist: [
            { id: "c5", text: "Install Vitest and React Testing Library", completed: false },
            { id: "c6", text: "Write 2 component unit tests with assertions", completed: false },
            { id: "c7", text: "Verify npm test passes locally with 100% green", completed: false },
            { id: "c8", text: "Push test suite to GitHub", completed: false },
          ],
          isCompleted: false,
          repoNameTarget: "taskflow-app",
        },
        {
          id: "task-ts-1",
          skill: "TypeScript",
          title: "Migrate 2 Core Components to Strict TypeScript",
          estimatedMinutes: 35,
          whyItMatters: "TypeScript is the single most requested skill on frontend job descriptions. Demonstrating strict interface typing moves your status from Partial to Proven.",
          whatToBuild: "Rename `TaskCard.jsx` and `Column.jsx` to `.tsx`, define explicit `interface TaskProps` and `interface ColumnProps`, and eliminate all implicit 'any' types.",
          stepByStep: [
            "Create `src/types/task.ts` and define `interface Task { id: string; title: string; status: 'todo' | 'in_progress' | 'done'; priority: 'low' | 'medium' | 'high'; }`.",
            "Rename `src/components/TaskCard.jsx` to `src/components/TaskCard.tsx`.",
            "Add type annotations to component props: `export const TaskCard: React.FC<{ task: Task; onSelect: (id: string) => void }> = ...`.",
            "Verify TypeScript compiler passes with `npx tsc --noEmit` without errors.",
            "Commit and push the typed components to GitHub with commit message `refactor(types): migrate TaskCard and Column to TypeScript`.",
          ],
          expectedDeliverable: "Committed `.tsx` component files with explicit interfaces and 0 TypeScript compilation errors.",
          checklist: [
            { id: "c9", text: "Define Task and Column interfaces in src/types/task.ts", completed: false },
            { id: "c10", text: "Convert TaskCard.jsx to TaskCard.tsx with strict props typing", completed: false },
            { id: "c11", text: "Verify tsc --noEmit passes cleanly", completed: false },
            { id: "c12", text: "Push typed files to GitHub", completed: false },
          ],
          isCompleted: false,
          repoNameTarget: "taskflow-app",
        },
      ],
      createdAt: Date.now() - 3600000,
      resumeFileName: "Alex_Chen_Resume.pdf",
    },
  },
  {
    id: "backend-priya",
    name: "Priya Sharma",
    role: "Backend Developer",
    githubUsername: "priya-backend-eng",
    description: "CS Graduate passionate about distributed systems, microservices, and high-throughput SQL databases.",
    resumeSnippet: `PRIYA SHARMA
Austin, TX | priya.sharma@example.edu | github.com/priya-backend-eng

EDUCATION
B.S. in Computer Engineering, University of Texas at Austin | Dec 2025

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, SQL (PostgreSQL, MySQL), Go (Basic)
Backend & APIs: Node.js, Express, REST APIs, GraphQL, Redis, JWT
Databases & Cloud: PostgreSQL, Prisma ORM, Docker, AWS (S3, EC2), GitHub Actions
Testing: Jest, Supertest, PyTest

PROJECTS
OrderMesh - Microservices Order Processing API (Node.js, Express, PostgreSQL)
- Designed an order fulfillment REST API handling 500+ requests/sec with transaction isolation.
- Implemented JWT authentication and role-based access control.
- Wrote integration tests with Jest and Supertest achieving 85% line coverage.`,
    jobDescription: TARGET_ROLE_DESCRIPTIONS["Backend Developer"],
    report: {
      id: "report-priya-sharma",
      studentName: "Priya Sharma",
      githubUsername: "priya-backend-eng",
      githubAvatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      targetRole: "Backend Developer",
      jobDescriptionSnippet: "Backend Engineer building scalable APIs, managing relational schemas, and containerizing services.",
      matchScore: 75,
      totalRequiredSkills: 8,
      earnedPoints: 6.0,
      encouragingSummary: "Exceptional evidence in Node.js, Express, SQL modeling, and API integration testing. Adding Redis caching and a containerized Docker Compose deployment will finalize your backend portfolio proof.",
      topLearningGaps: [
        {
          skill: "Docker & Container Orchestration",
          impact: "Backend services require containerization for continuous deployment and environment parity.",
          recommendation: "Create a docker-compose.yml running both your Node backend and a PostgreSQL database container.",
          priority: "High",
        },
        {
          skill: "Redis Caching",
          impact: "Caching separates entry-level API builders from high-performance backend engineers.",
          recommendation: "Add a Redis caching layer for hot product endpoints in OrderMesh with a 60-second TTL.",
          priority: "Medium",
        },
        {
          skill: "GitHub Actions CI/CD",
          impact: "Automated pipelines prove you write software that can be continuously integrated in team settings.",
          recommendation: "Write a `.github/workflows/test.yml` that runs your Jest tests on every push.",
          priority: "Medium",
        },
      ],
      skills: [
        {
          id: "skill-nodejs",
          skillName: "Node.js & Express",
          status: "Proven",
          evidenceStrength: 95,
          explanation: "Production-style REST controllers, middleware pipelines, error handling, and environment config in ordermesh-api.",
          evidenceChips: ["Repository: ordermesh-api", "src/server.js", "Custom middleware implemented", "35+ backend commits"],
          proofs: [],
          category: "Backend",
        },
        {
          id: "skill-sql",
          skillName: "SQL & PostgreSQL",
          status: "Proven",
          evidenceStrength: 92,
          explanation: "Complex SQL schema migrations, foreign keys, index optimization, and parameterized queries.",
          evidenceChips: ["Repository: ordermesh-api", "schema.sql with constraints", "Prisma migrations tracked"],
          proofs: [],
          category: "Data & Database",
        },
        {
          id: "skill-testing-backend",
          skillName: "API Testing (Jest & Supertest)",
          status: "Proven",
          evidenceStrength: 88,
          explanation: "18 integration tests running against test database verifying 200, 400, and 401 HTTP response codes.",
          evidenceChips: ["tests/orders.test.js", "Supertest assertions", "85% line coverage reported"],
          proofs: [],
          category: "Testing & Quality",
        },
        {
          id: "skill-docker-backend",
          skillName: "Docker",
          status: "Partial",
          evidenceStrength: 40,
          explanation: "Dockerfile exists in repository, but lacks multi-stage caching and docker-compose.yml is missing.",
          evidenceChips: ["Basic Dockerfile found", "No compose file for database", "Untested build command"],
          proofs: [],
          category: "DevOps & Cloud",
        },
        {
          id: "skill-redis",
          skillName: "Redis Caching",
          status: "Claimed-only",
          evidenceStrength: 10,
          explanation: "Mentioned on resume, but no ioredis/redis client initialization or cache keys found in repository.",
          evidenceChips: ["No Redis connection code", "Missing cache invalidate logic"],
          proofs: [],
          category: "Backend",
        },
      ],
      comparisonTable: [
        {
          requiredSkill: "Node.js & Express",
          studentStatus: "Proven",
          evidenceFound: "Complete REST API architecture with clean routers and error middleware in ordermesh-api.",
          recommendedAction: "Strong proof. Ready for technical architectural interviews.",
          points: 1.0,
        },
        {
          requiredSkill: "SQL (PostgreSQL/MySQL)",
          studentStatus: "Proven",
          evidenceFound: "Documented relational schemas with foreign key integrity and indexed search queries.",
          recommendedAction: "Solid foundation. Be prepared to explain ACID transaction isolation levels.",
          points: 1.0,
        },
        {
          requiredSkill: "API Testing",
          studentStatus: "Proven",
          evidenceFound: "Comprehensive Supertest suite covering happy paths and HTTP error responses.",
          recommendedAction: "Great evidence. Highlight your test coverage in portfolio walk-throughs.",
          points: 1.0,
        },
        {
          requiredSkill: "Docker & Containerization",
          studentStatus: "Partial",
          evidenceFound: "Single Dockerfile present, but no local containerized database workflow.",
          recommendedAction: "Complete the 30-min micro-task: add docker-compose.yml running Node + Postgres.",
          points: 0.5,
        },
        {
          requiredSkill: "Redis In-Memory Caching",
          studentStatus: "Claimed-only",
          evidenceFound: "No Redis client setup or cache middleware found in codebase.",
          recommendedAction: "Complete the 25-min micro-task: add Redis middleware for GET /orders.",
          points: 0.0,
        },
      ],
      microTasks: [
        {
          id: "task-compose-1",
          skill: "Docker",
          title: "Orchestrate API & Postgres with Docker Compose",
          estimatedMinutes: 30,
          whyItMatters: "Enables any reviewer or teammate to clone your repo and run your full database-backed API with a single command.",
          whatToBuild: "Create a docker-compose.yml spinning up both your Node.js API service and a PostgreSQL 15 container with persistent volume mounts.",
          stepByStep: [
            "Create `docker-compose.yml` in repository root.",
            "Configure `db` service using `postgres:15-alpine` with healthcheck.",
            "Configure `api` service depending on `db` and passing environment variables.",
            "Test with `docker compose up --build` and verify endpoint connection.",
            "Commit and push `docker-compose.yml` to GitHub.",
          ],
          expectedDeliverable: "Working docker-compose.yml with setup instructions in README.",
          checklist: [
            { id: "c20", text: "Create docker-compose.yml with api and db services", completed: false },
            { id: "c21", text: "Verify container database connection with healthcheck", completed: false },
            { id: "c22", text: "Update README with 'Quickstart with Docker Compose'", completed: false },
          ],
          isCompleted: false,
          repoNameTarget: "ordermesh-api",
        },
      ],
      createdAt: Date.now() - 7200000,
      resumeFileName: "Priya_Sharma_Resume.pdf",
    },
  },
];
