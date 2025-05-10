import './styleEmpl.css';
import { useEffect, useState } from "react";
import UserProfile from './profil/UserProfile';
import { useNavigate } from 'react-router-dom';
import DeleteAlertDialog from './DeleteAlertDialog';

interface Farmer {
  _id: string;
  nom: string;
  prenom: string;
  localite: string;
  telephone: string;
  adresse: string;
}

function listAgriculteur() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredFarmers, setFilteredFarmers] = useState<Farmer[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false);
  const [farmerToDelete, setFarmerToDelete] = useState<Farmer | null>(null);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);

  const navigate = useNavigate();

  const handleAddFarmerClick = () => {
    console.log("Bouton Ajouter Agriculteur cliqué, mais aucune action n'est exécutée");
  };

  const handlePlusButtonClick = () => navigate('/FormulaireAgriculteur');
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);
  const handleMessagesClick = () => navigate('/messages');
  const handleProfileClick = () => navigate('/DashboardE');
  const handleLogout = () => window.location.href = '/login';

  useEffect(() => {
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No token found. User is probably not logged in.");
      setError("Vous devez être connecté pour voir les agriculteurs.");
      return;
    }
  
    fetch('http://localhost:5000/api/farmers', { // Fetch more for now, or implement pagination later
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Erreur (${res.status}): ${errorText || "aucune info d'erreur"}`);
        }
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data.farmers)) {
          setFarmers(data.farmers);
          setFilteredFarmers(data.farmers);
        } else if (data && Array.isArray(data.data)) {
          // fallback if server returns 'data' instead of 'farmers'
          setFarmers(data.data);
          setFilteredFarmers(data.data);
        } else {
          console.error("Format de données inattendu:", data);
          setError("Format de données inattendu depuis le serveur.");
        }
      })
      .catch(err => {
        console.error("Erreur lors de la récupération:", err);
        setError("Impossible de récupérer les agriculteurs. Réessayez.");
      });
  
    setUnreadMessageCount(3); // Optionally fetch unread messages later
  }, []);
  

  useEffect(() => {
    const searchValue = searchTerm.toLowerCase().trim();
    setFilteredFarmers(
      farmers.filter(farmer =>
        farmer.nom.toLowerCase().includes(searchValue) ||
        farmer.prenom.toLowerCase().includes(searchValue) ||
        farmer.localite.toLowerCase().includes(searchValue) ||
        farmer.telephone.toLowerCase().includes(searchValue) ||
        farmer.adresse.toLowerCase().includes(searchValue)
      )
    );
  }, [searchTerm, farmers]);

  const handleEditClick = (farmer: Farmer) => navigate('/EditAgriculteur', { state: { farmer } });

  const handleDeleteClick = (farmer: Farmer) => {
    setFarmerToDelete(farmer);
    setShowDeleteAlert(true);
  };

  const handleConfirmDelete = async (deletedId: string) => {
    try {
      const updated = farmers.filter(f => f._id !== deletedId);
      setFarmers(updated);
      setFilteredFarmers(updated);
      setFarmerToDelete(null);
      setShowDeleteAlert(false);
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteAlert(false);
    setFarmerToDelete(null);
  };

  return (
    <div className="dashboard-unified">
      <div className={`sidebar-unified ${isSidebarOpen ? "open" : "closed"}`}>
        <button className="toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? "⬅" : "➡"}
        </button>
        {isSidebarOpen && (
          <div>
            <img alt="" src="/AgroMap.png" width="190" height="150" className="d-inline-block align-top" />
          </div>
        )}

        <nav className="sidebar-menu">
          <ul>
            <li className="menu-item"><span className="menu-icon">📊</span><span className="menu-text">Dashboard</span></li>
            <li className="menu-item" onClick={handleMessagesClick}>
              <span className="menu-icon">✉️</span>
              <span className="menu-text">Messages</span>
              {unreadMessageCount > 0 && <span className="badge">{unreadMessageCount}</span>}
            </li>
            <li className="menu-item"><span className="menu-icon">❓</span><span className="menu-text">Help</span></li>
            <li className="menu-item active" onClick={handleAddFarmerClick}>
              <span className="menu-icon">👤</span><span className="menu-text">Ajouter Agriculteur</span>
            </li>
            <li className="menu-item"><span className="menu-icon">🏞️</span><span className="menu-text">Ajouter Parcelle</span></li>
          </ul>
        </nav>
      </div>

      <div className="main-content-unified">
        <header className="header-unified">
          <div className="search-container-unified">
            <input type="text" placeholder="Recherche avancée..." className="search-input" value={searchTerm} onChange={handleSearch} />
            <button className="search-btn">🔍</button>
          </div>
          <div className="header-actions">
            <button className="profile-toggle-btn" onClick={handleProfileClick}><span>👤</span> Profil</button>
            <button className="logout-btn-new" onClick={handleLogout}><span>🔒</span> Déconnexion</button>
          </div>
        </header>

        <section className="content-area">
          <div className="content-header">
            <h1>Liste des agriculteurs</h1>
            <button className="add-button" onClick={handlePlusButtonClick}>+</button>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Localité</th>
                  <th>Téléphone</th>
                  <th>Adresse</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFarmers.length === 0 ? (
                  <tr><td colSpan={6} className="no-data">Aucun résultat trouvé</td></tr>
                ) : (
                  filteredFarmers.map(farmer => (
                    <tr key={farmer._id}>
                      <td>{farmer.nom}</td>
                      <td>{farmer.prenom}</td>
                      <td>{farmer.localite}</td>
                      <td>{farmer.telephone}</td>
                      <td>{farmer.adresse}</td>
                      <td className="actions">
                        <button className="action-btn edit" onClick={() => handleEditClick(farmer)}>✏️</button>
                        <button className="action-btn delete" onClick={() => handleDeleteClick(farmer)}>🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}

      <DeleteAlertDialog
        isOpen={showDeleteAlert}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        farmer={farmerToDelete || undefined}
      />
    </div>
  );
}

export default listAgriculteur;
