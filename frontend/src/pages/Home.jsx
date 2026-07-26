import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Home.css';

function Home() {
  const { usuario, logout } = useAuth();

  const [termo, setTermo] = useState('');
  const [exames, setExames] = useState([]);
  const [materiais, setMateriais] = useState({});
  const [tubos, setTubos] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [buscou, setBuscou] = useState(false);

  useEffect(() => {
    async function carregarAuxiliares() {
      try {
        const [respMateriais, respTubos] = await Promise.all([
          api.get('/materiais/'),
          api.get('/tubos/'),
        ]);
        const mapaMateriais = {};
        respMateriais.data.forEach((m) => { mapaMateriais[m.id] = m.nome; });
        const mapaTubos = {};
        respTubos.data.forEach((t) => { mapaTubos[t.id] = t.cor; });
        setMateriais(mapaMateriais);
        setTubos(mapaTubos);
      } catch {
        // Se essas rotas falharem, os exames ainda aparecem, so sem o nome traduzido.
      }
    }
    carregarAuxiliares();
  }, []);

  async function handleBuscar(evento) {
    evento.preventDefault();
    setErro('');
    setBuscou(true);
    setCarregando(true);

    try {
      if (termo.trim() === '') {
        const resposta = await api.get('/exames/');
        setExames(resposta.data);
      } else {
        const resposta = await api.get('/exames/pesquisar', {
          params: { termo },
        });
        setExames(resposta.data);
      }
    } catch (erroRequisicao) {
      if (erroRequisicao.response && erroRequisicao.response.status === 404) {
        setExames([]);
      } else {
        setErro('Nao foi possivel buscar os exames. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="home">
      <header className="home-header">
        <div>
          <h1>Guia de coleta por exame</h1>
          <p>Pesquise um exame para ver o material, o preparo do paciente e o tubo indicado.</p>
        </div>
        <div className="home-user">
          <span>Ola, {usuario?.nome} <span className="home-perfil">({usuario?.perfil})</span></span>
          {usuario?.perfil === 'admin' && (
            <Link to="/exames/gerenciar" className="home-gerenciar">Gerenciar exames</Link>
          )}
          <button onClick={logout} className="home-sair">Sair</button>
        </div>
      </header>

      <form onSubmit={handleBuscar} className="home-busca">
        <input
          type="text"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar por nome, sigla ou codigo do exame..."
        />
        <button type="submit" disabled={carregando}>
          {carregando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {erro && <p className="home-erro">{erro}</p>}

      {buscou && !carregando && exames.length === 0 && !erro && (
        <p className="home-vazio">Nenhum exame encontrado para esse termo.</p>
      )}

      <div className="home-resultados">
        {exames.map((exame) => (
          <div key={exame.id} className="exame-card">
            <div className="exame-card-header">
              <h3>{exame.nome}</h3>
              {exame.sigla && <span className="exame-sigla">{exame.sigla}</span>}
            </div>
            <div className="exame-card-body">
              <p><strong>Material:</strong> {materiais[exame.material_id] || '-'}</p>
              <p><strong>Tubo/recipiente:</strong> {tubos[exame.tubo_id] || '-'}</p>
              <p><strong>Preparo do paciente:</strong> {exame.preparo_paciente || 'Nao informado'}</p>
              <p><strong>Jejum necessario:</strong> {exame.jejum_necessario || 'Nao informado'}</p>
              <p><strong>Forma de coleta:</strong> {exame.forma_coleta || 'Nao informado'}</p>
              {exame.observacoes && (
                <p><strong>Observacoes:</strong> {exame.observacoes}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;