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
const iconeLink = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
);
const iconeWhatsapp = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.62 1.44 5.13L2 22l5.15-1.53a9.85 9.85 0 0 0 4.89 1.3h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.1h-.01a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.06.91.92-2.98-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.53 3.68-8.21 8.22-8.21 2.2 0 4.26.86 5.81 2.41a8.16 8.16 0 0 1 2.4 5.81c0 4.53-3.69 8.08-8.32 8.08Zm4.5-6.13c-.25-.12-1.47-.72-1.69-.81-.23-.08-.4-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.22-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.12-.12.27-.31.4-.46.14-.16.18-.27.27-.45.09-.19.05-.34-.02-.47-.08-.12-.62-1.5-.85-2.05-.17-.42-.35-.36-.48-.37h-.4c-.14 0-.36.05-.55.27-.19.22-.73.71-.73 1.72 0 1.02.75 2 .86 2.14.11.14 1.51 2.31 3.66 3.15 1.82.71 2.19.57 2.58.53.4-.04 1.28-.52 1.46-1.03.18-.5.18-.93.13-1.02-.05-.09-.19-.14-.44-.26Z" /></svg>
);
const iconeRenovar = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" /><path d="M3 21v-5h5" /></svg>
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
  const [renovandoId, setRenovandoId] = useState(null);
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

  async function gerarLaudo(solicitacao) {
    const { gerarLaudoPdf } = await import('../services/pdfSolicitacao');
    gerarLaudoPdf({ paciente, solicitacao });
  }

  function linkPortal(solicitacao) {
    if (!solicitacao.token_publico) return null;
    return `${window.location.origin}/portal/${solicitacao.token_publico}`;
  }

  async function copiarLink(solicitacao) {
    const link = linkPortal(solicitacao);
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setMensagem('Link do paciente copiado.');
  }

  function numeroWhatsapp(celular) {
    const digitos = (celular || '').replace(/\D/g, '');
    if (!digitos) return null;
    return digitos.length <= 11 ? `55${digitos}` : digitos;
  }

  function abrirWhatsapp(solicitacao) {
    const link = linkPortal(solicitacao);
    const numero = numeroWhatsapp(paciente.celular);
    if (!link || !numero) return;
    const texto = encodeURIComponent(
      `Ola, ${paciente.nome}! Aqui esta o link para acompanhar o resultado do seu exame: ${link}`
    );
    window.open(`https://wa.me/${numero}?text=${texto}`, '_blank');
  }

  async function renovarLink(solicitacao) {
    setErro('');
    setMensagem('');
    setRenovandoId(solicitacao.id);
    try {
      await api.put(`/pacientes/${id}/solicitacoes/${solicitacao.id}/renovar-link`);
      setMensagem('Link do paciente renovado. O link anterior parou de funcionar.');
      carregarTudo();
    } catch (erroRequisicao) {
      setErro(erroRequisicao.response?.data?.detail || 'Nao foi possivel renovar o link.');
    } finally {
      setRenovandoId(null);
    }
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

        <div className="paciente-banner paciente-banner-exames">
          <span className="paciente-banner-legenda">Etiquetas com codigo de barras por amostra, prontas para o setor</span>
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
                <th>Coleta</th>
                <th>Resultado</th>
                <th>Laudo</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((solicitacao) => {
                const amostras = solicitacao.amostras || [];
                const itens = amostras.flatMap((a) => a.itens || []);
                const coletadas = amostras.filter((a) => a.status === 'coletado').length;
                const disponiveis = itens.filter((i) => i.status_resultado === 'disponivel').length;
                return (
                  <tr key={solicitacao.id}>
                    <td>{new Date(solicitacao.data_solicitacao).toLocaleDateString('pt-BR')}</td>
                    <td>{solicitacao.exames.map((e) => e.sigla || e.nome).join(', ')}</td>
                    <td>
                      <span className={`tag-status-mini ${coletadas === amostras.length && amostras.length > 0 ? 'tag-status-feito' : 'tag-status-pendente'}`}>
                        {coletadas}/{amostras.length}
                      </span>
                    </td>
                    <td>
                      <span className={`tag-status-mini ${disponiveis === itens.length && itens.length > 0 ? 'tag-status-feito' : 'tag-status-pendente'}`}>
                        {disponiveis}/{itens.length}
                      </span>
                    </td>
                    <td className="gerenciar-acoes">
                      <button
                        type="button"
                        disabled={disponiveis === 0}
                        title={disponiveis === 0 ? 'Nenhum resultado liberado ainda' : ''}
                        onClick={() => gerarLaudo(solicitacao)}
                      >
                        {iconePdf}Gerar laudo
                      </button>
                      {solicitacao.token_expirado ? (
                        <button
                          type="button"
                          disabled={renovandoId === solicitacao.id}
                          title="Este link venceu. Gere um novo para o paciente."
                          onClick={() => renovarLink(solicitacao)}
                        >
                          {iconeRenovar}{renovandoId === solicitacao.id ? 'Renovando...' : 'Link vencido — renovar'}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={!solicitacao.token_publico}
                            title="Copiar o link do portal do paciente"
                            onClick={() => copiarLink(solicitacao)}
                          >
                            {iconeLink}Copiar link
                          </button>
                          <button
                            type="button"
                            disabled={!solicitacao.token_publico || !paciente.celular}
                            title={paciente.celular ? 'Enviar o link por WhatsApp' : 'Paciente sem celular cadastrado'}
                            onClick={() => abrirWhatsapp(solicitacao)}
                          >
                            {iconeWhatsapp}WhatsApp
                          </button>
                          <button
                            type="button"
                            disabled={!solicitacao.token_publico || renovandoId === solicitacao.id}
                            title="Revogar o link atual e gerar um novo"
                            onClick={() => renovarLink(solicitacao)}
                          >
                            {iconeRenovar}{renovandoId === solicitacao.id ? 'Renovando...' : 'Renovar link'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

export default PacienteExames;
