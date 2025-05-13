import React, { useState } from 'react';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqData = [
    {
      question: "האם האתר מאובטח?",
      answer: "כן, ב-TachlesAI האבטחה שלך היא בעדיפות עליונה וכל המידע שלך מוצפן"
    },
    {
      question: "איזה סוג הרצאות אני יכול לסכם?",
      answer: "כל סוג של הרצאות שתצטרך"
    },
    {
      question: "אילו סוגי קבצי אודיו נתמכים?",
      answer: "כל סוגי קבצי האודיו וגם קישורי YouTube"
    },
    {
      question: "האם אני יכול לבטל בכל עת?",
      answer: "כן! בכל זמן שתרצה תוכל לבטל ללא שאלות מיותרות"
    },
    {
      question: "איך ליצור קשר עם התמיכה?",
      answer: "אנא צרו קשר באמצעות אימייל"
    },
    // שאלות נוספות
    {
      question: "כמה זמן לוקח לקבל סיכום?",
      answer: "הסיכומים מוכנים תוך דקות ספורות, תלוי באורך ההרצאה"
    },
    {
      question: "האם אפשר לערוך את הסיכומים?",
      answer: "כן, תוכל לערוך ולהתאים אישית את כל הסיכומים שתקבל"
    },
    {
      question: "האם יש הגבלה על כמות ההרצאות?",
      answer: "תלוי בחבילה שבחרת. יש לנו מגוון חבילות המתאימות לצרכים שונים"
    },
    {
      question: "באילו שפות האתר תומך?",
      answer: "האתר תומך בעברית ובאנגלית, עם תמיכה בשפות נוספות בקרוב"
    },
    {
      question: "האם אפשר לשתף סיכומים עם חברים?",
      answer: "כן, ניתן לשתף סיכומים בקלות עם חברים ועמיתים"
    },
    {
      question: "האם יש אפליקציה לנייד?",
      answer: "בקרוב! אנחנו עובדים על אפליקציה שתהיה זמינה ל-iOS ו-Android"
    },
    {
      question: "האם הסיכומים נשמרים לצפייה מאוחרת?",
      answer: "כן, כל הסיכומים נשמרים בחשבון שלך ונגישים בכל זמן"
    }
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div style={{
      padding: '80px 20px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: 'white'
    }}>
      <h2 style={{
        fontSize: '2.5rem',
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: '3rem',
        color: '#1a365d',
        position: 'relative'
      }}>
        <span style={{ 
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: '-20px',
          fontSize: '3rem'
        }}></span>
        שאלות נפוצות
      </h2>

      <div style={{
        display: 'grid',
        gap: '1rem',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {faqData.map((item, index) => (
          <div 
            key={index} 
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              boxShadow: activeIndex === index ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
              transform: activeIndex === index ? 'scale(1.02)' : 'scale(1)'
            }}
          >
            <button
              onClick={() => toggleAccordion(index)}
              style={{
                width: '100%',
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: activeIndex === index ? '#f8fafc' : 'white',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'right',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#1a365d'
              }}
            >
              {item.question}
              <span style={{
                fontSize: '1.5rem',
                color: '#6366f1',
                transition: 'transform 0.3s ease',
                transform: activeIndex === index ? 'rotate(45deg)' : 'rotate(0)',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#eef2ff',
                borderRadius: '50%'
              }}>
                +
              </span>
            </button>
            <div style={{
              maxHeight: activeIndex === index ? '500px' : '0',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              backgroundColor: '#f8fafc',
              padding: activeIndex === index ? '1.5rem' : '0',
              borderTop: activeIndex === index ? '1px solid #e5e7eb' : 'none'
            }}>
              <p style={{
                margin: '0',
                color: '#4b5563',
                fontSize: '1rem',
                lineHeight: '1.6'
              }}>
                {item.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
