import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Home from './pages/Home';
import ExameDetalhe from './pages/ExameDetalhe';
import ExamesGerenciar from './pages/ExamesGerenciar';
import TubosGerenciar from './pages/TubosGerenciar';
import LaboratoriosGerenciar from './pages/LaboratoriosGerenciar';
import RotaProtegida from './components/RotaProtegida';
import RotaAdmin from './components/RotaAdmin';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/exames"
        element={
          <RotaProtegida>
            <Home />
          </RotaProtegida>
        }
      />
      <Route
        path="/exames/:id"
        element={
          <RotaProtegida>
            <ExameDetalhe />
          </RotaProtegida>
        }
      />
      <Route
        path="/exames/gerenciar"
        element={
          <RotaAdmin>
            <ExamesGerenciar />
          </RotaAdmin>
        }
      />
      <Route
        path="/tubos"
        element={
          <RotaAdmin>
            <TubosGerenciar />
          </RotaAdmin>
        }
      />
      <Route
        path="/laboratorios"
        element={
          <RotaAdmin>
            <LaboratoriosGerenciar />
          </RotaAdmin>
        }
      />
    </Routes>
  );
}

export default App;