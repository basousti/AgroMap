import { FaArrowLeft, FaIdCard, FaEnvelope, FaPhone, FaMapMarkerAlt, FaKey, FaUserCircle, FaPencilAlt, FaSave, FaTimes, FaCheck, FaUpload, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import './InformationsUtilisateur.css';
import axios from 'axios';
import { Briefcase } from "lucide-react";

interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  matriculate: string;
  avatarUrl?: string;
}

const AVATAR_STORAGE_KEY = 'user_avatar';
const DASHBOARD_EMPLOYEE_KEY = 'dashboard_employee_data';

const InformationsUtilisateur: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("••••••••••••");

  // Default frontend data
  const defaultFrontendData = {
    joinDate: '15 Mars 2024',
    avatarUrl: ''
  };

  // Validation functions
  const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
    return nameRegex.test(name);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo)\.com$/;
    return emailRegex.test(email);
  };

  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    return {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      matriculate: '',
      avatarUrl: savedAvatar || defaultFrontendData.avatarUrl
    };
  });

  const [editedInfo, setEditedInfo] = useState<UserInfo>({...userInfo});

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get('http://localhost:5000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const apiData = response.data;
      
      const userData: UserInfo = {
        id: apiData._id,
        firstName: apiData.name || '',
        lastName: apiData.prenom || '',
        email: apiData.email,
        phone: apiData.telephone || '',
        address: apiData.adresse || '',
        matriculate: apiData.matriculate || '',
        avatarUrl: localStorage.getItem(AVATAR_STORAGE_KEY) || defaultFrontendData.avatarUrl
      };

      setUserInfo(userData);
      setEditedInfo(userData);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to fetch user data');
      setLoading(false);
      console.error('Error fetching user data:', err);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const updateUserData = async (updatedData: UserInfo) => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:5000/api/user/NewData',
        {
          name: updatedData.firstName,
          prenom: updatedData.lastName,
          email: updatedData.email,
          telephone: updatedData.phone,
          adresse: updatedData.address,
          matriculate: updatedData.matriculate
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setUserInfo(updatedData);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
        
        localStorage.setItem(AVATAR_STORAGE_KEY, updatedData.avatarUrl || '');
        
        const employeeData = {
          id: updatedData.id,
          name: `${updatedData.firstName} ${updatedData.lastName}`,
          email: updatedData.email,
          phone: updatedData.phone,
          location: updatedData.address,
          matriculate: updatedData.matriculate,
          ...defaultFrontendData
        };
        
        localStorage.setItem(DASHBOARD_EMPLOYEE_KEY, JSON.stringify(employeeData));
      }
    } catch (error) {
      toast.error("Error updating profile");
      console.error("Update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProfile = async (): Promise<void> => {
    if (isEditing) {
      if (!editedInfo.firstName.trim() || !editedInfo.lastName.trim()) {
        toast.error("First and last names are required");
        return;
      }
      
      if (!editedInfo.email.trim()) {
        toast.error("Email is required");
        return;
      }

      await updateUserData(editedInfo);
    } else {
      setEditedInfo({...userInfo});
      setIsEditing(true);
    }
  };

  const handleCancelEdit = (): void => {
    setEditedInfo({...userInfo});
    setIsEditing(false);
    toast.info("Changes canceled");
  };

  const handleInputChange = (field: keyof UserInfo, value: string): void => {
    setEditedInfo({
      ...editedInfo,
      [field]: value
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image");
      return;
    }
    
    setIsUploadingAvatar(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        const newAvatarUrl = base64Image;
        
        setEditedInfo({
          ...editedInfo,
          avatarUrl: newAvatarUrl
        });
        
        localStorage.setItem(AVATAR_STORAGE_KEY, newAvatarUrl);
        toast.success("Profile picture updated!");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Error processing image");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChangeAvatar = (): void => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleRemoveAvatar = (): void => {
    if (window.confirm("Are you sure you want to remove your profile picture?")) {
      const emptyAvatarUrl = defaultFrontendData.avatarUrl;
      
      setEditedInfo({
        ...editedInfo,
        avatarUrl: emptyAvatarUrl
      });
      
      localStorage.setItem(AVATAR_STORAGE_KEY, emptyAvatarUrl);
      toast.success("Profile picture removed");
    }
  };

  const handleBack = (): void => {
    navigate('/DashboardE');
  };

  const handleChangePassword = (): void => {
    navigate('/change-password');
  };

  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
    
    if (!showPassword) {
      setTimeout(() => {
        setShowPassword(false);
      }, 5000);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }


 return (
  <div className="user-info-page">
    <ToastContainer position="top-right" autoClose={3000} />
    <div className="info-header">
      <div className="header-left">
        <button className="back-btn" onClick={handleBack}><FaArrowLeft /></button>
        <h1>Profile informations</h1>
      </div>
      {isEditing ? (
        <div className="edit-actions">
          <button 
            className="save-profile-btn" 
            onClick={handleEditProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="button-spinner"></div> Saving...
              </>
            ) : (
              <>
                <FaSave /> Save
              </>
            )}
          </button>
          <button 
            className="cancel-edit-btn" 
            onClick={handleCancelEdit}
            disabled={isSaving}
          >
            <FaTimes /> Cancel
          </button>
        </div>
      ) : (
        <button className="edit-profile-main-btn" onClick={handleEditProfile}>
          <FaPencilAlt /> Edit profile
        </button>
      )}
    </div> 
    
    <div className="info-container">
      <div className="info-sidebar">
        <div className="avatar-container">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            style={{ display: 'none' }}
          />
          
          <div className="avatar-display">
            {(isEditing ? editedInfo.avatarUrl : userInfo.avatarUrl) ? (
              <img 
                src={isEditing ? editedInfo.avatarUrl : userInfo.avatarUrl} 
                alt={`${userInfo.firstName} ${userInfo.lastName}`} 
                className="user-avatar" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = defaultFrontendData.avatarUrl;
                  if (isEditing) {
                    setEditedInfo(prev => ({
                      ...prev,
                      avatarUrl: defaultFrontendData.avatarUrl
                    }));
                  } else {
                    setUserInfo(prev => ({
                      ...prev,
                      avatarUrl: defaultFrontendData.avatarUrl
                    }));
                  }
                  localStorage.setItem(AVATAR_STORAGE_KEY, defaultFrontendData.avatarUrl);
                }}
              />
            ) : (
              <FaUserCircle className="default-avatar" />
            )}
            
            {isUploadingAvatar && (
              <div className="avatar-loading-overlay">
                <div className="loading-spinner"></div>
              </div>
            )}
          </div>
          
          <div className="avatar-actions">
            <button 
              className="change-photo-btn" 
              onClick={handleChangeAvatar}
              disabled={isUploadingAvatar}
            >
              <FaUpload /> 
              {isUploadingAvatar ? "Upload..." : (userInfo.avatarUrl ? "Edit photo" : "Add a photo")}
            </button>
            
            {userInfo.avatarUrl && userInfo.avatarUrl !== defaultFrontendData.avatarUrl && (
              <button 
                className="remove-photo-btn" 
                onClick={handleRemoveAvatar}
                title="Remove photo"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
        
        <div className="user-meta">
          <h2>{userInfo.firstName} {userInfo.lastName}</h2>
          <span className="user-role">Employee</span>
          <div className="user-since">
            <span>Member since:</span>
            <p>{defaultFrontendData.joinDate}</p>
          </div>
          <button 
            className="reset-profile-btn"
            onClick={() => {
              if (window.confirm("Reset profile to default values?")) {
                localStorage.removeItem(AVATAR_STORAGE_KEY);
                setUserInfo(prev => ({
                  ...prev,
                  avatarUrl: defaultFrontendData.avatarUrl
                }));
                toast.success("Profile picture reset");
              }
            }}
          >
            Reset profile
          </button>
        </div>
      </div>
      
      <div className="info-main">
        <div className="info-section">
          <h3>Personal Information</h3>
          
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">
                <FaIdCard className="info-icon" />
                <span>Family name</span>
              </div>
              <div className="info-value">
                {isEditing ? (
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      value={editedInfo.firstName} 
                      onChange={(e) => handleInputChange('firstName', e.target.value)} 
                      className="editable-input"
                      required
                      placeholder="Family name (letters only)"
                      pattern="[a-zA-ZÀ-ÿ\s]+"
                      title="The family name must contain letters only."
                    />
                    {editedInfo.firstName !== userInfo.firstName && (
                      <span className="field-changed-indicator"><FaCheck /></span>
                    )}
                    {editedInfo.firstName && !validateName(editedInfo.firstName) && (
                      <small className="validation-hint">letters only</small>
                    )}
                  </div>
                ) : (
                  userInfo.firstName || "Not specified"
                )}
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaIdCard className="info-icon" />
                <span>Name</span>
              </div>
              <div className="info-value">
                {isEditing ? (
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      value={editedInfo.lastName} 
                      onChange={(e) => handleInputChange('lastName', e.target.value)} 
                      className="editable-input"
                      required
                      placeholder="Name"
                      pattern="[a-zA-ZÀ-ÿ\s]+"
                      title="The name must contain letters only."
                    />
                    {editedInfo.lastName !== userInfo.lastName && (
                      <span className="field-changed-indicator"><FaCheck /></span>
                    )}
                    {editedInfo.lastName && !validateName(editedInfo.lastName) && (
                      <small className="validation-hint">Letters only</small>
                    )}
                  </div>
                ) : (
                  userInfo.lastName || "Not specified"
                )}
              </div>
            </div>
            
            <div className="info-item full-width">
              <div className="info-label">
                <FaEnvelope className="info-icon" />
                <span>Email</span>
              </div>
              <div className="info-value">
                {isEditing ? (
                  <div className="input-wrapper">
                    <input 
                      type="email" 
                      value={editedInfo.email} 
                      onChange={(e) => handleInputChange('email', e.target.value)} 
                      className="editable-input"
                      required
                      placeholder="example@gmail.com or example@yahoo.com"
                      pattern="[a-zA-Z0-9._%+-]+@(gmail|yahoo)\.com"
                      title="The email must be in the format: example@gmail.com or example@yahoo.com"
                    />
                    {editedInfo.email !== userInfo.email && (
                      <span className="field-changed-indicator"><FaCheck /></span>
                    )}
                    {editedInfo.email && !validateEmail(editedInfo.email) && (
                      <small className="validation-hint">Format: example@gmail.com or example@yahoo.com</small>
                    )}
                  </div>
                ) : (
                  userInfo.email || "Not specified"
                )}
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaPhone className="info-icon" />
                <span>Phone number</span>
              </div>
              <div className="info-value">
                {isEditing ? (
                  <div className="input-wrapper">
                    <input 
                      type="tel" 
                      value={editedInfo.phone} 
                      onChange={(e) => handleInputChange('phone', e.target.value)} 
                      className="editable-input"
                      placeholder="12345678"
                      maxLength={8}
                      pattern="\d{8}"
                      title="The phone number must contain exactly 8 digits."
                    />
                    {editedInfo.phone !== userInfo.phone && (
                      <span className="field-changed-indicator"><FaCheck /></span>
                    )}
                    {editedInfo.phone && editedInfo.phone.length < 8 && (
                      <small className="validation-hint">The phone number must contain exactly 8 digits.</small>
                    )}
                  </div>
                ) : (
                  userInfo.phone || "Not specified"
                )}
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaMapMarkerAlt className="info-icon" />
                <span>Address</span>
              </div>
              <div className="info-value">
                {isEditing ? (
                  <div className="textarea-wrapper">
                    <textarea 
                      value={editedInfo.address} 
                      onChange={(e) => handleInputChange('address', e.target.value)} 
                      className="editable-input address-input"
                    />
                    {editedInfo.address !== userInfo.address && (
                      <span className="field-changed-indicator"><FaCheck /></span>
                    )}
                  </div>
                ) : (
                  userInfo.address || "Not specified"
                )}
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <Briefcase size={16} className="info-icon" />
                <span>Matriculate</span>
              </div>
              <div className="info-value">
                {isEditing ? (
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      value={editedInfo.matriculate} 
                      onChange={(e) => handleInputChange('matriculate', e.target.value)} 
                      className="editable-input"
                      placeholder="Matriculate number"
                    />
                    {editedInfo.matriculate !== userInfo.matriculate && (
                      <span className="field-changed-indicator"><FaCheck /></span>
                    )}
                  </div>
                ) : (
                  userInfo.matriculate || "Not specified"
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="info-section">
          <h3>Security</h3>
          
          <div className="info-grid">
            <div className="info-item security-item">
              <div className="info-label">
                <FaKey className="info-icon" />
                <span>Password</span>
              </div>
              <div className="info-value password-value">
                <div className="password-display-container">
                  <span>{showPassword ? password : "••••••••••••"}</span>
                  <button 
                    className="toggle-password-btn" 
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <button className="change-password-btn" onClick={handleChangePassword}>
                  Change password
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {isEditing && (
          <div className="help-message">
            <p>Edit your information then click "Save" to record your changes.</p>
            <p><FaCheck className="check-icon" /> indicates the fields that have been modified.</p>
            <p>The changes will be automatically synchronized with the dashboard.</p>
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default InformationsUtilisateur;



