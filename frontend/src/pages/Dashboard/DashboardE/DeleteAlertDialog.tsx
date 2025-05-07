import React from 'react';
import './styleAlert.css';

interface Farmer {
  _id: string;
  nom: string;
  prenom: string;
}

interface DeleteAlertDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: (deletedId: string) => void;
  farmer?: Farmer;
}

const DeleteAlertDialog: React.FC<DeleteAlertDialogProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  farmer,
}) => {
  if (!isOpen || !farmer) return null;

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/farmers/${farmer._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json', // 🔥 Correction importante pour CORS
        },
      });

      if (response.ok) {
        onConfirm(farmer._id);
        alert('Agriculteur supprimé avec succès !'); // ✅ Suppression réussie
      } else {
        const errorData = await response.text();
        console.error('Erreur serveur :', errorData);
        alert('Échec de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'agriculteur:', error);
      alert('Une erreur réseau s\'est produite');
    }
  };

  return (
    <div className="delete-alert-overlay">
      <div className="delet-dialog">
        <div className="delete-alert-icon">
          <span role="img" aria-label="warning">⚠️</span>
        </div>
        <div className="delete-alert-content">
          <p>
            Êtes-vous sûr de vouloir supprimer cet agriculteur :
            <strong> {farmer.nom} {farmer.prenom} ?</strong>
          </p>
        </div>
        <div className="delete-alert-buttons">
          <button className="delete-alert-ok" onClick={handleConfirmDelete}>OK</button>
          <button className="delete-alert-cancel" onClick={onCancel}>Annuler</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAlertDialog;

