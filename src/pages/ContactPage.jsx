import React, { useEffect } from "react";
import Contact from "../components/home/Contact";
import "./ContactPage.css";

function ContactPage() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="contact-page-wrapper">
            <div className="contact-page-glow-orb contact-glow-1" aria-hidden="true" />
            <div className="contact-page-glow-orb contact-glow-2" aria-hidden="true" />
            <Contact />
        </div>
    );
}

export default ContactPage;
