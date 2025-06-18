import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './formulaireParcelle.css';

// Interface pour étendre HTMLDivElement avec les propriétés Leaflet
interface LeafletHTMLElement extends HTMLDivElement {
  _leaflet_id?: number;
}

// Interface pour les données de parcelle à envoyer
interface ParcelleData {
  id: number;
  nom: string;
  culture: string;
  statut: 'active' | 'repos' | 'preparation';
  montantInvestissement: number;
  surfaceTotale: number;
  farmerId: string;
  dateCreation: string;
  latitude: number;
  longitude: number;
  superficie: string;
  type: string;
  drawnParcels: any[];
  coordonnees?: any;
  formeType?: string;
}

// ✨ NOUVELLE INTERFACE pour les données d'édition
interface ParcelleEditData {
  id: number;
  nom: string;
  surface: number;
  culture: string;
  statut: 'active' | 'repos' | 'preparation';
}

// Interface mise à jour avec support édition et navigation
interface FormulaireParcelleProps {
  onSubmit?: (parcelleData: ParcelleData) => void;
  onClose?: () => void;
  farmerId: string;
  onNavigateToCarteInteractive?: (parcelleData: ParcelleData) => void;
  useInternalNavigation?: boolean;
  // ✨ NOUVELLES PROPS pour l'édition
  editingParcelle?: ParcelleEditData | null;
  isEditMode?: boolean;
  // ✨ NOUVELLE PROP pour la navigation de retour
  onNavigateToListe?: () => void;
}

const FormulaireParcelle: React.FC<FormulaireParcelleProps> = ({ 
  onSubmit, 
  onClose, 
  farmerId,
  onNavigateToCarteInteractive,
  useInternalNavigation = false,
  editingParcelle = null,
  isEditMode = false,
  onNavigateToListe
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const formSectionRefs = useRef<HTMLDivElement[]>([]);
  const mapRef = useRef<LeafletHTMLElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [map, setMap] = useState<any>(null);
  const [drawnItems, setDrawnItems] = useState<any>(null);
  const [parcellesDessinees, setParcellesDessinees] = useState<any[]>([]);
  const [selectedCulture, setSelectedCulture] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [drawControlRef, setDrawControlRef] = useState<any>(null);

  // États pour les champs du formulaire
  const [titreParcelle, setTitreParcelle] = useState('');
  const [statutParcelle, setStatutParcelle] = useState<'active' | 'repos' | 'preparation' | ''>('');
  const [montantInvestissement, setMontantInvestissement] = useState<number | string>('');

  // État pour les coordonnées centrales calculées
  const [coordonneesCentrales, setCoordonneseActuelles] = useState<{lat: number, lng: number} | null>(null);

  // États pour la notification et navigation
  const [currentView, setCurrentView] = useState<'formulaire' | 'carte'>('formulaire');
  const [savedParcelles, setSavedParcelles] = useState<ParcelleData[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

  // ✨ NOUVEAU: Détection des données d'édition depuis localStorage ou props
  const [parcelleAEditer, setParcelleAEditer] = useState<any>(null);
  const [modeEdition, setModeEdition] = useState(false);

  // ✨ NOUVELLE FONCTION: Naviguer vers la liste des parcelles
  const navigateToListe = () => {
    setIsNavigating(true);
    console.log('📋 Navigation vers la liste des parcelles...');
    
    showToast('📋 Returning to the list of plots...', 2000);
    
    setTimeout(() => {
      if (onNavigateToListe) {
        // Utiliser la fonction de navigation fournie par le parent
        onNavigateToListe();
      } else {
        // Navigation par défaut vers la route de la liste
        navigate('/listeparcelle');
      }
      setIsNavigating(false);
    }, 800);
  };

  // ✨ EFFET pour détecter les données d'édition
  useEffect(() => {
    console.log('🔍 Vérification des données d\'édition...');
    
    // 1. Vérifier les props directement
    if (editingParcelle && isEditMode) {
      console.log('📝 Mode édition via PROPS:', editingParcelle);
      setParcelleAEditer(editingParcelle);
      setModeEdition(true);
      return;
    }

    // 2. Vérifier localStorage
    try {
      const modeEditionLS = localStorage.getItem('modeEdition');
      const parcelleLS = localStorage.getItem('parcelleAEditer');
      
      if (modeEditionLS === 'true' && parcelleLS) {
        const donneesParcelle = JSON.parse(parcelleLS);
        console.log('📝 Mode édition via LOCALSTORAGE:', donneesParcelle);
        setParcelleAEditer(donneesParcelle);
        setModeEdition(true);
        
        // Nettoyer localStorage après récupération
        localStorage.removeItem('modeEdition');
        localStorage.removeItem('parcelleAEditer');
        return;
      }
    } catch (error) {
      console.error('❌ Erreur lecture localStorage édition:', error);
    }

    // 3. Vérifier location.state
    const stateData = location.state;
    if (stateData?.parcelleAEditer && stateData?.modeEdition) {
      console.log('📝 Mode édition via ROUTER STATE:', stateData.parcelleAEditer);
      setParcelleAEditer(stateData.parcelleAEditer);
      setModeEdition(true);
      return;
    }

    console.log('📝 Mode création normale');
    setModeEdition(false);
    setParcelleAEditer(null);
  }, [editingParcelle, isEditMode, location.state]);

  // ✨ EFFET pour pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (modeEdition && parcelleAEditer) {
      console.log('🔧 PRÉ-REMPLISSAGE du formulaire avec:', parcelleAEditer);
      
      // Pré-remplir selon la source des données
      if (parcelleAEditer.nom) {
        setTitreParcelle(parcelleAEditer.nom);
      }
      
      if (parcelleAEditer.culture) {
        setSelectedCulture(parcelleAEditer.culture);
      }
      
      if (parcelleAEditer.statut) {
        setStatutParcelle(parcelleAEditer.statut);
      }
      
      if (parcelleAEditer.montantInvestissement) {
        setMontantInvestissement(parcelleAEditer.montantInvestissement);
      }

      // Si c'est des données complètes du localStorage
      if (parcelleAEditer.drawnParcels && parcelleAEditer.drawnParcels.length > 0) {
        console.log('🎨 Restauration des parcelles dessinées');
        // TODO: Restaurer les formes sur la carte
      }

      // Si c'est des données simples de la liste
      if (parcelleAEditer.surface) {
        // Créer une parcelle dessinée simple pour représenter la surface
        const parcelleSimple = {
          id: parcelleAEditer.id,
          type: 'rectangle',
          area: parcelleAEditer.surface * 10000, // Convertir ha en m²
          perimeter: Math.sqrt(parcelleAEditer.surface * 10000) * 4, // Approximation rectangle
          culture: parcelleAEditer.culture,
          statut: parcelleAEditer.statut,
          colors: getCultureColor(parcelleAEditer.culture)
        };
        setParcellesDessinees([parcelleSimple]);
      }

      console.log('✅ Formulaire pré-rempli en mode édition');
    }
  }, [modeEdition, parcelleAEditer]);

  // Fonction améliorée pour obtenir la couleur selon la culture
  const getCultureColor = (culture: string) => {
    switch (culture) {
      case 'Tomate':
        return {
          color: '#dc2626',
          fillColor: '#ef4444',
          fillOpacity: 0.6,
          weight: 3
        };
      case 'Piment':
        return {
          color: '#dc2626',
          fillColor: '#f87171',
          fillOpacity: 0.6,
          weight: 3
        };
      case 'Poivron':
        return {
          color: '#059669',
          fillColor: '#10b981',
          fillOpacity: 0.6,
          weight: 3
        };
      default:
        return {
          color: '#6b7280',
          fillColor: '#9ca3af',
          fillOpacity: 0.5,
          weight: 3
        };
    }
  };

  // Fonction améliorée pour obtenir le marqueur selon le statut
  const getStatusMarker = (statut: string) => {
    switch (statut) {
      case 'repos':
        return {
          icon: '😴',
          color: '#f59e0b',
          bgColor: '#fef3c7',
          borderColor: '#d97706',
          className: 'status-marker-repos',
          label: 'Au repos'
        };
      case 'preparation':
        return {
          icon: '🚧',
          color: '#3b82f6',
          bgColor: '#dbeafe',
          borderColor: '#1d4ed8',
          className: 'status-marker-preparation',
          label: 'En préparation'
        };
      case 'active':
        return {
          icon: '✅',
          color: '#10b981',
          bgColor: '#d1fae5',
          borderColor: '#047857',
          className: 'status-marker-active',
          label: 'Active'
        };
      default:
        return {
          icon: '📍',
          color: '#6b7280',
          bgColor: '#f3f4f6',
          borderColor: '#4b5563',
          className: 'status-marker-default',
          label: 'Non défini'
        };
    }
  };

  // FONCTION POUR AFFICHER NOTIFICATION TOAST
  const showToast = (message: string, duration = 3000) => {
    setNotificationMessage(message);
    setShowNotification(true);
    
    setTimeout(() => {
      setShowNotification(false);
    }, duration);
  };

  // Lieux populaires en Tunisie
  const tunisianPlaces = [
    { name: 'Nabeul', lat: 36.4562, lng: 10.7376, region: 'Nabeul' },
    { name: 'Kelibia', lat: 36.8469, lng: 11.0935, region: 'Nabeul' },
    { name: 'Hammamet', lat: 36.4000, lng: 10.6167, region: 'Nabeul' },
    { name: 'Sousse', lat: 35.8256, lng: 10.6369, region: 'Sousse' },
    { name: 'Monastir', lat: 35.7774, lng: 10.8261, region: 'Monastir' },
    { name: 'Mahdia', lat: 35.5047, lng: 11.0622, region: 'Mahdia' },
    { name: 'Sfax', lat: 34.7406, lng: 10.7603, region: 'Sfax' },
    { name: 'Kairouan', lat: 35.6781, lng: 10.0963, region: 'Kairouan' },
    { name: 'Bizerte', lat: 37.2746, lng: 9.8739, region: 'Bizerte' },
    { name: 'Tunis', lat: 36.8065, lng: 10.1815, region: 'Tunis' },
  ];

  // Cultures avec leurs icônes
  const cultures = [
    { value: 'Poivron', label: '🫑 Poivron', icon: '🫑' },
    { value: 'Tomate', label: '🍅 Tomate', icon: '🍅' },
    { value: 'Piment', label: '🌶️ Piment', icon: '🌶️' },
  ];

  // Fonction de normalisation pour la recherche
  const normalizeString = (str: string): string => {
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '');
  };

  // Fonction de recherche améliorée
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const normalizedQuery = normalizeString(query);
    
    const filtered = tunisianPlaces.filter(place => {
      const normalizedName = normalizeString(place.name);
      const normalizedRegion = normalizeString(place.region);
      
      return normalizedName.includes(normalizedQuery) || normalizedRegion.includes(normalizedQuery);
    });

    setSearchResults(filtered.slice(0, 8));
    setShowResults(true);
  };

  // Naviguer vers un lieu
  const goToPlace = (place: any) => {
    if (!map) {
      console.warn('Carte non initialisée');
      return;
    }

    try {
      if (mapInstanceRef.current && mapInstanceRef.current.setView) {
        mapInstanceRef.current.setView([place.lat, place.lng], 15);
        setSearchQuery(place.name);
        setShowResults(false);
        
        const L = (window as any).L;
        if (L && L.marker) {
          const marker = L.marker([place.lat, place.lng])
            .addTo(mapInstanceRef.current)
            .bindPopup(`📍 ${place.name}<br/>Gouvernorat de ${place.region}`)
            .openPopup();
          
          setTimeout(() => {
            if (mapInstanceRef.current && marker) {
              mapInstanceRef.current.removeLayer(marker);
            }
          }, 5000);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la navigation:', error);
    }
  };

  // Fonction pour calculer les coordonnées centrales des parcelles dessinées
  const calculerCoordonneesCentrales = () => {
    if (parcellesDessinees.length === 0) {
      return null;
    }

    // Pour le mode édition avec données simples, utiliser des coordonnées par défaut
    if (modeEdition && parcellesDessinees.length === 1 && !parcellesDessinees[0].coords) {
      return {
        lat: 35.8, // Centre de la Tunisie
        lng: 10.2
      };
    }

    let totalLat = 0;
    let totalLng = 0;
    let count = 0;

    parcellesDessinees.forEach(parcelle => {
      if (parcelle.type === 'circle' && parcelle.coords) {
        totalLat += parcelle.coords.lat;
        totalLng += parcelle.coords.lng;
        count++;
      } else if ((parcelle.type === 'polygon' || parcelle.type === 'rectangle') && parcelle.layer) {
        try {
          const bounds = parcelle.layer.getBounds();
          const center = bounds.getCenter();
          totalLat += center.lat;
          totalLng += center.lng;
          count++;
        } catch (error) {
          console.warn('Erreur lors du calcul du centre pour parcelle:', error);
        }
      }
    });

    if (count === 0) {
      return {
        lat: 35.8,
        lng: 10.2
      };
    }

    return {
      lat: totalLat / count,
      lng: totalLng / count
    };
  };

  // NAVIGATION CORRIGÉE
  const navigateToCarteInteractive = (parcelleData?: ParcelleData) => {
    setIsNavigating(true);
    console.log('🗺️ Navigation avec sauvegarde des données:', parcelleData);
    
    if (parcelleData) {
      try {
        const existingParcelles = JSON.parse(localStorage.getItem('parcellesEnregistrees') || '[]');
        
        if (modeEdition && parcelleAEditer) {
          // Mode édition : remplacer la parcelle existante
          const updatedParcelles = existingParcelles.map((p: any) => 
            p.id === parcelleAEditer.id ? parcelleData : p
          );
          localStorage.setItem('parcellesEnregistrees', JSON.stringify(updatedParcelles));
          console.log('✏️ Parcelle mise à jour dans localStorage');
        } else {
          // Mode création : ajouter nouvelle parcelle
          const newParcelles = [...existingParcelles, parcelleData];
          localStorage.setItem('parcellesEnregistrees', JSON.stringify(newParcelles));
          console.log('➕ Nouvelle parcelle ajoutée dans localStorage');
        }
        
        localStorage.setItem('derniereParcelle', JSON.stringify(parcelleData));
        localStorage.setItem('navigationFromFormulaire', 'true');
        
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
      }
    }
    
    if (useInternalNavigation) {
      showToast('🗺️ Opening the interactive map...', 2000);
      setTimeout(() => {
        setCurrentView('carte');
        setIsNavigating(false);
      }, 500);
    } else {
      const message = modeEdition ? '🔧 Changes saved! Redirecting to the map...' : '🗺️ Redirecting to the interactive map...';
      showToast(message, 2000);
      
      setTimeout(() => {
        if (onNavigateToCarteInteractive && parcelleData) {
          onNavigateToCarteInteractive(parcelleData);
        } else {
          window.location.href = '/carte-interactive';
        }
        setIsNavigating(false);
      }, 800);
    }
  };

  // RETOUR AU FORMULAIRE
  const retourAuFormulaire = () => {
    showToast('📝 Return to the main dashboard', 1500);
    setCurrentView('formulaire');
  };

  // Fonction pour mettre à jour les couleurs des outils de dessin
  const updateDrawControlColors = () => {
    if (!mapInstanceRef.current || !drawnItems) {
      return;
    }

    const L = (window as any).L;
    if (!L || !L.Control.Draw) {
      return;
    }

    if (drawControlRef && mapInstanceRef.current) {
      try {
        mapInstanceRef.current.removeControl(drawControlRef);
      } catch (error) {
        console.warn('Erreur lors de la suppression du contrôle:', error);
      }
    }

    const cultureColors = getCultureColor(selectedCulture);

    const newDrawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#ff0000',
            message: '<strong>Error:</strong> Lines cannot cross each other!'
          },
          shapeOptions: {
            ...cultureColors,
            dashArray: '5, 5'
          },
          showArea: true,
          showLength: true,
          metric: true
        },
        rectangle: {
          shapeOptions: {
            ...cultureColors,
            dashArray: '5, 5'
          },
          showArea: true,
          metric: true
        },
        circle: {
          shapeOptions: cultureColors,
          showRadius: true,
          metric: true
        },
        marker: {
          icon: L.divIcon({
            html: '🚜',
            iconSize: [25, 25],
            className: 'custom-div-icon'
          })
        },
        circlemarker: false,
        polyline: {
          shapeOptions: {
            color: cultureColors.color,
            weight: 4,
            dashArray: '10, 5'
          }
        }
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
        edit: true
      }
    });

    try {
      mapInstanceRef.current.addControl(newDrawControl);
      setDrawControlRef(newDrawControl);
    } catch (error) {
      console.error('Error while adding the new control', error);
    }
  };

  // Fonction pour créer un marqueur de statut amélioré
  const createStatusMarker = (center: any, currentStatut: string) => {
    if (!currentStatut || !center) return null;

    const L = (window as any).L;
    if (!L) return null;

    const statusInfo = getStatusMarker(currentStatut);
    
    try {
      const statusIcon = L.divIcon({
        html: `<div style="
          background: linear-gradient(135deg, ${statusInfo.color} 0%, ${statusInfo.borderColor} 100%); 
          color: white; 
          border-radius: 50%; 
          width: 45px; 
          height: 45px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 22px; 
          font-weight: bold;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          z-index: 10000 !important;
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${statusInfo.icon}</div>`,
        iconSize: [45, 45],
        iconAnchor: [22.5, 22.5],
        className: statusInfo.className
      });

      const marker = L.marker(center, { 
        icon: statusIcon,
        zIndexOffset: 1000
      });

      marker.bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <strong style="color: ${statusInfo.color};">${statusInfo.icon} ${statusInfo.label}</strong>
          <br/>
          <small>Statut de la parcelle</small>
        </div>
      `);
      
      return marker;
    } catch (error) {
      console.error('Error while creating the status marker:', error);
      return null;
    }
  };

  // Effet pour mettre à jour les couleurs quand la culture change
  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current && drawnItems && selectedCulture) {
      updateDrawControlColors();
    }
  }, [selectedCulture, mapLoaded, drawnItems]);

  // Effet pour mettre à jour les coordonnées centrales quand les parcelles changent
  useEffect(() => {
    const coordonnees = calculerCoordonneesCentrales();
    setCoordonneseActuelles(coordonnees);
  }, [parcellesDessinees]);

  // Fermer les résultats quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowResults(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Initialisation de la carte
  useEffect(() => {
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          setTimeout(resolve, 50);
          return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          setTimeout(resolve, 50);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const loadLeaflet = async () => {
      try {
        if (!document.querySelector('link[href*="leaflet"]')) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
          document.head.appendChild(cssLink);
          
          await new Promise(resolve => {
            cssLink.onload = resolve;
            cssLink.onerror = resolve;
          });
        }

        if (!document.querySelector('link[href*="leaflet.draw"]')) {
          const drawCssLink = document.createElement('link');
          drawCssLink.rel = 'stylesheet';
          drawCssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css';
          document.head.appendChild(drawCssLink);
          
          await new Promise(resolve => {
            drawCssLink.onload = resolve;
            drawCssLink.onerror = resolve;
          });
        }

        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!(window as any).L) {
          throw new Error('Leaflet unavailable after loading');
        }

        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const L = (window as any).L;
        if (!L.Control.Draw) {
          throw new Error('Leaflet Draw unavailable after loading');
        }
        
        if (!isMapInitialized) {
          initMap();
        }
        
      } catch (error) {
        console.error('Error while loading Leaflet:', error);
      }
    };

    const initMap = () => {
      if (!mapRef.current || isMapInitialized) {
        return;
      }

      const L = (window as any).L;
      if (!L || !L.Control.Draw) {
        return;
      }

      try {
        const container = mapRef.current;

        if (container._leaflet_id) {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
          
          delete container._leaflet_id;
          container.innerHTML = '';
        }

        setIsMapInitialized(true);

        const mapInstance = L.map(mapRef.current, {
          center: [35.8, 10.2],
          zoom: 7,
          minZoom: 5,
          maxZoom: 20,
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true,
          touchZoom: true,
          boxZoom: true,
          keyboard: true
        });

        mapInstanceRef.current = mapInstance;

        const satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
          attribution: '&copy; Google Satellite',
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        });

        const labelsLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}', {
          attribution: '&copy; Google Labels',
          maxZoom: 20,
          opacity: 0.8
        });

        satelliteLayer.addTo(mapInstance);
        labelsLayer.addTo(mapInstance);

        const drawnItemsLayer = new L.FeatureGroup();
        mapInstance.addLayer(drawnItemsLayer);

        const defaultColors = getCultureColor(selectedCulture || 'default');

        const drawControl = new L.Control.Draw({
          position: 'topleft',
          draw: {
            polygon: {
              allowIntersection: false,
              shapeOptions: {
                ...defaultColors,
                dashArray: '5, 5'
              },
              showArea: true,
              showLength: true,
              metric: true
            },
            rectangle: {
              shapeOptions: {
                ...defaultColors,
                dashArray: '5, 5'
              },
              showArea: true,
              metric: true
            },
            circle: {
              shapeOptions: defaultColors,
              showRadius: true,
              metric: true
            },
            marker: false,
            circlemarker: false,
            polyline: false
          },
          edit: {
            featureGroup: drawnItemsLayer,
            remove: true,
            edit: true
          }
        });

        mapInstance.addControl(drawControl);
        setDrawControlRef(drawControl);

        // Événement création de forme
        mapInstance.on(L.Draw.Event.CREATED, (event: any) => {
          const layer = event.layer;
          const type = event.layerType;
          
          const cultureSelect = document.getElementById('culture-select') as HTMLSelectElement;
          const statutSelect = document.getElementById('statut-select') as HTMLSelectElement;
          
          const currentCulture = cultureSelect?.value || '';
          const currentStatut = statutSelect?.value || '';
          
          const cultureColors = getCultureColor(currentCulture);
          
          if (layer.setStyle) {
            layer.setStyle({
              ...cultureColors,
              opacity: 0.8
            });
          }
          
          let area = 0;
          let perimeter = 0;
          let center = null;
          
          if (type === 'polygon') {
            const coords = layer.getLatLngs()[0];
            for (let i = 0; i < coords.length; i++) {
              const next = (i + 1) % coords.length;
              perimeter += coords[i].distanceTo(coords[next]);
            }
            center = layer.getBounds().getCenter();
            area = L.GeometryUtil ? L.GeometryUtil.geodesicArea(coords) : perimeter * perimeter / 16;
          } else if (type === 'rectangle') {
            const bounds = layer.getBounds();
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const nw = L.latLng(ne.lat, sw.lng);
            const se = L.latLng(sw.lat, ne.lng);
            
            const width = ne.distanceTo(nw);
            const height = ne.distanceTo(se);
            area = width * height;
            perimeter = 2 * (width + height);
            center = bounds.getCenter();
          } else if (type === 'circle') {
            const radius = layer.getRadius();
            area = Math.PI * radius * radius;
            perimeter = 2 * Math.PI * radius;
            center = layer.getLatLng();
          }

          drawnItemsLayer.addLayer(layer);

          let statusMarker: any = null;
          if (currentStatut && center) {
            statusMarker = createStatusMarker(center, currentStatut);
            if (statusMarker && mapInstanceRef.current) {
              statusMarker.addTo(mapInstanceRef.current);
            }
          }

          const newParcelleDessinee = {
            id: Date.now(),
            type,
            area: Math.round(area),
            perimeter: Math.round(perimeter),
            layer,
            statusMarker,
            coords: type === 'polygon' || type === 'rectangle' ? layer.getLatLngs() : layer.getLatLng(),
            radius: type === 'circle' ? layer.getRadius() : undefined,
            culture: currentCulture,
            statut: currentStatut,
            colors: cultureColors
          };
          setParcellesDessinees(prev => [...prev, newParcelleDessinee]);
        });

        // Événement suppression
        mapInstance.on(L.Draw.Event.DELETED, (event: any) => {
          const layers = event.layers;
          layers.eachLayer((layer: any) => {
            const parcelle = parcellesDessinees.find(p => p.layer === layer);
            if (parcelle && parcelle.statusMarker) {
              mapInstance.removeLayer(parcelle.statusMarker);
            }
            setParcellesDessinees(prev => prev.filter(p => p.layer !== layer));
          });
        });

        setMap(mapInstance);
        setDrawnItems(drawnItemsLayer);
        setMapLoaded(true);
        
        console.log('✅ Carte initialisée avec succès');
      } catch (error) {
        console.error('❌ Error during map initialization:', error);
        setIsMapInitialized(false);
      }
    };

    loadLeaflet();

    // Animation d'entrée au scroll
    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    formSectionRefs.current.forEach((el: HTMLDivElement) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setIsMapInitialized(false);
    };
  }, []);

  const handleRippleEffect = (e: React.MouseEvent<HTMLElement>) => {
    const button = e.currentTarget as HTMLElement;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.6)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.pointerEvents = 'none';
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.remove();
      }
    }, 600);
  };

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !formSectionRefs.current.includes(el)) {
      formSectionRefs.current.push(el);
    }
  };

  const clearAllParcelles = () => {
    if (drawnItems && mapInstanceRef.current) {
      parcellesDessinees.forEach(parcelle => {
        if (parcelle.statusMarker) {
          mapInstanceRef.current.removeLayer(parcelle.statusMarker);
        }
      });
      
      drawnItems.clearLayers();
      setParcellesDessinees([]);
      showToast('🗑️ All plots deleted', 2000);
    }
  };

  const calculateTotalArea = () => {
    return parcellesDessinees.reduce((total, parcelle) => total + parcelle.area, 0);
  };

  // ✨ FONCTION PRINCIPALE CORRIGÉE - AVEC SUPPORT ÉDITION COMPLÈTE
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Début de soumission du formulaire...');
    console.log('🔧 Mode édition:', modeEdition);
    console.log('📝 Parcelle à éditer:', parcelleAEditer);
    
    // Validation des champs
    if (!titreParcelle.trim()) {
      showToast('⚠️ Please enter a title for the plot.', 3000);
      return;
    }
    if (!selectedCulture) {
      showToast('⚠️ Please select the type of crop', 3000);
      return;
    }
    if (!statutParcelle) {
      showToast('⚠️ Please select the status of the plot', 3000);
      return;
    }

    // En mode édition, permettre la soumission même sans parcelles dessinées
    const surfaceCalculee = calculateTotalArea();
    if (!modeEdition && parcellesDessinees.length === 0) {
      showToast('⚠️ Please draw at least one plot on the map', 3000);
      return;
    }

    // Calculer les coordonnées centrales finales
    const coordonneesFinales = calculerCoordonneesCentrales();
    
    if (!coordonneesFinales) {
      showToast('❌ Unable to calculate the central coordinates.', 3000);
      return;
    }

    // ✨ Préparer les données selon le mode (édition ou création)
    const parcelleData: ParcelleData = {
      id: modeEdition && parcelleAEditer ? parcelleAEditer.id : Date.now(),
      nom: titreParcelle,
      culture: selectedCulture,
      statut: statutParcelle,
      montantInvestissement: parseFloat(montantInvestissement as string) || 0,
      surfaceTotale: surfaceCalculee || (modeEdition && parcelleAEditer?.surface ? parcelleAEditer.surface * 10000 : 0),
      farmerId: farmerId,
      dateCreation: modeEdition && parcelleAEditer?.dateCreation ? parcelleAEditer.dateCreation : new Date().toISOString(),
      latitude: coordonneesFinales.lat,
      longitude: coordonneesFinales.lng,
      superficie: `${surfaceCalculee || (modeEdition && parcelleAEditer?.surface ? parcelleAEditer.surface * 10000 : 0)} m²`,
      type: 'Agricole',
      formeType: 'polygon',
      drawnParcels: parcellesDessinees.map(p => ({
        type: p.type,
        area: p.area,
        perimeter: p.perimeter,
        coords: p.coords,
        radius: p.radius,
        culture: p.culture,
        statut: p.statut,
        colors: p.colors
      })),
      coordonnees: {
        center: coordonneesFinales,
        shapes: parcellesDessinees.map(p => ({
          type: p.type,
          coords: p.coords,
          radius: p.radius
        }))
      }
    };

    console.log('📤 Données COMPLETES de parcelle préparées:', parcelleData);
    
    // Sauvegarder dans la liste locale du composant
    setSavedParcelles(prev => [...prev, parcelleData]);
    
    // Appeler la fonction parent si elle existe
    if (onSubmit) {
      console.log('📡 Appel de onSubmit...');
      onSubmit(parcelleData);
    }
    
    // Messages de succès selon le mode
    const messageSucces = modeEdition 
      ? `✅ Parcel "${titreParcelle}" modified successfully!`
      : `✅ Parcel "${titreParcelle}" saved successfully!`;
    
    showToast(messageSucces, 2000);
    
    // Navigation automatique avec données complètes
    console.log('🎯 Début navigation automatique avec données complètes...');
    setTimeout(() => {
      console.log('⏰ Navigation vers CarteInteractive avec données:', parcelleData);
      navigateToCarteInteractive(parcelleData);
    }, 1200);
  };

  // COMPOSANT DE CARTE INTERACTIVE SIMPLE
  const CarteInteractiveSimple = () => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2 style={{ color: '#28a745', marginBottom: '20px' }}>
        🗺️ Carte Interactive - {savedParcelles.length} parcelle(s)
      </h2>
      
      <button
        onClick={retourAuFormulaire}
        style={{
          padding: '12px 24px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          marginBottom: '20px',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = '#0056b3'}
        onMouseOut={(e) => e.currentTarget.style.background = '#007bff'}
      >
        📝 Retour au Formulaire
      </button>

      {savedParcelles.length > 0 && (
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'left',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h3 style={{ marginBottom: '16px', color: '#495057' }}>📊 Parcelles Créées :</h3>
          {savedParcelles.map((parcelle, index) => (
            <div key={parcelle.id} style={{
              padding: '16px',
              margin: '8px 0',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              borderLeft: '4px solid #28a745'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#28a745' }}>
                {parcelle.nom}
              </h4>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                <div><strong>Crop:</strong> {parcelle.culture}</div>
                <div><strong>Status:</strong> {parcelle.statut}</div>
                <div><strong>Surface area:</strong> {parcelle.surfaceTotale} m²</div>
                <div><strong>Coordinates:</strong> {parcelle.latitude.toFixed(4)}, {parcelle.longitude.toFixed(4)}</div>
                <div><strong>Drawn shapes:</strong> {parcelle.drawnParcels.length}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <p style={{ marginTop: '20px', color: '#6c757d' }}>
        💡 Here you can embed your custom InteractiveMap component.
      </p>
    </div>
  );

  // COMPOSANT TOAST NOTIFICATION
  const ToastNotification = () => {
    if (!showNotification) return null;

    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'slideInRight 0.3s ease-out',
        fontWeight: '600',
        fontSize: '14px',
        maxWidth: '400px'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          ✓
        </div>
        {notificationMessage}
      </div>
    );
  };

  // RENDU CONDITIONNEL
  if (currentView === 'carte') {
    return (
      <>
        <CarteInteractiveSimple />
        <ToastNotification />
      </>
    );
  }

  // RENDU DU FORMULAIRE AVEC INDICATEUR DE MODE ET BOUTON RETOUR
  return (
    <>
      <div className="form-container">
        {/* ✨ NOUVELLE SECTION - BARRE DE NAVIGATION */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '12px',
          border: '1px solid #dee2e6',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          {/* Bouton de retour vers la liste */}
          <button
            onClick={navigateToListe}
            disabled={isNavigating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isNavigating ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              opacity: isNavigating ? 0.7 : 1,
              boxShadow: '0 2px 8px rgba(108, 117, 125, 0.3)'
            }}
            onMouseOver={(e) => {
              if (!isNavigating) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!isNavigating) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(108, 117, 125, 0.3)';
              }
            }}
            onMouseDown={handleRippleEffect}
          >
            <span style={{ fontSize: '16px' }}>📋</span>
            <span>Back to the List</span>
            {isNavigating && (
              <span style={{ 
                width: '16px', 
                height: '16px', 
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></span>
            )}
          </button>

          {/* Titre central */}
          <h1 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '700',
            color: '#495057',
            textAlign: 'center',
            flex: 1
          }}>
            {modeEdition ? '✏️ Edit Plot' : '➕ New Plot'}

          </h1>

          {/* Espace pour équilibrer */}
          <div style={{ width: '140px' }}></div>
        </div>

        {/* ✨ INDICATEUR DE MODE ÉDITION */}
        {modeEdition && (
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}>
              ✏️
            </div>
            <div>
              <div style={{ fontSize: '16px', marginBottom: '2px' }}>
                Edit Mode Enabled
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                Plot modification : {parcelleAEditer?.nom || 'Selected plot'}
              </div>
            </div>
          </div>
        )}

        <div className="form-section-parcel" ref={addToRefs}>
          <h2 className="section-title">
            🇹🇳 {modeEdition ? 'Modifier' : 'Créer'} Agricultural Plot - Tunisia
          </h2>

          <div className="form-group">
            <label className="form-label">📝 Plot Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="Nom de votre parcelle"
              value={titreParcelle}
              onChange={(e) => setTitreParcelle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">🌾 Crop</label>
            <select 
              id="culture-select"
              className={`culture-select ${selectedCulture ? 'with-icon' : ''}`}
              value={selectedCulture}
              onChange={(e) => {
                setSelectedCulture(e.target.value);
                console.log('🌾 Culture sélectionnée:', e.target.value);
              }}
            >
              <option value="">🌱 Select the type of crop</option>
              {cultures.map((culture) => (
                <option key={culture.value} value={culture.value}>
                  {culture.label}
                </option>
              ))}
            </select>
            {selectedCulture && (
              <div className="culture-icon">
                {cultures.find(c => c.value === selectedCulture)?.icon}
              </div>
            )}
            {selectedCulture && (
              <div style={{ 
                marginTop: '8px', 
                padding: '8px 12px', 
                borderRadius: '8px', 
                background: getCultureColor(selectedCulture).fillColor + '30',
                border: `2px solid ${getCultureColor(selectedCulture).color}`,
                fontSize: '12px',
                fontWeight: '600',
                color: getCultureColor(selectedCulture).color
              }}>
                ✨ The plots will be colored in {selectedCulture === 'Tomate' || selectedCulture === 'Piment' ? 'rouge' : 'vert'}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">📊 Status</label>
            <select 
              id="statut-select"
              className="form-input"
              value={statutParcelle}
              onChange={(e) => {
                setStatutParcelle(e.target.value as 'active' | 'repos' | 'preparation');
                console.log('📊 Statut sélectionné:', e.target.value);
              }}
            >
              <option value="">📈 Select the status</option>
              <option value="active">✅ Active</option>
              <option value="preparation">🚧 In preparation</option>
              <option value="repos">😴 At rest</option>
            </select>
            {statutParcelle && (
              <div style={{ 
                marginTop: '8px', 
                padding: '8px 12px', 
                borderRadius: '8px', 
                background: getStatusMarker(statutParcelle).color + '20',
                border: `2px solid ${getStatusMarker(statutParcelle).color}`,
                fontSize: '12px',
                fontWeight: '600',
                color: getStatusMarker(statutParcelle).color,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {getStatusMarker(statutParcelle).icon} A marker "{getStatusMarker(statutParcelle).label}" will be added to the center of the plots
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">📐 Area (m²)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="Superficie en mètres carrés" 
              min="0" 
              step="0.01"
              value={calculateTotalArea() || (modeEdition && parcelleAEditer?.surface ? parcelleAEditer.surface * 10000 : '')}
              readOnly
              style={{
                background: '#f8f9fa',
                color: '#495057',
                fontWeight: '600'
              }}
            />
            {modeEdition && parcelleAEditer?.surface && calculateTotalArea() === 0 && (
              <div style={{
                marginTop: '6px',
                fontSize: '11px',
                color: '#f59e0b',
                fontWeight: '600'
              }}>
                📏 Current area: {parcelleAEditer.surface} ha ({(parcelleAEditer.surface * 10000).toFixed(0)} m²)
              </div>
            )}
          </div>

          {coordonneesCentrales && (
            <div className="form-group">
              <label className="form-label">🎯 Central Coordinates</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px'
              }}>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Latitude" 
                  value={coordonneesCentrales.lat.toFixed(6)}
                  readOnly
                  style={{
                    background: '#e3f2fd',
                    color: '#1565c0',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                />
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Longitude" 
                  value={coordonneesCentrales.lng.toFixed(6)}
                  readOnly
                  style={{
                    background: '#e8f5e8',
                    color: '#2e7d32',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                />
              </div>
              <div style={{ 
                marginTop: '6px', 
                fontSize: '11px', 
                color: '#6b7280',
                textAlign: 'center'
              }}>
                📍 Position automatically calculated from the drawn plots
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">💰 Investment Amount (TND)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="Montant investi en dinars tunisiens" 
              min="0" 
              step="0.01"
              value={montantInvestissement}
              onChange={(e) => setMontantInvestissement(parseFloat(e.target.value))}
            />
          </div>

          <button 
            className="submit-btn-parcel" 
            onClick={(e) => { 
              handleRippleEffect(e); 
              handleFormSubmit(e); 
            }}
            disabled={isNavigating}
            style={{
              opacity: isNavigating ? 0.7 : 1,
              cursor: isNavigating ? 'not-allowed' : 'pointer'
            }}
          >
            <div className="submit-btn-content">
              <span className="submit-btn-badge">
                {isNavigating 
                  ? '⏳ ENREGISTREMENT...' 
                  : modeEdition 
                    ? '🔧 MODIFIER ET VOIR SUR CARTE'
                    : '✅ ENREGISTRER ET VOIR SUR CARTE'
                }
              </span>
            </div>
          </button>

          {(parcellesDessinees.length > 0 || (modeEdition && parcelleAEditer)) && (
            <div className="stats-card">
              <h4 className="stats-title">📊 Statistics</h4>
              <p className="stats-item">
                <strong>Plot created</strong> {parcellesDessinees.length || 'Données existantes'}
              </p>
              <p className="stats-item">
                <strong>Total area</strong> {
                  calculateTotalArea() > 0 
                    ? `${calculateTotalArea()} m² (${(calculateTotalArea()/10000).toFixed(3)} ha)`
                    : modeEdition && parcelleAEditer?.surface 
                      ? `${(parcelleAEditer.surface * 10000).toFixed(0)} m² (${parcelleAEditer.surface} ha)`
                      : 'Non calculée'
                }
              </p>
              {coordonneesCentrales && (
                <p className="stats-item">
                  <strong>Central coordinates:</strong> {coordonneesCentrales.lat.toFixed(4)}, {coordonneesCentrales.lng.toFixed(4)}
                </p>
              )}
              <div style={{ marginTop: '12px' }}>
                {parcellesDessinees.map((parcelle, index) => {
                  const cultureIcon = cultures.find(c => c.value === parcelle.culture)?.icon || '🌱';
                  const statusInfo = getStatusMarker(parcelle.statut);
                  return (
                    <div key={parcelle.id} style={{
                      padding: '8px 12px',
                      margin: '4px 0',
                      borderRadius: '6px',
                      background: parcelle.colors?.fillColor + '20' || '#f8f9fa',
                      border: `1px solid ${parcelle.colors?.color || '#dee2e6'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px'
                    }}>
                      <span>
                        {cultureIcon} {parcelle.culture || 'Non définie'} 
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                      <span style={{ fontWeight: '600', color: parcelle.colors?.color || '#6c757d' }}>
                        {parcelle.area} m²
                      </span>
                    </div>
                  );
                })}
              </div>
              <button 
                className="clear-btn" 
                onClick={clearAllParcelles}
                onMouseDown={handleRippleEffect}
              >
                🗑️ Delete all plots
              </button>
            </div>
          )}
        </div>

        <div className="form-section-parcel" ref={addToRefs}>
          <h2 className="section-title">
            🗺️ Interactive Map of Tunisia
          </h2>
          
          <div className="form-group">
            <label className="form-label">🔍 Search for a place in Tunisia</label>
            <div className="search-container">
              <div className='search-line'>
                <div className='input-wrapper'>
                  <input 
                    type="text" 
                    className="search-input-parcel" 
                    placeholder="Tapez le nom d'une ville (ex: Nabeul, Kelibia, Sousse...)" 
                    value={searchQuery} 
                    onChange={(e) => handleSearch(e.target.value)} 
                    onFocus={() => {
                      if (searchResults.length > 0 && searchQuery.length >= 2) {
                        setShowResults(true);
                      }
                    }}
                  />
                </div>
              </div>
              
              {showResults && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((place, index) => (
                    <div 
                      key={`${place.name}-${index}`}
                      className="search-result-item"
                      onClick={() => goToPlace(place)}
                    >
                      <div className="search-result-name">{place.name}</div>
                      <div className="search-result-region">Governorate of {place.region}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {showResults && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="search-results">
                  <div className="search-result-item" style={{ cursor: 'default', opacity: 0.7 }}>
                    <div className="search-result-name">No results found</div>
                    <div className="search-result-region">For "{searchQuery}"</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Légende des couleurs et statuts */}
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#495057' }}>
              🎨 Legend of colors and statuses
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <div style={{ width: '20px', height: '20px', background: '#ef4444', borderRadius: '4px', border: '2px solid #dc2626' }}></div>
                🍅🌶️ Tomato / Chili Pepper
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <div style={{ width: '20px', height: '20px', background: '#10b981', borderRadius: '4px', border: '2px solid #059669' }}></div>
                🫑 Paprika
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <div style={{ width: '20px', height: '20px', background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
                Active
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <div style={{ width: '20px', height: '20px', background: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>😴</div>
                Resting
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <div style={{ width: '20px', height: '20px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🚧</div>
                In preparation
              </div>
            </div>
          </div>
          
          <div className="map-controls">
            <button className="clear-btn" onClick={clearAllParcelles}>
              🗑️ Delete plot
            </button>
            <button className="refresh-btn" onClick={() => window.location.reload()}>
              🔄 Refresh
            </button>
          </div>
          
          <div className="map-container">
            <div ref={mapRef} className="map-element">
              {!mapLoaded && (
                <div className="map-placeholder">
                  🗺️ Loading the satellite map of Tunisia...
                  <br />
                  <small className="map-placeholder-text">
                    Interactive map with satellite imagery and crop-specific color coding.
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <ToastNotification />

      {/* ✨ NOUVEAU: Styles CSS pour l'animation de rotation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        
        .submit-btn-parcel:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
        }
        
        .clear-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }
        
        .refresh-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
        }
      `}</style>
    </>
  );
}; 

export default FormulaireParcelle;