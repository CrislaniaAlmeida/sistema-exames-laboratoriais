import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RotaComPermissao({ permissao, children }) {
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  if (carregando) {
    return <p style={{ textAlign: 'center', marginTop: '40px' }}>Carregando...</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.deve_trocar_senha && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />;
  }

  const temAcesso = usuario.perfil === 'admin' || usuario.permissoes?.includes(permissao);
  if (!temAcesso) {
    return <Navigate to="/exames" replace />;
  }

  return children;
}

export default RotaComPermissao;
