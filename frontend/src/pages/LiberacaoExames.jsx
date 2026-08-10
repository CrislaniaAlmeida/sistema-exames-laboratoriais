import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import './LiberacaoExames.css';

const ITENS_POR_PAGINA = 15;

const ROTULO_STATUS = {
  atrasado: 'Atrasado',
  proximo_do_limite: 'Proximo do limite',
  no_prazo: 'No prazo',
  sem_prazo: 'Sem prazo definido',
};

const iconeAlerta = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></svg>
);
const iconeRelogio = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
);
const iconeCheck = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
);
const iconeLista = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1.4" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.4" fill="currentColor" stroke="none" /></svg>
);
const iconeVazio = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20 6 9 17l-5-5" /></svg>
);

function formatarDataHora(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null;
  const nascimento = new Date(`${dataNascimento}T00:00:00`);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversario) idade -= 1;
  return idade;
}

function formatarDelta(prazoLimite, status) {
  if (!prazoLimite || status === 'sem_prazo') return null;
  const diffMin = Math.round((new Date(prazoLimite) - new Date()) / 60000);
  const abs = Math.abs(diffMin);
  const horas = Math.floor(abs / 60);
  const minutos = abs % 60;
  const texto = horas > 0 ? `${horas}h${minutos > 0 ? ` ${minutos}min` : ''}` : `${minutos}min`;
  return status === 'atrasado' ? `Atrasado ha ${texto}` : `Faltam ${texto}`;
}

function LiberacaoExames() {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [setorAtivo, setSetorAtivo] = useState('todos');
  const [pagina, setPagina] = useState(1);

  const [itemModal, setItemModal] = useState(null);
  const [valorModal, setValorModal] = useState('');
  const [observacaoModal, setObservacaoModal] = useState('');
  const [salvandoModal, setSalvandoModal] = useState(false);
  const [erroModal, setErroModal] = useState('');

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await api.get('/amostras/liberacao');
      setItens(resposta.data);
    } catch {
      setErro('Nao foi possivel carregar a liberacao de exames.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const setores = useMemo(() => {
    const nomes = new Set(itens.map((item) => item.exame?.setor_responsavel || 'Setor a definir'));
    return Array.from(nomes).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [itens]);

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itens.filter((item) => {
      const setorItem = item.exame?.setor_responsavel || 'Setor a definir';
      if (setorAtivo !== 'todos' && setorItem !== setorAtivo) return false;
      if (!termo) return true;
      const campos = [
        item.paciente?.nome, item.paciente?.codigo,
        item.exame?.nome, item.exame?.sigla,
        item.amostra?.codigo,
      ];
      return campos.some((campo) => campo && campo.toLowerCase().includes(termo));
    });
  }, [itens, setorAtivo, busca]);

  const contagem = useMemo(() => {
    const base = { atrasado: 0, proximo_do_limite: 0, no_prazo: 0, sem_prazo: 0 };
    itensFiltrados.forEach((item) => { base[item.prazo_status] += 1; });
    return base;
  }, [itensFiltrados]);

  const totalPaginas = Math.max(1, Math.ceil(itensFiltrados.length / ITENS_POR_PAGINA));
  const itensPaginados = useMemo(() => {
    const inicio = (pagina - 1) * ITENS_POR_PAGINA;
    return itensFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [itensFiltrados, pagina]);

  function selecionarSetor(setor) {
    setSetorAtivo(setor);
    setPagina(1);
  }

  function handleBusca(valor) {
    setBusca(valor);
    setPagina(1);
  }

  function abrirModal(item) {
    setItemModal(item);
    setValorModal('');
    setObservacaoModal('');
    setErroModal('');
  }

  function fecharModal() {
    setItemModal(null);
  }

  async function confirmarLancamento(evento) {
    evento.preventDefault();
    if (!valorModal.trim()) return;

    setSalvandoModal(true);
    setErroModal('');
    try {
      await api.put(`/amostras/itens/${itemModal.id}/resultado`, {
        valor_resultado: valorModal.trim(),
        observacoes_resultado: observacaoModal.trim() || null,
      });
      fecharModal();
      await carregar();
    } catch (erroRequisicao) {
      setErroModal(erroRequisicao.response?.data?.detail || 'Nao foi possivel lancar o resultado.');
    } finally {
      setSalvandoModal(false);
    }
  }

  return (
    <Layout>
      <div className="gerenciar liberacao">
        <div className="gerenciar-cabecalho">
          <h1>Liberacao de exames</h1>
          <p>Exames realizados internamente, aguardando liberacao de resultado, organizados por setor.</p>
        </div>

        {erro && <p className="gerenciar-erro">{erro}</p>}

        <div className="liberacao-cards">
          <div className="liberacao-card liberacao-card-atrasado">
            <div>
              <span className="liberacao-card-titulo">Atrasados</span>
              <span className="liberacao-card-numero">{contagem.atrasado}</span>
              <span className="liberacao-card-legenda">Exames fora do prazo</span>
            </div>
            <span className="liberacao-card-icone">{iconeAlerta}</span>
          </div>
          <div className="liberacao-card liberacao-card-proximo">
            <div>
              <span className="liberacao-card-titulo">Proximos do limite</span>
              <span className="liberacao-card-numero">{contagem.proximo_do_limite}</span>
              <span className="liberacao-card-legenda">Vencem em ate 30 min</span>
            </div>
            <span className="liberacao-card-icone">{iconeRelogio}</span>
          </div>
          <div className="liberacao-card liberacao-card-no-prazo">
            <div>
              <span className="liberacao-card-titulo">No prazo</span>
              <span className="liberacao-card-numero">{contagem.no_prazo}</span>
              <span className="liberacao-card-legenda">Dentro do tempo</span>
            </div>
            <span className="liberacao-card-icone">{iconeCheck}</span>
          </div>
          <div className="liberacao-card liberacao-card-total">
            <div>
              <span className="liberacao-card-titulo">Total pendentes</span>
              <span className="liberacao-card-numero">{itensFiltrados.length}</span>
              <span className="liberacao-card-legenda">Aguardando liberacao</span>
            </div>
            <span className="liberacao-card-icone">{iconeLista}</span>
          </div>
        </div>

        <div className="liberacao-abas">
          <button
            className={setorAtivo === 'todos' ? 'liberacao-aba-ativa' : ''}
            onClick={() => selecionarSetor('todos')}
          >
            Todos os setores <span className="liberacao-aba-contagem">{itens.length}</span>
          </button>
          {setores.map((setor) => (
            <button
              key={setor}
              className={setorAtivo === setor ? 'liberacao-aba-ativa' : ''}
              onClick={() => selecionarSetor(setor)}
            >
              {setor} <span className="liberacao-aba-contagem">{itens.filter((i) => (i.exame?.setor_responsavel || 'Setor a definir') === setor).length}</span>
            </button>
          ))}
        </div>

        <div className="liberacao-filtro">
          <input
            type="text"
            placeholder="Buscar por paciente, exame ou amostra..."
            value={busca}
            onChange={(e) => handleBusca(e.target.value)}
          />
          <button type="button" className="liberacao-atualizar" onClick={carregar}>Atualizar</button>
        </div>

        {carregando ? (
          <p>Carregando...</p>
        ) : itensFiltrados.length === 0 ? (
          <div className="liberacao-estado-vazio">
            <span className="liberacao-estado-vazio-icone">{iconeVazio}</span>
            <p>Nenhum exame aguardando liberacao {setorAtivo !== 'todos' ? `no setor ${setorAtivo}` : ''}.</p>
          </div>
        ) : (
          <>
            <div className="liberacao-tabela-wrap">
              <table className="gerenciar-tabela liberacao-tabela">
                <thead>
                  <tr>
                    <th>Status do prazo</th>
                    <th>Amostra</th>
                    <th>Paciente</th>
                    <th>Exame</th>
                    <th>Equipamento</th>
                    <th>Coleta</th>
                    <th>Recebimento</th>
                    <th>Prazo</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {itensPaginados.map((item) => {
                    const idade = calcularIdade(item.paciente?.data_nascimento);
                    const delta = formatarDelta(item.prazo_limite, item.prazo_status);
                    return (
                      <tr key={item.id}>
                        <td>
                          <span className={`liberacao-status liberacao-status-${item.prazo_status}`}>
                            {ROTULO_STATUS[item.prazo_status]}
                          </span>
                          {delta && <span className="liberacao-status-delta">{delta}</span>}
                        </td>
                        <td>
                          <span className="paciente-codigo">{item.amostra?.codigo || '-'}</span>
                          {item.amostra?.tubo_cor && <span className="liberacao-tubo"> · {item.amostra.tubo_cor}</span>}
                        </td>
                        <td>
                          {item.paciente?.nome || 'Paciente removido'}
                          {idade != null && <span className="liberacao-paciente-meta"> · {idade} anos{item.paciente?.sexo ? ` · ${item.paciente.sexo}` : ''}</span>}
                        </td>
                        <td>
                          {item.exame?.sigla || item.exame?.nome || 'Exame removido'}
                          {setorAtivo === 'todos' && (
                            <span className="liberacao-paciente-meta"> · {item.exame?.setor_responsavel || 'Setor a definir'}</span>
                          )}
                        </td>
                        <td>{item.exame?.equipamento || '-'}</td>
                        <td>{formatarDataHora(item.amostra?.coletado_em)}</td>
                        <td>{formatarDataHora(item.amostra?.recebido_em)}</td>
                        <td>{item.prazo_limite ? formatarDataHora(item.prazo_limite) : '-'}</td>
                        <td className="gerenciar-acoes">
                          <button onClick={() => abrirModal(item)}>Lancar resultado</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="paginacao">
                <button className="paginacao-botao" onClick={() => setPagina((p) => p - 1)} disabled={pagina === 1}>
                  ← Anterior
                </button>
                <span className="paginacao-info">
                  Pagina {pagina} de {totalPaginas} ({itensFiltrados.length} exames)
                </span>
                <button className="paginacao-botao" onClick={() => setPagina((p) => p + 1)} disabled={pagina === totalPaginas}>
                  Proxima →
                </button>
              </div>
            )}

            <div className="liberacao-legenda">
              <span><span className="liberacao-legenda-bola liberacao-legenda-atrasado" /> Atrasado: exame fora do prazo</span>
              <span><span className="liberacao-legenda-bola liberacao-legenda-proximo" /> Proximo do limite: falta até 30 minutos</span>
              <span><span className="liberacao-legenda-bola liberacao-legenda-no-prazo" /> No prazo: dentro do tempo estabelecido</span>
            </div>
          </>
        )}

        {itemModal && (
          <div className="liberacao-modal-fundo" onClick={fecharModal}>
            <form className="liberacao-modal" onClick={(e) => e.stopPropagation()} onSubmit={confirmarLancamento}>
              <h2>Lancar resultado</h2>
              <p className="liberacao-modal-paciente">
                {itemModal.paciente?.nome} · {itemModal.exame?.sigla || itemModal.exame?.nome}
              </p>

              {erroModal && <p className="gerenciar-erro">{erroModal}</p>}

              <label>
                Valor do resultado *
                <input
                  type="text"
                  autoFocus
                  value={valorModal}
                  onChange={(e) => setValorModal(e.target.value)}
                  placeholder={itemModal.exame?.unidade_resultado ? `Ex: 90 ${itemModal.exame.unidade_resultado}` : ''}
                />
              </label>
              <label>
                Observacao (opcional)
                <input
                  type="text"
                  value={observacaoModal}
                  onChange={(e) => setObservacaoModal(e.target.value)}
                />
              </label>

              <div className="form-acoes">
                <button type="submit" disabled={salvandoModal || !valorModal.trim()}>
                  {salvandoModal ? 'Salvando...' : 'Confirmar'}
                </button>
                <button type="button" className="form-cancelar" onClick={fecharModal}>Cancelar</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default LiberacaoExames;
