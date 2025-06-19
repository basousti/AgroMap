import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, X, ChevronDown, User, Edit, Trash2 } from 'lucide-react';
import './listeParcelle.css';
import FormulaireParcelle from '../formulaireParcelle/formulaireParcelle';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Parcelle {
  id: number;
  nom: string;
  surface: number;
  culture: string;
  statut: 'active' | 'repos' | 'preparation';
}

interface ParcelleComplete extends Parcelle {
  montantInvestissement?: number;
  surfaceTotale?: number;
  farmerId?: string;
  dateCreation?: string;
  latitude?: number;
  longitude?: number;
  superficie?: string;
  type?: string;
  drawnParcels?: any[];
  coordonnees?: any;
  formeType?: string;
}

interface Farmer {
  _id: {
    _id: string;
    name: string;
    prenom: string;
  };
  localite: string;
  telephone: string;
  adresse: string;
}

const ListeParcelle: React.FC = () => {
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingParcelle, setEditingParcelle] = useState<Parcelle | null>(null);
  const [parcelleCompleteToEdit, setParcelleCompleteToEdit] = useState<ParcelleComplete | null>(null);

  // Chargement initial des parcelles
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Chargement des agriculteurs
        const farmersResponse = await fetch(`http://localhost:5000/api/parcelles/farmers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (farmersResponse.ok) {
          const farmersData = await farmersResponse.json();
          setFarmers(farmersData.farmers || farmersData.data || []);
        }

        // Chargement des parcelles
        const parcellesResponse = await fetch(' http://localhost:5000/api/parcelles/', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (parcellesResponse.ok) {
          const parcellesData = await parcellesResponse.json();
          setParcelles(parcellesData);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchParcelleComplete = async (id: number): Promise<ParcelleComplete | null> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/parcelles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("Erreur lors du chargement de la parcelle:", error);
      return null;
    }
  };

  const getStatutConfig = (statut: string) => {
    switch (statut) {
      case 'active': return { color: 'status-active', text: 'Active', dot: 'dot-active' };
      case 'repos': return { color: 'status-repos', text: 'En repos', dot: 'dot-repos' };
      case 'preparation': return { color: 'status-preparation', text: 'Preparation', dot: 'dot-preparation' };
      default: return { color: 'status-default', text: 'Inconnu', dot: 'dot-default' };
    }
  };

  const filteredParcelles = parcelles.filter(parcelle => {
    if (!selectedFarmer) {
      return true;
    }
    
    const farmerFullName = `${selectedFarmer._id.name} ${selectedFarmer._id.prenom}`.toLowerCase();
    const parcelleName = parcelle.nom.toLowerCase();
    
    return parcelleName.includes(farmerFullName);
  });

  const handleFarmerSelect = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setIsDropdownOpen(false);
  };

  const handleAjouterClick = () => {
    if (selectedFarmer) {
      console.log("Préparation à ajouter une parcelle pour:", selectedFarmer._id.name, selectedFarmer._id.prenom);
      setEditingParcelle(null);
      setParcelleCompleteToEdit(null);
      setShowModal(true);
    } else {
      toast.error("Please select a farmer first to assign the plot.");
    }
  };

  const handleFiltrerClick = () => {
    if (selectedFarmer) {
      console.log("Filtrer par agriculteur:", selectedFarmer._id.name, selectedFarmer._id.prenom);
    } else {
      toast.error("Please select a farmer first to filter");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingParcelle(null);
    setParcelleCompleteToEdit(null);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
      setEditingParcelle(null);
      setParcelleCompleteToEdit(null);
    }
  };

  const handleEditParcelle = async (parcelle: Parcelle) => {
    try {
      setIsLoading(true);
      const completeData = await fetchParcelleComplete(parcelle.id);
      
      if (completeData) {
        setParcelleCompleteToEdit(completeData);
        
        // Trouver l'agriculteur correspondant
        if (completeData.farmerId) {
          const farmer = farmers.find(f => f._id._id === completeData.farmerId);
          if (farmer) setSelectedFarmer(farmer);
        }
      } else {
        setEditingParcelle(parcelle);
      }
      
      setShowModal(true);
    } catch (error) {
      console.error("Erreur lors de la préparation de l'édition:", error);
      toast.error("Erreur lors du chargement des données de la parcelle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteParcelle = async (parcelle: Parcelle) => {
    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer la parcelle ${parcelle.nom}?`);

    if (confirmDelete) {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/parcelles/${parcelle.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          setParcelles(prev => prev.filter(p => p.id !== parcelle.id));
          toast.success(`Parcelle "${parcelle.nom}" supprimée avec succès!`);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast.error("Une erreur est survenue lors de la suppression");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleParcelleSubmit = async (parcelleData: any) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const nomAgriculteur = selectedFarmer 
        ? `${selectedFarmer._id.name} ${selectedFarmer._id.prenom}`
        : 'Agriculteur inconnu';

      let updatedParcelles = [...parcelles];
      
      if (editingParcelle || parcelleCompleteToEdit) {
        // Mode modification
        const parcelleId = parcelleCompleteToEdit?.id || editingParcelle?.id;
        const response = await fetch(`http://localhost:5000/api/parcelles/${parcelleId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...parcelleData,
            farmerId: selectedFarmer?._id._id
          })
        });

        if (response.ok) {
          const updatedParcelle = await response.json();
          updatedParcelles = parcelles.map(p => p.id === parcelleId ? updatedParcelle : p);
          toast.success(`Parcelle "${nomAgriculteur}" modifiée avec succès!`);
        }
      } else {
        // Mode ajout
        const response = await fetch('http://localhost:5000/api/parcelles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...parcelleData,
            farmerId: selectedFarmer?._id._id
          })
        });

        if (response.ok) {
          const newParcelle = await response.json();
          updatedParcelles = [...parcelles, newParcelle];
          toast.success(`Parcelle "${nomAgriculteur}" ajoutée avec succès!`);
        }
      }

      setParcelles(updatedParcelles);
      setShowModal(false);
      setEditingParcelle(null);
      setParcelleCompleteToEdit(null);
    } catch (error) {
      console.error("Erreur lors de l'envoi des données:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const prepareEditingData = () => {
    if (parcelleCompleteToEdit) return parcelleCompleteToEdit;
    if (editingParcelle) return editingParcelle;
    return null;
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Chargement des parcelles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="parcelle-container">
      <div className="parcelle-wrapper">

        {/* Barre de contrôles */}
        <div className="controls-section">
          <div className="controls-row">

            {/* Sélecteur d'agriculteur */}
            <div className="farmer-selector-container">
              <div className="farmer-selector">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="farmer-selector-button"
                >
                  <div className="farmer-selector-content">
                    <div className="farmer-selector-left">
                      <User size={20} className="farmer-icon" />
                      <span className={selectedFarmer ? "farmer-selected" : "farmer-placeholder"}>
                        {selectedFarmer
                          ? `${selectedFarmer._id.name} ${selectedFarmer._id.prenom}`
                          : "Sélectionner un agriculteur..."
                        }
                      </span>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`dropdown-arrow ${isDropdownOpen ? 'dropdown-arrow-open' : ''}`}
                    />
                  </div>
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                  <div className="farmer-dropdown">
                    <div className="farmer-dropdown-content">
                      <div
                        onClick={() => {
                          setSelectedFarmer(null);
                          setIsDropdownOpen(false);
                        }}
                        className="farmer-option farmer-option-all"
                      >
                        All farmers
                      </div>
                      {farmers.map((farmer) => (
                        <div
                          key={farmer._id._id}
                          onClick={() => handleFarmerSelect(farmer)}
                          className="farmer-option"
                        >
                          <User size={16} className="farmer-option-icon" />
                          <div className="farmer-option-details">
                            <div className="farmer-option-name">
                              {farmer._id.name} {farmer._id.prenom}
                            </div>
                            <div className="farmer-option-info">
                              {farmer.localite} • {farmer.telephone}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="actions-container">
              <button
                className="action-button-parcel action-button-filter"
                onClick={handleFiltrerClick}
              >
                <Filter size={20} />
                <span className="button-text">Filter</span>
              </button>
              <button
                className="action-button-parcel action-button-primary"
                onClick={handleAjouterClick}
              >
                <Plus size={20} />
                <span className="button-text">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tableau principal */}
        <div className="table-container">

          {/* En-tête du tableau */}
          <div className="table-header">
            <div className="table-header-row">
              <div className="header-cell header-name">Farmer Name</div>
              <div className="header-cell header-surface">Area</div>
              <div className="header-cell header-culture">Crop</div>
              <div className="header-cell header-status">Status</div>
              <div className="header-cell header-actions">Actions</div>
            </div>
          </div>

          {/* Corps du tableau */}
          <div className="table-body">
            {filteredParcelles.map((parcelle, index) => {
              const statutConfig = getStatutConfig(parcelle.statut);

              return (
                <div
                  key={parcelle.id}
                  className="table-row"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Nom de la parcelle */}
                  <div className="table-cell cell-name">
                    <div className={`status-dot ${statutConfig.dot}`}></div>
                    <div className="name-content">
                      <h3 className="parcelle-name">
                        {parcelle.nom}
                      </h3>
                      <p className="parcelle-id">ID: {parcelle.id}</p>
                    </div>
                  </div>

                  {/* Surface */}
                  <div className="table-cell cell-surface">
                    <div className="surface-badge">
                      <span className="surface-value">
                        {parcelle.surface.toFixed(1)}
                      </span>
                      <span className="surface-unit">m²</span>
                    </div>
                  </div>

                  {/* Culture */}
                  <div className="table-cell cell-culture">
                    <div className="culture-badge">
                      {parcelle.culture}
                    </div>
                  </div>

                  {/* Statut */}
                  <div className="table-cell cell-status">
                    <div className={`status-badge ${statutConfig.color}`}>
                      {statutConfig.text}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="table-cell cell-actions">
                    <div className="actions-buttons">
                      <button
                        className="action-btn action-btn-edit"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log("🖊️ Clic sur modifier pour parcelle:", parcelle.id);
                          handleEditParcelle(parcelle);
                        }}
                        title="Modifier la parcelle"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="action-btn action-btn-delete"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log("🗑️ Clic sur supprimer pour parcelle:", parcelle.id);
                          handleDeleteParcelle(parcelle);
                        }}
                        title="Remove Parcel"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message si aucun résultat */}
          {filteredParcelles.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <Search size={24} />
              </div>
              <h3 className="empty-title">Remove Parcel</h3>
              <p className="empty-description">
                {selectedFarmer
                  ? `No plots found for ${selectedFarmer._id.name} ${selectedFarmer._id.prenom}`
                  : "No plots available"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ✅ MODAL CORRIGÉE avec types compatibles */}
      {showModal && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {(editingParcelle || parcelleCompleteToEdit) ? 'Edit Existing Plot' : 'Add New Plot Entry'}
              </h2>
              {selectedFarmer && (
                <span className="modal-farmer-info">
                  for {selectedFarmer._id.name} {selectedFarmer._id.prenom}
                </span>
              )}
              {/* Indicateur de type de données en édition */}
              {(editingParcelle || parcelleCompleteToEdit) && (
                <div style={{
                  fontSize: '12px',
                  color: parcelleCompleteToEdit ? '#10b981' : '#f59e0b',
                  fontWeight: '600',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {parcelleCompleteToEdit ? (
                    <>✅ Full dataset available for editing</>
                  ) : (
                    <>⚠️ Only core information available</>
                  )}
                </div>
              )}
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              {/* ✅ FORMULAIRE AVEC PROPS CORRECTEMENT TYPÉES */}
              <FormulaireParcelle
                onSubmit={handleParcelleSubmit}
                onClose={handleCloseModal}
                farmerId={selectedFarmer?._id._id || ''}
                useInternalNavigation={false}
                // ✅ Props d'édition avec types compatibles
                editingParcelle={prepareEditingData()}
                isEditMode={!!(editingParcelle || parcelleCompleteToEdit)}
              />
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default ListeParcelle;