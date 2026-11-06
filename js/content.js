/* ==========================================================================
   PORTFOLIO CONTENT — edit this file only; the site rebuilds itself from it.
   Source: Dinesh_Sarikonda_Resume (Nov 2026).
   ========================================================================== */
window.PORTFOLIO = {
  name: { first: "Dinesh", last: "Sarikonda" },
  fullName: "Dinesh Revanth Sarikonda",
  role: "Senior .NET Full Stack Developer",
  location: "United States — Open to opportunities",

  // Scene 1 — the line beside the close-up. Wrap words in *stars* to tint them ember.
  heroLine: "Twelve years of building systems that *never miss.*",

  // Scene 2 — intro under the name
  intro: "I design, build and modernize cloud-native enterprise platforms — from C# microservices to React and Angular front ends — across finance, healthcare, telecom and retail.",

  // Scene 3 — "Who I am"
  about: "I'm a full stack engineer who lives where architecture meets delivery. I take workflows that eat people's days — reconciliations, claims, document processing — and turn them into resilient, AI-assisted services on Azure, AWS and GCP. Clean Architecture, DDD and CQRS on the back end; fast, reusable UI on the front; and pipelines that ship it safely.",

  // Scene 4 — motto + three numbers
  motto: "Precision.<br>Patience.<br>Execution.",
  stats: [
    { value: 12, suffix: "+", label: "Years shipping" },
    { value: 6,  suffix: "",  label: "Enterprise clients" },
    { value: 3,  suffix: "",  label: "Cloud certifications" }
  ],

  contactBlurb: "Hiring for a senior .NET or full stack role, or need a platform modernized? Send a transmission — I usually reply within a day.",
  email: "Dinesh.work009@gmail.com",

  // Optional: paste a Formspree / Getform endpoint to receive messages directly.
  // Left empty, the form opens the visitor's email app with the message pre-filled.
  formEndpoint: "",

  links: [
    { label: "Email",    handle: "Dinesh.work009@gmail.com",   url: "mailto:Dinesh.work009@gmail.com" },
    { label: "LinkedIn", handle: "/in/dineshsarikonda",         url: "https://www.linkedin.com/in/dineshsarikonda" },
    { label: "Phone",    handle: "615-413-7172",                url: "tel:+16154137172" }
  ],

  /* ---------------------------------------------------------------------
     The five blades. Order here = order they fly at the visitor.
     --------------------------------------------------------------------- */
  sections: {
    experience: {
      title: "Experience",
      teaser: "Twelve years across finance, healthcare and banking.",
      cta: "View my experience",
      lede: "Six enterprise engagements, from transaction engines to AI-driven workflow platforms.",
      items: [
        {
          role: "Senior .NET Full Stack Developer",
          company: "Vialto Partners",
          where: "Workflow automation · AI",
          when: "Jan 2026 — Present",
          points: [
            "Spearheaded an intelligent workflow automation platform on .NET 8, ASP.NET Core and Orkes Conductor — cutting manual effort by 70% and case processing time by 60%.",
            "Built AI-enabled orchestration and document pipelines combining OCR, Generative AI and resilient .NET Worker Services.",
            "Shipped cloud-native services on Azure, AKS, Azure OpenAI, MongoDB and Redis — 30% lower operating cost while supporting 2× transaction volume.",
            "Delivered React 19 / Next.js front ends with API routes centralizing auth and microservice calls."
          ],
          tags: [".NET 8", "Orkes Conductor", "Azure OpenAI", "AKS", "React 19", "Next.js", "Kafka"]
        },
        {
          role: "Senior .NET Full Stack Developer",
          company: "Betterment",
          where: "New York, NY · Wealth management",
          when: "Nov 2024 — Jan 2026",
          points: [
            "Led epics for transaction matching, settlement reconciliation and ledger balancing across multiple custodians.",
            "Architected DDD + CQRS microservices for portfolio management, asset allocation and risk analysis on ASP.NET Core 7.",
            "Built ML.NET and Azure Cognitive Services anomaly detection to flag suspicious transactions and risk thresholds.",
            "Tuned EF Core 7 / Azure SQL for 20M+ record multi-tenant datasets; Redis caching cut lookup latency by 40%."
          ],
          tags: ["C# 11", "ASP.NET Core 7", "Angular 15", "NgRx", "Azure Service Bus", "Terraform"]
        },
        {
          role: "Senior .NET Full Stack Developer",
          company: "State of NY — Financial Services",
          where: "New York, NY · Public finance",
          when: "Aug 2020 — Oct 2024",
          points: [
            "Modernized legacy accounting and treasury applications onto .NET 5 and ASP.NET Core microservices.",
            "Built ML.NET and Azure ML revenue forecasting and anomaly detection for audit and compliance.",
            "Delivered Angular 12 dashboards for fund disbursements, revenue metrics and budget analytics.",
            "Held 85%+ automated test coverage and lifted code quality by 25% through SonarQube and review standards."
          ],
          tags: ["C# 10", ".NET 5", "Angular 12", "SQL Server 2019", "ActiveMQ", "AKS"]
        },
        {
          role: ".NET Full Stack Developer",
          company: "HCA Healthcare",
          where: "Nashville, TN · Healthcare",
          when: "May 2018 — Jul 2020",
          points: [
            "Built ASP.NET Core MVC applications serving 10,000+ daily users across patient services, billing and finance.",
            "Streamed EHR events, notifications and audit trails through Apache Kafka.",
            "Automated document classification with AWS Comprehend, Rekognition and OCR, under HIPAA-compliant S3 storage."
          ],
          tags: ["ASP.NET Core MVC", "React", "PostgreSQL", "Kafka", "AWS Lambda", "API Gateway"]
        },
        {
          role: ".NET Developer",
          company: "Santander Bank",
          where: "Boston, MA · Banking",
          when: "Sep 2015 — Apr 2018",
          points: [
            "Developed ASP.NET Web API 2 / MVC 5 services for enterprise banking applications.",
            "Integrated AWS Cognito for centralized authentication and RBAC; bridged .NET and Java systems via Spring Cloud.",
            "Containerized services onto OpenShift with ELK observability and RabbitMQ messaging."
          ],
          tags: ["ASP.NET MVC 5", "Web API 2", "MySQL", "Ember.js", "RabbitMQ", "OpenShift"]
        },
        {
          role: ".NET Developer",
          company: "Discover Financial",
          where: "Riverwoods, IL · Payments",
          when: "Jan 2013 — Aug 2015",
          points: [
            "Built ASP.NET MVC 4 / Web API modules for high-volume transaction processing and real-time data services.",
            "Designed SQL Server 2012 schemas, stored procedures and indexes for transactional performance.",
            "Wired event-driven integrations with Apache ServiceMix and ActiveMQ."
          ],
          tags: ["C# 4.0", "ASP.NET MVC 4", "SQL Server", "jQuery", "ActiveMQ", "Jenkins"]
        }
      ]
    },

    projects: {
      title: "Projects",
      teaser: "Case studies from the platforms I've built.",
      cta: "View my projects",
      lede: "Selected platforms, the problem each one solved and the measurable result.",
      items: [
        { name: "Intelligent Workflow Engine", client: "Vialto Partners", metric: "−70% manual effort",
          desc: "Questionnaire processing, workflow orchestration and document generation automated end-to-end with Orkes Conductor, OCR and Generative AI — case processing 60% faster.",
          tags: [".NET 8", "Orkes Conductor", "Azure OpenAI", "Worker Services"] },
        { name: "Reconciliation & Risk Platform", client: "Betterment", metric: "−40% lookup latency",
          desc: "DDD/CQRS services for settlement reconciliation and ledger balancing, with ML.NET anomaly detection over 20M+ financial records.",
          tags: ["ASP.NET Core 7", "CQRS", "ML.NET", "Redis"] },
        { name: "Treasury Modernization", client: "State of NY", metric: "85%+ test coverage",
          desc: "Legacy accounting and treasury systems migrated to .NET 5 microservices, with revenue forecasting and real-time budget dashboards.",
          tags: [".NET 5", "Angular 12", "Azure ML", "AKS"] },
        { name: "Claims & Document AI", client: "HCA Healthcare", metric: "10k+ daily users",
          desc: "Real-time claims processing and billing validation, plus AI document classification on HIPAA-compliant AWS infrastructure.",
          tags: ["ASP.NET Core", "Kafka", "AWS Comprehend", "React"] }
      ]
    },

    skills: {
      title: "Arsenal",
      teaser: "The languages, clouds and patterns I carry.",
      cta: "Inspect the arsenal",
      lede: "Every blade has a purpose. These are mine.",
      groups: [
        { name: "Backend",       items: ["C# 6–12", "ASP.NET Core 2.2–8", "ASP.NET MVC / Web API", "Entity Framework Core", "LINQ · ADO.NET"] },
        { name: "Frontend",      items: ["React 19 · Next.js", "Angular 12–15", "TypeScript", "Blazor", "RxJS · NgRx"] },
        { name: "Cloud",         items: ["Azure · AKS · APIM", "AWS · Lambda · EKS", "GCP · Cloud Run", "Docker · Kubernetes", "Terraform · Helm"] },
        { name: "Architecture",  items: ["Microservices", "DDD · CQRS", "Clean / Onion", "Event-driven", "SOLID"] },
        { name: "Data",          items: ["SQL Server", "PostgreSQL", "MongoDB · CosmosDB", "Redis", "Cassandra"] },
        { name: "AI",            items: ["Azure OpenAI", "ML.NET", "Agentic workflows", "Cognitive Services", "AWS Comprehend"] },
        { name: "Messaging",     items: ["Apache Kafka", "Azure Service Bus", "RabbitMQ", "ActiveMQ"] },
        { name: "DevOps & Quality", items: ["Azure DevOps", "GitHub Actions · GitLab CI", "SonarQube", "xUnit · Jest · Playwright", "OpenTelemetry · Splunk"] }
      ]
    },

    education: {
      title: "Education",
      teaser: "Degree and cloud certifications.",
      cta: "View my education",
      lede: "The foundation, and the credentials earned on top of it.",
      degrees: [
        {
          degree: "Bachelor in Computer Science and Engineering",
          school: "",
          where: "",
          when: "May 2010",
          points: []
        }
      ],
      certifications: [
        { name: "Azure Solutions Architect Expert", issuer: "Microsoft Certified", when: "Expert", url: "" },
        { name: "AWS Certified AI Practitioner",    issuer: "Amazon Web Services", when: "Foundational", url: "" },
        { name: "Cloud Solution Architect",          issuer: "Google Cloud (GCP)",  when: "Professional", url: "" }
      ]
    },

    writing: {
      title: "Writing",
      teaser: "Notes on .NET, cloud architecture and AI workflows.",
      cta: "Read my writing",
      lede: "Field notes from twelve years of enterprise engineering.",
      // Add articles here: { title: "...", when: "Oct 2026", where: "Medium", url: "https://..." }
      posts: [],
      // Link to your newsletter's subscribe page (Substack, Beehiiv, LinkedIn newsletter…). Leave empty to hide the button.
      subscribeUrl: ""
    }
  }
};
