import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, X, ChevronDown, User, Edit, Trash2 } from 'lucide-react';
import './listeParcelle.css';
import FormulaireParcelle from '../formulaireParcelle/formulaireParcelle';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Parcelle {
  id: string;
  nom: string;
  superficie: number;
  culture: string;
  statut: 'active' | 'repos' | 'preparation';
}

interface ParcelleComplete extends Parcelle {
  montantInvestissement?: number;
  surfaceTotale?: number;
  farmerId?: string;
  farmerName?: string;
  dateCreation?: string;
  latitude?: number;
  longitude?: number;
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
  const [parcelles, setParcelles] = useState<ParcelleComplete[]>([]);
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
        const response = await fetch('http://localhost:5000/api/parcelles/', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Handle both array and object responses
        const parcellesData = Array.isArray(result) ? result : result.data || result.parcelles || [];


        if (!Array.isArray(parcellesData)) {
          throw new Error("API response is not an array");
        }

        setParcelles(parcellesData);

        // Extract unique farmers safely
        const uniqueFarmers: Record<string, Farmer> = {};

        parcellesData.forEach((parcelle: ParcelleComplete) => {
          if (parcelle.farmerId) {
            uniqueFarmers[parcelle.farmerId] = {
              _id: {
                _id: parcelle.farmerId,
                name: parcelle.farmerName || 'Unknown',
                prenom: ''
              },
              localite: '',
              telephone: '',
              adresse: ''
            };
          }
        });

        setFarmers(Object.values(uniqueFarmers));
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast.error("Erreur de chargement des données");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);


//Obtenir une parcelle par ID
  const fetchParcelleComplete = async (id: string): Promise<ParcelleComplete | null> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/parcelles/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Only call .json() once and store the result
    const data = await response.json();
    
    if (response.ok) {
      console.log("Fetched parcel data:", data);
      return data;
    } else {
      console.log("Fetch error response:", data);
      return null;
    }
  } catch (error) {
    console.error("Erreur lors du chargement de la parcelle:", error);
    return null;
  }
};


  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('Token non trouvé');
          return;
        }

        const response = await fetch('http://localhost:5000/api/farmers', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setFarmers(data.farmers || data.data || []);
          console.log('Agriculteurs chargés:', data.farmers?.length || 0);
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    };

    fetchFarmers();
  }, []);


//   const handleParcelleSubmit = async (parcelleData: any) => {
//     try {
//       setIsLoading(true);
//       const token = localStorage.getItem('token');
//       const nomAgriculteur = selectedFarmer
//         ? `${selectedFarmer._id.name} ${selectedFarmer._id.prenom}`
//         : 'Agriculteur inconnu';

//       let updatedParcelles = [...parcelles];
//       // ✅ Validate farmer ID first
//         if (!selectedFarmer?._id?._id) {
//           toast.error("Please select a valid farmer first");
//           setIsLoading(false);
//           return;
//         }

//         const farmerId = selectedFarmer._id._id;
//         const farmerName = `${selectedFarmer._id.name} ${selectedFarmer._id.prenom}`;

//       if (editingParcelle || parcelleCompleteToEdit) {
//         // Mode modification
//        const getParcelleId = (parcelle: any) => {
//         // Check for nested data structure
//         if (parcelle?.data) {
//           return parcelle.data.id || parcelle.data._id;
//         }
//         return parcelle?.id || parcelle?._id;
//       };

//       const parcelleId = getParcelleId(parcelleCompleteToEdit) || getParcelleId(editingParcelle);
//       console.log("iddddddddddd", parcelleId)
//           if (!parcelleId) {
//             console.error("❌ Missing parcel ID:", { parcelleCompleteToEdit, editingParcelle });
//             toast.error("Parcel ID is not defined!");
//             setIsLoading(false);
//             return;
//           }
          
//        // Prepare updated data to send in PUT request
//        const updatedData = {
//          ...parcelleData,
//          _id: parcelleId
//        };
// const shape = parcelleData.coordonnees?.shapes?.[0];

//           const coordonnees = Array.isArray(shape?.coords?.[0])
//             ? shape.coords[0] // C’est un tableau imbriqué [[{lat, lng}]]
//             : shape?.coords || []; // Sinon tableau simple
//        const requestBody = {
//             ...parcelleData,
//             coordonnees,
//             farmerId: selectedFarmer?._id._id,
//             farmerName: selectedFarmer ? `${selectedFarmer._id.name} ${selectedFarmer._id.prenom}` : ''
//           };

//        const response = await fetch(`http://localhost:5000/api/parcelles/${parcelleId}`, {
//           method: 'PUT',
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${token}`
//           },
//           body: JSON.stringify(updatedData)
//         });


//          if (!response.ok) {
//             const errorText = await response.text(); // Lire le corps brut
//             console.error("Réponse du serveur avec erreur:", errorText);
//           }


//         if (response.ok) {
//           const responseData = await response.json();
//           const updatedParcelle = responseData.data || responseData;
//           updatedParcelles = parcelles.map(p => p.id === parcelleId ? updatedParcelle : p);
//           toast.success(`Parcelle "${nomAgriculteur}" modifiée avec succès!`);
//         }

//       } 
      
      
//       else {
//         // Mode ajout
//         // Extraire les coordonnées du premier polygone
//           const shape = parcelleData.coordonnees?.shapes?.[0];

//           const coordonnees = Array.isArray(shape?.coords?.[0])
//             ? shape.coords[0] // C’est un tableau imbriqué [[{lat, lng}]]
//             : shape?.coords || []; // Sinon tableau simple

//           const requestBody = {
//             ...parcelleData,
//             coordonnees,
//             farmerId: selectedFarmer?._id._id,
//             farmerName: selectedFarmer ? `${selectedFarmer._id.name} ${selectedFarmer._id.prenom}` : ''
//           };

//           console.log("✅ Données corrigées envoyées :", requestBody);


//           const response = await fetch('http://localhost:5000/api/parcelles/', {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               Authorization: `Bearer ${token}`
//             },
//             body: JSON.stringify(requestBody)
//           });

//         if (!response.ok) {
//             const errorText = await response.text(); // Lire le corps brut
//             console.error("Réponse du serveur avec erreur:", errorText);
//           }


//         if (response.ok) {
//           const newParcelle = await response.json();
//           updatedParcelles = [...parcelles, newParcelle];
//           toast.success(`Parcelle "${nomAgriculteur}" ajoutée avec succès!`);
//         }
//       }

//       setParcelles(updatedParcelles);
//       setShowModal(false);
//       setEditingParcelle(null);
//       setParcelleCompleteToEdit(null);
//     } catch (error) {
//       console.log("Erreur lors de l'envoi des données:", error);
//       toast.error("Une erreur est survenue");
//     } finally {
//       setIsLoading(false);
//     }
//   };

const handleParcelleSubmit = async (parcelleData: ParcelleComplete) => {
  try {
    setIsLoading(true);
    const token = localStorage.getItem('token');

    // Validate farmer selection using ParcelleComplete's farmerId
    if (!parcelleData.farmerId) {
      toast.error("Please select a valid farmer first");
      setIsLoading(false);
      return;
    }

    // Find the complete farmer data from farmers state
    const selectedFarmer = farmers.find(f => f._id._id === parcelleData.farmerId);
    
    // Prepare farmer data
    const farmerId = parcelleData.farmerId; // From ParcelleComplete
    const farmerName = selectedFarmer 
      ? `${selectedFarmer._id.name} ${selectedFarmer._id.prenom}`.trim()
      : parcelleData.farmerName || 'Agriculteur inconnu';

    // Extract coordinates
    const shape = parcelleData.coordonnees?.shapes?.[0];
    const coordonnees = Array.isArray(shape?.coords?.[0]) 
      ? shape.coords[0] 
      : shape?.coords || [];

    // Prepare base request body
    const requestBody: ParcelleComplete = {
      ...parcelleData,
      coordonnees,
      farmerId,
      farmerName
    };

    let response;
    let updatedParcelles = [...parcelles];

    if (editingParcelle || parcelleCompleteToEdit) {
      // EDIT MODE
      const getParcelleId = (parcelle: any) => {
        if (parcelle?.data) return parcelle.data.id || parcelle.data._id;
        return parcelle?.id || parcelle?._id;
      };

      const parcelleId = getParcelleId(parcelleCompleteToEdit) || getParcelleId(editingParcelle);

      if (!parcelleId) {
        toast.error("Parcel ID is not defined!");
        setIsLoading(false);
        return;
      }

      response = await fetch(`http://localhost:5000/api/parcelles/${parcelleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const responseData = await response.json();
        const updatedParcelle = responseData.data || responseData;
        updatedParcelles = parcelles.map(p => 
          p.id === parcelleId || p.id === parcelleId ? updatedParcelle : p
        );
        toast.success(`Parcelle updated successfully!`);
      }
    }  else {
        // Mode ajout
        // Extraire les coordonnées du premier polygone
          const shape = parcelleData.coordonnees?.shapes?.[0];

          const coordonnees = Array.isArray(shape?.coords?.[0])
            ? shape.coords[0] // C’est un tableau imbriqué [[{lat, lng}]]
            : shape?.coords || []; // Sinon tableau simple

          const requestBody = {
            ...parcelleData,
            coordonnees,
            farmerId: selectedFarmer?._id._id,
            farmerName: selectedFarmer ? `${selectedFarmer._id.name} ${selectedFarmer._id.prenom}` : ''
          };

          console.log("✅ Données corrigées envoyées :", requestBody);


          const response = await fetch('http://localhost:5000/api/parcelles/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
          });

        if (!response.ok) {
            const errorText = await response.text(); // Lire le corps brut
            console.error("Réponse du serveur avec erreur:", errorText);
          }


        if (response.ok) {
          const newParcelle = await response.json();
          updatedParcelles = [...parcelles, newParcelle];
          toast.success(`Parcel added sucessfully! `);
        }
      }

      setParcelles(updatedParcelles);
      setShowModal(false);
      setEditingParcelle(null);
      setParcelleCompleteToEdit(null);
    } catch (error) {
      console.log("Erreur lors de l'envoi des données:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
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

  // Correction de la surface avec valeur par défaut
  const filteredParcelles = parcelles.map(parcelle => ({
    ...parcelle,
    surface: parcelle.superficie || 0 // Valeur par défaut si undefined
  })).filter(parcelle => {
    if (!selectedFarmer) return true;
    const farmerFullName = `${selectedFarmer._id.name} ${selectedFarmer._id.prenom}`.toLowerCase();
    const parcelleName = (parcelle.nom ?? '').toLowerCase();
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

  // const handleEditParcelle = async (parcelle: Parcelle) => {
  //   try {
  //     setIsLoading(true);
  //     const completeData = await fetchParcelleComplete(parcelle.id);

  //     if (completeData) {
  //       setParcelleCompleteToEdit(completeData);

  //       // Trouver l'agriculteur correspondant
  //       if (completeData.farmerId) {
  //         const farmer = farmers.find(f => f._id._id === completeData.farmerId);
  //         if (farmer) setSelectedFarmer(farmer);
  //       }
  //     } else {
  //       setEditingParcelle(parcelle);
  //     }

  //     setShowModal(true);
  //   } catch (error) {
  //     console.error("Erreur lors de la préparation de l'édition:", error);
  //     toast.error("Erreur lors du chargement des données de la parcelle");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  useEffect(() => {
  const testing = async () => {
    const completeData = await fetchParcelleComplete('685830653d78adc1573f14ae'); // Replace 123 with actual parcel ID
    console.log("Using basic parcel data as fallback", completeData);
  };

  testing();
}, []);



  const handleEditParcelle = async (parcelle: Parcelle) => {
  try {
    setIsLoading(true);
    
    // 1. Fetch complete parcel data
    const completeData = await fetchParcelleComplete(parcelle.id);
    
    if (!completeData) {
      // Fallback to basic parcel data if complete fetch fails
      console.log("Using basic parcel data as fallback",completeData);
      setEditingParcelle(parcelle);
      setShowModal(true);
      return;
    }

    // 2. Update state with complete data
    setParcelleCompleteToEdit(completeData);

    // 3. Find and set corresponding farmer
    if (completeData.farmerId) {
      const farmer = farmers.find(f => {
        // Handle both string and object _id cases
        const farmerId = typeof f._id === 'string' ? f._id : f._id?._id;
        return farmerId === completeData.farmerId;
      });

      if (!farmer) {
        console.warn(`Farmer not found for ID: ${completeData.farmerId}`);
      }
      setSelectedFarmer(farmer || null);
    }

    // 4. Show the edit modal
    setShowModal(true);

  } catch (error) {
    console.error("Edit preparation error:", error);
    
    // Show different error messages based on error type
    const errorMessage = error instanceof Error 
      ? `Failed to load parcel: ${error.message}`
      : "Erreur lors du chargement des données de la parcelle";
    
    toast.error(errorMessage);

    // Fallback to basic editing mode
    setEditingParcelle(parcelle);
    setShowModal(true);
    
  } finally {
    setIsLoading(false);
  }
};


  const handleDeleteParcelle = async (parcelle: Parcelle) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete parcel ${parcelle.nom}?`);

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
          toast.success(`Parcel"${parcelle.nom}" deleyed successfully!`);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast.error("error deleting parcel");
      } finally {
        setIsLoading(false);
      }
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
                        {(parcelle.superficie || 0)}
                      </span>
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