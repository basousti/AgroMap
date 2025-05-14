import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./Form.css";


const ForgotPassword: React.FC = () =>{

  const navigate = useNavigate();

  const [email, setEmail] = useState<string>(""); 
  const [message, setMessage] = useState<string>(""); // Store success/error messages

  const onLoginClick = () => {
    navigate("/login1");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/Verif/password", { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (response.ok) {
        navigate("/EnterCode");
    }else {
        setMessage("Error: " + result.message);
      }

    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(error.message);
        setMessage("Error: Unable to send reset email. Please try again.");
      }
    }
  };


  return (
    
<div className="page">
<div className="containers">
    <form className="formula" onSubmit={handleSubmit}>
    <h1 className="signup-title">Forgot Password</h1>
      <p>Enter the email address you use.<br/> We'll send you a code to reset your password.</p>
       <div className='Elements'>
        <label>Email</label>
        <input
          className='auth-input'
          type="email"
          name="email"
          placeholder="Enter your email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {message && <p className="message">{message}</p>}
      </div>
      <button className="button-clr" type="submit">Send Code</button>
      <div>
      <p>Back to <span style={{ cursor: 'pointer', color: 'rgba(8, 109, 3, 0.977)' , textDecorationLine: 'underline'}} onClick={onLoginClick}>Login</span></p>
      </div>
    </form>
</div>
<div className="card">
  <div className="bg">
    <img className='image' src="/Forgotpassword.gif" alt="Illustration" />
  </div>
  <div className="blob"></div>
</div>
</div>

  );
};

export default ForgotPassword;
