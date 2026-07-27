import React, { useState } from "react";
import "./AboutPage.css";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "../context/AdminContext";
import { 
  SiFigma, 
  SiHtml5, 
  SiJavascript, 
  SiReact,
  SiNetlify,
  SiGit,
  SiVercel
} from "react-icons/si";

import { 
  FaCss3Alt 
} from "react-icons/fa";

import { 
  DiPhotoshop 
} from "react-icons/di";

import { 
  FiSmartphone, 
  FiMessageSquare, 
  FiUsers, 
  FiZap,
  FiPenTool,
  FiLayout,
  FiUser,
  FiCode,
  FiLayers,
  FiCpu,
  FiSearch,
  FiUserCheck,
  FiCompass,
  FiCheckSquare
} from "react-icons/fi";

import { 
  TbDevices, 
  TbHierarchy, 
  TbPuzzle,
  TbBulb,
  TbPalette
} from "react-icons/tb";

// Medal Icon (My Journey)
const JourneyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="section-title-icon medal-gradient">
    <defs>
      <linearGradient id="medalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EC4899" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="url(#medalGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="url(#medalGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Key Icon (Capabilities)
const KeyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="section-title-icon key-gradient">
    <defs>
      <linearGradient id="keyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="50%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <path d="M21 2L11.8 11.2M21 2H17M21 2V6M16.5 6.5L18.5 8.5M15 8L17 10" stroke="url(#keyGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 21C10.5376 21 13 18.5376 13 15.5C13 12.4624 10.5376 10 7.5 10C4.46243 10 2 12.4624 2 15.5C2 18.5376 4.46243 21 7.5 21Z" stroke="url(#keyGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// GSAP Superhero SVG Icon
const GsapSuperheroIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="skill-svg gsap-brand">
    <path d="M12 2C12.828 2 13.5 2.672 13.5 3.5C13.5 4.328 12.828 5 12 5C11.172 5 10.5 4.328 10.5 3.5C10.5 2.672 11.172 2 12 2Z" fill="currentColor"/>
    <path d="M10 6H14V13H10V6Z" fill="currentColor"/>
    <path d="M6 8C7.5 8 9 9.5 10 10.5V13.5C8 12 6 9.5 6 8Z" fill="currentColor"/>
    <path d="M18 8C16.5 8 15 9.5 14 10.5V13.5C16 12 18 9.5 18 8Z" fill="currentColor"/>
    <path d="M8.5 14L6 22H8.5L10.5 16.5H13.5L15.5 22H18L15.5 14H8.5Z" fill="currentColor"/>
  </svg>
);

const skillsData = [
  { name: "Figma", category: "design", icon: "figma", iconClass: "figma-wrapper" },
  { name: "Adobe XD", category: "design", icon: "adobe-xd", iconClass: "adobe-xd-wrapper" },
  { name: "Photoshop", category: "design", icon: "photoshop", iconClass: "photoshop-wrapper" },
  { name: "Illustrator", category: "design", icon: "illustrator", iconClass: "illustrator-wrapper" },

  { name: "Wireframing", category: "design", icon: "wireframe", iconClass: "wireframe-wrapper" },
  { name: "Prototyping", category: "design", icon: "prototype", iconClass: "prototype-wrapper" },
  { name: "Responsive Layouts", category: "design", icon: "responsive", iconClass: "responsive-wrapper" },
  { name: "Color Theory", category: "design", icon: "color", iconClass: "color-wrapper" },

  { name: "User Research", category: "professional", icon: "research", iconClass: "research-wrapper" },
  { name: "User Personas", category: "professional", icon: "persona", iconClass: "persona-wrapper" },
  { name: "Journey Mapping", category: "professional", icon: "journey", iconClass: "journey-wrapper" },
  { name: "Usability Testing", category: "professional", icon: "testing", iconClass: "testing-wrapper" },

  { name: "HTML5", category: "development", icon: "html5", iconClass: "html5-wrapper" },
  { name: "CSS3", category: "development", icon: "css3", iconClass: "css3-wrapper" },
  { name: "React.js", category: "development", icon: "react", iconClass: "react-wrapper" },
  { name: "Responsive Design", category: "development", icon: "responsive", iconClass: "responsive-wrapper" }
];

const getSkillIcon = (iconName) => {
  switch (iconName) {
    case "figma":
      return <SiFigma className="skill-svg" />;
    case "photoshop":
      return <DiPhotoshop className="skill-svg photoshop-brand" />;
    case "wireframe":
      return <FiPenTool className="skill-svg wireframe-brand" />;
    case "mobile":
      return <FiSmartphone className="skill-svg mobile-brand" />;
    case "responsive":
      return <TbDevices className="skill-svg responsive-brand" />;
    case "design-systems":
      return <TbHierarchy className="skill-svg design-systems-brand" />;
    case "html5":
      return <SiHtml5 className="skill-svg html5-brand" />;
    case "css3":
      return <FaCss3Alt className="skill-svg css3-brand" />;
    case "javascript":
      return <SiJavascript className="skill-svg javascript-brand" />;
    case "react":
      return <SiReact className="skill-svg react-brand" />;
    case "gsap":
      return <GsapSuperheroIcon />;
    case "netlify":
      return <SiNetlify className="skill-svg netlify-brand" />;
    case "vercel":
      return <SiVercel className="skill-svg vercel-brand" />;
    case "git":
      return <SiGit className="skill-svg git-brand" />;
    case "creative":
      return <TbBulb className="skill-svg creative-brand" />;
    case "communication":
      return <FiMessageSquare className="skill-svg communication-brand" />;
    case "problem-solving":
      return <TbPuzzle className="skill-svg problem-solving-brand" />;
    case "collaboration":
      return <FiUsers className="skill-svg collaboration-brand" />;
    default:
      return <FiZap className="skill-svg" />;
  }
};

const AdobeXdIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm3.5 12.5h2.2l1.6-3 1.6 3h2.2l-2.7-4.8 2.5-4.2h-2.1L11.3 9.4 9.8 6.5H7.7l2.4 4.2-2.6 4.8zm9.5 0h2.5V6.5h-2.5v6z" />
  </svg>
);

const IllustratorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm-2.25 14.5H8.25l-.75-2.25H4.5l-.75 2.25H2.25L5.25 7.5h1.5l3 9zm-2.85-4.25L5.62 8.75h-.24l-1.28 3.5h2.8zm11.1 4.25h-1.8v-1.5h-.08a2.12 2.12 0 0 1-1.82 1.65A2.25 2.25 0 0 1 12.3 15a2.58 2.58 0 0 1 1.7-2.45l2.25-.8V11.2a1.2 1.2 0 0 0-1.25-1.25 1.5 1.5 0 0 0-1.35.75l-1.35-.9a2.75 2.75 0 0 1 2.7-1.3 2.7 2.7 0 0 1 2.7 2.7v5.3z" />
  </svg>
);

const getSkillItemConfig = (name) => {
  switch (name) {
    case "Figma":
      return { icon: <SiFigma />, color: "#F24E1E", class: "figma" };
    case "Adobe XD":
      return { icon: <AdobeXdIcon />, color: "#FF61F6", class: "adobexd" };
    case "Photoshop":
      return { icon: <DiPhotoshop />, color: "#31A8FF", class: "photoshop" };
    case "Illustrator":
      return { icon: <IllustratorIcon />, color: "#FF9A00", class: "illustrator" };

    case "Wireframing":
      return { icon: <FiLayers />, color: "#8B5CF6", class: "wireframing" };
    case "Prototyping":
      return { icon: <FiCpu />, color: "#EC4899", class: "prototyping" };
    case "Responsive Layouts":
      return { icon: <TbDevices />, color: "#10B981", class: "responsive" };
    case "Color Theory":
      return { icon: <TbPalette />, color: "#F59E0B", class: "colortheory" };

    case "User Research":
      return { icon: <FiSearch />, color: "#3B82F6", class: "research" };
    case "User Personas":
      return { icon: <FiUserCheck />, color: "#A855F7", class: "personas" };
    case "Journey Mapping":
      return { icon: <FiCompass />, color: "#06B6D4", class: "journey" };
    case "Usability Testing":
      return { icon: <FiCheckSquare />, color: "#10B981", class: "testing" };

    case "HTML5":
      return { icon: <SiHtml5 />, color: "#E34F26", class: "html5" };
    case "CSS3":
      return { icon: <FaCss3Alt />, color: "#1572B6", class: "css3" };
    case "React.js":
      return { icon: <SiReact className="skill-react-spin" />, color: "#61DAFB", class: "react" };
    case "Responsive Design":
      return { icon: <FiSmartphone />, color: "#8B5CF6", class: "responsivedesign" };

    default:
      return { icon: <FiZap />, color: "#8B5CF6", class: "default" };
  }
};

const FallbackProfileCard = () => (
  <motion.div 
    className="fallback-profile-card"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
  >
    <div className="fallback-bg-grid"></div>
    <div className="fallback-purple-glow"></div>

    <div className="fallback-content">
      {/* Large Initials */}
      <div className="fallback-initials-wrapper">
        <div className="fallback-initials">FA</div>
      </div>

      {/* Profile Information */}
      <div className="fallback-info">
        <h3 className="fallback-name">Faheem A V</h3>
        <p className="fallback-role">UI/UX Designer • Frontend Developer</p>
      </div>

      {/* Status Badge */}
      <div className="fallback-status-badge">
        <span className="status-dot-green"></span>
        <span>Available for Work</span>
      </div>

      {/* Skills Chips */}
      <div className="fallback-skills-chips">
        <span className="skill-chip">Figma</span>
        <span className="skill-chip">React</span>
        <span className="skill-chip">UX Research</span>
        <span className="skill-chip">Prototyping</span>
      </div>
    </div>
  </motion.div>
);

function AboutPage() {
  const { siteSettings, skills, isSkillsLoading } = useAdmin();
  const aboutSettings = siteSettings?.about || {};
  const [imgError, setImgError] = useState(false);

  const profileImgSrc = aboutSettings.aboutImage || "/assets/about_profile.png";

  const categorizedExpertise = [
    {
      id: "design-tools",
      title: "Design Tools",
      icon: <FiPenTool className="expertise-icon" />,
      skills: ["Figma", "Adobe XD", "Photoshop", "Illustrator"]
    },
    {
      id: "ui-skills",
      title: "UI Skills",
      icon: <FiLayout className="expertise-icon" />,
      skills: ["Wireframing", "Prototyping", "Responsive Layouts", "Color Theory"]
    },
    {
      id: "ux-skills",
      title: "UX Skills",
      icon: <FiUser className="expertise-icon" />,
      skills: ["User Research", "User Personas", "Journey Mapping", "Usability Testing"]
    },
    {
      id: "frontend",
      title: "Frontend",
      icon: <FiCode className="expertise-icon" />,
      skills: ["HTML5", "CSS3", "React.js", "Responsive Design"]
    }
  ];

  return (
    <div className="about-page-wrapper">
      <section className="about-page-section">
        <div className="about-page-content-container">
          
          {/* Profile and About Intro */}
          <div className="about-intro-grid">
            <div className="about-intro-left">
              {/* Capsule Badge */}
              <motion.div 
                className="about-pill-badge"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <FiUser className="pill-badge-icon" />
                <span>About Me</span>
              </motion.div>
              
              {/* Main Heading with Purple Dot */}
              <motion.h1 
                className="about-hero-title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
              >
                About me<span className="purple-dot">.</span>
              </motion.h1>
              
              {/* Greeting & Bio Block */}
              <motion.div 
                className="about-greeting-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <div className="about-greeting-hi">
                  Hi! <span className="wave-hand">👋</span>
                </div>
                
                <p className="about-bio-text">
                  {aboutSettings.bioIntro || "My name is Faheem. I am a UI/UX Designer & Frontend Developer based in India with experience through projects and building modern web applications."}
                </p>

                <p className="about-objective-text">
                  {aboutSettings.objective || "My objective: Challenge myself in a new environment to learn, develop, improve my skills through different projects and contribute more to the company with my abilities."}
                </p>
              </motion.div>

              <div className="about-intro-line"></div>
            </div>

            {/* Right Column Profile Card with Ornaments */}
            <motion.div 
              className="about-intro-right"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <div className="profile-image-container">
                {/* Decorative background circles & dots matching reference image */}
                <div className="decor-circle decor-circle-top-left"></div>
                <div className="decor-circle decor-circle-bottom-right"></div>
                <div className="decor-sparkle-star">✦</div>
                <div className="decor-dots-grid"></div>

                {/* Main Profile Photo Squircle Card / Fallback Card */}
                <div className="profile-photo-card">
                  {!imgError && profileImgSrc ? (
                    <img 
                      src={profileImgSrc} 
                      alt="Faheem Profile" 
                      className="profile-photo-img"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <FallbackProfileCard />
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* My Journey Section */}
          <div className="about-details-section">
            <div className="about-section-header">
              <div className="about-header-icon-box">
                <JourneyIcon />
              </div>
              <h3 className="about-subheading">My Journey</h3>
            </div>
            
            <div className="about-section-content">
              <p className="journey-text">
                Started with a curiosity for code, evolved into a love for design. Over the years, I've honed my skills in creating seamless digital experiences that solve real problems. My background in both development and design allows me to unify the creative vision with technical feasibility.
              </p>
            </div>
          </div>

          {/* My Expertise Section */}
          <div className="about-capabilities-section">
            <div className="capabilities-centered-header">
              <h2 className="expertise-main-title">My Expertise</h2>
              <p className="expertise-subtitle">Tools and technologies I use to bring ideas to life.</p>
            </div>

            <div className="expertise-grid">
              {categorizedExpertise.map((group) => (
                <div key={group.id} className="expertise-column-card">
                  <div className="expertise-card-header">
                    <div className={`expertise-icon-container ${group.id}`}>
                      {group.icon}
                    </div>
                    <h3 className="expertise-column-title">{group.title}</h3>
                  </div>
                  
                  <div className="expertise-skills-list">
                    {group.skills.map((skill, sIdx) => {
                      const config = getSkillItemConfig(skill);
                      return (
                        <motion.div 
                          key={sIdx} 
                          className={`expertise-skill-pill ${config.class}`}
                          style={{ '--item-accent-color': config.color }}
                          whileHover={{ scale: 1.05, x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 450, damping: 25 }}
                        >
                          <span className="skill-pill-icon" style={{ color: config.color }}>
                            {config.icon}
                          </span>
                          <span className="skill-pill-name">{skill}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

export default AboutPage;
