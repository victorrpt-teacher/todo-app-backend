```bash
docker compose up --build
```

> Nota: si la API se ejecuta dentro de Docker con el servicio `api`, asegúrate de incluir `api` en `ALLOWED_HOSTS` y de usar `http://api:8000` en las configuraciones internas cuando sea necesario.

## Crear un superusuario dentro de Docker

Si borraste la base de datos, creaste una nueva, o no recuerdas la contraseña anterior, sigue estos pasos:

1. Identifica el contenedor en ejecución:

```bash
docker ps
```

2. Entra al contenedor del servicio `api`:

```bash
docker exec -it <id_del_contenedor> bash
```

3. Ejecuta el comando de Django para crear el superusuario:

```bash
python manage.py createsuperuser
```

Sigue las preguntas que aparecen y crea el nuevo usuario administrador.
