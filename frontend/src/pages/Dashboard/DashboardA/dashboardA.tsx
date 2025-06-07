import './styleAdmin.css';
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight} from 'lucide-react';

interface Employer {
  _id: string;
  matriculate:String;
  name: string;
  prenom: string; 
  
}

const DashboardA:React.FC = () =>{

  const [emplyees, setEmplyees] = useState<Employer[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredEmplyees, setFilteredEmplyees] = useState<Employer[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeItem, setActiveItem] = useState('');
  const [unreadMessageCount, setUnreadMessageCount] = useState(3);

  const navigate = useNavigate();

  const Dashboard = () => {
    navigate("/Statistics");
  };

  const EmplyeeList = () => {
    navigate("/DashboardA");
  };

  //the role of token discribed in the end of the code 
  const token = localStorage.getItem("token");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);
  const handleLogout = () => {
    window.location.href = '/login1';
  };

    const handleMenuItemClick = (item: string) => {
    setActiveItem(item);
    if (item === 'DashboardE') {
      navigate('/dashboard-employee');
    }
  };

  const fetchEmployee = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/users", {
        headers: {
          Authorization: `Bearer ${token}` 
        }
      });

      const result = await response.json();
      console.log("Fetched employees:", result);
      setEmplyees(result);

    } catch (error) {
      console.log("Error on exporting users", error);
    }
  };

  const handleAccept = async (userId: String) => {
    try {
      const response = await fetch(`http://localhost:5000/Request/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          matriculate: userId,  
          action: "accept"
        })
      });
  
      const data = await response.json();
      console.log("User accepted:", data);
      fetchEmployee();
    
    } catch (error) {
      console.error("Error accepting user:", error);
    }
  };

  const handleReject = async (userId: String) => {
    try {
      const response = await fetch(`http://localhost:5000/Request/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          matriculate: userId,  
          action: "reject"
        })
      });
  
      const data = await response.json();
      console.log("User rejected:", data);
      fetchEmployee();
    
    } catch (error) {
      console.error("Error rejecting user:", error);
    }
  };


  useEffect(() => {
  
    if (token) {
      fetchEmployee();
    } else {
      navigate("/login1");
    }
  }, [token, navigate]);
  
  
  // Filter employees based on search term
  useEffect(() => {
    const filtered = emplyees.filter((emp) => {
      const fullName = `${emp.name} ${emp.prenom} ${emp.matriculate}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
    setFilteredEmplyees(filtered);
  }, [emplyees, searchTerm]);

  

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      <div className="toggle-container">
      <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </div>

        {isSidebarOpen && (
        <div >
          <img
          alt=""
          src="/AgroMap.png"
          width="190"
          height="150"
          className="d-inline-block align-top mb-5"
        />
        <nav className="sidebar-nav">
          <ul className="nav-list" >
            <li className="nav-item" onClick={Dashboard}>
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </li>

            <li 
          className={`menu-item ajouter-agriculteur ${activeItem === 'messages' ? 'active' : ''}`}
          onClick={() => {
            handleMenuItemClick('messages');
            navigate('/messages');
          }}
        >
          <span className="menu-icon">✉️</span>
          <span className="menu-text">Messages</span>
          {unreadMessageCount > 0 && (
                <span className="badge">{unreadMessageCount}</span>
              )}
        </li>

            <li className="nav-item" onClick={EmplyeeList}>
              <span className="nav-icon">👤</span>
              <span className="nav-text">Employee List</span>
            </li>
          </ul>
        </nav>
        </div>
        )}
      </div>

      <div className="main-contentA"> 
        <header className="header-bar">
          <div className="search-containerA">
            <input
              type="text"
              placeholder="Recherche d'un employer..."
              className="search-barA"
              value={searchTerm}
              onChange={handleSearch}
            />
            <button className="search-iconA"><span>🔍</span></button>
          </div>
          <div className="header-buttons">
          
          <button className='button-notif'><span style={{cursor: 'pointer', margin: '8px' }}>🔔</span></button>
            <button className="disconnect-btn" onClick={handleLogout}>🔒 Déconnexion</button>
          </div>
        </header>

        <section className="employee-list">
          <h2>Liste des Employer</h2>
          <table>
            <thead>
              <tr>
                <th className="text-center">Matricule</th>
                <th className="text-center">Nom</th>
                <th className="text-center">Prénom</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmplyees.length > 0 ? (
                filteredEmplyees.map((emplyee) => (
                  <tr key={emplyee._id}>
                    <td className="text-center">{emplyee.matriculate}</td>
                    <td className="text-center">{emplyee.name}</td>
                    <td className="text-center">{emplyee.prenom}</td>
                    <td className="actions-buttons">
                      <button className="edit-btn" onClick={() => handleAccept(emplyee.matriculate)}>✏️</button>
                      <button className="delete-btn" onClick={() => handleReject(emplyee.matriculate)} >🗑️</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="no-results">Aucun résultat trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

export default DashboardA;



// the token is used for security. Specifically, it's part of an authentication and authorization 
// mechanism that helps protect access to sensitive data or operations on your backend.

// 1-token is fetched from localStorage.
// 2-If token exists, the fetchEmployee() function runs.
// 3-The token is sent to the backend via the Authorization header.
// 4-If there's no token, the user is redirected to the login page (/login1), preventing unauthorized access.


//(fetch)C'est une API JavaScript qui permet d'envoyer des requêtes HTTP (GET, POST, PUT, DELETE, etc.) au backend
//Par défaut, fetch(url) effectue une requête GET.

//UseEffect runs automatically when the component first loads or when something it depends on changes.
