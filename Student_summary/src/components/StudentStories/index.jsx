import React from 'react';
import { Star, Quote } from 'lucide-react';

const StudentStories = () => {
  const testimonials = [
    {
      name: "יעל כהן",
      role: "סטודנטית לרפואה",
      image: "/path-to-image-1.jpg", // יש להחליף בנתיב התמונה האמיתי
      quote: "TachlesAI חסך לי שעות של סיכומים. עכשיו אני יכולה להתמקד בהבנה במקום בהעתקה.",
      university: "האוניברסיטה העברית",
      rating: 5
    },
    {
      name: "אמיר לוי",
      role: "סטודנט להנדסה",
      image: "/path-to-image-2.jpg", // יש להחליף בנתיב התמונה האמיתי
      quote: "המערכת מדהימה ביכולת שלה לזהות את הנקודות החשובות. חוסך המון זמן יקר!",
      university: "הטכניון",
      rating: 5
    },
    {
      name: "שירה גולן",
      role: "סטודנטית למשפטים",
      image: "/path-to-image-3.jpg", // יש להחליף בנתיב התמונה האמיתי
      quote: "השירות שינה לחלוטין את חווית הלמידה שלי. הסיכומים מדויקים ומובנים.",
      university: "אוניברסיטת תל אביב",
      rating: 5
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wide">
            חוות דעת
          </span>
          <h2 className="mt-4 text-4xl font-bold text-gray-900">
            מה הסטודנטים אומרים
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            אלפי סטודנטים כבר משתמשים ב-TachlesAI ומשפרים את הלמידה שלהם
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative"
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <Quote className="w-4 h-4 text-white" />
              </div>

              {/* Content */}
              <div className="mb-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">
                  "{testimonial.quote}"
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="mr-4">
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <div className="text-sm text-gray-600">
                    <p>{testimonial.role}</p>
                    <p>{testimonial.university}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
            <div className="text-4xl font-bold text-indigo-600 mb-2">+5,000</div>
            <div className="text-gray-600">סטודנטים פעילים</div>
          </div>
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
            <div className="text-4xl font-bold text-indigo-600 mb-2">95%</div>
            <div className="text-gray-600">שביעות רצון</div>
          </div>
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
            <div className="text-4xl font-bold text-indigo-600 mb-2">80%</div>
            <div className="text-gray-600">חיסכון בזמן</div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <button className="bg-indigo-600 text-white px-8 py-4 rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-medium text-lg">
            הצטרף למשתמשים המרוצים שלנו ←
          </button>
        </div>
      </div>
    </section>
  );
};

export default StudentStories;