import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import './PainelAmostras.css';

const iconeTubo = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 2v6.34a2 2 0 0 1-.4 1.2L4 16a2 2 0 0 0 1.6 3.2h12.8A2 2 0 0 0 20 16l-4.6-6.46a2 2 0 0 1-.4-1.2V2" /><path d="M8.5 2h7" /></svg>
);

function formatarDataHoraBr(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function textoReferencia(exame) {
  if (!exame) return null;
  if (exame.valor_referencia_min != null || exame.valor_referencia_max != null) {
    const min = exame.valor_referencia_min ?? '-';
    const max = exame.valor_referencia_max ?? '-';
    return `Referencia: ${min} a ${max} ${exame.unidade_resultado || ''}`.trim();
  }
  if (exame.valor_referencia_texto) {
    return `Referencia: ${exame.valor_referencia_texto}`;
  }
  return null;
}

function statusItem(item, amostra) {
  if (amostra.status !== 'coletado') {
    return { texto: 'Aguardando coleta', classe: 'painel-status-pendente' };
  }
  if (item.status_resultado === 'aguardando_resultado') {
    return { texto: 'Aguardando resultado', classe: 'painel-status-pendente' };
  }
  if (item.status_resultado === 'aguardando_confirmacao') {
    return { texto: `Aguardando confirmacao · lancado por ${item.lancado_por_nome || '-'}`, classe: 'painel-status-pendente' };
  }
  return { texto: 'Disponivel', classe: 'painel-status-feito' };
}

function PainelAmostras() {
  const [amostras, setAmostras] = useState([]);
  const [apenasPendentes, setApenasPendentes] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await api.get('/amostras/painel', { params: { apenas_pendentes: apenasPendentes } });
      setAmostras(resposta.data);
    } catch {
      setErro('Nao foi possivel carregar o painel de amostras.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apenasPendentes]);

  const pacientes = useMemo(() => {
    const grupos = new Map();
    amostras.forEach((amostra) => {
      const chave = amostra.paciente.codigo;
      if (!grupos.has(chave)) {
        grupos.set(chave, { paciente: amostra.paciente, amostras: [] });
      }
      grupos.get(chave).amostras.push(amostra);
    });
    return Array.from(grupos.values());
  }, [amostras]);

  return (
    <Layout>
      <div className="gerenciar painel-amostras">
        <div className="gerenciar-cabecalho">
          <h1>Painel de amostras</h1>
          <p>Acompanhe o status de coleta e resultado de cada exame, por paciente.</p>
        </div>

        <div className="painel-banner">
          <span className="painel-banner-legenda">Visao geral de coleta e resultado, por paciente</span>
        </div>

        {erro && <p className="gerenciar-erro">{erro}</p>}

        <div className="painel-filtros">
          <button
            className={apenasPendentes ? 'painel-filtro-ativo' : ''}
            onClick={() => setApenasPendentes(true)}
          >
            Pendentes
          </button>
          <button
            className={!apenasPendentes ? 'painel-filtro-ativo' : ''}
            onClick={() => setApenasPendentes(false)}
          >
            Todas
          </button>
        </div>

        {carregando ? (
          <p>Carregando...</p>
        ) : pacientes.length === 0 ? (
          <div className="painel-estado-vazio">
            <span className="painel-estado-vazio-icone">{iconeTubo}</span>
            <p>{apenasPendentes ? 'Nenhuma amostra pendente. Tudo em dia!' : 'Nenhuma amostra registrada ainda.'}</p>
          </div>
        ) : (
          <div className="painel-lista">
            {pacientes.map(({ paciente, amostras: amostrasPaciente }) => (
              <div className="painel-card" key={paciente.codigo}>
                <div className="painel-card-cabecalho">
                  <div className="painel-card-identificacao">
                    <span className="painel-card-paciente">{paciente.nome}</span>
                    <span className="painel-card-meta">{paciente.codigo}</span>
                  </div>
                </div>

                <ul className="painel-itens">
                  {amostrasPaciente.flatMap((amostra) =>
                    amostra.itens.map((item) => {
                      const referencia = textoReferencia(item.exame);
                      const status = statusItem(item, amostra);
                      return (
                        <li key={item.id} className="painel-item-linha">
                          <div className="painel-item-cabecalho">
                            <span className="painel-item-nome">
                              {item.exame?.sigla || item.exame?.nome || 'Exame removido'}
                            </span>
                            <span className="painel-item-referencia">
                              {amostra.codigo}{amostra.tubo_cor ? ` · ${amostra.tubo_cor}` : ''}
                            </span>
                            {referencia && <span className="painel-item-referencia">{referencia}</span>}
                          </div>

                          <div className="painel-item-resultado">
                            <span className={`painel-status-botao ${status.classe}`}>{status.texto}</span>
                            {item.status_resultado === 'disponivel' && (
                              <span className="painel-valor-resultado">
                                {item.valor_resultado} {item.unidade_resultado || ''}
                                {item.flag_resultado && (
                                  <span className={`painel-flag painel-flag-${item.flag_resultado}`}>
                                    {item.flag_resultado === 'H' ? 'ALTO' : 'BAIXO'}
                                  </span>
                                )}
                              </span>
                            )}
                            {item.status_resultado === 'disponivel' && (
                              <span className="painel-item-liberado-meta">
                                Liberado por {item.liberado_por_nome || '-'} em {formatarDataHoraBr(item.resultado_disponivel_em)}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default PainelAmostras;
