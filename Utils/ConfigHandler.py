from datetime import datetime
from zoneinfo import ZoneInfo

class ConfigHandler:

    @staticmethod
    def js_now():
        tz = ZoneInfo("Europe/Berlin")
        now = datetime.now(tz)

        name = "Mitteleuropäische Sommerzeit" if now.dst() else "Mitteleuropäische Normalzeit"

        return f"{now.strftime('%a %b %d %Y %H:%M:%S GMT%z')} ({name})"
            

    @staticmethod
    def create_config(device_id: str, prod: str):
        return [2969,f"{ConfigHandler.js_now()}",4294967296,1,"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36","https://accounts.google.com/gsi/client",f"{prod}","de-DE","de-DE",5245.79999999702,"virtualKeyboard−[object VirtualKeyboard]","__reactContainer$5pyziap1brc","onpointerout",14794.19999999553,f"{device_id}","",10,1773143507127.4,0,0,0,0,0,0,0]

