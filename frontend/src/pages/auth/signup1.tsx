import React, { useState } from 'react';
import "./Form.css";
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



const Signup1: React.FC = () => {

  const navigate = useNavigate();

  const onLoginClick = () => {
    navigate("/login1");
  };

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formatData, setFormData] = useState({
    name: '',
    prenom: '',
    email: '',
    adresse: '',
    telephone: '',
    matriculate: '',
    password: '',
    password2: ''
  })

  const handleInputChange = (event: any) => {
    const { name, value } = event.target;
    setFormData({
      ...formatData,
      [name]: value
    })

  }

  const isStrongPassword = (password: string) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return strongPasswordRegex.test(password);
  };



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formatData.password !== formatData.password2) {
      setError("The confirmed passwords don't match");
      toast.error("Sign up error: Passwords do not match");
      return;
    }

    if (!isStrongPassword(formatData.password)) {
      setError("Password must be at least 8 characters long, include uppercase, lowercase, number, and symbol.");
      toast.error("Weak password: Please use a stronger one.");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/user/register", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formatData)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message); // message from backend
      }
      toast.success("Sign up successful!");
      navigate("/login1")

    } catch (error: any) {
      toast.error("Sign up error: " + error.message); // Custom message
    }
    finally {
      setFormData({
        name: '',
        prenom: '',
        email: '',
        adresse: '',
        telephone: '',
        matriculate: '',
        password: '',
        password2: ''
      })
    }

  }
  return (

    <div className="page">
      <div className="card">
        <div className="bg">
          <img className='image' src="/SignUp.gif" alt="Illustration" />
        </div>
        <div className="blob"></div>
      </div>
      <div className="containers">
          <form className="formula" onSubmit={handleSubmit}>
          <h1 className="signup-title">Sign Up</h1>
            <div className='Elements'>
              <div className="name-row">
                <div className="input-group">
                  <label>First Name</label>
                  <input
                    className='auth-input'
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={formatData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input
                    className='auth-input'
                    type="text"
                    name="prenom"
                    placeholder="Family Name"
                    value={formatData.prenom}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="name-row">
                <div className="input-group">
                  <label>Email</label>
                  <input className='auth-input' type="email" name="email" placeholder="E@example.com" value={formatData.email} onChange={handleInputChange} required />

                </div>
                <div className="input-group">
                  <label>Adresse</label>
                  <input className='auth-input' type="text" name="adresse" placeholder="Enter your home adress" value={formatData.adresse} onChange={handleInputChange} required />

                </div>
              </div>

              <label>Phone Number</label>
              <input className='auth-input' type="text" name="telephone" placeholder="Enter your phone number" value={formatData.telephone} onChange={handleInputChange} required />
              <label>Your matriculate</label>
              <input className='auth-input' type="text" name="matriculate" placeholder="Matriculate" value={formatData.matriculate} onChange={handleInputChange} required />
              <label>Password</label>
              <input type={showPassword ? 'text' : 'password'} className='auth-input' name="password" placeholder="Password" value={formatData.password} onChange={handleInputChange} required />
              <label>Confirm your password</label>
              <input type={showPassword ? 'text' : 'password'} className='auth-input' name="password2" placeholder="Confirm Password" value={formatData.password2} onChange={handleInputChange} required />
              <label className="d-flex align-items-center gap-2 ">
              <input className="custom-checkbox" type="checkbox" id="showPassword"
                    checked={showPassword} 
                    onChange={() => setShowPassword(!showPassword)} />
              <span>Show Password</span>
            </label>
             </div>
            
            <button className="button-clr" type="submit">Create account</button>
            <div>
              <p>Already have an account? <span style={{ cursor: 'pointer', color: 'rgba(8, 109, 3, 0.977)', textDecorationLine: 'underline' }} onClick={onLoginClick}>Sign In</span></p>
            </div>
            <ToastContainer />
          </form>
      </div>
    </div>
  );
};

export default Signup1;


