import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(evento) {
    evento.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const resposta = await api.post('/login', { email, senha });
      const { access_token, usuario } = resposta.data;
      login(access_token, usuario);
      navigate('/');
    } catch (erroRequisicao) {
      if (erroRequisicao.response && erroRequisicao.response.status === 401) {
        setErro('Email ou senha invalidos.');
      } else {
        setErro('Nao foi possivel conectar ao servidor. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={estilos.container}>
      <div style={estilos.card}>
        <h1 style={estilos.titulo}>Sistema de Exames</h1>
        <p style={estilos.subtitulo}>Faca login para continuar</p>

        <form onSubmit={handleSubmit}>
          <div style={estilos.campo}>
            <label style={estilos.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={estilos.input}
              placeholder="seuemail@laboratorio.com"
            />
          </div>

          <div style={estilos.campo}>
            <label style={estilos.label}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              style={estilos.input}
              placeholder="Digite sua senha"
            />
          </div>

          {erro && <p style={estilos.erro}>{erro}</p>}

          <button type="submit" disabled={carregando} style={estilos.botao}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

const estilos = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f0f2f5',
  },
  card: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '350px',
  },
  titulo: {
    margin: 0,
    fontSize: '24px',
    color: '#222',
    textAlign: 'center',
  },
  subtitulo: {
    margin: '8px 0 24px 0',
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
  },
  campo: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  erro: {
    color: '#c0392b',
    fontSize: '13px',
    marginBottom: '12px',
  },
  botao: {
    width: '100%',
    padding: '10px',
    fontSize: '15px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default Login;