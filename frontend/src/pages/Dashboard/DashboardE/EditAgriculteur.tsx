import React,{ useState, useEffect, ChangeEvent, FormEvent} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './EditAgriculteur.css';

interface Farmer {
    _id: string,
    nom : string;
    prenom: string;
    localite: string;
    telephone: string;
    adresse: string;
}

interface LocationState {
    farmer : Farmer ;
}

const EditAgriculteur: React.FC = () =>{
    const navigate = useNavigate();
    const location = useLocation();

    const [farmer, setFarmer] = useState<Farmer>({
        _id:'',
        nom: '',
        prenom: '',
        localite: '',
        telephone: '',
        adresse: ''
    });
     // Récuperer les données de l'agriculteur depuis l'etat de navigation

     useEffect(() => {
        
        if(location.state && "farmer" in location.state){
            const state = location.state as LocationState;
            setFarmer(state.farmer);
        }else{
            //Rediriger vers le dashboard si aucune donnée n'est fournie
            navigate('/listAgriculteur');
        }
     }, [location, navigate]);

     //Fonction pour gérer les changement dans le formulaire

     const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setFarmer((prevFarmer)=>({
            ...prevFarmer,
            [name]: value
        }));
     };

     //Fonction pour enregistrer les données de l'agriculteur
     const handleSave = async () => {
        const updatedFarmer = {
            nom: farmer.nom,
            prenom: farmer.prenom,
            localite: farmer.localite,
            telephone : farmer.telephone,
            adresse: farmer.adresse
        };

        try{

            //Logique pour envoyer les données modifiées à  l'API
            const response = await fetch(`http://localhost:5000/api/farmers/${farmer._id}`,{
                method: 'PUT', // Méthode PUT pour mettre à jour 
                headers:{
                    'content-Type' : 'application/json',
                },
                body: JSON.stringify(updatedFarmer),
            });
            const data =await response.json();
            console.log("Résponse serveur :", data);

            if (!response.ok){
                //si la mis a jour réussie, rediriger ver le dashboard
                throw new Error(data.message || "Erreur vvlorsv de la mise à jour.")
            }
            alert("Mise à jour réussie !");
            navigate('/listAgriculteur');
        }catch (error){
            console.error("Erreur lors de la mise à jour des données de l'agriculteur:", error);
            alert("Échec de la mise à jour. Veuillez réessayer.");
        }

     };

     //Fonction pour soumettre le formulaire et mettre à jour l'agriculteur 

     const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        handleSave();
     };

       
     //Function pour annuler et revinir au dashboard

     const handleCancel = (): void => { 
        navigate('/listAgriculteur');

     };

     return (
        <div className='edit-page-container'>
            <div className='edit-page-header'>
                <h1>Modifier les informations de l'agriculteur</h1>
                <button className='return-btn' onClick={handleCancel}>Retour au dashboard</button>
            </div>

            <div className='edit-form-wrapper'>
                <form onSubmit={handleSubmit} className='edit-farmer-form'>
                    <div className='form-group'>
                        <label htmlFor='nom'>Nom:</label>
                        <input
                            type="text"
                            id="nom"
                            name="nom" 
                            value={farmer.nom}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className='form-group'>
                        <label htmlFor='prenom'>Prénom:</label>
                        <input
                            type="text"
                            id="prenom"
                            name="prenom"
                            value={farmer.prenom}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="localite">Localité:</label>
                        <input
                            type="text"
                            id="localite"
                            name="localite"
                            value={farmer.localite}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className='form-group'>
                        <label htmlFor='telephone'>Téléphone:</label>
                        <input
                            type="text"
                            id="telephone"
                            name="telephone"
                            value={farmer.telephone}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className='form-group'>
                        <label htmlFor='adresse'>Adresse:</label>
                        <input
                            type="text"
                            id="adresse"
                            name="adresse"
                            value={farmer.adresse}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className='form-buttons'>
                        <button type="submit" className='save-btn'>Enregistrer</button>
                        <button type="button" className='cancel-btn' onClick={handleCancel}>Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default  EditAgriculteur;