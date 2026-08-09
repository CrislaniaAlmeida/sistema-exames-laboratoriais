import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Login.css';
import fundoLogin from '../assets/login-bg.jpg';

function TrocarSenha() {
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const { atualizarUsuario, logout } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(evento) {
    evento.preventDefault();
    setErro('');

    if (senhaNova.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senhaNova !== confirmarSenha) {
      setErro('As senhas nao coincidem.');
      return;
    }

    setCarregando(true);
    try {
      const resposta = await api.put('/trocar-senha', { senha_nova: senhaNova });
      atualizarUsuario(resposta.data);
      navigate('/exames');
    } catch {
      setErro('Nao foi possivel atualizar a senha. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  function handleSair() {
    logout();
    navigate('/login');
  }

  return (
    <div className="login-fundo" style={{ backgroundImage: `url(${fundoLogin})` }}>
      <div className="login-overlay" />

      <div className="login-card">
        <div className="login-marca">
          <span className="login-marca-icone">🧪</span>
          <span className="login-marca-texto">NexLab</span>
        </div>
        <div className="login-linha" />
        <h1 className="login-titulo">Defina sua senha</h1>
        <p className="login-subtitulo">
          Este e seu primeiro acesso (ou sua senha foi redefinida). Crie uma nova senha para continuar.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-grupo">
            <span className="login-icone">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={senhaNova}
              onChange={(e) => setSenhaNova(e.target.value)}
              required
              placeholder="Nova senha"
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
              autoComplete="new-password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              placeholder="Confirmar nova senha"
            />
          </div>

          {erro && <p className="login-erro">{erro}</p>}

          <button type="submit" disabled={carregando} className="login-botao">
            {carregando ? 'Salvando...' : 'Salvar e continuar'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleSair}
          className="login-voltar"
          style={{
            position: 'static',
            margin: '18px auto 0',
            display: 'block',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}

export default TrocarSenha;
