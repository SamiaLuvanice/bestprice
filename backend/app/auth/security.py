import hashlib
import hmac
import os
import secrets


def hash_password(password: str) -> str:
    if len(password) < 12:
        raise ValueError("Senha muito curta")
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        method, salt_hex, digest_hex = stored.split("$")
        if method != "scrypt":
            return False
        expected = bytes.fromhex(digest_hex)
        actual = hashlib.scrypt(password.encode("utf-8"), salt=bytes.fromhex(salt_hex), n=2**14, r=8, p=1)
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


# Hash fictício com os mesmos parâmetros scrypt, calculado uma vez na importação. Toda falha
# de credencial (e-mail sem conta, campo acima do máximo) verifica contra ele: o tempo de
# resposta não revela se a conta existe.
DUMMY_PASSWORD_HASH = hash_password(secrets.token_urlsafe(32))
# Senha curta fixa para campos acima do máximo: o trabalho não cresce com o tamanho enviado.
DUMMY_PASSWORD = "senha-ficticia"
