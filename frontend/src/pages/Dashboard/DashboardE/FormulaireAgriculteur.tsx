import React, { useState, ChangeEvent, FormEvent } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./FormulaireAgriculteur.css";

// Définition du type Farmer
interface FarmerData {
  name: string;
  prenom: string;
  email:string;
  localite: string;
  telephone: string;
  adresse: string;
}

const FormulaireAgriculteur: React.FC = () => {
  const navigate = useNavigate();
  const [farmerData, setFarmerData] = useState<FarmerData>({
    name: "",
    prenom: "",
    email:"",
    localite: "",
    telephone: "",
    adresse: "",
  });
  
  // État pour les champs en erreur
  const [errorFields, setErrorFields] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false); // Pour gérer l'état de soumission

  // Fonction pour valider un caractère en fonction du champ
  const validateCharacter = (name: string, char: string): boolean => {
    switch (name) {
      case "name":
      case "prenom":
        // Validation pour nom et prénom: seulement des lettres, espaces et tirets
        return /^[a-zA-ZÀ-ÿ\s-]$/.test(char);
      case "localite":
        // Validation pour localité: lettres, espaces, tirets
        return /^[a-zA-ZÀ-ÿ\s-]$/.test(char);
      case "telephone":
        // Validation pour téléphone: seulement des chiffres, +, espaces et tirets
        return /^[0-9+\s-]$/.test(char);
      case "adresse":
        // Adresse plus permissive mais pas de caractères spéciaux dangereux
        return !/^[*#$%^&()_={}[\]|\\;:"<>?]$/.test(char);
      default:
        return true;
    }
  };

  // Fonction de changement des valeurs d'entrée avec validation
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Si le champ est vide ou a été modifié par suppression, accepter le changement
    if (value.length === 0 || value.length < farmerData[name as keyof FarmerData].length) {
      setFarmerData(prev => ({ ...prev, [name]: value }));
      setErrorFields(prev => ({ ...prev, [name]: false }));
      return;
    }
    
    // Valider uniquement le dernier caractère entré
    const lastChar = value.charAt(value.length - 1);
    if (!validateCharacter(name, lastChar)) {
      // Afficher une alerte avec le message d'erreur approprié
      let fieldLabel = "";
      let invalidCharMessage = "";
      
      switch (name) {
        case "name":
          fieldLabel = "Name";
          invalidCharMessage = "ne peut contenir que des lettres";
          break;
        case "prenom":
          fieldLabel = "Prénom";
          invalidCharMessage = "ne peut contenir que des lettres";
          break;
        case "localite":
          fieldLabel = "Localité";
          invalidCharMessage = "ne peut contenir que des lettres";
          break;
        case "telephone":
          fieldLabel = "Téléphone";
          invalidCharMessage = "ne peut contenir que des chiffres, +, espaces et tirets";
          break;
        case "adresse":
          fieldLabel = "Adresse";
          invalidCharMessage = "contient un caractère non autorisé";
          break;
      }
      
      alert(`Caractère invalide: Le champ ${fieldLabel} ${invalidCharMessage}`);
      
      // Mettre le champ en erreur temporairement pour l'affichage visuel
      setErrorFields(prev => ({ ...prev, [name]: true }));
      
      // Réinitialiser l'état d'erreur visuelle après un court délai
      setTimeout(() => {
        setErrorFields(prev => ({ ...prev, [name]: false }));
      }, 1500);
      
      return; // Ne pas mettre à jour les données
    }
    
    // Si le caractère est valide, mettre à jour les données
    setFarmerData(prev => ({ ...prev, [name]: value }));
  };

  const handleBack = () => {
    navigate("/listAgriculteur");
  };
  
  // Fonction pour soumettre le formulaire 
  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    
    // Désactivation du bouton pendant la soumission 
    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/farmers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(farmerData),
      });

      // Bloc de gestion des erreurs de réponse serveur 
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur serveur: ${errorText}`);
      }

      const data = await response.json();
      console.log("Ajout réussi:", data);
      alert("Agriculteur ajouté avec succès ✅");
      navigate("/DashboardE", { state: { successMessage: "Agriculteur ajouté avec succès ✅" } });
    } catch (err: any) {
      console.error("Erreur:", err);
      alert(err.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour déterminer la classe CSS en fonction de l'état d'erreur
  const getInputClassName = (fieldName: string) => {
    return errorFields[fieldName] ? "input-error" : "";
  };

  return (
    <div className="formulaire-container">
      <div className="formulaire-header">
        <button className="back-btn" onClick={handleBack}>
          <FaArrowLeft />
        </button>
        <h1>Ajouter un nouvel agriculteur</h1>
      </div>

      <div className="formulaire-content">
        <form className="forms" onSubmit={handleSave}>
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="prenom">Prénom</label>
                <input 
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={farmerData.prenom}
                  onChange={handleInputChange}
                  className={`input-label ${getInputClassName("prenom")}`}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="Name">Nom</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={farmerData.name}
                  onChange={handleInputChange}
                  className={`input-label ${getInputClassName("name")}`}
                  required
                />
              </div>
            </div>
            <div className="form-group">
                <label htmlFor="email">Email Aderess</label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={farmerData.email}
                  onChange={handleInputChange}
                  className={`input-label ${getInputClassName("email")}`}
                  required
                />
              </div>
            <div className="form-group">
              <label htmlFor="localite">Locality</label>
              <input
                type="text"
                id="localite"
                name="localite"
                value={farmerData.localite}
                onChange={handleInputChange}
                className={`input-label ${getInputClassName("localite")}`}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="telephone">Téléphone</label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                value={farmerData.telephone}
                onChange={handleInputChange}
                className={`input-label ${getInputClassName("telephone")}`}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="adresse">Adresse</label>
              <input
                type="text"
                id="adresse"
                name="adresse"
                value={farmerData.adresse}
                onChange={handleInputChange}
                className={`input-label ${getInputClassName("adresse")}`}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={handleBack} className="cancel-btn">
              Annuler
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormulaireAgriculteur;