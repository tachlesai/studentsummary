import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Login.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // כאן יתווסף בהמשך הלוגיקה לאימות המשתמש
    console.log('ניסיון התחברות עם:', formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>התחברות</h2>
        
        <div className="form-group">
          <label htmlFor="email">אימייל:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">סיסמה:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">התחבר</button>
        <div className="signup-link">
          אין לך חשבון? <Link to="/signup" className="text-indigo-600 hover:text-indigo-700">הרשם כאן</Link>
        </div>
      </form>
    </div>
  );
}

export default Login; 