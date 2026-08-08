import { Link } from 'react-router-dom';
import heroImg from '../assets/hero.jpg';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-logo">
          <span className="landing-logo-icon">🧪</span>
          <span className="landing-logo-text">NexLab</span>
          <span className="landing-badge">Uso Interno</span>
        </div>
        <nav className="landing-nav">
          <a href="#inicio">Início</a>
          <a href="#recursos">Recursos</a>
          <a href="#suporte">Suporte</a>
        </nav>
        <Link to="/login" className="landing-header-entrar">
          Entrar
        </Link>
      </header>

      <main className="landing-hero" id="inicio" style={{ backgroundImage: `url(${heroImg})` }}>
        <div className="landing-hero-overlay" />
        <div className="landing-hero-conteudo">
          <span className="landing-eyebrow">Portal da equipe NexLab</span>
          <h1>
            Precisão e excelência<br />em cada coleta
          </h1>
          <p>
            Ferramenta interna para os funcionários do laboratório
            consultarem, com padrão de excelência, o material, o preparo
            e o recipiente corretos de cada exame — coletas seguras,
            consistentes e impecáveis.
          </p>
          <div className="landing-actions">
            <Link to="/login" className="btn btn-primary">
              Consultar exames
            </Link>
            <a href="#suporte" className="btn btn-secondary">
              Falar com o suporte
            </a>
          </div>
        </div>

        <div className="landing-hero-linha" />
      </main>

      <section className="landing-faixa">
        <div className="faixa-item">
          <span className="faixa-icone">✓</span>
          <span>Padronização de coleta</span>
        </div>
        <div className="faixa-divisor" />
        <div className="faixa-item">
          <span className="faixa-icone">⏱</span>
          <span>Consulta em segundos</span>
        </div>
        <div className="faixa-divisor" />
        <div className="faixa-item">
          <span className="faixa-icone">◈</span>
          <span>Cobertura completa de exames</span>
        </div>
      </section>

      <section className="landing-recursos" id="recursos">
        <div className="landing-recursos-topo">
          <span className="landing-eyebrow">Como o NexLab ajuda</span>
          <h2>Tudo que a equipe precisa antes de cada coleta</h2>
          <div className="landing-recursos-linha" />
        </div>

        <div className="landing-recursos-grid">
          <div className="recurso-card">
            <div className="recurso-foto recurso-foto-azul">
              <span className="recurso-icone">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="7" y="2" width="10" height="20" rx="4" />
                </svg>
              </span>
            </div>
            <h3>Tubo e recipiente certos</h3>
            <p>Veja de forma clara qual tubo ou frasco usar para cada exame, com foto e cor de referência.</p>
          </div>

          <div className="recurso-card">
            <div className="recurso-foto recurso-foto-violeta">
              <span className="recurso-icone">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </span>
            </div>
            <h3>Preparo do paciente</h3>
            <p>Jejum, restrições e orientações consultadas em segundos, sem depender de memória ou anotações soltas.</p>
          </div>

          <div className="recurso-card">
            <div className="recurso-foto recurso-foto-teal">
              <span className="recurso-icone">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </span>
            </div>
            <h3>Busca rápida por exame</h3>
            <p>Pesquise por nome, sigla ou código e encontre o passo a passo completo em um único lugar.</p>
          </div>
        </div>
      </section>

      <section className="landing-manifesto">
        <div className="landing-manifesto-linha" />
        <p>
          Um padrão de excelência que acompanha cada etapa da coleta —
          <em> da preparação do paciente ao recipiente final.</em>
        </p>
        <div className="landing-manifesto-linha" />
      </section>

      <section className="landing-guide" id="suporte">
        <div className="landing-guide-conteudo">
          <span className="landing-eyebrow landing-eyebrow-claro">Pronto para começar</span>
          <h2>Guia de coleta por exame</h2>
          <p>
            Pesquise um exame para ver o material, o preparo do paciente e o
            tubo ou recipiente indicado.
          </p>
          <Link to="/login" className="btn btn-dourado">
            Acessar o portal
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span>NexLab · Ferramenta interna de apoio laboratorial</span>
        <a href="mailto:suporte@nexlab.com">suporte@nexlab.com</a>
      </footer>
    </div>
  );
}

export default LandingPage;
