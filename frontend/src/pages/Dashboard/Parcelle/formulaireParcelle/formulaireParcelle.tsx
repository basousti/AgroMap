import React, { useEffect, useRef, useState } from 'react';
import './formulairePrcelle.css';

// Interface pour étendre HTMLDivElement avec les propriétés Leaflet
interface LeafletHTMLElement extends HTMLDivElement {
  _leaflet_id?: number;
}

const FormulaireParcelle: React.FC = () => {
  const formSectionRefs = useRef<HTMLDivElement[]>([]);
  const mapRef = useRef<LeafletHTMLElement>(null);
  const mapInstanceRef = useRef<any>(null); // Référence pour l'instance de carte
  const [map, setMap] = useState<any>(null);
  const [drawnItems, setDrawnItems] = useState<any>(null);
  const [parcelles, setParcelles] = useState<any[]>([]);
  const [selectedCulture, setSelectedCulture] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false); // Flag pour éviter la double initialisation

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
    { name: 'Ariana', lat: 36.8625, lng: 10.1957, region: 'Ariana' },
    { name: 'Ben Arous', lat: 36.7542, lng: 10.2189, region: 'Ben Arous' },
    { name: 'Manouba', lat: 36.8080, lng: 10.0969, region: 'Manouba' },
    { name: 'Zaghouan', lat: 36.4025, lng: 10.1425, region: 'Zaghouan' },
    { name: 'Siliana', lat: 36.0844, lng: 9.3706, region: 'Siliana' },
    { name: 'Jendouba', lat: 36.5011, lng: 8.7803, region: 'Jendouba' },
    { name: 'Béja', lat: 36.7256, lng: 9.1817, region: 'Béja' },
    { name: 'Menzel Horr', lat: 36.8075, lng: 10.8644, region: 'Nabeul' },
    { name: 'Menzel Temime', lat: 36.7667, lng: 10.9833, region: 'Nabeul' },
    { name: 'Kef', lat: 36.1743, lng: 8.7049, region: 'Kef' },
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
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9\s]/g, ''); // Supprime les caractères spéciaux
  };

  // Fonction de recherche améliorée
  const handleSearch = (query: string) => {
    console.log('Recherche pour:', query);
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const normalizedQuery = normalizeString(query);
    console.log('Query normalisée:', normalizedQuery);
    
    const filtered = tunisianPlaces.filter(place => {
      const normalizedName = normalizeString(place.name);
      const normalizedRegion = normalizeString(place.region);
      
      const matchesName = normalizedName.includes(normalizedQuery);
      const matchesRegion = normalizedRegion.includes(normalizedQuery);
      
      return matchesName || matchesRegion;
    });

    console.log('Résultats filtrés:', filtered);
    setSearchResults(filtered.slice(0, 8)); // Limite à 8 résultats
    setShowResults(true);
  };

  // Naviguer vers un lieu - Version améliorée
  const goToPlace = (place: any) => {
    console.log('Tentative de navigation vers:', place);
    
    if (!map) {
      console.warn('Carte non initialisée');
      return;
    }

    try {
      // Vérifier si la carte est prête
      if (mapInstanceRef.current && mapInstanceRef.current.setView && typeof mapInstanceRef.current.setView === 'function') {
        mapInstanceRef.current.setView([place.lat, place.lng], 15);
        setSearchQuery(place.name);
        setShowResults(false);
        
        // Ajouter un marqueur temporaire
        const L = (window as any).L;
        if (L && L.marker) {
          const marker = L.marker([place.lat, place.lng])
            .addTo(mapInstanceRef.current)
            .bindPopup(`📍 ${place.name}<br/>Gouvernorat de ${place.region}`)
            .openPopup();
          
          // Supprimer le marqueur après 5 secondes
          setTimeout(() => {
            if (mapInstanceRef.current && marker) {
              mapInstanceRef.current.removeLayer(marker);
            }
          }, 5000);
        }
        
        console.log('Navigation réussie vers:', place.name);
      } else {
        console.warn('Méthode setView non disponible, retry dans 1 seconde');
        // Retry après un délai si la carte n'est pas encore prête
        setTimeout(() => {
          goToPlace(place);
        }, 1000);
      }
    } catch (error) {
      console.error('Erreur lors de la navigation:', error);
    }
  };

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

  useEffect(() => {
    // Charger Leaflet CSS et JS
    const loadLeaflet = async () => {
      try {
        // Charger CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
          document.head.appendChild(cssLink);
          
          // Attendre que le CSS soit chargé
          await new Promise(resolve => {
            cssLink.onload = resolve;
            cssLink.onerror = resolve;
          });
        }

        // Charger Leaflet Draw CSS
        if (!document.querySelector('link[href*="leaflet.draw"]')) {
          const drawCssLink = document.createElement('link');
          drawCssLink.rel = 'stylesheet';
          drawCssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css';
          document.head.appendChild(drawCssLink);
          
          // Attendre que le CSS soit chargé
          await new Promise(resolve => {
            drawCssLink.onload = resolve;
            drawCssLink.onerror = resolve;
          });
        }

        // Charger JS Leaflet d'abord
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js');
        console.log('Leaflet chargé');
        
        // Attendre un moment pour s'assurer que Leaflet est disponible
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Vérifier que Leaflet est bien disponible
        if (!(window as any).L) {
          throw new Error('Leaflet non disponible après chargement');
        }

        // Charger Leaflet Draw après
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js');
        console.log('Leaflet Draw chargé');
        
        // Attendre un moment supplémentaire pour s'assurer que Draw est bien intégré
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Vérifier que Leaflet Draw est bien disponible
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

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Vérifier si le script existe déjà
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          // Si le script existe déjà, attendre un peu et résoudre
          setTimeout(resolve, 50);
          return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          console.log(`Script chargé: ${src}`);
          setTimeout(resolve, 50); // Petit délai pour s'assurer que le script est bien exécuté
        };
        script.onerror = (error) => {
          console.error(`Erreur lors du chargement de ${src}:`, error);
          reject(error);
        };
        document.head.appendChild(script);
      });
    };

    const initMap = () => {
      if (!mapRef.current || isMapInitialized) {
        console.warn('MapRef non disponible ou carte déjà initialisée');
        return;
      }

      const L = (window as any).L;
      if (!L) {
        console.warn('Leaflet non disponible');
        return;
      }

      if (!L.Control.Draw) {
        console.warn('Leaflet Draw non disponible');
        return;
      }

      try {
        // Nettoyer complètement le conteneur avant d'initialiser
        const container = mapRef.current;

        // Vérifier si le conteneur a déjà une carte Leaflet
        if (container._leaflet_id) {
          console.log('Suppression de la carte existante...');
          // Supprimer la carte existante
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
          
          // Nettoyer l'ID Leaflet du conteneur
          delete container._leaflet_id;
          
          // Vider complètement le conteneur
          container.innerHTML = '';
        }

        console.log('Initialisation de la nouvelle carte...');

        // Marquer que l'initialisation est en cours
        setIsMapInitialized(true);

        // Créer la carte centrée sur la Tunisie
        const mapInstance = L.map(mapRef.current, {
          center: [34.7406, 10.7603],
          zoom: 8,
          zoomControl: true,
          attributionControl: true
        });

        // Stocker l'instance de la carte
        mapInstanceRef.current = mapInstance;

        // Ajouter les tuiles satellite (Esri World Imagery)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
          maxZoom: 19
        }).addTo(mapInstance);

        // Ajouter une couche optionnelle pour les terres agricoles (OpenStreetMap avec focus agricole)
        const agriculturalLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
          opacity: 0.3
        });

        // Créer un contrôleur de couches pour basculer entre vues
        const baseMaps = {
          "🛰️ Vue Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
            maxZoom: 19
          }),
          "🗺️ Carte Routière": L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
          }),
          "🌾 Terres Agricoles": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri Agricultural View',
            maxZoom: 19,
            className: 'agricultural-tiles'
          })
        };

        const overlayMaps = {
          "📍 Repères Agricoles": agriculturalLayer
        };

        L.control.layers(baseMaps, overlayMaps, {
          position: 'topright',
          collapsed: false
        }).addTo(mapInstance);

        // Ajouter un layer pour les dessins
        const drawnItemsLayer = new L.FeatureGroup();
        mapInstance.addLayer(drawnItemsLayer);

        // Configurer les outils de dessin avec style agricole
        const drawControl = new L.Control.Draw({
          position: 'topleft',
          draw: {
            polygon: {
              allowIntersection: false,
              drawError: {
                color: '#ff0000',
                message: '<strong>Erreur:</strong> Les lignes ne peuvent pas se croiser!'
              },
              shapeOptions: {
                color: '#ff6b35',
                fillColor: '#32cd32',
                fillOpacity: 0.8,
                weight: 4,
                dashArray: '8, 4'
              }
            },
            rectangle: {
              shapeOptions: {
                color: '#ff6b35',
                fillColor: '#32cd32',
                fillOpacity: 0.8,
                weight: 4,
                dashArray: '8, 4'
              }
            },
            circle: false,
            marker: false,
            circlemarker: false,
            polyline: {
              shapeOptions: {
                color: '#ff6b35',
                weight: 5,
                dashArray: '12, 6'
              }
            }
          },
          edit: {
            featureGroup: drawnItemsLayer,
            remove: true
          }
        });

        mapInstance.addControl(drawControl);

        // Événement lors de la création d'une forme
        mapInstance.on(L.Draw.Event.CREATED, (event: any) => {
          const layer = event.layer;
          const type = event.layerType;
          
          // Calculer la surface
          let area = 0;
          if (type === 'polygon' || type === 'rectangle') {
            area = L.GeometryUtil ? L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]) : 0;
          } else if (type === 'circle') {
            const radius = layer.getRadius();
            area = Math.PI * radius * radius;
          }

          // Ajouter popup avec informations de style agricole
          const popup = L.popup().setContent(`
            <div style="font-family: 'Inter', sans-serif; padding: 12px; min-width: 220px; background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e8 100%);">
              <h4 style="margin: 0 0 12px 0; color: #2d5016; border-bottom: 2px solid #4ade80; padding-bottom: 6px;">🌾 Parcelle Agricole ${parcelles.length + 1}</h4>
              
              <div style="margin: 10px 0; padding: 8px; background: white; border-radius: 6px; border-left: 4px solid #22c55e;">
                <strong style="color: #374151;">📐 Surface:</strong> 
                <span style="color: #059669; font-weight: 700; font-size: 16px;">${Math.round(area)} m²</span>
                <span style="color: #6b7280; font-size: 12px;"> (${(area/10000).toFixed(2)} hectares)</span>
              </div>
              
              <div style="margin: 10px 0; padding: 8px; background: white; border-radius: 6px;">
                <strong style="color: #374151;">📊 Type de délimitation:</strong> 
                <span style="background: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 15px; font-size: 12px; font-weight: 600;">${type}</span>
              </div>
              
              <div style="margin: 10px 0; padding: 8px; background: white; border-radius: 6px;">
                <strong style="color: #374151;">🌱 Potentiel agricole:</strong> 
                <div style="color: #0d9488; font-size: 13px; margin-top: 4px;">
                  • Rendement estimé: <strong>${Math.round(area * 0.8)} kg/saison</strong><br/>
                  • Capacité: <strong>${Math.round(area/100)} plants</strong><br/>
                  • Irrigation: <strong>${Math.round(area * 0.002)} m³/jour</strong>
                </div>
              </div>
              
              <div style="margin: 10px 0; padding: 8px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
                <strong style="color: #92400e;">💡 Recommandations:</strong>
                <div style="font-size: 12px; color: #78350f; margin-top: 4px;">
                  Terre adaptée aux cultures maraîchères<br/>
                  Zone favorable à l'agriculture tunisienne
                </div>
              </div>
              
              <div style="display: flex; gap: 8px; margin-top: 12px; justify-content: center;">
                <button onclick="this.closest('.leaflet-popup').remove()" 
                        style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 12px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  ✅ Valider Parcelle
                </button>
                <button onclick="this.closest('.leaflet-popup').remove()" 
                        style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 12px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  ❌ Fermer
                </button>
              </div>
            </div>
          `);

          layer.bindPopup(popup);
          drawnItemsLayer.addLayer(layer);
          
          // Ajouter à la liste des parcelles
          const newParcelle = {
            id: Date.now(),
            type,
            area: Math.round(area),
            layer
          };
          setParcelles(prev => [...prev, newParcelle]);
        });

        // Événement lors de la suppression
        mapInstance.on(L.Draw.Event.DELETED, (event: any) => {
          const layers = event.layers;
          layers.eachLayer((layer: any) => {
            setParcelles(prev => prev.filter(p => p.layer !== layer));
          });
        });

        setMap(mapInstance);
        setDrawnItems(drawnItemsLayer);
        setMapLoaded(true);
        
        console.log('Carte initialisée avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la carte:', error);
        setIsMapInitialized(false); // Réinitialiser le flag en cas d'erreur
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
      // Nettoyer la carte lors du démontage
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
    if (drawnItems) {
      drawnItems.clearLayers();
      setParcelles([]);
    }
  };

  const calculateTotalArea = () => {
    return parcelles.reduce((total, parcelle) => total + parcelle.area, 0);
  };

  return (
    <div className="form-container">
      <div className="form-section" ref={addToRefs}>
        <h2 className="section-title">
          🇹🇳 Formulaire Parcelle Agricole - Tunisie
        </h2>

        <div className="form-group">
          <label className="form-label">📝 Titre de la Parcelle</label>
          <input type="text" className="form-input" placeholder="Nom de votre parcelle" />
        </div>

        <div className="form-group">
          <label className="form-label">🌾 Culture</label>
          <select 
            className={`culture-select ${selectedCulture ? 'with-icon' : ''}`}
            value={selectedCulture}
            onChange={(e) => setSelectedCulture(e.target.value)}
          >
            <option value="">🌱 Sélectionner le type de culture</option>
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
        </div>

        <div className="form-group">
          <label className="form-label">📊 Status</label>
          <select className="form-input">
            <option value="">📈 Sélectionner le status</option>
            <option value="active">✅ Active</option>
            <option value="en_preparation">🚧 En préparation</option>
            <option value="repos">😴 Au repos</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">📐 Surface (m²)</label>
          <input 
            type="number" 
            className="form-input" 
            placeholder="Superficie en mètres carrés" 
            min="0" 
            step="0.01"
            value={calculateTotalArea() || ''}
            readOnly
          />
        </div>

        <div className="form-group">
          <label className="form-label">💰 Montant d'Investissement (TND)</label>
          <input type="number" className="form-input" placeholder="Montant investi en dinars tunisiens" min="0" step="0.01" />
        </div>

        <button className="submit-btn" onClick={handleRippleEffect}>
          <div className="submit-btn-content">
            <span className="submit-btn-badge">
              ✅ ENREGISTRER
            </span>
          </div>
        </button>

        {parcelles.length > 0 && (
          <div className="stats-card">
            <h4 className="stats-title">📊 Statistiques</h4>
            <p className="stats-item"><strong>Parcelles créées:</strong> {parcelles.length}</p>
            <p className="stats-item"><strong>Surface totale:</strong> {calculateTotalArea()} m²</p>
            <button 
              className="clear-btn" 
              onClick={clearAllParcelles}
              onMouseDown={handleRippleEffect}
            >
              🗑️ Effacer toutes les parcelles
            </button>
          </div>
        )}
      </div>

      <div className="form-section" ref={addToRefs}>
        <h2 className="section-title">
          🗺️ Carte Interactive de la Tunisie
        </h2>
        
        <div className="form-group">
          <label className="form-label">🔍 Rechercher un lieu en Tunisie</label>
          <div className="search-container">
            <div className='search-line'>
              <div className='input-wrapper'>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Tapez le nom d'une ville (ex: Nabeul, Kelibia, Sousse...)" 
                  value={searchQuery} 
                  onChange={(e) => handleSearch(e.target.value)} 
                  onFocus={() => {
                    if (searchResults.length > 0 && searchQuery.length >= 2) {
                      setShowResults(true);
                    }
                  }}
                />
                <div className="search-icon">🔍</div>
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
                    <div className="search-result-region">Gouvernorat de {place.region}</div>
                  </div>
                ))}
              </div>
            )}
            
            {showResults && searchResults.length === 0 && searchQuery.length >= 2 && (
              <div className="search-results">
                <div className="search-result-item" style={{ cursor: 'default', opacity: 0.7 }}>
                  <div className="search-result-name">Aucun résultat trouvé</div>
                  <div className="search-result-region">pour "{searchQuery}"</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="map-controls">
          <button className="clear-btn" onClick={clearAllParcelles}>
            🗑️ Effacer parcelles
          </button>
          <button className="refresh-btn" onClick={() => window.location.reload()}>
            🔄 Actualiser
          </button>
        </div>
        
        <div className="map-container">
          <div ref={mapRef} className="map-element">
            {!mapLoaded && (
              <div className="map-placeholder">
                🗺️ Chargement de la carte satellite de la Tunisie...
                <br />
                <small className="map-placeholder-text">
                  Carte interactive avec images satellite
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormulaireParcelle;