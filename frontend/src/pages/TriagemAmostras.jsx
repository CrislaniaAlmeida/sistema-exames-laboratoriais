import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import './TriagemAmostras.css';

const iconeScanner = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M3 7V4a1 1 0 0 1 1-1h3M21 7V4a1 1 0 0 0-1-1h-3M3 17v3a1 1 0 0 0 1 1h3M21 17v3a1 1 0 0 1-1 1h-3" />
    <path d="M7 12h10" strokeWidth="2.4" />
  </svg>
);
const iconeCheck = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
);
const iconeTubo = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 2v6.34a2 2 0 0 1-.4 1.2L4 16a2 2 0 0 0 1.6 3.2h12.8A2 2 0 0 0 20 16l-4.6-6.46a2 2 0 0 1-.4-1.2V2" /><path d="M8.5 2h7" /></svg>
);

function formatarHora(data) {
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function TriagemAmostras() {
  const [codigo, setCodigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState('');
  const [ultimaLeitura, setUltimaLeitura] = useState(null);
  const [grupos, setGrupos] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function adicionarAoGrupo(amostra) {
    setGrupos((atual) => {
      const novo = { ...atual };
      const lista = (novo[amostra.destino] || []).filter((item) => item.id !== amostra.id);
      lista.unshift({
        id: amostra.id,
        codigo: amostra.codigo,
        paciente_nome: amostra.paciente.nome,
        tubo_cor: amostra.tubo_cor,
        hora: formatarHora(new Date()),
      });
      novo[amostra.destino] = lista;
      return novo;
    });
  }

  async function handleBipar(evento) {
    evento.preventDefault();
    const codigoLimpo = codigo.trim();
    if (!codigoLimpo) return;

    setBuscando(true);
    setErro('');
    try {
      const resposta = await api.get(`/amostras/${encodeURIComponent(codigoLimpo)}`);
      let amostra = resposta.data;

      const jaEstavaColetada = amostra.status === 'coletado';
      if (!jaEstavaColetada) {
        const respostaStatus = await api.put(`/amostras/${amostra.id}/status`, { status: 'coletado' });
        amostra = { ...amostra, status: respostaStatus.data.status, coletado_em: respostaStatus.data.coletado_em };
      }

      setUltimaLeitura({ amostra, jaEstavaColetada });
      adicionarAoGrupo(amostra);
    } catch (erroRequisicao) {
      setUltimaLeitura(null);
      setErro(
        erroRequisicao.response?.status === 404
          ? `Codigo "${codigoLimpo}" nao encontrado. Confira a etiqueta e tente novamente.`
          : 'Nao foi possivel consultar essa amostra. Tente novamente.'
      );
    } finally {
      setCodigo('');
      setBuscando(false);
      inputRef.current?.focus();
    }
  }

  function limparSessao() {
    setGrupos({});
    setUltimaLeitura(null);
    setErro('');
  }

  const destinos = Object.keys(grupos).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const totalTriado = Object.values(grupos).reduce((soma, lista) => soma + lista.length, 0);

  return (
    <Layout>
      <div className="gerenciar triagem">
        <div className="gerenciar-cabecalho">
          <h1>Triagem de amostras</h1>
          <p>Bipe o codigo de barras de cada tubo para o sistema identificar o setor ou laboratorio de apoio.</p>
        </div>

        <form className="triagem-scanner" onSubmit={handleBipar}>
          <span className="triagem-scanner-icone">{iconeScanner}</span>
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            autoFocus
            placeholder="Bipe ou digite o codigo da amostra (ex: AMO-000001)..."
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            disabled={buscando}
          />
          <button type="submit" disabled={buscando || !codigo.trim()}>
            {buscando ? 'Consultando...' : 'Confirmar'}
          </button>
        </form>

        {erro && <p className="gerenciar-erro">{erro}</p>}

        {ultimaLeitura && (
          <div className="triagem-confirmacao">
            <span className="triagem-confirmacao-icone">{iconeCheck}</span>
            <div className="triagem-confirmacao-info">
              <span className="triagem-confirmacao-paciente">{ultimaLeitura.amostra.paciente.nome}</span>
              <span className="triagem-confirmacao-meta">
                {ultimaLeitura.amostra.codigo}
                {ultimaLeitura.amostra.tubo_cor ? ` · ${ultimaLeitura.amostra.tubo_cor}` : ''}
                {' · '}Destino: <strong>{ultimaLeitura.amostra.destino}</strong>
              </span>
              {ultimaLeitura.jaEstavaColetada && (
                <span className="triagem-confirmacao-aviso">Essa amostra ja tinha sido bipada antes.</span>
              )}
            </div>
          </div>
        )}

        <div className="triagem-resumo">
          <span>{totalTriado} amostra(s) triada(s) nesta sessao</span>
          {totalTriado > 0 && (
            <button type="button" onClick={limparSessao}>Limpar lista da sessao</button>
          )}
        </div>

        {destinos.length === 0 ? (
          <div className="triagem-estado-vazio">
            <span className="triagem-estado-vazio-icone">{iconeTubo}</span>
            <p>Nenhuma amostra bipada ainda nesta sessao.</p>
          </div>
        ) : (
          <div className="triagem-grupos">
            {destinos.map((destino) => (
              <div className="triagem-grupo" key={destino}>
                <div className="triagem-grupo-cabecalho">
                  <span>{destino}</span>
                  <span className="triagem-grupo-contagem">{grupos[destino].length}</span>
                </div>
                <ul>
                  {grupos[destino].map((item) => (
                    <li key={item.id}>
                      <span className="triagem-item-paciente">{item.paciente_nome}</span>
                      <span className="triagem-item-meta">
                        {item.codigo}{item.tubo_cor ? ` · ${item.tubo_cor}` : ''} · {item.hora}
                      </span>
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

export default TriagemAmostras;
