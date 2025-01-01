import React from 'react';
import './StudentStories.css';

const StudentStories = () => {
  const stories = [
    {
      quote: '"KalilAI עזר לי להבין את החומר הרבה יותר טוב. הסיכומים האוטומטיים חסכו לי שעות של עבודה"',
      name: 'רון כהן',
      title: 'סטודנט לכלכלה, אוניברסיטת תל אביב',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
    },
    {
      quote: '"השימוש בצ׳אט האינטראקטיבי עזר לי להבין נושאים מורכבים בצורה פשוטה ומהירה"',
      name: 'מיכל לוי',
      title: 'סטודנטית למשפטים, האוניברסיטה העברית',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg'
    },
    {
      quote: '"עזרת השאלות האוטומטיות עזרה לי להתכונן למבחנים בצורה יעילה הרבה יותר"',
      name: 'דניאל אברהם',
      title: 'סטודנט להנדסה, הטכניון',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg'
    }
  ];

  return (
    <section className="student-stories">
      <h2 className="section-title">סטודנטים מספרים</h2>
      <p className="section-subtitle">הצצה לאלפי סטודנטים שכבר משתמשים ב-KalilAI כדי ללמוד בצורה חכמה יותר</p>
      
      <div className="stories-container">
        {stories.map((story, index) => (
          <div key={index} className="story-card">
            <p className="quote">{story.quote}</p>
            <div className="author">
              <img src={story.avatar} alt={story.name} className="avatar" />
              <div className="author-info">
                <h3 className="author-name">{story.name}</h3>
                <p className="author-title">{story.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StudentStories;