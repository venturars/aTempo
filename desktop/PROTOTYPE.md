# Panel del profesor — propuesta navegable

## Arrancar en el navegador

Desde `desktop/`:

```sh
pnpm install --frozen-lockfile
pnpm prototype
```

Abre la dirección Local que imprime Vite. Para probarlo en el teléfono, conecta ambos dispositivos a la misma Wi-Fi y abre la dirección Network. El puerto es 5177; Ctrl+C detiene el servidor.

Para abrir la aplicación en Electron:

```sh
pnpm dev
```

## Recorridos para revisar

- Hoy: abrir la lista, cambiar una asistencia, finalizar y volver a abrir.
- Clases: consultar una sesión y abrir la ficha de un alumno.
- Estadísticas: filtrar fechas, consultar el detalle y volver conservando el filtro. En móvil, desplegar cada alumno.
- Ajustes: cambiar el margen, activar notificaciones, probar el aviso y cambiar de tema.
- Justificantes: abrir el acceso global y consultar la ficha asociada.

Se utilizan datos de ejemplo y estado en memoria. Los documentos son vistas de muestra. La entrega del alumno, los avisos reales y SQLite requieren acordar su implementación.

Esta rama conserva como base el panel de Meghan (`31fa6ff`) y añade la exploración conjunta de Estadísticas, Ajustes y sus recorridos relacionados. Se presenta para acordar el diseño y el alcance antes de integrar.
