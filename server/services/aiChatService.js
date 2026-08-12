/**
 * AI Chatbot Backend Service
 * Dynamically converts live MongoDB / seed data into portfolio context grounding with smart actions.
 */

import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  HeroSettings,
  AboutSettings,
  ResumeSettings,
  Service,
  Skill,
  Experience,
  Project,
  ContactSettings,
  FooterSettings,
  GlobalSettings
} from '../models/schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fallback seed reader if DB is offline/seeding
 */
function getDefaultSeedData() {
  try {
    const seedPath = path.join(__dirname, '../data/defaultSeedData.json');
    if (fs.existsSync(seedPath)) {
      return JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
    }
  } catch (e) {
    console.warn('⚠️ Failed to read defaultSeedData.json fallback:', e.message);
  }
  return {};
}

/**
 * Dynamically aggregates current portfolio data from live MongoDB models or seed file.
 */
export async function getLivePortfolioData() {
  let isDbConnected = mongoose.connection.readyState === 1;

  if (!isDbConnected) {
    try {
      await connectDB();
      isDbConnected = mongoose.connection.readyState === 1;
    } catch (err) {
      console.warn('⚠️ MongoDB connection check in aiChatService:', err.message);
    }
  }

  const seed = getDefaultSeedData();

  let hero = seed.heroSettings || {};
  let about = seed.aboutSettings || {};
  let contact = seed.contactSettings || {};
  let footer = seed.footerSettings || {};
  let resume = seed.resumeSettings || {};
  let globalSettings = seed.globalSettings || {};
  let projects = seed.projects || [];
  let skills = seed.skills || [];
  let services = seed.services || [];
  let experiences = seed.experiences || [];

  if (isDbConnected) {
    try {
      const [
        heroDb, aboutDb, contactDb, footerDb, resumeDb, globalDb,
        projectsDb, skillsDb, servicesDb, expDb
      ] = await Promise.all([
        HeroSettings.findOne().lean(),
        AboutSettings.findOne().lean(),
        ContactSettings.findOne().lean(),
        FooterSettings.findOne().lean(),
        ResumeSettings.findOne().lean(),
        GlobalSettings.findOne().lean(),
        Project.find({ visible: { $ne: false } }).sort({ order: 1 }).lean(),
        Skill.find().sort({ category: 1, order: 1 }).lean(),
        Service.find({ enabled: { $ne: false } }).sort({ order: 1 }).lean(),
        Experience.find().sort({ order: 1 }).lean()
      ]);

      if (heroDb) hero = { ...hero, ...heroDb };
      if (aboutDb) about = { ...about, ...aboutDb };
      if (contactDb) contact = { ...contact, ...contactDb };
      if (footerDb) footer = { ...footer, ...footerDb };
      if (resumeDb) resume = { ...resume, ...resumeDb };
      if (globalDb) globalSettings = { ...globalSettings, ...globalDb };
      if (Array.isArray(projectsDb)) projects = projectsDb;
      if (Array.isArray(skillsDb)) skills = skillsDb;
      if (Array.isArray(servicesDb)) services = servicesDb;
      if (Array.isArray(expDb)) experiences = expDb;
    } catch (dbErr) {
      console.warn('⚠️ Error fetching live MongoDB data for AI context:', dbErr.message);
    }
  }

  const aboutPage = about.aboutPage || {};

  const name = aboutPage.profileName || hero.name || globalSettings.portfolioName || "Faheem A V";
  const role = aboutPage.profileRole || (Array.isArray(hero.words) ? hero.words.join(' • ') : "UI/UX Designer & Frontend Developer");
  const bio = "Faheem A V is a UI/UX Designer & Frontend Developer with hands-on experience in UI/UX design, prototyping, responsive interfaces, and frontend development. He has gained professional experience as a UI/UX Design Intern at Febno Technologies and has further developed his skills through practical portfolio projects.";
  const objective = aboutPage.objective || "";
  const journey = aboutPage.journeyText || "";
  const resumeUrl = aboutPage.resumeUrl || resume.resumeUrl || "/assets/resume.pdf";

  const email = contact.email || footer.contactEmail || "avfaheeem@gmail.com";
  const phone = contact.phone || "+91 7356164236";
  const whatsapp = contact.whatsapp || "+91 7356164236";
  const address = contact.address || "Calicut, Kerala, India";
  const socialLinks = footer.socialLinks || [
    { platform: "LinkedIn", url: "https://linkedin.com" },
    { platform: "GitHub", url: "https://github.com" }
  ];

  return {
    name,
    role,
    bio,
    objective,
    journey,
    resumeUrl,
    contact: { email, phone, whatsapp, address, socialLinks },
    projects,
    skills,
    services,
    experiences
  };
}

/**
 * Formats live portfolio data into a prompt for LLM models.
 */
function buildSystemPrompt(data) {
  const projectListStr = data.projects.length === 0
    ? "There are currently NO featured projects listed in the portfolio."
    : data.projects.map((p, idx) => {
        const techs = Array.isArray(p.technologies) ? p.technologies.join(', ') : (p.technologies || 'N/A');
        return `Project #${idx + 1}:
- Name: ${p.name}
- Category: ${p.category || 'Web Application'}
- Year: ${p.year || '2026'}
- Short Summary: ${p.shortDesc || p.longDesc || 'N/A'}
- Key Tech Stack: ${techs}
- Live Demo Link: ${p.liveUrl || 'N/A'}
- GitHub Link: ${p.githubUrl || 'N/A'}`;
      }).join('\n\n');

  const skillsGrouped = {};
  data.skills.forEach(s => {
    const cat = s.category || 'General';
    if (!skillsGrouped[cat]) skillsGrouped[cat] = [];
    skillsGrouped[cat].push(s.name);
  });

  const skillsStr = Object.keys(skillsGrouped).length === 0
    ? "No skills listed."
    : Object.entries(skillsGrouped).map(([cat, list]) => `- ${cat}: ${list.join(', ')}`).join('\n');

  const servicesStr = data.services.length === 0
    ? "No services listed."
    : data.services.map(s => `- ${s.title}: ${s.description}`).join('\n');

  const expStr = data.experiences.length === 0
    ? "- UI/UX Design Intern at Febno Technologies"
    : data.experiences.map(e => `- ${e.position} at ${e.company} (${e.duration})${e.description ? ': ' + e.description : ''}`).join('\n');

  const socialsStr = (data.contact.socialLinks || [])
    .map(s => `- ${s.platform}: ${s.url}`)
    .join('\n');

  return `You are Faheem's official AI Portfolio Assistant on his portfolio website.

CURRENT PORTFOLIO DATA (SINGLE SOURCE OF TRUTH):

PROFILE:
- Name: ${data.name}
- Professional Title: ${data.role}
- Overview / Bio: ${data.bio}
- Professional Experience: UI/UX Design Intern at Febno Technologies
- Practical Experience: Hands-on experience gained through internship work and practical portfolio projects.
- Specializations: UI design, prototyping, responsive design, frontend development, and modern web interfaces.
- Career Objective: ${data.objective}

ACTIVE PROJECTS (${data.projects.length} Total):
${projectListStr}

SKILLS:
${skillsStr}

SERVICES OFFERED:
${servicesStr}

WORK EXPERIENCE:
${expStr}

RESUME / CV:
- Resume URL: ${data.resumeUrl}

CONTACT & SOCIAL LINKS:
- Email: ${data.contact.email}
- Phone: ${data.contact.phone}
- WhatsApp: ${data.contact.whatsapp}
- Location: ${data.contact.address}
Social Media:
${socialsStr}

STRICT INSTRUCTIONS:
1. IDENTITY & GOAL: Act as an intelligent recruiter + project guide + personal portfolio assistant for Faheem.
2. RECRUITER MODE: When asked for "Recruiter Mode" or recruiter overview, structure the response cleanly as:
   FAHEEM AT A GLANCE
   Role: ${data.role}
   Professional Experience: UI/UX Design Intern at Febno Technologies
   Core strengths: [List key skills]
   Best projects: [List key active projects]
   Services: [List services]
3. MULTILINGUAL SUPPORT: Understand English, Malayalam, and Manglish questions natively (e.g., "Faheem entha cheyyunnath?", "Projects ethokkeya?", "React ariyamo?", "Contact cheyyan engane?"). Answer in a friendly, conversational tone matching the visitor's language style grounded strictly in the portfolio facts above.
4. ACCURACY & EXPERIENCE CLAIMS: NEVER claim "3+ years", "5+ years", "senior designer", or any unsupported duration of experience. Faheem's professional experience is as a UI/UX Design Intern at Febno Technologies, complemented by practical portfolio projects.
5. SOURCE OF TRUTH: Answer strictly using ONLY the portfolio data above. Do NOT invent projects, companies, experience, skills, awards, certifications, or URLs.
6. MISSING DATA / UNKNOWN: If asked about a project, skill, company, or detail NOT in the data above, respond with: "I don't have that information in Faheem's portfolio."
7. FORMATTING: Use clean, short bullet points, short paragraphs, and a professional, confident tone. Avoid generic filler.`;
}

/**
 * Intelligent grounded fallback responder using live portfolio data
 */
function getGroundedFallbackReply(message, data) {
  const cleanMsg = (message || "").toLowerCase().trim();

  // Recruiter mode trigger
  if (cleanMsg.includes("recruiter mode") || cleanMsg.includes("recruiter") || cleanMsg.includes("at a glance")) {
    const topSkills = data.skills.slice(0, 6).map(s => s.name).join(", ");
    const topProjects = data.projects.slice(0, 3).map(p => p.name).join(", ");
    const topServices = data.services.map(s => s.title).join(", ");

    return `FAHEEM AT A GLANCE

• Role: ${data.role}
• Professional Experience: UI/UX Design Intern at Febno Technologies
• Practical Skills: ${topSkills || "UI/UX Design, Figma Prototyping, React, Responsive Web Design"}
• Featured Projects: ${topProjects || "Web & Mobile Applications"}
• Services: ${topServices || "UI/UX Design, Frontend Development"}`;
  }

  // Malayalam / Manglish / English query matching
  if (cleanMsg.includes("who is") || cleanMsg.includes("about faheem") || cleanMsg.includes("entha cheyyunnath") || cleanMsg.includes("aaranu") || cleanMsg.includes("what does faheem do")) {
    return "Faheem A V is a UI/UX Designer & Frontend Developer with hands-on experience in UI/UX design, prototyping, responsive interfaces, and frontend development. He has gained professional experience as a UI/UX Design Intern at Febno Technologies and has further developed his skills through practical portfolio projects.";
  }

  if (cleanMsg.includes("service") || cleanMsg.includes("help") || cleanMsg.includes("offer") || cleanMsg.includes("cheyyan pattum")) {
    if (data.services.length > 0) {
      const serviceTitles = data.services.map(s => s.title).join(", ");
      return `${data.name} offers key services in: ${serviceTitles}. He combines creative UI/UX design with clean frontend engineering to build high-performance web applications.`;
    }
    return `${data.name} provides custom UI/UX design and frontend web development services.`;
  }

  if (cleanMsg.includes("skill") || cleanMsg.includes("tech") || cleanMsg.includes("stack") || cleanMsg.includes("react ariyamo") || cleanMsg.includes("know")) {
    if (data.skills.length > 0) {
      const topSkills = data.skills.slice(0, 8).map(s => s.name).join(", ");
      return `${data.name}'s key technical skills include: ${topSkills}.`;
    }
    return "Faheem specializes in React, JavaScript (ES6+), Figma UI/UX Design, HTML5, CSS3, Node.js, Express, and MongoDB.";
  }

  if (cleanMsg.includes("why hire") || cleanMsg.includes("why should i hire") || cleanMsg.includes("fit")) {
    return "Faheem is a strong candidate because he combines hands-on UI/UX design and prototyping experience from his internship at Febno Technologies with practical React frontend development shown across his portfolio projects.";
  }

  if (cleanMsg.includes("contact") || cleanMsg.includes("reach") || cleanMsg.includes("email") || cleanMsg.includes("hire") || cleanMsg.includes("contact cheyyan") || cleanMsg.includes("whatsapp")) {
    return `Interested in working together? Feel free to reach out to Faheem via Email (${data.contact.email}), WhatsApp (${data.contact.whatsapp}), or LinkedIn.`;
  }

  if (cleanMsg.includes("resume") || cleanMsg.includes("cv")) {
    return `You can view and download Faheem's resume directly from the portfolio.`;
  }

  if (cleanMsg.includes("experience") || cleanMsg.includes("job") || cleanMsg.includes("history") || cleanMsg.includes("internship")) {
    return "Faheem has gained professional experience as a UI/UX Design Intern at Febno Technologies. He has further developed his skills in UI design, prototyping, responsive layouts, and React frontend development through practical portfolio projects.";
  }

  const projectKeywords = ["project", "work", "portfolio", "case study", "app", "built", "created", "ethokkeya"];
  const isAskingAboutProjects = projectKeywords.some(kw => cleanMsg.includes(kw));

  if (isAskingAboutProjects || cleanMsg.includes("show me")) {
    if (data.projects.length === 0) {
      return "There are currently no featured projects listed in Faheem's portfolio.";
    }

    const matchedProject = data.projects.find(p => p.name && cleanMsg.includes(p.name.toLowerCase()));
    if (matchedProject) {
      const techs = Array.isArray(matchedProject.technologies) ? matchedProject.technologies.join(", ") : matchedProject.technologies;
      return `"${matchedProject.name}" (${matchedProject.category}): ${matchedProject.shortDesc || matchedProject.longDesc}. Built using ${techs}.`;
    }

    const projectList = data.projects.map(p => `• ${p.name} (${p.category}): ${p.shortDesc || 'Web Application'}`).join('\n');
    return `Here are Faheem's current projects:\n\n${projectList}`;
  }

  return "I don't have that information in Faheem's portfolio.";
}

/**
 * Derives smart contextual action buttons and dynamic follow-up suggested questions.
 */
export function deriveSmartActionsAndFollowups(userMessage, replyText, liveData) {
  const cleanMsg = (userMessage || "").toLowerCase();
  const cleanReply = (replyText || "").toLowerCase();

  const actions = [];
  const suggestedQuestions = [];

  // Recruiter Mode query
  const isRecruiterQuery = cleanMsg.includes("recruiter") || cleanMsg.includes("at a glance");
  if (isRecruiterQuery || cleanReply.includes("at a glance")) {
    if (liveData.resumeUrl) {
      actions.push({ label: "View Resume", url: liveData.resumeUrl, type: "resume" });
    }
    if (liveData.contact && liveData.contact.email) {
      actions.push({ label: "Contact Faheem", url: `mailto:${liveData.contact.email}`, type: "email" });
    }
    suggestedQuestions.push("Explore Projects", "What are his skills?", "How can I contact him?");
    return { actions: actions.slice(0, 3), suggestedQuestions: suggestedQuestions.slice(0, 3) };
  }

  // 1. Contact Actions & Follow-ups
  const isContactQuery = cleanMsg.includes("contact") || cleanMsg.includes("reach") || cleanMsg.includes("email") || cleanMsg.includes("hire") || cleanMsg.includes("whatsapp") || cleanMsg.includes("contact cheyyan");
  if (isContactQuery || cleanReply.includes("contact") || cleanReply.includes("email")) {
    if (liveData.contact && liveData.contact.email) {
      actions.push({ label: "Email Me", url: `mailto:${liveData.contact.email}`, type: "email" });
    }
    const linkedInObj = (liveData.contact.socialLinks || []).find(s => (s.platform || '').toLowerCase().includes('linkedin') || (s.url || '').includes('linkedin'));
    if (linkedInObj && linkedInObj.url) {
      actions.push({ label: "LinkedIn", url: linkedInObj.url, type: "linkedin" });
    }
    if (liveData.contact.whatsapp) {
      const cleanNum = liveData.contact.whatsapp.replace(/[^0-9]/g, "");
      if (cleanNum) {
        actions.push({ label: "WhatsApp", url: `https://wa.me/${cleanNum}`, type: "whatsapp" });
      }
    }
    suggestedQuestions.push("View Resume", "Explore Projects", "Recruiter Mode");
  }

  // 2. Resume / Experience Actions & Follow-ups
  const isResumeQuery = cleanMsg.includes("resume") || cleanMsg.includes("cv") || cleanMsg.includes("experience") || cleanMsg.includes("qualification") || cleanMsg.includes("job") || cleanMsg.includes("internship");
  if (isResumeQuery || cleanReply.includes("resume")) {
    if (liveData.resumeUrl && !actions.some(a => a.type === "resume")) {
      actions.push({ label: "View Resume", url: liveData.resumeUrl, type: "resume" });
    }
    if (suggestedQuestions.length === 0) {
      suggestedQuestions.push("Explore Projects", "What are his skills?", "How can I contact him?");
    }
  }

  // 3. Project Actions & Follow-ups
  const isProjectQuery = cleanMsg.includes("project") || cleanMsg.includes("work") || cleanMsg.includes("portfolio") || cleanMsg.includes("case study") || cleanMsg.includes("show me") || cleanMsg.includes("ethokkeya");
  
  if (Array.isArray(liveData.projects) && liveData.projects.length > 0) {
    liveData.projects.forEach(p => {
      const pNameLower = (p.name || "").toLowerCase();
      if (pNameLower && (cleanMsg.includes(pNameLower) || cleanReply.includes(pNameLower))) {
        const targetUrl = p.liveUrl || p.caseStudyUrl || (p._id ? `/case-study/${p._id}` : null);
        if (targetUrl && !actions.some(a => a.url === targetUrl)) {
          actions.push({ label: `View ${p.name}`, url: targetUrl, type: "project" });
        }
      }
    });

    if (isProjectQuery) {
      if (!actions.some(a => a.type === "project") && liveData.projects[0]) {
        const firstP = liveData.projects[0];
        const targetUrl = firstP.liveUrl || firstP.caseStudyUrl || "/projects";
        actions.push({ label: `View ${firstP.name}`, url: targetUrl, type: "project" });
      }

      if (suggestedQuestions.length === 0) {
        const firstPName = liveData.projects[0]?.name;
        if (firstPName) {
          suggestedQuestions.push(`Tell me about ${firstPName}`, "Show another project", "What technologies does he use?");
        } else {
          suggestedQuestions.push("What are his skills?", "How can I contact him?");
        }
      }
    }
  }

  // 4. Skills & Services Actions & Follow-ups
  const isSkillQuery = cleanMsg.includes("skill") || cleanMsg.includes("service") || cleanMsg.includes("tech") || cleanMsg.includes("stack") || cleanMsg.includes("offer");
  if (isSkillQuery) {
    if (!actions.some(a => a.type === "project") && liveData.projects && liveData.projects.length > 0) {
      actions.push({ label: "Explore Projects", url: "/projects", type: "project" });
    }
    if (suggestedQuestions.length === 0) {
      suggestedQuestions.push("Show his projects", "What services does he offer?", "View Resume");
    }
  }

  // Default follow-up fallback
  if (suggestedQuestions.length === 0) {
    suggestedQuestions.push("Explore Projects", "My Skills", "My Experience", "Recruiter Mode");
  }

  return {
    actions: actions.slice(0, 3),
    suggestedQuestions: Array.from(new Set(suggestedQuestions)).slice(0, 4)
  };
}

/**
 * Main AI response generator endpoint handler.
 * @param {string} userMessage 
 * @returns {Promise<{ text: string, actions: Array, suggestedQuestions: Array }>}
 */
export async function generateAIChatReply(userMessage) {
  const liveData = await getLivePortfolioData();

  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

  let rawReplyText = "";

  if (!apiKey) {
    rawReplyText = getGroundedFallbackReply(userMessage, liveData);
  } else {
    const systemPrompt = buildSystemPrompt(liveData);

    try {
      // 1. Google Gemini API (if configured)
      if (process.env.GEMINI_API_KEY || (process.env.AI_API_KEY && process.env.AI_API_KEY.startsWith("AIza"))) {
        const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
        const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      { text: `${systemPrompt}\n\nVisitor Question: ${userMessage}` }
                    ]
                  }
                ],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 250
                }
              })
            }
          );
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText && candidateText.trim()) {
              rawReplyText = candidateText.trim();
            }
          }
        } catch (geminiErr) {
          clearTimeout(timeoutId);
          console.warn("⚠️ AI Provider request timeout/error. Falling back to grounded data engine.");
        }
      }

      // 2. Groq / OpenAI API (if configured)
      if (!rawReplyText && (process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY)) {
        const isGroq = !!process.env.GROQ_API_KEY;
        const apiEndpoint = isGroq
          ? "https://api.groq.com/openai/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions";
        const token = isGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
        const model = isGroq 
          ? (process.env.GROQ_MODEL || process.env.AI_MODEL || "llama-3.3-70b-versatile")
          : (process.env.OPENAI_MODEL || process.env.AI_MODEL || "gpt-4o-mini");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        try {
          const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            signal: controller.signal,
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
              ],
              temperature: 0.2,
              max_tokens: 250
            })
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const replyText = data.choices?.[0]?.message?.content;
            if (replyText && replyText.trim()) {
              rawReplyText = replyText.trim();
            }
          }
        } catch (openAiErr) {
          clearTimeout(timeoutId);
          console.warn("⚠️ AI Provider request timeout/error. Falling back to grounded data engine.");
        }
      }

      if (!rawReplyText) {
        rawReplyText = getGroundedFallbackReply(userMessage, liveData);
      }

    } catch (error) {
      console.warn("⚠️ AI Service processing error. Falling back to grounded data engine.");
      rawReplyText = getGroundedFallbackReply(userMessage, liveData);
    }
  }

  const { actions, suggestedQuestions } = deriveSmartActionsAndFollowups(userMessage, rawReplyText, liveData);

  return {
    text: rawReplyText,
    actions,
    suggestedQuestions
  };
}
