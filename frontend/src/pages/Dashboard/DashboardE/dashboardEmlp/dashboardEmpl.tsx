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

// Type definitions
interface EmployeeData {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  location: string;
  department: string;
  company: string;
  companyDescription: string;
  status?: string;
  joinDate?: string;
  avatarUrl?: string; // Ajouté pour la synchronisation des avatars
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

// Clés pour la synchronisation
const DASHBOARD_EMPLOYEE_KEY = 'dashboard_employee_data';
const USER_INFO_STORAGE_KEY = 'user_profile_info';
const AVATAR_STORAGE_KEY = 'user_avatar';

// Demo data - Sera remplacé par les données synchronisées
const getDefaultEmployee = (): EmployeeData => ({
  id: 'emp001',
  name: 'Maouia Nouha',
  position: 'Chef département',
  email: 'moauianouha2@gmail.com',
  phone: '+216 29 220 752',
  location: 'Tunis Menzeh 8',
  department: 'Agriculteur',
  company: 'SICAM',
  companyDescription: 'SICAM Société Industrielle des Conserves Alimentaires de Medjez El Beb, fleuron de l\'Industrie tunisienne depuis 1969 célèbre cette année ses 50 ans',
  status: 'Actif',
  joinDate: '15 Mars 2022',
  avatarUrl: ''
});

const defaultNotes: Note[] = [
  {
    id: '1',
    content: 'Réunion prévue pour discuter des nouvelles maquettes du projet client.',
    date: '10 août 2022',
    type: 'meeting'
  },
  {
    id: '2',
    content: 'A terminé la formation sur les nouvelles techniques de design UX. Excellente participation et résultats.',
    date: '05 août 2022',
    type: 'training'
  }
];

const defaultTasks: Task[] = [
  {
    id: 't1',
    title: 'Finaliser les maquettes pour le projet AgriApp',
    due: 'Demain',
    status: 'pending'
  },
  {
    id: 't2',
    title: 'Réunion avec l\'équipe de développement',
    due: 'Aujourd\'hui',
    status: 'completed'
  },
  {
    id: 't3',
    title: 'Préparer la présentation client',
    due: '23 Mai 2025',
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

  // État pour les données employé - initialisé avec synchronisation
  const [employee, setEmployee] = useState<EmployeeData>(() => {
    const savedEmployeeData = localStorage.getItem(DASHBOARD_EMPLOYEE_KEY);
    const savedUserInfo = localStorage.getItem(USER_INFO_STORAGE_KEY);
    const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);

    if (savedEmployeeData) {
      const employeeData = JSON.parse(savedEmployeeData);
      // Ajouter l'avatar s'il existe
      if (savedAvatar) {
        employeeData.avatarUrl = savedAvatar;
      }
      return employeeData;
    } else if (savedUserInfo) {
      // Créer les données employé à partir des informations utilisateur
      const userInfo = JSON.parse(savedUserInfo);
      return {
        id: 'emp001',
        name: `${userInfo.firstName} ${userInfo.lastName}`,
        position: userInfo.position || userInfo.role,
        email: userInfo.email,
        phone: userInfo.phone,
        location: userInfo.address,
        department: userInfo.department || userInfo.role,
        company: userInfo.company || "SICAM",
        companyDescription: userInfo.companyDescription || "SICAM Société Industrielle des Conserves Alimentaires de Medjez El Beb, fleuron de l'Industrie tunisienne depuis 1969 célèbre cette année ses 50 ans",
        status: userInfo.status || "Actif",
        joinDate: userInfo.joinDate || userInfo.dateCreation,
        avatarUrl: savedAvatar || userInfo.avatarUrl || ''
      };
    }

    return getDefaultEmployee();
  });

  // État pour contrôler l'affichage du composant UserProfile
  const [showUserProfile, setShowUserProfile] = useState(false);

  const navigate = useNavigate();

  // Fonction pour synchroniser les données depuis InformationsUtilisateur
  const syncFromUserInfo = () => {
    const savedUserInfo = localStorage.getItem(USER_INFO_STORAGE_KEY);
    const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);

    if (savedUserInfo) {
      const userInfo = JSON.parse(savedUserInfo);
      const updatedEmployee: EmployeeData = {
        id: employee.id,
        name: `${userInfo.firstName} ${userInfo.lastName}`,
        position: userInfo.position || userInfo.role,
        email: userInfo.email,
        phone: userInfo.phone,
        location: userInfo.address,
        department: userInfo.department || userInfo.role,
        company: userInfo.company || employee.company,
        companyDescription: userInfo.companyDescription || employee.companyDescription,
        status: userInfo.status || employee.status,
        joinDate: userInfo.joinDate || userInfo.dateCreation,
        avatarUrl: savedAvatar || userInfo.avatarUrl || ''
      };

      setEmployee(updatedEmployee);
      localStorage.setItem(DASHBOARD_EMPLOYEE_KEY, JSON.stringify(updatedEmployee));
    }
  };

  // Effect pour écouter les changements d'informations utilisateur
  useEffect(() => {
    const handleUserInfoChange = (event: CustomEvent) => {
      const { employeeData } = event.detail;
      setEmployee(employeeData);
    };

    const handleAvatarChange = (event: CustomEvent) => {
      const { avatarUrl } = event.detail;
      setEmployee(prev => ({
        ...prev,
        avatarUrl: avatarUrl
      }));
    };

    // Écouter les événements personnalisés
    window.addEventListener('userInfoChanged', handleUserInfoChange as EventListener);
    window.addEventListener('avatarChanged', handleAvatarChange as EventListener);

    // Synchronisation périodique pour s'assurer de la cohérence
    const syncInterval = setInterval(() => {
      syncFromUserInfo();
    }, 2000);

    // Synchronisation initiale
    syncFromUserInfo();

    // Nettoyage
    return () => {
      window.removeEventListener('userInfoChanged', handleUserInfoChange as EventListener);
      window.removeEventListener('avatarChanged', handleAvatarChange as EventListener);
      clearInterval(syncInterval);
    };
  }, []);

  // Sauvegarder les données employé quand elles changent
  useEffect(() => {
    localStorage.setItem(DASHBOARD_EMPLOYEE_KEY, JSON.stringify(employee));
  }, [employee]);

  const handleAddFarmerClick = () => {
    navigate('/listAgriculteur');
  };


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

        {/* Navigation Menu - Matching exact style and order from AgroMap */}
        <nav className="sidebar-menu">
          <ul>
            <li className="menu-item">
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
              <span className="menu-text">Ajouter Agriculteur</span>
            </li>

            <li className="menu-item">
              <span className="menu-icon">🏞️</span>
              <span className="menu-text">Ajouter Parcelle</span>
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
            <div className="header-left">
              <button
                className="mobile-menu-button"
                aria-label="Menu mobile">
                <Menu size={24} />
              </button>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Rechercher"
                />
                <button className='search-button' aria-label="Lancer la recherhe">
                  <Search size={18} className="search-icon" />
                </button>
              </div>
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
                        Tout marquer comme lu
                      </button>
                    </div>
                    <div className="notification-list">
                      <div className="notification-item unread">
                        <p className="notification-text">Nouvelle tâche assignée</p>
                        <p className="notification-time">Il y a 2 heures</p>
                      </div>
                      <div className="notification-item unread">
                        <p className="notification-text">Rappel: Réunion à 14h</p>
                        <p className="notification-time">Il y a 4 heures</p>
                      </div>
                      <div className="notification-item">
                        <p className="notification-text">Document partagé par Thomas</p>
                        <p className="notification-time">Il y a 1 jour</p>
                      </div>
                    </div>
                    <div className="notification-footer">
                      <a href="#" className="view-all-link">Voir toutes les notifications</a>
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
                      className="profile-avatar-small"
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
              <div className="profile-avatar-large">
                {employee.avatarUrl ? (
                  <img
                    src={employee.avatarUrl}
                    alt={employee.name}
                    className="profile-avatar-image"
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  getInitials(employee.name)
                )}
              </div>
              <div className="profile-details">
                <h1 className="profile-name-large">{employee.name}</h1>
                <p className="profile-position-info">{employee.position}</p>
                <div className="profile-status-info">
                  <span className="status-badge active">{employee.status}</span>
                  <span className="join-date">Depuis {employee.joinDate}</span>
                </div>
                <div className="profile-actions">
                  <button className="action-button green">
                    <Phone size={18} className="action-icon" />
                    Appeler
                  </button>
                  <button className="action-button blue">
                    <Mail size={18} className="action-icon" />
                    Email
                  </button>
                  <button className="action-button gray">
                    <Calendar size={18} className="action-icon" />
                    Planifier
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Info Cards */}
          <div className="info-cards-grid">
            {/* Contact Info Card */}
            <div className="info-card">
              <h2 className="card-title">
                <User size={20} className="card-title-icon" />
                Informations de contact
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
                    <p className="contact-label">Téléphone</p>
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
                    <p className="contact-label">Département</p>
                    <p className="contact-value">{employee.department}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Info Card */}
            <div className="info-card">
              <h2 className="card-title">
                <Building size={20} className="card-title-icon" />
                À propos de l'entreprise
              </h2>
              <h3 className="company-name">{employee.company}</h3>
              <p className="company-description">{employee.companyDescription}</p>
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
                Notes et activités
              </button>
              <button
                className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => setActiveTab('tasks')}
              >
                <Clock size={18} />
                Tâches assignées
              </button>
            </div>

            {activeTab === 'notes' && (
              <div className="notes-container">
                {/* Note Input */}
                <div className="note-input-container">
                  <textarea
                    placeholder="Commencez à saisir pour laisser une note..."
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
                      Ajouter une note
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                <div className="notes-list-container">
                  <div className="notes-list-header">
                    <h3 className="notes-history-title">Historique des notes</h3>
                    <div className="notes-filter-pill">
                      Ce mois-ci
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
                                {note.type === 'meeting' ? 'Réunion' :
                                  note.type === 'training' ? 'Formation' : 'Note ajoutée'}
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
                        Aucune note pour le moment. Ajoutez votre première note !
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="tasks-container">
                <h3 className="tasks-title">Tâches à réaliser</h3>
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
                            <span className="task-due-text">Échéance: {task.due}</span>
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
                      Aucune tâche assignée pour le moment.
                    </div>
                  )}
                </div>

                {/* Add Task Section */}
                <div className="add-task-section">
                  <h4 className="add-task-title">Ajouter une nouvelle tâche</h4>
                  <div className="add-task-form">
                    <input
                      type="text"
                      placeholder="Titre de la tâche..."
                      className="add-task-input"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      aria-label="Titre de la nouvelle tâche"
                    />
                    <button
                      className="add-task-button"
                      onClick={() => addTask(newTaskTitle)}
                      disabled={!newTaskTitle.trim()}
                    >
                      <Plus size={18} />
                      Ajouter
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
                © 2025 AgriApp. Tous droits réservés.
              </p>
              <div className="footer-links">
                <a href="#" className="footer-link">Politique de confidentialité</a>
                <a href="#" className="footer-link">Conditions d'utilisation</a>
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