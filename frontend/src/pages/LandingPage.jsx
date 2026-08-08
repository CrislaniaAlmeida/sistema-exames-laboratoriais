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
          <span className="landing-badge">Laboratorial</span>
        </div>

        <nav className="landing-nav">
          <a href="#recursos">Recursos</a>
          <a href="#sobre">Sobre</a>
          <a href="#contato">Contato</a>
        </nav>

        <Link to="/login" className="btn btn-secondary">
          Entrar
        </Link>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-text">
          <span className="landing-eyebrow">Gestão Laboratorial</span>
          <h1>Exames, materiais e tubos, tudo em um só lugar.</h1>
          <p>
            Consulte rapidamente informações de preparo, material coletado e tubo indicado
            para cada exame do laboratório, com dados sempre atualizados.
          </p>

          <div className="landing-actions">
            <Link to="/login" className="btn btn-primary">
              Consultar exames
            </Link>
            <a href="#contato" className="btn btn-secondary">
              Falar com o suporte
            </a>
          </div>
        </div>

        <div className="landing-hero-image">
          <img src={heroImg} alt="Laboratório NexLab" />
        </div>
      </section>

      <section className="landing-guide" id="sobre">
        <h2>Feito para o dia a dia do laboratório</h2>
        <p>
          Uma central única para sua equipe consultar exames, acompanhar preparo do paciente
          e organizar materiais e tubos com agilidade.
        </p>
      </section>
    </div>
  );
}

export default LandingPage;