import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Home from './pages/Home';
import ExamesGerenciar from './pages/ExamesGerenciar';
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
        path="/exames/gerenciar"
        element={
          <RotaAdmin>
            <ExamesGerenciar />
          </RotaAdmin>
        }
      />
    </Routes>
  );
}

export default App;