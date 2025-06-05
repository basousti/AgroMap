import { FaArrowLeft, FaIdCard, FaEnvelope, FaPhone, FaMapMarkerAlt, FaKey, FaUserCircle, FaPencilAlt, FaSave, FaTimes, FaCheck, FaUpload, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import './InformationsUtilisateur.css';

// Définition d'un type pour les informations utilisateur
interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  avatarUrl: string;
  username: string;
  role: string;
  dateCreation: string;
  position?: string; // Ajouté pour la synchronisation avec le dashboard
  matriculate?: string; // Ajouté pour la synchronisation avec le dashboard
  company?: string; // Ajouté pour la synchronisation avec le dashboard
  companyDescription?: string; // Ajouté pour la synchronisation avec le dashboard
  status?: string; // Ajouté pour la synchronisation avec le dashboard
  joinDate?: string; // Ajouté pour la synchronisation avec le dashboard
}

// Clés utilisées pour le stockage local
const USER_INFO_STORAGE_KEY = 'user_profile_info';
const PASSWORD_STORAGE_KEY = 'user_password';
const AVATAR_STORAGE_KEY = 'user_avatar';
const DASHBOARD_EMPLOYEE_KEY = 'dashboard_employee_data'; // Nouvelle clé pour la synchronisation

const InformationsUtilisateur: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // État pour suivre si on est en mode édition
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // État pour indiquer que la sauvegarde est en cours
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // État pour indiquer que l'upload d'avatar est en cours
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  
  // État pour afficher/masquer le mot de passe
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Mot de passe récupéré du localStorage avec valeur par défaut
  const [password, setPassword] = useState<string>(() => {
    return localStorage.getItem(PASSWORD_STORAGE_KEY) || "MonMotDePasse123";
  });
  
  // Données utilisateur initiales avec informations étendues
  const defaultUserInfo: UserInfo = {
    firstName: "nouha",
    lastName: "maouia",
    email: "maouianouha2@gmail.com",
    phone: "29220752",
    address: "Menzel Horr",
    avatarUrl: "",
    username: "nouha",
    role: "Employé",
    dateCreation: "15/03/2023",
    position: "Chef département",
    matriculate: "Agriculteur",
    company: "SICAM",
    companyDescription: "SICAM Société Industrielle des Conserves Alimentaires de Medjez El Beb, fleuron de l'Industrie tunisienne depuis 1969 célèbre cette année ses 50 ans",
    status: "Actif",
    joinDate: "15 Mars 2022"
  };
  
  // Charger les données depuis le localStorage ou utiliser les valeurs par défaut
  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const savedUserInfo = localStorage.getItem(USER_INFO_STORAGE_KEY);
    const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);

    let userData = savedUserInfo ? JSON.parse(savedUserInfo) : defaultUserInfo;
    // Si on a un avatar sauvegardé séparément, l'utiliser
    if(savedAvatar){
      userData.avatarUrl = savedAvatar;
    }
    return userData;
  });
  
  // État temporaire pour les modifications en cours
  const [editedInfo, setEditedInfo] = useState<UserInfo>({...userInfo});

  // Fonction pour synchroniser avec le dashboard
  const syncWithDashboard = (userData: UserInfo) => {
    // Créer l'objet employee pour le dashboard
    const employeeData = {
      id: 'emp001',
      name: `${userData.firstName} ${userData.lastName}`,
      position: userData.position || userData.role,
      email: userData.email,
      phone: userData.phone,
      location: userData.address,
      matriculate: userData.matriculate ,
      company: userData.company || "SICAM",
      companyDescription: userData.companyDescription || "SICAM Société Industrielle des Conserves Alimentaires de Medjez El Beb, fleuron de l'Industrie tunisienne depuis 1969 célèbre cette année ses 50 ans",
      status: userData.status || "Actif",
      joinDate: userData.joinDate || userData.dateCreation,
      avatarUrl: userData.avatarUrl
    };

    // Sauvegarder pour le dashboard
    localStorage.setItem(DASHBOARD_EMPLOYEE_KEY, JSON.stringify(employeeData));

    // Émettre un événement pour notifier le dashboard
    const userInfoChangeEvent = new CustomEvent('userInfoChanged', {
      detail: { employeeData }
    });
    window.dispatchEvent(userInfoChangeEvent);
  };
  
  // Sauvegarder les changements dans le localStorage chaque fois que userInfo change
  useEffect(() => {
    localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(userInfo));

    // Sauvegarder l'avatar séparément pour une synchronisation plus facile
    if(userInfo.avatarUrl){
      localStorage.setItem(AVATAR_STORAGE_KEY, userInfo.avatarUrl);
    } else {
       localStorage.removeItem(AVATAR_STORAGE_KEY);
    }

    // Synchroniser avec le dashboard
    syncWithDashboard(userInfo);
  }, [userInfo]);
 
  // Écouter les changements d'avatar depuis d'autres composants
  useEffect(() => {
    const handleAvatarChange = (event: CustomEvent) => {
      const newAvatarUrl = event.detail.avatarUrl;
      setUserInfo(prev => ({
        ...prev,
        avatarUrl: newAvatarUrl
      }));
      setEditedInfo(prev => ({
        ...prev,
        avatarUrl: newAvatarUrl
      }));
      toast.success("Photo de profil synchronisée avec succès");
    };

    // Écouter l'événement personnalisé de changement d'avatar
    window.addEventListener('avatarChanged', handleAvatarChange as EventListener);

    // Vérifier périodiquement si l'avatar a changé dans localStorage
    const checkAvatarChange = () => {
      const currentStoredAvatar = localStorage.getItem(AVATAR_STORAGE_KEY) || "";
      if (currentStoredAvatar !== userInfo.avatarUrl) {
        setUserInfo(prev => ({
          ...prev,
          avatarUrl: currentStoredAvatar
        }));
        setEditedInfo(prev => ({
          ...prev,
          avatarUrl: currentStoredAvatar
        }));
      }
    };

    const avatarIntervalId = setInterval(checkAvatarChange, 1000);

    // Nettoyage lors du démontage du composant
    return () => {
      window.removeEventListener('avatarChanged', handleAvatarChange as EventListener);
      clearInterval(avatarIntervalId);
    };
  }, [userInfo.avatarUrl]);

   // Écouter les changements de mot de passe depuis d'autres composants
  useEffect(() => {
    const handlePasswordChange = (event: CustomEvent) => {
      const newPassword = event.detail.newPassword;
      setPassword(newPassword);
      toast.success("Mot de passe synchronisé avec succès");
    };

    // Écouter l'événement personnalisé de changement de mot de passe
    window.addEventListener('passwordChanged', handlePasswordChange as EventListener);

    // Vérifier périodiquement si le mot de passe a changé dans localStorage
    const checkPasswordChange = () => {
      const currentStoredPassword = localStorage.getItem(PASSWORD_STORAGE_KEY) || "MonMotDePasse123";
      if (currentStoredPassword !== password) {
        setPassword(currentStoredPassword);
      }
    };

    const intervalId = setInterval(checkPasswordChange, 1000);

    // Nettoyage lors du démontage du composant
    return () => {
      window.removeEventListener('passwordChanged', handlePasswordChange as EventListener);
      clearInterval(intervalId);
    };
  }, [password]);

  // Sauvegarder le mot de passe dans localStorage quand il change
  useEffect(() => {
    localStorage.setItem(PASSWORD_STORAGE_KEY, password);
  }, [password]);
  
  const handleBack = (): void => {
    navigate('/DashboardE');
  };

  // Fonction de validation des noms (seulement des lettres)
  const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/; // Lettres uniquement (avec accents)
    return nameRegex.test(name);
  };

  // Fonction de validation de l'email (format spécifique gmail/yahoo)
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo)\.com$/;
    return emailRegex.test(email);
  };

  // Fonction de validation du téléphone (exactement 8 chiffres)
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\d{8}$/;
    return phoneRegex.test(phone);
  };

  const handleEditProfile = async (): Promise<void> => {
    if (isEditing) {
      // Simuler un temps de chargement pour la sauvegarde
      setIsSaving(true);
      
      try {
        // Simuler un appel API avec un délai
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Validation du prénom
        if (!validateName(editedInfo.firstName.trim())) {
          toast.error("The first name must contain letters only.");
          setIsSaving(false);
          return;
        }
        
        // Validation du nom
        if (!validateName(editedInfo.lastName.trim())) {
          toast.error("The last name must contain letters only.");
          setIsSaving(false);
          return;
        }
        
        // Validation de l'email
        if (!validateEmail(editedInfo.email.trim())) {
          toast.error("The email must be in the format: [example@gmail.com](mailto:example@gmail.com) or [example@yahoo.com](mailto:example@yahoo.com).");
          setIsSaving(false);
          return;
        }
        
        // Validation du téléphone
        if (editedInfo.phone && !validatePhone(editedInfo.phone.trim())) {
          toast.error("The phone number must contain exactly 8 digits.");
          setIsSaving(false);
          return;
        }
        
        // Mettre à jour l'état principal avec les nouvelles valeurs
        setUserInfo({...editedInfo});
        setIsEditing(false);
        toast.success("Profile successfully updated.");
      } catch (error) {
        toast.error("Une erreur est survenue lors de la sauvegarde");
        console.error("Erreur de sauvegarde:", error);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Activer le mode édition
      setEditedInfo({...userInfo});
      setIsEditing(true);
    }
  };
  
  const handleCancelEdit = (): void => {
    // Réinitialiser les valeurs éditées et quitter le mode édition
    setEditedInfo({...userInfo});
    setIsEditing(false);
    toast.info("Changes canceled.");
  };
  
  // Fonction pour gérer les changements d'input avec filtrage en temps réel
  const handleInputChange = (field: keyof UserInfo, value: string): void => {
    let filteredValue = value;

    switch (field) {
      case 'firstName':
      case 'lastName':
        // Filtrer pour ne garder que les lettres et espaces
        filteredValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
        break;
      case 'phone':
        // Filtrer pour ne garder que les chiffres et limiter à 8 caractères
        filteredValue = value.replace(/[^\d]/g, '').slice(0, 8);
        break;
      case 'email':
        // Pour l'email, on laisse taper librement mais on validera à la sauvegarde
        filteredValue = value;
        break;
      default:
        filteredValue = value;
        break;
    }

    // Mettre à jour l'état avec la valeur filtrée
    setEditedInfo({
      ...editedInfo,
      [field]: filteredValue
    });
  };

  const handleChangePassword = (): void => {
    // Navigation vers la page de changement de mot de passe
    navigate('/change-password');
  };
  
  // Fonction pour basculer l'affichage du mot de passe
  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
    
    // Masquer automatiquement le mot de passe après 5 secondes
    if (!showPassword) {
      setTimeout(() => {
        setShowPassword(false);
      }, 5000);
    }
  };
  
  // Fonction pour convertir un fichier en base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Fonction améliorée pour gérer le téléchargement direct de l'avatar
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Valider le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image.");
      return;
    }
    
    // Limiter la taille du fichier (5MB par exemple)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("The image must not exceed 5MB.");
      return;
    }
    
    setIsUploadingAvatar(true);
    
    try {
      // Convertir le fichier en base64 pour le stockage local
      const base64Image = await convertFileToBase64(file);
      
      // Créer un timestamp unique pour éviter les conflits de cache
      const timestamp = Date.now();
      const imageKey = `avatar_${timestamp}`;
      
      // Stocker l'image en base64 dans localStorage avec une clé unique
      localStorage.setItem(imageKey, base64Image);
      
      // Mettre à jour l'avatar dans l'état
      const newAvatarUrl = base64Image;
      
      if (isEditing) {
        setEditedInfo({
          ...editedInfo,
          avatarUrl: newAvatarUrl
        });
      } else {
        // Si on n'est pas en mode édition, mettre à jour directement
        setUserInfo({
          ...userInfo,
          avatarUrl: newAvatarUrl
        });
        
        // Émettre un événement pour synchroniser avec d'autres composants
        const avatarChangeEvent = new CustomEvent('avatarChanged', {
          detail: { avatarUrl: newAvatarUrl }
        });
        window.dispatchEvent(avatarChangeEvent);
      }
      
      toast.success("Profile picture  updated successfully!");
    } catch (error) {
      console.error("Erreur lors du traitement de l'image:", error);
      toast.error("Erreur lors du traitement de l'image");
    } finally {
      setIsUploadingAvatar(false);
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleChangeAvatar = (): void => {
    if (isUploadingAvatar) {
      toast.info("Uploading in progress, please wait...");
      return;
    }
    
    // Déclencher le clic sur l'input file caché
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Fonction pour supprimer l'avatar
  const handleRemoveAvatar = (): void => {
    if (window.confirm("Are you sure you want to delete your profile picture?")) {
      const emptyAvatarUrl = "";
      
      if (isEditing) {
        setEditedInfo({
          ...editedInfo,
          avatarUrl: emptyAvatarUrl
        });
      } else {
        setUserInfo({
          ...userInfo,
          avatarUrl: emptyAvatarUrl
        });
        
        // Émettre un événement pour synchroniser avec d'autres composants
        const avatarChangeEvent = new CustomEvent('avatarChanged', {
          detail: { avatarUrl: emptyAvatarUrl }
        });
        window.dispatchEvent(avatarChangeEvent);
      }
      
      // Nettoyer le localStorage
      localStorage.removeItem(AVATAR_STORAGE_KEY);
      
      toast.success("Profile picture deleted.");
    }
  };

  // Fonction pour réinitialiser le profil aux valeurs par défaut
  const handleResetProfile = (): void => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser votre profil aux valeurs par défaut?")) {
      setUserInfo({...defaultUserInfo});
      setPassword("MonMotDePasse123"); // Réinitialiser aussi le mot de passe
      
      // Nettoyer les données stockées
      localStorage.removeItem(AVATAR_STORAGE_KEY);
      
      toast.info("Profile reset to default values.");
    }
  };

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
                  <FaSave /> Saving
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
            {/* Input file caché pour la sélection d'image */}
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
                    // Fallback en cas d'erreur de chargement de l'image
                    console.error("Erreur de chargement de l'image");
                    toast.error("Image loading error.");
                    // Réinitialiser l'URL d'avatar
                    if (!isEditing) {
                      setUserInfo({
                        ...userInfo,
                        avatarUrl: ""
                      });
                    } else {
                      setEditedInfo({
                        ...editedInfo,
                        avatarUrl: ""
                      });
                    }
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
              
              {userInfo.avatarUrl && (
                <button 
                  className="remove-photo-btn" 
                  onClick={handleRemoveAvatar}
                  title="Supprimer la photo"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
          
          <div className="user-meta">
            <h2>{userInfo.firstName} {userInfo.lastName}</h2>
            <span className="user-role">{userInfo.position || userInfo.role}</span>
            <div className="user-since">
              <span>Member since:</span>
              <p>{userInfo.joinDate || userInfo.dateCreation}</p>
            </div>
            <button 
              className="reset-profile-btn"
              onClick={handleResetProfile}
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
                    userInfo.firstName || "Non spécifié"
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
                        <small className="validation-hint">Lettres only</small>
                      )}
                    </div>
                  ) : (
                    userInfo.lastName || "Non spécifié"
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
                        placeholder="exemple@gmail.com ou exemple@yahoo.com"
                        pattern="[a-zA-Z0-9._%+-]+@(gmail|yahoo)\.com"
                        title="The email must be in the format: [example@gmail.com](mailto:example@gmail.com) or [example@yahoo.com](mailto:example@yahoo.com)."
                      />
                      {editedInfo.email !== userInfo.email && (
                        <span className="field-changed-indicator"><FaCheck /></span>
                      )}
                      {editedInfo.email && !validateEmail(editedInfo.email) && (
                        <small className="validation-hint">Format: exemple@gmail.com or exemple@yahoo.com</small>
                      )}
                    </div>
                  ) : (
                    userInfo.email || "Non spécifié"
                  )}
                </div>
              </div>
              
              <div className="info-item ">
                <div className="info-label">
                  <FaPhone className="info-icon" />
                  <span>Phone number </span>
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
                    userInfo.phone || "Non spécifié"
                  )}
                </div>
              </div>
              
              <div className="info-item ">
                <div className="info-label">
                  <FaMapMarkerAlt className="info-icon" />
                  <span>Adress</span>
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
                    userInfo.address || "Non spécifiée"
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
          
          {/* Message d'aide */}
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