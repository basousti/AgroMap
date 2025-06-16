import React, { useEffect, useRef, useState } from 'react';

// Types TypeScript
interface Parcelle {
  id: number;
  nom: string;
  latitude: number;
  longitude: number;
  superficie: string;
  type: string;
}

interface CarteInteractiveProps {
  parcellesFiltrees?: Parcelle[];
  onParcelleClick?: (parcelle: Parcelle) => void;
}

// Déclaration globale pour Leaflet
declare global {
  interface Window {
    L: any;
    [key: string]: any;
  }
}

const CarteInteractive: React.FC<CarteInteractiveProps> = ({ 
  parcellesFiltrees = [], 
  onParcelleClick 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const loadLeaflet = (): Promise<void> => {
      return new Promise((resolve) => {
        // Charger CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
          document.head.appendChild(link);
        }

        // Charger JS
        if (!window.L) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        } else {
          resolve();
        }
      });
    };

    const initializeMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      await loadLeaflet();

      if (!window.L) return;

      // Créer la carte centrée spécifiquement sur la Tunisie
      const map = window.L.map(mapRef.current, {
        center: [34.0, 9.5], // Centre optimal pour la Tunisie
        zoom: 8,
        zoomControl: false,
        attributionControl: false,
        maxZoom: 18,
        minZoom: 7
      });

      // Définir les limites géographiques de la Tunisie
      const tunisiaBounds = window.L.latLngBounds(
        [30.0, 7.0], // Sud-Ouest (point le plus au sud et à l'ouest)
        [37.5, 12.0] // Nord-Est (point le plus au nord et à l'est)
      );

      // Limiter la vue à la Tunisie
      map.setMaxBounds(tunisiaBounds);
      map.fitBounds(tunisiaBounds, { padding: [10, 10] });

      // Utiliser les tuiles Google Satellite
      window.L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 18,
        attribution: '',
        bounds: tunisiaBounds
      }).addTo(map);

      // Ajouter les labels Google
      window.L.tileLayer('https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}', {
        maxZoom: 18,
        attribution: '',
        bounds: tunisiaBounds
      }).addTo(map);

      // Empêcher le déplacement en dehors des limites
      map.on('drag', function() {
        map.panInsideBounds(tunisiaBounds, { animate: false });
      });

      mapInstanceRef.current = map;
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !parcellesFiltrees) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach((marker: any) => {
      if (mapInstanceRef.current && marker) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];

    // Ajouter les nouveaux marqueurs
    if (parcellesFiltrees.length > 0) {
      const newMarkers: any[] = [];

      parcellesFiltrees.forEach((parcelle: Parcelle) => {
        // Vérifier que les coordonnées sont dans les limites de la Tunisie
        if (parcelle.latitude && parcelle.longitude &&
            parcelle.latitude >= 30.0 && parcelle.latitude <= 37.5 &&
            parcelle.longitude >= 7.0 && parcelle.longitude <= 12.0) {
          
          // Créer des marqueurs avec les couleurs exactes de l'image
          const getMarkerIcon = (type: string) => {
            const colors = {
              'Résidentiel': '#1E88E5',    // Bleu
              'Commercial': '#43A047',     // Vert
              'Industriel': '#E53935',     // Rouge
              'Agricole': '#FDD835',       // Jaune
              'Touristique': '#8E24AA',    // Violet
              'Mixte': '#00ACC1',          // Cyan
              'default': '#757575'         // Gris
            };
            
            const color = colors[type as keyof typeof colors] || colors.default;
            
            return window.L.divIcon({
              className: 'custom-marker',
              html: `<div style="
                background-color: ${color};
                width: 6px;
                height: 6px;
                border-radius: 50%;
                border: 1px solid rgba(255,255,255,0.8);
                box-shadow: 0 1px 2px rgba(0,0,0,0.3);
              "></div>`,
              iconSize: [8, 8],
              iconAnchor: [4, 4]
            });
          };

          const marker = window.L.marker([parcelle.latitude, parcelle.longitude], {
            icon: getMarkerIcon(parcelle.type)
          }).addTo(mapInstanceRef.current);

          // Popup simple
          const popupContent = 
            `<div style="font-family: Arial, sans-serif; font-size: 12px; color: #333;">
              <strong>${parcelle.nom}</strong><br/>
              ${parcelle.type} - ${parcelle.superficie}
            </div>`;
          
          marker.bindPopup(popupContent, {
            closeButton: false,
            offset: [0, -5],
            className: 'custom-popup'
          });

          marker.on('click', () => {
            if (onParcelleClick) {
              onParcelleClick(parcelle);
            }
          });

          newMarkers.push(marker);
        }
      });

      markersRef.current = newMarkers;
    }
  }, [parcellesFiltrees, onParcelleClick]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Carte */}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%'
        }}
      />
      
      {/* Logo Google en bas à gauche */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        fontFamily: 'Arial, sans-serif'
      }}>
        Google
      </div>

      {/* Bouton de recherche en haut à droite */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        width: '40px',
        height: '40px',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid #666',
          borderRadius: '50%',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            right: '-6px',
            bottom: '-6px',
            width: '6px',
            height: '2px',
            backgroundColor: '#666',
            transform: 'rotate(45deg)'
          }}></div>
        </div>
      </div>

      {/* Raccourcis en bas à droite */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        fontSize: '11px',
        color: '#fff',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        textAlign: 'right',
        fontFamily: 'Arial, sans-serif'
      }}>
        Raccourcis
      </div>
    </div>
  );
};

// Exemple d'utilisation avec des parcelles réparties sur toute la Tunisie
const ExempleUtilisation: React.FC = () => {
  const [selectedParcelle, setSelectedParcelle] = useState<Parcelle | null>(null);

  // Données d'exemple avec coordonnées précises pour la Tunisie
  const parcelles: Parcelle[] = [
    // Nord - Tunis et environs
    { id: 1, nom: "Tunis Centre", latitude: 36.8065, longitude: 10.1815, superficie: "1200m²", type: "Commercial" },
    { id: 2, nom: "La Marsa", latitude: 36.8780, longitude: 10.3247, superficie: "800m²", type: "Résidentiel" },
    { id: 3, nom: "Bizerte", latitude: 37.2744, longitude: 9.8739, superficie: "2000m²", type: "Industriel" },
    { id: 4, nom: "Nabeul", latitude: 36.4560, longitude: 10.7370, superficie: "1500m²", type: "Touristique" },
    { id: 5, nom: "Hammamet", latitude: 36.4002, longitude: 10.6167, superficie: "1800m²", type: "Touristique" },
    { id: 6, nom: "Ben Arous", latitude: 36.7540, longitude: 10.2176, superficie: "900m²", type: "Résidentiel" },
    { id: 7, nom: "Ariana", latitude: 36.8625, longitude: 10.1647, superficie: "1100m²", type: "Résidentiel" },
    { id: 8, nom: "Zaghouan", latitude: 36.4029, longitude: 10.1428, superficie: "5ha", type: "Agricole" },
    
    // Centre - Sousse, Monastir, Kairouan
    { id: 9, nom: "Sousse", latitude: 35.8256, longitude: 10.6369, superficie: "1600m²", type: "Commercial" },
    { id: 10, nom: "Monastir", latitude: 35.7773, longitude: 10.8263, superficie: "1300m²", type: "Touristique" },
    { id: 11, nom: "Kairouan", latitude: 35.6781, longitude: 10.0963, superficie: "8ha", type: "Agricole" },
    { id: 12, nom: "Mahdia", latitude: 35.5047, longitude: 11.0624, superficie: "1400m²", type: "Touristique" },
    { id: 13, nom: "Sfax", latitude: 34.7406, longitude: 10.7603, superficie: "2200m²", type: "Industriel" },
    { id: 14, nom: "Kasserine", latitude: 35.1674, longitude: 8.8363, superficie: "12ha", type: "Agricole" },
    { id: 15, nom: "Sidi Bouzid", latitude: 35.0388, longitude: 9.4844, superficie: "15ha", type: "Agricole" },
    
    // Sud - Gabès, Médenine, Gafsa
    { id: 16, nom: "Gabès", latitude: 33.8815, longitude: 10.0982, superficie: "6ha", type: "Agricole" },
    { id: 17, nom: "Médenine", latitude: 33.3549, longitude: 10.5055, superficie: "1700m²", type: "Commercial" },
    { id: 18, nom: "Djerba", latitude: 33.8076, longitude: 10.8451, superficie: "2500m²", type: "Touristique" },
    { id: 19, nom: "Gafsa", latitude: 34.4250, longitude: 8.7842, superficie: "8ha", type: "Industriel" },
    { id: 20, nom: "Tozeur", latitude: 33.9197, longitude: 8.1347, superficie: "3ha", type: "Agricole" },
    { id: 21, nom: "Tataouine", latitude: 32.9297, longitude: 10.4517, superficie: "1200m²", type: "Résidentiel" },
    
    // Ouest
    { id: 22, nom: "Le Kef", latitude: 36.1699, longitude: 8.7049, superficie: "10ha", type: "Agricole" },
    { id: 23, nom: "Siliana", latitude: 36.0853, longitude: 9.3706, superficie: "7ha", type: "Agricole" },
    { id: 24, nom: "Jendouba", latitude: 36.5011, longitude: 8.7803, superficie: "4ha", type: "Agricole" },
    { id: 25, nom: "Béja", latitude: 36.7256, longitude: 9.1844, superficie: "6ha", type: "Agricole" },
    
    // Points supplémentaires pour plus de densité
    { id: 26, nom: "Korbous", latitude: 36.8389, longitude: 10.5833, superficie: "900m²", type: "Touristique" },
    { id: 27, nom: "Kelibia", latitude: 36.8472, longitude: 11.0944, superficie: "1100m²", type: "Résidentiel" },
    { id: 28, nom: "Grombalia", latitude: 36.6000, longitude: 10.5000, superficie: "1300m²", type: "Mixte" },
    { id: 29, nom: "Menzel Bourguiba", latitude: 37.1544, longitude: 9.7847, superficie: "1600m²", type: "Industriel" },
    { id: 30, nom: "Mateur", latitude: 37.0403, longitude: 9.6658, superficie: "800m²", type: "Résidentiel" },
    { id: 31, nom: "Ferryville", latitude: 37.1767, longitude: 9.9300, superficie: "1000m²", type: "Commercial" },
    { id: 32, nom: "Menzel Temime", latitude: 36.7833, longitude: 10.9833, superficie: "1200m²", type: "Résidentiel" },
    { id: 33, nom: "Soliman", latitude: 36.7167, longitude: 10.4833, superficie: "700m²", type: "Résidentiel" },
    { id: 34, nom: "Korba", latitude: 36.5783, longitude: 10.8589, superficie: "950m²", type: "Résidentiel" },
    { id: 35, nom: "Menzel Bouzelfa", latitude: 36.6833, longitude: 10.5833, superficie: "1100m²", type: "Mixte" }
  ];

  const handleParcelleClick = (parcelle: Parcelle): void => {
    setSelectedParcelle(parcelle);
    console.log('Parcelle sélectionnée:', parcelle);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', fontFamily: 'Arial, sans-serif' }}>
      <CarteInteractive 
        parcellesFiltrees={parcelles}
        onParcelleClick={handleParcelleClick}
      />
    </div>
  );
};

export default ExempleUtilisation;