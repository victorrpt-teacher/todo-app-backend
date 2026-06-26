# Observabilidad con Django Prometheus

Este documento explica cómo configurar Django Prometheus para recoger métricas de la aplicación y usar un stack de monitoreo con Docker.

## Levantar el stack de monitoreo

Antes de ejecutar los servicios, crea una red compartida si no existe:

```bash
docker network create red-compartida-global
```

Luego levanta el stack de monitoreo:

```bash
docker compose -f docker-compose.monitoring.yaml up -d
```

Después de levantar el stack, puedes entrar a Grafana en:

```text
http://127.0.0.1:3000/
```

Usuario: `admin`

Contraseña: `admin`

## Conectar Grafana con Prometheus y Loki

1. En Grafana, ve a `Connections` > `Add new Connection` > selecciona `Prometheus` o `Loki`.
2. Haz clic en `Add new data source`.

- Para Prometheus, usa la URL de conexión:

```text
http://prometheus:9090
```

- Para Loki, usa la URL de conexión:

```text
http://loki:3100
```

## Instalar Django Prometheus

Instala la librería en el proyecto:

```bash
uv add django-prometheus
```

También puedes ver la página oficial:

https://pypi.org/project/django-prometheus/

## Configuración en Django

### `settings.py`

Agrega `django_prometheus` a `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    ...
    'django_prometheus',
    ...
]
```

Configura los middlewares de Prometheus:

```python
MIDDLEWARE = [
    'django_prometheus.middleware.PrometheusBeforeMiddleware',
    # Aquí van tus middlewares normales:
    # SessionMiddleware, CommonMiddleware, CsrfViewMiddleware,
    # SecurityMiddleware, etc.
    'django_prometheus.middleware.PrometheusAfterMiddleware',
]
```

### `urls.py`

Agrega las URLs de Prometheus al proyecto:

```python
urlpatterns = [
    ...
    path('', include('django_prometheus.urls')),
]
```

## Métricas de latencia

Define los buckets para el histograma de latencia de respuestas HTTP en segundos. Estos valores se usan para calcular percentiles como P95 o P99.

```python
PROMETHEUS_LATENCY_BUCKETS = (
    0.01,   # 10 ms
    0.025,  # 25 ms
    0.05,   # 50 ms
    0.075,  # 75 ms
    0.1,    # 100 ms
    0.25,   # 250 ms
    0.5,    # 500 ms
    0.75,   # 750 ms
    1.0,    # 1 segundo
    2.5,
    5.0,
    7.5,
    10.0,
    25.0,
    50.0,
    75.0,
    float('inf'),
)
```

## Ajustes automáticos en `settings.py`

Si quieres asegurar que Prometheus quede agregado sin duplicados, puedes usar estas comprobaciones:

```python
if 'django_prometheus' not in INSTALLED_APPS:
    INSTALLED_APPS += ['django_prometheus']

if 'django_prometheus.middleware.PrometheusBeforeMiddleware' not in MIDDLEWARE:
    MIDDLEWARE.insert(0, 'django_prometheus.middleware.PrometheusBeforeMiddleware')

if 'django_prometheus.middleware.PrometheusAfterMiddleware' not in MIDDLEWARE:
    MIDDLEWARE.append('django_prometheus.middleware.PrometheusAfterMiddleware')
```

## Monitorear la base de datos

SQLite, MySQL y PostgreSQL pueden ser monitoreados. Solo cambia la propiedad `ENGINE` de tu base de datos reemplazando `django.db.backends` por `django_prometheus.db.backends`.

Ejemplo para PostgreSQL:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django_prometheus.db.backends.postgresql',
        'NAME': 'tu_db_name',
        'USER': 'tu_usuario',
        # ... resto de tus credenciales
    }
}
```

## Monitorear modelos

Para instrumentar operaciones a nivel de modelo, agrega `ExportModelOperationsMixin`:

```python
from django_prometheus.models import ExportModelOperationsMixin

class Dog(ExportModelOperationsMixin('dog'), models.Model):
    name = models.CharField(max_length=100, unique=True)
    breed = models.CharField(max_length=100, blank=True, null=True)
    age = models.PositiveIntegerField(blank=True, null=True)
```

## Recursos

Guía oficial sobre buenas prácticas de instrumentación:

https://prometheus.io/docs/practices/instrumentation/

## Nota final

Después de hacer cambios en los modelos o agregar `django_prometheus`, reconstruye la API para que los cambios se apliquen correctamente.

```shell
docker compose up --build --force-recreate
```