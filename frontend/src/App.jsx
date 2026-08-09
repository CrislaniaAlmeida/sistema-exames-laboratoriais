import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import TrocarSenha from './pages/TrocarSenha';
import Home from './pages/Home';
import ExameDetalhe from './pages/ExameDetalhe';
import ExamesGerenciar from './pages/ExamesGerenciar';
import TubosGerenciar from './pages/TubosGerenciar';
import LaboratoriosGerenciar from './pages/LaboratoriosGerenciar';
import UsuariosGerenciar from './pages/UsuariosGerenciar';
import RotaProtegida from './components/RotaProtegida';
import RotaAdmin from './components/RotaAdmin';
import RotaComPermissao from './components/RotaComPermissao';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/trocar-senha"
        element={
          <RotaProtegida>
            <TrocarSenha />
          </RotaProtegida>
        }
      />
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
          <RotaComPermissao permissao="exames_gerenciar">
            <ExamesGerenciar />
          </RotaComPermissao>
        }
      />
      <Route
        path="/tubos"
        element={
          <RotaComPermissao permissao="tubos_gerenciar">
            <TubosGerenciar />
          </RotaComPermissao>
        }
      />
      <Route
        path="/laboratorios"
        element={
          <RotaComPermissao permissao="laboratorios_gerenciar">
            <LaboratoriosGerenciar />
          </RotaComPermissao>
        }
      />
      <Route
        path="/usuarios"
        element={
          <RotaAdmin>
            <UsuariosGerenciar />
          </RotaAdmin>
        }
      />
    </Routes>
  );
}

export default App;
