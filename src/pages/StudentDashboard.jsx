import React, { useState } from 'react';

const [summaryOptions, setSummaryOptions] = useState({
  style: 'detailed',
  format: 'bullets',
  language: 'he',
  maxPoints: 10
});

// Add tooltip content
const styleTooltips = {
  concise: {
    title: 'סיכום תמציתי',
    description: 'נקודות מפתח בלבד, כתובות כפריטים קצרים. אידיאלי לסקירה מהירה.',
    example: '• תכנן את השבוע מראש כדי להישאר על המסלול\n• חלק משימות לחלקים קטנים\n• הפסקות קצרות מגבירות את הריכוז'
  },
  detailed: {
    title: 'סיכום מפורט מלא',
    description: 'סיכום מלא ומבני המכסה את כל ההסברים, ההגדרות והדוגמאות. מתאים כתחליף להרצאה.',
    example: 'ההרצאה הדגישה את החשיבות של תכנון השבוע מראש לניהול עומס אקדמי. המרצה המליץ על חלוקת משימות גדולות ליחידות קטנות יותר ושימוש בטכניקות כמו פומודורו לריכוז טוב יותר.'
  },
  narrative: {
    title: 'סיכום נרטיבי קצר',
    description: 'פסקה קצרה וקריאה המסכמת את הרעיונות המרכזיים בסגנון זורם.',
    example: 'ההרצאה הציגה טכניקות מעשיות לניהול זמן בחיים האקדמיים. הסטודנטים עודדו לתכנן לוחות זמנים שבועיים, לחלק משימות לחלקים ולקחת הפסקות קבועות לריכוז טוב יותר.'
  },
  thematic: {
    title: 'סיכום תמטי/מחולק',
    description: 'מחלק את הסיכום לסעיפים לפי נושאים עם כותרות. עוזר לנווט בתוכן.',
    example: 'תכנון שבועי\n– עוזר לנהל זמן ולהימנע מלחץ.\nחלוקת משימות\n– משימות קטנות הופכות פרויקטים גדולים לניהוליים.'
  },
  qa: {
    title: 'סיכום שאלות ותשובות',
    description: 'הופך את ההרצאה לסט של זוגות שאלה-תשובה. טוב לתרגול ובדיקה עצמית.',
    example: 'ש: מדוע תכנון שבועי חשוב?\nת: זה עוזר להישאר מאורגן ולהימנע מלחץ של רגע אחרון.'
  },
  glossary: {
    title: 'סיכום מילון מונחים',
    description: 'מפרט מונחים והגדרות שהוסברו או הוזכרו במהלך ההרצאה.',
    example: 'פומודורו: טכניקה שבה לומדים 25 דקות ונוטלים הפסקה של 5 דקות.\nחלוקת משימות: חלוקת משימות גדולות לחלקים קטנים וניהוליים.'
  },
  steps: {
    title: 'סיכום צעד אחר צעד',
    description: 'מתאר רצף או תהליך שנדון במהלך ההרצאה בצעדים ממוספרים.',
    example: '1. רשום את כל המשימות לשבוע\n2. חלק כל משימה לתתי-משימות\n3. תזמן משימות לאורך השבוע\n4. השתמש בהפסקות לשמירה על ריכוז'
  },
  tldr: {
    title: 'סיכום TL;DR',
    description: 'משפט אחד שתופס את המסר המרכזי של כל ההרצאה.',
    example: 'טכניקות ניהול זמן כמו תכנון שבועי והפסקות קצרות יכולות לשפר משמעותית את הביצועים האקדמיים.'
  }
};

{/* Summary Options */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">סוג פלט</label>
    <select
      value={outputType}
      onChange={handleOutputTypeChange}
      className="w-full p-3 border border-gray-300 rounded-md font-sans shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      dir="rtl"
    >
      <option value="summary">סיכום</option>
      <option value="transcript">תמלול בלבד</option>
    </select>
  </div>
  
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">סגנון</label>
      <div className="group relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-96 bg-white p-4 rounded-lg shadow-lg border border-gray-200 hidden group-hover:block z-50">
          <h3 className="font-bold mb-2">{styleTooltips[summaryOptions.style].title}</h3>
          <p className="text-sm text-gray-600 mb-2">{styleTooltips[summaryOptions.style].description}</p>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-sm font-mono whitespace-pre-wrap">{styleTooltips[summaryOptions.style].example}</p>
          </div>
        </div>
      </div>
    </div>
    <select
      name="style"
      value={summaryOptions.style}
      onChange={handleOptionChange}
      className="w-full p-3 border border-gray-300 rounded-md font-sans shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      dir="rtl"
    >
      <option value="concise">תמציתי (נקודות)</option>
      <option value="detailed">מפורט מלא</option>
      <option value="narrative">נרטיבי קצר</option>
      <option value="thematic">תמטי/מחולק</option>
      <option value="qa">שאלות ותשובות</option>
      <option value="glossary">מילון מונחים</option>
      <option value="steps">צעד אחר צעד</option>
      <option value="tldr">TL;DR</option>
    </select>
  </div>
  
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">שפה</label>
    <select
      name="language"
      value={summaryOptions.language}
      onChange={handleOptionChange}
      className="w-full p-3 border border-gray-300 rounded-md font-sans shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      dir="rtl"
    >
      <option value="he">עברית</option>
      <option value="en">אנגלית</option>
    </select>
  </div>
</div> 