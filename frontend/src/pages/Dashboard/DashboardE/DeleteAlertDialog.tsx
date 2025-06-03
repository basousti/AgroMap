import React from 'react';
import './styleAlert.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


interface Farmer {
 _id: {
    _id: string;
    name: string;
    prenom: string;
  };
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
        onConfirm(farmer._id._id);
        toast.success('Farmer deleted successfully!')
      } else {
        const errorData = await response.text();
        console.error('Erreur serveur :', errorData);
        toast.error('Deletion failed'); 
      
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'agriculteur:', error);
      toast.error('A network error occurred.'); 
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
            Are you sure you want to delete this farmer:
            <strong> {farmer._id.name} {farmer._id.prenom} ?</strong>
          </p>
        </div>
        <div className="delete-alert-buttons">
          <button className="delete-alert-ok" onClick={handleConfirmDelete}>Yes</button>
          <button className="delete-alert-cancel" onClick={onCancel}>Cancle</button>
          <ToastContainer />
        </div>
      </div>
    </div>
  );
};

export default DeleteAlertDialog;

