import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Form.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const ResetPassword: React.FC = () => {

    const [newPassword, setNewPassword] = useState("");
    const [ConfirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const [formatData, setFormData] = useState({
        password: '',
        ConfirmPassword: ''
    })

    const isStrongPassword = (password: string) => {
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        return strongPasswordRegex.test(password);
    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (formatData.password !== formatData.ConfirmPassword) {
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
            const response = await fetch("http://localhost:5000/Verif/UpdatePw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message); // message from backend
            }


            toast.success("Your password updated successfully!");

            navigate("/login1");

        } catch (error: any) {
            toast.error("Sign up error: " + error.message); // Custom message
        }
        finally {
            setFormData({
                password: '',
                ConfirmPassword: ''
            })
        }
    };

    return (
        <div className="page">
            <div className="containers">
                    <form className="formula" onSubmit={handleSubmit}>
                        <h1 className="signup-title">Reset Password</h1>
                        <div className='Elements'>
                            <label>New password</label>
                            <input className='auth-input' type={showPassword ? 'text' : 'password'} placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                            <label>Confirm your new password</label>
                            <input className='auth-input' type={showPassword ? 'text' : 'password'} placeholder="Confirm Password" value={ConfirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                            <label className="d-flex align-items-center gap-2 ">
                                <input className="custom-checkbox" type="checkbox" id="showPassword"
                                    checked={showPassword}
                                    onChange={() => setShowPassword(!showPassword)} />
                                <span>Show Password</span>
                            </label>
                        </div>
                        <button className="button-clr" type="submit">Submit</button>
                        <ToastContainer />
                    </form>
            </div>
            <div className="card">
                <div className="bg">
                    <img className='image' src="/ResetPassword.gif" alt="Illustration" />
                </div>
                <div className="blob"></div>
            </div>
        </div>
    );
};

export default ResetPassword;
