import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/SignupSuccess.css';

function SignupSuccess() {
  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">✓</div>
        <h2>ההרשמה הושלמה בהצלחה!</h2>
        <p>תודה שנרשמת לאתר שלנו</p>
        <Link to="/login" className="login-button">
          עבור להתחברות
        </Link>
      </div>
    </div>
  );
}

export default SignupSuccess; 