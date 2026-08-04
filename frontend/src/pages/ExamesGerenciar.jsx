import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import './ExamesGerenciar.css';

const EXAME_VAZIO = {
  nome: '', sigla: '', codigo: '', laboratorio_id: '', setor_responsavel: '',
  material_id: '', tubo_id: '', volume_minimo: '', volume_ideal: '',
  jejum_necessario: '', preparo_paciente: '', forma_coleta: '',
  temperatura_armazenamento: '', tempo_maximo_envio: '', dias_realizacao: '',
  prazo_liberacao_resultado: '', metodo_utilizado: '', observacoes: '',
};

function ExamesGerenciar() {
  const [exames, setExames] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [tubos, setTubos] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);

  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(EXAME_VAZIO);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  async function carregarTudo() {
    setCarregando(true);
    try {
      const [respExames, respMateriais, respTubos, respLabs] = await Promise.all([
        api.get('/exames/'),
        api.get('/materiais/'),
        api.get('/tubos/'),
        api.get('/laboratorios/'),
      ]);
      setExames(respExames.data);
      setMateriais(respMateriais.data);
      setTubos(respTubos.data);
      setLaboratorios(respLabs.data);
    } catch {
      setErro('Nao foi possivel carregar os dados.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  function abrirNovo() {
    setForm(EXAME_VAZIO);
    setEditandoId(null);
    setFormAberto(true);
    setMensagem('');
    setErro('');
  }

  function abrirEdicao(exame) {
    setForm({
      nome: exame.nome || '',
      sigla: exame.sigla || '',
      codigo: exame.codigo || '',
      laboratorio_id: exame.laboratorio_id ?? '',
      setor_responsavel: exame.setor_responsavel || '',
      material_id: exame.material_id ?? '',
      tubo_id: exame.tubo_id ?? '',
      volume_minimo: exame.volume_minimo || '',
      volume_ideal: exame.volume_ideal || '',
      jejum_necessario: exame.jejum_necessario || '',
      preparo_paciente: exame.preparo_paciente || '',
      forma_coleta: exame.forma_coleta || '',
      temperatura_armazenamento: exame.temperatura_armazenamento || '',
      tempo_maximo_envio: exame.tempo_maximo_envio || '',
      dias_realizacao: exame.dias_realizacao || '',
      prazo_liberacao_resultado: exame.prazo_liberacao_resultado || '',
      metodo_utilizado: exame.metodo_utilizado || '',
      observacoes: exame.observacoes || '',
    });
    setEditandoId(exame.id);
    setFormAberto(true);
    setMensagem('');
    setErro('');
  }

  function fecharForm() {
    setFormAberto(false);
    setEditandoId(null);
    setForm(EXAME_VAZIO);
  }

  function handleChange(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function montarPayload() {
    const payload = { ...form };
    ['laboratorio_id', 'material_id', 'tubo_id'].forEach((campo) => {
      payload[campo] = payload[campo] === '' ? null : Number(payload[campo]);
    });
    Object.keys(payload).forEach((campo) => {
      if (payload[campo] === '') payload[campo] = null;
    });
    return payload;
  }

  async function handleSalvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');
    setMensagem('');

    const payload = montarPayload();

    try {
      if (editandoId) {
        await api.put(`/exames/${editandoId}`, payload);
        setMensagem('Exame atualizado com sucesso.');
      } else {
        await api.post('/exames/', payload);
        setMensagem('Exame cadastrado com sucesso.');
      }
      fecharForm();
      carregarTudo();
    } catch (erroRequisicao) {
      setErro(
        erroRequisicao.response?.data?.detail ||
        'Nao foi possivel salvar o exame. Verifique os campos.'
      );
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(exame) {
    const confirmar = window.confirm(`Excluir o exame "${exame.nome}"?`);
    if (!confirmar) return;

    try {
      await api.delete(`/exames/${exame.id}`);
      carregarTudo();
    } catch {
      setErro('Nao foi possivel excluir o exame.');
    }
  }

  return (
    <Layout>
      <div className="gerenciar">
        <Link to="/exames" className="gerenciar-voltar-topo">← Voltar para o dashboard</Link>

        <div className="gerenciar-cabecalho">
          <h1>Gerenciar exames</h1>
          <p>Cadastre, edite ou remova exames do sistema.</p>
        </div>

        {erro && <p className="gerenciar-erro">{erro}</p>}
        {mensagem && <p className="gerenciar-mensagem">{mensagem}</p>}

        {!formAberto && (
          <button className="gerenciar-novo" onClick={abrirNovo}>
            + Novo exame
          </button>
        )}

        {formAberto && (
          <form className="gerenciar-form" onSubmit={handleSalvar}>
            <h2>{editandoId ? 'Editar exame' : 'Novo exame'}</h2>

            <div className="form-grid">
              <label>
                Nome *
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                />
              </label>

              <label>
                Sigla
                <input
                  type="text"
                  value={form.sigla}
                  onChange={(e) => handleChange('sigla', e.target.value)}
                />
              </label>

              <label>
                Codigo
                <input
                  type="text"
                  value={form.codigo}
                  onChange={(e) => handleChange('codigo', e.target.value)}
                />
              </label>

              <label>
                Setor responsavel
                <input
                  type="text"
                  value={form.setor_responsavel}
                  onChange={(e) => handleChange('setor_responsavel', e.target.value)}
                />
              </label>

              <label>
                Onde e processado
                <select
                  value={form.laboratorio_id}
                  onChange={(e) => handleChange('laboratorio_id', e.target.value)}
                >
                  <option value="">Processamento interno (sem laboratorio de apoio)</option>
                  {laboratorios.map((lab) => (
                    <option key={lab.id} value={lab.id}>Enviar para: {lab.nome}</option>
                  ))}
                </select>
              </label>

              <label>
                Material
                <select
                  value={form.material_id}
                  onChange={(e) => handleChange('material_id', e.target.value)}
                >
                  <option value="">Nao informado</option>
                  {materiais.map((mat) => (
                    <option key={mat.id} value={mat.id}>{mat.nome}</option>
                  ))}
                </select>
              </label>

              <label>
                Tubo/recipiente
                <select
                  value={form.tubo_id}
                  onChange={(e) => handleChange('tubo_id', e.target.value)}
                >
                  <option value="">Nao informado</option>
                  {tubos.map((tubo) => (
                    <option key={tubo.id} value={tubo.id}>{tubo.cor}</option>
                  ))}
                </select>
              </label>

              <label>
                Volume minimo
                <input
                  type="text"
                  value={form.volume_minimo}
                  onChange={(e) => handleChange('volume_minimo', e.target.value)}
                />
              </label>

              <label>
                Volume ideal
                <input
                  type="text"
                  value={form.volume_ideal}
                  onChange={(e) => handleChange('volume_ideal', e.target.value)}
                />
              </label>

              <label>
                Jejum necessario
                <input
                  type="text"
                  value={form.jejum_necessario}
                  onChange={(e) => handleChange('jejum_necessario', e.target.value)}
                />
              </label>

              <label>
                Forma de coleta
                <input
                  type="text"
                  value={form.forma_coleta}
                  onChange={(e) => handleChange('forma_coleta', e.target.value)}
                />
              </label>

              <label>
                Temperatura de armazenamento
                <input
                  type="text"
                  value={form.temperatura_armazenamento}
                  onChange={(e) => handleChange('temperatura_armazenamento', e.target.value)}
                />
              </label>

              <label>
                Tempo maximo de envio
                <input
                  type="text"
                  value={form.tempo_maximo_envio}
                  onChange={(e) => handleChange('tempo_maximo_envio', e.target.value)}
                />
              </label>

              <label>
                Dias de realizacao
                <input
                  type="text"
                  value={form.dias_realizacao}
                  onChange={(e) => handleChange('dias_realizacao', e.target.value)}
                />
              </label>

              <label>
                Prazo de liberacao do resultado
                <input
                  type="text"
                  value={form.prazo_liberacao_resultado}
                  onChange={(e) => handleChange('prazo_liberacao_resultado', e.target.value)}
                />
              </label>

              <label>
                Metodo utilizado
                <input
                  type="text"
                  value={form.metodo_utilizado}
                  onChange={(e) => handleChange('metodo_utilizado', e.target.value)}
                />
              </label>
            </div>

            <label className="form-full">
              Preparo do paciente
              <textarea
                rows={2}
                value={form.preparo_paciente}
                onChange={(e) => handleChange('preparo_paciente', e.target.value)}
              />
            </label>

            <label className="form-full">
              Observacoes
              <textarea
                rows={2}
                value={form.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
              />
            </label>

            <div className="form-acoes">
              <button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" className="form-cancelar" onClick={fecharForm}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {carregando ? (
          <p>Carregando exames...</p>
        ) : (
          <table className="gerenciar-tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Sigla</th>
                <th>Setor</th>
                <th>Material</th>
                <th>Tubo</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {exames.map((exame) => {
                const material = materiais.find((m) => m.id === exame.material_id);
                const tubo = tubos.find((t) => t.id === exame.tubo_id);
                return (
                  <tr key={exame.id}>
                    <td>{exame.nome}</td>
                    <td>{exame.sigla || '-'}</td>
                    <td>{exame.setor_responsavel || '-'}</td>
                    <td>{material ? material.nome : '-'}</td>
                    <td>{tubo ? tubo.cor : '-'}</td>
                    <td className="gerenciar-acoes">
                      <button onClick={() => abrirEdicao(exame)}>Editar</button>
                      <button className="btn-excluir" onClick={() => handleExcluir(exame)}>Excluir</button>
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

export default ExamesGerenciar;