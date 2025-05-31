import './styleEmpl.css';
import { useEffect, useState } from "react";
import UserProfile from './profil/UserProfile';
import { useNavigate } from 'react-router-dom';
import DeleteAlertDialog from './DeleteAlertDialog';
import { ChevronLeft, ChevronRight} from 'lucide-react';

interface Farmer {
  _id: {
    _id: string;  // or whatever type this is
    name: string;
    prenom: string;
  };
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

   const Dashboard = () => {
    navigate('/DashboardE');
  };
  const handleAddFarmerClick = () => {
    console.log("Bouton Ajouter Agriculteur cliqué, mais aucune action n'est exécutée");
  };

  const handlePlusButtonClick = () => navigate('/FormulaireAgriculteur');
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);
  const handleMessagesClick = () => navigate('/messages');

  useEffect(() => {
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No token found. User is probably not logged in.");
      setError("You must be logged in to view the farmers.");
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
          setError("Unexpected data format from the server.");
        }
      })
      .catch(err => {
        console.error("Erreur lors de la récupération:", err);
        setError("Unable to fetch the farmers. Please try again.");
      });
  
    setUnreadMessageCount(3); // Optionally fetch unread messages later
  }, []);
  

  useEffect(() => {
    const searchValue = searchTerm.toLowerCase().trim();
    setFilteredFarmers(
      farmers.filter(farmer =>
        farmer._id.name?.toLowerCase().includes(searchValue) ||
        farmer._id.prenom?.toLowerCase().includes(searchValue) ||
        farmer.localite?.toLowerCase().includes(searchValue) ||
        farmer.telephone?.toLowerCase().includes(searchValue) ||
        farmer.adresse?.toLowerCase().includes(searchValue)
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
      const updated = farmers.filter(f => f._id._id !== deletedId);
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
            {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        {/*Toggle button -positioned as a floating button on right edge */}
        <div className="toggle-container">
          <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {isSidebarOpen && (
          <div>
        {/*Logo Header -Using image exactly as in AgroMap */}
        <div className='logo-header'>
          <img src="/AgroMap.png"
           width="190" 
           height="150" 
           className='logo-image ' 
           alt="AgroMap Logo" />
        </div>

        {/* Navigation Menu - Matching exact style and order from AgroMap */}
        <nav className="sidebar-menu">
          <ul>
            <li className="menu-item"  onClick={Dashboard}>
              <span className="menu-icon">📊</span>
              <span className="menu-text">Dashboard</span>
            </li>
            <li className="menu-item" onClick={() => { handleMessagesClick(); navigate('/messages'); }}>
              {/*this item has no visible text in collapsed moder, only badge */}
              <span className="menu-icon" >✉️</span>
              <span className="menu-text">Messages</span>
              {unreadMessageCount > 0 && (
                <span className="badge">{unreadMessageCount}</span>
              )}
            </li>

            <li className="menu-item">
              <span className="menu-icon">❓</span>
              <span className="menu-text">Help</span>
            </li>

            <li className="menu-item ajouter-agriculteur active" onClick={handleAddFarmerClick}>
              <span className="menu-icon">👤</span>
              <span className="menu-text">Add Farmer</span>
            </li>

            <li className="menu-item">
              <span className="menu-icon">🏞️</span>
              <span className="menu-text">Add Parcel</span>
            </li>
          </ul>
        </nav>

        </div>
        )}
      </div>

      <div className="main-content-unified">
        <header className="header-unified">
          <div className="search-container-unified">
            <input type="text" placeholder="Search..." className="search-input" value={searchTerm} onChange={handleSearch} />
            <button className="search-btn">🔍</button>
          </div>
        </header>

        <section className="content-area">
          <div className="content-header">
            <h1>Farmers List</h1>
            <button className="add-button" onClick={handlePlusButtonClick}>+</button>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Family Name</th>
                  <th>Name</th>
                  <th>Locality</th>
                  <th>Phone number</th>
                  <th>Adress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredFarmers.length === 0 ? (
                  <tr><td colSpan={6} className="no-data">No results found</td></tr>
                ) : (
                  filteredFarmers.map((farmer) => (
                    <tr key={farmer._id._id.toString()}>
                        <td>{farmer._id.name}</td>
                        <td>{farmer._id.prenom}</td>
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
