import React from 'react';

const HeroImage = () => {
  return (
    <div className="rounded-lg overflow-hidden shadow-xl">
      <img 
        src="/hero_image.jpeg"
        alt="סטודנטים לומדים עם מחשב נייד"
        className="w-full h-auto object-cover"
        style={{
          maxHeight: '400px',
          width: '100%'
        }}
      />
    </div>
  );
};

export default HeroImage;