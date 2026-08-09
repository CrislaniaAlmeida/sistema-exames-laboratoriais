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

  const sugestoesExame = termoExame.trim().length < 2 ? [] : examesDisponiveis
    .filter((exame) => !examesSelecionados.some((selecionado) => selecionado.id === exame.id))
    .filter((exame) => {
      const termo = termoExame.trim().toLowerCase();
      return (
        exame.nome.toLowerCase().includes(termo) ||
        (exame.sigla && exame.sigla.toLowerCase().includes(termo))
      );
    })
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

      const { gerarPdfSolicitacao } = await import('../services/pdfSolicitacao');
      gerarPdfSolicitacao({
        paciente,
        exames: respostaSolicitacao.data.exames,
        dataSolicitacao: new Date(respostaSolicitacao.data.data_solicitacao),
      });

      setMensagem('Solicitacao concluida. O comprovante em PDF foi baixado.');
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

        <div className="gerenciar-cabecalho">
          <h1>Exames de {paciente.nome}</h1>
          <p>Codigo {paciente.codigo} · CPF {paciente.cpf} · Nascimento {formatarDataBr(paciente.data_nascimento)}</p>
        </div>

        {erro && <p className="gerenciar-erro">{erro}</p>}
        {mensagem && <p className="gerenciar-mensagem">{mensagem}</p>}

        <div className="gerenciar-form">
          <h2>Novos exames solicitados</h2>

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
              {concluindo ? 'Gerando...' : 'Concluir e gerar PDF'}
            </button>
            <button type="button" className="form-cancelar" onClick={() => navigate('/pacientes')}>
              Voltar para pacientes
            </button>
          </div>
        </div>

        <div className="gerenciar-cabecalho">
          <h2 className="paciente-secao-titulo">Solicitacoes anteriores</h2>
        </div>

        {historico.length === 0 ? (
          <p className="paciente-exames-vazio">Nenhuma solicitacao registrada ainda para este paciente.</p>
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
