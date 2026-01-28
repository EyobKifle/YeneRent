import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import './LandingPage.css';

// Reusable FAQ Item Component
const FAQItem = ({ question, answer, index }) => (
    <details className="faq-item" data-animate="fade-in-up" style={{ transitionDelay: `${index * 0.1}s` }}>
        <summary>{question}</summary>
        <p>{answer}</p>
    </details>
);

// Data for the FAQ section
const faqData = [
    { question: "Can I use the system offline?", answer: "No, the system is cloud-based for real-time data sync and security, requiring an internet connection to access. However, some reporting data can be exported and viewed offline." },
    { question: "Is it compatible with Ethiopian tax rules?", answer: "Absolutely. Our system is specifically engineered to handle all relevant Ethiopian tax laws and reporting requirements automatically." },
    { question: "Do you offer multi-user access?", answer: "Yes, multi-user access with role-based permissions is available on our Professional and Enterprise plans, perfect for teams and businesses." },
    { question: "What security measures are in place to protect my data?", answer: "We use end-to-end encryption, multi-factor authentication, and secure cloud hosting to ensure your sensitive property and tenant data is always protected." }
];

// Data for the Testimonials section
const testimonialsData = [
    {
        quote: "This rental management system has transformed how I handle my properties. The tax automation alone saves me hours every month, and the Ethiopian compliance features are spot-on!",
        author: "Alemayehu T.",
        location: "Addis Ababa",
        avatar: "placeholder-avatar-1.jpg"
    },
    {
        quote: "Managing 15 properties used to be a nightmare. Now everything is centralized, easy to access, and I have real-time insights. Highly recommend for any property owner!",
        author: "Sofia G.",
        location: "Property Manager",
        avatar: "placeholder-avatar-2.jpg"
    },
    {
        quote: "The financial analytics are incredible. I can now track profitability across all my units and make data-driven decisions. The reporting features are exactly what I needed.",
        author: "Dawit K.",
        location: "Dire Dawa",
        avatar: "placeholder-avatar-3.jpg"
    },
    {
        quote: "As a landlord with multiple tenants, the tenant management tools have been a game-changer. Lease tracking, payment reminders, and document storage all in one place.",
        author: "Hanan A.",
        location: "Bahir Dar",
        avatar: "placeholder-avatar-4.jpg"
    }
];

const LandingPage = () => {
    const { t } = useLanguage();
    const demoVideoRef = useRef(null);

    // Simple video handler to ensure it loads
    const handleVideoPlay = (e) => {
        if (e.target.paused) e.target.play();
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && demoVideoRef.current) {
                        demoVideoRef.current.play();
                    }
                });
            },
            { threshold: 0.5 } // Play when 50% of the video is visible
        );

        if (demoVideoRef.current) {
            observer.observe(demoVideoRef.current);
        }

        return () => {
            if (demoVideoRef.current) {
                observer.unobserve(demoVideoRef.current);
            }
        };
    }, []);

    return (
        <>
        <main role="main">
            {/* --- 1. Hero Section (Home) --- */}
            <section id="home" className="hero-section">
                <div className="hero-content" data-animate="fade-in-left">
                    <h1 className="hero-title">{t('Simplify Rental Management — Track, Analyze, and Automate with Ease')}</h1>
                    <p>{t('Manage your entire rental property portfolio effortlessly. Our system provides powerful tools for tenant management, financial tracking, and automated tax reporting compliant with Ethiopian rules.')}</p>
                    <div className="hero-ctas">
                        <Link to="#demo" className="btn btn-primary btn-large">{t('Try Demo')}</Link>
                        <Link to="/trial-request" className="btn btn-secondary btn-large">{t('Request a Free Trial')}</Link>
                    </div>
                </div>
                <div className="hero-video" data-animate="fade-in-right">
                    {/* Removed autoplay, added onPlay, and made poster required for Web Vitals */}
                    <video
                        muted loop playsInline
                        poster="preview.jpg"
                        onLoadedData={handleVideoPlay}
                        // Note: controls are only useful if the video isn't just background fluff
                        // Consider removing `controls` if it's meant to be purely illustrative background.
                    >
                        <source src="/Images/Demo.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            </section>

            {/* --- 2. Features Overview (Cards) --- */}
            <section id="features-overview" className="section features-overview">
                <h2>{t('Core System Capabilities 🛠️')}</h2>
                <div className="feature-cards">
                    {[
                        { image: "/Images/Properties.png", title: t("Property & Tenant Management"), desc: t("Manage your entire portfolio from one comprehensive dashboard, including leases and tenant records.") },
                        { image: "/Images/Analytics.png", title: t("Financial Analytics"), desc: t("Track income, expenses, and profitability in real-time with insightful visual reports.") },
                        { image: "/Images/Payments.png", title: t("Tax Automation"), desc: t("Handle Ethiopian tax rules automatically, ensuring compliance and accurate reporting.") },
                        { image: "/Images/Documents.png", title: t("Smart Reporting"), desc: t("Export financial summaries and operational reports with a single, quick click.") },
                        { image: "/Images/Leases.png", title: t("Document Management"), desc: t("Upload, organize, and securely access all your important property and tenant files in one place.") },
                        { image: "/Images/Tenants.png", title: t("Security & Compliance"), desc: t("Enterprise-grade security and full data compliance to protect sensitive information.") }
                    ].map((feature) => (
                        <div key={feature.title} className="feature-card" data-animate="fade-in-up">
                            <h3>{feature.title}</h3>
                            <p>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- 3. Detailed Features (Alternating Layout) --- */}
            <section className="section detailed-features">
                <h2>{t('Deep Dive into Our Modules 🔍')}</h2>

                <div className="detailed-feature-item feature-left" data-animate="slide-in-left">
                    <div className="feature-illustration">
                        <img src="/Images/Properties.png" alt="Property & Tenant Management Screenshot" loading="lazy" />
                    </div>
                    <div className="feature-text">
                        <h3>{t('Comprehensive Dashboard & Core Management')}</h3>
                        <p>{t('Get a bird\'s-eye view of your portfolio with actionable insights and quick links to core management functions. Effortlessly manage property details, unit assignments, and tenant lifecycle.')}</p>
                        <Link to="#" className="learn-more">{t('Learn More &rarr;')}</Link>
                    </div>
                </div>

                <div className="detailed-feature-item feature-right" data-animate="slide-in-right">
                    <div className="feature-illustration">
                        <img src="/Images/Analytics.png" alt="Financial Analytics Screenshot" loading="lazy" />
                    </div>
                    <div className="feature-text">
                        <h3>{t('Financial Analytics & Reporting')}</h3>
                        <p>{t('Visualize your cash flow, identify profit drivers, and minimize losses with our advanced, integrated financial tools and customizable reporting suite.')}</p>
                        <Link to="#" className="learn-more">{t('Learn More &rarr;')}</Link>
                    </div>
                </div>

                <div className="detailed-feature-item feature-left" data-animate="slide-in-left">
                    <div className="feature-illustration">
                        <img src="/Images/Payments.png" alt="Tax Automation Screenshot" loading="lazy" />
                    </div>
                    <div className="feature-text">
                        <h3>{t('Property & Tenant Management')}</h3>
                        <p>{t('Manage your entire portfolio from one comprehensive dashboard, including leases and tenant records with automated workflows.')}</p>
                        <Link to="#" className="learn-more">{t('Learn More &rarr;')}</Link>
                    </div>
                </div>
            </section>

            {/* --- 4. Demo Section --- */}
            <section id="demo" className="demo-section">
                <h2>{t('See Our System in Action 🎬')}</h2>
                <div className="demo-player" data-animate="fade-in-up">
                    <video
                        ref={demoVideoRef}
                        controls
                        muted
                        poster="preview.jpg"
                        className="demo-preview"
                    >
                        <source src="/Images/Demo.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
                <Link to="demo-page.html" className="btn btn-primary btn-large">{t('See how it works — Explore the Demo')}</Link>
            </section>

            {/* --- 5. Pricing Section --- */}
            <section id="pricing" className="section pricing-section">
                <h2>{t('Clear & Flexible Pricing 💰')}</h2>
                <div className="pricing-tiers">
                    <div className="price-card" data-animate="fade-in-up">
                        <h3>{t('Basic')}</h3>
                        <p className="price">{t('ETB 1499 / month')}</p>
                        <ul>
                            <li><i className="fas fa-check"></i> {t('Single Property Management')}</li>
                            <li><i className="fas fa-check"></i> {t('Basic Financial Tracking')}</li>
                            <li className="incompatible"><i className="fas fa-times"></i> {t('Tax Automation (Add-on)')}</li>
                            <li className="incompatible"><i className="fas fa-times"></i> {t('Dedicated Support')}</li>
                        </ul>
                        <Link to="signup.html" className="btn btn-secondary">{t('Get Started')}</Link>
                    </div>
                    <div className="price-card popular" data-animate="fade-in-up" style={{ transitionDelay: '0.1s' }}>
                        <h3>{t('Professional')}</h3>
                        <span className="badge">{t('Most Popular')}</span>
                        <p className="price">{t('ETB 3999 / month')}</p>
                        <ul>
                            <li><i className="fas fa-check"></i> {t('Up to 20 Properties')}</li>
                            <li><i className="fas fa-check"></i> {t('Advanced Analytics & Reporting')}</li>
                            <li><i className="fas fa-check"></i> {t('Tax Automation')}</li>
                            <li><i className="fas fa-check"></i> {t('Priority Email Support')}</li>
                        </ul>
                        <Link to="signup.html?plan=pro" className="btn btn-primary">{t('Start Trial')}</Link>
                    </div>
                    <div className="price-card" data-animate="fade-in-up" style={{ transitionDelay: '0.2s' }}>
                        <h3>{t('Enterprise')}</h3>
                        <p className="price">{t('Contact Us')}</p>
                        <ul>
                            <li><i className="fas fa-check"></i> {t('Unlimited Properties')}</li>
                            <li><i className="fas fa-check"></i> {t('Custom Integrations')}</li>
                            <li><i className="fas fa-check"></i> {t('Dedicated Account Manager')}</li>
                            <li><i className="fas fa-check"></i> {t('SLA & 24/7 Support')}</li>
                        </ul>
                        <Link to="contact.html?plan=enterprise" className="btn btn-secondary">{t('Contact Sales')}</Link>
                    </div>
                </div>
                <Link to="pricing.html" className="compare-link">{t('Compare All Plans in Detail &rarr;')}</Link>
            </section>

            {/* --- 6. Testimonials Section --- */}
            <section className="testimonials-section">
                <h2>{t('Trusted by Property Owners Across Ethiopia ⭐')}</h2>
                <div className="testimonial-grid">
                    {testimonialsData.slice(0, 2).map((testimonial, index) => (
                        <blockquote key={testimonial.author} className="testimonial-card" data-animate="fade-in-up" style={{ transitionDelay: `${index * 0.1}s` }}>
                            <p>"{t(testimonial.quote)}"</p>
                            <footer>
                                <img src={testimonial.avatar} alt={`${testimonial.author}'s photo`} className="avatar" loading="lazy" />
                                <cite>— {testimonial.author}, {testimonial.location}</cite>
                            </footer>
                        </blockquote>
                    ))}
                </div>
                {/* Improvement: Placeholder for a real carousel component */}
                <div className="carousel-nav" data-animate="fade-in">
                    <button aria-label="Previous Testimonial"> <i className="fas fa-chevron-left"></i> </button>
                    <button aria-label="Next Testimonial"> <i className="fas fa-chevron-right"></i> </button>
                </div>
            </section>

            {/* --- 7. FAQ Section --- */}
            <section className="section faq-section">
                <h2>{t('Frequently Asked Questions ❓')}</h2>
                <div className="faq-container">
                    {faqData.map((item, index) => (
                        <FAQItem key={item.question} question={t(item.question)} answer={t(item.answer)} index={index} />
                    ))}
                </div>
            </section>
        </main>
        </>
    );
};

export default LandingPage;