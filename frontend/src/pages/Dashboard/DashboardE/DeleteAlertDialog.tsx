import React from 'react';
import './styleAlert.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


interface DeleteAlertDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: (deletedId: string) => void;
  farmerId?: string;
  farmerName?: string;
}

const DeleteAlertDialog: React.FC<DeleteAlertDialogProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  farmerId,
  farmerName
}) => {
  if (!isOpen || !farmerId) return null;

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/farmers/${farmerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!response.ok) throw new Error('Deletion failed');
      
      // Update parent state and close dialog
      onConfirm(farmerId);
      
      // Show success message
      console.log('About to show toast'); // Add this
      toast.success(`${farmerName} deleted successfully!`);
      
    } catch (error) {
      toast.error(`Failed to delete ${farmerName}`);
      console.error('Deletion error:', error);
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
            <strong> {farmerName} ?</strong>
          </p>
        </div>
        <div className="delete-alert-buttons">
          <button className="delete-alert-ok" onClick={handleConfirmDelete}>Yes</button>
          <button className="delete-alert-cancel" onClick={onCancel}>Cancel</button>
          <ToastContainer/>
        </div>
      </div>
    </div>
  );
};

export default DeleteAlertDialog;

