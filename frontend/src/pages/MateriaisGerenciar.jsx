import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { extrairMensagemErro } from '../services/erros';
import './MateriaisGerenciar.css';

const MATERIAL_VAZIO = { nome: '' };

const iconeMaterial = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
);
const iconeEditar = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);
const iconeExcluir = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
);
const iconeBusca = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
);

function MateriaisGerenciar() {
  const [materiais, setMateriais] = useState([]);
  const [termoFiltro, setTermoFiltro] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(MATERIAL_VAZIO);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  async function carregarMateriais() {
    setCarregando(true);
    try {
      const resposta = await api.get('/materiais/');
      setMateriais(resposta.data);
    } catch {
      setErro('Nao foi possivel carregar os materiais.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarMateriais();
  }, []);

  const materiaisFiltrados = materiais
    .filter((m) => m.nome.toLowerCase().includes(termoFiltro.trim().toLowerCase()))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  function abrirNovo() {
    setForm(MATERIAL_VAZIO);
    setEditandoId(null);
    setFormAberto(true);
    setMensagem('');
    setErro('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function abrirEdicao(material) {
    setForm({ nome: material.nome || '' });
    setEditandoId(material.id);
    setFormAberto(true);
    setMensagem('');
    setErro('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function fecharForm() {
    setFormAberto(false);
    setEditandoId(null);
    setForm(MATERIAL_VAZIO);
  }

  async function handleSalvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');
    setMensagem('');

    try {
      if (editandoId) {
        await api.put(`/materiais/${editandoId}`, form);
        setMensagem('Material atualizado com sucesso.');
      } else {
        await api.post('/materiais/', form);
        setMensagem('Material cadastrado com sucesso.');
      }
      fecharForm();
      carregarMateriais();
    } catch (erroRequisicao) {
      setErro(extrairMensagemErro(erroRequisicao, 'Nao foi possivel salvar o material. Verifique se ele ja nao existe.'));
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(material) {
    const confirmar = window.confirm(`Excluir o material "${material.nome}"?`);
    if (!confirmar) return;

    try {
      await api.delete(`/materiais/${material.id}`);
      carregarMateriais();
    } catch {
      setErro('Nao foi possivel excluir o material. Verifique se ele nao esta sendo usado por algum exame.');
    }
  }

  return (
    <Layout>
      <div className="gerenciar gerenciar-materiais">
        <Link to="/exames" className="gerenciar-voltar-topo">← Voltar para o dashboard</Link>

        <div className="gerenciar-cabecalho">
          <h1>Gerenciar materiais</h1>
          <p>Cadastre, edite ou remova os materiais biologicos usados nos exames.</p>
        </div>

        <div className="material-banner">
          <span className="material-banner-legenda">Padronizacao de materiais e reagentes usados na rotina</span>
        </div>

        {erro && <p className="gerenciar-erro">{erro}</p>}
        {mensagem && <p className="gerenciar-mensagem">{mensagem}</p>}

        {!formAberto && (
          <button className="gerenciar-novo" onClick={abrirNovo}>
            + Novo material
          </button>
        )}

        {formAberto && (
          <form className="gerenciar-form" onSubmit={handleSalvar}>
            <h2><span className="material-secao-icone">{iconeMaterial}</span>{editandoId ? 'Editar material' : 'Novo material'}</h2>

            <div className="form-grid">
              <label>
                Nome *
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={form.nome}
                  onChange={(e) => setForm({ nome: e.target.value })}
                  placeholder="Ex: Sangue periferico, Urina, Bilis..."
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

        {!formAberto && (
          <div className="material-busca-grupo">
            <span className="material-busca-icone">{iconeBusca}</span>
            <input
              type="text"
              className="material-busca"
              placeholder="Buscar material por nome..."
              value={termoFiltro}
              onChange={(e) => setTermoFiltro(e.target.value)}
            />
          </div>
        )}

        {carregando ? (
          <p>Carregando materiais...</p>
        ) : materiaisFiltrados.length === 0 ? (
          <div className="material-estado-vazio">
            <span className="material-estado-vazio-icone">{iconeMaterial}</span>
            <p>Nenhum material encontrado.</p>
          </div>
        ) : (
          <table className="gerenciar-tabela">
            <thead>
              <tr>
                <th>Material</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {materiaisFiltrados.map((material) => (
                <tr key={material.id}>
                  <td>{material.nome}</td>
                  <td className="gerenciar-acoes">
                    <button onClick={() => abrirEdicao(material)}>{iconeEditar}Editar</button>
                    <button className="btn-excluir" onClick={() => handleExcluir(material)}>{iconeExcluir}Excluir</button>
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

export default MateriaisGerenciar;
