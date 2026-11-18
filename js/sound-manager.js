const SOUND_EVENTS = {
    race: { enabledId: "soundEnabledRace", selectId: "soundSelectRace", sounds: "jumps", defaultFile: "poi1.mp3" },
    fatigue: { enabledId: "soundEnabledFatigue", selectId: "soundSelectFatigue", sounds: "jumps", defaultFile: "poi2.mp3" },
    random: { enabledId: "soundEnabledRandom", selectId: "soundSelectRandom", sounds: "jumps", defaultFile: "poi3.mp3" },
    victory: { enabledId: "soundEnabledVictory", selectId: "soundSelectVictory", sounds: "victory", defaultFile: "LevelUp.mp3" },
};

const SOUND_CATALOG = {
    jumps: [
        { name: "poi1.mp3", url: "sfx/jumps/poi1.mp3" },
        { name: "poi2.mp3", url: "sfx/jumps/poi2.mp3" },
        { name: "poi3.mp3", url: "sfx/jumps/poi3.mp3" },
    ],
    skills: [
        { name: "Acolyte_Blessing.mp3", url: "sfx/skills/Acolyte_Blessing.mp3" },
        { name: "Acolyte_Heal.wav", url: "sfx/skills/Acolyte_Heal.wav" },
        { name: "BragisPoem.mp3", url: "sfx/skills/BragisPoem.mp3" },
        { name: "Priest_Aspersio.mp3", url: "sfx/skills/Priest_Aspersio.mp3" },
        { name: "Priest_Gloria.wav", url: "sfx/skills/Priest_Gloria.wav" },
        { name: "Priest_MagnificatWithCast.mp3", url: "sfx/skills/Priest_MagnificatWithCast.mp3" },
        { name: "Priest_Suffragium.mp3", url: "sfx/skills/Priest_Suffragium.mp3" },
    ],
    victory: [
        { name: "LevelUp.mp3", url: "sfx/LevelUp.mp3" },
    ],
};

const BACKGROUND_SOUNDS = [
    ...SOUND_CATALOG.jumps,
    ...SOUND_CATALOG.skills,
    ...SOUND_CATALOG.victory,
];

export class SoundManager {
    constructor() {
        this.audioCache = new Map();
        this.failedSounds = new Set();
        this.musicAudio = null;
        this.musicSource = null;
    }

    load() {
        Object.values(SOUND_EVENTS).forEach(event => {
            const select = document.getElementById(event.selectId);
            const sounds = SOUND_CATALOG[event.sounds];
            select.replaceChildren(new Option("Sin sonido", ""));

            sounds.forEach(sound => {
                select.add(new Option(sound.name, sound.url));
            });

            const defaultSound = sounds.find(sound => sound.name === event.defaultFile);
            select.value = defaultSound ? defaultSound.url : "";
        });

        const musicSelect = document.getElementById("raceMusic");
        musicSelect.replaceChildren(new Option("Sin música", ""));
        BACKGROUND_SOUNDS.forEach(sound => {
            musicSelect.add(new Option(sound.name, sound.url));
        });
        musicSelect.value = SOUND_CATALOG.skills.find(sound => sound.name === "BragisPoem.mp3").url;

        const skillList = document.getElementById("skillSoundList");
        SOUND_CATALOG.skills.forEach(sound => {
            const item = document.createElement("li");
            item.textContent = sound.name;
            skillList.append(item);
        });
    }

    play(eventName) {
        const event = SOUND_EVENTS[eventName];
        if (!event || !document.getElementById(event.enabledId).checked)
            return;

        const source = document.getElementById(event.selectId).value;
        if (source)
            this.playSource(source);
    }

    playRandomSkill() {
        if (!document.getElementById("soundEnabledSkills").checked)
            return;

        const sounds = SOUND_CATALOG.skills;
        const sound = sounds[Math.floor(Math.random() * sounds.length)];
        if (this.isMusicPlaying(sound.url))
            return;

        const audio = this.getAudio(sound.url);
        if (!audio || !audio.paused && !audio.ended)
            return;

        this.startAudio(audio, sound.name, sound.url);
    }

    playMusic(source) {
        this.stopMusic();
        if (!source || this.failedSounds.has(source))
            return;

        const audio = new Audio(source);
        audio.loop = true;
        this.musicAudio = audio;
        this.musicSource = source;
        audio.play().catch(error => {
            this.failedSounds.add(source);
            if (this.musicAudio === audio) {
                this.musicAudio = null;
                this.musicSource = null;
            }
            this.showError("No se pudo reproducir la música " + source.split("/").pop() + ".");
            console.error("No se pudo reproducir la música de la carrera", error);
        });
    }

    stopMusic() {
        if (!this.musicAudio)
            return;

        this.musicAudio.pause();
        this.musicAudio = null;
        this.musicSource = null;
    }

    playSource(source) {
        if (this.isMusicPlaying(source))
            return;

        const audio = this.getAudio(source);
        if (audio && (audio.paused || audio.ended))
            this.startAudio(audio, source, source);
    }

    isMusicPlaying(source) {
        return this.musicSource === source && this.musicAudio && !this.musicAudio.paused;
    }

    getAudio(source) {
        if (this.failedSounds.has(source))
            return null;

        let audio = this.audioCache.get(source);
        if (!audio) {
            audio = new Audio(source);
            this.audioCache.set(source, audio);
        }
        return audio;
    }

    startAudio(audio, soundName, source, onFailure) {
        audio.play().catch(error => {
            this.failedSounds.add(source);
            if (onFailure)
                onFailure();
            this.showError("No se pudo reproducir " + soundName + ".");
            console.error("No se pudo reproducir el efecto de sonido", error);
        });
    }

    showError(message) {
        const errorElement = document.getElementById("soundLoadError");
        errorElement.textContent = message;
        errorElement.hidden = false;
        document.getElementById("soundSettings").open = true;
    }
}
