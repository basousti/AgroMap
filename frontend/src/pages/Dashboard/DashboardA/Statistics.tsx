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
    if (item === 'DashboardE') {
      navigate('/dashboard-employee');
    }
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
          <PowerBIEmbed
            embedConfig = {{
              type: 'PowerBIReport',   // Supported types: report, dashboard, tile, visual, qna, paginated report and create
              id: '01b9599f-06b9-43f6-9f82-853f8a5db488',
              embedUrl: 'https://app.powerbi.com/reportEmbed?reportId=01b9599f-06b9-43f6-9f82-853f8a5db488&groupId=8f03a492-5977-474b-8f07-7d27ba41665f&w=2&config=eyJjbHVzdGVyVXJsIjoiaHR0cHM6Ly9XQUJJLVNPVVRILUFGUklDQS1OT1JUSC1BLVBSSU1BUlktcmVkaXJlY3QuYW5hbHlzaXMud2luZG93cy5uZXQiLCJlbWJlZEZlYXR1cmVzIjp7InVzYWdlTWV0cmljc1ZOZXh0Ijp0cnVlfX0%3d',
              accessToken: '<Access Token>',
              tokenType: models.TokenType.Embed, // Use models.TokenType.Aad for SaaS embed
              settings: {
                panes: {
                  filters: {
                    expanded: false,
                    visible: false
                  }
                },
                background: models.BackgroundType.Transparent,
              }
            }}

            eventHandlers = {
              new Map([
                ['loaded', function () {console.log('Report loaded');}],
                ['rendered', function () {console.log('Report rendered');}],
                ['error', function (event:any) {console.log(event.detail);}],
                ['visualClicked', () => console.log('visual clicked')],
                ['pageChanged', (event) => console.log(event)],
              ])
            }

            cssClassName = { "reportClass" }

            getEmbeddedComponent = { (embeddedReport) => {
              window.report = embeddedReport as Report;
            }}
          />
        </section>
      </div>
    </div>
  );
}

export default Statistics;

