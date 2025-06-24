import React, { useState, useEffect } from 'react';
import { MapPin, List, Maximize2, Minimize2, Filter, Users, BarChart3, TrendingUp } from 'lucide-react';
import ListeParcelle from '../listeParcelles/listeParcelle';
import CarteInteractive from '../carteInteractive/carteInteractive';
import './dashboardParcelle.css';
import { useNavigate } from 'react-router-dom';

interface Parcelle {
  id: number;
  _id?: string; // Ajouté pour MongoDB
  nom: string;
  latitude: number;
  longitude: number;
  superficie: string; 
  type: string;
  statut?: 'active' | 'repos' | 'preparation';
  montantInvestissement?: number;
  farmerId?: string;
  dateCreation?: string;
  culture?: string;
  coordonnees?: any;
  formeType?: 'polygon' | 'rectangle' | 'circle' | 'marker';
  surfaceTotale?: number;
  drawnParcels?: any[];
}

interface DashboardStats {
  totalParcelles: number;
  totalSurface: number;
  parcellesActives: number;
  totalInvestissement: number;
}

// Configuration API
const API_BASE_URL = 'http://localhost:5000';

const DashboardParcelle: React.FC = () => {
  const [parcellesFiltrees, setParcellesFiltrees] = useState<Parcelle[]>([]);
  const [parcelleSelectionnee, setParcelleSelectionnee] = useState<Parcelle | null>(null);
  const [nouvelleParcelle, setNouvelleParcelle] = useState<Parcelle | null>(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [isLeftPanelExpanded, setIsLeftPanelExpanded] = useState(false);
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalParcelles: 0,
    totalSurface: 0,
    parcellesActives: 0,
    totalInvestissement: 0
  });
const navigate = useNavigate();
  // ==================== FONCTIONS API ====================
  
  // Récupérer les parcelles depuis l'API
  const chargerParcellesAPI = async (): Promise<Parcelle[]> => {
    try {
      console.log('🔄 Chargement des parcelles depuis l\'API...');
      
      const response = await fetch(`${API_BASE_URL}/api/parcelles/`, {
        method: 'GET',
        mode: 'cors', // Ajouté
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json', // Ajouté
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Données API reçues:', data);

      // Gestion des différents formats de réponse
      let parcellesData: any[] = [];
      if (data.success && Array.isArray(data.data)) {
        parcellesData = data.data;
      } else if (Array.isArray(data)) {
        parcellesData = data;
      } else {
        console.warn('⚠️ Unexpected API response format');
        return [];
      }

      // Normaliser les données pour l'interface
      const parcellesNormalisees: Parcelle[] = parcellesData.map((parcelle: any, index: number) => ({
        id: parcelle._id ? parseInt(parcelle._id.slice(-6), 16) : index + 1, // Générer un ID numérique
        _id: parcelle._id,
        nom: parcelle.farmerId || parcelle.nom || 'Agriculteur inconnu', // ✅ CORRIGÉ : Utilise farmerId comme nom d'affichage
        latitude: parcelle.latitude || 0,
        longitude: parcelle.longitude || 0,
        superficie: parcelle.superficie?.toString() || '0',
        type: parcelle.type || 'Inconnu',
        statut: parcelle.statut === 'active' ? 'active' : 
                parcelle.statut === 'repos' ? 'repos' : 
                parcelle.statut === 'preparation' ? 'preparation' : 'active',
        culture: parcelle.culture || 'Non définie',
        montantInvestissement: parcelle.montantInvestissement || 0,
        farmerId: parcelle.farmerId,
        dateCreation: parcelle.createdAt || parcelle.dateCreation,
        surfaceTotale: typeof parcelle.superficie === 'number' ? parcelle.superficie : 
                      parseFloat(parcelle.superficie?.toString() || '0') || 0,
        coordonnees: parcelle.coordonnees,
        formeType: parcelle.formeType || 'marker',
        drawnParcels: parcelle.drawnParcels || []
      }));

      console.log(`✅ ${parcellesNormalisees.length} parcelles normalisées`);
      return parcellesNormalisees;

    } catch (error) {
      console.error('❌ Erreur lors du chargement des parcelles API:', error);
      
      // Informations détaillées sur l'erreur CORS
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        console.error('🚫 Erreur CORS détectée. Solutions possibles:');
        console.error('1. Vérifiez que le serveur backend est démarré');
        console.error('2. Vérifiez la configuration CORS du backend');
        console.error('3. URL API utilisée:', API_BASE_URL);
      }
      
      return [];
    }
  };

  // Charger les statistiques (hybride: API + localStorage)
  const chargerStatistiques = async () => {
    try {
      // 1. Essayer de charger depuis l'API
      const parcellesAPI = await chargerParcellesAPI();
      
      if (parcellesAPI.length > 0) {
        console.log('📊 Utilisation des données API pour les statistiques');
        calculerStatistiques(parcellesAPI);
        
        // Mettre à jour les parcelles filtrées avec les données API
        setParcellesFiltrees(parcellesAPI);
        
        // Optionnel: synchroniser avec localStorage
        localStorage.setItem('parcellesEnregistrees', JSON.stringify(parcellesAPI));
        return;
      }

      // 2. Fallback vers localStorage si l'API ne fonctionne pas
      console.log('📊 Fallback vers localStorage');
      const savedParcelles = localStorage.getItem('parcellesEnregistrees');
      if (savedParcelles) {
        const parcelles = JSON.parse(savedParcelles);
        calculerStatistiques(parcelles);
        setParcellesFiltrees(parcelles);
      }

    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques:', error);
      
      // Fallback ultime vers localStorage
      try {
        const savedParcelles = localStorage.getItem('parcellesEnregistrees');
        if (savedParcelles) {
          const parcelles = JSON.parse(savedParcelles);
          calculerStatistiques(parcelles);
          setParcellesFiltrees(parcelles);
        }
      } catch (localError) {
        console.error('❌ Erreur fallback localStorage:', localError);
      }
    }
  };

  // Calculer les statistiques à partir des données
  const calculerStatistiques = (parcelles: Parcelle[]) => {
    const totalParcelles = parcelles.length;
    const totalSurface = parcelles.reduce((sum: number, p: Parcelle) => {
      const surface = p.surfaceTotale ? p.surfaceTotale / 10000 : 0;
      return sum + surface;
    }, 0);
    const parcellesActives = parcelles.filter((p: Parcelle) => p.statut === 'active').length;
    const totalInvestissement = parcelles.reduce((sum: number, p: Parcelle) => 
      sum + (p.montantInvestissement || 0), 0
    );

    setStats({
      totalParcelles,
      totalSurface: Math.round(totalSurface * 100) / 100,
      parcellesActives,
      totalInvestissement
    });

    console.log('📊 Statistiques calculées:', {
      totalParcelles,
      totalSurface,
      parcellesActives,
      totalInvestissement
    });
  };

  // Vérifier la disponibilité de l'API
  const verifierAPI = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        mode: 'cors', // Ajouté
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' // Ajouté
        },
      });
      
      if (!response.ok) {
        console.log(`⚠️ API réponse: ${response.status} ${response.statusText}`);
        return false;
      }
      
      const data = await response.json();
      console.log('🏥 État API:', data.success ? '✅ Disponible' : '❌ Indisponible');
      return response.ok && data.success;
    } catch (error) {
      console.log('⚠️ API non accessible:', error instanceof Error ? error.message : 'Erreur inconnue');
      console.log('🔄 Mode localStorage activé');
      return false;
    }
  };

  // ==================== EFFECTS (STRUCTURE CONSERVÉE) ====================

  // Mettre à jour les statistiques périodiquement (logique améliorée)
  useEffect(() => {
    // Chargement initial
    chargerStatistiques();
    
    // Actualisation périodique avec vérification API
    const interval = setInterval(async () => {
      const apiDisponible = await verifierAPI();
      if (apiDisponible) {
        chargerStatistiques(); // Utilise l'API si disponible
      } else {
        // Fallback localStorage uniquement si nécessaire
        const savedParcelles = localStorage.getItem('parcellesEnregistrees');
        if (savedParcelles) {
          const parcelles = JSON.parse(savedParcelles);
          calculerStatistiques(parcelles);
          setParcellesFiltrees(parcelles);
        }
      }
    }, 3000); // Gardé 3 secondes comme dans l'original

    return () => clearInterval(interval);
  }, []);

  // ==================== HANDLERS (STRUCTURE CONSERVÉE) ====================

  // Gérer la sélection d'une parcelle
  const handleParcelleClick = (parcelle: Parcelle) => {
    setParcelleSelectionnee(parcelle);
    console.log('📍 Parcelle sélectionnée:', parcelle.nom);
  };

  // Gérer l'ajout d'une nouvelle parcelle (amélioré avec API)
  const handleNouvelleParcelleTraitee = async () => {
    setNouvelleParcelle(null);
    setShowWelcomeMessage(false);
    setForceUpdate(prev => !prev);
    
    // Recharger les données (API + localStorage)
    await chargerStatistiques();
  };

  // Gérer le retour au formulaire
  const handleReturnToForm = () => {
    navigate('/DashboardE');
    console.log('🔄 Retour au formulaire demandé');
  };

  // Basculer l'expansion du panneau gauche
  const toggleLeftPanel = () => {
    setIsLeftPanelExpanded(!isLeftPanelExpanded);
    if (isRightPanelExpanded) {
      setIsRightPanelExpanded(false);
    }
  };

  // Basculer l'expansion du panneau droit
  const toggleRightPanel = () => {
    setIsRightPanelExpanded(!isRightPanelExpanded);
    if (isLeftPanelExpanded) {
      setIsLeftPanelExpanded(false);
    }
  };

  // Obtenir les classes CSS pour les panneaux
  const getLeftPanelClass = () => {
    if (isLeftPanelExpanded) return 'dashboard-left-panel expanded';
    if (isRightPanelExpanded) return 'dashboard-left-panel collapsed';
    return 'dashboard-left-panel';
  };

  const getRightPanelClass = () => {
    if (isRightPanelExpanded) return 'dashboard-right-panel expanded';
    if (isLeftPanelExpanded) return 'dashboard-right-panel collapsed';
    return 'dashboard-right-panel';
  };

  // ==================== NOUVELLES FONCTIONS POUR LES BOUTONS ====================

  // Synchroniser les données (bouton TrendingUp)
  const synchroniserDonnees = async () => {
    console.log('🔄 Synchronisation des données...');
    await chargerStatistiques();
  };

  // Actualiser la vue (bouton BarChart3)
  const actualiserVue = async () => {
    console.log('🔄 Actualisation de la vue...');
    setForceUpdate(prev => !prev);
    await chargerStatistiques();
  };

  return (
    <div className="dashboard-container-parcel">
      {/* Corps principal du dashboard */}
      <div className="dashboard-body">
        {/* Panneau gauche - Liste des parcelles */}
        <div className={getLeftPanelClass()}>
          <div className="panel-content">
            <ListeParcelle />
          </div>
        </div>

        {/* Panneau droit - Carte interactive */}
        <div className={getRightPanelClass()}>
          <div className="panel-content">
            <CarteInteractive
              parcellesFiltrees={parcellesFiltrees}
              onParcelleClick={handleParcelleClick}
              nouvelleParcelle={nouvelleParcelle}
              onNouvelleParcelleTraitee={handleNouvelleParcelleTraitee}
              forceUpdate={forceUpdate}
              showWelcomeMessage={showWelcomeMessage}
              onReturnToForm={(handleReturnToForm)}
            />
          </div>
        </div>
      </div>

      {/* Boutons flottants pour actions rapides */}
      {/* <div className="dashboard-floating-actions">
        <button 
          className="floating-action-btn primary"
          onClick={synchroniserDonnees}
          title="Synchronize data with the API"
        >
          <TrendingUp size={20} />
        </button>
        
        <button 
          className="floating-action-btn secondary"
          onClick={actualiserVue}
          title="Reload view"
        >
          <BarChart3 size={20} />
        </button>
      </div> */}

      {/* Overlay pour les modes expanded */}
      {(isLeftPanelExpanded || isRightPanelExpanded) && (
        <div 
          className="dashboard-overlay"
          onClick={() => {
            setIsLeftPanelExpanded(false);
            setIsRightPanelExpanded(false);
          }}
        />
      )}

      {/* Indicateur de statut API (en bas à droite) */}
      <div className="api-status-indicator" style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        borderRadius: '20px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        📊 {stats.totalParcelles} parcelles • 
        🌾 {stats.totalSurface} ha • 
        💰 {stats.totalInvestissement.toLocaleString()} €
      </div>
    </div>
  );
};

export default DashboardParcelle;