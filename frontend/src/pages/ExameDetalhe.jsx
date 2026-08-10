import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';
import './ExameDetalhe.css';

const coresConhecidas = {
  amarel: '#f5c518',
  rox: '#7c3aed',
  azul: '#2563eb',
  cinza: '#94a3b8',
  vermelh: '#dc2626',
  verde: '#16a34a',
  rosa: '#ec4899',
  laranja: '#f97316',
};

function corParaHex(nomeCor) {
  if (!nomeCor) return '#cbd5e1';
  const chave = Object.keys(coresConhecidas).find((c) =>
    nomeCor.toLowerCase().includes(c)
  );
  return chave ? coresConhecidas[chave] : '#cbd5e1';
}

function campoOuVazio(valor) {
  return valor === null || valor === undefined ? '' : valor;
}

function ExameDetalhe() {
  const { id } = useParams();
  const { usuario } = useAuth();

  const [exame, setExame] = useState(null);
  const [material, setMaterial] = useState(null);
  const [tubo, setTubo] = useState(null);
  const [laboratorio, setLaboratorio] = useState(null);

  const [listaMateriais, setListaMateriais] = useState([]);
  const [listaTubos, setListaTubos] = useState([]);
  const [listaLaboratorios, setListaLaboratorios] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});
  const [salvando, setSalvando] = useState(false);

  async function carregarDados() {
    setCarregando(true);
    setErro('');
    try {
      const [respExame, respMateriais, respTubos, respLaboratorios] = await Promise.all([
        api.get(`/exames/${id}`),
        api.get('/materiais/'),
        api.get('/tubos/'),
        api.get('/laboratorios/'),
      ]);

      const dadosExame = respExame.data;
      setExame(dadosExame);
      setListaMateriais(respMateriais.data);
      setListaTubos(respTubos.data);
      setListaLaboratorios(respLaboratorios.data);

      setMaterial(respMateriais.data.find((m) => m.id === dadosExame.material_id) || null);
      setTubo(respTubos.data.find((t) => t.id === dadosExame.tubo_id) || null);
      setLaboratorio(respLaboratorios.data.find((l) => l.id === dadosExame.laboratorio_id) || null);
    } catch {
      setErro('Nao foi possivel carregar os dados desse exame.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function abrirEdicao(secao) {
    setForm({
      nome: campoOuVazio(exame.nome),
      sigla: campoOuVazio(exame.sigla),
      codigo: campoOuVazio(exame.codigo),
      setor_responsavel: campoOuVazio(exame.setor_responsavel),
      material_id: exame.material_id ?? '',
      tubo_id: exame.tubo_id ?? '',
      forma_coleta: campoOuVazio(exame.forma_coleta),
      volume_minimo: campoOuVazio(exame.volume_minimo),
      volume_ideal: campoOuVazio(exame.volume_ideal),
      jejum_necessario: campoOuVazio(exame.jejum_necessario),
      preparo_paciente: campoOuVazio(exame.preparo_paciente),
      laboratorio_id: exame.laboratorio_id ?? '',
      metodo_utilizado: campoOuVazio(exame.metodo_utilizado),
      equipamento: campoOuVazio(exame.equipamento),
      temperatura_armazenamento: campoOuVazio(exame.temperatura_armazenamento),
      tempo_maximo_envio: campoOuVazio(exame.tempo_maximo_envio),
      dias_realizacao: campoOuVazio(exame.dias_realizacao),
      prazo_liberacao_resultado: campoOuVazio(exame.prazo_liberacao_resultado),
      prazo_liberacao_horas: exame.prazo_liberacao_horas ?? '',
      observacoes: campoOuVazio(exame.observacoes),
      unidade_resultado: campoOuVazio(exame.unidade_resultado),
      valor_referencia_min: exame.valor_referencia_min ?? '',
      valor_referencia_max: exame.valor_referencia_max ?? '',
      valor_referencia_texto: campoOuVazio(exame.valor_referencia_texto),
    });
    setEditando(secao);
    setErro('');
  }

  function cancelarEdicao() {
    setEditando(null);
  }

  function handleChange(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function salvar() {
    setSalvando(true);
    setErro('');
    try {
      const payload = { ...form };
      ['material_id', 'tubo_id', 'laboratorio_id', 'valor_referencia_min', 'valor_referencia_max', 'prazo_liberacao_horas'].forEach((campo) => {
        payload[campo] = payload[campo] === '' ? null : Number(payload[campo]);
      });
      Object.keys(payload).forEach((campo) => {
        if (payload[campo] === '') payload[campo] = null;
      });

      await api.put(`/exames/${id}`, payload);
      setEditando(null);
      await carregarDados();
    } catch {
      setErro('Nao foi possivel salvar as alteracoes.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <Layout>
        <p className="exame-detalhe-carregando">Carregando dados do exame...</p>
      </Layout>
    );
  }

  if (erro && !exame) {
    return (
      <Layout>
        <div className="exame-detalhe-erro">
          <p>{erro}</p>
          <Link to="/exames" className="exame-detalhe-voltar">← Voltar para o dashboard</Link>
        </div>
      </Layout>
    );
  }

  if (!exame) {
    return (
      <Layout>
        <div className="exame-detalhe-erro">
          <p>Exame nao encontrado.</p>
          <Link to="/exames" className="exame-detalhe-voltar">← Voltar para o dashboard</Link>
        </div>
      </Layout>
    );
  }

  const podeEditar = usuario?.perfil === 'admin' || usuario?.permissoes?.includes('exames_gerenciar');
  const processamento = laboratorio
    ? { tipo: 'Laboratorio de apoio', nome: laboratorio.nome }
    : { tipo: 'Processamento interno', nome: 'Realizado na propria unidade' };

  return (
    <Layout>
      <div className="exame-detalhe">
        <Link to="/exames" className="exame-detalhe-voltar">← Voltar para o dashboard</Link>

        {erro && <p className="exame-detalhe-erro-inline">{erro}</p>}

        <div className="exame-detalhe-cabecalho">
          {editando === 'identidade' ? (
            <div className="secao-edicao secao-edicao-cabecalho">
              <div className="edicao-grid-dupla">
                <label>
                  Nome
                  <input value={form.nome} onChange={(e) => handleChange('nome', e.target.value)} />
                </label>
                <label>
                  Sigla
                  <input value={form.sigla} onChange={(e) => handleChange('sigla', e.target.value)} placeholder="Ex: HC, GLI, UR..." />
                </label>
              </div>
              <div className="edicao-grid-dupla">
                <label>
                  Codigo
                  <input value={form.codigo} onChange={(e) => handleChange('codigo', e.target.value)} />
                </label>
                <label>
                  Setor responsavel
                  <input value={form.setor_responsavel} onChange={(e) => handleChange('setor_responsavel', e.target.value)} />
                </label>
              </div>
              <div className="edicao-acoes">
                <button className="edicao-salvar" onClick={salvar} disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
                <button className="edicao-cancelar" onClick={cancelarEdicao} disabled={salvando}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="exame-detalhe-titulo-linha">
                <h1>{exame.nome}</h1>
                {exame.sigla && <span className="tag tag-sigla">{exame.sigla}</span>}
                <span className={`tag ${exame.ativo ? 'tag-ativo' : 'tag-inativo'}`}>
                  {exame.ativo ? 'Ativo' : 'Inativo'}
                </span>
                {podeEditar && (
                  <button className="card-editar-botao" onClick={() => abrirEdicao('identidade')}>Editar</button>
                )}
              </div>
              <p className="exame-detalhe-subtitulo">
                Codigo: {exame.codigo || '-'} • Setor responsavel: {exame.setor_responsavel || 'Nao informado'}
              </p>
            </div>
          )}
          <div className="exame-detalhe-cabecalho-direita">
            <div className={`processamento-badge ${laboratorio ? 'processamento-badge-externo' : 'processamento-badge-interno'}`}>
              {processamento.tipo}
            </div>
          </div>
        </div>

        <div className="exame-detalhe-grid">
          {/* ---------- Tubo de coleta ---------- */}
          <div className="exame-detalhe-card exame-detalhe-card-tubo">
            <div className="exame-detalhe-card-topo">
              <h2>Tubo de coleta</h2>
              {podeEditar && editando !== 'tubo' && (
                <button className="card-editar-botao" onClick={() => abrirEdicao('tubo')}>Editar</button>
              )}
            </div>

            {editando === 'tubo' ? (
              <div className="secao-edicao">
                <label>
                  Tubo/recipiente
                  <select value={form.tubo_id} onChange={(e) => handleChange('tubo_id', e.target.value)}>
                    <option value="">Nao informado</option>
                    {listaTubos.map((t) => (
                      <option key={t.id} value={t.id}>{t.cor}</option>
                    ))}
                  </select>
                </label>
                <div className="edicao-acoes">
                  <button className="edicao-salvar" onClick={salvar} disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button className="edicao-cancelar" onClick={cancelarEdicao} disabled={salvando}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="exame-detalhe-card-tubo-conteudo">
                {tubo?.foto_url ? (
                  <img src={tubo.foto_url} alt={`Tubo ${tubo.cor}`} className="tubo-foto" />
                ) : (
                  <div className="tubo-amostra" style={{ backgroundColor: corParaHex(tubo?.cor) }}>
                    <div className="tubo-amostra-tampa" style={{ backgroundColor: corParaHex(tubo?.cor) }} />
                  </div>
                )}
                <span className="tubo-cor-nome">{tubo?.cor || 'Nao informado'}</span>
                {tubo?.descricao && <p className="tubo-descricao">{tubo.descricao}</p>}
              </div>
            )}
          </div>

          {/* ---------- Material e coleta ---------- */}
          <div className="exame-detalhe-card">
            <div className="exame-detalhe-card-topo">
              <h2>Material e coleta</h2>
              {podeEditar && editando !== 'material' && (
                <button className="card-editar-botao" onClick={() => abrirEdicao('material')}>Editar</button>
              )}
            </div>

            {editando === 'material' ? (
              <div className="secao-edicao">
                <label>
                  Material
                  <select value={form.material_id} onChange={(e) => handleChange('material_id', e.target.value)}>
                    <option value="">Nao informado</option>
                    {listaMateriais.map((m) => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Forma de coleta
                  <input value={form.forma_coleta} onChange={(e) => handleChange('forma_coleta', e.target.value)} />
                </label>
                <div className="edicao-grid-dupla">
                  <label>
                    Volume minimo
                    <input value={form.volume_minimo} onChange={(e) => handleChange('volume_minimo', e.target.value)} />
                  </label>
                  <label>
                    Volume ideal
                    <input value={form.volume_ideal} onChange={(e) => handleChange('volume_ideal', e.target.value)} />
                  </label>
                </div>
                <div className="edicao-acoes">
                  <button className="edicao-salvar" onClick={salvar} disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button className="edicao-cancelar" onClick={cancelarEdicao} disabled={salvando}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="exame-detalhe-campo">
                  <span className="campo-label">Material</span>
                  <span className="campo-valor">{material?.nome || 'Nao informado'}</span>
                </div>
                <div className="exame-detalhe-campo">
                  <span className="campo-label">Forma de coleta</span>
                  <span className="campo-valor">{exame.forma_coleta || 'Nao informado'}</span>
                </div>
                <div className="exame-detalhe-campo-dupla">
                  <div>
                    <span className="campo-label">Volume minimo</span>
                    <span className="campo-valor">{exame.volume_minimo || 'Nao informado'}</span>
                  </div>
                  <div>
                    <span className="campo-label">Volume ideal</span>
                    <span className="campo-valor">{exame.volume_ideal || 'Nao informado'}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ---------- Preparo do paciente ---------- */}
          <div className="exame-detalhe-card">
            <div className="exame-detalhe-card-topo">
              <h2>Preparo do paciente</h2>
              {podeEditar && editando !== 'preparo' && (
                <button className="card-editar-botao" onClick={() => abrirEdicao('preparo')}>Editar</button>
              )}
            </div>

            {editando === 'preparo' ? (
              <div className="secao-edicao">
                <label>
                  Jejum necessario
                  <input value={form.jejum_necessario} onChange={(e) => handleChange('jejum_necessario', e.target.value)} />
                </label>
                <label>
                  Preparo
                  <textarea rows={3} value={form.preparo_paciente} onChange={(e) => handleChange('preparo_paciente', e.target.value)} />
                </label>
                <div className="edicao-acoes">
                  <button className="edicao-salvar" onClick={salvar} disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button className="edicao-cancelar" onClick={cancelarEdicao} disabled={salvando}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="exame-detalhe-campo">
                  <span className="campo-label">Jejum necessario</span>
                  <span className="campo-valor">{exame.jejum_necessario || 'Nao informado'}</span>
                </div>
                <div className="exame-detalhe-campo">
                  <span className="campo-label">Preparo</span>
                  <span className="campo-valor">{exame.preparo_paciente || 'Nenhum preparo especial informado'}</span>
                </div>
              </>
            )}
          </div>

          {/* ---------- Processamento ---------- */}
          <div className="exame-detalhe-card">
            <div className="exame-detalhe-card-topo">
              <h2>Processamento</h2>
              {podeEditar && editando !== 'processamento' && (
                <button className="card-editar-botao" onClick={() => abrirEdicao('processamento')}>Editar</button>
              )}
            </div>

            {editando === 'processamento' ? (
              <div className="secao-edicao">
                <label>
                  Onde e processado
                  <select value={form.laboratorio_id} onChange={(e) => handleChange('laboratorio_id', e.target.value)}>
                    <option value="">Processamento interno (sem laboratorio de apoio)</option>
                    {listaLaboratorios.map((lab) => (
                      <option key={lab.id} value={lab.id}>Enviar para: {lab.nome}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Metodo utilizado
                  <input value={form.metodo_utilizado} onChange={(e) => handleChange('metodo_utilizado', e.target.value)} />
                </label>
                <label>
                  Equipamento
                  <input value={form.equipamento} onChange={(e) => handleChange('equipamento', e.target.value)} placeholder="Ex: Cobas 8000" />
                </label>
                <div className="edicao-grid-dupla">
                  <label>
                    Temperatura de armazenamento
                    <input value={form.temperatura_armazenamento} onChange={(e) => handleChange('temperatura_armazenamento', e.target.value)} />
                  </label>
                  <label>
                    Tempo maximo de envio
                    <input value={form.tempo_maximo_envio} onChange={(e) => handleChange('tempo_maximo_envio', e.target.value)} />
                  </label>
                </div>
                <div className="edicao-acoes">
                  <button className="edicao-salvar" onClick={salvar} disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button className="edicao-cancelar" onClick={cancelarEdicao} disabled={salvando}>
                    Cancelar
                  </button>
                </div>
                {listaLaboratorios.length === 0 && (
                  <p className="processamento-aviso">
                    Nenhum laboratorio de apoio cadastrado ainda.{' '}
                    <Link to="/laboratorios">Cadastrar um laboratorio</Link>
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="exame-detalhe-campo">
                  <span className="campo-label">Onde e realizado</span>
                  <span className="campo-valor">{processamento.nome}</span>
                </div>
                <div className="exame-detalhe-campo">
                  <span className="campo-label">Metodo utilizado</span>
                  <span className="campo-valor">{exame.metodo_utilizado || 'Nao informado'}</span>
                </div>
                <div className="exame-detalhe-campo">
                  <span className="campo-label">Equipamento</span>
                  <span className="campo-valor">{exame.equipamento || 'Nao informado'}</span>
                </div>
                <div className="exame-detalhe-campo-dupla">
                  <div>
                    <span className="campo-label">Temperatura de armazenamento</span>
                    <span className="campo-valor">{exame.temperatura_armazenamento || 'Nao informado'}</span>
                  </div>
                  <div>
                    <span className="campo-label">Tempo maximo de envio</span>
                    <span className="campo-valor">{exame.tempo_maximo_envio || 'Nao informado'}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ---------- Prazos ---------- */}
          <div className="exame-detalhe-card">
            <div className="exame-detalhe-card-topo">
              <h2>Prazos</h2>
              {podeEditar && editando !== 'prazos' && (
                <button className="card-editar-botao" onClick={() => abrirEdicao('prazos')}>Editar</button>
              )}
            </div>

            {editando === 'prazos' ? (
              <div className="secao-edicao">
                <div className="edicao-grid-dupla">
                  <label>
                    Dias de realizacao
                    <input value={form.dias_realizacao} onChange={(e) => handleChange('dias_realizacao', e.target.value)} />
                  </label>
                  <label>
                    Prazo de liberacao
                    <input value={form.prazo_liberacao_resultado} onChange={(e) => handleChange('prazo_liberacao_resultado', e.target.value)} />
                  </label>
                </div>
                <label>
                  Prazo de liberacao (em horas)
                  <input
                    type="number" step="any" min="0"
                    value={form.prazo_liberacao_horas}
                    onChange={(e) => handleChange('prazo_liberacao_horas', e.target.value)}
                    placeholder="Ex: 1 (usado na tela de Liberacao de Exames)"
                  />
                </label>
                <div className="edicao-acoes">
                  <button className="edicao-salvar" onClick={salvar} disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button className="edicao-cancelar" onClick={cancelarEdicao} disabled={salvando}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="exame-detalhe-campo-dupla">
                <div>
                  <span className="campo-label">Dias de realizacao</span>
                  <span className="campo-valor">{exame.dias_realizacao || 'Nao informado'}</span>
                </div>
                <div>
                  <span className="campo-label">Prazo de liberacao</span>
                  <span className="campo-valor">{exame.prazo_liberacao_resultado || 'Nao informado'}</span>
                </div>
                <div>
                  <span className="campo-label">Prazo de liberacao (em horas)</span>
                  <span className="campo-valor">
                    {exame.prazo_liberacao_horas != null ? `${exame.prazo_liberacao_horas}h` : 'Nao informado'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ---------- Referencia de resultado ---------- */}
          <div className="exame-detalhe-card">
            <div className="exame-detalhe-card-topo">
              <h2>Referencia de resultado</h2>
              {podeEditar && editando !== 'referencia' && (
                <button className="card-editar-botao" onClick={() => abrirEdicao('referencia')}>Editar</button>
              )}
            </div>

            {editando === 'referencia' ? (
              <div className="secao-edicao">
                <div className="edicao-grid-dupla">
                  <label>
                    Unidade do resultado
                    <input value={form.unidade_resultado} onChange={(e) => handleChange('unidade_resultado', e.target.value)} placeholder="Ex: mg/dL" />
                  </label>
                </div>
                <div className="edicao-grid-dupla">
                  <label>
                    Valor de referencia (minimo)
                    <input type="number" step="any" value={form.valor_referencia_min} onChange={(e) => handleChange('valor_referencia_min', e.target.value)} />
                  </label>
                  <label>
                    Valor de referencia (maximo)
                    <input type="number" step="any" value={form.valor_referencia_max} onChange={(e) => handleChange('valor_referencia_max', e.target.value)} />
                  </label>
                </div>
                <label>
                  Referencia em texto (para valores nao numericos, ex: Reagente/Nao reagente)
                  <textarea rows={2} value={form.valor_referencia_texto} onChange={(e) => handleChange('valor_referencia_texto', e.target.value)} />
                </label>
                <div className="edicao-acoes">
                  <button className="edicao-salvar" onClick={salvar} disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button className="edicao-cancelar" onClick={cancelarEdicao} disabled={salvando}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="exame-detalhe-campo-dupla">
                  <div>
                    <span className="campo-label">Faixa numerica</span>
                    <span className="campo-valor">
                      {exame.valor_referencia_min != null || exame.valor_referencia_max != null
                        ? `${exame.valor_referencia_min ?? '-'} a ${exame.valor_referencia_max ?? '-'} ${exame.unidade_resultado || ''}`
                        : 'Nao informado'}
                    </span>
                  </div>
                  <div>
                    <span className="campo-label">Unidade</span>
                    <span className="campo-valor">{exame.unidade_resultado || 'Nao informado'}</span>
                  </div>
                </div>
                <div className="exame-detalhe-campo">
                  <span className="campo-label">Referencia em texto</span>
                  <span className="campo-valor">{exame.valor_referencia_texto || 'Nao informado'}</span>
                </div>
              </>
            )}
          </div>

          {/* ---------- Observacoes ---------- */}
          <div className="exame-detalhe-card exame-detalhe-card-observacoes">
            <div className="exame-detalhe-card-topo">
              <h2>Observacoes</h2>
              {podeEditar && editando !== 'observacoes' && (
                <button className="card-editar-botao" onClick={() => abrirEdicao('observacoes')}>Editar</button>
              )}
            </div>

            {editando === 'observacoes' ? (
              <div className="secao-edicao">
                <label>
                  Observacoes
                  <textarea rows={3} value={form.observacoes} onChange={(e) => handleChange('observacoes', e.target.value)} />
                </label>
                <div className="edicao-acoes">
                  <button className="edicao-salvar" onClick={salvar} disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button className="edicao-cancelar" onClick={cancelarEdicao} disabled={salvando}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p className="campo-valor">{exame.observacoes || 'Nenhuma observacao registrada.'}</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ExameDetalhe;