import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  User, 
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Edit2,  
  Trash2,
  MoreHorizontal,
  Menu,
  Calendar,
  MessageSquare,
  Building,
  Clock,
  CheckCircle,
  Plus
} from 'lucide-react';
import UserProfile from "../profil/UserProfile"; // Importez le composant UserProfile
import './dashboardEmpl.css';
import axios from 'axios';

// Type definitions
interface EmployeeData {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  location: string;
  matriculate: string;
  company: string;
  status?: string;
  joinDate?: string;
  avatarUrl?: string;
}


interface Note {
  id: string;
  content: string;
  date: string;
  type?: string;
}

interface Task {
  id: string;
  title: string;
  due: string;
  status: 'pending' | 'completed';
}

const defaultNotes: Note[] = [
  {
  id: '1',
  content: 'Meeting scheduled to discuss the new mockups for the client project.',
  date: 'August 10, 2022', 
  type: 'meeting'
},
{
  id: '2',
  content: 'Completed training on new UX design techniques. Excellent participation and results.',
  date: 'August 5, 2022',
  type: 'training'
}

];

const defaultTasks: Task[] = [
  {
  id: 't1',
  title: 'Finalize the mockups for the AgroMap project',
  due: 'Tomorrow',
  status: 'pending'
},
{
  id: 't2',
  title: 'Meeting with the development team',
  due: 'Today',
  status: 'completed'
},
{
  id: 't3',
  title: 'Prepare the client presentation',
  due: 'May 23, 2025',
  status: 'pending'
}

];

const EmployeeDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentNote, setCurrentNote] = useState('');
  const [notes, setNotes] = useState<Note[]>(defaultNotes);
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [activeTab, setActiveTab] = useState('notes');
  const [unreadMessageCount, setUnreadMessageCount] = useState(3);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('');

// Default frontend data
  const defaultFrontendData = {
    position: 'Chef département',
    company: 'SICAM',
    status: 'Actif',
    joinDate: '15 Mars 2022',
    avatarUrl: '/images/employe.jpg'
  };

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get('http://localhost:5000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const apiData = response.data;
      
      // Combine backend data with frontend defaults
      const employeeData: EmployeeData = {
        id: apiData._id || 'emp001', // Use backend _id or fallback
        name: `${apiData.name} ${apiData.prenom}`,
        email: apiData.email,
        phone: apiData.telephone || '',
        location: apiData.adresse || '',
        matriculate: apiData.matriculate || '',
        ...defaultFrontendData // Spread the frontend defaults
      };

      setEmployee(employeeData);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch employee data');
      setLoading(false);
      console.error('Error fetching employee data:', err);
      
      // If API fails, use frontend defaults only
      setEmployee({
        id: 'emp001',
        name: 'Maouia Nouha',
        email: '',
        phone: '',
        location: '',
        matriculate: '',
        ...defaultFrontendData
      });
    }
  };

useEffect(() => {
    fetchEmployeeData();
  }, []);

  const handleMenuItemClick = (item: string) => {
    setActiveItem(item);
    if (item === 'DashboardE') {
      navigate('/dashboard-employee');
    }
  };

  const handleAddFarmerClick = () => {
    navigate('/listAgriculteur');
  };
// ttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fonction modifiée pour afficher correctement les notifications
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showProfileMenu) setShowProfileMenu(false);
  };

  // Modifié pour ouvrir le composant UserProfile
  const toggleProfileMenu = () => {
    setShowUserProfile(true);
    if (showNotifications) setShowNotifications(false);
  };

  // Fonction pour fermer le modal de profil utilisateur
  const closeUserProfile = () => {
    setShowUserProfile(false);
  };

  const handleMessagesClick = () => {
    console.log('Messages clicked');
    setUnreadMessageCount(0);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const notificationButton = document.querySelector('.notification-container');
      const notificationMenu = document.querySelector('.notification-dropdown-menu');

      if (notificationButton && notificationMenu &&
        !notificationButton.contains(target) &&
        !notificationMenu.contains(target)) {
        setShowNotifications(false);
      }

      if (!target.closest('.profile-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addNote = () => {
    if (currentNote.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        content: currentNote,
        date: new Date().toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        type: 'note'
      };
      setNotes([newNote, ...notes]);
      setCurrentNote('');
    }
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ));
  };

  const addTask = (title: string) => {
    if (title.trim()) {
      const newTask: Task = {
        id: `t${Date.now()}`,
        title: title,
        due: 'À définir',
        status: 'pending'
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
    }
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const renderNoteIcon = (type?: string) => {
    switch (type) {
      case 'meeting':
        return <Calendar size={18} />;
      case 'training':
        return <Briefcase size={18} />;
      default:
        return <MessageSquare size={18} />;
    }
  };

  // Fonction pour marquer toutes les notifications comme lues
  const markAllNotificationsAsRead = () => {
    setUnreadMessageCount(0);
  };

  return (
     <div className="dashboard-container">
      {/* UserProfile Modal */}
      {showUserProfile && (
        <UserProfile
          onClose={closeUserProfile}
          userName={employee.name}
          userEmail={employee.email}
          avatarUrl={employee.avatarUrl || "/images/employe.jpg"}
        />
      )}

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

        <nav className="sidebar-menu">
      <ul>
        <li 
          className={`menu-item ajouter-agriculteur ${activeItem === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleMenuItemClick('DashboardE')}
        >
          <span className="menu-icon">📊</span>
          <span className="menu-text">Dashboard</span>
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
        <li 
          className={`menu-item ajouter-agriculteur ${activeItem === 'help' ? 'active' : ''}`}
          onClick={() => handleMenuItemClick('help')}
        >
          <span className="menu-icon">❓</span>
          <span className="menu-text">Help</span>
        </li>
        <li 
          className={`menu-item ajouter-agriculteur ${activeItem === 'addFarmer' ? 'active' : ''}`}
          onClick={handleAddFarmerClick}
        >
          <span className="menu-icon">👤</span>
          <span className="menu-text">Add Farmer</span>
        </li>
        <li 
          className={`menu-item ajouter-agriculteur ${activeItem === 'addParcel' ? 'active' : ''}`}
          onClick={() => handleMenuItemClick('addParcel')}
        >
          <span className="menu-icon">🏞️</span>
          <span className="menu-text">Add Parcel</span>
        </li>
      </ul>
    </nav>

        </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`main-content ${isSidebarOpen ? 'with-expanded-sidebar' : 'with-collapsed-sidebar'}`}>
        {/* Header */}
        <header className="header-unifiedE">
          <div className="header-container">
              <div className="search-container">
                <input type="text"
                 placeholder="Search..." 
                className="search-input"
                 value={searchTerm} 
                 onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Rechercher" />
                <button className="search-btn">🔍</button>
            </div>

            <div className="header-right">
              {/* SECTION MODIFIÉE - Conteneur de Notifications avec position relative */}
              <div className="notification-container relative">
                <button
                  className="icon-button"
                  onClick={toggleNotifications}
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadMessageCount > 0 && <span className="badge absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full">3</span>}
                </button>

                {/* Menu déroulant de notifications - Modifié avec une classe explicite */}
                {showNotifications && (
                  <div className="notification-dropdown-menu">
                    <div className="notification-header">
                      <h3>Notifications</h3>
                      <button
                        className="mark-read-button"
                        onClick={markAllNotificationsAsRead}
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="notification-list">
                      <div className="notification-item unread">
                        <p className="notification-text"> New task assigned</p>
                        <p className="notification-time">2 houres ago</p>
                      </div>
                      <div className="notification-item unread">
                        <p className="notification-text">Reminder: Meeting at 2:00 PM</p>
                        <p className="notification-time">4 houres ago</p>
                      </div>
                      <div className="notification-item">
                        <p className="notification-text">Document shared by Thomas</p>
                        <p className="notification-time">1 day ago</p>
                      </div>
                    </div>
                    <div className="notification-footer">
                      <a href="#" className="view-all-link">View all notifications</a>
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-container">
                <button
                  className="profile-button"
                  onClick={toggleProfileMenu}
                  aria-label="Menu de profil"
                >
                  {employee.avatarUrl ? (
                    <img
                      src={employee.avatarUrl}
                      alt={employee.name}
                      className="profile-avatarE-small"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    getInitials(employee.name)
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Employee Profile Content */}
        <section className="content-wrapper">
          {/* Profile Header Card */}
          <div className="profile-card">
            <div className="profile-header">
              <h1 className="profile-name-large">Welcome {employee.name}</h1>
            </div>
          </div>

          {/* Profile Info Cards */}
          <div className="info-cards-grid">
            {/* Contact Info Card */}
            <div className="info-card">
              <h2 className="card-title">
                <User size={20} className="card-title-icon" />
                Employer informations
              </h2>
              <div className="contact-info">
                <div className="contact-item">
                  <Mail size={18} className="contact-icon" />
                  <div className="contact-details">
                    <p className="contact-label">Email</p>
                    <p className="contact-value">{employee.email}</p>
                  </div>
                </div>
                <div className="contact-item">
                  <Phone size={18} className="contact-icon" />
                  <div className="contact-details">
                    <p className="contact-label">Phone number</p>
                    <p className="contact-value">{employee.phone}</p>
                  </div>
                </div>
                <div className="contact-item">
                  <MapPin size={18} className="contact-icon" />
                  <div className="contact-details">
                    <p className="contact-label">Adresse</p>
                    <p className="contact-value">{employee.location}</p>
                  </div>
                </div>
                <div className="contact-item">
                  <Briefcase size={18} className="contact-icon" />
                  <div className="contact-details">
                    <p className="contact-label">Matriculate</p>
                    <p className="contact-value">{employee.matriculate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Info Card */}
            <div className="info-card">
              <h2 className="card-title">
                <Building size={20} className="card-title-icon" />
                About company
              </h2>
              <h3 className="company-name">{employee.company}</h3>
              <p className="company-description">SICAM (Société Industrielle des Conserves Alimentaires de Medjez El Beb), a flagship of Tunisian industry since 1969, proudly celebrates its 50th anniversary this year. Looking ahead, SICAM is committed to further advancing the agricultural sector, fostering innovation, and promoting sustainable practices to enhance both local and global food security</p>
            </div>
          </div>

          {/* Tabs for Notes and Tasks */}
          <div className="tabs-container">
            <div className="tabs-header">
              <button
                className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                <MessageSquare size={18} />
                Notes and activities
              </button>
              <button
                className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => setActiveTab('tasks')}
              >
                <Clock size={18} />
                Assigned tasks
              </button>
            </div>

            {activeTab === 'notes' && (
              <div className="notes-container">
                {/* Note Input */}
                <div className="note-input-container">
                  <textarea
                    placeholder="Type here to add a note..."
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    className="note-textarea"
                    rows={3}
                    aria-label="Texte de la note"
                  ></textarea>
                  <div className="note-input-actions">
                    <button
                      onClick={addNote}
                      className="add-note-button"
                      disabled={!currentNote.trim()}
                    >
                      <Plus size={18} className="add-note-icon" />
                      Add note
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                <div className="notes-list-container">
                  <div className="notes-list-header">
                    <h3 className="notes-history-title">history of notes</h3>
                    <div className="notes-filter-pill">
                      This month
                    </div>
                  </div>

                  <div className="notes-list">
                    {notes.length > 0 ? (
                      notes.map(note => (
                        <div key={note.id} className="note-item">
                          <div className="note-header">
                            <div className="note-type">
                              <div className="note-type-icon">
                                {renderNoteIcon(note.type)}
                              </div>
                              <span className="note-type-label">
                                {note.type === 'meeting' ? 'meeting' :
                                  note.type === 'training' ? 'training' : 'Note ajoutée'}
                              </span>
                            </div>
                            <span className="note-date">{note.date}</span>
                          </div>
                          <p className="note-content">{note.content}</p>
                          <div className="note-actions">
                            <button
                              className="note-action-button"
                              aria-label="Modifier la note"
                            >
                              <Edit2 size={16} className="note-action-icon" />
                            </button>
                            <button
                              className="note-action-button"
                              onClick={() => deleteNote(note.id)}
                              aria-label="Supprimer la note"
                            >
                              <Trash2 size={16} className="note-action-icon" />
                            </button>
                            <button
                              className="note-action-button"
                              aria-label="Plus d'options"
                            >
                              <MoreHorizontal size={16} className="note-action-icon" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-notes">
                        No notes yet. Add your first note!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="tasks-container">
                <h3 className="tasks-title">Tasks to be completed</h3>
                <div className="tasks-list">
                  {tasks.length > 0 ? (
                    tasks.map(task => (
                      <div
                        key={task.id}
                        className={`task-item ${task.status === 'completed' ? 'completed' : ''}`}
                      >
                        <div className="task-checkbox">
                          <button
                            className="checkbox-button"
                            onClick={() => toggleTaskStatus(task.id)}
                            aria-label={`Marquer la tâche comme ${task.status === 'completed' ? 'non complétée' : 'complétée'}`}
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle size={18} className="checkbox-icon checked" />
                            ) : (
                              <div className="checkbox-icon unchecked" />
                            )}
                          </button>
                        </div>
                        <div className="task-content">
                          <div className="task-title">
                            {task.title}
                          </div>
                          <div className="task-due">
                            <Clock size={14} className="task-due-icon" />
                            <span className="task-due-text">Deadline: {task.due}</span>
                          </div>
                        </div>
                        <div className="task-actions">
                          <button
                            className="task-action-button"
                            onClick={() => deleteTask(task.id)}
                            aria-label="Supprimer la tâche"
                          >
                            <Trash2 size={16} className="task-action-icon" />
                          </button>
                          <button
                            className="task-action-button"
                            aria-label="Modifier la tâche"
                          >
                            <Edit2 size={16} className="task-action-icon" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-tasks">
                      No task assigned .
                    </div>
                  )}
                </div>

                {/* Add Task Section */}
                <div className="add-task-section">
                  <h4 className="add-task-title">Add new Task</h4>
                  <div className="add-task-form">
                    <input
                      type="text"
                      placeholder="Task title..."
                      className="add-task-input"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      aria-label="New task title "
                    />
                    <button
                      className="add-task-button"
                      onClick={() => addTask(newTaskTitle)}
                      disabled={!newTaskTitle.trim()}
                    >
                      <Plus size={18} />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="dashboard-footer">
            <div className="footer-content">
              <p className="footer-copyright">
                © 2025 AgroMapp. All rights are reserved .
              </p>
              <div className="footer-links">
                <a href="#" className="footer-link">Our Privacy Policy</a>
                <a href="#" className="footer-link">Terms of Use</a>
                <a href="#" className="footer-link">Support</a>
              </div>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default EmployeeDashboard;