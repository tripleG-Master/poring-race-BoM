const SOUND_EVENTS = {
    race: { enabledId: "soundEnabledRace", selectId: "soundSelectRace", defaultFile: "poi1.mp3" },
    fatigue: { enabledId: "soundEnabledFatigue", selectId: "soundSelectFatigue", defaultFile: "poi2.mp3" },
    random: { enabledId: "soundEnabledRandom", selectId: "soundSelectRandom", defaultFile: "poi3.mp3" },
    victory: { enabledId: "soundEnabledVictory", selectId: "soundSelectVictory", defaultFile: "LevelUp.mp3" },
};

const SOUND_CATALOG_URL = "https://api.github.com/repos/Borf/poringrace/contents/sfx?ref=main";
const SOUND_BASE_URL = "https://raw.githubusercontent.com/Borf/poringrace/main/sfx/";
const SUPPORTED_AUDIO = /\.(mp3|ogg|wav|m4a|aac|opus|flac)$/i;

export class SoundManager {
    constructor() {
        this.audioCache = new Map();
        this.failedSounds = new Set();
    }

    async load() {
        try {
            const response = await fetch(SOUND_CATALOG_URL, {
                headers: { Accept: "application/vnd.github+json" },
            });
            if (!response.ok)
                throw new Error("GitHub respondió con el estado " + response.status + ".");

            const files = await response.json();
            if (!Array.isArray(files))
                throw new Error("La respuesta de GitHub no contiene una lista de archivos.");

            const sounds = files
                .filter(file => file.type === "file" && SUPPORTED_AUDIO.test(file.name))
                .map(file => ({
                    name: file.name,
                    url: SOUND_BASE_URL + encodeURIComponent(file.name),
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            if (sounds.length === 0)
                throw new Error("No se encontraron archivos de audio compatibles en sfx/.");

            this.populateSelectors(sounds);
        } catch (error) {
            this.showError("No se pudieron cargar los sonidos desde GitHub. " + error.message);
            console.error("No se pudo cargar el catálogo de sfx/", error);
        }
    }

    populateSelectors(sounds) {
        Object.values(SOUND_EVENTS).forEach(event => {
            const select = document.getElementById(event.selectId);
            select.replaceChildren(new Option("Selecciona un sonido", ""));

            sounds.forEach(sound => {
                select.add(new Option(sound.name, sound.url));
            });

            const defaultSound = sounds.find(sound => sound.name === event.defaultFile);
            select.value = defaultSound ? defaultSound.url : "";
        });
    }

    play(eventName) {
        const event = SOUND_EVENTS[eventName];
        if (!event || !document.getElementById(event.enabledId).checked)
            return;

        const select = document.getElementById(event.selectId);
        const source = select.value;
        if (!source || this.failedSounds.has(source))
            return;

        let audio = this.audioCache.get(source);
        if (!audio) {
            audio = new Audio(source);
            this.audioCache.set(source, audio);
        }

        if (audio.paused || audio.ended) {
            audio.play().catch(error => {
                this.failedSounds.add(source);
                this.showError("No se pudo reproducir " + select.selectedOptions[0].text + ".");
                console.error("No se pudo reproducir el efecto de sonido", error);
            });
        }
    }

    showError(message) {
        const errorElement = document.getElementById("soundLoadError");
        errorElement.textContent = message;
        errorElement.hidden = false;
    }
}
