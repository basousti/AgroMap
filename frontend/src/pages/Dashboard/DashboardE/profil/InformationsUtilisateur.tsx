import { FaArrowLeft, FaIdCard, FaEnvelope, FaPhone, FaMapMarkerAlt, FaKey, FaUserCircle, FaPencilAlt, FaSave, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
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
}

const InformationsUtilisateur: React.FC = () => {
  const navigate = useNavigate();
  
  // État pour suivre si on est en mode édition
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // Exemple de données utilisateur (remplacer par des données réelles)
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean.dupont@example.com",
    phone: "+33 6 12 34 56 78",
    address: "123 Avenue de Paris, 75000 Paris, France",
    avatarUrl: "https://via.placeholder.com/150",
    username: "jdupont",
    role: "Administrateur",
    dateCreation: "12/03/2023"
  });
  
  // État temporaire pour les modifications en cours
  const [editedInfo, setEditedInfo] = useState<UserInfo>({...userInfo});
  
  const handleBack = (): void => {
    navigate('/UserProfile');
  };

  const handleEditProfile = (): void => {
    if (isEditing) {
      // Si on était déjà en train d'éditer, on sauvegarde les modifications
      setUserInfo({...editedInfo});
      setIsEditing(false);
    } else {
      // Sinon, on active le mode édition
      setEditedInfo({...userInfo});
      setIsEditing(true);
    }
  };
  
  const handleCancelEdit = (): void => {
    // Réinitialiser les valeurs éditées et quitter le mode édition
    setEditedInfo({...userInfo});
    setIsEditing(false);
  };
  
  const handleInputChange = (field: keyof UserInfo, value: string): void => {
    setEditedInfo({
      ...editedInfo,
      [field]: value
    });
  };

  const handleChangePassword = (): void => {
    // Naviguer vers la page de changement de mot de passe
    navigate('/change-password');
  };
  
  const handleChangeAvatar = (): void => {
    // Naviguer vers la page de changement de photo
    navigate('/change-avatar');
  };

  return (
    <div className="user-info-page">
      <div className="info-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleBack}><FaArrowLeft /></button>
          <h1>Informations du Profil</h1>
        </div>
        {isEditing ? (
          <div className="edit-actions">
            <button className="save-profile-btn" onClick={handleEditProfile}>
              <FaSave /> Sauvegarder
            </button>
            <button className="cancel-edit-btn" onClick={handleCancelEdit}>
              <FaTimes /> Annuler
            </button>
          </div>
        ) : (
          <button className="edit-profile-main-btn" onClick={handleEditProfile}>
            <FaPencilAlt /> Modifier le profil
          </button>
        )}
      </div>
      
      <div className="info-container">
        <div className="info-sidebar">
          <div className="avatar-container">
            {userInfo.avatarUrl ? (
              <img src={userInfo.avatarUrl} alt={`${userInfo.firstName} ${userInfo.lastName}`} className="user-avatar" />
            ) : (
              <FaUserCircle className="default-avatar" />
            )}
            {/* Ce bouton reste toujours navigable vers une page séparée */}
            <button className="change-photo-btn" onClick={handleChangeAvatar}>Changer la photo</button>
          </div>
          
          <div className="user-meta">
            <h2>{userInfo.firstName} {userInfo.lastName}</h2>
            <span className="user-role">{userInfo.role}</span>
            <div className="user-since">
              <span>Membre depuis:</span>
              <p>{userInfo.dateCreation}</p>
            </div>
          </div>
        </div>
        
        <div className="info-main">
          <div className="info-section">
            <h3>Informations Personnelles</h3>
            
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">
                  <FaIdCard className="info-icon" />
                  <span>Prénom</span>
                </div>
                <div className="info-value">
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editedInfo.firstName} 
                      onChange={(e) => handleInputChange('firstName', e.target.value)} 
                      className="editable-input"
                    />
                  ) : (
                    userInfo.firstName
                  )}
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-label">
                  <FaIdCard className="info-icon" />
                  <span>Nom</span>
                </div>
                <div className="info-value">
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editedInfo.lastName} 
                      onChange={(e) => handleInputChange('lastName', e.target.value)} 
                      className="editable-input"
                    />
                  ) : (
                    userInfo.lastName
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
                    <input 
                      type="email" 
                      value={editedInfo.email} 
                      onChange={(e) => handleInputChange('email', e.target.value)} 
                      className="editable-input"
                    />
                  ) : (
                    userInfo.email
                  )}
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-label">
                  <FaPhone className="info-icon" />
                  <span>Téléphone</span>
                </div>
                <div className="info-value">
                  {isEditing ? (
                    <input 
                      type="tel" 
                      value={editedInfo.phone} 
                      onChange={(e) => handleInputChange('phone', e.target.value)} 
                      className="editable-input"
                    />
                  ) : (
                    userInfo.phone
                  )}
                </div>
              </div>
              
              <div className="info-item full-width">
                <div className="info-label">
                  <FaMapMarkerAlt className="info-icon" />
                  <span>Adresse</span>
                </div>
                <div className="info-value">
                  {isEditing ? (
                    <textarea 
                      value={editedInfo.address} 
                      onChange={(e) => handleInputChange('address', e.target.value)} 
                      className="editable-input address-input"
                    />
                  ) : (
                    userInfo.address
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="info-section">
            <h3>Sécurité</h3>
            
            <div className="info-grid">
              <div className="info-item security-item">
                <div className="info-label">
                  <FaKey className="info-icon" />
                  <span>Mot de passe</span>
                </div>
                <div className="info-value password-value">
                  <span>••••••••••••</span>
                  {/* Ce bouton reste toujours navigable vers une page séparée */}
                  <button className="change-password-btn" onClick={handleChangePassword}>
                    Changer le mot de passe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InformationsUtilisateur;