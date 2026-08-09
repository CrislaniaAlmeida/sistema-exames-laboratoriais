import pytest

from app.validadores import validar_cpf


def test_cpf_valido_e_normalizado_sem_pontuacao():
    assert validar_cpf("111.444.777-35") == "11144477735"
    assert validar_cpf("11144477735") == "11144477735"


@pytest.mark.parametrize("cpf_invalido", [
    "11111111111",   # todos os digitos iguais
    "123",           # poucos digitos
    "12345678900",   # digitos verificadores errados
    "000.000.000-00",
])
def test_cpf_invalido_e_rejeitado(cpf_invalido):
    with pytest.raises(ValueError):
        validar_cpf(cpf_invalido)
