import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUpload, FaUserCircle, FaTrashAlt, FaUndo, FaRedo, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ChangeAvatar.css';
 
// Clés pour le stockage local
const USER_INFO_STORAGE_KEY = 'user_profile_info';
const AVATAR_STORAGE_KEY = 'user_avatar';

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

const ChangeAvatar: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Récupérer l'avatar actuel au chargement du composant
  React.useEffect(() => {
    const loadCurrentAvatar = (): void => {
      try {
        // Récupérer d'abord depuis le stockage séparé de l'avatar
        const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
        if (savedAvatar) {
          setCurrentAvatar(savedAvatar);
          return;
        }

        // Sinon, récupérer depuis les informations utilisateur
        const savedUserInfo = localStorage.getItem(USER_INFO_STORAGE_KEY);
        if (savedUserInfo) {
          const userData: UserInfo = JSON.parse(savedUserInfo);
          setCurrentAvatar(userData.avatarUrl || null);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'avatar:', error);
        toast.error('Impossible de charger votre avatar actuel');
      }
    };

    loadCurrentAvatar();
  }, []);

  const handleBack = (): void => {
    navigate('/InformationsUtilisateur');
  };

  const handleUploadClick = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }

    // Vérifier le type de fichier
    if (!file.type.match('image.*')) {
      toast.error('Veuillez sélectionner une image valide');
      return;
    }

    // Vérifier la taille du fichier (limite à 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 MB');
      return;
    }

    try {
      setSelectedFile(file);
      const base64Image = await convertFileToBase64(file);
      setPreviewImage(base64Image);
      // Réinitialiser les transformations
      setRotation(0);
      setZoom(1);
      toast.success('Image chargée avec succès');
    } catch (error) {
      console.error('Erreur lors du traitement de l\'image:', error);
      toast.error('Erreur lors du traitement de l\'image');
    }
  };

  const handleRemoveImage = (): void => {
    setPreviewImage(null);
    setSelectedFile(null);
    setRotation(0);
    setZoom(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRotateLeft = (): void => {
    setRotation(prev => (prev - 90) % 360);
  };

  const handleRotateRight = (): void => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleZoomIn = (): void => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = (): void => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetTransforms = (): void => {
    setRotation(0);
    setZoom(1);
  };

  const applyImageTransforms = useCallback((imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error('Canvas non disponible'));
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Contexte 2D non disponible'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Définir la taille du canvas
        const size = 300; // Taille fixe pour l'avatar
        canvas.width = size;
        canvas.height = size;

        // Calculer les dimensions de l'image avec le zoom
        const scaledWidth = img.width * zoom;
        const scaledHeight = img.height * zoom;

        // Centrer l'image
        const x = (size - scaledWidth) / 2;
        const y = (size - scaledHeight) / 2;

        // Effacer le canvas
        ctx.clearRect(0, 0, size, size);

        // Sauvegarder le contexte
        ctx.save();

        // Appliquer la rotation depuis le centre
        ctx.translate(size / 2, size / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-size / 2, -size / 2);

        // Dessiner l'image transformée
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        // Restaurer le contexte
        ctx.restore();

        // Convertir en base64
        const transformedImage = canvas.toDataURL('image/jpeg', 0.9);
        resolve(transformedImage);
      };

      img.onerror = () => {
        reject(new Error('Erreur lors du chargement de l\'image'));
      };

      img.src = imageUrl;
    });
  }, [rotation, zoom]);

  const updateUserProfile = async (newAvatarUrl: string): Promise<void> => {
    try {
      // Mettre à jour les informations utilisateur dans localStorage
      const savedUserInfo = localStorage.getItem(USER_INFO_STORAGE_KEY);
      if (savedUserInfo) {
        const userData: UserInfo = JSON.parse(savedUserInfo);
        userData.avatarUrl = newAvatarUrl;
        localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(userData));
      }

      // Sauvegarder l'avatar séparément
      localStorage.setItem(AVATAR_STORAGE_KEY, newAvatarUrl);

      // Émettre un événement pour notifier les autres composants
      const avatarChangeEvent = new CustomEvent('avatarChanged', {
        detail: { avatarUrl: newAvatarUrl }
      });
      window.dispatchEvent(avatarChangeEvent);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw new Error('Erreur lors de la sauvegarde');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!previewImage) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setIsLoading(true);

    try {
      let finalImageUrl = previewImage;

      // Appliquer les transformations si nécessaire
      if (rotation !== 0 || zoom !== 1) {
        finalImageUrl = await applyImageTransforms(previewImage);
      }

      // Mettre à jour le profil utilisateur
      await updateUserProfile(finalImageUrl);

      toast.success('Avatar mis à jour avec succès!');
      
      // Rediriger vers la page de profil après 1.5 secondes
      setTimeout(() => {
        navigate('/InformationsUtilisateur');
      }, 1500);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCurrentAvatar = async (): Promise<void> => {
    if (!currentAvatar) {
      toast.info('Aucun avatar à supprimer');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer votre avatar actuel?')) {
      return;
    }

    setIsLoading(true);

    try {
      await updateUserProfile('');
      setCurrentAvatar(null);
      toast.success('Avatar supprimé avec succès');
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression de l\'avatar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="change-avatar-page">
      <ToastContainer position="top-right" autoClose={5000} />
      
      <div className="change-avatar-header">
        <button className="back-btn" onClick={handleBack}>
          <FaArrowLeft />
        </button>
        <h1>Changer ma photo de profil</h1>
      </div>
      
      <div className="change-avatar-container">
        <form onSubmit={handleSubmit} className="change-avatar-form">
          <div className="avatar-preview-section">
            <div className="current-avatar">
              <h3>Photo actuelle</h3>
              <div className="avatar-preview">
                {currentAvatar ? (
                  <img src={currentAvatar} alt="Avatar actuel" />
                ) : (
                  <FaUserCircle className="default-avatar" />
                )}
              </div>
              {currentAvatar && (
                <button 
                  type="button" 
                  className="remove-current-avatar-btn"
                  onClick={handleRemoveCurrentAvatar}
                  disabled={isLoading}
                >
                  <FaTrashAlt /> Supprimer l'avatar actuel
                </button>
              )}
            </div>
            
            <div className="new-avatar">
              <h3>Nouvelle photo</h3>
              <div className="avatar-preview">
                {previewImage ? (
                  <div className="preview-container">
                    <img 
                      src={previewImage} 
                      alt="Aperçu de l'avatar" 
                      style={{
                        transform: `rotate(${rotation}deg) scale(${zoom})`,
                        transformOrigin: 'center'
                      }}
                    />
                  </div>
                ) : (
                  <div className="upload-placeholder" onClick={handleUploadClick}>
                    <FaUpload />
                    <span>Cliquez pour télécharger</span>
                  </div>
                )}
              </div>
              
              {previewImage && (
                <div className="image-controls">
                  <div className="transform-controls">
                    <button 
                      type="button" 
                      className="control-btn"
                      onClick={handleRotateLeft}
                      title="Rotation gauche"
                    >
                      <FaUndo />
                    </button>
                    <button 
                      type="button" 
                      className="control-btn"
                      onClick={handleRotateRight}
                      title="Rotation droite"
                    >
                      <FaRedo />
                    </button>
                    <button 
                      type="button" 
                      className="control-btn"
                      onClick={handleZoomOut}
                      title="Zoom arrière"
                      disabled={zoom <= 0.5}
                    >
                      <FaSearchMinus />
                    </button>
                    <button 
                      type="button" 
                      className="control-btn"
                      onClick={handleZoomIn}
                      title="Zoom avant"
                      disabled={zoom >= 3}
                    >
                      <FaSearchPlus />
                    </button>
                    <button 
                      type="button" 
                      className="control-btn"
                      onClick={handleResetTransforms}
                      title="Réinitialiser"
                    >
                      <FaRedo />
                    </button>
                  </div>
                  
                  <div className="image-actions">
                    <button 
                      type="button" 
                      className="change-image-btn"
                      onClick={handleUploadClick}
                    >
                      <FaUpload /> Changer l'image
                    </button>
                    <button 
                      type="button" 
                      className="remove-image-btn"
                      onClick={handleRemoveImage}
                    >
                      <FaTrashAlt /> Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          
          {/* Canvas caché pour les transformations */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
            width={300}
            height={300}
          />
          
          <div className="avatar-upload-info">
            <h3>Instructions:</h3>
            <ul>
              <li>Formats acceptés: JPEG, PNG, GIF, WebP</li>
              <li>Taille maximale: 5 MB</li>
              <li>Résolution recommandée: 300x300 pixels ou plus</li>
              <li>Utilisez les contrôles pour ajuster l'image avant de sauvegarder</li>
            </ul>
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="save-avatar-btn"
              disabled={isLoading || !previewImage}
            >
              {isLoading ? (
                <>
                  <div className="button-spinner"></div>
                  Sauvegarde en cours...
                </>
              ) : (
                'Enregistrer la nouvelle photo'
              )}
            </button>
            
            <button 
              type="button" 
              className="cancel-btn"
              onClick={handleBack}
              disabled={isLoading}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeAvatar;