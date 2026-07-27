import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "../../context/AdminContext";
import { FiMail, FiPhone, FiMapPin, FiSend } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

import "./Contact.css";

const SERVICE_OPTIONS = [
  "Site from scratch",
  "UX/UI design",
  "Product design",
  "Webflow site",
  "Motion design",
  "Branding",
  "Mobile development"
];

function Contact() {
  const { siteSettings, submitContactMessage } = useAdmin();
  const contactSettings = siteSettings?.contact || {};

  // Form Fields State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedService, setSelectedService] = useState("UX/UI design");
  const [subject, setSubject] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  
  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle"); // 'idle' | 'success' | 'error'
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const tempErrors = {};
    if (!name.trim()) tempErrors.name = "Full Name is required";
    
    if (!email.trim()) {
      tempErrors.email = "Email Address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Please enter a valid email address";
    }

    if (!phone.trim()) tempErrors.phone = "Phone Number is required";
    if (!projectDetails.trim()) tempErrors.projectDetails = "Message content is required";
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setSubmitErrorMessage("");

    try {
      const res = await submitContactMessage({
        name,
        email,
        phone,
        serviceRequired: selectedService,
        subject: subject || 'Portfolio Inquiry',
        message: projectDetails
      });

      if (res.success) {
        setSubmitStatus("success");
        // Reset form
        setName("");
        setEmail("");
        setPhone("");
        setSubject("");
        setProjectDetails("");
      } else {
        setSubmitStatus("error");
        setSubmitErrorMessage(res.message || "Submission failed. Please try again.");
      }
    } catch (err) {
      setSubmitStatus("error");
      setSubmitErrorMessage(err.message || "A connection error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build dynamic pre-filled WhatsApp click link
  const getWhatsappUrl = () => {
    const rawNum = contactSettings.whatsapp || '+91 7356164236';
    const cleanNum = rawNum.replace(/[^0-9]/g, ''); // strip non-numeric

    const heroSettings = siteSettings?.hero || {};
    const portfolioName = heroSettings.name || "Faheem";

    const intro = `Hi ${portfolioName},\n\n`;
    const formFields = `My Name: ${name || '[Your Name]'}\nEmail: ${email || '[Your Email]'}\nPhone: ${phone || '[Your Phone]'}\nService: ${selectedService || '[Service]'}\nMessage: ${projectDetails || '[Message]'}\n\n`;
    const end = `I would like to discuss a project.`;
    
    const text = encodeURIComponent(intro + formFields + end);
    return `https://wa.me/${cleanNum}?text=${text}`;
  };

  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        
        <motion.div 
          className="contact-header"
          initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="contact-title" dangerouslySetInnerHTML={{ __html: contactSettings.heading || "Hey! Tell us all <br /><span>the things</span>" }} />
          <p className="contact-subtitle">{contactSettings.description}</p>
        </motion.div>

        {/* ── Direct Contact Info Row ── */}
        <div className="contact-info-pills" style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
          {contactSettings.email && (
            <a href={`mailto:${contactSettings.email}`} className="contact-info-pill">
              <FiMail /> <span>{contactSettings.email}</span>
            </a>
          )}
          {contactSettings.phone && (
            <a href={`tel:${contactSettings.phone}`} className="contact-info-pill">
              <FiPhone /> <span>{contactSettings.phone}</span>
            </a>
          )}
          {contactSettings.address && (
            <div className="contact-info-pill">
              <FiMapPin /> <span>{contactSettings.address}</span>
            </div>
          )}
        </div>

        <div className="contact-split-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
          
          {contactSettings.enableForm === false ? (
            <motion.div 
              className="form-disabled-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '28px',
                padding: '40px',
                textAlign: 'center',
                backdropFilter: 'blur(16px)'
              }}
            >
              <h3 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--color-primary)' }}>Online Submissions Closed</h3>
              <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
                The contact form is temporarily offline. Please reach out directly via Email or WhatsApp.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <a href={`mailto:${contactSettings.email}`} className="admin-btn admin-btn-primary" style={{ padding: '12px 24px', borderRadius: '28px' }}>Send Email</a>
                {contactSettings.enableWhatsappButton !== false && (
                  <a href={`https://wa.me/${(contactSettings.whatsapp || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="admin-btn admin-btn-secondary" style={{ padding: '12px 24px', borderRadius: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaWhatsapp style={{ color: '#25D366' }} /> WhatsApp
                  </a>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="contact-card-wrapper"
              initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              <form className="contact-form" onSubmit={handleSubmit}>
                
                {/* Service Selection */}
                <div className="form-group-pills">
                  <label className="group-label">Service Required</label>
                  <div className="pills-container">
                    {SERVICE_OPTIONS.map((service) => {
                      const isSelected = selectedService === service;
                      return (
                        <motion.button
                          key={service}
                          type="button"
                          className={`pill-btn ${isSelected ? "selected" : ""}`}
                          onClick={() => setSelectedService(service)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {service}
                          {isSelected && (
                            <motion.span 
                              layoutId="service-check"
                              className="pill-check"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              ✓
                            </motion.span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Main inputs */}
                <div className="form-inputs-grid">
                  
                  <div className={`input-field-wrapper ${errors.name ? "has-error" : ""}`}>
                    <input 
                      type="text" 
                      id="contact-name"
                      className="contact-input" 
                      placeholder=" " 
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                      }}
                    />
                    <label htmlFor="contact-name" className="contact-label">Full Name</label>
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>

                  <div className={`input-field-wrapper ${errors.email ? "has-error" : ""}`}>
                    <input 
                      type="email" 
                      id="contact-email"
                      className="contact-input" 
                      placeholder=" " 
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                      }}
                    />
                    <label htmlFor="contact-email" className="contact-label">Email Address</label>
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>

                  <div className={`input-field-wrapper ${errors.phone ? "has-error" : ""}`}>
                    <input 
                      type="text" 
                      id="contact-phone"
                      className="contact-input" 
                      placeholder=" " 
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                      }}
                    />
                    <label htmlFor="contact-phone" className="contact-label">Phone Number</label>
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                  </div>

                  <div className="input-field-wrapper">
                    <input 
                      type="text" 
                      id="contact-subject"
                      className="contact-input" 
                      placeholder=" " 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                    <label htmlFor="contact-subject" className="contact-label">Subject</label>
                  </div>

                  <div className={`input-field-wrapper full-width ${errors.projectDetails ? "has-error" : ""}`}>
                    <textarea 
                      id="contact-project"
                      className="contact-input textarea-input" 
                      placeholder=" " 
                      rows={2}
                      value={projectDetails}
                      onChange={(e) => {
                        setProjectDetails(e.target.value);
                        if (errors.projectDetails) setErrors(prev => ({ ...prev, projectDetails: "" }));
                      }}
                    />
                    <label htmlFor="contact-project" className="contact-label">Your Message</label>
                    {errors.projectDetails && <span className="error-text">{errors.projectDetails}</span>}
                  </div>

                </div>

                {/* Submission Actions */}
                <div className="form-submit-footer" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button 
                    type="submit" 
                    className={`send-request-btn liquid-glass-btn-primary ${isSubmitting ? "submitting" : ""}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="spinner"></div>
                    ) : (
                      <>
                        <FiSend size={16} />
                        <span>Submit Message</span>
                      </>
                    )}
                  </button>

                  {/* ── WhatsApp Instant Connect Option ── */}
                  {contactSettings.enableWhatsappButton !== false && (
                    <a 
                      href={getWhatsappUrl()} 
                      target="_blank" 
                      rel="noreferrer"
                      className="send-request-btn whatsapp-btn"
                    >
                      <FaWhatsapp size={18} />
                      <span>WhatsApp Direct</span>
                    </a>
                  )}

                  <AnimatePresence>
                    {submitStatus === "success" && (
                      <motion.div 
                        className="status-toast success"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <span>✓ Message saved & emailed! Confirmation sent to your inbox.</span>
                      </motion.div>
                    )}
                    {submitStatus === "error" && (
                      <motion.div 
                        className="status-toast error"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <span>✕ {submitErrorMessage}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </form>
            </motion.div>
          )}

        </div>

      </div>
    </section>
  );
}

export default Contact;
