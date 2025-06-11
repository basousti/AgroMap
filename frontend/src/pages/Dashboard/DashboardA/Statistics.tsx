import './styleAdmin.css';
import React ,{ useState } from "react";
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight} from 'lucide-react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models, Report } from 'powerbi-client';

declare global {
  interface Window {
    report: Report;
  }
}
 
const Statistics:React.FC = () =>{

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeItem, setActiveItem] = useState('');
   const [unreadMessageCount, setUnreadMessageCount] = useState(1);

  const navigate = useNavigate();
  const Dashboard = () => {
    navigate("/Statistics");
  };
  const EmplyeeList = () => {
    navigate("/DashboardA");
  };

  //the role of token discribed in the end of the code 
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    window.location.href = '/login1';
  };

  const handleMenuItemClick = (item: string) => {
    setActiveItem(item);
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
          <div className="header-buttons">
          
          <button className='button-notif'><span style={{cursor: 'pointer', margin: '8px' }}>🔔</span></button>
            <button className="disconnect-btn" onClick={handleLogout}>🔒 Déconnexion</button>
          </div>
        </header>

        <section className="employee-list">
          <h2>Dashboard Power BI</h2>
          <iframe title="AgroMap" 
          width="1200" 
          height="600" 
          src="https://app.powerbi.com/view?r=eyJrIjoiODViYTBjZmItMmE2Ny00Mzg4LWI1NmEtODI4MWJkNmYxYmE4IiwidCI6ImE2MmVlN2M0LWVkMmQtNDk5MS1iNGI4LTMxMjBlODMzM2UxMSJ9" 
           style={{ border: 'none' }} 
          allowFullScreen={true}></iframe>
        </section>
      </div>
    </div>
  );
}

export default Statistics;

