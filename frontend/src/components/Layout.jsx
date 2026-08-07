import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const navItems = [
  { label: 'Dashboard', path: '/exames', icon: 'dashboard', disponivel: true },
  { label: 'Gerenciar Exames', path: '/exames/gerenciar', icon: 'exames', disponivel: true, adminOnly: true },
  { label: 'Laboratorios', path: '/laboratorios', icon: 'laboratorio', disponivel: true, adminOnly: true },
  { label: 'Materiais', path: '/materiais', icon: 'materiais', disponivel: false, adminOnly: true },
  { label: 'Tubos', path: '/tubos', icon: 'tubos', disponivel: true, adminOnly: true },
];

const titulosPagina = {
  '/exames': { titulo: 'Dashboard', subtitulo: 'Visao geral e consulta de exames' },
  '/exames/gerenciar': { titulo: 'Gerenciar Exames', subtitulo: 'Cadastre, edite ou remova exames do sistema' },
  '/tubos': { titulo: 'Gerenciar Tubos', subtitulo: 'Cadastre, edite ou remova tubos de coleta' },
  '/laboratorios': { titulo: 'Laboratorios de Apoio', subtitulo: 'Cadastre laboratorios externos' },
};

const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" /></svg>
  ),
  exames: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 2v4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3V2" />
      <path d="M9 2h6v4H9z" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  ),
  laboratorio: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 3v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V3" />
      <path d="M9 3h6" />
    </svg>
  ),
  materiais: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  tubos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="7" y="2" width="10" height="20" rx="4" />
      <path d="M7 13h10" />
    </svg>
  ),
};

function gerarIniciais(nome) {
  if (!nome) return '?';
  const partes = nome.trim().split(' ');
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const location = useLocation();

  const infoPagina = titulosPagina[location.pathname] || { titulo: 'NexLab', subtitulo: 'Sistema de Consulta de Exames' };

  return (
    <div className="layout">
      <aside className="layout-sidebar">
        <div className="layout-logo">
          <span className="layout-logo-icone">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#04070d" strokeWidth="2.2"><path d="M9 2v6.34a2 2 0 0 1-.4 1.2L4 16a2 2 0 0 0 1.6 3.2h12.8A2 2 0 0 0 20 16l-4.6-6.46a2 2 0 0 1-.4-1.2V2" /><path d="M8.5 2h7" /></svg>
          </span>
          <div>
            <h1>NexLab</h1>
            <p>Plataforma Laboratorial</p>
          </div>
        </div>

        <nav className="layout-nav">
          {navItems.map((item) => {
            if (item.adminOnly && usuario?.perfil !== 'admin') return null;

            const ativo = location.pathname === item.path;

            if (!item.disponivel) {
              return (
                <div key={item.path} className="layout-nav-item layout-nav-item-desabilitado" title="Em breve">
                  <span className="layout-nav-icone">{icons[item.icon]}</span>
                  <span>{item.label}</span>
                  <span className="layout-nav-badge">Em breve</span>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`layout-nav-item ${ativo ? 'layout-nav-item-ativo' : ''}`}
              >
                <span className="layout-nav-icone">{icons[item.icon]}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="layout-usuario">
          <div className="layout-usuario-info">
            <span className="layout-usuario-nome">{usuario?.nome}</span>
            <span className="layout-usuario-perfil">{usuario?.perfil === 'admin' ? 'Administrador' : 'Usuario'}</span>
          </div>
          <button onClick={logout} className="layout-sair">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          </button>
        </div>
      </aside>

      <div className="layout-principal">
        <header className="layout-topbar">
          <div className="layout-topbar-titulo">
            <span className="layout-topbar-titulo-principal">{infoPagina.titulo}</span>
            <span className="layout-topbar-subtitulo">{infoPagina.subtitulo}</span>
          </div>

          <div className="layout-topbar-direita">
            <span className="layout-topbar-tag">NexLab • Unidade Central</span>
            <div className="layout-avatar">{gerarIniciais(usuario?.nome)}</div>
          </div>
        </header>

        <main className="layout-conteudo">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;