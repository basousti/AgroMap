import React, { useEffect, useRef, useState } from 'react';

// Interface pour étendre HTMLDivElement avec les propriétés Leaflet
interface LeafletHTMLElement extends HTMLDivElement {
  _leaflet_id?: number;
}

// Interface pour les données de parcelle à envoyer
interface ParcelleData {
  _id?: string;
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

interface ParcelleEditData {
  id: string;
  nom: string;
  superficie: number;
  culture: string;
  statut: 'active' | 'repos' | 'preparation';
  montantInvestissement?: number;
}

interface FormulaireParcelleProps {
  onSubmit?: (parcelleData: ParcelleData) => void;
  onClose?: () => void;
  farmerId: string;
  onNavigateToCarteInteractive?: (parcelleData: ParcelleData) => void;
  useInternalNavigation?: boolean;
  editingParcelle?: ParcelleEditData | null;
  isEditMode?: boolean;
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
  const [isSearching, setIsSearching] = useState(false);

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

  // Détection des données d'édition
  const [parcelleAEditer, setParcelleAEditer] = useState<any>(null);
  const [modeEdition, setModeEdition] = useState(false);

  // Base de données complète des lieux tunisiens avec coordonnées réelles
  const tunisianPlaces = [
    // Gouvernorat de Nabeul
    { name: 'Nabeul', lat: 36.4562, lng: 10.7376, region: 'Nabeul', type: 'ville' },
    { name: 'Kelibia', lat: 36.8469, lng: 11.0935, region: 'Nabeul', type: 'ville' },
    { name: 'Korba', lat: 36.5789, lng: 10.8589, region: 'Nabeul', type: 'ville' },
    { name: 'Menzel Horr', lat: 36.8167, lng: 10.8833, region: 'Nabeul', type: 'ville' },
    { name: 'Dar Allouch', lat: 36.7833, lng: 10.9167, region: 'Nabeul', type: 'localité' },
    { name: 'Hammamet', lat: 36.4000, lng: 10.6167, region: 'Nabeul', type: 'ville' },
    { name: 'Soliman', lat: 36.7000, lng: 10.4833, region: 'Nabeul', type: 'ville' },
    { name: 'Grombalia', lat: 36.6000, lng: 10.4833, region: 'Nabeul', type: 'ville' },
    { name: 'Menzel Bouzelfa', lat: 36.6833, lng: 10.5833, region: 'Nabeul', type: 'ville' },
    { name: 'Beni Khalled', lat: 36.7167, lng: 10.5500, region: 'Nabeul', type: 'ville' },
    
    // Gouvernorat de Sousse
    { name: 'Sousse', lat: 35.8256, lng: 10.6369, region: 'Sousse', type: 'ville' },
    { name: 'Msaken', lat: 35.7267, lng: 10.5811, region: 'Sousse', type: 'ville' },
    { name: 'Kalaa Kebira', lat: 35.8833, lng: 10.3500, region: 'Sousse', type: 'ville' },
    { name: 'Enfida', lat: 36.1333, lng: 10.3833, region: 'Sousse', type: 'ville' },
    { name: 'Hergla', lat: 36.0333, lng: 10.5167, region: 'Sousse', type: 'ville' },
    { name: 'Akouda', lat: 35.8667, lng: 10.5667, region: 'Sousse', type: 'ville' },
    
    // Gouvernorat de Monastir
    { name: 'Monastir', lat: 35.7774, lng: 10.8261, region: 'Monastir', type: 'ville' },
    { name: 'Mahdia', lat: 35.5047, lng: 11.0622, region: 'Mahdia', type: 'ville' },
    { name: 'Ksar Hellal', lat: 35.6472, lng: 10.8944, region: 'Monastir', type: 'ville' },
    { name: 'Moknine', lat: 35.6167, lng: 10.9000, region: 'Monastir', type: 'ville' },
    { name: 'Teboulba', lat: 35.6833, lng: 10.9667, region: 'Monastir', type: 'ville' },
    { name: 'Bekalta', lat: 35.6167, lng: 10.9833, region: 'Monastir', type: 'ville' },
    
    // Gouvernorat de Sfax
    { name: 'Sfax', lat: 34.7406, lng: 10.7603, region: 'Sfax', type: 'ville' },
    { name: 'Sakiet Ezzit', lat: 34.7833, lng: 10.7333, region: 'Sfax', type: 'ville' },
    { name: 'Sakiet Eddaier', lat: 34.8167, lng: 10.6833, region: 'Sfax', type: 'ville' },
    { name: 'Agareb', lat: 34.7833, lng: 10.4667, region: 'Sfax', type: 'ville' },
    { name: 'Jebeniana', lat: 34.9167, lng: 10.9000, region: 'Sfax', type: 'ville' },
    
    // Gouvernorat de Bizerte
    { name: 'Bizerte', lat: 37.2746, lng: 9.8739, region: 'Bizerte', type: 'ville' },
    { name: 'Menzel Bourguiba', lat: 37.1547, lng: 9.7847, region: 'Bizerte', type: 'ville' },
    { name: 'Mateur', lat: 37.0422, lng: 9.6656, region: 'Bizerte', type: 'ville' },
    { name: 'Ras Jebel', lat: 37.2333, lng: 9.8667, region: 'Bizerte', type: 'ville' },
    { name: 'Menzel Jemil', lat: 37.2333, lng: 9.9167, region: 'Bizerte', type: 'ville' },
    
    // Gouvernorat de Tunis
    { name: 'Tunis', lat: 36.8065, lng: 10.1815, region: 'Tunis', type: 'ville' },
    { name: 'Ariana', lat: 36.8667, lng: 10.1833, region: 'Ariana', type: 'ville' },
    { name: 'La Marsa', lat: 36.8775, lng: 10.3247, region: 'Tunis', type: 'ville' },
    { name: 'Sidi Bou Said', lat: 36.8697, lng: 10.3472, region: 'Tunis', type: 'ville' },
    { name: 'Carthage', lat: 36.8531, lng: 10.3311, region: 'Tunis', type: 'ville' },
    
    // Gouvernorat de Ben Arous
    { name: 'Ben Arous', lat: 36.7544, lng: 10.2181, region: 'Ben Arous', type: 'ville' },
    { name: 'Rades', lat: 36.7667, lng: 10.2833, region: 'Ben Arous', type: 'ville' },
    { name: 'Hammam Lif', lat: 36.7297, lng: 10.3444, region: 'Ben Arous', type: 'ville' },
    { name: 'Boumhel', lat: 36.7667, lng: 10.2167, region: 'Ben Arous', type: 'ville' },
    
    // Autres gouvernorats importants
    { name: 'Kairouan', lat: 35.6781, lng: 10.0963, region: 'Kairouan', type: 'ville' },
    { name: 'Gafsa', lat: 34.4250, lng: 8.7842, region: 'Gafsa', type: 'ville' },
    { name: 'Gabes', lat: 33.8815, lng: 10.0982, region: 'Gabes', type: 'ville' },
    { name: 'Tozeur', lat: 33.9197, lng: 8.1339, region: 'Tozeur', type: 'ville' },
    { name: 'Medenine', lat: 33.3548, lng: 10.5053, region: 'Medenine', type: 'ville' },
    { name: 'Tataouine', lat: 32.9297, lng: 10.4517, region: 'Tataouine', type: 'ville' },
    { name: 'Jendouba', lat: 36.5011, lng: 8.7803, region: 'Jendouba', type: 'ville' },
    { name: 'Le Kef', lat: 36.1742, lng: 8.7050, region: 'Le Kef', type: 'ville' },
    { name: 'Siliana', lat: 36.0836, lng: 9.3706, region: 'Siliana', type: 'ville' },
    { name: 'Beja', lat: 36.7261, lng: 9.1811, region: 'Beja', type: 'ville' },
    
    // Routes et autoroutes importantes
    { name: 'Autoroute A1 Tunis-Sfax', lat: 35.5, lng: 10.4, region: 'National', type: 'route' },
    { name: 'Route GP1 Côtière', lat: 36.2, lng: 10.8, region: 'National', type: 'route' },
    { name: 'Route MC28 Nabeul-Kelibia', lat: 36.65, lng: 10.9, region: 'Nabeul', type: 'route' }
  ];

  // Cultures avec leurs icônes
  const cultures = [
    { value: 'Poivron', label: '🫑 Poivron', icon: '🫑' },
    { value: 'Tomate', label: '🍅 Tomate', icon: '🍅' },
    { value: 'Piment', label: '🌶️ Piment', icon: '🌶️' },
    // { value: 'Olive', label: '🫒 Olive', icon: '🫒' },
    // { value: 'Citron', label: '🍋 Citron', icon: '🍋' },
    // { value: 'Orange', label: '🍊 Orange', icon: '🍊' },
    // { value: 'Blé', label: '🌾 Blé', icon: '🌾' },
    // { value: 'Orge', label: '🌾 Orge', icon: '🌾' },
  ];

  // FONCTION TOAST AMÉLIORÉE
  const showToast = (message: string, duration = 3000) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), duration);
  };

  // Navigation vers la liste des parcelles
  const navigateToListe = () => {
    setIsNavigating(true);
    showToast('📋 Retour à la liste des parcelles...', 2000);
    setTimeout(() => {
      if (onNavigateToListe) {
        onNavigateToListe();
      }
      setIsNavigating(false);
    }, 800);
  };

  // Fonction de normalisation pour la recherche améliorée
  const normalizeString = (str: string): string => {
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '');
  };

  // FONCTION DE RECHERCHE GÉOGRAPHIQUE AVANCÉE
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    // Recherche locale dans notre base de données
    const normalizedQuery = normalizeString(query);
    
    const localResults = tunisianPlaces.filter(place => {
      const normalizedName = normalizeString(place.name);
      const normalizedRegion = normalizeString(place.region);
      
      return normalizedName.includes(normalizedQuery) || 
             normalizedRegion.includes(normalizedQuery) ||
             normalizedName.startsWith(normalizedQuery.substring(0, 3));
    });

    // Trier par pertinence (correspondance exacte d'abord)
    const sortedResults = localResults.sort((a, b) => {
      const aName = normalizeString(a.name);
      const bName = normalizeString(b.name);
      
      // Correspondance exacte en premier
      if (aName === normalizedQuery && bName !== normalizedQuery) return -1;
      if (bName === normalizedQuery && aName !== normalizedQuery) return 1;
      
      // Correspondance au début du nom
      if (aName.startsWith(normalizedQuery) && !bName.startsWith(normalizedQuery)) return -1;
      if (bName.startsWith(normalizedQuery) && !aName.startsWith(normalizedQuery)) return 1;
      
      // Trier par type (villes avant routes)
      if (a.type === 'ville' && b.type !== 'ville') return -1;
      if (b.type === 'ville' && a.type !== 'ville') return 1;
      
      return a.name.localeCompare(b.name);
    });

    setSearchResults(sortedResults.slice(0, 10));
    setShowResults(true);
    setIsSearching(false);
  };

  // Naviguer vers un lieu avec animation
  const goToPlace = (place: any) => {
    if (!mapInstanceRef.current) {
      showToast('❌ Carte non initialisée', 2000);
      return;
    }

    try {
      const zoomLevel = place.type === 'ville' ? 14 : place.type === 'route' ? 12 : 15;
      
      mapInstanceRef.current.setView([place.lat, place.lng], zoomLevel, {
        animate: true,
        duration: 1.5
      });
      
      setSearchQuery(place.name);
      setShowResults(false);
      
      const L = (window as any).L;
      if (L && L.marker) {
        // Icône selon le type de lieu
        let iconHtml = '📍';
        if (place.type === 'ville') iconHtml = '🏙️';
        if (place.type === 'route') iconHtml = '🛣️';
        if (place.type === 'localité') iconHtml = '🏘️';
        
        const customIcon = L.divIcon({
          html: `<div style="
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: bounce 0.5s ease-in-out;
          ">${iconHtml}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          className: 'custom-search-marker'
        });
        
        const marker = L.marker([place.lat, place.lng], { icon: customIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="text-align: center; padding: 8px;">
              <strong style="color: #3b82f6; font-size: 16px;">${iconHtml} ${place.name}</strong>
              <br/>
              <span style="color: #6b7280; font-size: 12px;">
                ${place.type.charAt(0).toUpperCase() + place.type.slice(1)} - ${place.region}
              </span>
              <br/>
              <small style="color: #9ca3af;">
                📍 ${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}
              </small>
            </div>
          `, {
            closeButton: false,
            autoClose: false
          })
          .openPopup();
        
        // Retirer le marqueur après 8 secondes
        setTimeout(() => {
          if (mapInstanceRef.current && marker) {
            mapInstanceRef.current.removeLayer(marker);
          }
        }, 8000);
        
        showToast(`📍 Navigation vers ${place.name}`, 2000);
      }
    } catch (error) {
      console.error('Erreur lors de la navigation:', error);
      showToast('❌ Erreur lors de la navigation', 2000);
    }
  };

  // Fonction améliorée pour obtenir la couleur selon la culture
  const getCultureColor = (culture: string) => {
    switch (culture) {
      case 'Tomate':
        return { color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.6, weight: 3 };
      case 'Piment':
        return { color: '#dc2626', fillColor: '#f87171', fillOpacity: 0.6, weight: 3 };
      case 'Poivron':
        return { color: '#059669', fillColor: '#10b981', fillOpacity: 0.6, weight: 3 };
      case 'Olive':
        return { color: '#65a30d', fillColor: '#84cc16', fillOpacity: 0.6, weight: 3 };
      case 'Citron':
        return { color: '#eab308', fillColor: '#fbbf24', fillOpacity: 0.6, weight: 3 };
      case 'Orange':
        return { color: '#ea580c', fillColor: '#fb923c', fillOpacity: 0.6, weight: 3 };
      case 'Blé':
      case 'Orge':
        return { color: '#d97706', fillColor: '#f59e0b', fillOpacity: 0.6, weight: 3 };
      default:
        return { color: '#6b7280', fillColor: '#9ca3af', fillOpacity: 0.5, weight: 3 };
    }
  };

  // Fonction pour calculer les coordonnées centrales
  const calculerCoordonneesCentrales = () => {
    if (parcellesDessinees.length === 0) {
      return null;
    }

    if (modeEdition && parcellesDessinees.length === 1 && !parcellesDessinees[0].coords) {
      return { lat: 35.8, lng: 10.2 };
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
      return { lat: 35.8, lng: 10.2 };
    }

    return {
      lat: totalLat / count,
      lng: totalLng / count
    };
  };

  // Effet pour mettre à jour les coordonnées centrales
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

  // Initialisation de la carte avec vraies données géographiques
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
        script.onload = () => setTimeout(resolve, 50);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const loadLeaflet = async () => {
      try {
        // Charger CSS Leaflet
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

        // Charger CSS Leaflet Draw
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

        // Charger scripts
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!(window as any).L) {
          throw new Error('Leaflet non disponible après chargement');
        }

        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const L = (window as any).L;
        if (!L.Control.Draw) {
          throw new Error('Leaflet Draw non disponible après chargement');
        }
        
        if (!isMapInitialized) {
          initMap();
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement de Leaflet:', error);
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

        // Créer la carte centrée sur la Tunisie
        const mapInstance = L.map(mapRef.current, {
          center: [35.8, 10.2], // Centre de la Tunisie
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

        // Couche satellite haute qualité
        const satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
          attribution: '&copy; Google Satellite',
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        });

        // Couche des labels et routes
        const labelsLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}', {
          attribution: '&copy; Google Labels',
          maxZoom: 20,
          opacity: 0.8
        });

        // Couche terrain (optionnelle)
        const terrainLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
          attribution: '&copy; Google Terrain',
          maxZoom: 20,
          opacity: 0.7
        });

        // OpenStreetMap comme alternative
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        });

        // Ajouter les couches par défaut
        satelliteLayer.addTo(mapInstance);
        labelsLayer.addTo(mapInstance);

        // Contrôle des couches
        const baseLayers = {
          "🛰️ Satellite": satelliteLayer,
          "🗺️ Terrain": terrainLayer,
          "📍 OpenStreetMap": osmLayer
        };

        const overlayLayers = {
          "🏷️ Labels et Routes": labelsLayer
        };

        L.control.layers(baseLayers, overlayLayers, {
          position: 'topright',
          collapsed: false
        }).addTo(mapInstance);

        // Créer le groupe de dessins
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

        // Ajouter marqueurs pour les principales villes
        const addCityMarkers = () => {
          const mainCities = tunisianPlaces.filter(place => 
            place.type === 'ville' && 
            ['Tunis', 'Sfax', 'Sousse', 'Nabeul', 'Bizerte', 'Monastir', 'Kairouan'].includes(place.name)
          );

          mainCities.forEach(city => {
            const cityIcon = L.divIcon({
              html: `<div style="
                background: rgba(59, 130, 246, 0.9);
                color: white;
                border-radius: 12px;
                padding: 4px 8px;
                font-size: 11px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                white-space: nowrap;
              ">${city.name}</div>`,
              iconSize: [60, 24],
              iconAnchor: [30, 12],
              className: 'city-label-marker'
            });

            L.marker([city.lat, city.lng], { 
              icon: cityIcon,
              zIndexOffset: -100
            }).addTo(mapInstance);
          });
        };

        // Ajouter les marqueurs des villes quand le zoom est suffisant
        mapInstance.on('zoomend', () => {
          const currentZoom = mapInstance.getZoom();
          if (currentZoom >= 8) {
            addCityMarkers();
          }
        });

        // Événement création de forme
        mapInstance.on(L.Draw.Event.CREATED, (event: any) => {
          const layer = event.layer;
          const type = event.layerType;
          
          const currentCulture = selectedCulture || '';
          const currentStatut = statutParcelle || '';
          
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

          const newParcelleDessinee = {
            id: Date.now(),
            type,
            area: Math.round(area),
            perimeter: Math.round(perimeter),
            layer,
            coords: type === 'polygon' || type === 'rectangle' ? layer.getLatLngs() : layer.getLatLng(),
            radius: type === 'circle' ? layer.getRadius() : undefined,
            culture: currentCulture,
            statut: currentStatut,
            colors: cultureColors
          };
          setParcellesDessinees(prev => [...prev, newParcelleDessinee]);

          showToast(`✅ Parcelle ${type} ajoutée (${Math.round(area/10000 * 100)/100} ha)`, 3000);
        });

        // Événement suppression
        mapInstance.on(L.Draw.Event.DELETED, (event: any) => {
          const layers = event.layers;
          layers.eachLayer((layer: any) => {
            setParcellesDessinees(prev => prev.filter(p => p.layer !== layer));
          });
          showToast('🗑️ Parcelles supprimées', 2000);
        });

        setMap(mapInstance);
        setDrawnItems(drawnItemsLayer);
        setMapLoaded(true);
        
        console.log('✅ Carte initialisée avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la carte:', error);
        setIsMapInitialized(false);
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setIsMapInitialized(false);
    };
  }, []);

  const calculateTotalArea = () => {
    return parcellesDessinees.reduce((total, parcelle) => total + parcelle.area, 0);
  };

  const clearAllParcelles = () => {
    if (drawnItems && mapInstanceRef.current) {
      drawnItems.clearLayers();
      setParcellesDessinees([]);
      showToast('🗑️ Toutes les parcelles supprimées', 2000);
    }
  };

  // Gestion de l'effet ripple
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

  // Soumission du formulaire
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titreParcelle.trim()) {
      showToast('⚠️ Veuillez entrer un titre pour la parcelle', 3000);
      return;
    }
    if (!selectedCulture) {
      showToast('⚠️ Veuillez sélectionner le type de culture', 3000);
      return;
    }
    if (!statutParcelle) {
      showToast('⚠️ Veuillez sélectionner le statut de la parcelle', 3000);
      return;
    }

    const surfaceCalculee = calculateTotalArea();
    if (!modeEdition && parcellesDessinees.length === 0) {
      showToast('⚠️ Veuillez dessiner au moins une parcelle sur la carte', 3000);
      return;
    }

    const coordonneesFinales = calculerCoordonneesCentrales();
    
    if (!coordonneesFinales) {
      showToast('❌ Impossible de calculer les coordonnées centrales', 3000);
      return;
    }

    const parcelleData: ParcelleData = {
      id: modeEdition && parcelleAEditer ? parcelleAEditer.id : Date.now(),
      nom: titreParcelle,
      culture: selectedCulture,
      statut: statutParcelle,
      montantInvestissement: parseFloat(montantInvestissement as string) || 0,
      surfaceTotale: surfaceCalculee || 0,
      farmerId: farmerId,
      dateCreation: new Date().toISOString(),
      latitude: coordonneesFinales.lat,
      longitude: coordonneesFinales.lng,
      superficie: `${surfaceCalculee} m²`,
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

    setSavedParcelles(prev => [...prev, parcelleData]);
    
    if (onSubmit) {
      onSubmit(parcelleData);
    }
    
    const messageSucces = `✅ Parcelle "${titreParcelle}" enregistrée avec succès!`;
    showToast(messageSucces, 2000);
    
    // Réinitialiser le formulaire
    setTitreParcelle('');
    setSelectedCulture('');
    setStatutParcelle('');
    setMontantInvestissement('');
    clearAllParcelles();
  };

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

  return (
    <>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh'
      }}>
        {/* Barre de navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '16px',
          border: '1px solid #e9ecef',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <button
            onClick={navigateToListe}
            disabled={isNavigating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 24px',
              background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isNavigating ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              opacity: isNavigating ? 0.7 : 1,
              boxShadow: '0 4px 15px rgba(108, 117, 125, 0.3)'
            }}
            onMouseOver={(e) => {
              if (!isNavigating) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(108, 117, 125, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!isNavigating) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(108, 117, 125, 0.3)';
              }
            }}
            onMouseDown={handleRippleEffect}
          >
            <span style={{ fontSize: '18px' }}>📋</span>
            <span>Retour à la Liste</span>
          </button>

          <h1 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: '#495057',
            textAlign: 'center',
            flex: 1
          }}>
            🇹🇳 Nouvelle Parcelle Agricole
          </h1>

          <div style={{ width: '160px' }}></div>
        </div>

        {/* Section Formulaire */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#495057',
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📝 Informations de la Parcelle
          </h2>

          <form onSubmit={handleFormSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginBottom: '30px'
            }}>
              {/* Titre de la Parcelle */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  📝 Nom de la Parcelle
                </label>
                <input
                  type="text"
                  value={titreParcelle}
                  onChange={(e) => setTitreParcelle(e.target.value)}
                  placeholder="Exemple: Parcelle Nord, Champ des Oliviers..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Culture */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  🌾 Type de Culture
                </label>
                <select 
                  value={selectedCulture}
                  onChange={(e) => setSelectedCulture(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">🌱 Sélectionner le type de culture</option>
                  {cultures.map((culture) => (
                    <option key={culture.value} value={culture.value}>
                      {culture.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  📊 Statut de la Parcelle
                </label>
                <select 
                  value={statutParcelle}
                  onChange={(e) => setStatutParcelle(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">📈 Sélectionner le statut</option>
                  <option value="active">✅ Active - En production</option>
                  <option value="preparation">🚧 En préparation</option>
                  <option value="repos">😴 Au repos</option>
                </select>
              </div>

              {/* Surface */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  📐 Surface Totale
                </label>
                <input 
                  type="text" 
                  value={calculateTotalArea() > 0 ? `${calculateTotalArea()} m² (${(calculateTotalArea()/10000).toFixed(3)} ha)` : 'Dessinez des parcelles sur la carte'}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280',
                    fontWeight: '600'
                  }}
                />
              </div>

              {/* Montant d'investissement */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  💰 Investissement (TND)
                </label>
                <input 
                  type="number" 
                  value={montantInvestissement}
                  onChange={(e) => setMontantInvestissement(parseFloat(e.target.value))}
                  placeholder="Montant investi en dinars tunisiens"
                  min="0" 
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Coordonnées */}
              {coordonneesCentrales && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    🎯 Coordonnées GPS
                  </label>
                  <input 
                    type="text" 
                    value={`${coordonneesCentrales.lat.toFixed(6)}, ${coordonneesCentrales.lng.toFixed(6)}`}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#f0f9ff',
                      color: '#1d4ed8',
                      fontWeight: '600'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Bouton de soumission */}
            <button 
              type="submit"
              disabled={isNavigating}
              style={{
                width: '100%',
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: isNavigating ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: isNavigating ? 0.7 : 1,
                boxShadow: '0 4px 20px rgba(5, 150, 105, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                if (!isNavigating) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(5, 150, 105, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!isNavigating) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(5, 150, 105, 0.3)';
                }
              }}
              onMouseDown={handleRippleEffect}
            >
              {isNavigating ? '⏳ ENREGISTREMENT...' : '✅ ENREGISTRER LA PARCELLE'}
            </button>
          </form>
        </div>

        {/* Section Carte */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#495057',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🗺️ Carte Interactive de la Tunisie
          </h2>

          {/* Barre de recherche stylée */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px'
            }}>
              🔍 Rechercher un lieu en Tunisie
            </label>
            <div className="search-container" style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Tapez le nom d'une ville (Nabeul, Kelibia, Sousse, Korba, Menzel Horr...)"
                  style={{
                    width: '100%',
                    padding: '16px 20px 16px 50px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    backgroundColor: '#fafbfc'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    e.target.style.backgroundColor = '#ffffff';
                    if (searchResults.length > 0 && searchQuery.length >= 2) {
                      setShowResults(true);
                    }
                  }}
                  onBlur={(e) => {
                    setTimeout(() => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                      e.target.style.backgroundColor = '#fafbfc';
                    }, 200);
                  }}
                />
                <div style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '20px',
                  color: '#6b7280'
                }}>
                  {isSearching ? '⏳' : '🔍'}
                </div>
              </div>
              
              {showResults && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 1000
                }}>
                  {searchResults.map((place, index) => (
                    <div 
                      key={`${place.name}-${index}`}
                      onClick={() => goToPlace(place)}
                      style={{
                        padding: '16px 20px',
                        cursor: 'pointer',
                        borderBottom: index < searchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <div style={{
                        fontSize: '20px',
                        width: '32px',
                        textAlign: 'center'
                      }}>
                        {place.type === 'ville' ? '🏙️' : place.type === 'route' ? '🛣️' : '🏘️'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          {place.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          {place.type.charAt(0).toUpperCase() + place.type.slice(1)} - Gouvernorat de {place.region}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                        fontFamily: 'monospace'
                      }}>
                        {place.lat.toFixed(3)}, {place.lng.toFixed(3)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {showResults && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  zIndex: 1000
                }}>
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      Aucun résultat trouvé
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      pour "{searchQuery}"
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contrôles de la carte */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={clearAllParcelles}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.3)';
              }}
            >
              🗑️ Effacer parcelles
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
              }}
            >
              🔄 Actualiser carte
            </button>

            {parcellesDessinees.length > 0 && (
              <div style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📊 {parcellesDessinees.length} parcelle(s) - {(calculateTotalArea()/10000).toFixed(3)} ha
              </div>
            )}
          </div>
          
          {/* Container de la carte */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '600px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '2px solid #e5e7eb',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div 
              ref={mapRef} 
              style={{
                width: '100%',
                height: '100%'
              }}
            >
              {!mapLoaded && (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  color: '#64748b',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                    animation: 'pulse 2s infinite'
                  }}>
                    🗺️
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    Chargement de la carte satellite de la Tunisie...
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    textAlign: 'center',
                    maxWidth: '400px'
                  }}>
                    Carte interactive avec images satellite haute résolution, villes et routes principales
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions d'utilisation */}
          <div style={{
            marginTop: '20px',
            padding: '20px',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '12px',
            border: '1px solid #bae6fd'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#0369a1',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💡 Instructions d'utilisation
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px',
              fontSize: '14px',
              color: '#0c4a6e'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🔍</span>
                <span>Recherchez une ville tunisienne dans la barre ci-dessus</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🖱️</span>
                <span>Utilisez les outils à gauche pour dessiner vos parcelles</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🎨</span>
                <span>Sélectionnez d'abord la culture pour colorer automatiquement</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>📐</span>
                <span>La surface se calcule automatiquement en temps réel</span>
              </div>
            </div>
          </div>

          {/* Statistiques des parcelles */}
          {parcellesDessinees.length > 0 && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '12px',
              border: '1px solid #bbf7d0'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#166534',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📊 Détail des Parcelles Dessinées
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '12px'
              }}>
                {parcellesDessinees.map((parcelle, index) => {
                  const cultureIcon = cultures.find(c => c.value === parcelle.culture)?.icon || '🌱';
                  return (
                    <div key={parcelle.id} style={{
                      padding: '16px',
                      background: 'white',
                      borderRadius: '8px',
                      border: `2px solid ${parcelle.colors?.color || '#e5e7eb'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: parcelle.colors?.fillColor || '#f3f4f6',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        {cultureIcon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '4px'
                        }}>
                          {parcelle.culture || 'Culture non définie'} - {parcelle.type}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          {parcelle.area} m² ({(parcelle.area/10000).toFixed(4)} ha)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: 'white',
                borderRadius: '8px',
                border: '2px solid #059669',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#059669'
                }}>
                  Surface Totale: {calculateTotalArea()} m² ({(calculateTotalArea()/10000).toFixed(4)} hectares)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <ToastNotification />

      {/* Styles CSS */}
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

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0,-30px,0);
          }
          70% {
            transform: translate3d(0,-15px,0);
          }
          90% {
            transform: translate3d(0,-4px,0);
          }
        }
        
        /* Style pour les marqueurs de ville */
        .city-label-marker {
          z-index: 100 !important;
        }

        /* Style pour les marqueurs de recherche */
        .custom-search-marker {
          z-index: 1000 !important;
        }

        /* Scrollbar pour les résultats de recherche */
        .search-container div:last-child::-webkit-scrollbar {
          width: 6px;
        }

        .search-container div:last-child::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .search-container div:last-child::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .search-container div:last-child::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .search-container input {
            font-size: 16px !important;
          }
        }
      `}</style>
    </>
  );
};

export default FormulaireParcelle;