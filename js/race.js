import { SoundManager } from "./sound-manager.js";

const SCENE_WIDTH = 2048;
const PLAYER_FRAME_WIDTH = 200;
const PLAYER_FRAME_COUNT = 6;
const RACE_CC_VALUES = [50, 87.5, 125, 162.5, 200];

class PoringRace {
    constructor() {
        this.scroll = 0;
        this.players = [];
        this.playerNames = [];
        this.winner = -1;
        this.length = 0;
        this.timer = null;
        this.startTimer = null;
        this.finishTimer = null;
        this.nextRandomSoundAt = 0;
        this.nextSkillSoundAt = 0;
        this.modal = new bootstrap.Modal(document.getElementById("myModal"), {
            backdrop: "static",
            keyboard: false,
        });
        this.soundManager = new SoundManager();

        this.bindControls();
        this.soundManager.load();
        this.updateOptionLabels();
        this.modal.show();
    }

    bindControls() {
        $("#startRace, #repeatRace").on("click", () => this.start());
        $("#shuffleParticipants").on("click", () => this.shufflePlayers());
        $("#openOptions").on("click", () => this.showRaceOptions());
        $("#backToSetup").on("click", () => this.showRaceSetup());
        $("#editRace").on("click", () => this.showRaceSetup());
        $("#skillFrequency, #raceLength").on("input", () => this.updateOptionLabels());
    }

    showRaceSetup() {
        $("#raceSetup, #setupActions").prop("hidden", false);
        $("#raceOptions, #optionsActions, #raceResult, #resultActions").prop("hidden", true);
        $("#setupError").prop("hidden", true).text("");
    }

    showRaceOptions() {
        $("#raceSetup, #setupActions, #raceResult, #resultActions").prop("hidden", true);
        $("#raceOptions, #optionsActions").prop("hidden", false);
    }

    updateOptionLabels() {
        const frequency = Number($("#skillFrequency").val());
        const raceLength = Number($("#raceLength").val());
        $("#skillFrequencyValue").text(frequency + " / 10");
        $("#raceLengthValue").text(String(RACE_CC_VALUES[raceLength]).replace(".", ",") + " cc");
    }

    start() {
        const playerNames = $("#names").val()
            .split(/\r?\n/)
            .map(name => name.trim())
            .filter(Boolean);
        const lengthValue = $("#raceLength").val();
        const length = Number(lengthValue);

        if (playerNames.length === 0) {
            this.showSetupError("Agregá al menos un participante para iniciar la carrera.");
            return;
        }
        if (lengthValue === "" || !Number.isInteger(length) || length < 0 || length >= RACE_CC_VALUES.length) {
            this.showSetupError("Elegí uno de los cinco largos disponibles para la carrera.");
            return;
        }

        this.clearTimers();
        this.playerNames = playerNames;
        this.players = [];
        this.winner = -1;
        this.scroll = 0;
        this.length = length;
        this.showRaceSetup();
        this.buildCourse();

        playerNames.forEach(name => this.addPlayer(name));
        this.addProps();
        this.soundManager.playMusic($("#raceMusic").val());
        this.startRace();
        this.modal.hide();
    }

    showSetupError(message) {
        $("#setupError").text(message).prop("hidden", false);
    }

    buildCourse() {
        const wallCount = Math.floor(this.length / 2);
        const openCount = this.length - wallCount;
        const scenes = ["BG01_01_01.png"];

        for (let i = 0; i < wallCount; i++)
            scenes.push("BG01_02_01.png");
        scenes.push("BG01_03_01.png");
        for (let i = 0; i < openCount; i++)
            scenes.push("BG01_04_01.png");
        scenes.push("BG_finish.png", "BG01_02_01.png");

        const game = $("#game").empty();
        scenes.forEach((image, index) => {
            game.append($("<div></div>", { class: "bg" }).css({
                backgroundImage: "url('" + image + "')",
                left: index * SCENE_WIDTH + "px",
            }));
        });
        game.append('<div id="props"></div><div id="players"></div>');
    }

    addPlayer(name) {
        const playerIndex = this.players.length;
        const y = parseInt(250 + playerIndex * (600 / this.playerNames.length), 10);
        const sprite = Math.floor(Math.random() * 102);
        this.players.push({
            position: 400,
            frame: 0,
            speed: 2,
            stamina: 10,
            name: name,
            swtTimer: null,
        });

        const player = $("<div></div>", { class: "player" }).css({
            zIndex: y,
            top: y + "px",
            left: "400px",
            backgroundImage: "url('art/" + sprite + ".png')",
            backgroundPosition: "0 0",
        });
        player.append($("<img>", { src: "swt.gif", class: "fatigue-indicator", alt: "" }));
        player.append(document.createTextNode(name));
        $("#players").append(player);
    }

    addProps() {
        const wallCount = Math.floor(this.length / 2);
        const allSprites = Array.from({ length: 100 }, (_, index) => index + 1);
        const count = 10 * wallCount + 6;
        const step = (wallCount * SCENE_WIDTH + 1000) / count;
        const props = $("#props");

        for (let i = 0; i < count; i++) {
            if (i % allSprites.length === 0)
                this.shuffle(allSprites);

            const x = 1800 + i * step + 0.5 * step * Math.random() - 0.25 * step;
            const y = parseInt(50 + 125 * Math.random(), 10);
            props.append($("<img>", {
                src: "players/" + allSprites[i % allSprites.length] + ".png",
            }).css({
                zIndex: y,
                height: "200px",
                width: "auto",
                position: "absolute",
                top: y + "px",
                left: x + "px",
            }));
        }
    }

    startRace() {
        this.startTimer = window.setTimeout(() => {
            this.soundManager.play("race");
            const now = Date.now();
            this.nextRandomSoundAt = now + 1500;
            this.nextSkillSoundAt = now + this.getSkillInterval();
            this.timer = window.setInterval(() => this.updateRace(), 1000 / 60);
        }, 1000);
    }

    getSkillInterval() {
        const frequency = Number($("#skillFrequency").val());
        const averageInterval = 20000 - (frequency - 1) * (16000 / 9);
        return averageInterval * (0.8 + Math.random() * 0.4);
    }

    updateRace() {
        if (this.winner === -1) {
            const now = Date.now();
            if (now >= this.nextRandomSoundAt) {
                this.soundManager.play("random");
                this.nextRandomSoundAt = now + 2000 + Math.random() * 2000;
            }
            if (now >= this.nextSkillSoundAt) {
                this.soundManager.playRandomSkill();
                this.nextSkillSoundAt = now + this.getSkillInterval();
            }
        }

        const divs = $("#game").children(".bg");
        const oldScroll = this.scroll;
        let frontPosition = 0;
        this.players.forEach(player => {
            frontPosition = Math.max(frontPosition, player.position);
        });

        this.players.forEach((player, index) => {
            if (this.winner !== -1) {
                if (this.winner === index) {
                    player.position += player.speed;
                    player.speed = Math.max(0, player.speed - 0.01);
                    this.advanceFrame(player);
                }
                return;
            }

            player.position += player.speed;
            if (player.speed > 2)
                player.stamina -= Math.pow(0.01 * (player.speed - 2), 0.8);
            else
                player.stamina += Math.pow(2 - player.speed, 1.2);

            if (player.stamina < 20)
                player.stamina += (frontPosition - player.position) * 0.00005;

            if (player.stamina < 1) {
                player.speed *= 0.9;
                if (player.swtTimer === null) {
                    this.soundManager.play("fatigue");
                    const indicator = $(".player").eq(index).find(".fatigue-indicator");
                    player.swtTimer = window.setTimeout(() => {
                        indicator.css("display", "none");
                        player.swtTimer = null;
                    }, 1000);
                    indicator.css("display", "inline");
                }
            }

            if (player.speed < 0)
                player.speed = 0;
            if (player.stamina > 5 && Math.random() > 0.95)
                player.speed += 0.1;
            this.advanceFrame(player);

            if (player.position > 5308 + SCENE_WIDTH * this.length) {
                player.speed = 3;
                this.winner = index;
                this.soundManager.stopMusic();
                this.soundManager.play("victory");
                this.finishTimer = window.setTimeout(() => this.finishRace(), 5000);
            }
        });

        this.scroll = Math.max(...this.players.map(player => player.position)) - 400;
        this.scroll = 0.01 * this.scroll + 0.99 * oldScroll;

        $(".player").each((index, element) => {
            const player = this.players[index];
            $(element).css("left", player.position - parseInt(this.scroll, 10) + "px");
            $(element).css("background-position", -PLAYER_FRAME_WIDTH * Math.floor(player.frame) + "px 0px");
        });

        divs.each((index, element) => {
            $(element).css("left", index * SCENE_WIDTH - parseInt(this.scroll, 10) + "px");
        });
        $("#game").css("background-position", -parseInt(this.scroll, 10) * 0.5 + "px 0px");
        $("#props").css("left", -parseInt(this.scroll, 10) + "px");
    }

    advanceFrame(player) {
        player.frame = (player.frame + player.speed * 0.1) % PLAYER_FRAME_COUNT;
    }

    finishRace() {
        window.clearInterval(this.timer);
        this.timer = null;

        if ($("#removewinner").is(":checked")) {
            this.playerNames.splice(this.winner, 1);
            $("#names").val(this.playerNames.join("\n"));
        }

        $("#winner").text(this.players[this.winner].name + " ganó la carrera.");
        $("#repeatRace").prop("disabled", this.playerNames.length === 0);
        $("#raceSetup, #raceOptions, #setupActions, #optionsActions").prop("hidden", true);
        $("#raceResult, #resultActions").prop("hidden", false);
        this.modal.show();
    }

    clearTimers() {
        if (this.timer !== null)
            window.clearInterval(this.timer);
        if (this.startTimer !== null)
            window.clearTimeout(this.startTimer);
        if (this.finishTimer !== null)
            window.clearTimeout(this.finishTimer);
        this.timer = null;
        this.startTimer = null;
        this.finishTimer = null;
    }

    shuffle(array) {
        let currentIndex = array.length;
        while (currentIndex !== 0) {
            const randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    shufflePlayers() {
        const playerNames = $("#names").val()
            .split(/\r?\n/)
            .map(name => name.trim())
            .filter(Boolean);
        $("#names").val(this.shuffle(playerNames).join("\n"));
    }
}

$(() => new PoringRace());
