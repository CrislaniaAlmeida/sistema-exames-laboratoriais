import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Login.css';
import fundoLogin from '../assets/login-bg.jpg';

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
      navigate('/exames');
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
    <div className="login-fundo" style={{ backgroundImage: `url(${fundoLogin})` }}>
      <div className="login-card">
        <h1 className="login-titulo">NexLab</h1>
        <p className="login-subtitulo">Faca login para continuar</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-grupo">
            <span className="login-icone">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 6-10 7L2 6" />
              </svg>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
            />
          </div>

          <div className="login-input-grupo">
            <span className="login-icone">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              placeholder="Senha"
            />
          </div>

          {erro && <p className="login-erro">{erro}</p>}

          <button type="submit" disabled={carregando} className="login-botao">
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;