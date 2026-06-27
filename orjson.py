import json
from typing import Any


class _FallbackModule:
    JSONDecodeError = json.JSONDecodeError

    @staticmethod
    def dumps(obj: Any, *, default: Any = None, option: int | None = None) -> bytes:
        if default is not None:
            return json.dumps(obj, default=default, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        return json.dumps(obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

    @staticmethod
    def loads(obj: Any, *, parse_float: Any = None) -> Any:
        if isinstance(obj, (bytes, bytearray)):
            obj = obj.decode("utf-8")
        if parse_float is not None:
            return json.loads(obj, parse_float=parse_float)
        return json.loads(obj)


orjson = _FallbackModule()

dumps = orjson.dumps
loads = orjson.loads
JSONDecodeError = orjson.JSONDecodeError
__version__ = "3.10.0"
