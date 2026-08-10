import { useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import './RelatorioAtendimentos.css';

const iconePdf = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>
);
const iconeVazio = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);

function hojeLocal() {
  const agora = new Date();
  const deslocamento = agora.getTimezoneOffset() * 60000;
  return new Date(agora.getTime() - deslocamento).toISOString().slice(0, 10);
}

function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarDataBr(isoData) {
  const [ano, mes, dia] = isoData.split('-');
  return `${dia}/${mes}/${ano}`;
}

function RelatorioAtendimentos() {
  const [data, setData] = useState(hojeLocal());
  const [atendimentos, setAtendimentos] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function gerarRelatorio() {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await api.get('/relatorios/atendimentos', { params: { data } });
      setAtendimentos(resposta.data);
    } catch {
      setErro('Nao foi possivel gerar o relatorio.');
      setAtendimentos(null);
    } finally {
      setCarregando(false);
    }
  }

  async function baixarPdf() {
    const { gerarRelatorioAtendimentosPdf } = await import('../services/pdfSolicitacao');
    gerarRelatorioAtendimentosPdf({ data, atendimentos });
  }

  const totalAtendimentos = atendimentos?.length || 0;
  const codigosPacientes = new Set((atendimentos || []).map((a) => a.paciente.codigo));
  const totalExames = (atendimentos || []).reduce((soma, a) => soma + a.exames.length, 0);

  const porConvenio = {};
  (atendimentos || []).forEach((a) => {
    const chave = a.paciente.convenio || 'Particular';
    porConvenio[chave] = (porConvenio[chave] || 0) + 1;
  });

  return (
    <Layout>
      <div className="gerenciar relatorio-atendimentos">
        <div className="gerenciar-cabecalho">
          <h1>Relatorio de atendimentos</h1>
          <p>Veja quantos atendimentos, pacientes e exames foram registrados num dia.</p>
        </div>

        <div className="relatorio-filtro">
          <label>
            Data
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </label>
          <button className="relatorio-gerar" onClick={gerarRelatorio} disabled={carregando}>
            {carregando ? 'Gerando...' : 'Gerar relatorio'}
          </button>
          {atendimentos && atendimentos.length > 0 && (
            <button className="relatorio-baixar" onClick={baixarPdf}>
              {iconePdf}Baixar PDF
            </button>
          )}
        </div>

        {erro && <p className="gerenciar-erro">{erro}</p>}

        {atendimentos && (
          <>
            <div className="relatorio-resumo">
              <div className="relatorio-resumo-card">
                <span className="relatorio-resumo-numero">{totalAtendimentos}</span>
                <span className="relatorio-resumo-label">Atendimentos</span>
              </div>
              <div className="relatorio-resumo-card">
                <span className="relatorio-resumo-numero">{codigosPacientes.size}</span>
                <span className="relatorio-resumo-label">Pacientes distintos</span>
              </div>
              <div className="relatorio-resumo-card">
                <span className="relatorio-resumo-numero">{totalExames}</span>
                <span className="relatorio-resumo-label">Exames solicitados</span>
              </div>
              <div className="relatorio-resumo-card relatorio-resumo-convenios">
                <span className="relatorio-resumo-label">Por convenio</span>
                <div className="relatorio-convenios-lista">
                  {Object.entries(porConvenio).map(([nome, quantidade]) => (
                    <span key={nome} className="relatorio-convenio-item">{nome}: {quantidade}</span>
                  ))}
                </div>
              </div>
            </div>

            {atendimentos.length === 0 ? (
              <div className="relatorio-estado-vazio">
                <span className="relatorio-estado-vazio-icone">{iconeVazio}</span>
                <p>Nenhum atendimento registrado em {formatarDataBr(data)}.</p>
              </div>
            ) : (
              <table className="gerenciar-tabela">
                <thead>
                  <tr>
                    <th>Horario</th>
                    <th>Paciente</th>
                    <th>Codigo</th>
                    <th>Convenio</th>
                    <th>Exames</th>
                  </tr>
                </thead>
                <tbody>
                  {atendimentos.map((atendimento) => (
                    <tr key={atendimento.id}>
                      <td>{formatarHora(atendimento.data_solicitacao)}</td>
                      <td>{atendimento.paciente.nome}</td>
                      <td className="paciente-codigo">{atendimento.paciente.codigo}</td>
                      <td>{atendimento.paciente.convenio || 'Particular'}</td>
                      <td>{atendimento.exames.map((e) => e.sigla || e.nome).join(', ')}</td>
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

export default RelatorioAtendimentos;
