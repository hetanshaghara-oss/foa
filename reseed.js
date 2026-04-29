// Run: node reseed.js
// This directly connects to MongoDB and reseeds all 25 careers

require('dotenv').config();
const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
  title: String,
  overview: String,
  requiredSkills: [String],
  tools: [String],
  salaryRange: { india: String, global: String },
  demandLevel: String,
  difficultyLevel: String,
});

const seedCareers = [
  { title: "Web Developer", overview: "Designs, builds, and maintains websites and web applications using modern frontend and backend frameworks.", requiredSkills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "REST APIs"], tools: ["VS Code", "Git", "Webpack", "Vite", "Chrome DevTools"], salaryRange: { india: "₹4L - ₹18L", global: "$60K - $130K" }, demandLevel: "Very High", difficultyLevel: "Medium" },
  { title: "Data Scientist", overview: "Analyzes large datasets using statistical models and machine learning to generate actionable business insights.", requiredSkills: ["Python", "SQL", "Machine Learning", "Statistics", "Data Visualization"], tools: ["Jupyter", "TensorFlow", "Pandas", "Scikit-learn", "Tableau"], salaryRange: { india: "₹6L - ₹25L", global: "$85K - $160K" }, demandLevel: "Very High", difficultyLevel: "Hard" },
  { title: "UI/UX Designer", overview: "Creates intuitive, accessible, and visually compelling user interfaces and end-to-end digital experiences.", requiredSkills: ["Wireframing", "Prototyping", "User Research", "Visual Design", "Accessibility"], tools: ["Figma", "Adobe XD", "Maze", "Zeplin", "InVision"], salaryRange: { india: "₹5L - ₹18L", global: "$70K - $140K" }, demandLevel: "High", difficultyLevel: "Medium" },
  { title: "Machine Learning Engineer", overview: "Builds, trains, and deploys production-ready ML models and AI pipelines at scale for real-world applications.", requiredSkills: ["Python", "TensorFlow", "PyTorch", "Mathematics", "MLOps", "Cloud Platforms"], tools: ["Jupyter", "MLflow", "Docker", "AWS SageMaker", "Hugging Face"], salaryRange: { india: "₹10L - ₹35L", global: "$100K - $200K" }, demandLevel: "Very High", difficultyLevel: "Hard" },
  { title: "Cloud Engineer", overview: "Designs and manages cloud infrastructure ensuring scalability, reliability, and cost efficiency across cloud platforms.", requiredSkills: ["AWS/GCP/Azure", "Linux", "Terraform", "Kubernetes", "Networking", "Security"], tools: ["AWS Console", "Terraform", "Kubernetes", "Ansible", "CloudFormation"], salaryRange: { india: "₹8L - ₹28L", global: "$90K - $170K" }, demandLevel: "Very High", difficultyLevel: "Hard" },
  { title: "Mobile Developer", overview: "Builds performant native and cross-platform mobile apps for iOS and Android with polished user experiences.", requiredSkills: ["React Native", "Flutter", "Swift", "Kotlin", "REST APIs", "State Management"], tools: ["Xcode", "Android Studio", "Expo", "Firebase", "App Center"], salaryRange: { india: "₹5L - ₹20L", global: "$75K - $145K" }, demandLevel: "High", difficultyLevel: "Medium" },
  { title: "DevOps Engineer", overview: "Automates CI/CD pipelines and bridges development with operations to ship software faster and more reliably.", requiredSkills: ["Docker", "Kubernetes", "CI/CD", "Linux", "Shell Scripting", "Monitoring"], tools: ["Jenkins", "GitHub Actions", "Terraform", "Prometheus", "Grafana"], salaryRange: { india: "₹7L - ₹25L", global: "$85K - $160K" }, demandLevel: "Very High", difficultyLevel: "Hard" },
  { title: "Cybersecurity Analyst", overview: "Protects organizations from cyber threats through monitoring, penetration testing, and incident response.", requiredSkills: ["Network Security", "Penetration Testing", "SIEM", "Cryptography", "Risk Assessment"], tools: ["Wireshark", "Metasploit", "Nmap", "Burp Suite", "Splunk"], salaryRange: { india: "₹6L - ₹22L", global: "$80K - $155K" }, demandLevel: "Very High", difficultyLevel: "Hard" },
  { title: "Product Manager", overview: "Defines product vision and strategy, translating user needs into shipped features through cross-functional collaboration.", requiredSkills: ["Product Strategy", "Roadmapping", "User Research", "Data Analysis", "Stakeholder Communication"], tools: ["Jira", "Confluence", "Figma", "Mixpanel", "ProductPlan"], salaryRange: { india: "₹8L - ₹30L", global: "$90K - $180K" }, demandLevel: "High", difficultyLevel: "Medium" },
  { title: "Blockchain Developer", overview: "Develops decentralized applications, smart contracts, and DeFi protocols on Ethereum and other blockchains.", requiredSkills: ["Solidity", "Web3.js", "Smart Contracts", "Cryptography", "JavaScript", "Ethereum"], tools: ["Hardhat", "Truffle", "Remix IDE", "MetaMask", "IPFS"], salaryRange: { india: "₹8L - ₹30L", global: "$90K - $180K" }, demandLevel: "Medium", difficultyLevel: "Hard" },
  { title: "Full Stack Developer", overview: "Develops both frontend interfaces and backend systems, owning complete product features from UI to database.", requiredSkills: ["React", "Node.js", "MongoDB", "PostgreSQL", "REST APIs", "TypeScript"], tools: ["VS Code", "Git", "Docker", "Postman", "AWS/Vercel"], salaryRange: { india: "₹6L - ₹22L", global: "$75K - $150K" }, demandLevel: "Very High", difficultyLevel: "Medium" },
  { title: "Data Engineer", overview: "Designs and maintains scalable data pipelines, warehouses, and infrastructure that power analytics platforms.", requiredSkills: ["Python", "SQL", "Apache Spark", "ETL", "Data Warehousing", "Cloud Platforms"], tools: ["Apache Airflow", "dbt", "BigQuery", "Snowflake", "Kafka"], salaryRange: { india: "₹8L - ₹26L", global: "$90K - $160K" }, demandLevel: "Very High", difficultyLevel: "Hard" },
  { title: "Game Developer", overview: "Creates interactive gaming experiences for PC, console, or mobile using game engines and real-time rendering.", requiredSkills: ["C#", "C++", "Game Physics", "3D Math", "Shaders", "Performance Optimization"], tools: ["Unity", "Unreal Engine", "Blender", "Visual Studio", "Perforce"], salaryRange: { india: "₹4L - ₹18L", global: "$60K - $130K" }, demandLevel: "Medium", difficultyLevel: "Hard" },
  { title: "AI / NLP Engineer", overview: "Builds intelligent language systems — chatbots, LLM apps, semantic search, and NLP pipelines.", requiredSkills: ["Python", "NLP", "Large Language Models", "Transformers", "Prompt Engineering", "LangChain"], tools: ["Hugging Face", "OpenAI API", "LangChain", "spaCy", "FAISS"], salaryRange: { india: "₹12L - ₹40L", global: "$110K - $220K" }, demandLevel: "Very High", difficultyLevel: "Hard" },
  { title: "Backend Developer", overview: "Builds the server-side logic, databases, and APIs powering web and mobile applications.", requiredSkills: ["Node.js / Python / Java", "REST APIs", "SQL/NoSQL", "Authentication", "Microservices"], tools: ["Express", "FastAPI", "PostgreSQL", "Redis", "Docker"], salaryRange: { india: "₹5L - ₹20L", global: "$70K - $140K" }, demandLevel: "Very High", difficultyLevel: "Medium" },
  { title: "Embedded Systems Engineer", overview: "Programs microcontrollers and hardware-level software for IoT, robotics, automotive, and real-time systems.", requiredSkills: ["C/C++", "RTOS", "Microcontrollers", "Hardware Protocols", "Assembly", "Debugging"], tools: ["Arduino", "STM32", "Keil MDK", "JTAG Debugger", "Oscilloscope"], salaryRange: { india: "₹5L - ₹18L", global: "$75K - $140K" }, demandLevel: "High", difficultyLevel: "Hard" },
  { title: "QA / Test Engineer", overview: "Ensures software quality through automated and manual testing strategies and continuous quality improvement.", requiredSkills: ["Test Automation", "Selenium", "API Testing", "Performance Testing", "Bug Reporting"], tools: ["Selenium", "Cypress", "Postman", "JMeter", "JIRA"], salaryRange: { india: "₹4L - ₹15L", global: "$60K - $120K" }, demandLevel: "High", difficultyLevel: "Medium" },
  { title: "Site Reliability Engineer (SRE)", overview: "Applies software engineering to operations, building systems for reliability, observability, and incident management.", requiredSkills: ["Linux", "Go/Python", "Kubernetes", "Observability", "Incident Management", "SLOs/SLAs"], tools: ["Prometheus", "Grafana", "PagerDuty", "Datadog", "Kubernetes"], salaryRange: { india: "₹12L - ₹35L", global: "$110K - $190K" }, demandLevel: "Very High", difficultyLevel: "Hard" },
  { title: "AR/VR Developer", overview: "Creates immersive augmented and virtual reality experiences for gaming, training, healthcare, and retail sectors.", requiredSkills: ["Unity / Unreal", "C#", "3D Modeling", "Spatial Computing", "OpenXR", "Shader Programming"], tools: ["Unity XR Toolkit", "ARKit", "ARCore", "Meta Quest SDK", "Blender"], salaryRange: { india: "₹6L - ₹22L", global: "$85K - $160K" }, demandLevel: "Medium", difficultyLevel: "Hard" },
  { title: "Data Analyst", overview: "Transforms raw data into actionable insights through dashboards, SQL queries, and statistical analysis.", requiredSkills: ["SQL", "Excel", "Python", "Data Visualization", "Statistics", "Business Intelligence"], tools: ["Tableau", "Power BI", "Google Sheets", "Looker", "Python/Pandas"], salaryRange: { india: "₹4L - ₹15L", global: "$55K - $100K" }, demandLevel: "Very High", difficultyLevel: "Easy" },
  { title: "Frontend Developer", overview: "Specializes in building pixel-perfect, performant, and accessible user interfaces for modern web apps.", requiredSkills: ["HTML", "CSS", "JavaScript", "React/Vue/Angular", "TypeScript", "Web Performance"], tools: ["VS Code", "Webpack/Vite", "Storybook", "Figma", "Lighthouse"], salaryRange: { india: "₹4L - ₹18L", global: "$65K - $130K" }, demandLevel: "Very High", difficultyLevel: "Medium" },
  { title: "Robotics Engineer", overview: "Designs and programs robotic systems for manufacturing, healthcare, space exploration, and automation.", requiredSkills: ["ROS", "C++", "Computer Vision", "Control Systems", "Kinematics", "Python"], tools: ["ROS/ROS2", "Gazebo Simulator", "MATLAB", "OpenCV", "NVIDIA Jetson"], salaryRange: { india: "₹6L - ₹22L", global: "$80K - $150K" }, demandLevel: "High", difficultyLevel: "Hard" },
  { title: "Digital Marketing Analyst", overview: "Drives online growth through data-driven campaigns across SEO, paid advertising, content, and social media.", requiredSkills: ["SEO/SEM", "Google Analytics", "Paid Advertising", "Content Strategy", "A/B Testing"], tools: ["Google Ads", "Meta Ads Manager", "Semrush", "Google Analytics 4", "HubSpot"], salaryRange: { india: "₹3L - ₹12L", global: "$50K - $100K" }, demandLevel: "High", difficultyLevel: "Easy" },
  { title: "Scrum Master / Agile Coach", overview: "Facilitates agile ceremonies, removes team impediments, and coaches engineering teams to peak delivery performance.", requiredSkills: ["Scrum", "Kanban", "Facilitation", "Agile Coaching", "Risk Management", "Stakeholder Management"], tools: ["Jira", "Confluence", "Miro", "Azure DevOps", "Monday.com"], salaryRange: { india: "₹6L - ₹20L", global: "$85K - $150K" }, demandLevel: "Medium", difficultyLevel: "Easy" },
  { title: "Technical Writer", overview: "Creates clear, accurate technical documentation — API references, developer guides, tutorials, and release notes.", requiredSkills: ["Technical Writing", "API Documentation", "Markdown", "Research", "Developer Empathy"], tools: ["Notion", "Confluence", "Swagger/OpenAPI", "Docusaurus", "GitHub"], salaryRange: { india: "₹4L - ₹14L", global: "$60K - $110K" }, demandLevel: "Medium", difficultyLevel: "Easy" }
];

async function reseed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    const Career = mongoose.model('Career', careerSchema);
    const deleted = await Career.deleteMany({});
    console.log(`🗑️  Deleted ${deleted.deletedCount} existing careers`);

    const inserted = await Career.insertMany(seedCareers);
    console.log(`🌱 Inserted ${inserted.length} careers successfully!`);

    inserted.forEach(c => console.log(`  ✓ ${c.title}`));
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Done! Restart your server and refresh the Explorer page.');
  }
}

reseed();
