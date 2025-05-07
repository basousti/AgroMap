import React, { useState, useEffect, useRef } from 'react';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaPen, FaEllipsisH, FaParagraph, FaCalendarAlt, FaSave, FaTimes, FaArrowUp, FaArrowDown, FaTrashAlt } from 'react-icons/fa';
import { BsPlusSquareFill, BsCardText, BsPinAngleFill, BsClipboardData } from 'react-icons/bs';
import { BiSearch, BiBold, BiItalic, BiUnderline, BiChevronDown } from 'react-icons/bi';
import { AiOutlineUnorderedList, AiOutlineOrderedList } from 'react-icons/ai';
import './dashboardEmpl.css';
import UserProfile from '../profil/UserProfile';
import { useNavigate } from 'react-router-dom';

// Interfaces
interface Contact {
  id: string;
  nom: string;
  titre: string;
  email: string;
  telephone: string;
  adresse: string;
  photo: string;
}

interface Note {
  id: string;
  contactId: string;
  contenu: string;
  dateCreation: Date;
}

interface Entreprise {
  nom: string;
  logo: string;
  description: string;
}

// Composant principal
const DashboardEmploye: React.FC = () => {


  const [utilisateurActuel] = useState<string>("nouha")
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notes, setNotes] = useState<Map<string, Note[]>>(new Map());
  const [entreprise] = useState<Entreprise>({
    nom: "Arman Studio",
    logo: "assets/images/sicam.jpg",
    description: "Spécialiste en solutions numériques innovantes depuis 2010. Notre entreprise propose des services de conception et développement sur mesure."
  });
  const [contactActuel, setContactActuel] = useState<Contact | null>(null);
  const [nouvelleNote, setNouvelleNote] = useState<string>("");
  const [filtrePeriode, setFiltrePeriode] = useState<string>("Ce mois");
  const [ongletActif, setOngletActif] = useState<string>("ajouter-note");
  const [showUserProfile, setShowUserProfile] = useState<boolean>(false);

  // États pour l'édition des notes
  const [noteEnEdition, setNoteEnEdition] = useState<string | null>(null);
  const [contenuEdite, setContenuEdite] = useState<string>("");

  // État pour la suppression des notes (nouveau)
  const [noteASupprimer, setNoteASupprimer] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  // Nouvel état pour afficher le bouton de défilement
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');

  // Nouveaux états pour le formatage de texte
  const [selection, setSelection] = useState<{ start: number, end: number }>({ start: 0, end: 0 });
  const [lastFormatting, setLastFormatting] = useState<{ format: string | null, newPos: number | null }>({ format: null, newPos: null });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const navigate = useNavigate();

  // États pour la barre latérale
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(3);

  // Fonctions pour la barre latérale
  const handleMessagesClick = () => {
    navigate("/messages");
    setUnreadMessageCount(0);
  };

  const handleAddFarmerClick = () => {
    navigate('/listAgriculteur');
  };

  // Initialisation des données
  useEffect(() => {
    initialiserDonnees();

    // Ajout de l'écouteur de défilement pour afficher/masquer le bouton de défilement
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollButton(true);
        // Définir la direction de défilement en fonction de la position de défilement
        if (window.scrollY > document.body.scrollHeight / 2) {
          setScrollDirection('up');
        } else {
          setScrollDirection('down');
        }
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Nettoyage
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Effet pour gérer le focus et la position du curseur après la mise à jour du texte
  useEffect(() => {
    // Cette fonction s'exécute après chaque rendu si nouvelleNote change et qu'un formatage a été appliqué
    if (textareaRef.current && lastFormatting.format !== null && lastFormatting.newPos !== null) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(lastFormatting.newPos, lastFormatting.newPos);
      // Réinitialiser lastFormatting après avoir appliqué le positionnement
      setLastFormatting({ format: null, newPos: null });
    }
  }, [nouvelleNote, lastFormatting]);

  const initialiserDonnees = () => {
    // Exemple de contact
    const contact: Contact = {
      id: "c1",
      nom: "moauia nouha",
      titre: "Designer UI/UX",
      email: "maouianouha2@gmail.com",
      telephone: "+12 3456 7890",
      adresse: "Tunis Menzeh 8",
      photo: "/assets/images/profile.jpg"
    };

    // Exemple de notes pour ce contact
    const notesContact: Note[] = [
      {
        id: "n1",
        contactId: "c1",
        contenu: "Réunion prévue pour discuter des nouvelles maquettes du projet client.",
        dateCreation: new Date(2022, 7, 10) // 10 août 2022
      },
      {
        id: "n2",
        contactId: "c1",
        contenu: "A partagé des idées intéressantes sur l'amélioration de l'expérience utilisateur pour notre application mobile.",
        dateCreation: new Date(2022, 7, 10) // 10 août 2022
      }
    ];

    setContacts([contact]);
    setContactActuel(contact);

    const nouvellesNotes = new Map<string, Note[]>();
    nouvellesNotes.set(contact.id, notesContact);
    setNotes(nouvellesNotes);
  };

  const formaterDate = (date: Date): string => {
    const jour = date.getDate();
    const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][date.getMonth()];
    const annee = date.getFullYear();
    return `${jour} ${mois} ${annee}`;
  };

  const ajouterNote = () => {
    if (!contactActuel || !nouvelleNote.trim()) return;

    const nouvelleNoteObj: Note = {
      id: `n${Date.now()}`,
      contactId: contactActuel.id,
      contenu: nouvelleNote.trim(),
      dateCreation: new Date()
    };

    const notesActuelles = notes.get(contactActuel.id) || [];
    const notesMAJ = [...notesActuelles, nouvelleNoteObj];

    const nouvellesNotes = new Map(notes);
    nouvellesNotes.set(contactActuel.id, notesMAJ);

    setNotes(nouvellesNotes);
    setNouvelleNote("");
  };

  // Fonction pour commencer l'édition d'une note
  const commencerEdition = (note: Note) => {
    setNoteEnEdition(note.id);
    setContenuEdite(note.contenu);
  };

  // Fonction pour annuler l'édition
  const annulerEdition = () => {
    setNoteEnEdition(null);
    setContenuEdite("");
  };

  // Fonction pour sauvegarder les modifications
  const sauvegarderModification = (noteId: string) => {
    if (!contactActuel) return;

    const notesActuelles = notes.get(contactActuel.id) || [];
    const notesMAJ = notesActuelles.map(note =>
      note.id === noteId ? { ...note, contenu: contenuEdite } : note
    );

    const nouvellesNotes = new Map(notes);
    nouvellesNotes.set(contactActuel.id, notesMAJ);

    setNotes(nouvellesNotes);
    setNoteEnEdition(null);
    setContenuEdite("");
  };

  // Fonction pour confirmer la suppression d'une note
  const confirmerSuppression = (noteId: string) => {
    setNoteASupprimer(noteId);
    setShowConfirmDelete(true);
  };

  // Fonction pour annuler la suppression
  const annulerSuppression = () => {
    setNoteASupprimer(null);
    setShowConfirmDelete(false);
  };

  // Fonction pour supprimer une note
  const supprimerNote = () => {
    if (!contactActuel || !noteASupprimer) return;

    const notesActuelles = notes.get(contactActuel.id) || [];
    const notesMAJ = notesActuelles.filter(note => note.id !== noteASupprimer);

    const nouvellesNotes = new Map(notes);
    nouvellesNotes.set(contactActuel.id, notesMAJ);

    setNotes(nouvellesNotes);
    setNoteASupprimer(null);
    setShowConfirmDelete(false);
  };

  // Nouvelle fonction pour faire défiler la page
  const handleScroll = () => {
    if (scrollDirection === 'up') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      setScrollDirection('down');
    } else {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
      setScrollDirection('up');
    }
  };

  // Fonction pour suivre la sélection de texte
  const handleSelectionChange = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      setSelection({ start, end });
    }
  };

  // Fonction pour appliquer le formatage de texte - Corrigée
  const applyFormatting = (format: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = nouvelleNote;

    let formattedText = '';
    let newCursorPos = end;

    switch (format) {
      case 'bold':
        formattedText = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
        newCursorPos = end + 4; // Position après les marqueurs **
        break;
      case 'italic':
        formattedText = text.substring(0, start) + '*' + text.substring(start, end) + '*' + text.substring(end);
        newCursorPos = end + 2; // Position après les marqueurs *
        break;
      case 'underline':
        formattedText = text.substring(0, start) + '__' + text.substring(start, end) + '__' + text.substring(end);
        newCursorPos = end + 4; // Position après les marqueurs __
        break;
      case 'paragraph':
        formattedText = text.substring(0, start) + '\n\n' + text.substring(start, end) + '\n\n' + text.substring(end);
        newCursorPos = end + 4; // Position après les deux sauts de ligne
        break;
      case 'unordered-list':
        if (start === end) {
          // Pas de sélection, ajouter juste un élément de liste
          formattedText = text.substring(0, start) + '\n- ' + text.substring(end);
          newCursorPos = start + 3; // Position après "- "
        } else {
          // Sélection, transformer chaque ligne en élément de liste
          const selectedText = text.substring(start, end);
          const lines = selectedText.split('\n');
          const formattedLines = lines.map(line => `- ${line}`).join('\n');
          formattedText = text.substring(0, start) + formattedLines + text.substring(end);
          newCursorPos = start + formattedLines.length;
        }
        break;
      case 'ordered-list':
        if (start === end) {
          // Pas de sélection, ajouter juste un élément de liste
          formattedText = text.substring(0, start) + '\n1. ' + text.substring(end);
          newCursorPos = start + 4; // Position après "1. "
        } else {
          // Sélection, transformer chaque ligne en élément de liste
          const selectedText = text.substring(start, end);
          const lines = selectedText.split('\n');
          const formattedLines = lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
          formattedText = text.substring(0, start) + formattedLines + text.substring(end);
          newCursorPos = start + formattedLines.length;
        }
        break;
      default:
        return;
    }

    // Mettre à jour l'état avec le texte formaté
    setNouvelleNote(formattedText);

    // Stocker le format et la nouvelle position du curseur pour que useEffect puisse les utiliser
    setLastFormatting({ format, newPos: newCursorPos });
  };

  return (
    <div className={`dashboard-container ${showUserProfile ? 'blur-background' : ''}`}>
      {/* Barre latérale */}
      <div className="dashboard-unified">
        <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
          <button className="toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? "⬅" : "➡"}
          </button>
          {isSidebarOpen && (
            <div>
              <img
                alt=""
                src="/AgroMap.png"
                width="190"
                height="150"
                className="d-inline-block align-top"
              />
            </div>
          )}

          <nav className="sidebar-menu">
            <ul>
              <li className="menu-item active">📊 Dashboard</li>
              <li className="menu-item" onClick={handleMessagesClick}>
                ✉️ Messages {unreadMessageCount > 0 && <span className="badge">{unreadMessageCount}</span>}
              </li>
              <li className="menu-item">❓ Help</li>
              <li className="menu-item" onClick={handleAddFarmerClick}>👤 Ajouter Agriculteur</li>
              <li className="menu-item">🏞️ Ajouter Parcelle</li>
            </ul>
          </nav>
        </div>

        {/* Contenu principal */}
        <div className="dashboard-main-content">
          <header className="dashboard-header">
            <div className="header-content">
              <h1>Bienvenue, {utilisateurActuel}</h1>
              <div className="date">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
              <div className="recherche">
                <input type="text" placeholder="Rechercher" />
                <button className="btn-recherche">
                  <BiSearch />
                </button>
              </div>
              <div className="notifications">
                <span className="icon-notification">🔔</span>
              </div>
              <div
                className="profil-utilisateur"
                onClick={() => {
                  console.log("Profil cliqué, showUserProfile avant:", showUserProfile);
                  setShowUserProfile(true)
                }}
                style={{ cursor: 'pointer' }}
              >
                <img src="/assets/images/profile.jpg" alt="Avatar utilisateur" />
              </div>
            </div>
          </header>

          <div className="dashboard-content">
            <div className="layout">
              {contactActuel && (
                <>
                  <div className="section-contact">
                    <div className="carte-contact">
                      <div className="photo-contact">
                        <img src={contactActuel.photo} alt={contactActuel.nom} />
                      </div>
                      <h2>{contactActuel.nom}</h2>
                      <p className="titre">{contactActuel.titre}</p>

                      <div className="actions-contact">
                        <button className="btn-appel">
                          <FaPhoneAlt className="icon-telephone" />
                          Appeler {contactActuel.nom.split(' ')[0]}
                        </button>
                      </div>

                      <div className="info-contact">
                        <div className="info-ligne">
                          <FaEnvelope className="icon-email" />
                          <a href={`mailto:${contactActuel.email}`}>{contactActuel.email}</a>
                        </div>
                        <div className="info-ligne">
                          <FaPhoneAlt className="icon-telephone" />
                          <span>{contactActuel.telephone}</span>
                        </div>
                        <div className="info-ligne">
                          <FaMapMarkerAlt className="icon-lieu" />
                          <span>{contactActuel.adresse}</span>
                        </div>
                      </div>

                      <div className="section-entreprise">
                        <h3>À propos de l'entreprise</h3>
                        <div className="info-entreprise">
                          <img src={entreprise.logo} alt={entreprise.nom} className="logo-entreprise" />
                          <h4>{entreprise.nom}</h4>
                        </div>
                        <p className="description-entreprise">{entreprise.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="section-notes">
                    <div className="en-tete-notes">
                      <div className="actions-notes">
                        <button
                          className={`btn-action ${ongletActif === 'ajouter-note' ? 'active' : ''}`}
                          onClick={() => setOngletActif('ajouter-note')}
                        >
                          <BsPlusSquareFill className="icon-action" />
                          <span>Ajouter une note</span>
                        </button>
                        <button
                          className={`btn-action ${ongletActif === 'assigner' ? 'active' : ''}`}
                          onClick={() => setOngletActif('assigner')}
                        >
                          <BsPinAngleFill className="icon-action" />
                          <span>Assigner à</span>
                        </button>
                        <button
                          className={`btn-action ${ongletActif === 'appeler' ? 'active' : ''}`}
                          onClick={() => setOngletActif('appeler')}
                        >
                          <FaPhoneAlt className="icon-action" />
                          <span>Appeler</span>
                        </button>
                        <button
                          className={`btn-action ${ongletActif === 'journal' ? 'active' : ''}`}
                          onClick={() => setOngletActif('journal')}
                        >
                          <BsClipboardData className="icon-action" />
                          <span>Journal d'activité</span>
                        </button>
                      </div>
                    </div>

                    <div className="editeur-notes">
                      <div className="zone-saisie">
                        <textarea
                          ref={textareaRef}
                          placeholder="Commencez à saisir pour laisser une note..."
                          value={nouvelleNote}
                          onChange={(e) => setNouvelleNote(e.target.value)}
                          onSelect={handleSelectionChange}
                          onKeyUp={handleSelectionChange}
                          onMouseUp={handleSelectionChange}
                        ></textarea>
                        <div className="outils-formatage">
                          <button
                            className="outil-texte"
                            onClick={() => applyFormatting('paragraph')}
                            title="Paragraphe"
                          >
                            <FaParagraph />
                          </button>
                          <button
                            className="outil-texte"
                            onClick={() => applyFormatting('unordered-list')}
                            title="Liste à puces"
                          >
                            <AiOutlineUnorderedList />
                          </button>
                          <button
                            className="outil-texte"
                            onClick={() => applyFormatting('ordered-list')}
                            title="Liste numérotée"
                          >
                            <AiOutlineOrderedList />
                          </button>
                          <span className="separateur"></span>
                          <button
                            className="outil-texte"
                            onClick={() => applyFormatting('italic')}
                            title="Italique"
                          >
                            <BiItalic />
                          </button>
                          <button
                            className="outil-texte"
                            onClick={() => applyFormatting('bold')}
                            title="Gras"
                          >
                            <BiBold />
                          </button>
                          <button
                            className="outil-texte"
                            onClick={() => applyFormatting('underline')}
                            title="Souligné"
                          >
                            <BiUnderline />
                          </button>
                        </div>
                        <div className="actions-editeur">
                          <button className="btn-creer-note" onClick={ajouterNote}>
                            Créer une note
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="liste-activites">
                      <div className="en-tete-activites">
                        <h3>Activité</h3>
                        <div className="filtre-periode">
                          <FaCalendarAlt style={{ marginRight: '5px' }} />
                          <span>{filtrePeriode}</span>
                          <BiChevronDown className="icon-deroulant" />
                        </div>
                      </div>

                      <div className="activites">
                        {notes.get(contactActuel.id)?.map((note) => (
                          <div className="activite" key={note.id}>
                            <div className="icone-activite">
                              <BsCardText className="icon-note" />
                            </div>
                            <div className="contenu-activite">
                              <div className="en-tete-activite">
                                <span className="type-activite">Note ajoutée</span>
                                <span className="date-activite">{formaterDate(note.dateCreation)}</span>
                              </div>

                              {noteEnEdition === note.id ? (
                                // Mode Édition
                                <div className="note-edition">
                                  <textarea
                                    className="champ-edition"
                                    value={contenuEdite}
                                    onChange={(e) => setContenuEdite(e.target.value)}
                                  ></textarea>
                                  <div className="actions-edition">
                                    <button
                                      className="btn-sauvegarder"
                                      title="Sauvegarder"
                                      onClick={() => sauvegarderModification(note.id)}
                                    >
                                      <FaSave className="icon-sauvegarder" />
                                    </button>
                                    <button
                                      className="btn-annuler"
                                      title="Annuler"
                                      onClick={annulerEdition}
                                    >
                                      <FaTimes className="icon-annuler" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // Mode Affichage
                                <>
                                  <p>{note.contenu}</p>
                                  <div className="actions-activite">
                                    <button
                                      className="btn-modifier"
                                      title="Modifier"
                                      onClick={() => commencerEdition(note)}
                                    >
                                      <FaPen className="icon-modifier" />
                                    </button>
                                    <button
                                      className="btn-supprimer"
                                      title="Supprimer"
                                      onClick={() => confirmerSuppression(note.id)}
                                    >
                                      <FaTrashAlt className="icon-supprimer" />
                                    </button>
                                    <button className="btn-options" title="Plus d'options">
                                      <FaEllipsisH className="icon-options" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bouton de défilement */}
      {showScrollButton && (
        <button className="scroll-button" onClick={handleScroll}>
          {scrollDirection === 'up' ? <FaArrowUp /> : <FaArrowDown />}
        </button>
      )}

      {/* Modale de confirmation de suppression */}
      {showConfirmDelete && (
        <div className="modal-overlay">
          <div className="modal-confirm-delete">
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer cette note ?</p>
            <div className="modal-actions">
              <button className="btn-annuler" onClick={annulerSuppression}>
                Annuler
              </button>
              <button className="btn-supprimer" onClick={supprimerNote}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserProfile && (
        <UserProfile
          onClose={() => setShowUserProfile(false)}
          userName="Nouha"
          userEmail="maouianouha2@gmail.com"
          avatarUrl="/assets/images/profile.jpg"
        />
      )}
    </div>
  );
};

export default DashboardEmploye;