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

// ✨ INTERFACE CORRIGÉE pour les données complètes d'édition - Compatible avec ParcelleEditData
interface ParcelleComplete {
  id: number;
  nom: string;
  culture: string;
  statut: 'active' | 'repos' | 'preparation';
  surface?: number; // Optionnel pour compatibilité
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

  // ✨ État pour les données complètes d'édition - Type corrigé
  const [parcelleCompleteToEdit, setParcelleCompleteToEdit] = useState<ParcelleComplete | null>(null);

  // ✨ Fonction pour charger les parcelles depuis localStorage
  const chargerParcellesLocalStorage = () => {
    try {
      const savedParcelles = localStorage.getItem('parcellesEnregistrees');
      if (savedParcelles) {
        const parcellesData = JSON.parse(savedParcelles);
        console.log('📋 Parcelles chargées depuis localStorage:', parcellesData.length);
        
        const parcellesFormatees = parcellesData.map((p: any) => {
          const farmer = farmers.find(f => f._id._id === p.farmerId);
          const nomAgriculteur = farmer 
            ? `${farmer._id.name} ${farmer._id.prenom}`
            : p.nom || 'Agriculteur inconnu';

          return {
            id: p.id,
            nom: nomAgriculteur,
            surface: p.surfaceTotale ? (p.surfaceTotale / 10000) : 0,
            culture: p.culture,
            statut: p.statut
          };
        });
        
        return parcellesFormatees;
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des parcelles:', error);
    }
    return [];
  };

  // ✨ Fonction CORRIGÉE pour récupérer les données complètes d'une parcelle
  const getParcelleCompleteData = (parcelleId: number): ParcelleComplete | null => {
    try {
      const savedParcelles = localStorage.getItem('parcellesEnregistrees');
      if (savedParcelles) {
        const parcellesData = JSON.parse(savedParcelles);
        const parcelleComplete = parcellesData.find((p: any) => p.id === parcelleId);
        
        if (parcelleComplete) {
          console.log('📋 Données complètes trouvées pour parcelle:', parcelleId, parcelleComplete);
          // ✅ S'assurer que l'objet retourné est compatible avec ParcelleEditData
          return {
            id: parcelleComplete.id,
            nom: parcelleComplete.nom,
            culture: parcelleComplete.culture,
            statut: parcelleComplete.statut,
            surface: parcelleComplete.surfaceTotale ? (parcelleComplete.surfaceTotale / 10000) : undefined,
            montantInvestissement: parcelleComplete.montantInvestissement,
            surfaceTotale: parcelleComplete.surfaceTotale,
            farmerId: parcelleComplete.farmerId,
            dateCreation: parcelleComplete.dateCreation,
            latitude: parcelleComplete.latitude,
            longitude: parcelleComplete.longitude,
            superficie: parcelleComplete.superficie,
            type: parcelleComplete.type,
            drawnParcels: parcelleComplete.drawnParcels,
            coordonnees: parcelleComplete.coordonnees,
            formeType: parcelleComplete.formeType
          };
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données complètes:', error);
    }
    return null;
  };

  // Données d'exemple pour les parcelles + parcelles du localStorage
  useEffect(() => {
    const donneesExemple: Parcelle[] = [
      { id: 1, nom: "maouia noamen", surface: 8.2, culture: "Tomate", statut: "active" },
      { id: 2, nom: "ben slimen chikh", surface: 12.5, culture: "Tomate", statut: "active" },
      { id: 3, nom: "maouia mouhamed", surface: 15.8, culture: "Piment", statut: "repos" },
    ];

    setTimeout(() => {
      const parcellesLS = chargerParcellesLocalStorage();
      console.log('📊 Parcelles localStorage:', parcellesLS.length);
      console.log('📊 Parcelles exemple:', donneesExemple.length);
      
      const toutesLesParcelles = [...donneesExemple, ...parcellesLS];
      setParcelles(toutesLesParcelles);
      setIsLoading(false);
    }, 800);
  }, [farmers]);

  // Écouter les changements dans localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('🔄 Changement détecté dans localStorage, rechargement...');
      const nouvelleParcelles = chargerParcellesLocalStorage();
      setParcelles(prev => {
        const donneesExemple = prev.slice(0, 10);
        return [...donneesExemple, ...nouvelleParcelles];
      });
    };

    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(() => {
      const currentParcelles = chargerParcellesLocalStorage();
      setParcelles(prev => {
        const donneesExemple = prev.slice(0, 10);
        if (currentParcelles.length !== prev.length - 10) {
          console.log('🆕 Changement de parcelles détecté');
          return [...donneesExemple, ...currentParcelles];
        }
        return prev;
      });
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [farmers]);

  // Récupération des agriculteurs depuis l'API
  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No authentication token found. Cannot fetch farmers.');
          return;
        }

        const response = await fetch('http://localhost:5000/api/farmers', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setFarmers(data.farmers || data.data || []);
          console.log('👥 Agriculteurs chargés:', data.farmers?.length || 0);
        } else {
          console.error("Erreur lors de la récupération des agriculteurs:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des agriculteurs:", error);
      }
    };

    fetchFarmers();
  }, []);

  const getStatutConfig = (statut: string) => {
    switch (statut) {
      case 'active': 
        return { 
          color: 'status-active', 
          text: 'Active',
          dot: 'dot-active'
        };
      case 'repos': 
        return { 
          color: 'status-repos', 
          text: 'En repos',
          dot: 'dot-repos'
        };
      case 'preparation': 
        return { 
          color: 'status-preparation', 
          text: 'Preparation',
          dot: 'dot-preparation'
        };
      default: 
        return { 
          color: 'status-default', 
          text: 'Inconnu',
          dot: 'dot-default'
        };
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

  // Fonction pour gérer la modification d'une parcelle
  const handleEditParcelle = (parcelle: Parcelle) => {
    console.log("🖊️ Modification de la parcelle:", parcelle.id);
    
    const parcelleComplete = getParcelleCompleteData(parcelle.id);
    
    if (parcelleComplete) {
      console.log("📋 Données complètes récupérées pour l'édition:", parcelleComplete);
      setParcelleCompleteToEdit(parcelleComplete);
      
      const farmer = farmers.find(f => f._id._id === parcelleComplete.farmerId);
      if (farmer) {
        setSelectedFarmer(farmer);
        console.log("👤 Agriculteur trouvé et sélectionné:", farmer._id.name, farmer._id.prenom);
      }
    } else {
      console.log("⚠️ Données complètes non trouvées, utilisation des données de base");
      setEditingParcelle(parcelle);
      
      const farmerName = parcelle.nom.toLowerCase();
      const correspondingFarmer = farmers.find(farmer => {
        const fullName = `${farmer._id.name} ${farmer._id.prenom}`.toLowerCase();
        return farmerName.includes(fullName);
      });
      
      if (correspondingFarmer) {
        setSelectedFarmer(correspondingFarmer);
      }
    }
    
    setShowModal(true);
  };

  // Fonction pour gérer la suppression d'une parcelle
  const handleDeleteParcelle = (parcelle: Parcelle) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the plot ${parcelle.nom}?\n\n` +
      `Area: ${parcelle.surface} ha\n` +
      `Crop: ${parcelle.culture}\n` +
      `Status: ${getStatutConfig(parcelle.statut).text}\n\n` +
      `This action cannot be undone.`
    );

    if (confirmDelete) {
      console.log("🗑️ Suppression de la parcelle:", parcelle.id);
      
      setParcelles(prev => prev.filter(p => p.id !== parcelle.id));
      
      try {
        const savedParcelles = localStorage.getItem('parcellesEnregistrees');
        if (savedParcelles) {
          const parcellesData = JSON.parse(savedParcelles);
          const updatedParcelles = parcellesData.filter((p: any) => p.id !== parcelle.id);
          localStorage.setItem('parcellesEnregistrees', JSON.stringify(updatedParcelles));
          console.log("✅ Parcelle supprimée du localStorage");
        }
      } catch (error) {
        console.error("❌ Erreur lors de la suppression du localStorage:", error);
      }

      setTimeout(() => {
        toast.success(`✅ "${parcelle.nom}" plot deleted successfully!`);
      }, 200);
    }
  };

  // Fonction principale pour gérer la soumission du formulaire
  const handleParcelleSubmit = (parcelleData: any) => {
    console.log("📤 Données reçues du formulaire:", parcelleData);

    const nomAgriculteur = selectedFarmer 
      ? `${selectedFarmer._id.name} ${selectedFarmer._id.prenom}` 
      : 'Farmer is not selected ';

    if (editingParcelle || parcelleCompleteToEdit) {
      // Mode modification
      const parcelleId = parcelleCompleteToEdit?.id || editingParcelle?.id;
      
      console.log("🔄 Mode modification pour parcelle ID:", parcelleId);
      
      const updatedParcelle: Parcelle = {
        id: parcelleId!,
        nom: nomAgriculteur,
        surface: parcelleData.surfaceTotale ? (parcelleData.surfaceTotale / 10000) : 0,
        culture: parcelleData.culture,
        statut: parcelleData.statut,
      };

      console.log("🔄 Parcelle modifiée:", updatedParcelle);
      
      setParcelles(prev => prev.map(p => p.id === parcelleId ? updatedParcelle : p));
      
      try {
        const savedParcelles = localStorage.getItem('parcellesEnregistrees');
        if (savedParcelles) {
          const parcellesData = JSON.parse(savedParcelles);
          const updatedParcellesData = parcellesData.map((p: any) => 
            p.id === parcelleId ? { 
              ...parcelleData,
              id: parcelleId,
              nom: nomAgriculteur,
              farmerId: selectedFarmer?._id._id
            } : p
          );
          localStorage.setItem('parcellesEnregistrees', JSON.stringify(updatedParcellesData));
          console.log("✅ Parcelle mise à jour dans localStorage avec données complètes");
        }
      } catch (error) {
        console.error("❌ Erreur lors de la mise à jour localStorage:", error);
      }

      setShowModal(false);
      setEditingParcelle(null);
      setParcelleCompleteToEdit(null);

      setTimeout(() => {
        toast.success(`✅ Plot for farmer "${nomAgriculteur}" was successfully modified!\n📐 Area: ${(parcelleData.surfaceTotale / 10000).toFixed(2)} hectares\n🌾 Crop type: ${parcelleData.culture}\n📊 Current status: ${parcelleData.statut}`);
      }, 300);
    } else {
      // Mode ajout
      const newParcelle: Parcelle = {
        id: parcelleData.id || Date.now(),
        nom: nomAgriculteur,
        surface: parcelleData.surfaceTotale ? (parcelleData.surfaceTotale / 10000) : 0,
        culture: parcelleData.culture,
        statut: parcelleData.statut,
      };

      console.log("🆕 Nouvelle parcelle avec nom automatique:", newParcelle);
      setParcelles(prev => [...prev, newParcelle]);
      setShowModal(false);

      setTimeout(() => {
        toast.success(`✅ Plot for "${nomAgriculteur}" successfully added!\n📐 Area: ${(parcelleData.surfaceTotale / 10000).toFixed(2)} ha\n🌾 Crop: ${parcelleData.culture}\n📊 Status: ${parcelleData.statut}`);
      }, 300);
    }
  };

  // ✨ FONCTION UTILITAIRE pour convertir les données vers le format attendu par le formulaire
  const prepareEditingData = (): any => {
    if (parcelleCompleteToEdit) {
      // Données complètes disponibles
      return parcelleCompleteToEdit;
    } else if (editingParcelle) {
      // Données de base uniquement - conversion vers format compatible
      return {
        id: editingParcelle.id,
        nom: editingParcelle.nom,
        surface: editingParcelle.surface,
        culture: editingParcelle.culture,
        statut: editingParcelle.statut
      };
    }
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
      <ToastContainer/>
    </div>
  );
};

export default ListeParcelle;