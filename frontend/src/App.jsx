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
import PacientesGerenciar from './pages/PacientesGerenciar';
import PacienteExames from './pages/PacienteExames';
import MateriaisGerenciar from './pages/MateriaisGerenciar';
import PainelAmostras from './pages/PainelAmostras';
import TriagemAmostras from './pages/TriagemAmostras';
import LiberacaoExames from './pages/LiberacaoExames';
import PortalPaciente from './pages/PortalPaciente';
import RelatorioAtendimentos from './pages/RelatorioAtendimentos';
import RotaProtegida from './components/RotaProtegida';
import RotaAdmin from './components/RotaAdmin';
import RotaComPermissao from './components/RotaComPermissao';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/portal/:token" element={<PortalPaciente />} />
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
        path="/pacientes"
        element={
          <RotaComPermissao permissao="pacientes_gerenciar">
            <PacientesGerenciar />
          </RotaComPermissao>
        }
      />
      <Route
        path="/pacientes/:id/exames"
        element={
          <RotaComPermissao permissao="pacientes_gerenciar">
            <PacienteExames />
          </RotaComPermissao>
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
          <RotaAdmin>
            <TubosGerenciar />
          </RotaAdmin>
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
      <Route
        path="/materiais"
        element={
          <RotaAdmin>
            <MateriaisGerenciar />
          </RotaAdmin>
        }
      />
      <Route
        path="/relatorios/atendimentos"
        element={
          <RotaAdmin>
            <RelatorioAtendimentos />
          </RotaAdmin>
        }
      />
      <Route
        path="/painel-amostras"
        element={
          <RotaComPermissao permissao="amostras_gerenciar">
            <PainelAmostras />
          </RotaComPermissao>
        }
      />
      <Route
        path="/triagem"
        element={
          <RotaComPermissao permissao="amostras_gerenciar">
            <TriagemAmostras />
          </RotaComPermissao>
        }
      />
      <Route
        path="/liberacao"
        element={
          <RotaComPermissao permissao="amostras_gerenciar">
            <LiberacaoExames />
          </RotaComPermissao>
        }
      />
    </Routes>
  );
}

export default App;
