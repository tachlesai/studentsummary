import React from 'react';
import { FiBook, FiUpload, FiStar, FiMessageSquare } from 'react-icons/fi';

const FeatureCard = ({ title, description, icon: Icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition">
    <div className="text-indigo-600 mb-4">
      <Icon size={24} />
    </div>
    <h3 className="font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{description}</p>
  </div>
);

const Features = () => {
  const features = [
    {
      title: "סיכום הרצאות ייחודי",
      description: "קבל סיכום מדויק ותמציתי של הרצאות וטיוטוב",
      icon: FiBook
    },
    {
      title: "צ'אט אינטראקטיבי",
      description: "שוחח עם הבינה המלאכותית על תוכן הקבצים שלך",
      icon: FiMessageSquare
    },
    {
      title: "העלה את החומר",
      description: "העלה קובץ PDF, הקלטה או קישור לטיוטוב",
      icon: FiUpload
    },
    {
      title: "מערכת שאלות",
      description: "קבל שאלות תרגול המבוססות על החומר הנלמד",
      icon: FiStar
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-12 text-indigo-600">
          הכלים שיעזרו לך ללמוד חכם יותר
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;