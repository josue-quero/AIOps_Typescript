import { auth } from '../../firebase/order-food';
import { sendPasswordResetEmail } from 'firebase/auth';
import { createRef, FormEvent } from 'react';

const ResetPassword = () => {
  const emailRef = createRef<HTMLInputElement>();

  const resetPasswordHandler = (event: FormEvent) => {
    event.preventDefault();
    const email = emailRef.current!.value;

    if (!email) {
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        console.log('EMAIL SENT');
        console.log(email);
      })
      .catch((error) => {
        const errorCode = error.code;
        console.log(error.message);
      });
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
        <form className='login login__form' onSubmit={resetPasswordHandler}>
          <h1>Reset Password</h1>
          <div className='form-group'>
            <label htmlFor='email'>Email address</label>
            <input id='email' type='email' ref={emailRef} />
          </div>
          <button className='btn filled-btn'>Reset Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;