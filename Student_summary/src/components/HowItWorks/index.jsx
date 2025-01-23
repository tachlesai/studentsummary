import React from 'react';
import { Upload, Sparkles, Download, ArrowRight } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <Upload className="w-8 h-8 text-white" />,
      title: "העלאת החומר",
      description: "העלה קובץ PDF או שתף קישור ליוטיוב של ההרצאה שברצונך לסכם"
    },
    {
      icon: <Sparkles className="w-8 h-8 text-white" />,
      title: "עיבוד חכם",
      description: "הבינה המלאכותית שלנו מנתחת את החומר ומייצרת סיכום מותאם אישית"
    },
    {
      icon: <Download className="w-8 h-8 text-white" />,
      title: "קבלת הסיכום",
      description: "קבל סיכום מובנה, ברור ותמציתי, מוכן ללמידה יעילה"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wide">
            תהליך פשוט ומהיר
          </span>
          <h2 className="mt-4 text-4xl font-bold text-gray-900">
            איך TachlesAI עובד?
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            שלושה שלבים פשוטים שהופכים את הלמידה שלך ליעילה ומהירה יותר
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 right-full w-full h-0.5 bg-indigo-200 transform -translate-y-1/2">
                  <ArrowRight className="absolute left-0 top-1/2 transform -translate-y-1/2 text-indigo-400" />
                </div>
              )}
              
              {/* Step Card */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center mb-6 mx-auto">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Demo Section */}
        <div className="mt-20 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto">
            <h3 className="text-2xl font-semibold mb-6">
              רוצה לראות איך זה עובד?
            </h3>
            <p className="text-gray-600 mb-8">
              נסה את TachlesAI בחינם עכשיו וגלה כמה פשוט זה יכול להיות
            </p>
            <button className="bg-indigo-600 text-white px-8 py-4 rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-medium text-lg">
              התנסה בחינם ←
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;