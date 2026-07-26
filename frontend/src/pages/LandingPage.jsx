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
          <a href="#exames">Exames</a>
          <a href="#suporte">Suporte</a>
        </nav>
      </header>

      <main className="landing-hero">
        <div className="landing-hero-text">
          <span className="landing-eyebrow">Portal da equipe NexLab</span>
          <h1>
            Instruções de coleta na palma da mão
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
            <a href="mailto:suporte@nexlab.com" className="btn btn-secondary">
              Falar com o suporte
            </a>
          </div>
        </div>

        <div className="landing-hero-image">
          <img src={heroImg} alt="Profissional de laboratório realizando análise" />
        </div>
      </main>

      <section className="landing-guide">
        <h2>Guia de coleta por exame</h2>
        <p>
          Pesquise um exame para ver o material, o preparo do paciente e o
          tubo ou recipiente indicado.
        </p>
      </section>
    </div>
  );
}

export default LandingPage;