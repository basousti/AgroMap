import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLock, FaEye, FaEyeSlash} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ChangePassword.css';

// Clé pour le stockage du mot de passe dans localStorage
const PASSWORD_STORAGE_KEY = 'user_password';

const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleBack = (): void => {
    navigate('/InformationsUtilisateur');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

   const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm'): void => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('The password must contain at least 8 characters.');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('The password must contain at least one uppercase letter.');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('The password must contain at least one lowercase letter.');
    }
    
    if (!/\d/.test(password)) {
      errors.push('The password must contain at least one number.');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('The password must contain at least one special character.');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validateForm = (): boolean => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('All fields are required.');
      return false;
    }

    // Vérifier si le mot de passe actuel correspond à celui stocké
    const storedPassword = localStorage.getItem(PASSWORD_STORAGE_KEY);
    if (formData.currentPassword !== storedPassword) {
      toast.error('The current password is incorrect.');
      return false;
    }

    // Validation avancée du nouveau mot de passe
    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      passwordValidation.errors.forEach(error => toast.error(error));
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('The new passwords do not match.');
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error('The new password must be different from the old one');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simuler un appel API avec délai
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simuler une réponse d'API réussie
      const success = Math.random() > 0.1; // 90% de chance de succès pour la démonstration
      
      if (!success) {
        throw new Error('Server error occurred during the password change.');
      }

      // Sauvegarder le nouveau mot de passe dans localStorage
      localStorage.setItem(PASSWORD_STORAGE_KEY, formData.newPassword);

      // Déclencher un événement personnalisé pour notifier les autres composants
      window.dispatchEvent(new CustomEvent('passwordChanged', {
        detail: { newPassword: formData.newPassword }
      }));

      toast.success('Password changed successfully.');
      
      // Réinitialiser le formulaire
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Rediriger vers la page de profil après quelques secondes
      setTimeout(() => {
        navigate('/InformationsUtilisateur');
      }, 2000);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <ToastContainer position="top-right" autoClose={5000} />
      
      <div className="change-password-header">
        <button className="back-btn" onClick={handleBack}><FaArrowLeft /></button>
        <h1>Change password</h1>
      </div>
      
      <div className="change-password-container">
        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">
              <FaLock className="input-icon" />
              Current password.
            </label>
            <div className="password-input-container">
              <input
                type={showPasswords.current ? "text" : "password"}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                placeholder="Enter your current password."
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">
              <FaLock className="input-icon" />
              New Password
            </label>
            <div className="password-input-container">
              <input
                type={showPasswords.new ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="Enter your new password."
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">
              <FaLock className="input-icon" />
              Confirm your new password
            </label>
            <div className="password-input-container">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your new password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="change-password-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
        
        <div className="password-guidelines">
          <h3>Tips for a secure password:</h3>
            <ul>
              <li>Use at least 8 characters</li>
              <li>Combine uppercase and lowercase letters</li>
              <li>Include numbers and special characters</li>
              <li>Avoid easily guessable personal information</li>
              <li>Do not use the same password for multiple sites</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;