import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './EditAgriculteur.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Farmer {
    _id: {
        _id: string;  // or whatever type this is
        name: string;
        prenom: string;
        email: string;
    };
    localite: string;
    telephone: string;
    adresse: string;
}

interface LocationState {
    farmer: Farmer;
}

const EditAgriculteur: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [farmer, setFarmer] = useState<Farmer>({
        _id: {
            _id: '',    // The MongoDB ID
            name: '',   // First name
            prenom: '',  // Last name
            email: ''
        },
        localite: '',
        telephone: '',
        adresse: ''
    });
    // Récuperer les données de l'agriculteur depuis l'etat de navigation

    useEffect(() => { 

        if (location.state && "farmer" in location.state) {
            const state = location.state as LocationState;
            console.log("farmer data \n",state.farmer)
            setFarmer(state.farmer);
        } else {
            //Rediriger vers le dashboard si aucune donnée n'est fournie
            navigate('/listAgriculteur');
        }
    }, [location, navigate]);

    //Fonction pour gérer les changement dans le formulaire

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    if (['name', 'prenom', 'email'].includes(name)) {
        setFarmer((prevFarmer) => ({
            ...prevFarmer,
            _id: {
                ...prevFarmer._id,
                [name]: value
            }
        }));
    } else {
        setFarmer((prevFarmer) => ({
            ...prevFarmer,
            [name]: value
        }));
    }
};


    //Fonction pour enregistrer les données de l'agriculteur
    const handleSave = async () => {
    try {
        // Debugging: Remove after confirmation
        console.log("Original farmer._id:", farmer._id);
        
        // Ensure we have the nested ID structure
        if (!farmer?._id?._id) {
            throw new Error("Farmer ID structure is invalid");
        }

        const farmerId = farmer._id._id; // The actual MongoDB ID

        // Verify ID format (optional but helpful)
        if (!/^[0-9a-fA-F]{24}$/.test(farmerId)) {
            throw new Error("Invalid ID format");
        }

        const updatedFarmer = {
            name: farmer._id.name,
            prenom: farmer._id.prenom,
            email: farmer._id.email,
            localite: farmer.localite,
            telephone: farmer.telephone,
            adresse: farmer.adresse
        };

        const response = await fetch(`http://localhost:5000/api/farmers/${farmerId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedFarmer),
        });

        const data = await response.json();
        console.log("Réponse serveur :", data);

        if (!response.ok) {
            throw new Error(data.message || "Erreur lors de la mise à jour.");
        }

        toast.success("Successfully updated!");
        setTimeout(() => {
            navigate("/listAgriculteur", {
                state: { successMessage: "Farmer updated successfully" }, // Changed from "added" to "updated"
            });
        }, 1500);

    } catch (error) {
        console.error("Erreur lors de la mise à jour des données de l'agriculteur:", error);
        toast.error("Update failed. Please try again.");
    }
};

// Fonction pour soumettre le formulaire
const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await handleSave(); // Added await to properly handle async operation
};


    //Function pour annuler et revinir au dashboard

    const handleCancel = (): void => {
        navigate('/listAgriculteur');

    };

    return (
        <div className='edit-page-container'>
            <div className='edit-page-header'>
                <h1>Edit the farmer's information</h1>
                <button className='return-btn' onClick={handleCancel}>Back to Dashboard</button>
            </div>

            <div className='edit-form-wrapper'>
                <form onSubmit={handleSubmit} className='edit-farmer-form'>
                    <div className='form-group'>
                        <label htmlFor='name'>Family:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={farmer._id.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className='form-group'>
                        <label htmlFor='prenom'>Name:</label>
                        <input
                            type="text"
                            id="prenom"
                            name="prenom"
                            value={farmer._id.prenom}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className='form-group'>
                        <label htmlFor='email'>Eamil adress:</label>
                        <input 
                        id="email" 
                        type="email" 
                        name="email" 
                        autoComplete="email" 
                        value={farmer._id.email} 
                        required 
                        onChange={handleInputChange}/>

                        
                    </div>

                    <div className="form-group">
                        <label htmlFor="localite">Locality:</label>
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
                        <label htmlFor='telephone'>Phone Number:</label>
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
                        <label htmlFor='adresse'>Adress:</label>
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
                        <button type="submit" className='save-btn'>Save</button>
                        <button type="button" className='cancel-btn' onClick={handleCancel}>Cancle</button>

                    </div>
                    <ToastContainer />
                </form>
            </div>
        </div>
    );
}
export default EditAgriculteur;