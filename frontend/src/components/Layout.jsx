import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const navItems = [
  { label: 'Dashboard', path: '/exames', icon: 'dashboard', disponivel: true },
  { label: 'Pacientes', path: '/pacientes', icon: 'pacientes', disponivel: true, permissao: 'pacientes_gerenciar' },
  { label: 'Triagem de Amostras', path: '/triagem', icon: 'triagem', disponivel: true, permissao: 'amostras_gerenciar' },
  { label: 'Painel de Amostras', path: '/painel-amostras', icon: 'painel', disponivel: true, permissao: 'amostras_gerenciar' },
  { label: 'Gerenciar Exames', path: '/exames/gerenciar', icon: 'exames', disponivel: true, permissao: 'exames_gerenciar' },
  { label: 'Laboratorios', path: '/laboratorios', icon: 'laboratorio', disponivel: true, permissao: 'laboratorios_gerenciar' },
  { label: 'Materiais', path: '/materiais', icon: 'materiais', disponivel: true, adminOnly: true },
  { label: 'Tubos', path: '/tubos', icon: 'tubos', disponivel: true, adminOnly: true },
  { label: 'Usuarios', path: '/usuarios', icon: 'usuarios', disponivel: true, adminOnly: true },
];

const titulosPagina = {
  '/exames': { titulo: 'Dashboard', subtitulo: 'Visao geral e consulta de exames' },
  '/pacientes': { titulo: 'Gerenciar Pacientes', subtitulo: 'Cadastre e edite os dados dos pacientes' },
  '/painel-amostras': { titulo: 'Painel de Amostras', subtitulo: 'Coleta e liberacao de resultado por amostra' },
  '/triagem': { titulo: 'Triagem de Amostras', subtitulo: 'Bipe o codigo de barras para identificar o destino da amostra' },
  '/exames/gerenciar': { titulo: 'Gerenciar Exames', subtitulo: 'Cadastre, edite ou remova exames do sistema' },
  '/tubos': { titulo: 'Gerenciar Tubos', subtitulo: 'Cadastre, edite ou remova tubos de coleta' },
  '/laboratorios': { titulo: 'Laboratorios de Apoio', subtitulo: 'Cadastre laboratorios externos' },
  '/usuarios': { titulo: 'Gerenciar Usuarios', subtitulo: 'Cadastre usuarios e defina o que cada um pode acessar' },
  '/materiais': { titulo: 'Gerenciar Materiais', subtitulo: 'Cadastre os materiais biologicos usados nos exames' },
};

const PERFIS_LABEL = {
  admin: 'Administrador',
  recepcao: 'Recepcao',
  coletador: 'Coletador',
  bioquimico: 'Bioquimico',
  usuario: 'Outro',
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
  pacientes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="10" r="2.5" />
      <path d="M5.5 17.5c0-2 1.8-3.5 3.5-3.5s3.5 1.5 3.5 3.5" />
      <path d="M15 8h4M15 12h4" />
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
  painel: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 2v6.34a2 2 0 0 1-.4 1.2L4 16a2 2 0 0 0 1.6 3.2h12.8A2 2 0 0 0 20 16l-4.6-6.46a2 2 0 0 1-.4-1.2V2" /><path d="M8.5 2h7" /><path d="M6 20h4M14 20h4" strokeWidth="1.4" />
    </svg>
  ),
  triagem: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="7" width="3" height="10" /><rect x="7.5" y="5" width="2" height="14" /><rect x="11" y="8" width="4" height="11" /><rect x="16.5" y="6" width="2" height="13" /><rect x="19.5" y="9" width="2" height="10" />
    </svg>
  ),
  tubos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="7" y="2" width="10" height="20" rx="4" />
      <path d="M7 13h10" />
    </svg>
  ),
  usuarios: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
            const ehAdmin = usuario?.perfil === 'admin';
            if (item.adminOnly && !ehAdmin) return null;
            if (item.permissao && !ehAdmin && !usuario?.permissoes?.includes(item.permissao)) return null;
            if (item.permissoes && !ehAdmin && !item.permissoes.some((chave) => usuario?.permissoes?.includes(chave))) return null;

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
            <span className="layout-usuario-perfil">{PERFIS_LABEL[usuario?.perfil] || 'Usuario'}</span>
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