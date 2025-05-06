import React from 'react';
import { Link } from 'react-router-dom';
import { isUserLoggedIn } from '../utils/auth';
import { FiMic, FiBook, FiClock, FiBarChart2, FiDownload, FiShare2 } from 'react-icons/fi';

const Features = () => {
  // Direct console log
  console.log('Features component rendering');
  console.log('isUserLoggedIn:', isUserLoggedIn());
  console.log('localStorage token:', localStorage.getItem('token'));
  console.log('localStorage user:', localStorage.getItem('user'));

  const features = [
    {
      icon: <FiMic className="w-6 h-6 text-indigo-600" />,
      title: 'הקלטה קלה',
      description: 'הקלט את ההרצאות שלך בקלות ובמהירות'
    },
    {
      icon: <FiBook className="w-6 h-6 text-indigo-600" />,
      title: 'סיכומים אוטומטיים',
      description: 'קבל סיכומים מפורטים של ההרצאות שלך'
    },
    {
      icon: <FiClock className="w-6 h-6 text-indigo-600" />,
      title: 'חיסכון בזמן',
      description: 'חסוך שעות של כתיבת סיכומים'
    },
    {
      icon: <FiBarChart2 className="w-6 h-6 text-indigo-600" />,
      title: 'למידה חכמה',
      description: 'התמקד בחומר החשוב באמת'
    },
    {
      icon: <FiDownload className="w-6 h-6 text-indigo-600" />,
      title: 'ייצוא PDF',
      description: 'שמור את הסיכומים שלך בפורמט PDF'
    },
    {
      icon: <FiShare2 className="w-6 h-6 text-indigo-600" />,
      title: 'שיתוף קל',
      description: 'שתף את הסיכומים שלך עם חברים'
    }
  ];

  return (
    <section id="solutions" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wide">
            היתרונות שלנו
          </span>
          <h2 className="mt-4 text-4xl font-bold text-gray-900">
            למה לבחור ב-TachlesAI?
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            הפלטפורמה שלנו משלבת טכנולוגיה מתקדמת עם חווית משתמש פשוטה כדי להפוך את הלמידה שלך ליעילה יותר
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-8 rounded-2xl bg-white border border-gray-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <a 
            href={isUserLoggedIn() ? '/dashboard' : '/signup'}
            className="inline-block px-6 py-3 text-base font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 w-64 text-center"
            onClick={(e) => {
              e.preventDefault();
              console.log('Button clicked');
              window.location.href = isUserLoggedIn() ? '/dashboard' : '/signup';
            }}
          >
            התחל עכשיו בחינם
          </a>
        </div>
      </div>
    </section>
  );
};

export default Features;