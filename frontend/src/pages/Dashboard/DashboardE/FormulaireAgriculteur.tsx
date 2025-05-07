import React, { useState, ChangeEvent, FormEvent } from "react";
import { FaArrowLeft, FaUser, FaPhoneAlt, FaMapMarkerAlt, FaHome, FaSeedling} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./FormulaireAgriculteur.css";

// Définition du type Farmer
interface FarmerData {
  nom: string;
  prenom: string;
  localite: string;
  telephone: string;
  adresse: string;
}

const FormulaireAgriculteur: React.FC = () => {
  const navigate = useNavigate();
  const [farmerData, setFarmerData] = useState<FarmerData>({
    nom: "",
    prenom: "",
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
      case "nom":
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
        case "nom":
          fieldLabel = "Nom";
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
  const handleSave = async(event: FormEvent) => {
    event.preventDefault();

    setIsSubmitting(true);
    try{
      console.log("Données envoyées:", farmerData);
      //Assurez-vous que l'URL correspond exactement à ce que votre serveur attend
      // Assurez-vous d'utiliser l'URL relative pour activer le proxy correctement
      const response = await fetch("http://localhost:5000/api/farmers",{
        method: "POST",
        headers : {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          ...farmerData,
          createdBy: "65fde1a9d5e8d28e4c0c6d01"
        }),
      });
      //log pour le débogage
      console.log("statut de la réponse:", response.status);

      //vérifier si la réponse est JSON

      const contentType = response.headers.get("content-type");
      if(contentType && contentType.indexOf("application/json") !== -1){
        const data = await response.json();

        if(!response.ok){
          throw new Error(`Erreur serveur(${response.status}):${data.message || "Acun information d'erreur "}`);
        }

        console.log("Ajout réusssi:",data);
        alert("Agriculteur ajouté avec succés ✅");
        navigate("/listAgriculteur");
      }else{
        //si la réponse n'est pas JSON , lire le texte brut
        const textResponse = await response.text();
        console.error("Response non-JSON reçue:",textResponse);
        throw new Error(`Erreur serveur (${response.status}): La réponse n'est pas au format JSON`);
      }
    }catch(err: any){
      console.error("Erreur compléte:", err);
      alert(`Erreur: ${err.message || "Une erreur inconnue est survenue"}`);
    }finally{
      setIsSubmitting(false)
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
        <h1>Ajouter un nouvel agriculteur  <FaSeedling style={{ marginRight: '10px', color: '#4CAF50' }} /> </h1>
      </div>

      <div className="formulaire-content">
        <form onSubmit={handleSave}>
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="prenom"><FaUser/>Prénom</label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={farmerData.prenom}
                  onChange={handleInputChange}
                  className={getInputClassName("prenom")}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="nom"><FaUser/>Nom</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={farmerData.nom}
                  onChange={handleInputChange}
                  className={getInputClassName("nom")}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="localite"><FaMapMarkerAlt />Localité</label>
              <input
                type="text"
                id="localite"
                name="localite"
                value={farmerData.localite}
                onChange={handleInputChange}
                className={getInputClassName("localite")}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="telephone"><FaPhoneAlt />Téléphone</label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                value={farmerData.telephone}
                onChange={handleInputChange}
                className={getInputClassName("telephone")}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="adresse"><FaHome />Adresse</label>
              <input
                type="text"
                id="adresse"
                name="adresse"
                value={farmerData.adresse}
                onChange={handleInputChange}
                className={getInputClassName("adresse")}
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