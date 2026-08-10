import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import './PacientesGerenciar.css';

function formatarDataBr(data) {
  if (!data) return '-';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

const iconePaciente = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>
);
const iconeTubo = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 2v6.34a2 2 0 0 1-.4 1.2L4 16a2 2 0 0 0 1.6 3.2h12.8A2 2 0 0 0 20 16l-4.6-6.46a2 2 0 0 1-.4-1.2V2" /><path d="M8.5 2h7" /></svg>
);
const iconeHistorico = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
);
const iconePdf = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>
);
const iconeVazio = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 2v6.34a2 2 0 0 1-.4 1.2L4 16a2 2 0 0 0 1.6 3.2h12.8A2 2 0 0 0 20 16l-4.6-6.46a2 2 0 0 1-.4-1.2V2" /><path d="M8.5 2h7" /></svg>
);

function PacienteExames() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState(null);
  const [examesDisponiveis, setExamesDisponiveis] = useState([]);
  const [historico, setHistorico] = useState([]);

  const [termoExame, setTermoExame] = useState('');
  const [examesSelecionados, setExamesSelecionados] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [concluindo, setConcluindo] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  async function carregarTudo() {
    setCarregando(true);
    try {
      const [respPaciente, respExames, respHistorico] = await Promise.all([
        api.get(`/pacientes/${id}`),
        api.get('/exames/'),
        api.get(`/pacientes/${id}/solicitacoes`),
      ]);
      setPaciente(respPaciente.data);
      setExamesDisponiveis(respExames.data);
      setHistorico(respHistorico.data);
    } catch {
      setErro('Nao foi possivel carregar os dados do paciente.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const termoBusca = termoExame.trim().toLowerCase();

  function prioridadeSigla(sigla) {
    if (sigla === termoBusca) return 0;
    if (sigla.startsWith(termoBusca)) return 1;
    return 2;
  }

  const sugestoesExame = termoBusca.length < 1 ? [] : examesDisponiveis
    .filter((exame) => !examesSelecionados.some((selecionado) => selecionado.id === exame.id))
    .filter((exame) => {
      const sigla = (exame.sigla || '').toLowerCase();
      return sigla.includes(termoBusca) || exame.nome.toLowerCase().includes(termoBusca);
    })
    .sort((a, b) => prioridadeSigla((a.sigla || '').toLowerCase()) - prioridadeSigla((b.sigla || '').toLowerCase()))
    .slice(0, 8);

  function adicionarExame(exame) {
    setExamesSelecionados((atual) => [...atual, exame]);
    setTermoExame('');
  }

  function removerExame(exameId) {
    setExamesSelecionados((atual) => atual.filter((e) => e.id !== exameId));
  }

  async function handleConcluir() {
    setErro('');
    setMensagem('');

    if (examesSelecionados.length === 0) {
      setErro('Adicione ao menos um exame antes de concluir.');
      return;
    }

    const confirmar = window.confirm(
      `Confirma os exames solicitados para "${paciente.nome}"? ` +
      `Isso vai gerar o comprovante em PDF com ${examesSelecionados.length} exame(s).`
    );
    if (!confirmar) return;

    setConcluindo(true);
    try {
      const respostaSolicitacao = await api.post(`/pacientes/${id}/solicitacoes`, {
        exame_ids: examesSelecionados.map((exame) => exame.id),
      });

      const { gerarPdfSolicitacao, gerarEtiquetasTubos } = await import('../services/pdfSolicitacao');
      gerarPdfSolicitacao({
        paciente,
        exames: respostaSolicitacao.data.exames,
        dataSolicitacao: new Date(respostaSolicitacao.data.data_solicitacao),
      });

      const amostras = gerarEtiquetasTubos({
        paciente,
        amostras: respostaSolicitacao.data.amostras,
      });

      const semTuboDefinido = amostras.filter((amostra) => !amostra.tubo_cor).length;
      const avisoTubo = semTuboDefinido
        ? ` Atencao: ${semTuboDefinido} etiqueta(s) ficaram marcadas "A confirmar" porque esses exames ainda nao tem tubo cadastrado em Gerenciar Exames.`
        : '';

      setMensagem(
        `Solicitacao concluida. O comprovante e as etiquetas de tubo (${amostras.length}) foram baixados.${avisoTubo}`
      );
      setExamesSelecionados([]);
      carregarTudo();
    } catch (erroRequisicao) {
      setErro(erroRequisicao.response?.data?.detail || 'Nao foi possivel concluir a solicitacao.');
    } finally {
      setConcluindo(false);
    }
  }

  if (carregando) {
    return (
      <Layout>
        <div className="gerenciar gerenciar-pacientes">
          <p>Carregando...</p>
        </div>
      </Layout>
    );
  }

  if (!paciente) {
    return (
      <Layout>
        <div className="gerenciar gerenciar-pacientes">
          <p className="gerenciar-erro">{erro || 'Paciente nao encontrado.'}</p>
          <Link to="/pacientes" className="gerenciar-voltar-topo">← Voltar para pacientes</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="gerenciar gerenciar-pacientes">
        <Link to="/pacientes" className="gerenciar-voltar-topo">← Voltar para pacientes</Link>

        <div className="paciente-resumo-card">
          <span className="paciente-resumo-avatar">{iconePaciente}</span>
          <div>
            <h1 className="paciente-resumo-nome">{paciente.nome}</h1>
            <div className="paciente-resumo-tags">
              <span className="paciente-resumo-tag">{paciente.codigo}</span>
              <span className="paciente-resumo-tag">CPF {paciente.cpf}</span>
              <span className="paciente-resumo-tag">Nascimento {formatarDataBr(paciente.data_nascimento)}</span>
            </div>
          </div>
        </div>

        {erro && <p className="gerenciar-erro">{erro}</p>}
        {mensagem && <p className="gerenciar-mensagem">{mensagem}</p>}

        <div className="gerenciar-form">
          <h2><span className="paciente-secao-icone">{iconeTubo}</span>Novos exames solicitados</h2>

          <div className="paciente-exames-busca">
            <input
              type="text"
              autoComplete="off"
              value={termoExame}
              onChange={(e) => setTermoExame(e.target.value)}
              placeholder="Digite a sigla ou o nome do exame..."
            />
            {sugestoesExame.length > 0 && (
              <div className="paciente-exames-sugestoes">
                {sugestoesExame.map((exame) => (
                  <button
                    type="button"
                    key={exame.id}
                    className="paciente-exames-sugestao"
                    onClick={() => adicionarExame(exame)}
                  >
                    <strong>{exame.sigla || exame.nome}</strong>
                    {exame.sigla && <span> — {exame.nome}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {examesSelecionados.length > 0 ? (
            <ul className="paciente-exames-lista">
              {examesSelecionados.map((exame) => (
                <li key={exame.id}>
                  <span>{exame.nome} {exame.sigla && <span className="tag-sigla-mini">{exame.sigla}</span>}</span>
                  <button type="button" onClick={() => removerExame(exame.id)}>×</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="paciente-exames-vazio">Nenhum exame adicionado ainda.</p>
          )}

          <div className="form-acoes">
            <button type="button" className="paciente-concluir" onClick={handleConcluir} disabled={concluindo}>
              {iconePdf}{concluindo ? 'Gerando...' : 'Concluir e gerar PDF'}
            </button>
            <button type="button" className="form-cancelar" onClick={() => navigate('/pacientes')}>
              Voltar para pacientes
            </button>
          </div>
        </div>

        <div className="gerenciar-cabecalho">
          <h2 className="paciente-secao-titulo"><span className="paciente-secao-icone">{iconeHistorico}</span>Solicitacoes anteriores</h2>
        </div>

        {historico.length === 0 ? (
          <div className="paciente-estado-vazio">
            <span className="paciente-estado-vazio-icone">{iconeVazio}</span>
            <p>Nenhuma solicitacao registrada ainda para este paciente.</p>
          </div>
        ) : (
          <table className="gerenciar-tabela">
            <thead>
              <tr>
                <th>Data</th>
                <th>Exames</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((solicitacao) => (
                <tr key={solicitacao.id}>
                  <td>{new Date(solicitacao.data_solicitacao).toLocaleDateString('pt-BR')}</td>
                  <td>{solicitacao.exames.map((e) => e.sigla || e.nome).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

export default PacienteExames;
