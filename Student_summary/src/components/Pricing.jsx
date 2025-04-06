import React from 'react';
import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Pricing = () => {
  const plans = [
    {
      name: "מנוי חינמי",
      price: "0",
      description: "מושלם להתחלה ולהתנסות במערכת",
      features: [
        { text: "העלאת עד 5 הרצאות בחודש", included: true },
        { text: "חיסכון של עד 8 שעות בחודש", included: true },
        { text: "סיכום טקסט בסיסי", included: true },
        { text: "תמיכה בסיסית", included: true },
        { text: "תמלולים וסיכומים מהרצאות בלייב", included: false },
        { text: "אפשרות לחסוך הרצאות לחודש הבא", included: false },
        { text: "ייצוא לפורמטים שונים", included: false }
      ],
      cta: "התחל בחינם",
      popular: false,
      color: "gray"
    },
    {
      name: "מנוי פלוס",
      price: "37",
      description: "במחיר של סמבוסק ופיצה",
      features: [
        { text: "העלאת עד 12 הרצאות בחודש", included: true },
        { text: "תמלולים וסיכומים מהרצאות בלייב", included: true },
        { text: "סיכום טקסט מתקדם", included: true },
        { text: "תמיכה מועדפת", included: true },
        { text: "ייצוא לפורמטים שונים", included: true },
        { text: "אפשרות לחסוך הרצאות לחודש הבא", included: false },
        { text: "כלים מתקדמים לארגון וחיפוש", included: false }
      ],
      cta: "הצטרף עכשיו",
      popular: true,
      color: "indigo"
    },
    {
      name: "מנוי פרו",
      price: "75",
      description: "במחיר של מגש פיצה משפחתית",
      features: [
        { text: "העלאת עד 20 הרצאות בחודש", included: true },
        { text: "אפשרות לחסוך הרצאות לחודש הבא", included: true },
        { text: "תמלולים וסיכומים מהרצאות בלייב", included: true },
        { text: "סיכום טקסט מתקדם עם AI", included: true },
        { text: "תמיכה VIP", included: true },
        { text: "ייצוא לכל הפורמטים", included: true },
        { text: "כלים מתקדמים לארגון וחיפוש", included: true }
      ],
      cta: "שדרג לפרו",
      popular: false,
      color: "purple"
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wide">
            תמחור
          </span>
          <h2 className="mt-4 text-4xl font-bold text-gray-900">
            בחר את התוכנית המתאימה לך
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            מחירים פשוטים וברורים, ללא התחייבות ארוכת טווח. בחר את התוכנית המתאימה לצרכים שלך
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`
                relative rounded-2xl overflow-hidden transition-all duration-300
                ${plan.popular ? 'transform md:-translate-y-4 scale-105 shadow-xl z-10' : 'shadow-lg hover:shadow-xl'}
                bg-white border-2 ${plan.popular ? 'border-indigo-500' : 'border-gray-100'}
              `}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 left-0 bg-indigo-600 text-white text-center py-1 text-sm font-medium">
                  הכי פופולרי
                </div>
              )}
              
              <div className="p-8 pt-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  {plan.description}
                </p>
                
                <div className="flex items-baseline mb-8">
                  <span className="text-5xl font-extrabold text-gray-900">₪{plan.price}</span>
                  <span className="mr-2 text-gray-600">/חודש</span>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start">
                      {feature.included ? (
                        <Check className={`w-5 h-5 ml-2 mt-0.5 text-${plan.color}-500 flex-shrink-0`} />
                      ) : (
                        <X className="w-5 h-5 ml-2 mt-0.5 text-red-500 flex-shrink-0" />
                      )}
                      <span className={`${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Link to="/signup">
                  <button 
                    className={`
                      w-full py-3 px-6 rounded-lg font-medium transition-colors duration-200
                      ${plan.popular 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                        : plan.color === 'purple' 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }
                    `}
                  >
                    {plan.cta}
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        {/* FAQ or Additional Info */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            יש לך שאלות?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            אנחנו כאן כדי לעזור. צור איתנו קשר בכל שאלה לגבי התוכניות שלנו או כיצד TachlesAI יכול לעזור לך בלימודים.
          </p>
          <a 
            href="mailto:support@tachlesai.com" 
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            צור קשר עם התמיכה
          </a>
        </div>
      </div>
    </section>
  );
};

export default Pricing;