from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Usuario
from app.schemas.paciente import AmostraConsultaResposta
from app.services import paciente_service
from app.auth.dependencies import exigir_permissao

router = APIRouter(prefix="/amostras", tags=["Amostras"])


@router.get("/{codigo}", response_model=AmostraConsultaResposta)
def consultar_amostra(
    codigo: str,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_permissao("pacientes_gerenciar")),
):
    """
    Consulta os dados de uma amostra (tubo) pelo codigo gerado no
    cadastro -- o mesmo codigo impresso no codigo de barras da
    etiqueta. Pensado para uma futura integracao com aparelho de
    setor: hoje nao ha nenhum aparelho conectado, mas essa rota ja
    deixa pronto o que ele precisaria consultar (dados do paciente e
    os exames daquele tubo).
    """
    amostra = paciente_service.buscar_amostra_por_codigo(db, codigo)
    if not amostra:
        raise HTTPException(status_code=404, detail="Amostra nao encontrada.")
    return amostra
