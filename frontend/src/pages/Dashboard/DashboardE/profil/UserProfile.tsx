import { FC, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCog, FaUserEdit, FaMoon, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import './UserProfile.css';

interface UserProfileProps {
  onClose?: () => void;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
}

const UserProfile: FC<UserProfileProps> = ({
  onClose,
  userName = 'Nom Utilisateur',
  userEmail = 'user@example.com',
  avatarUrl = ''
}) => {
  const navigate = useNavigate();
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [avatar, setAvatar] = useState<string>(avatarUrl);

   useEffect(() => {
    const storedAvatar = localStorage.getItem('user_avatar');
    if (storedAvatar) {
      setAvatar(storedAvatar);
    }
  }, []);
 localStorage.setItem('avatar', 'https://example.com/avatar.jpg');
  const handleBack = useCallback((): void => {
    if (onClose) {
      onClose();
    } else {
      navigate('/DashboardE');
    }
  }, [onClose, navigate]);

  const handleProfileInfo = useCallback((): void => {
    navigate('/InformationsUtilisateur');
  }, [navigate]);

  const toggleSettingsModal = useCallback((): void => {
    setShowSettingsModal(prev => !prev);
  }, []);

  const handleLogout = useCallback((): void => {
    // Implémentation de la déconnexion
    navigate('/login1');
  }, [navigate]);

  const handleDarkMode = useCallback((): void => {
    // Implémentation du mode sombre
  }, []);

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div className="user-profile-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="profile-header">
          <button
            className="back-button"
            onClick={handleBack}
            aria-label="Retour"
          >
            <FaArrowLeft />
          </button>
          <h2>My profile</h2>
          <button
            className="settings-button"
            onClick={toggleSettingsModal}
            aria-label="Paramètres"
          >
            <FaCog />
          </button>
        </header> 

        {/* Profile Info */}
        <section className="profile-info">
          
          <div className="profile-avatar">
            {avatar ? (
              <img src={avatar} alt={`Avatar de ${userName}`} />
            ) : (
              <div className="default-avatar">
                <FaUserCircle size={80} /> {/* Fallback icon */}
              </div>
            )}
          </div>

          <div className="profile-details">
            <h3>{userName}</h3>
            <p>{userEmail}</p>
          </div>

        </section>

        {/* Profile Actions */}
        <nav className="profile-actions">
          <button className="action-button" onClick={handleDarkMode}>
            <FaMoon />
            <span>Dark Mode</span>
          </button>
          <button className="action-button" onClick={handleProfileInfo}>
            <FaUserEdit />
            <span>Profile</span>
          </button>
          <button className="action-button" onClick={toggleSettingsModal}>
            <FaCog />
            <span>Settings</span>
          </button>
          <button className="action-button logout" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Disconnect</span>
          </button>
        </nav>

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="modal-overlay" onClick={toggleSettingsModal}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Settings</h3>
                  <button
                    className="close-button"
                    onClick={toggleSettingsModal}
                    aria-label="Fermer"
                  >
                    &times;
                  </button>
                </div>
                <div className="modal-body">
                  {/* Contenu des paramètres */}
                  <div className="settings-section">
                    <h4>Display Preferences</h4>
                    <div className="setting-option">
                      <label htmlFor="darkMode">Mode Sombre</label>
                      <input type="checkbox" id="darkMode" />
                    </div>
                  </div>
                  <div className="settings-section">
                    <h4>Notifications</h4>
                    <div className="setting-option">
                      <label htmlFor="emailNotif">Email notifications</label>
                      <input type="checkbox" id="emailNotif" defaultChecked />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-primary" onClick={toggleSettingsModal}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;