# Poring Race

Minijuego de carreras para elegir un ganador entre participantes.

## Sonidos

Los sonidos se cargan desde los archivos locales de `sfx/`; el juego no necesita consultar GitHub. Las opciones de salida, fatiga, efecto aleatorio y victoria se configuran en el modal y pueden desactivarse individualmente.

Las skills de `sfx/skills/` se eligen al azar y no están vinculadas a un participante. Cada sonido usa una instancia compartida; `BragisPoem` no se reinicia mientras sigue reproduciéndose, evitando que se superpongan varias reproducciones de esa skill.

Desde **Opciones** se puede ajustar la frecuencia de skills en 10 niveles, elegir un sonido de fondo (por defecto `BragisPoem.mp3`) y elegir el largo de la pista en 5 posiciones, de 50 cc a 200 cc. El sonido de fondo se repite durante la carrera y se detiene al declararse el ganador.

Para agregar o quitar sonidos, actualizá el catálogo local de `js/sound-manager.js` junto con los archivos de `sfx/`.

## Estructura

- `index.html`: estructura de la página y controles del modal.
- `styles.css`: presentación y layout.
- `js/race.js`: configuración, pista, animación y resultado de la carrera.
- `js/sound-manager.js`: catálogo local, asignaciones y reproducción de sonidos.

