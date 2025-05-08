import React from 'react';
import { Check, X } from 'lucide-react';

const ComparisonTable = () => {
  const features = [
    {
      name: "זמן סיכום חומר",
      traditional: "3-4 שעות",
      tachles: "2-3 דקות",
    },
    {
      name: "דיוק בתוכן",
      traditional: "תלוי בריכוז",
      tachles: "דיוק של 95%",
    },
    {
      name: "זמינות",
      traditional: "מוגבל לשעות ערנות",
      tachles: "24/7 זמינות",
    },
    {
      name: "התאמה אישית",
      traditional: "חד-גונית",
      tachles: "מותאם לסגנון הלמידה שלך",
    },
    {
      name: "ארגון מידע",
      traditional: "ידני ומסורבל",
      tachles: "אוטומטי ומאורגן",
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wide">
            השוואה
          </span>
          <h2 className="mt-4 text-4xl font-bold text-gray-900">
            למידה מסורתית מול TachlesAI
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            ראה איך TachlesAI משנה את חווית הלמידה שלך לעומת השיטה המסורתית
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-hidden rounded-2xl shadow-lg border border-gray-100">
          <div className="grid grid-cols-3 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 font-semibold text-gray-900">
            <div className="text-right">מאפיין</div>
            <div className="text-center">למידה מסורתית</div>
            <div className="text-center">TachlesAI</div>
          </div>

          {features.map((feature, index) => (
            <div 
              key={index}
              className={`grid grid-cols-3 p-6 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="text-right font-medium text-gray-900">
                {feature.name}
              </div>
              <div className="text-center text-gray-600 flex items-center justify-center">
                <span className="bg-red-50 text-red-700 px-4 py-1 rounded-full text-sm">
                  {feature.traditional}
                </span>
              </div>
              <div className="text-center text-gray-600 flex items-center justify-center">
                <span className="bg-green-50 text-green-700 px-4 py-1 rounded-full text-sm">
                  {feature.tachles}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* טבלת השוואה קטנה בין TachlesAI למתחרים */}
        <div style={{ marginTop: '40px', marginBottom: '40px', direction: 'rtl', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '100%',
            maxWidth: '540px',
            background: 'linear-gradient(90deg, #e0e7ff 0%, #f3f6fa 100%)',
            borderRadius: '22px',
            boxShadow: '0 4px 24px 0 rgba(99,102,241,0.10)',
            overflow: 'hidden',
            padding: '0',
            border: '1.5px solid #e0e7ff',
            fontFamily: 'Varela Round, Arial, sans-serif'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4f46e5', margin: '0', padding: '24px 0 8px 0', textAlign: 'center', letterSpacing: '-1px', background: 'none', fontFamily: 'inherit' }}>
              <span style={{fontSize:'1.7rem', verticalAlign:'middle', marginLeft:'8px'}}>✨</span>
              למה לבחור ב-TachlesAI ולא במתחרים?
            </h3>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: 'none', fontFamily: 'inherit' }}>
              <thead>
                <tr style={{ background: 'rgba(99,102,241,0.08)' }}>
                  <th style={{ padding: '16px', fontWeight: 900, color: '#6366f1', fontSize: '1.15rem', borderBottom: '2px solid #e0e7ff', textAlign: 'center', background: 'rgba(99,102,241,0.10)', fontFamily: 'inherit', letterSpacing: '-0.5px' }}>TachlesAI 🚀</th>
                  <th style={{ padding: '16px', fontWeight: 900, color: '#64748b', fontSize: '1.15rem', borderBottom: '2px solid #e0e7ff', textAlign: 'center', background: 'rgba(203,213,225,0.10)', fontFamily: 'inherit', letterSpacing: '-0.5px' }}>מתחרים 🏢</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '18px', fontWeight: 700, color: '#222', background: '#f1f5ff', borderRight: '2.5px solid #6366f1', textAlign: 'center', fontSize: '1.08rem', fontFamily: 'inherit', letterSpacing: '-0.2px' }}>
                    <span style={{fontSize:'1.2rem', marginLeft:'6px'}}>💙</span>
                    יחס אישי, מיקוד אמיתי בצרכי הסטודנט, והצלחה שלך באמת חשובה לנו
                  </td>
                  <td style={{ padding: '18px', color: '#555', background: '#f9fafb', textAlign: 'center', fontSize: '1.08rem', fontFamily: 'inherit', letterSpacing: '-0.2px' }}>
                    <span style={{fontSize:'1.2rem', marginLeft:'6px'}}>😐</span>
                    פתרונות כלליים, פחות אכפתיות להצלחה אישית
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '18px', color: '#222', background: '#f1f5ff', borderRight: '2.5px solid #6366f1', textAlign: 'center', fontWeight: 600, fontSize: '1.08rem', fontFamily: 'inherit', letterSpacing: '-0.2px' }}>
                    <span style={{fontSize:'1.2rem', marginLeft:'6px'}}>🎯</span>
                    התאמה אישית לשאלות, תרגול ממוקד, ליווי עד ההצלחה
                  </td>
                  <td style={{ padding: '18px', color: '#555', background: '#f9fafb', textAlign: 'center', fontSize: '1.08rem', fontFamily: 'inherit', letterSpacing: '-0.2px' }}>
                    <span style={{fontSize:'1.2rem', marginLeft:'6px'}}>📄</span>
                    מענה שטחי, לא מותאם אישית
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '18px', color: '#222', background: '#f1f5ff', borderRight: '2.5px solid #6366f1', textAlign: 'center', fontWeight: 600, fontSize: '1.08rem', fontFamily: 'inherit', letterSpacing: '-0.2px' }}>
                    <span style={{fontSize:'1.2rem', marginLeft:'6px'}}>🤖</span>
                    AI שמבין אותך באמת!
                  </td>
                  <td style={{ padding: '18px', color: '#555', background: '#f9fafb', textAlign: 'center', fontSize: '1.08rem', fontFamily: 'inherit', letterSpacing: '-0.2px' }}>
                    <span style={{fontSize:'1.2rem', marginLeft:'6px'}}>🤷‍♂️</span>
                    AI גנרי, לא מתעמק בצרכים שלך
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
