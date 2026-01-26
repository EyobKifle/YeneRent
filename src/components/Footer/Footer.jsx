import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css'; // Using CSS Modules for scoped styling

function Footer() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would send this data to your API
    console.log('Form submitted:', formData);
    alert('Thank you for your message!');
    setFormData({ name: '', email: '', message: '' }); // Reset form
  };

  return (
    <footer id="contact" className={styles.footer}>
      <div className={styles.footerMain}>
        <div className={`${styles.footerColumn} ${styles.footerAbout}`}>
          <h4>Yene Rent</h4>
          <p>Simplifying rental management with powerful, intuitive software designed for property owners in Ethiopia.</p>
          <div className={styles.socialLinks}>
            <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
            <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
            <a href="#" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
            <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
          </div>
        </div>
        <div className={`${styles.footerColumn} ${styles.footerContact}`}>
          <h4>Contact Us</h4>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <input
                type="text"
                id="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                type="email"
                id="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="message" className="sr-only">Message</label>
              <textarea
                id="message"
                placeholder="Your Message"
                rows="4"
                value={formData.message}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary">Send Message</button>
          </form>
        </div>
        <div className={`${styles.footerColumn} ${styles.footerQuickLinks}`}>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/#home">Home</a></li>
            <li><a href="/#features-overview">Features</a></li>
            <li><a href="/#demo">Demo</a></li>
            <li><a href="/#pricing">Pricing</a></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className={styles.copyright}>
        &copy; {new Date().getFullYear()} YeneRent. All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;