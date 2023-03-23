import { Link } from 'react-router-dom';
import React from 'react';

// - styles
import 'styles/pages/login/Login.css';

// - images & icons
import AIOpsLogo from 'common/AIOpsLogo';

const Login = () => {
  return (
    <div className='login-page'>
      <section className='login-layout'>
        <div className='login-logo'>
          <AIOpsLogo fillColor='#1A4038' />
          <AIOpsLogo fillColor='#759289'/>
          <AIOpsLogo fillColor='rgba(26, 64, 56, 0.33)'/>
        </div>
        <div className='login-content'>
          <h1>FRIDA AIOps</h1>
          <p>
            Software that applies AI and advanced analytics to operations data
            to make correlations and provide prescriptive and predictive answers
            in real-time.
          </p>
          <div className='login-actions'>
            <Link className='btn text-btn' to='/signin'>
              Log In
            </Link>
            <Link className='btn filled-btn' to='/signup'>
              Sign Up
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;