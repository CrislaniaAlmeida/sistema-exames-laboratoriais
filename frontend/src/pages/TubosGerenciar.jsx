import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './TubosGerenciar.css';

const TUBO_VAZIO = { cor: '', descricao: '', foto_url: '' };

function TubosGerenciar() {
  const { usuario, logout } = useAuth();

  const [tubos, setTubos] = useState([]);
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(TUBO_VAZIO);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  async function carregarTubos() {
    setCarregando(true);
    try {
      const resposta = await api.get('/tubos/');
      setTubos(resposta.data);
    } catch {
      setErro('Nao foi possivel carregar os tubos.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTubos();
  }, []);

  function abrirNovo() {
    setForm(TUBO_VAZIO);
    setEditandoId(null);
    setFormAberto(true);
    setMensagem('');
    setErro('');
  }

  function abrirEdicao(tubo) {
    setForm({
      cor: tubo.cor || '',
      descricao: tubo.descricao || '',
      foto_url: tubo.foto_url || '',
    });
    setEditandoId(tubo.id);
    setFormAberto(true);
    setMensagem('');
    setErro('');
  }

  function fecharForm() {
    setFormAberto(false);
    setEditandoId(null);
    setForm(TUBO_VAZIO);
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
        await api.put(`/tubos/${editandoId}`, payload);
        setMensagem('Tubo atualizado com sucesso.');
      } else {
        await api.post('/tubos/', payload);
        setMensagem('Tubo cadastrado com sucesso.');
      }
      fecharForm();
      carregarTubos();
    } catch (erroRequisicao) {
      setErro(
        erroRequisicao.response?.data?.detail ||
        'Nao foi possivel salvar o tubo. Verifique os campos.'
      );
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(tubo) {
    const confirmar = window.confirm(`Excluir o tubo "${tubo.cor}"?`);
    if (!confirmar) return;

    try {
      await api.delete(`/tubos/${tubo.id}`);
      carregarTubos();
    } catch {
      setErro('Nao foi possivel excluir o tubo. Verifique se ele nao esta sendo usado por algum exame.');
    }
  }

  return (
    <div className="gerenciar">
      <header className="gerenciar-header">
        <div>
          <h1>Gerenciar tubos</h1>
          <p>Cadastre, edite ou remova os tubos de coleta do sistema.</p>
        </div>
        <div className="gerenciar-user">
          <Link to="/exames" className="gerenciar-voltar">← Voltar para o dashboard</Link>
          <span>Ola, {usuario?.nome}</span>
          <button onClick={logout} className="gerenciar-sair">Sair</button>
        </div>
      </header>

      {erro && <p className="gerenciar-erro">{erro}</p>}
      {mensagem && <p className="gerenciar-mensagem">{mensagem}</p>}

      {!formAberto && (
        <button className="gerenciar-novo" onClick={abrirNovo}>
          + Novo tubo
        </button>
      )}

      {formAberto && (
        <form className="gerenciar-form" onSubmit={handleSalvar}>
          <h2>{editandoId ? 'Editar tubo' : 'Novo tubo'}</h2>

          <div className="form-grid">
            <label>
              Cor *
              <input
                type="text"
                required
                value={form.cor}
                onChange={(e) => handleChange('cor', e.target.value)}
                placeholder="Ex: Roxo, Amarelo, Azul..."
              />
            </label>

            <label>
              URL da foto
              <input
                type="text"
                value={form.foto_url}
                onChange={(e) => handleChange('foto_url', e.target.value)}
                placeholder="/tubos/roxo-edta.jpeg"
              />
            </label>
          </div>

          <label className="form-full">
            Descricao
            <textarea
              rows={2}
              value={form.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              placeholder="Ex: EDTA - usado para hemograma e exames hematologicos"
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
        <p>Carregando tubos...</p>
      ) : (
        <table className="gerenciar-tabela">
          <thead>
            <tr>
              <th>Amostra</th>
              <th>Cor</th>
              <th>Descricao</th>
              <th>Foto</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {tubos.map((tubo) => (
              <tr key={tubo.id}>
                <td>
                  <span className="tubo-amostra-mini" style={{ backgroundColor: corParaHex(tubo.cor) }} />
                </td>
                <td>{tubo.cor}</td>
                <td>{tubo.descricao || '-'}</td>
                <td>{tubo.foto_url ? 'Sim' : 'Nao cadastrada'}</td>
                <td className="gerenciar-acoes">
                  <button onClick={() => abrirEdicao(tubo)}>Editar</button>
                  <button className="btn-excluir" onClick={() => handleExcluir(tubo)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const coresConhecidas = {
  amarelo: '#f5c518',
  roxo: '#7c3aed',
  azul: '#2563eb',
  cinza: '#94a3b8',
  vermelho: '#dc2626',
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

export default TubosGerenciar;