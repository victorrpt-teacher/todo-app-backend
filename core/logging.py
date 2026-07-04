import json
import logging
from datetime import datetime, timezone


class JsonLogFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "timestamp": datetime.fromtimestamp(
                record.created,
                timezone.utc,
            ).isoformat(),
            "service": "api",
            "level": record.levelname.lower(),
            "logger": record.name,
            "message": record.getMessage(),
        }

        for attr in ("status_code", "method", "path"):
            value = getattr(record, attr, None)
            if value is not None:
                payload[attr] = value

        request = getattr(record, "request", None)
        if request is not None:
            payload.setdefault("method", getattr(request, "method", None))
            payload.setdefault("path", getattr(request, "path", None))

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str, separators=(",", ":"))
