import React from 'react';
import './HowItWorks.css';
import { FiUpload, FiStar, FiBook } from 'react-icons/fi';

const HowItWorks = () => {
  const steps = [
    {
      icon: <FiUpload />,
      title: 'העלה את החומר',
      description: 'העלה קובץ PDF, הקלטה או קישור לטיוטוב',
      number: '1'
    },
    {
      icon: <FiStar />,
      title: 'הבינה המלאכותית מעבדת',
      description: 'המערכת מנתחת את החומר ומייצרת תוכן מותאם אישית',
      number: '2'
    },
    {
      icon: <FiBook />,
      title: 'התחל ללמוד',
      description: 'קבל סיכומים, שאלות תשובות, והסברים מותאמים אישית',
      number: '3'
    }
  ];

  return (
    <section className="how-it-works">
      <h2 className="section-title">איך זה עובד?</h2>
      <p className="section-subtitle">בשלושה צעדים פשוטים תוכל להתחיל ללמוד בצורה חכמה יותר</p>
      
      <div className="steps-container">
        {steps.map((step, index) => (
          <div key={index} className="step-card">
            <div className="step-number">{step.number}</div>
            <div className="step-icon">{step.icon}</div>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-description">{step.description}</p>
          </div>
        ))}
      </div>
      
      <button className="cta-button">תתחיל ללמוד קשה →</button>
    </section>
  );
};

export default HowItWorks;