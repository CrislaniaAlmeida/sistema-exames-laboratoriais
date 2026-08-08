import { Link } from 'react-router-dom';
import heroImg from '../assets/hero.jpg';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="landing">
      <div className="landing-blob landing-blob-1" />
      <div className="landing-blob landing-blob-2" />

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

      <main className="landing-hero" id="inicio">
        <div className="landing-hero-text">
          <span className="landing-eyebrow">Portal da equipe NexLab</span>
          <h1>
            Instruções de coleta<br />na palma da mão
          </h1>
          <p>
            Ferramenta interna para os funcionários do laboratório
            consultarem rapidamente material, preparo e recipiente
            corretos de cada exame — garantindo coletas seguras e
            padronizadas.
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

        <div className="landing-hero-image">
          <img src={heroImg} alt="Profissional de laboratório realizando análise" />
          <div className="landing-hero-tag">
            <span className="landing-hero-tag-icone">✓</span>
            <div>
              <strong>Coleta padronizada</strong>
              <span>Material, tubo e preparo sempre corretos</span>
            </div>
          </div>
        </div>
      </main>

      <section className="landing-recursos" id="recursos">
        <div className="landing-recursos-topo">
          <span className="landing-eyebrow landing-eyebrow-centro">Como o NexLab ajuda</span>
          <h2>Tudo que a equipe precisa antes de cada coleta</h2>
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

      <section className="landing-guide" id="suporte">
        <div className="landing-guide-conteudo">
          <span className="landing-eyebrow landing-eyebrow-claro">Pronto para começar</span>
          <h2>Guia de coleta por exame</h2>
          <p>
            Pesquise um exame para ver o material, o preparo do paciente e o
            tubo ou recipiente indicado.
          </p>
          <Link to="/login" className="btn btn-primary btn-grande">
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
