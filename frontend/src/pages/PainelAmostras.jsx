import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import './PainelAmostras.css';

const iconeTubo = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 2v6.34a2 2 0 0 1-.4 1.2L4 16a2 2 0 0 0 1.6 3.2h12.8A2 2 0 0 0 20 16l-4.6-6.46a2 2 0 0 1-.4-1.2V2" /><path d="M8.5 2h7" /></svg>
);
const iconeCheck = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
);
const iconeRelogio = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
);

function formatarDataHoraBr(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function PainelAmostras() {
  const [amostras, setAmostras] = useState([]);
  const [apenasPendentes, setApenasPendentes] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizandoId, setAtualizandoId] = useState(null);

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

  async function alternarStatusAmostra(amostra) {
    const novoStatus = amostra.status === 'coletado' ? 'aguardando_coleta' : 'coletado';
    setAtualizandoId(`amostra-${amostra.id}`);
    setErro('');
    try {
      await api.put(`/amostras/${amostra.id}/status`, { status: novoStatus });
      await carregar();
    } catch {
      setErro('Nao foi possivel atualizar o status da amostra.');
    } finally {
      setAtualizandoId(null);
    }
  }

  async function alternarStatusItem(item) {
    const novoStatus = item.status_resultado === 'disponivel' ? 'aguardando_resultado' : 'disponivel';
    setAtualizandoId(`item-${item.id}`);
    setErro('');
    try {
      await api.put(`/amostras/itens/${item.id}/status`, { status_resultado: novoStatus });
      await carregar();
    } catch {
      setErro('Nao foi possivel atualizar o status do resultado.');
    } finally {
      setAtualizandoId(null);
    }
  }

  return (
    <Layout>
      <div className="gerenciar painel-amostras">
        <div className="gerenciar-cabecalho">
          <h1>Painel de amostras</h1>
          <p>Marque a coleta e a liberacao de resultado de cada exame, sem abrir o cadastro de cada paciente.</p>
        </div>

        <div className="painel-banner">
          <span className="painel-banner-legenda">Coleta e liberacao de resultado, em um so lugar</span>
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
        ) : amostras.length === 0 ? (
          <div className="painel-estado-vazio">
            <span className="painel-estado-vazio-icone">{iconeTubo}</span>
            <p>{apenasPendentes ? 'Nenhuma amostra pendente. Tudo em dia!' : 'Nenhuma amostra registrada ainda.'}</p>
          </div>
        ) : (
          <div className="painel-lista">
            {amostras.map((amostra) => (
              <div className="painel-card" key={amostra.id}>
                <div className="painel-card-cabecalho">
                  <div className="painel-card-identificacao">
                    <span className="painel-card-paciente">{amostra.paciente.nome}</span>
                    <span className="painel-card-meta">
                      {amostra.paciente.codigo} · {amostra.codigo}
                      {amostra.tubo_cor ? ` · ${amostra.tubo_cor}` : ''}
                      {amostra.material ? ` · ${amostra.material}` : ''}
                    </span>
                  </div>
                  <button
                    className={`painel-status-botao ${amostra.status === 'coletado' ? 'painel-status-feito' : 'painel-status-pendente'}`}
                    onClick={() => alternarStatusAmostra(amostra)}
                    disabled={atualizandoId === `amostra-${amostra.id}`}
                  >
                    {amostra.status === 'coletado' ? iconeCheck : iconeRelogio}
                    {amostra.status === 'coletado'
                      ? `Coletado ${formatarDataHoraBr(amostra.coletado_em)}`
                      : 'Marcar como coletado'}
                  </button>
                </div>

                <ul className="painel-itens">
                  {amostra.itens.map((item) => (
                    <li key={item.id}>
                      <span className="painel-item-nome">
                        {item.exame?.sigla || item.exame?.nome || 'Exame removido'}
                      </span>
                      <button
                        className={`painel-status-botao painel-status-botao-mini ${item.status_resultado === 'disponivel' ? 'painel-status-feito' : 'painel-status-pendente'}`}
                        onClick={() => alternarStatusItem(item)}
                        disabled={atualizandoId === `item-${item.id}`}
                      >
                        {item.status_resultado === 'disponivel' ? iconeCheck : iconeRelogio}
                        {item.status_resultado === 'disponivel'
                          ? `Resultado disponivel ${formatarDataHoraBr(item.resultado_disponivel_em)}`
                          : 'Aguardando resultado'}
                      </button>
                    </li>
                  ))}
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
