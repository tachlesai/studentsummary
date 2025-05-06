import React from 'react';
import { isUserLoggedIn } from '../../utils/auth';

const HowItWorks = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">
            איך זה עובד?
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            שלושה שלבים פשוטים להפקת סיכומים אוטומטיים
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-indigo-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-4">הקלט את ההרצאה</h3>
            <p className="text-gray-600">הקלט את ההרצאה שלך באמצעות המיקרופון או העלה קובץ אודיו</p>
          </div>

          <div className="text-center p-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-indigo-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-4">עיבוד אוטומטי</h3>
            <p className="text-gray-600">המערכת מעבדת את ההקלטה ומפיקה תמלול מדויק</p>
          </div>

          <div className="text-center p-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-indigo-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-4">קבל סיכום</h3>
            <p className="text-gray-600">קבל סיכום מפורט של ההרצאה בפורמט PDF</p>
          </div>
        </div>

        <div className="flex justify-center mt-12">
          <a 
            href={isUserLoggedIn() ? '/dashboard' : '/signup'}
            className="inline-block px-6 py-3 text-base font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 w-64 text-center"
            onClick={(e) => {
              e.preventDefault();
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

export default HowItWorks;