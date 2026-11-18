import { SoundManager } from "./sound-manager.js";

const SCENE_WIDTH = 2048;
const PLAYER_FRAME_WIDTH = 200;
const PLAYER_FRAME_COUNT = 6;

class PoringRace {
    constructor() {
        this.scroll = 0;
        this.players = [];
        this.totalPlayerCount = 0;
        this.winner = -1;
        this.length = 0;
        this.timer = null;
        this.modal = new bootstrap.Modal(document.getElementById("myModal"), {
            backdrop: "static",
            keyboard: false,
        });
        this.soundManager = new SoundManager();

        this.buildPoringCatalog();
        this.bindControls();
        this.soundManager.load();
        this.modal.show();
    }

    bindControls() {
        $("#startRace, #repeatRace").on("click", () => this.start());
        $("#shuffleParticipants").on("click", () => this.shufflePlayers());
        $("#editRace").on("click", () => this.showRaceSetup());
    }

    buildPoringCatalog() {
        const gallery = $("#poringGallery");
        for (let i = 0; i < 102; i++) {
            const card = $("<div class='poring-card'></div>");
            const preview = $("<div class='poring-preview' aria-hidden='true'></div>");
            preview.css("background-image", "url('art/" + i + ".png')");
            card.append(preview);
            card.append($("<span></span>").text("Poring " + String(i).padStart(3, "0")));
            gallery.append(card);
        }
    }

    showRaceSetup() {
        $("#raceSetup, #setupActions").show();
        $("#raceResult, #resultActions").hide();
    }

    start() {
        const playerNames = $("#names").val().trim().split("\n");
        this.totalPlayerCount = playerNames.length;
        this.players = [];
        this.winner = -1;
        this.scroll = 0;
        this.length = parseInt($("#length").val(), 10);
        this.showRaceSetup();
        this.buildCourse();

        playerNames.forEach(name => this.addPlayer(name));
        this.addProps();
        this.startRace();
        this.modal.hide();
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
        const y = parseInt(250 + playerIndex * (600 / this.totalPlayerCount), 10);
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
        window.setTimeout(() => {
            this.timer = window.setInterval(() => this.updateRace(), 1000 / 60);
        }, 1000);
    }

    updateRace() {
        this.soundManager.play("race");
        if (Math.random() < 0.01)
            this.soundManager.play("random");

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
                this.soundManager.play("victory");
                player.speed = 3;
                this.winner = index;
                window.setTimeout(() => this.finishRace(), 5000);
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
        if ($("#removewinner").is(":checked")) {
            const playerNames = $("#names").val().trim().split("\n")
                .filter(name => name !== this.players[this.winner].name);
            $("#names").val(playerNames.join("\n"));
        }

        $("#winner").text(this.players[this.winner].name);
        $("#repeatRace").prop("disabled", !$("#names").val().trim());
        $("#raceSetup, #setupActions").hide();
        $("#raceResult, #resultActions").show();
        this.modal.show();
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
        const playerNames = $("#names").val().trim().split("\n");
        $("#names").val(this.shuffle(playerNames).join("\n"));
    }
}

$(function()
{
    new PoringRace();
});
