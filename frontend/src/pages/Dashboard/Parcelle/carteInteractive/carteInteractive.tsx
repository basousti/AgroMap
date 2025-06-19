import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Types TypeScript
interface Parcelle {
  id: number;
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

interface CarteInteractiveProps {
  parcellesFiltrees?: Parcelle[];
  onParcelleClick?: (parcelle: Parcelle) => void;
  nouvelleParcelle?: Parcelle | null;
  onNouvelleParcelleTraitee?: () => void;
  forceUpdate?: boolean;
  showWelcomeMessage?: boolean;
  onReturnToForm?: () => void;
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
  onParcelleClick,
  nouvelleParcelle: propNouvelleParcelle,
  onNouvelleParcelleTraitee,
  forceUpdate = false,
  showWelcomeMessage: propShowWelcomeMessage = false,
  onReturnToForm: propOnReturnToForm
}) => {
  // Hooks de navigation pour récupérer les données
  const location = useLocation();
  const navigate = useNavigate();
  
  // Récupérer les données passées via location.state
  const { 
    nouvelleParcelle: stateNouvelleParcelle, 
    fromFormulaire = false,
    showSuccessMessage = false 
  } = location.state || {};
  
  // Déterminer quelle parcelle utiliser (props ou state)
  const nouvelleParcelle = stateNouvelleParcelle || propNouvelleParcelle;
  const showWelcomeMessage = showSuccessMessage || propShowWelcomeMessage;
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [parcellesEnregistrees, setParcellesEnregistrees] = useState<Parcelle[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showDeleteNotification, setShowDeleteNotification] = useState(false);
  const [deletedParcelleNom, setDeletedParcelleNom] = useState('');

  // Fonction pour retourner au formulaire
  const handleReturnProfile = () => {
    if (propOnReturnToForm) {
      propOnReturnToForm();
    } else {
      navigate('/DashboardE');
    }
  };

  const handleReturnToForm = () => {
      navigate('/dashboard-parcelles');
  };

  // ✨ NOUVEAU: Fonction pour éditer une parcelle
  const handleEditParcelle = (parcelle: Parcelle) => {
    console.log('🔧 Édition de la parcelle:', parcelle.nom);
    
    // Sauvegarder la parcelle à éditer dans localStorage pour la récupérer dans le formulaire
    localStorage.setItem('parcelleAEditer', JSON.stringify(parcelle));
    localStorage.setItem('modeEdition', 'true');
    
    // Naviguer vers le formulaire avec les données de la parcelle
    navigate('/formulaireParcelle', {
      state: {
        parcelleAEditer: parcelle,
        modeEdition: true,
        fromCarte: true
      }
    });
  };

  // ✨ NOUVEAU: Fonction pour supprimer une parcelle
  const handleDeleteParcelle = (parcelle: Parcelle) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the plot "${parcelle.nom}"?\n\nThis action is irreversible.`
    );
    
    if (confirmDelete) {
      console.log('🗑️ Suppression de la parcelle:', parcelle.nom);
      
      // Supprimer la parcelle de la liste
      setParcellesEnregistrees(prev => {
        const updated = prev.filter(p => p.id !== parcelle.id);
        
        // Sauvegarder immédiatement dans localStorage
        sauvegarderParcelles(updated);
        
        // Afficher notification de suppression
        setDeletedParcelleNom(parcelle.nom);
        setShowDeleteNotification(true);
        setTimeout(() => setShowDeleteNotification(false), 4000);
        
        return updated;
      });
      
      // Nettoyer et redessiner les marqueurs
      setTimeout(() => {
        nettoyerMarqueurs();
        // Les parcelles restantes seront redessinées automatiquement par l'effet useEffect
      }, 100);
    }
  };

  // Fonction pour obtenir la couleur selon la culture
  const getCultureColor = (culture: string) => {
    switch (culture) {
      case 'Tomate':
        return {
          color: '#dc2626',
          fillColor: '#fca5a5',
          fillOpacity: 0.7,
          weight: 3
        };
      case 'Piment':
        return {
          color: '#dc2626',
          fillColor: '#fca5a5',
          fillOpacity: 0.7,
          weight: 3
        };
      case 'Poivron':
        return {
          color: '#059669',
          fillColor: '#86efac',
          fillOpacity: 0.7,
          weight: 3
        };
      default:
        return {
          color: '#ff6b35',
          fillColor: '#32cd32',
          fillOpacity: 0.6,
          weight: 3
        };
    }
  };

  // Fonction pour obtenir l'icône selon le statut
  const getStatusIcon = (statut?: string) => {
    switch (statut) {
      case 'repos':
        return '😴';
      case 'preparation':
        return '🚧';
      case 'active':
        return '✅';
      default:
        return '📍';
    }
  };

  // Fonction pour obtenir l'icône selon la culture
  const getCultureIcon = (culture?: string) => {
    switch (culture) {
      case 'Tomate':
        return '🍅';
      case 'Piment':
        return '🌶️';
      case 'Poivron':
        return '🫑';
      default:
        return '🌱';
    }
  };

  // Fonction pour obtenir le centre d'une forme
  const getLayerCenter = (layer: any, formeType?: string) => {
    if (!layer) return null;

    try {
      if (formeType === 'polygon' || formeType === 'rectangle') {
        const bounds = layer.getBounds();
        return bounds ? bounds.getCenter() : null;
      } else if (formeType === 'circle') {
        return layer.getLatLng();
      } else {
        if (layer.getBounds) {
          const bounds = layer.getBounds();
          return bounds ? bounds.getCenter() : null;
        } else if (layer.getLatLng) {
          return layer.getLatLng();
        }
      }
    } catch (error) {
      console.warn('Erreur lors du calcul du centre:', error);
      try {
        if (layer.getLatLng) return layer.getLatLng();
        if (layer.getBounds) {
          const bounds = layer.getBounds();
          return bounds ? bounds.getCenter() : null;
        }
      } catch (fallbackError) {
        console.warn('Erreur fallback:', fallbackError);
      }
    }
    return null;
  };

  // Fonction pour ajouter un marqueur de statut
  const ajouterMarqueurStatut = (center: any, statut: string, parcelleNom: string = '') => {
    if (!mapInstanceRef.current || !window.L || !center) {
      console.warn('❌ Impossible d\'ajouter le marqueur de statut:', { 
        map: !!mapInstanceRef.current, 
        L: !!window.L, 
        center: center 
      });
      return;
    }

    const L = window.L;
    const statusIcon = getStatusIcon(statut);
    const statusColors = {
      'repos': '#f59e0b',
      'preparation': '#3b82f6', 
      'active': '#10b981'
    };

    const couleur = statusColors[statut as keyof typeof statusColors] || '#6b7280';

    try {
      const statusMarker = L.marker([center.lat, center.lng], {
        icon: L.divIcon({
          className: 'status-marker-custom',
          html: `
            <div style="
              position: relative;
              width: 40px;
              height: 40px;
              background: ${couleur};
              border: 3px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              color: white;
              font-weight: bold;
              box-shadow: 0 4px 15px rgba(0,0,0,0.5);
              z-index: 10000;
              cursor: pointer;
              animation: statusBounce 2s infinite;
            ">
              ${statusIcon}
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        }),
        zIndexOffset: 5000,
        riseOnHover: true
      });

      statusMarker.bindTooltip(`
        <div style="text-align: center; font-weight: bold;">
          ${statusIcon} ${statut.toUpperCase()}
          ${parcelleNom ? '<br/>' + parcelleNom : ''}
        </div>
      `, {
        permanent: false,
        direction: 'top',
        offset: [0, -25],
        className: 'status-tooltip'
      });

      statusMarker.addTo(mapInstanceRef.current);
      markersRef.current.push(statusMarker);
      
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);

      return statusMarker;
      
    } catch (error) {
      console.error('❌ ERREUR lors de la création du marqueur de statut:', error);
      return null;
    }
  };

  // ✨ MODIFIÉ: Fonction pour créer le contenu du popup avec boutons d'édition et suppression
  const creerPopupContent = (parcelle: Parcelle): string => {
    const cultureIcon = getCultureIcon(parcelle.culture);
    const statusIcon = getStatusIcon(parcelle.statut);
    const cultureColors = getCultureColor(parcelle.culture || '');

    return `
      <div style="font-family: 'Inter', sans-serif; padding: 20px; min-width: 340px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 16px; border: 3px solid ${cultureColors.color}; box-shadow: 0 8px 25px rgba(0,0,0,0.15);">
        <div style="text-align: center; margin-bottom: 16px;">
          <h3 style="margin: 0; color: ${cultureColors.color}; font-weight: 800; font-size: 1.3rem; display: flex; align-items: center; justify-content: center; gap: 10px;">
            ${cultureIcon} ${parcelle.nom}
          </h3>
          <div style="margin-top: 8px;">
            <span style="background: linear-gradient(135deg, ${cultureColors.color}, ${cultureColors.color}DD); color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-right: 8px;">
              ${parcelle.culture || 'Culture'}
            </span>
            <span style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
              ${statusIcon} ${parcelle.statut || 'Statut'}
            </span>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0;">
          <div style="padding: 16px; background: linear-gradient(135deg, ${cultureColors.fillColor}30, ${cultureColors.fillColor}10); border-radius: 12px; border: 2px solid ${cultureColors.color}40; text-align: center;">
            <div style="color: #374151; font-size: 13px; font-weight: 700; margin-bottom: 6px; text-transform: uppercase;">📐 Surface</div>
            <div style="color: ${cultureColors.color}; font-weight: 800; font-size: 20px; line-height: 1;">${parcelle.superficie || parcelle.surfaceTotale + ' m²'}</div>
            ${parcelle.surfaceTotale ? `<div style="color: #6b7280; font-size: 11px; margin-top: 4px;">${(parcelle.surfaceTotale/10000).toFixed(3)} hectares</div>` : ''}
          </div>
          
          <div style="padding: 16px; background: linear-gradient(135deg, #fef3c7, #fef3c710); border-radius: 12px; border: 2px solid #f59e0b40; text-align: center;">
            <div style="color: #374151; font-size: 13px; font-weight: 700; margin-bottom: 6px; text-transform: uppercase;">${statusIcon} Statut</div>
            <div style="color: #d97706; font-weight: 800; font-size: 16px; text-transform: capitalize; line-height: 1;">${parcelle.statut || 'Non défini'}</div>
            <div style="color: #92400e; font-size: 11px; margin-top: 4px;">État actuel</div>
          </div>
        </div>
        
        <div style="margin: 20px 0; padding: 16px; background: linear-gradient(135deg, #f0f9ff, #f0f9ff50); border-radius: 12px; border: 2px solid #0ea5e940;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
            ${parcelle.montantInvestissement ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">💰</span>
                <div>
                  <div style="font-weight: 700; color: #374151;">Investissement</div>
                  <div style="color: #059669; font-weight: 600;">${parcelle.montantInvestissement} TND</div>
                </div>
              </div>
            ` : ''}
            ${parcelle.farmerId ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: #3b82f6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">👤</span>
                <div>
                  <div style="font-weight: 700; color: #374151;">Agriculteur</div>
                  <div style="color: #1d4ed8; font-weight: 600;">${parcelle.farmerId}</div>
                </div>
              </div>
            ` : ''}
            ${parcelle.dateCreation ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">📅</span>
                <div>
                  <div style="font-weight: 700; color: #374151;">Date création</div>
                  <div style="color: #7c3aed; font-weight: 600;">${new Date(parcelle.dateCreation).toLocaleDateString('fr-TN')}</div>
                </div>
              </div>
            ` : ''}
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #ef4444; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">📍</span>
              <div>
                <div style="font-weight: 700; color: #374151;">Coordonnées</div>
                <div style="color: #dc2626; font-weight: 600; font-size: 11px;">${parcelle.latitude.toFixed(4)}, ${parcelle.longitude.toFixed(4)}</div>
              </div>
            </div>
            ${parcelle.drawnParcels && parcelle.drawnParcels.length > 0 ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">🎨</span>
                <div>
                  <div style="font-weight: 700; color: #374151;">Formes dessinées</div>
                  <div style="color: #d97706; font-weight: 600;">${parcelle.drawnParcels.length} parcelle${parcelle.drawnParcels.length > 1 ? 's' : ''}</div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
        
        ${parcelle.drawnParcels && parcelle.drawnParcels.length > 0 ? `
          <div style="margin: 16px 0; padding: 12px; background: linear-gradient(135deg, ${cultureColors.fillColor}20, ${cultureColors.fillColor}05); border-radius: 10px; border: 1px solid ${cultureColors.color}30;">
            <div style="font-weight: 700; color: ${cultureColors.color}; margin-bottom: 8px; font-size: 12px; text-transform: uppercase;">📊 Détails des parcelles:</div>
            ${parcelle.drawnParcels.map((drawn, index) => `
              <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; display: flex; justify-content: space-between;">
                <span>${drawn.type} #${index + 1}</span>
                <span style="font-weight: 600; color: ${cultureColors.color};">${drawn.area} m²</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div style="display: flex; gap: 8px; margin-top: 20px; justify-content: center;">
          <button onclick="window.editParcelle_${parcelle.id}()" 
                  style="flex: 1; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; padding: 10px 16px; border-radius: 20px; cursor: pointer; font-size: 11px; font-weight: 700; box-shadow: 0 3px 10px rgba(59, 130, 246, 0.3); text-transform: uppercase; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 4px;">
            ✏️ Éditer
          </button>
          <button onclick="window.deleteParcelle_${parcelle.id}()" 
                  style="flex: 1; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; padding: 10px 16px; border-radius: 20px; cursor: pointer; font-size: 11px; font-weight: 700; box-shadow: 0 3px 10px rgba(239, 68, 68, 0.3); text-transform: uppercase; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 4px;">
            🗑️ Supprimer
          </button>
          <button onclick="this.closest('.leaflet-popup-content-wrapper').parentNode.style.display='none'" 
                  style="flex: 0.8; background: linear-gradient(135deg, ${cultureColors.color}, ${cultureColors.color}DD); color: white; border: none; padding: 10px 16px; border-radius: 20px; cursor: pointer; font-size: 11px; font-weight: 700; box-shadow: 0 3px 10px rgba(0,0,0,0.15); text-transform: uppercase; transition: all 0.3s ease;">
            ✅ Fermer
          </button>
        </div>
      </div>
    `;
  };

  // Fonction améliorée pour dessiner une parcelle sur la carte
  const dessinerParcelleSurCarte = (parcelle: Parcelle) => {
    if (!mapInstanceRef.current || !window.L) {
      console.warn('Impossible de dessiner la parcelle - carte non initialisée');
      return;
    }

    const L = window.L;
    const cultureColors = getCultureColor(parcelle.culture || '');

    // ✨ NOUVEAU: Ajouter les fonctions globales pour l'édition et la suppression
    (window as any)[`editParcelle_${parcelle.id}`] = () => handleEditParcelle(parcelle);
    (window as any)[`deleteParcelle_${parcelle.id}`] = () => handleDeleteParcelle(parcelle);

    try {
      // Si la parcelle vient du formulaire avec drawnParcels
      if (parcelle.drawnParcels && parcelle.drawnParcels.length > 0) {
        console.log('🎨 Dessin de parcelle du formulaire:', parcelle.nom, 'avec', parcelle.drawnParcels.length, 'formes');
        
        parcelle.drawnParcels.forEach((drawnParcel: any, index: number) => {
          let layer: any = null;

          // Créer la forme selon le type
          if (drawnParcel.type === 'polygon' && Array.isArray(drawnParcel.coords)) {
            layer = L.polygon(drawnParcel.coords, {
              ...cultureColors,
              opacity: 0.9,
              fillOpacity: 0.7,
              weight: 4
            });
          } else if (drawnParcel.type === 'rectangle' && Array.isArray(drawnParcel.coords) && drawnParcel.coords.length === 2) {
            layer = L.rectangle(drawnParcel.coords, {
              ...cultureColors,
              opacity: 0.9,
              fillOpacity: 0.7,
              weight: 4
            });
          } else if (drawnParcel.type === 'circle' && drawnParcel.coords && drawnParcel.radius) {
            layer = L.circle(drawnParcel.coords, {
              radius: drawnParcel.radius,
              ...cultureColors,
              opacity: 0.9,
              fillOpacity: 0.7,
              weight: 4
            });
          }

          if (layer) {
            layer.addTo(mapInstanceRef.current);

            // Créer le popup pour cette forme spécifique avec boutons d'action
            const popupContent = `
              <div style="font-family: 'Inter', sans-serif; padding: 12px; min-width: 250px; background: white; border-radius: 12px; border: 2px solid ${cultureColors.color}; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 10px;">
                  <h4 style="margin: 0; color: ${cultureColors.color}; font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    ${getCultureIcon(parcelle.culture)} ${parcelle.nom}
                  </h4>
                  <div style="margin-top: 4px; font-size: 11px;">
                    <span style="background: ${cultureColors.color}; color: white; padding: 3px 8px; border-radius: 12px; font-weight: 600; margin-right: 4px;">
                      ${parcelle.culture}
                    </span>
                    <span style="background: #10b981; color: white; padding: 3px 8px; border-radius: 12px; font-weight: 600;">
                      ${getStatusIcon(parcelle.statut)} ${parcelle.statut}
                    </span>
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                  <div style="padding: 8px; background: ${cultureColors.fillColor}20; border-radius: 8px; text-align: center;">
                    <div style="color: #666; font-size: 10px; font-weight: 600; margin-bottom: 2px;">CETTE FORME</div>
                    <div style="color: ${cultureColors.color}; font-weight: 700; font-size: 14px;">${drawnParcel.area} m²</div>
                  </div>
                  
                  <div style="padding: 8px; background: #10b98120; border-radius: 8px; text-align: center;">
                    <div style="color: #666; font-size: 10px; font-weight: 600; margin-bottom: 2px;">TOTAL PARCELLE</div>
                    <div style="color: #10b981; font-weight: 700; font-size: 14px;">${parcelle.surfaceTotale || drawnParcel.area} m²</div>
                  </div>
                </div>

                ${parcelle.montantInvestissement ? `
                <div style="padding: 6px; background: #fbbf2420; border-radius: 6px; text-align: center; margin-bottom: 8px;">
                  <div style="color: #b45309; font-size: 12px; font-weight: 600;">💰 ${parcelle.montantInvestissement} TND</div>
                </div>
                ` : ''}

                <div style="font-size: 10px; color: #666; text-align: center; margin-bottom: 10px;">
                  <div>📏 ${drawnParcel.perimeter}m • 🎨 ${drawnParcel.type} #${index + 1}</div>
                  ${parcelle.farmerId ? `<div style="margin-top: 2px;">👤 ${parcelle.farmerId}</div>` : ''}
                </div>

                <div style="display: flex; gap: 6px; margin-top: 8px;">
                  <button onclick="window.editParcelle_${parcelle.id}()" 
                          style="flex: 1; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; padding: 8px 12px; border-radius: 15px; cursor: pointer; font-size: 10px; font-weight: 700; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);">
                    ✏️ Éditer
                  </button>
                  <button onclick="window.deleteParcelle_${parcelle.id}()" 
                          style="flex: 1; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; padding: 8px 12px; border-radius: 15px; cursor: pointer; font-size: 10px; font-weight: 700; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);">
                    🗑️ Suppr.
                  </button>
                </div>
              </div>
            `;

            layer.bindPopup(popupContent, {
              closeButton: true,
              offset: [0, -10],
              className: 'custom-popup-compact',
              maxWidth: 280,
              minWidth: 250
            });

            // Ajouter un marqueur de statut au centre
            if (parcelle.statut) {
              let center = null;
              
              try {
                if (drawnParcel.type === 'polygon' && Array.isArray(drawnParcel.coords)) {
                  if (layer && layer.getBounds) {
                    const bounds = layer.getBounds();
                    center = bounds.getCenter();
                  }
                  
                  if (!center && drawnParcel.coords.length > 0) {
                    let latSum = 0, lngSum = 0;
                    const coords = drawnParcel.coords[0] || drawnParcel.coords;
                    coords.forEach((coord: any) => {
                      if (coord.lat !== undefined && coord.lng !== undefined) {
                        latSum += coord.lat;
                        lngSum += coord.lng;
                      }
                    });
                    center = {
                      lat: latSum / coords.length,
                      lng: lngSum / coords.length
                    };
                  }
                  
                } else if (drawnParcel.type === 'rectangle') {
                  if (layer && layer.getBounds) {
                    const bounds = layer.getBounds();
                    center = bounds.getCenter();
                  }
                  
                } else if (drawnParcel.type === 'circle' && drawnParcel.coords) {
                  center = drawnParcel.coords;
                }
                
                if (center && center.lat && center.lng) {
                  const marqueur = ajouterMarqueurStatut(center, parcelle.statut, `${parcelle.nom} - Forme ${index + 1}`);
                }
                
              } catch (error) {
                console.error('❌ Erreur lors du calcul du centre:', error);
              }
            }

            // Gérer le clic
            layer.on('click', () => {
              if (onParcelleClick) {
                onParcelleClick(parcelle);
              }
            });

            markersRef.current.push(layer);
          }
        });

        console.log('✅ Parcelle du formulaire dessinée:', parcelle.nom);
        return;
      }

      // Logique existante pour les parcelles avec coordonnées simples
      if (parcelle.coordonnees && parcelle.formeType) {
        let layer: any = null;

        if (parcelle.formeType === 'polygon' && Array.isArray(parcelle.coordonnees)) {
          layer = L.polygon(parcelle.coordonnees, cultureColors);
        } else if (parcelle.formeType === 'rectangle' && Array.isArray(parcelle.coordonnees) && parcelle.coordonnees.length === 2) {
          layer = L.rectangle(parcelle.coordonnees, cultureColors);
        } else if (parcelle.formeType === 'circle' && parcelle.coordonnees.center && parcelle.coordonnees.radius) {
          layer = L.circle(parcelle.coordonnees.center, {
            radius: parcelle.coordonnees.radius,
            ...cultureColors
          });
        } else {
          // Fallback: créer un marqueur simple
          layer = L.marker([parcelle.latitude, parcelle.longitude], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: `<div style="
                background-color: ${cultureColors.color};
                width: 14px;
                height: 14px;
                border-radius: 50%;
                border: 3px solid rgba(255,255,255,0.9);
                box-shadow: 0 3px 6px rgba(0,0,0,0.4);
              "></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          });
        }

        if (layer) {
          layer.addTo(mapInstanceRef.current);

          // Créer le popup avec toutes les informations
          const popupContent = creerPopupContent(parcelle);
          layer.bindPopup(popupContent, {
            closeButton: true,
            offset: [0, -10],
            className: 'custom-popup-parcelle',
            maxWidth: 400
          });

          // Ajouter un marqueur de statut au centre si la forme n'est pas un marqueur simple
          if (parcelle.formeType !== 'marker' && parcelle.statut) {
            const center = getLayerCenter(layer, parcelle.formeType);
            if (center) {
              ajouterMarqueurStatut(center, parcelle.statut);
            }
          }

          // Gérer le clic
          layer.on('click', () => {
            if (onParcelleClick) {
              onParcelleClick(parcelle);
            }
          });

          markersRef.current.push(layer);
          console.log('✅ Parcelle dessinée sur la carte:', parcelle.nom);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du dessin de la parcelle:', error);
    }
  };

  // Fonction de test pour forcer l'affichage des marqueurs
  const testerMarqueurs = () => {
    if (!mapInstanceRef.current || !window.L) {
      console.log('❌ Carte non initialisée pour test');
      return;
    }

    console.log('🧪 TEST: Ajout de marqueurs de test');
    
    const villesTest = [
      { nom: 'Tunis', lat: 36.8065, lng: 10.1815, statut: 'active' },
      { nom: 'Sousse', lat: 35.8256, lng: 10.6369, statut: 'preparation' },
      { nom: 'Sfax', lat: 34.7406, lng: 10.7603, statut: 'repos' }
    ];

    villesTest.forEach(ville => {
      ajouterMarqueurStatut(
        { lat: ville.lat, lng: ville.lng },
        ville.statut as any,
        `TEST - ${ville.nom}`
      );
    });

    console.log('✅ Marqueurs de test ajoutés');
  };

  const nettoyerMarqueurs = () => {
    markersRef.current.forEach((marker: any) => {
      try {
        if (mapInstanceRef.current && marker) {
          mapInstanceRef.current.removeLayer(marker);
        }
      } catch (error) {
        console.warn('Erreur lors de la suppression d\'un marqueur:', error);
      }
    });
    markersRef.current = [];
  };

  // Fonction pour sauvegarder dans localStorage
  const sauvegarderParcelles = (parcelles: Parcelle[]) => {
    try {
      localStorage.setItem('parcellesEnregistrees', JSON.stringify(parcelles));
      console.log('💾 Parcelles sauvegardées dans localStorage:', parcelles.length);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  };

  // Fonction pour charger depuis localStorage
  const chargerParcellesSauvegardees = (): Parcelle[] => {
    try {
      const saved = localStorage.getItem('parcellesEnregistrees');
      if (saved) {
        const parcelles = JSON.parse(saved);
        console.log('📋 Parcelles chargées depuis localStorage:', parcelles.length);
        return parcelles;
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
    }
    return [];
  };

  // Effet pour charger les parcelles sauvegardées au démarrage
  useEffect(() => {
    if (isInitialized) {
      const savedParcelles = chargerParcellesSauvegardees();
      if (savedParcelles.length > 0) {
        setParcellesEnregistrees(savedParcelles);
        console.log('🔄 Parcelles chargées au démarrage:', savedParcelles.length);
      }
    }
  }, [isInitialized]);

  // Effet pour vérifier localStorage après navigation depuis formulaire
  useEffect(() => {
    const checkForSavedData = () => {
      try {
        const fromFormulaire = localStorage.getItem('navigationFromFormulaire');
        const derniereParcelle = localStorage.getItem('derniereParcelle');
        
        if (fromFormulaire === 'true' && derniereParcelle) {
          const parcelleData = JSON.parse(derniereParcelle);
          console.log('🔍 Nouvelle parcelle trouvée dans localStorage:', parcelleData);
          
          setParcellesEnregistrees(prev => {
            const existe = prev.some(p => p.id === parcelleData.id);
            if (!existe) {
              console.log('➕ Ajout de la nouvelle parcelle depuis localStorage');
              const updated = [...prev, parcelleData];
              
              sauvegarderParcelles(updated);
              
              setShowSuccessNotification(true);
              setTimeout(() => setShowSuccessNotification(false), 5000);
              
              setTimeout(() => {
                dessinerParcelleSurCarte(parcelleData);
                if (parcelleData.latitude && parcelleData.longitude) {
                  mapInstanceRef.current?.setView([parcelleData.latitude, parcelleData.longitude], 15, {
                    animate: true,
                    duration: 1.5
                  });
                }
              }, 500);
              
              return updated;
            } else {
              console.log('⚠️ Parcelle déjà existante, pas d\'ajout');
              return prev;
            }
          });
          
          localStorage.removeItem('navigationFromFormulaire');
          localStorage.removeItem('derniereParcelle');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des données:', error);
      }
    };
    
    if (isInitialized) {
      checkForSavedData();
    }
  }, [isInitialized]);

  // ✨ MODIFIÉ: Effet pour traiter les nouvelles parcelles du formulaire (avec gestion édition)
  useEffect(() => {
    if (nouvelleParcelle && mapInstanceRef.current && window.L && isInitialized) {
      console.log('🆕 Nouvelle parcelle reçue via props/state:', nouvelleParcelle);
      
      setParcellesEnregistrees(prev => {
        // Vérifier si c'est une édition (même ID) ou une nouvelle parcelle
        const existingIndex = prev.findIndex(p => p.id === nouvelleParcelle.id);
        
        if (existingIndex !== -1) {
          // C'est une édition, remplacer la parcelle existante
          console.log('🔧 Mise à jour de la parcelle existante:', nouvelleParcelle.nom);
          const updated = [...prev];
          updated[existingIndex] = nouvelleParcelle;
          
          sauvegarderParcelles(updated);
          
          setShowSuccessNotification(true);
          setTimeout(() => setShowSuccessNotification(false), 5000);
          
          setTimeout(() => {
            nettoyerMarqueurs(); // Nettoyer avant de redessiner
            dessinerParcelleSurCarte(nouvelleParcelle);
            
            if (nouvelleParcelle.latitude && nouvelleParcelle.longitude) {
              mapInstanceRef.current.setView([nouvelleParcelle.latitude, nouvelleParcelle.longitude], 15, {
                animate: true,
                duration: 1.5
              });
            }
          }, 300);
          
          return updated;
        } else {
          // Nouvelle parcelle
          console.log('💾 Ajout de la nouvelle parcelle à la liste enregistrée');
          const updated = [...prev, nouvelleParcelle];
          
          sauvegarderParcelles(updated);
          
          if (showWelcomeMessage || fromFormulaire) {
            setShowSuccessNotification(true);
            setTimeout(() => setShowSuccessNotification(false), 5000);
          }
          
          setTimeout(() => {
            dessinerParcelleSurCarte(nouvelleParcelle);
            
            if (nouvelleParcelle.latitude && nouvelleParcelle.longitude) {
              mapInstanceRef.current.setView([nouvelleParcelle.latitude, nouvelleParcelle.longitude], 15, {
                animate: true,
                duration: 1.5
              });
              console.log('🎯 Zoom animé sur la nouvelle parcelle');
            }
          }, 300);
          
          return updated;
        }
      });
      
      if (onNouvelleParcelleTraitee) {
        onNouvelleParcelleTraitee();
      }
      
      if (fromFormulaire && stateNouvelleParcelle) {
        setTimeout(() => {
          navigate('/carte-interactive', { 
            state: null,
            replace: true 
          });
        }, 2000);
      }
    }
  }, [nouvelleParcelle, onNouvelleParcelleTraitee, isInitialized, showWelcomeMessage, fromFormulaire, navigate, stateNouvelleParcelle]);

  // Effet pour sauvegarder automatiquement quand les parcelles changent
  useEffect(() => {
    if (parcellesEnregistrees.length > 0 && isInitialized) {
      sauvegarderParcelles(parcellesEnregistrees);
    }
  }, [parcellesEnregistrees, isInitialized]);

  // Fonction pour charger Leaflet
  const loadLeaflet = (): Promise<void> => {
    return new Promise((resolve) => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
        document.head.appendChild(link);
      }

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

  // Initialisation de la carte
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        setIsLoading(true);
        await loadLeaflet();

        if (!window.L) return;

        console.log('🗺️ Initialisation de la carte interactive globale...');

        const map = window.L.map(mapRef.current, {
          center: [34.0, 9.5],
          zoom: 8,
          zoomControl: true,
          attributionControl: false,
          maxZoom: 18,
          minZoom: 7,
          zoomAnimation: true,
          fadeAnimation: true,
          markerZoomAnimation: true
        });

        const tunisiaBounds = window.L.latLngBounds(
          [30.0, 7.0],
          [37.5, 12.0]
        );

        map.setMaxBounds(tunisiaBounds);
        map.fitBounds(tunisiaBounds, { padding: [10, 10] });

        window.L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
          maxZoom: 18,
          attribution: '',
          bounds: tunisiaBounds
        }).addTo(map);

        window.L.tileLayer('https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}', {
          maxZoom: 18,
          attribution: '',
          bounds: tunisiaBounds
        }).addTo(map);

        map.on('drag', function() {
          map.panInsideBounds(tunisiaBounds, { animate: false });
        });

        mapInstanceRef.current = map;
        setIsInitialized(true);
        setIsLoading(false);
        console.log('✅ Carte interactive globale initialisée et prête');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la carte:', error);
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsInitialized(false);
      }
    };
  }, []);

  // Effet pour afficher les parcelles
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !isInitialized) return;

    console.log('🔄 Mise à jour des parcelles sur la carte...');

    nettoyerMarqueurs();

    const toutesLesParcelles = [...parcellesFiltrees, ...parcellesEnregistrees];
    console.log('📊 Total des parcelles à afficher:', toutesLesParcelles.length);

    if (toutesLesParcelles.length > 0) {
      toutesLesParcelles.forEach((parcelle: Parcelle) => {
        if (parcelle.latitude && parcelle.longitude &&
            parcelle.latitude >= 30.0 && parcelle.latitude <= 37.5 &&
            parcelle.longitude >= 7.0 && parcelle.longitude <= 12.0) {
          
          if ((parcelle.coordonnees && parcelle.formeType) || (parcelle.drawnParcels && parcelle.drawnParcels.length > 0)) {
            console.log('🎨 Dessin de parcelle complexe:', parcelle.nom);
            dessinerParcelleSurCarte(parcelle);
            return;
          }

          const getMarkerIcon = (type: string) => {
            const colors = {
              'Résidentiel': '#1E88E5',
              'Commercial': '#43A047',
              'Industriel': '#E53935',
              'Agricole': '#FDD835',
              'Touristique': '#8E24AA',
              'Mixte': '#00ACC1',
              'default': '#757575'
            };
            
            const color = colors[type as keyof typeof colors] || colors.default;
            
            return window.L.divIcon({
              className: 'custom-marker',
              html: `<div style="
                background-color: ${color};
                width: 8px;
                height: 8px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.9);
                box-shadow: 0 2px 4px rgba(0,0,0,0.4);
                animation: markerPulse 3s infinite;
              "></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            });
          };

          try {
            // ✨ NOUVEAU: Ajouter les fonctions globales pour les marqueurs simples aussi
            (window as any)[`editParcelle_${parcelle.id}`] = () => handleEditParcelle(parcelle);
            (window as any)[`deleteParcelle_${parcelle.id}`] = () => handleDeleteParcelle(parcelle);

            const marker = window.L.marker([parcelle.latitude, parcelle.longitude], {
              icon: getMarkerIcon(parcelle.type)
            }).addTo(mapInstanceRef.current);

            // ✨ MODIFIÉ: Popup avec boutons d'édition et suppression pour les marqueurs simples
            const popupContent = `
              <div style="font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 12px; min-width: 200px; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 12px;">
                  <strong style="color: #1f2937; font-size: 14px; display: block; margin-bottom: 4px;">${parcelle.nom}</strong>
                  <span style="color: #6b7280; font-size: 11px;">${parcelle.type} - ${parcelle.superficie}</span>
                </div>
                
                <div style="display: flex; gap: 6px; margin-top: 10px;">
                  <button onclick="window.editParcelle_${parcelle.id}()" 
                          style="flex: 1; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; padding: 8px 12px; border-radius: 15px; cursor: pointer; font-size: 10px; font-weight: 700; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);">
                    ✏️ Éditer
                  </button>
                  <button onclick="window.deleteParcelle_${parcelle.id}()" 
                          style="flex: 1; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; padding: 8px 12px; border-radius: 15px; cursor: pointer; font-size: 10px; font-weight: 700; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);">
                    🗑️ Suppr.
                  </button>
                </div>
              </div>
            `;
            
            marker.bindPopup(popupContent, {
              closeButton: true,
              offset: [0, -5],
              className: 'custom-popup',
              maxWidth: 220,
              minWidth: 200
            });

            marker.on('click', () => {
              if (onParcelleClick) {
                onParcelleClick(parcelle);
              }
            });

            markersRef.current.push(marker);
          } catch (error) {
            console.error('Erreur lors de la création d\'un marqueur:', error);
          }
        }
      });
    }

    console.log('✅ Toutes les parcelles affichées sur la carte');
  }, [parcellesFiltrees, parcellesEnregistrees, onParcelleClick, isInitialized, forceUpdate]);

  // Fonction pour effacer toutes les parcelles
  const effacerToutesLesParcelles = () => {
    if (window.confirm('Are you sure you want to delete all saved plots?')) {
      setParcellesEnregistrees([]);
      localStorage.removeItem('parcellesEnregistrees');
      nettoyerMarqueurs();
      console.log('🗑️ Toutes les parcelles effacées');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Loader de chargement */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          color: 'white'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: '700' }}>
            🗺️ Loading the map
          </h2>
          <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
            Initializing the satellite view of Tunisia...
          </p>
        </div>
      )}

      {/* Carte */}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out'
        }}
      />

      {/* ✨ NOUVEAU: Notification de suppression */}
      {showDeleteNotification && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '16px',
          boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: '600',
          maxWidth: '350px',
          animation: 'slideInRight 0.5s ease-out'
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
            🗑️
          </div>
          <div>
            <div style={{ fontWeight: '700', marginBottom: '2px' }}>
              Plot deleted successfully!
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              "{deletedParcelleNom}" has been removed from the map
            </div>
          </div>
        </div>
      )}

      {/* Notification de succès */}
      {showSuccessNotification && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '16px',
          boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: '600',
          maxWidth: '350px',
          animation: 'slideInRight 0.5s ease-out'
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
            ✅
          </div>
          <div>
            <div style={{ fontWeight: '700', marginBottom: '2px' }}>
              Plot updated successfully!
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              Your plot is now visible on the map.
            </div>
          </div>
        </div>
      )}

      {/* Bouton de retour au formulaire */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 2000
      }}>
        <button
          onClick={handleReturnProfile}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center', 
            gap: '8px',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
          }}
        >
          <span style={{ fontSize: '16px' }}>←</span>
             Back to dashboard
        </button>

        <button
          onClick={handleReturnToForm}
          style={{
            background: 'linear-gradient(135deg,rgb(246, 87, 59),rgb(216, 98, 29))',
            margin:'10px',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(246, 181, 59, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
          }}
        >
          <span style={{ fontSize: '16px' }}>←</span>
             Back to Form 
        </button>
      </div>
      
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
        top: '20px',
        right: '20px',
        width: '40px',
        height: '40px',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease',
        zIndex: 1000
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'white';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)';
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
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
        Shortcuts
      </div>

      {/* Bouton de test pour les marqueurs */}
      {isInitialized && (
        <div style={{
          position: 'absolute',
          top: '160px',
          right: '20px',
          zIndex: 2000
        }}>
          <button
            onClick={testerMarqueurs}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)';
            }}
            title="Tester les marqueurs de statut"
          >
            🧪 Marker Test
          </button>
        </div>
      )}

      {/* Indicateur de carte connectée */}
      {isInitialized && (
        <div style={{
          position: 'absolute',
          top: '80px',
          right: '20px',
          background: 'rgba(16, 185, 129, 0.9)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '25px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: 'white',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }}></div>
          Connected Map
        </div>
      )}

      {/* Bouton d'effacement en bas à gauche */}
      {parcellesEnregistrees.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 1000
        }}>
          <button
            onClick={effacerToutesLesParcelles}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
            }}
            title={`Effacer toutes les parcelles (${parcellesEnregistrees.length})`}
          >
            🗑️ Delete ({parcellesEnregistrees.length})
          </button>
        </div>
      )}

      {/* Instructions pour l'utilisateur */}
      {parcellesEnregistrees.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '20px',
          background: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          maxWidth: '250px',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
        }}>
          💡 Click on a plot to see its details and actions
        </div>
      )}

      {/* Compteur de parcelles sauvegardées */}
      {parcellesEnregistrees.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '120px',
          right: '20px',
          background: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
          zIndex: 1000
        }}>
          💾 {parcellesEnregistrees.length} saved{parcellesEnregistrees.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Styles CSS intégrés */}
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
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes markerPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        @keyframes statusBounce {
          0%, 100% { 
            transform: translateY(0px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          }
          50% { 
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.7);
          }
        }
        
        @keyframes statusPulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 1;
          }
          50% { 
            transform: scale(1.1); 
            opacity: 0.8;
          }
        }
        
        .status-marker-custom {
          z-index: 10000 !important;
        }
        
        .status-tooltip {
          background: rgba(0,0,0,0.8) !important;
          color: white !important;
          border: none !important;
          border-radius: 8px !important;
          font-weight: bold !important;
        }
         
        .custom-popup-compact .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          max-width: 280px !important;
          min-width: 250px !important;
          padding: 0;
        }
        
        .custom-popup-compact .leaflet-popup-content {
          margin: 0;
        }
        
        .custom-popup-compact .leaflet-popup-tip {
          background: white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .custom-popup-parcelle .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .custom-popup-parcelle .leaflet-popup-tip {
          background: white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          max-width: 220px !important;
          min-width: 200px !important;
          padding: 0;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 0;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        /* Styles pour les boutons d'action dans les popups */
        .custom-popup button:hover,
        .custom-popup-compact button:hover,
        .custom-popup-parcelle button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default CarteInteractive;