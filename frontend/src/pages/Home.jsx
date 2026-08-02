import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';
import './Home.css';

function Home() {
  const { usuario } = useAuth();
  const [termo, setTermo] = useState('');
  const [exames, setExames] = useState([]);
  const [materiais, setMateriais] = useState({});
  const [tubos, setTubos] = useState({});
  const [totais, setTotais] = useState({ exames: 0, ativos: 0, laboratorios: 0, materiais: 0, tubos: 0 });
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [buscou, setBuscou] = useState(false);

  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        const [respExames, respMateriais, respTubos, respLaboratorios] = await Promise.all([
          api.get('/exames/'),
          api.get('/materiais/'),
          api.get('/tubos/'),
          api.get('/laboratorios/'),
        ]);

        const mapaMateriais = {};
        respMateriais.data.forEach((m) => { mapaMateriais[m.id] = m.nome; });

        const mapaTubos = {};
        respTubos.data.forEach((t) => { mapaTubos[t.id] = t.cor; });

        setMateriais(mapaMateriais);
        setTubos(mapaTubos);
        setExames(respExames.data);
        setTotais({
          exames: respExames.data.length,
          ativos: respExames.data.filter((e) => e.ativo).length,
          laboratorios: respLaboratorios.data.length,
          materiais: respMateriais.data.length,
          tubos: respTubos.data.length,
        });
      } catch {
        // segue com os totais zerados se algo falhar
      }
    }
    carregarDadosIniciais();
  }, []);

  const categorias = useMemo(() => {
    const setoresUnicos = new Set();
    exames.forEach((exame) => {
      if (exame.setor_responsavel) setoresUnicos.add(exame.setor_responsavel);
    });
    return ['Todos', ...Array.from(setoresUnicos)];
  }, [exames]);

  const examesFiltrados = useMemo(() => {
    if (categoriaAtiva === 'Todos') return exames;
    return exames.filter((exame) => exame.setor_responsavel === categoriaAtiva);
  }, [exames, categoriaAtiva]);

  async function handleBuscar(evento) {
    evento.preventDefault();
    setErro('');
    setBuscou(true);
    setCarregando(true);
    setCategoriaAtiva('Todos');
    try {
      if (termo.trim() === '') {
        const resposta = await api.get('/exames/');
        setExames(resposta.data);
      } else {
        const resposta = await api.get('/exames/pesquisar', { params: { termo } });
        setExames(resposta.data);
      }
    } catch (erroRequisicao) {
      if (erroRequisicao.response && erroRequisicao.response.status === 404) {
        setExames([]);
      } else {
        setErro('Nao foi possivel buscar os exames. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  }

  function limparFiltros() {
    setTermo('');
    setCategoriaAtiva('Todos');
    setBuscou(false);
  }

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-cabecalho">
          <span className="dashboard-eyebrow">Gestao Laboratorial</span>
          <h1>Central de Consulta Laboratorial</h1>
          <p>Consulte rapidamente exames, preparo do paciente, materiais utilizados e tubos indicados.</p>
        </div>

        <form onSubmit={handleBuscar} className="dashboard-busca">
          <div className="dashboard-busca-campo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Pesquisar exame por nome, sigla ou codigo..."
            />
          </div>
          <button type="submit" disabled={carregando} className="dashboard-busca-botao">
            {carregando ? 'Buscando...' : 'Pesquisar'}
          </button>
          <button type="button" onClick={limparFiltros} className="dashboard-limpar-botao">
            Limpar filtros
          </button>
        </form>

        <div className="dashboard-categorias">
          {categorias.map((categoria) => (
            <button
              key={categoria}
              className={`categoria-pill ${categoriaAtiva === categoria ? 'categoria-pill-ativa' : ''}`}
              onClick={() => setCategoriaAtiva(categoria)}
              type="button"
            >
              {categoria}
            </button>
          ))}
        </div>

        <div className="dashboard-secao-titulo">Acesso rapido</div>
        <div className="acesso-rapido-grid">
          <div className="acesso-rapido-card">
            <span className="acesso-rapido-icone">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <span>Pesquisar Exame</span>
          </div>

          {usuario?.perfil === 'admin' ? (
            <Link to="/exames/gerenciar" className="acesso-rapido-card acesso-rapido-card-link">
              <span className="acesso-rapido-icone">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span>Cadastrar Exame</span>
            </Link>
          ) : (
            <div className="acesso-rapido-card acesso-rapido-card-desabilitada">
              <span className="acesso-rapido-icone">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span>Cadastrar Exame</span>
            </div>
          )}

          <div className="acesso-rapido-card acesso-rapido-card-desabilitada">
            <span className="acesso-rapido-icone">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </span>
            <span>Materiais</span>
          </div>

          <div className="acesso-rapido-card acesso-rapido-card-desabilitada">
            <span className="acesso-rapido-icone">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V3" />
                <path d="M9 3h6" />
              </svg>
            </span>
            <span>Laboratorios</span>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-card-topo">
              <span className="stat-label">Exames cadastrados</span>
              <span className="stat-icone">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 2v4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3V2" />
                </svg>
              </span>
            </div>
            <span className="stat-valor">{totais.exames}</span>
            <span className="stat-contexto">{totais.ativos} ativos no sistema</span>
          </div>
          <div className="stat-card">
            <div className="stat-card-topo">
              <span className="stat-label">Laboratorios de apoio</span>
              <span className="stat-icone">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 3v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V3" />
                </svg>
              </span>
            </div>
            <span className="stat-valor">{totais.laboratorios}</span>
            <span className="stat-contexto">Cadastrados no sistema</span>
          </div>
          <div className="stat-card">
            <div className="stat-card-topo">
              <span className="stat-label">Materiais cadastrados</span>
              <span className="stat-icone">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </span>
            </div>
            <span className="stat-valor">{totais.materiais}</span>
            <span className="stat-contexto">Tipos disponiveis</span>
          </div>
          <div className="stat-card">
            <div className="stat-card-topo">
              <span className="stat-label">Tubos cadastrados</span>
              <span className="stat-icone">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="7" y="2" width="10" height="20" rx="4" />
                </svg>
              </span>
            </div>
            <span className="stat-valor">{totais.tubos}</span>
            <span className="stat-contexto">Cores cadastradas</span>
          </div>
        </div>

        {erro && <p className="dashboard-erro">{erro}</p>}
        {buscou && !carregando && examesFiltrados.length === 0 && !erro && (
          <p className="dashboard-vazio">Nenhum exame encontrado para esse filtro.</p>
        )}

        <div className="dashboard-resultados">
          <div className="dashboard-resultados-cabecalho">
            <h2>Resultados da consulta</h2>
            <span className="dashboard-resultados-contagem">
              {examesFiltrados.length} {examesFiltrados.length === 1 ? 'exame encontrado' : 'exames encontrados'}
            </span>
          </div>

          <div className="exames-lista">
            {examesFiltrados.map((exame) => (
              <div key={exame.id} className="exame-card">
                <div className="exame-card-principal">
                  <div className="exame-card-titulo">
                    <div className="exame-card-titulo-linha">
                      <h3>{exame.nome}</h3>
                      {exame.sigla && <span className="tag tag-sigla">{exame.sigla}</span>}
                      <span className={`tag ${exame.ativo ? 'tag-ativo' : 'tag-inativo'}`}>
                        {exame.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <span className="exame-codigo">
                      Codigo: {exame.codigo || '-'} • Sigla: {exame.sigla || '-'}
                    </span>
                  </div>

                  <div className="exame-campos">
                    <div>
                      <span className="exame-campo-label">Material</span>
                      <span className="exame-campo-valor">{materiais[exame.material_id] || '-'}</span>
                    </div>
                    <div>
                      <span className="exame-campo-label">Tubo</span>
                      <span className="exame-campo-valor">{tubos[exame.tubo_id] || '-'}</span>
                    </div>
                    <div>
                      <span className="exame-campo-label">Metodo</span>
                      <span className="exame-campo-valor">{exame.metodo_utilizado || 'Nao informado'}</span>
                    </div>
                    <div>
                      <span className="exame-campo-label">Liberacao</span>
                      <span className="exame-campo-valor">{exame.prazo_liberacao_resultado || 'Nao informado'}</span>
                    </div>
                  </div>

                  <Link to={`/exames/${exame.id}`} className="exame-detalhes-botao">
                    Visualizar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Home;