import React from 'react';
import { isUserLoggedIn } from '../utils/auth';

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
      color: "white"
    },
    {
      name: "מנוי פלוס",
      price: "37",
      description: "במחיר של קפה ומאפה תקבלו:",
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
      ctaLink: "https://pay.sumit.co.il/cozxmk/ehj27b/ehr093/payment/",
      popular: true,
      color: "indigo"
    },
    {
      name: "מנוי פרו",
      price: "75",
      description: " במחיר של מגש פיצה משפחתית תקבלו:",
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
      ctaLink: "https://pay.sumit.co.il/cozxmk/ehj27b/ehqy95/payment/",
      popular: false,
      color: "purple"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">
            תכניות ומחירים
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            בחר את התכנית שמתאימה לך
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white border border-gray-100">
            <h3 className="text-2xl font-bold mb-4">חינם</h3>
            <p className="text-gray-600 mb-6">התחלה מהירה</p>
            <ul className="space-y-4 mb-8">
              <li>5 הקלטות בחודש</li>
              <li>סיכומים בסיסיים</li>
              <li>תמיכה בדוא"ל</li>
            </ul>
            <a 
              href={isUserLoggedIn() ? '/dashboard' : '/signup'}
              className="inline-block w-full px-6 py-3 text-base font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = isUserLoggedIn() ? '/dashboard' : '/signup';
              }}
            >
              התחל בחינם
            </a>
          </div>

          <div className="p-8 rounded-2xl bg-white border-2 border-indigo-600">
            <h3 className="text-2xl font-bold mb-4">מקצועי</h3>
            <p className="text-gray-600 mb-6">₪49 לחודש</p>
            <ul className="space-y-4 mb-8">
              <li>הקלטות בלתי מוגבלות</li>
              <li>סיכומים מתקדמים</li>
              <li>תמיכה בדוא"ל וצ'אט</li>
              <li>ייצוא PDF</li>
            </ul>
            <a 
              href={isUserLoggedIn() ? '/dashboard' : '/signup'}
              className="inline-block w-full px-6 py-3 text-base font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = isUserLoggedIn() ? '/dashboard' : '/signup';
              }}
            >
              התחל בחינם
            </a>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-gray-100">
            <h3 className="text-2xl font-bold mb-4">ארגוני</h3>
            <p className="text-gray-600 mb-6">התאמה אישית</p>
            <ul className="space-y-4 mb-8">
              <li>הקלטות בלתי מוגבלות</li>
              <li>סיכומים מתקדמים</li>
              <li>תמיכה 24/7</li>
              <li>API מותאם</li>
              <li>שילוב עם מערכות קיימות</li>
            </ul>
            <a 
              href={isUserLoggedIn() ? '/dashboard' : '/signup'}
              className="inline-block w-full px-6 py-3 text-base font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = isUserLoggedIn() ? '/dashboard' : '/signup';
              }}
            >
              התחל בחינם
            </a>
          </div>
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