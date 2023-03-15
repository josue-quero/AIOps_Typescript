import { Link } from 'react-router-dom';
import { useLogin } from 'hooks/useLogin';
import { createRef, FormEvent } from 'react';

// - styles
import 'styles/pages/login/SignIn.css';

const SignIn = () => {
  const { login, error, loading } = useLogin();
  const emailRef = createRef<HTMLInputElement>();
  const passwordRef = createRef<HTMLInputElement>();

  const submitHandler = (event: FormEvent) => {
    event.preventDefault();
    if (emailRef.current && passwordRef.current) {
      login(emailRef.current.value, passwordRef.current.value);
    }
  };

  return (
    <div className='fill-height content'>
      <nav className='navbar'>
        <span>FRIDA AIOps</span>
        <div className='conjoined-button'>
          <button className='active'>EN</button>
          <button>ES</button>
        </div>
      </nav>
      <div className='center-content'>
        <form className='login login__form' onSubmit={submitHandler}>
          <h1>Sign In</h1>
          <p>
            New user? <a href='#'>Create an account</a>
          </p>
          <div className='form-group'>
            <label htmlFor='email'>Email address</label>
            <input id='email' type='email' ref={emailRef} />
          </div>
          <div className='form-group'>
            <label htmlFor='password'>Password</label>
            <input id='password' type='password' ref={passwordRef} />
          </div>
          <Link to={'/reset-password'}>Forgot your password?</Link>
          <button className='btn filled-btn'>Continue</button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;