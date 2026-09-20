/**
 * Realistic Sample Documents for Instant Evaluation & Demo
 */

export const SAMPLE_VIVA_SYLLABUS = `COURSE CODE & TITLE: CS402 - DISTRIBUTED SYSTEMS & OPERATING SYSTEMS
DEPARTMENT: Computer Science and Engineering | Credit Hours: 4

UNIT 1: PROCESS CONCURRENCY & SYNCHRONIZATION
- Threads, Process State Transitions, Context Switching Overhead
- Classical IPC Synchronization Problems: Producer-Consumer, Readers-Writers, Dining Philosophers
- Mutexes, Counting Semaphores, Spinlocks, Futexes
- Deadlock characterization (Coffman conditions), Deadlock Prevention, Banker's Algorithm for Deadlock Avoidance, Detection and Recovery

UNIT 2: MEMORY MANAGEMENT & VIRTUAL MEMORY ARCHITECTURES
- Memory hierarchy, Address translation, Page Tables, Inverted Page Tables, Multi-level Paging
- Translation Lookaside Buffer (TLB) hit vs miss penalties, TLB shootdown in multicore systems
- Page Fault handling lifecycle, Demand Paging, Thrashing and Working Set Model
- Page Replacement Algorithms: FIFO, Optimal (Belady's anomaly), Least Recently Used (LRU), Clock Algorithm

UNIT 3: DISTRIBUTED SYSTEMS & CONSENSUS PROTOCOLS
- Models of distributed computation, Synchronous vs Asynchronous networks, Failure models (Crash-stop, Crash-recovery, Byzantine)
- Logical Time: Lamport timestamps, Vector clocks, Causality tracking
- Consensus algorithms: Paxos vs Raft (Leader election, Log replication, Safety invariants)
- Distributed Transactions: Two-Phase Commit (2PC) protocol, Three-Phase Commit, Sagas
- CAP Theorem (Consistency, Availability, Partition Tolerance), PACELC theorem, Eventual consistency and conflict resolution

UNIT 4: STORAGE ENGINES & FILE SYSTEMS
- Unix Inode architecture, journaling file systems, Write-Ahead Logging (WAL)
- Storage engines: Log-Structured Merge (LSM) Trees vs B+ Trees (Write amplification vs Read latency trade-offs)
- Distributed file systems: Architecture of Google File System (GFS) and HDFS
- Quorum-based replication, Consistent Hashing in Dynamo-style distributed key-value stores

UNIT 5: INTER-PROCESS COMMUNICATION & MICROSERVICES
- RPC mechanisms: Protocol Buffers, gRPC, HTTP/2 streaming
- REST architectural constraints vs GraphQL vs WebSocket real-time channels
- Service discovery, Circuit breakers, Load balancing algorithms (Round Robin, Least Connections, Consistent Hash Ring)`;

export const SAMPLE_INTERVIEW_RESUME = `PRIYA SHARMA
Senior Full-Stack & Distributed Systems Engineer
Email: priya.sharma.dev@example.com | Portfolio: priyasharma.tech | GitHub: github.com/priyasharma

PROFESSIONAL SUMMARY
Senior Software Engineer with 5+ years of experience building resilient cloud-native platforms, high-throughput streaming pipelines, and responsive modern web applications. Passionate about system latency optimization, distributed data pipelines, and developer tooling.

PROFESSIONAL WORK EXPERIENCE:

FinWave Technologies — Senior Software Engineer | July 2022 – Present (Bangalore, India)
- Architected and deployed an event-driven financial fraud detection pipeline processing 35,000 transactions/second with sub-35ms p99 latency using Apache Kafka, Go, and Redis clusters.
- Led the architectural migration from a legacy monolithic Express backend to containerized Kubernetes microservices, reducing deployment downtime to zero and cutting cloud compute costs by 26%.
- Designed database partitioning and multi-region read replicas in PostgreSQL, resolving database connection pool bottlenecks during peak festival sale spikes.
- Championed engineering best practices: spearheaded bi-weekly technical architecture design reviews and mentored 5 mid-level engineers in distributed debugging.

NexaBytes Cloud — Software Engineer | August 2020 – June 2022 (Pune, India)
- Developed critical user-facing workflow applications in React, TypeScript, and Tailwind CSS used by 450,000+ daily active users.
- Built a reusable component design system and telemetry monitoring dashboard that boosted frontend performance scores from 62 to 96 on Core Web Vitals.
- Implemented real-time collaboration canvas using WebSockets and conflict-free replicated data types (CRDTs), supporting up to 100 simultaneous room editors without lock contention.
- Integrated automated CI/CD deployment pipelines using GitHub Actions and Docker, accelerating team release cadence from bi-weekly to daily.

KEY PROJECTS:
1. Distributed Rate Limiter & Token Bucket Service (Open Source)
   - High-performance distributed rate limiter built in Go with Redis sliding window logs, handling 100k req/sec with fallback local caching.
2. Real-Time Telemetry & Alerting Broker
   - End-to-end telemetry collector reading Prometheus metrics, streaming via Kafka, and alerting on Slack & PagerDuty upon SLA violation.

TECHNICAL SKILLS:
- Languages: TypeScript, JavaScript, Go, Python, SQL
- Frontend: React, Next.js, Tailwind CSS, Vite, State Management (Zustand, Redux)
- Backend & Cloud: Node.js, Express, Go, Docker, Kubernetes, AWS (ECS, S3, RDS), GCP Cloud Run
- Databases & Messaging: PostgreSQL, Redis, Apache Kafka, MongoDB, DynamoDB
- Core Competencies: Distributed Systems, System Design, REST & gRPC, CI/CD, Observability

EDUCATION:
B.Tech in Computer Science and Engineering | 2016 – 2020
Graduated with First Class Distinction (CGPA: 8.9 / 10)`;
