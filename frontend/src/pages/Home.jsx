import { useAuth } from '../context/AuthContext';

function Home() {
  const { usuario, logout } = useAuth();

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Bem-vinda, {usuario?.nome}!</h1>
      <p>Perfil: {usuario?.perfil}</p>
      <button onClick={logout} style={{ padding: '8px 16px', cursor: 'pointer' }}>
        Sair
      </button>
    </div>
  );
}

export default Home;