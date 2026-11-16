# Plan de activación

1. Fusionar [delivery-workflow #38](https://github.com/venturars/delivery-workflow/pull/38) en su rama predeterminada `staging` con **merge commit**, para conservar el SHA completo fijado por aTempo.
2. Fusionar [aTempo #73](https://github.com/venturars/aTempo/pull/73) en su rama predeterminada `main`. Ese único merge instala el workflow que escucha PR hacia `staging` y comentarios `/discord-map`.
3. Probar una PR lista para revisión con dos revisores en cada repositorio. Verificar el aviso en `#git`, una asociación opcional y la repetición sin duplicado.

La etiqueta de una versión del paquete se puede publicar después desde `main`. El aviso de aTempo invoca el commit fijado y no depende de APM ni de esa etiqueta.
