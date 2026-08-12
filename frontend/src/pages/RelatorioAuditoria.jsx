import { useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import './RelatorioAtendimentos.css';

const iconeVazio = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);

function hojeLocal() {
  const agora = new Date();
  const deslocamento = agora.getTimezoneOffset() * 60000;
  return new Date(agora.getTime() - deslocamento).toISOString().slice(0, 10);
}

function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatarDataBr(isoData) {
  const [ano, mes, dia] = isoData.split('-');
  return `${dia}/${mes}/${ano}`;
}

function RelatorioAuditoria() {
  const [data, setData] = useState(hojeLocal());
  const [registros, setRegistros] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function gerarRelatorio() {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await api.get('/relatorios/auditoria', { params: { data } });
      setRegistros(resposta.data);
    } catch {
      setErro('Nao foi possivel gerar o relatorio.');
      setRegistros(null);
    } finally {
      setCarregando(false);
    }
  }

  const totalRegistros = registros?.length || 0;
  const usuariosDistintos = new Set((registros || []).map((r) => r.usuario_nome || 'Nao autenticado'));
  const totalFalhas = (registros || []).filter((r) => r.status_code >= 400).length;

  return (
    <Layout>
      <div className="gerenciar relatorio-atendimentos">
        <div className="gerenciar-cabecalho">
          <h1>Auditoria</h1>
          <p>Trilha de quem acessou ou alterou pacientes, amostras/resultados, usuarios e o portal do paciente, exigida pela LGPD.</p>
        </div>

        <div className="relatorio-filtro">
          <label>
            Data
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </label>
          <button className="relatorio-gerar" onClick={gerarRelatorio} disabled={carregando}>
            {carregando ? 'Gerando...' : 'Gerar relatorio'}
          </button>
        </div>

        {erro && <p className="gerenciar-erro">{erro}</p>}

        {registros && (
          <>
            <div className="relatorio-resumo">
              <div className="relatorio-resumo-card">
                <span className="relatorio-resumo-numero">{totalRegistros}</span>
                <span className="relatorio-resumo-label">Requisicoes registradas</span>
              </div>
              <div className="relatorio-resumo-card">
                <span className="relatorio-resumo-numero">{usuariosDistintos.size}</span>
                <span className="relatorio-resumo-label">Usuarios distintos</span>
              </div>
              <div className="relatorio-resumo-card">
                <span className="relatorio-resumo-numero">{totalFalhas}</span>
                <span className="relatorio-resumo-label">Respostas com erro (4xx/5xx)</span>
              </div>
            </div>

            {registros.length === 0 ? (
              <div className="relatorio-estado-vazio">
                <span className="relatorio-estado-vazio-icone">{iconeVazio}</span>
                <p>Nenhum acesso a dados sensiveis registrado em {formatarDataBr(data)}.</p>
              </div>
            ) : (
              <table className="gerenciar-tabela">
                <thead>
                  <tr>
                    <th>Horario</th>
                    <th>Usuario</th>
                    <th>Metodo</th>
                    <th>Rota</th>
                    <th>Status</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((registro) => (
                    <tr key={registro.id}>
                      <td>{formatarHora(registro.criado_em)}</td>
                      <td>{registro.usuario_nome || 'Nao autenticado'}</td>
                      <td>{registro.metodo}</td>
                      <td className="paciente-codigo">{registro.caminho}</td>
                      <td>
                        <span className={`tag-status-mini ${registro.status_code >= 400 ? 'tag-status-pendente' : 'tag-status-feito'}`}>
                          {registro.status_code}
                        </span>
                      </td>
                      <td>{registro.ip || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default RelatorioAuditoria;
