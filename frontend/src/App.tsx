import {  Route, Routes } from 'react-router-dom';
import DashboardE from './pages/Dashboard/DashboardE/dashboardEmlp/dashboardEmpl';
import DashboardA from './pages/Dashboard/DashboardA/dashboardA';
import Login1 from "./pages/auth/login1";
import Signup1 from "./pages/auth/signup1";
import ForgotPassword from "./pages/auth/ForgotPW";
import EnterCode from "./pages/auth/EnterCode";
import ResetPassword from "./pages/auth/ResetPassword";
import Statistics from './pages/Dashboard/DashboardA/Statistics';

import Message from './pages/Dashboard/Message/message';
import ListAgriculteur from './pages/Dashboard/DashboardE/listAgriculteur';
import EditAgriculteur from './pages/Dashboard/DashboardE/EditAgriculteur';
import FormulaireAgriculteur from './pages/Dashboard/DashboardE/FormulaireAgriculteur';
import UserProfile from './pages/Dashboard/DashboardE/profil/UserProfile';
import InformationsUtilisateur from './pages/Dashboard/DashboardE/profil/InformationsUtilisateur';
import ChangePassword from './pages/Dashboard/DashboardE/profil/ChangePassword/ChangePassword';


import ListeParcelle from './pages/Dashboard/Parcelle/listeParcelles/listeParcelle';
import FormulaireParcelle from './pages/Dashboard/Parcelle/formulaireParcelle/formulaireParcelle';
import CarteInteractive from './pages/Dashboard/Parcelle/carteInteractive/carteInteractive';
import DashboardParcelles from './pages/Dashboard/Parcelle/DashboardParcelle/dashboardParcelle';


function App() {

  return (
    <>
      <Routes>
        <Route path="/*" element={<Login1/>} />
        <Route path="Signup1" element={<Signup1/>} />
        <Route path="ForgetPW" element={<ForgotPassword/>}/>
        <Route path="EnterCode" element={<EnterCode/>}/>
        <Route path="ResetPassword" element={<ResetPassword/>}/>
        <Route path='DashboardA' element={<DashboardA/>}/>
        <Route path='Statistics' element={<Statistics/>}/>
        <Route path='DashboardE' element={<DashboardE/>}/>

        <Route path="/listAgriculteur" element={<ListAgriculteur />} />
        <Route path='/EditAgriculteur' element={<EditAgriculteur/>}/>
        <Route path="/formulaireAgriculteur" element={<FormulaireAgriculteur/>}/>
        <Route path="/UserProfile" element={<UserProfile/>}/>
        <Route path="/Change-Password" element={<ChangePassword/>}/>
        <Route path="/InformationsUtilisateur" element={<InformationsUtilisateur/>}/>
        <Route path="/messages" element={<Message/>}/>

        <Route path="/listeParcelle" element={<ListeParcelle/>}/>
        <Route path="/formulaireParcelle" element={<FormulaireParcelle onSubmit={(data) => console.log(data)} onClose={() => {}} farmerId="test"/>}/>
        <Route path="/carte-interactive" element={<CarteInteractive />} />
        <Route path="/dashboard-parcelles" element={<DashboardParcelles/>}/>
      

      </Routes>
    </>
  )
}

export default App
