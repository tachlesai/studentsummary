import React from 'react';
import { Link } from 'react-router-dom';
import { isUserLoggedIn } from '../utils/auth';
import { FiCheck } from 'react-icons/fi';

const Pricing = () => {
  const isLoggedIn = isUserLoggedIn();
  const plans = [
    {
      name: 'חינם',
      price: '0',
      features: [
        'הקלטה של עד 5 דקות',
        'סיכום בסיסי',
        'שמירת סיכומים',
        'תמיכה בדואר אלקטרוני'
      ]
    },
    {
      name: 'מקצועי',
      price: '49',
      features: [
        'הקלטה ללא הגבלה',
        'סיכום מתקדם',
        'שמירת סיכומים',
        'תמיכה בדואר אלקטרוני',
        'עדיפות בעיבוד'
      ]
    }
  ];

  return (
    <section className="pricing">
      <h2 className="section-title">תוכניות ומחירים</h2>
      <p className="section-subtitle">בחר את התוכנית שמתאימה לך</p>
      
      <div className="plans-container">
        {plans.map((plan, index) => (
          <div key={index} className="plan-card">
            <h3 className="plan-name">{plan.name}</h3>
            <div className="plan-price">
              <span className="price-amount">{plan.price}</span>
              <span className="price-currency">₪</span>
              <span className="price-period">/חודש</span>
            </div>
            <ul className="plan-features">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="feature-item">
                  <FiCheck className="feature-icon" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link to={isLoggedIn ? "/dashboard" : "/signup"}>
              <button className="plan-button">
                התחל בחינם
              </button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Pricing; 