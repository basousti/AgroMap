import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./Form.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const Login1: React.FC = () => {

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onRegisterClick = () => {
    navigate("/Signup1");
  };

    const ForgetPassword = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      e.preventDefault();
      console.log("Forgot Password clicked!");
      navigate("/forgetPW"); // Navigating to Forget Password page
  };


  const [formatData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleInputChange = (event: any) => {
    const { name, value } = event.target;
    setFormData({
      ...formatData,
      [name]: value
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formatData)
      })
      const result = await response.json();
      console.log("login response token ", result);

      if (!response.ok) { 
        setError(result.message); // e.g., "Wrong password" or "User not found"
        toast.error("Verify your Email or your password");
        return;
      }

        localStorage.setItem("token", result.token); // Save token

        if (result.role === "admin") {
          navigate("/DashboardA"); // Admin dashboard route
        } else if(result.role === "employer") {
          navigate("/DashboardE"); // Employee dashboard route
        } else {
          console.warn("Unknown role:", result.role);
        }
      
    } catch (error: any) {
      console.log(error.message);
    } finally {
      setFormData({
        email: '',
        password: ''
      })
    }
  }

  return (
    <div className="page">
      <div className="containers">
          <form className="formula" action="#" onSubmit={handleSubmit}>
          <h1 className="signup-title">Welcome Back</h1>
            <div className='Elements'>
              <label>Your email</label>
              <input className='auth-input' type="email" name="email" placeholder="email" autoComplete="email" value={formatData.email} onChange={handleInputChange} required />
              <label>Password</label>
              <input className='auth-input' type="password" name="password" placeholder="Password" autoComplete="password" value={formatData.password} onChange={handleInputChange} required />
            </div>
            <a href="#" onClick={ForgetPassword}>Forgot password?</a>

            <button className="button-clr" type="submit">Sign In</button>
            <div>
              <p>Don't have an account?<span style={{ cursor: 'pointer', color: 'rgba(8, 109, 3, 0.977)', textDecorationLine: 'underline' }} onClick={onRegisterClick}>Sign Up</span></p>
            </div>
            <ToastContainer />
          </form>
      </div>
      <div className="card">
        <div className="bg">
        <img className='image' src="/Mobilelogin.gif" alt="Illustration" />
        </div>
        <div className="blob"></div>
      </div>
    </div>

  );
};
export default Login1;