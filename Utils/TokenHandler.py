from json import dumps
from base64 import b64encode
from time   import time
from .VMReverser import VMReverser

class TokenHandler:

    def encode(e):
        value = b64encode(dumps(e, separators=(',', ':'), ensure_ascii=False).encode('utf-8')).decode('utf-8')
        return value

    @staticmethod
    def generate_token(config):
        t = "e"
        n = time() * 1000
        try:
            config[3] = 1
            config[9] = round(time() * 1000 - n)
            return "gAAAAAC" + TokenHandler.encode(config)
        except Exception as e:
            t = TokenHandler.encode(str(e))
        return "error_" + t
    
    @staticmethod
    def mod(e: str) -> str:
        t = 2166136261
        for ch in e:
            t ^= ord(ch)
            t = (t * 16777619) & 0xFFFFFFFF

        t ^= (t >> 16)
        t = (t * 2246822507) & 0xFFFFFFFF
        t ^= (t >> 13)
        t = (t * 3266489909) & 0xFFFFFFFF
        t ^= (t >> 16)

        return f"{t:08x}"

    @staticmethod
    def _runCheck(t0, n, r, o, config):
        config[3] = o
        config[9] = round(time() * 1000 - t0)

        i = TokenHandler.encode(config)

        if TokenHandler.mod(n + i)[:len(r)] <= r:
            return f"{i}~S"
        return None

    @staticmethod
    def solve_pow(t, n, config):
        t0 = int(time() * 1000)
        for i in range(500000):
            a = TokenHandler._runCheck(t0, t, n, i, config)
            if a:
                return "gAAAAAB" + a
    
    @staticmethod
    def get_turnstile(turnstile, p_token):

        return VMReverser(turnstile, p_token).dump_all()