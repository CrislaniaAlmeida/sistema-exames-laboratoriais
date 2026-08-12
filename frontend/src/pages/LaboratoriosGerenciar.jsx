import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { extrairMensagemErro } from '../services/erros';
import './TubosGerenciar.css';

const LABORATORIO_VAZIO = { nome: '', telefone: '', email: '', cidade: '', estado: '', site: '' };

function LaboratoriosGerenciar() {
  const [laboratorios, setLaboratorios] = useState([]);
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(LABORATORIO_VAZIO);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  async function carregarLaboratorios() {
    setCarregando(true);
    try {
      const resposta = await api.get('/laboratorios/');
      setLaboratorios(resposta.data);
    } catch {
      setErro('Nao foi possivel carregar os laboratorios.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarLaboratorios();
  }, []);

  function abrirNovo() {
    setForm(LABORATORIO_VAZIO);
    setEditandoId(null);
    setFormAberto(true);
    setMensagem('');
    setErro('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function abrirEdicao(laboratorio) {
    setForm({
      nome: laboratorio.nome || '',
      telefone: laboratorio.telefone || '',
      email: laboratorio.email || '',
      cidade: laboratorio.cidade || '',
      estado: laboratorio.estado || '',
      site: laboratorio.site || '',
    });
    setEditandoId(laboratorio.id);
    setFormAberto(true);
    setMensagem('');
    setErro('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function fecharForm() {
    setFormAberto(false);
    setEditandoId(null);
    setForm(LABORATORIO_VAZIO);
  }

  function handleChange(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function montarPayload() {
    const payload = { ...form };
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
        await api.put(`/laboratorios/${editandoId}`, payload);
        setMensagem('Laboratorio atualizado com sucesso.');
      } else {
        await api.post('/laboratorios/', payload);
        setMensagem('Laboratorio cadastrado com sucesso.');
      }
      fecharForm();
      carregarLaboratorios();
    } catch (erroRequisicao) {
      setErro(extrairMensagemErro(erroRequisicao, 'Nao foi possivel salvar o laboratorio. Verifique os campos.'));
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(laboratorio) {
    const confirmar = window.confirm(`Excluir o laboratorio "${laboratorio.nome}"?`);
    if (!confirmar) return;

    try {
      await api.delete(`/laboratorios/${laboratorio.id}`);
      carregarLaboratorios();
    } catch {
      setErro('Nao foi possivel excluir o laboratorio. Verifique se ele nao esta sendo usado por algum exame.');
    }
  }

  return (
    <Layout>
      <div className="gerenciar">
        <Link to="/exames" className="gerenciar-voltar-topo">← Voltar para o dashboard</Link>

        <div className="gerenciar-cabecalho">
          <h1>Gerenciar laboratorios de apoio</h1>
          <p>Cadastre laboratorios externos para onde exames podem ser encaminhados.</p>
        </div>

        {erro && <p className="gerenciar-erro">{erro}</p>}
        {mensagem && <p className="gerenciar-mensagem">{mensagem}</p>}

        {!formAberto && (
          <button className="gerenciar-novo" onClick={abrirNovo}>
            + Novo laboratorio
          </button>
        )}

        {formAberto && (
          <form className="gerenciar-form" onSubmit={handleSalvar}>
            <h2>{editandoId ? 'Editar laboratorio' : 'Novo laboratorio'}</h2>

            <div className="form-grid">
              <label>
                Nome *
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  placeholder="Ex: Laboratorio Central de Analises"
                />
              </label>

              <label>
                Telefone
                <input
                  type="text"
                  value={form.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </label>

              <label>
                Cidade
                <input
                  type="text"
                  value={form.cidade}
                  onChange={(e) => handleChange('cidade', e.target.value)}
                />
              </label>

              <label>
                Estado
                <input
                  type="text"
                  value={form.estado}
                  onChange={(e) => handleChange('estado', e.target.value)}
                  placeholder="Ex: CE"
                  maxLength={2}
                />
              </label>

              <label>
                Site
                <input
                  type="text"
                  value={form.site}
                  onChange={(e) => handleChange('site', e.target.value)}
                  placeholder="https://..."
                />
              </label>
            </div>

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
          <p>Carregando laboratorios...</p>
        ) : laboratorios.length === 0 ? (
          <p>Nenhum laboratorio de apoio cadastrado ainda.</p>
        ) : (
          <table className="gerenciar-tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cidade/Estado</th>
                <th>Telefone</th>
                <th>Email</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {laboratorios.map((laboratorio) => (
                <tr key={laboratorio.id}>
                  <td>{laboratorio.nome}</td>
                  <td>
                    {laboratorio.cidade || '-'}
                    {laboratorio.estado ? `/${laboratorio.estado}` : ''}
                  </td>
                  <td>{laboratorio.telefone || '-'}</td>
                  <td>{laboratorio.email || '-'}</td>
                  <td className="gerenciar-acoes">
                    <button onClick={() => abrirEdicao(laboratorio)}>Editar</button>
                    <button className="btn-excluir" onClick={() => handleExcluir(laboratorio)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

export default LaboratoriosGerenciar;