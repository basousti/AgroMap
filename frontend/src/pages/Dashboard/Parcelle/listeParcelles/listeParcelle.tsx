import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import './listeParcelle.css';

interface Parcelle {
  id: number;
  nom: string;
  surface: number;
  culture: string;
  statut: 'active' | 'repos' | 'preparation';
}

const ListeParcelle: React.FC = () => {
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Données d'exemple
  useEffect(() => {
    const donneesExemple: Parcelle[] = [
      { id: 1, nom: " maouia noamen ", surface: 8.2, culture: "Tomate", statut: "active" },
      { id: 2, nom: "ben slimen chikh", surface: 12.5, culture: "Tomate", statut: "active" },
      { id: 3, nom: "maouia mouhamed", surface: 15.8, culture: "Piment", statut: "repos" },
      { id: 4, nom: "ben salah ali", surface: 6.3, culture: "Tomate", statut: "preparation" },
      { id: 5, nom: "mouldi faouzi", surface: 20.1, culture: "Piment", statut: "active" },
      { id: 6, nom: "ben alaya hedi", surface: 9.7, culture: "Poivron", statut: "active" },
      { id: 7, nom: "ben slimen hassine", surface: 11.4, culture: "Poivron", statut: "repos" },
      { id: 8, nom: "mouldi bachir", surface: 7.9, culture: "Tomate", statut: "active" },
      { id: 9, nom: "ben alaya mahmoud", surface: 14.2, culture: "Tomate", statut: "preparation" },
      { id: 10, nom: "bel hadj habib", surface: 4.6, culture: "Tomate", statut: "active" }
    ];

    setTimeout(() => {
      setParcelles(donneesExemple);
      setIsLoading(false);
    }, 800);
  }, []);

  const getStatutConfig = (statut: string) => {
    switch (statut) {
      case 'active': 
        return { 
          color: 'status-active', 
          text: 'Active',
          dot: 'dot-active'
        };
      case 'repos': 
        return { 
          color: 'status-repos', 
          text: 'En repos',
          dot: 'dot-repos'
        };
      case 'preparation': 
        return { 
          color: 'status-preparation', 
          text: 'Préparation',
          dot: 'dot-preparation'
        };
      default: 
        return { 
          color: 'status-default', 
          text: 'Inconnu',
          dot: 'dot-default'
        };
    }
  };

  const filteredParcelles = parcelles.filter(parcelle =>
    parcelle.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parcelle.culture.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Chargement des parcelles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="parcelle-container">
      <div className="parcelle-wrapper">
        
        {/* Barre de contrôles */}
        <div className="controls-section">
          <div className="controls-row">
            {/* Champ de texte */}
            <div className="input-container">
              <input
                type="text"
                placeholder="Nom de la parcelle ou culture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-input"
              />
            </div>
            
            {/* Boutons d'action */}
            <div className="actions-container">
              <button className="action-button action-button-filter">
                <Filter size={20} />
                <span className="button-text">Filtrer</span>
              </button>
              <button className="action-button action-button-primary">
                <Plus size={20} />
                <span className="button-text">Ajouter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tableau principal */}
        <div className="table-container">
          
          {/* En-tête du tableau */}
          <div className="table-header">
            <div className="table-header-row">
              <div className="header-cell header-name">Nom de l'agriculteur</div>
              <div className="header-cell header-surface">Surface</div>
              <div className="header-cell header-culture">Culture</div>
              <div className="header-cell header-status">Statut</div>
            </div>
          </div>

          {/* Corps du tableau */}
          <div className="table-body">
            {filteredParcelles.map((parcelle, index) => {
              const statutConfig = getStatutConfig(parcelle.statut);
              
              return (
                <div
                  key={parcelle.id}
                  className="table-row"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Nom de la parcelle */}
                  <div className="table-cell cell-name">
                    <div className={`status-dot ${statutConfig.dot}`}></div>
                    <div className="name-content">
                      <h3 className="parcelle-name">
                        {parcelle.nom}
                      </h3>
                      <p className="parcelle-id">ID: {parcelle.id}</p>
                    </div>
                  </div>

                  {/* Surface */}
                  <div className="table-cell cell-surface">
                    <div className="surface-badge">
                      <span className="surface-value">
                        {parcelle.surface}
                      </span>
                      <span className="surface-unit">ha</span>
                    </div>
                  </div>

                  {/* Culture */}
                  <div className="table-cell cell-culture">
                    <div className="culture-badge">
                      {parcelle.culture}
                    </div>
                  </div>

                  {/* Statut */}
                  <div className="table-cell cell-status">
                    <div className={`status-badge ${statutConfig.color}`}>
                      {statutConfig.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message si aucun résultat */}
          {filteredParcelles.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <Search size={24} />
              </div>
              <h3 className="empty-title">Aucune parcelle trouvée</h3>
              <p className="empty-description">Essayez de modifier vos critères de recherche</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListeParcelle;