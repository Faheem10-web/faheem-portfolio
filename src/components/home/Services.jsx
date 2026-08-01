import React, { memo } from "react";
import "./Services.css";
import { motion } from "framer-motion";
import { FiPenTool, FiMonitor, FiCode, FiSmartphone, FiCpu } from "react-icons/fi";
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
        title: "Web Development",
        description: "Modern, responsive and high-performance web development.",
        iconName: "monitor",
        color: "#3B82F6"
    },
    {
        _id: "03",
        title: "Mobile App Design",
        description: "Intuitive iOS and Android app interfaces focused on usability.",
        iconName: "smartphone",
        color: "#10B981"
    },
    {
        _id: "04",
        title: "Branding & Identity",
        description: "Distinct visual identities, logos and cohesive design systems.",
        iconName: "pen-tool",
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

const Services = memo(function Services() {
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
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                        How Can I Assist You?
                    </motion.h2>

                    <motion.p 
                        className="services-description"
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
                    >
                        I create intuitive digital experiences through UI/UX design, web development and branding solutions.
                    </motion.p>
                </div>

                <div className="services-grid">
                    {activeServices.map((service, index) => {
                        let iconName = service.iconName || "FiCpu";
                        const numLabel = service.order !== undefined ? String(service.order).padStart(2, '0') : String(index + 1).padStart(2, '0');
                        const isSvg = service.iconType === 'svgCode' && service.iconSvg;
                        let title = service.title;
                        let description = service.description;

                        if (iconName === "smartphone") {
                            iconName = "smartphone";
                        }

                        return (
                            <motion.div 
                                className="service-card"
                                key={service._id}
                                style={{
                                    '--card-accent-color': service.color || '#8B5CF6'
                                }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
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
                                    <p className="card-description">{description}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
});

export default Services;

