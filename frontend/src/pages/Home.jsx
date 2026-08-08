import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';
import heroImg from '../assets/hero.jpg';
import './Home.css';

const ITENS_POR_PAGINA = 20;

const CORES_TUBO = {
  roxo: '#7c3aed',
  vermelho: '#dc2626',
  amarelo: '#eab308',
  azul: '#0057e0',
  verde: '#16a34a',
  cinza: '#6b7280',
  rosa: '#ec4899',
  preto: '#111827',
  laranja: '#ea580c',
  branco: '#e5e7eb',
  bege: '#d6c7a8',
};

function corHexDoTubo(nomeCor) {
  if (!nomeCor) return null;
  const chave = Object.keys(CORES_TUBO).find((cor) => nomeCor.toLowerCase().includes(cor));
  return chave ? CORES_TUBO[chave] : '#94a3b8';
}

function Home() {
  const { usuario } = useAuth();
  const [termo, setTermo] = useState('');
  const [exames, setExames] = useState([]);
  const [materiais, setMateriais] = useState({});
  const [tubos, setTubos] = useState({});
  const [totais, setTotais] = useState({ exames: 0, ativos: 0, laboratorios: 0, materiais: 0, tubos: 0 });
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [pagina, setPagina] = useState(1);
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

  const mostrarResultados = buscou || categoriaAtiva !== 'Todos';

  const totalPaginas = Math.max(1, Math.ceil(examesFiltrados.length / ITENS_POR_PAGINA));

  const examesPaginados = useMemo(() => {
    const inicio = (pagina - 1) * ITENS_POR_PAGINA;
    return examesFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [examesFiltrados, pagina]);

  async function handleBuscar(evento) {
    evento.preventDefault();
    setErro('');
    setBuscou(true);
    setCarregando(true);
    setCategoriaAtiva('Todos');
    setPagina(1);
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
    setPagina(1);
  }

  function selecionarCategoria(categoria) {
    setCategoriaAtiva(categoria);
    setPagina(1);
  }

  function irParaPagina(novaPagina) {
    setPagina(novaPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <Layout>
      <div className="dashboard">
        <section className="hero" style={{ backgroundImage: `url(${heroImg})` }}>
          <div className="hero-overlay" />
          <div className="hero-shade" />
          <div className="hero-conteudo">
            <span className="hero-eyebrow">Gestao Laboratorial</span>
            <h1>Central de Consulta Laboratorial</h1>
            <p>Consulte rapidamente exames, preparo do paciente, materiais utilizados e tubos indicados.</p>

            <form onSubmit={handleBuscar} className="hero-busca">
              <div className="hero-busca-campo">
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
              <button type="submit" disabled={carregando} className="hero-busca-botao">
                {carregando ? 'Buscando...' : 'Pesquisar'}
              </button>
              <button type="button" onClick={limparFiltros} className="hero-limpar-botao">
                Limpar
              </button>
            </form>
          </div>
        </section>

        <div className="dashboard-categorias">
          {categorias.map((categoria) => (
            <button
              key={categoria}
              className={`categoria-pill ${categoriaAtiva === categoria ? 'categoria-pill-ativa' : ''}`}
              onClick={() => selecionarCategoria(categoria)}
              type="button"
            >
              {categoria}
            </button>
          ))}
        </div>

        <div className="dashboard-secao-titulo">Acesso rapido</div>
        <div className="acesso-rapido-grid">
          <div className="acesso-rapido-card">
            <span className="acesso-rapido-icone acesso-rapido-icone-azul">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <span>Pesquisar Exame</span>
          </div>

          {usuario?.perfil === 'admin' ? (
            <Link to="/exames/gerenciar" className="acesso-rapido-card acesso-rapido-card-link">
              <span className="acesso-rapido-icone acesso-rapido-icone-violeta">
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
            <span className="acesso-rapido-icone acesso-rapido-icone-teal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </span>
            <span>Materiais</span>
          </div>

          <div className="acesso-rapido-card acesso-rapido-card-desabilitada">
            <span className="acesso-rapido-icone acesso-rapido-icone-amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V3" />
                <path d="M9 3h6" />
              </svg>
            </span>
            <span>Laboratorios</span>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card stat-card-azul">
            <div className="stat-card-foto">
              <span className="stat-card-icone">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 2v4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3V2" />
                </svg>
              </span>
            </div>
            <span className="stat-label">Exames cadastrados</span>
            <span className="stat-valor">{totais.exames}</span>
            <span className="stat-contexto">{totais.ativos} ativos no sistema</span>
          </div>
          <div className="stat-card stat-card-violeta">
            <div className="stat-card-foto">
              <span className="stat-card-icone">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 3v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V3" />
                </svg>
              </span>
            </div>
            <span className="stat-label">Laboratorios de apoio</span>
            <span className="stat-valor">{totais.laboratorios}</span>
            <span className="stat-contexto">Cadastrados no sistema</span>
          </div>
          <div className="stat-card stat-card-teal">
            <div className="stat-card-foto">
              <span className="stat-card-icone">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </span>
            </div>
            <span className="stat-label">Materiais cadastrados</span>
            <span className="stat-valor">{totais.materiais}</span>
            <span className="stat-contexto">Tipos disponiveis</span>
          </div>
          <div className="stat-card stat-card-amber">
            <div className="stat-card-foto">
              <span className="stat-card-icone">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="7" y="2" width="10" height="20" rx="4" />
                </svg>
              </span>
            </div>
            <span className="stat-label">Tubos cadastrados</span>
            <span className="stat-valor">{totais.tubos}</span>
            <span className="stat-contexto">Cores cadastradas</span>
          </div>
        </div>

        {erro && <p className="dashboard-erro">{erro}</p>}
        {buscou && !carregando && examesFiltrados.length === 0 && !erro && (
          <p className="dashboard-vazio">Nenhum exame encontrado para esse filtro.</p>
        )}

        {!mostrarResultados ? (
          <div className="dashboard-resultados-vazio">
            <span className="dashboard-resultados-vazio-icone">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <p>Pesquise um exame ou escolha uma categoria para ver os resultados aqui.</p>
          </div>
        ) : (
        <div className="dashboard-resultados">
          <div className="dashboard-resultados-cabecalho">
            <h2>Resultados da consulta</h2>
            <span className="dashboard-resultados-contagem">
              {examesFiltrados.length} {examesFiltrados.length === 1 ? 'exame encontrado' : 'exames encontrados'}
            </span>
          </div>

          <div className="tabela-exames-wrapper">
            <table className="tabela-exames">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Exame</th>
                  <th>Categoria</th>
                  <th>Tubo</th>
                  <th>Material</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {examesPaginados.map((exame) => (
                  <tr key={exame.id}>
                    <td className="tabela-exames-codigo">{exame.codigo || '-'}</td>
                    <td>
                      <span className="tabela-exames-nome">{exame.nome}</span>
                      {exame.sigla && <span className="tag tag-sigla">{exame.sigla}</span>}
                    </td>
                    <td>
                      {exame.setor_responsavel ? (
                        <span className="tabela-exames-categoria">{exame.setor_responsavel}</span>
                      ) : '-'}
                    </td>
                    <td>
                      {tubos[exame.tubo_id] ? (
                        <span className="tabela-exames-tubo">
                          <span
                            className="tabela-exames-tubo-cor"
                            style={{ backgroundColor: corHexDoTubo(tubos[exame.tubo_id]) }}
                          />
                          {tubos[exame.tubo_id]}
                        </span>
                      ) : '-'}
                    </td>
                    <td>{materiais[exame.material_id] || '-'}</td>
                    <td>
                      <span className={`tag ${exame.ativo ? 'tag-ativo' : 'tag-inativo'}`}>
                        {exame.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/exames/${exame.id}`} className="exame-detalhes-botao">
                        Visualizar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="paginacao">
              <button
                className="paginacao-botao"
                onClick={() => irParaPagina(pagina - 1)}
                disabled={pagina === 1}
              >
                ← Anterior
              </button>
              <span className="paginacao-info">
                Pagina {pagina} de {totalPaginas}
              </span>
              <button
                className="paginacao-botao"
                onClick={() => irParaPagina(pagina + 1)}
                disabled={pagina === totalPaginas}
              >
                Proxima →
              </button>
            </div>
          )}
        </div>
        )}
      </div>
    </Layout>
  );
}

export default Home;
