import React from 'react';

const PricingSection = () => {
  const primaryColor = '#007bff'; // צבע אחיד

  return (
    <section className="pricing-section" style={{ backgroundColor: '#f0f4f8', padding: '60px 20px' }}>
      <h2 style={{ color: primaryColor, textAlign: 'center', fontSize: '2.5rem', marginBottom: '40px', fontWeight: 'bold' }}>תמחור</h2>
      <div className="pricing-cards" style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* tachlesAI חינם */}
        <div className="pricing-card" style={{ border: `1px solid ${primaryColor}`, borderRadius: '12px', padding: '30px', width: '250px', backgroundColor: '#ecf6fd', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)', transition: 'transform 0.3s' }}>
          <h3 style={{ color: primaryColor, fontSize: '1.8rem', marginBottom: '15px' }}>tachlesAI חינם</h3>
          <h4 style={{ color: primaryColor, fontSize: '1.2rem', marginBottom: '10px' }}>בחינם לגמרי תקבלו:</h4>
          <p style={{ fontSize: '1rem', marginBottom: '20px' }}>עד 5 תמלולים/סיכומים בחודש</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button style={{ backgroundColor: primaryColor, color: '#fff', border: 'none', borderRadius: '6px', padding: '12px 20px', cursor: 'pointer', fontSize: '1rem', transition: 'background-color 0.3s', width: '100%' }}>הירשמו חינם</button>
          </div>
        </div>

        {/* tachlesAI פלוס */}
        <div className="pricing-card" style={{ border: `1px solid ${primaryColor}`, borderRadius: '12px', padding: '30px', width: '250px', backgroundColor: '#ecf6fd', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)', transition: 'transform 0.3s' }}>
          <h3 style={{ color: primaryColor, fontSize: '1.8rem', marginBottom: '15px' }}>tachlesAI פלוס - 39 ש"ח בחודש</h3>
          <h4 style={{ color: primaryColor, fontSize: '1.2rem', marginBottom: '10px' }}>במחיר של סמבוסק פיצה תקבלו:</h4>
          <p style={{ fontSize: '1rem', marginBottom: '10px' }}>עד 12 תמלולים/סיכומים בחודש</p>
          <p style={{ fontSize: '1rem', marginBottom: '20px' }}>אפשרות לסכם/לתמלל ישירות מקישור</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button style={{ backgroundColor: primaryColor, color: '#fff', border: 'none', borderRadius: '6px', padding: '12px 20px', cursor: 'pointer', fontSize: '1rem', transition: 'background-color 0.3s', width: '100%' }}>הירשמו עכשיו</button>
          </div>
        </div>

        {/* tachlesAI פרו */}
        <div className="pricing-card" style={{ border: `1px solid ${primaryColor}`, borderRadius: '12px', padding: '30px', width: '250px', backgroundColor: '#ecf6fd', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)', transition: 'transform 0.3s' }}>
          <h3 style={{ color: primaryColor, fontSize: '1.8rem', marginBottom: '15px' }}>tachlesAI פרו - 75 ש"ח בחודש</h3>
          <h4 style={{ color: primaryColor, fontSize: '1.2rem', marginBottom: '10px' }}>במחיר של מגש פיצה תקבלו:</h4>
          <p style={{ fontSize: '1rem', marginBottom: '10px' }}>עד 20 סיכומים ותמלולים מותאמים אישית כל חודש</p>
          <p style={{ fontSize: '1rem', marginBottom: '20px' }}>אפשרות לתמלל/לסכם ישירות מקישור</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button style={{ backgroundColor: primaryColor, color: '#fff', border: 'none', borderRadius: '6px', padding: '12px 20px', cursor: 'pointer', fontSize: '1rem', transition: 'background-color 0.3s', width: '100%' }}>הירשמו עכשיו</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection; 