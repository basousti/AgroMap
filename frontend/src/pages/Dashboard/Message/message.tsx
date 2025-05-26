import React, { useState, useEffect } from 'react';
import { FaPhone, FaVideo, FaUserPlus, FaCog, FaArrowLeft } from 'react-icons/fa';
import './Message.css';
import { useNavigate, useLocation } from 'react-router-dom';

interface Message {
  id: number;
  sender: string;
  avatar: string;
  text: string;
  timestamp: string;
}

interface ChatGroup {
  id: number;
  name: string;
  icon: string;
  participants: number;
  messages: Message[];
}

const MessageComponent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Récupérer les données de message stockées si elles existent
  const getStoredMessages = () => {
    const storedMessages = localStorage.getItem('sicamMessages');
    if (storedMessages) {
      return JSON.parse(storedMessages);
    }
    return defaultMessages;
  };
  
  const defaultMessages = [
    { id: 1, sender: 'Admin', avatar: '👨‍💼', text: 'Bonjour à tous, bienvenue dans le groupe de l\'équipe SICAM!', timestamp: '09:30' },
    { id: 2, sender: 'Marie', avatar: '👩‍💼', text: 'Merci Admin! Je suis ravie de faire partie de cette équipe.', timestamp: '09:35' },
    { id: 3, sender: 'Karim', avatar: '👨‍💻', text: 'Bonjour tout le monde, j\'espère que nous pourrons collaborer efficacement.', timestamp: '09:40' },
    { id: 4, sender: 'Sophie', avatar: '👩‍🔬', text: 'Je vous partage le planning de la semaine par email.', timestamp: '09:45' },
    { id: 5, sender: 'Admin', avatar: '👨‍💼', text: 'N\'oubliez pas la réunion d\'équipe à 14h aujourd\'hui', timestamp: '10:15' }
  ];

  const [group, setGroup] = useState<ChatGroup>({
    id: 1,
    name: 'SICAM Team',
    icon: '👥',
    participants: 8,
    messages: getStoredMessages()
  });

  const [newMessage, setNewMessage] = useState<string>('');
  const [onlineCount] = useState<number>(6);
  const [currentUser] = useState({ name: 'Vous', avatar: '👤' });

  const simulatedUsers = [
    { name: 'Admin', avatar: '👨‍💼' },
    { name: 'Marie', avatar: '👩‍💼' },
    { name: 'Sophie', avatar: '👩‍🔬' },
    { name: 'Lucas', avatar: '👨‍💻' },
    { name: 'Karim', avatar: '👨‍💻' },
    { name: 'Ahmed', avatar: '👨‍🚀' },
    { name: 'Fatima', avatar: '👩‍🏫' }
  ];

  // Sauvegarder les messages dans localStorage chaque fois qu'ils sont mis à jour
  useEffect(() => {
    localStorage.setItem('sicamMessages', JSON.stringify(group.messages));
  }, [group.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg: Message = {
      id: group.messages.length + 1,
      sender: currentUser.name,
      avatar: currentUser.avatar,
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedGroup = {
      ...group,
      messages: [...group.messages, newMsg]
    };

    setGroup(updatedGroup);
    setNewMessage('');

    setTimeout(() => {
      simulateResponse();
    }, Math.random() * 3000 + 1000);
  };

  const simulateResponse = () => {
    const randomUser = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
    const responses = [
      "Je suis d'accord avec cette approche.",
      "Intéressant, pouvons-nous en discuter davantage?",
      "Merci pour l'information!",
      "J'ai une idée à ce sujet...",
      "Quand pouvons-nous planifier la prochaine réunion SICAM?",
      "Je vais vérifier les données et revenir vers vous.",
      "L'équipe SICAM a vraiment fait du bon travail sur ce projet.",
      "N'oubliez pas la deadline de vendredi pour le rapport.",
      "Je partagerai les documents plus tard.",
      "Avez-vous eu des retours sur la présentation?",
      "Où en sommes-nous avec le système?",
      "OK, je m'en occupe.",
      "Parfait, merci.",
      "Pouvons-nous reporter?",
      "Bien reçu, j'en prends note."
    ];

    const simulatedMessage: Message = {
      id: group.messages.length + 1,
      sender: randomUser.name,
      avatar: randomUser.avatar,
      text: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setGroup(prev => ({
      ...prev,
      messages: [...prev.messages, simulatedMessage]
    }));
  };

  // Faire défiler les messages vers le bas lorsque de nouveaux messages arrivent
  useEffect(() => {
    const messageList = document.querySelector('.message-list');
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, [group.messages]);

  const handleBack = () => {
    navigate('/dashboardE');
  };

  return (
    <div className="message-container">
      <div className="message-header">
        <FaArrowLeft className="back-button" title="Retour" onClick={handleBack} />
        <div className="avatar">{group.icon}</div>
        <div className="header-info">
          <div className="group-name">{group.name}</div>
          <div className="online-status">
            {group.participants} participants • {onlineCount} en ligne
          </div>
        </div>
        <div className="header-icons">
          <FaPhone className="header-icon" title="Appel audio" />
          <FaVideo className="header-icon" title="Appel vidéo" />
          <FaUserPlus className="header-icon" title="Ajouter un membre" />
          <FaCog className="header-icon" title="Paramètres" />
        </div>
      </div>

      <div className="message-content">
        <div className="message-list">
          {group.messages.map((msg) => (
            <div key={msg.id} className="message-row">
              <div className="message-avatar">{msg.avatar}</div>
              <div className="message-bubble-container">
                <div className="message-sender">{msg.sender}</div>
                <div className={`message-bubble ${msg.sender === currentUser.name ? 'sent' : 'received'}`}>
                  <div className="message-text">{msg.text}</div>
                  <div className="message-meta">
                    <span className="message-time">{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form className="message-input-container" onSubmit={handleSendMessage}>
          <input
            className="message-input"
            type="text"
            placeholder="Écrivez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button className="send-button" type="submit">📤</button>
        </form>
      </div>
    </div>
  );
};

export default MessageComponent;