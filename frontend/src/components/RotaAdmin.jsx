import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RotaAdmin({ children }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <p style={{ textAlign: 'center', marginTop: '40px' }}>Carregando...</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.perfil !== 'admin') {
    return <Navigate to="/exames" replace />;
  }

  return children;
}

export default RotaAdmin;