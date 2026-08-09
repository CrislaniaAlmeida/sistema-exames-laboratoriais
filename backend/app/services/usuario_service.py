from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.database.models import Usuario, PERFIS_VALIDOS
from app.schemas.usuario import UsuarioCriar, UsuarioAtualizar
from app.auth.jwt import criptografar_senha, verificar_senha


def validar_perfil(perfil: str):
    if perfil not in PERFIS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Perfil deve ser um dos seguintes: {', '.join(PERFIS_VALIDOS)}.",
        )


def buscar_usuario_por_email(db: Session, email: str):
    return db.query(Usuario).filter(Usuario.email == email).first()


def buscar_usuario_por_id(db: Session, usuario_id: int):
    return db.query(Usuario).filter(Usuario.id == usuario_id).first()


def listar_usuarios(db: Session):
    return db.query(Usuario).order_by(Usuario.criado_em.desc()).all()


def criar_usuario(db: Session, dados: UsuarioCriar):
    validar_perfil(dados.perfil)
    senha_criptografada = criptografar_senha(dados.senha)

    permissoes = [] if dados.perfil == "admin" else dados.permissoes

    novo_usuario = Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=senha_criptografada,
        perfil=dados.perfil,
        permissoes=permissoes,
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario


def atualizar_usuario(db: Session, usuario_id: int, dados: UsuarioAtualizar):
    usuario = buscar_usuario_por_id(db, usuario_id)
    if not usuario:
        return None

    dados_para_atualizar = dados.model_dump(exclude_unset=True)

    if "perfil" in dados_para_atualizar:
        validar_perfil(dados_para_atualizar["perfil"])

    if dados_para_atualizar.get("senha"):
        usuario.senha_hash = criptografar_senha(dados_para_atualizar["senha"])
    dados_para_atualizar.pop("senha", None)

    for campo, valor in dados_para_atualizar.items():
        setattr(usuario, campo, valor)

    if usuario.perfil == "admin":
        usuario.permissoes = []

    db.commit()
    db.refresh(usuario)
    return usuario


def excluir_usuario(db: Session, usuario_id: int):
    usuario = buscar_usuario_por_id(db, usuario_id)
    if not usuario:
        return None

    db.delete(usuario)
    db.commit()
    return usuario


def autenticar_usuario(db: Session, email: str, senha: str):
    usuario = buscar_usuario_por_email(db, email)
    if not usuario:
        return None
    if not usuario.ativo:
        return None
    if not verificar_senha(senha, usuario.senha_hash):
        return None
    return usuario
