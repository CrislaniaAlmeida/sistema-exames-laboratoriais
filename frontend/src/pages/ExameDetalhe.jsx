import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';
import './ExameDetalhe.css';

const coresConhecidas = {
  amarelo: '#f5c518',
  roxo: '#7c3aed',
  azul: '#2563eb',
  cinza: '#94a3b8',
  vermelho: '#dc2626',
  verde: '#16a34a',
  rosa: '#ec4899',
  laranja: '#f97316',
};

function corParaHex(nomeCor) {
  if (!nomeCor) return '#cbd5e1';
  const chave = Object.keys(coresConhecidas).find((c) =>
    nomeCor.toLowerCase().includes(c)
  );
  return chave ? coresConhecidas[chave] : '#cbd5e1';
}

function ExameDetalhe() {
  const { id } = useParams();
  const { usuario } = useAuth();

  const [exame, setExame] = useState(null);
  const [material, setMaterial] = useState(null);
  const [tubo, setTubo] = useState(null);
  const [laboratorio, setLaboratorio] = useState(null);
  const [listaLaboratorios, setListaLaboratorios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [editandoProcessamento, setEditandoProcessamento] = useState(false);
  const [laboratorioSelecionado, setLaboratorioSelecionado] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregarDados() {
    setCarregando(true);
    setErro('');
    try {
      const respExame = await api.get(`/exames/${id}`);
      const dadosExame = respExame.data;
      setExame(dadosExame);
      setLaboratorioSelecionado(dadosExame.laboratorio_id ?? '');

      const respLaboratorios = await api.get('/laboratorios/');
      setListaLaboratorios(respLaboratorios.data);

      if (dadosExame.material_id) {
        const respMateriais = await api.get('/materiais/');
        const encontrado = respMateriais.data.find((m) => m.id === dadosExame.material_id);
        setMaterial(encontrado || null);
      } else {
        setMaterial(null);
      }

      if (dadosExame.tubo_id) {
        const respTubos = await api.get('/tubos/');
        const encontrado = respTubos.data.find((t) => t.id === dadosExame.tubo_id);
        setTubo(encontrado || null);
      } else {
        setTubo(null);
      }

      if (dadosExame.laboratorio_id) {
        const encontrado = respLaboratorios.data.find((l) => l.id === dadosExame.laboratorio_id);
        setLaboratorio(encontrado || null);
      } else {
        setLaboratorio(null);
      }
    } catch {
      setErro('Nao foi possivel carregar os dados desse exame.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function abrirEdicaoProcessamento() {
    setLaboratorioSelecionado(exame.laboratorio_id ?? '');
    setEditandoProcessamento(true);
  }

  function cancelarEdicaoProcessamento() {
    setEditandoProcessamento(false);
  }

  async function salvarProcessamento() {
    setSalvando(true);
    setErro('');
    try {
      const payload = {
        laboratorio_id: laboratorioSelecionado === '' ? null : Number(laboratorioSelecionado),
      };
      await api.put(`/exames/${id}`, payload);
      setEditandoProcessamento(false);
      await carregarDados();
    } catch {
      setErro('Nao foi possivel atualizar o local de processamento.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <Layout>
        <p className="exame-detalhe-carregando">Carregando dados do exame...</p>
      </Layout>
    );
  }

  if (erro && !exame) {
    return (
      <Layout>
        <div className="exame-detalhe-erro">
          <p>{erro}</p>
          <Link to="/exames" className="exame-detalhe-voltar">← Voltar para o dashboard</Link>
        </div>
      </Layout>
    );
  }

  if (!exame) {
    return (
      <Layout>
        <div className="exame-detalhe-erro">
          <p>Exame nao encontrado.</p>
          <Link to="/exames" className="exame-detalhe-voltar">← Voltar para o dashboard</Link>
        </div>
      </Layout>
    );
  }

  const processamento = laboratorio
    ? { tipo: 'Laboratorio de apoio', nome: laboratorio.nome }
    : { tipo: 'Processamento interno', nome: 'Realizado na propria unidade' };

  return (
    <Layout>
      <div className="exame-detalhe">
        <Link to="/exames" className="exame-detalhe-voltar">← Voltar para o dashboard</Link>

        <div className="exame-detalhe-cabecalho">
          <div>
            <div className="exame-detalhe-titulo-linha">
              <h1>{exame.nome}</h1>
              {exame.sigla && <span className="tag tag-sigla">{exame.sigla}</span>}
              <span className={`tag ${exame.ativo ? 'tag-ativo' : 'tag-inativo'}`}>
                {exame.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="exame-detalhe-subtitulo">
              Codigo: {exame.codigo || '-'} • Setor responsavel: {exame.setor_responsavel || 'Nao informado'}
            </p>
          </div>
          <div className={`processamento-badge ${laboratorio ? 'processamento-badge-externo' : 'processamento-badge-interno'}`}>
            {processamento.tipo}
          </div>
        </div>

        {erro && <p className="exame-detalhe-erro-inline">{erro}</p>}

        <div className="exame-detalhe-grid">
          <div className="exame-detalhe-card exame-detalhe-card-tubo">
            <h2>Tubo de coleta</h2>
            {tubo?.foto_url ? (
              <img src={tubo.foto_url} alt={`Tubo ${tubo.cor}`} className="tubo-foto" />
            ) : (
              <div className="tubo-amostra" style={{ backgroundColor: corParaHex(tubo?.cor) }}>
                <div className="tubo-amostra-tampa" style={{ backgroundColor: corParaHex(tubo?.cor) }} />
              </div>
            )}
            <span className="tubo-cor-nome">{tubo?.cor || 'Nao informado'}</span>
            {tubo?.descricao && <p className="tubo-descricao">{tubo.descricao}</p>}
          </div>

          <div className="exame-detalhe-card">
            <h2>Material e coleta</h2>
            <div className="exame-detalhe-campo">
              <span className="campo-label">Material</span>
              <span className="campo-valor">{material?.nome || 'Nao informado'}</span>
            </div>
            <div className="exame-detalhe-campo">
              <span className="campo-label">Forma de coleta</span>
              <span className="campo-valor">{exame.forma_coleta || 'Nao informado'}</span>
            </div>
            <div className="exame-detalhe-campo-dupla">
              <div>
                <span className="campo-label">Volume minimo</span>
                <span className="campo-valor">{exame.volume_minimo || 'Nao informado'}</span>
              </div>
              <div>
                <span className="campo-label">Volume ideal</span>
                <span className="campo-valor">{exame.volume_ideal || 'Nao informado'}</span>
              </div>
            </div>
          </div>

          <div className="exame-detalhe-card">
            <h2>Preparo do paciente</h2>
            <div className="exame-detalhe-campo">
              <span className="campo-label">Jejum necessario</span>
              <span className="campo-valor">{exame.jejum_necessario || 'Nao informado'}</span>
            </div>
            <div className="exame-detalhe-campo">
              <span className="campo-label">Preparo</span>
              <span className="campo-valor">{exame.preparo_paciente || 'Nenhum preparo especial informado'}</span>
            </div>
          </div>

          <div className="exame-detalhe-card">
            <div className="exame-detalhe-card-topo">
              <h2>Processamento</h2>
              {usuario?.perfil === 'admin' && !editandoProcessamento && (
                <button className="processamento-editar-botao" onClick={abrirEdicaoProcessamento}>
                  Editar
                </button>
              )}
            </div>

            {editandoProcessamento ? (
              <div className="processamento-edicao">
                <label className="campo-label" htmlFor="select-laboratorio">
                  Onde e processado
                </label>
                <select
                  id="select-laboratorio"
                  value={laboratorioSelecionado}
                  onChange={(e) => setLaboratorioSelecionado(e.target.value)}
                >
                  <option value="">Processamento interno (sem laboratorio de apoio)</option>
                  {listaLaboratorios.map((lab) => (
                    <option key={lab.id} value={lab.id}>Enviar para: {lab.nome}</option>
                  ))}
                </select>
                <div className="processamento-edicao-acoes">
                  <button
                    className="processamento-salvar-botao"
                    onClick={salvarProcessamento}
                    disabled={salvando}
                  >
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    className="processamento-cancelar-botao"
                    onClick={cancelarEdicaoProcessamento}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>
                </div>
                {listaLaboratorios.length === 0 && (
                  <p className="processamento-aviso">
                    Nenhum laboratorio de apoio cadastrado ainda.{' '}
                    <Link to="/laboratorios">Cadastrar um laboratorio</Link>
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="exame-detalhe-campo">
                  <span className="campo-label">Onde e realizado</span>
                  <span className="campo-valor">{processamento.nome}</span>
                </div>
                <div className="exame-detalhe-campo">
                  <span className="campo-label">Metodo utilizado</span>
                  <span className="campo-valor">{exame.metodo_utilizado || 'Nao informado'}</span>
                </div>
                <div className="exame-detalhe-campo-dupla">
                  <div>
                    <span className="campo-label">Temperatura de armazenamento</span>
                    <span className="campo-valor">{exame.temperatura_armazenamento || 'Nao informado'}</span>
                  </div>
                  <div>
                    <span className="campo-label">Tempo maximo de envio</span>
                    <span className="campo-valor">{exame.tempo_maximo_envio || 'Nao informado'}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="exame-detalhe-card">
            <h2>Prazos</h2>
            <div className="exame-detalhe-campo-dupla">
              <div>
                <span className="campo-label">Dias de realizacao</span>
                <span className="campo-valor">{exame.dias_realizacao || 'Nao informado'}</span>
              </div>
              <div>
                <span className="campo-label">Prazo de liberacao</span>
                <span className="campo-valor">{exame.prazo_liberacao_resultado || 'Nao informado'}</span>
              </div>
            </div>
          </div>

          {exame.observacoes && (
            <div className="exame-detalhe-card exame-detalhe-card-observacoes">
              <h2>Observacoes</h2>
              <p className="campo-valor">{exame.observacoes}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default ExameDetalhe;