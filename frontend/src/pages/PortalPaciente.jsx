import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import './PortalPaciente.css';

const iconeLogo = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 2v6.34a2 2 0 0 1-.4 1.2L4 16a2 2 0 0 0 1.6 3.2h12.8A2 2 0 0 0 20 16l-4.6-6.46a2 2 0 0 1-.4-1.2V2" />
    <path d="M8.5 2h7" />
  </svg>
);
const iconeCheck = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" /></svg>
);
const iconeRelogio = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
);

function formatarDataHora(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function textoReferencia(exame) {
  if (!exame) return null;
  if (exame.valor_referencia_min != null || exame.valor_referencia_max != null) {
    const min = exame.valor_referencia_min ?? '-';
    const max = exame.valor_referencia_max ?? '-';
    return `Referencia: ${min} a ${max} ${exame.unidade_resultado || ''}`.trim();
  }
  if (exame.valor_referencia_texto) return `Referencia: ${exame.valor_referencia_texto}`;
  return null;
}

function PortalPaciente() {
  const { token } = useParams();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro('');
      try {
        const resposta = await api.get(`/portal/${token}`);
        setDados(resposta.data);
      } catch {
        setErro('Este link e invalido ou expirou. Confira o link recebido, ou entre em contato com o laboratorio.');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [token]);

  async function baixarLaudo() {
    if (!dados) return;
    const { gerarLaudoPdf } = await import('../services/pdfSolicitacao');
    gerarLaudoPdf({ paciente: dados.paciente, solicitacao: dados.solicitacao });
  }

  const itens = dados ? dados.solicitacao.amostras.flatMap((amostra) => amostra.itens || []) : [];
  const temResultadoDisponivel = itens.some((item) => item.status_resultado === 'disponivel');

  return (
    <div className="portal-fundo">
      <div className="portal-conteudo">
        <header className="portal-topo">
          <span className="portal-logo-icone">{iconeLogo}</span>
          <div>
            <strong>NexLab</strong>
            <span>Portal do paciente</span>
          </div>
        </header>

        {carregando ? (
          <div className="portal-card portal-estado"><p>Carregando seus resultados...</p></div>
        ) : erro ? (
          <div className="portal-card portal-estado portal-estado-erro"><p>{erro}</p></div>
        ) : (
          <>
            <div className="portal-card portal-paciente-card">
              <div>
                <span className="portal-paciente-nome">{dados.paciente.nome}</span>
                <span className="portal-paciente-meta">
                  Codigo {dados.paciente.codigo} · Solicitado em {formatarDataHora(dados.solicitacao.data_solicitacao)}
                </span>
              </div>
              <button className="portal-baixar" onClick={baixarLaudo} disabled={!temResultadoDisponivel}>
                Baixar laudo em PDF
              </button>
            </div>

            <div className="portal-card">
              <h2>Exames desta solicitacao</h2>
              <ul className="portal-lista">
                {itens.map((item) => {
                  const disponivel = item.status_resultado === 'disponivel';
                  const referencia = textoReferencia(item.exame);
                  return (
                    <li key={item.id} className="portal-item">
                      <div className="portal-item-topo">
                        <span className="portal-item-nome">{item.exame?.sigla || item.exame?.nome || 'Exame'}</span>
                        <span className={`portal-item-status ${disponivel ? 'portal-status-disponivel' : 'portal-status-pendente'}`}>
                          {disponivel ? iconeCheck : iconeRelogio}
                          {disponivel ? 'Disponivel' : 'Em andamento'}
                        </span>
                      </div>
                      {disponivel ? (
                        <div className="portal-item-resultado">
                          <span className={`portal-valor ${item.flag_resultado ? 'portal-valor-flag' : ''}`}>
                            {item.valor_resultado} {item.unidade_resultado || ''}
                            {item.flag_resultado && (
                              <span className={`portal-flag portal-flag-${item.flag_resultado}`}>
                                {item.flag_resultado === 'H' ? 'ALTO' : 'BAIXO'}
                              </span>
                            )}
                          </span>
                          {referencia && <span className="portal-referencia">{referencia}</span>}
                          <span className="portal-item-meta">Liberado em {formatarDataHora(item.resultado_disponivel_em)}</span>
                        </div>
                      ) : (
                        <p className="portal-item-aguardando">O resultado deste exame ainda esta sendo processado.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="portal-rodape">
              Este link e pessoal e intransferivel. Se voce nao reconhece esta solicitacao, ignore este link.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default PortalPaciente;
