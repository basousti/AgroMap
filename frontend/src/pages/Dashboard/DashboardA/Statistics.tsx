import './styleAdmin.css';
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight} from 'lucide-react';


const Statistics:React.FC = () =>{

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const navigate = useNavigate();
  const EmplyeeList = () => {
    navigate("/DashboardA");
  };

  //the role of token discribed in the end of the code 
  const token = localStorage.getItem("token");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);
  const handleLogout = () => {
    window.location.href = '/login1';
  };

  

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
          <ul className="nav-list">
            <li className="nav-item">
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
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

      <div className="main-content">
        <header className="header-bar">
          <div className="search-container">
            <input
              type="text"
              placeholder="Recherche d'un employer..."
              className="search-bar"
              value={searchTerm}
              onChange={handleSearch}
            />
            <button className="search-icon"><span>🔍</span></button>
          </div>
          <div className="header-buttons">
          
          <button className='button-notif'><span style={{cursor: 'pointer', margin: '8px' }}>🔔</span></button>
            <button className="disconnect-btn" onClick={handleLogout}>🔒 Déconnexion</button>
          </div>
        </header>

        <section className="employee-list">
          <h2>Dashboard Power BI</h2>
        </section>
      </div>
    </div>
  );
}

export default Statistics;

