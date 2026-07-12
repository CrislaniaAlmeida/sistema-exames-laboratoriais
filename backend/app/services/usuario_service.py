from sqlalchemy.orm import Session
from app.database.models import Usuario
from app.schemas.usuario import UsuarioCriar
from app.auth.jwt import criptografar_senha, verificar_senha


def buscar_usuario_por_email(db: Session, email: str):
    return db.query(Usuario).filter(Usuario.email == email).first()


def criar_usuario(db: Session, dados: UsuarioCriar):
    senha_criptografada = criptografar_senha(dados.senha)

    novo_usuario = Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=senha_criptografada,
        perfil=dados.perfil,
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario


def autenticar_usuario(db: Session, email: str, senha: str):
    usuario = buscar_usuario_por_email(db, email)
    if not usuario:
        return None
    if not usuario.ativo:
        return None
    if not verificar_senha(senha, usuario.senha_hash):
        return None
    return usuario
