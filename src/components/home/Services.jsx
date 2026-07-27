import React from "react";
import "./Services.css";
import { motion } from "framer-motion";
import { FiPenTool, FiMonitor, FiCode, FiSmartphone, FiArrowRight, FiCpu } from "react-icons/fi";
import { useAdmin } from "../../context/AdminContext";

const DEFAULT_SERVICES = [
    {
        _id: "01",
        title: "UI/UX Design",
        description: "User-centered interfaces with seamless digital experiences.",
        iconName: "pen-tool",
        color: "#8B5CF6"
    },
    {
        _id: "02",
        title: "Web Design",
        description: "Modern, responsive and visually engaging website designs.",
        iconName: "monitor",
        color: "#3B82F6"
    },
    {
        _id: "03",
        title: "Frontend Dev",
        description: "Fast, scalable websites built with React and modern technologies.",
        iconName: "code",
        color: "#10B981"
    },
    {
        _id: "04",
        title: "Mobile App Design",
        description: "Intuitive iOS and Android app interfaces focused on usability.",
        iconName: "smartphone",
        color: "#EC4899"
    }
];

const getIcon = (iconName) => {
    switch (iconName) {
        case "pen-tool":
        case "FiPenTool":
            return <FiPenTool />;
        case "monitor":
        case "FiMonitor":
            return <FiMonitor />;
        case "code":
        case "FiCode":
            return <FiCode />;
        case "smartphone":
        case "FiSmartphone":
            return <FiSmartphone />;
        default:
            return <FiCpu />;
    }
};

function Services() {
    const { services, isServicesLoading } = useAdmin();
    
    const dbServices = services && services.length > 0
        ? services.filter(s => s.enabled !== false)
        : [];

    const showSkeleton = isServicesLoading && dbServices.length === 0;

    const activeServices = dbServices.length > 0
        ? dbServices
        : (!isServicesLoading ? DEFAULT_SERVICES : []);

    if (showSkeleton) {
        return (
            <section className="services-section" id="services">
                <div className="services-container">
                    <div className="services-intro">
                        <h2 className="services-title skeleton-text shimmer-placeholder" style={{ width: '280px', height: '32px', marginBottom: '16px' }}></h2>
                        <p className="services-description skeleton-text shimmer-placeholder" style={{ width: '420px', height: '20px' }}></p>
                    </div>
                    <div className="services-grid">
                        {[1, 2, 3, 4].map((n) => (
                            <div className="service-card shimmer-placeholder" key={n} style={{ height: '240px', borderRadius: '24px' }}></div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="services-section" id="services">
            <div className="services-container">
                <div className="services-intro">
                    <motion.h2 
                        className="services-title"
                        initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
                    >
                        How Can I Assist You?
                    </motion.h2>

                    <motion.p 
                        className="services-description"
                        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
                    >
                        I create intuitive digital experiences through UI/UX design, web development and branding solutions.
                    </motion.p>
                </div>

                <div className="services-grid">
                    {activeServices.map((service, index) => {
                        const iconName = service.iconName || "FiCpu";
                        const numLabel = service.order !== undefined ? String(service.order).padStart(2, '0') : String(index + 1).padStart(2, '0');
                        const isSvg = service.iconType === 'svgCode' && service.iconSvg;
                        const title = service.title === "Frontend Development" ? "Frontend Dev" : service.title;

                        return (
                            <motion.div 
                                className="service-card"
                                key={service._id}
                                style={{
                                    '--card-accent-color': service.color || '#8B5CF6'
                                }}
                                initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
                                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                viewport={{ once: true, margin: "-80px" }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
                            >
                                <div className="card-bg-pattern"></div>
                                
                                <div className="card-top">
                                    <div className="card-header-row">
                                        <div className="icon-wrapper">
                                            {isSvg ? (
                                                <div 
                                                    className="custom-svg-icon" 
                                                    dangerouslySetInnerHTML={{ __html: service.iconSvg }} 
                                                />
                                            ) : (
                                                getIcon(iconName)
                                            )}
                                        </div>
                                        <div className="card-number-badge">
                                            <span>{numLabel}</span>
                                        </div>
                                    </div>

                                    <h3 className="card-title">{title}</h3>
                                    <p className="card-description">{service.description}</p>
                                </div>


                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default Services;
