import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import "./Form.css";

const EnterCode: React.FC = () => {

    const navigate = useNavigate();
    const [verificationCode, setVerificationCode] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await fetch("http://localhost:5000/Verif/Code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ verificationCode }),
        });
        const result = await response.json();
        if (response.ok) {
            navigate("/ResetPassword");
        } else {
            setMessage("Error: " + result.message);
        }
    };

    return (
        <div className="page">
            <div className="containers">
                    <form className="formula" onSubmit={handleSubmit}>
                        <h1 className="signup-title">Enter Confirmation Code</h1>
                        <br />
                        <div className='Elements'>
                            <label>Verification code</label>
                            <input className='auth-input' type="text" placeholder="Enter verification code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} required />
                        </div>
                        <button className="button-clr" type="submit">Submit</button>
                    </form>
                    <p>{message}</p>
            </div>
            <div className="card">
                <div className="bg">
                <img className='image' src="/EnterCode.gif" alt="Illustration" />
                </div>
                <div className="blob"></div>
            </div>
        </div>
    );
};

export default EnterCode;
