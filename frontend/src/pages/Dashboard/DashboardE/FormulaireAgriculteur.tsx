import React, { useState, ChangeEvent, FormEvent } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./FormulaireAgriculteur.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Définition du type Farmer
interface FarmerData {
  name: string;
  prenom: string;
  email:string;
  password:string;
  localite: string;
  telephone: string;
  adresse: string;
}

const FormulaireAgriculteur: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [farmerData, setFarmerData] = useState<FarmerData>({
    name: "",
    prenom: "",
    email:"",
    password:"",
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
        return /^[5249][0-9]{7}$/.test(char);
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
      // Afficher une toast avec le message d'erreur approprié
      let fieldLabel = "";
      let invalidCharMessage = "";
      
      switch (name) {
        case "name":
          fieldLabel = "Name";
          invalidCharMessage = "Must be only lettres";
          break;
        case "prenom":
          fieldLabel = "Family Name";
          invalidCharMessage = "Must be only lettres";
          break;
        case "localite":
          fieldLabel = "Locality";
          invalidCharMessage = "Must be only lettres";
          break;
        case "telephone":
          fieldLabel = "Phone number";
          invalidCharMessage = "Must be exactly 8 digits and start with 5, 2, 4, or 9.";
          break;
        case "adresse":
          fieldLabel = "Adress";
          break;
      }
      toast.error(`Caractère invalide: Le champ ${fieldLabel} ${invalidCharMessage}`); 
      
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
        console.log("Server error"+errorText)
      }

      const data = await response.json();
      console.log("Ajout réussi:", data);
      toast.success("Farmer added successfully");
      setTimeout(() => {
        navigate("/listAgriculteur", {
          state: { successMessage: "Farmer added successfully" },
        });
      }, 1500); // Delay of 1.5 seconds
    } catch (err: any) {
      console.error("Erreur:", err);
      toast.error("Farmer already exists");
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
        <h1>Add new farmer</h1>
      </div>

      <div className="formulaire-content">
        <form className="forms" onSubmit={handleSave}>
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="prenom">Family Name</label>
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
                <label htmlFor="Name">Name</label>
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
              <div className="form-row">
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
              <label htmlFor="adresse">Adress</label>
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
            <div className="form-group">
              <label htmlFor="telephone">Phone number</label>
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
              <label htmlFor="telephone">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={farmerData.password}
                onChange={handleInputChange}
                className={`input-label ${getInputClassName("password")}`}
                required
              />
            </div>
            <label className="d-flex align-items-center gap-2 ">
              <input className="custom-checkbox" type="checkbox" id="showPassword"
                    checked={showPassword} 
                    onChange={() => setShowPassword(!showPassword)} />
              <span>Show Password</span>
            </label>
          </div>
          <div className="form-actions">
            <button type="button" onClick={handleBack} className="cancel-btn">
              Annuler
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
          <ToastContainer />
        </form>
      </div>
    </div>
  );
};

export default FormulaireAgriculteur;