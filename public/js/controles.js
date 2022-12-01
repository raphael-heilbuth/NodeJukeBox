function Pause() {
    audio.paused ? AbreToastInfo('Música', '', 'fas fa-play') : AbreToastInfo('Música', '', 'fas fa-pause');
    audio.paused ? audio.play() : audio.pause();
}

function Next() {
    audio.currentTime = audio.duration;
    AbreToastInfo('Música', '', 'fas fa-forward');
}

function MaisVolume() {
    if (audio.volume < 0.9) {
        audio.volume += 0.1;
    }
    AbreToastInfo('Volume', Math.round(audio.volume * 10));
}

function MenosVolume() {
    if (audio.volume >= 0.1) {
        audio.volume -= 0.1;
    }
    AbreToastInfo('Volume', Math.round(audio.volume * 10));
}

function ArrowUp() {
    if ($('.flipster__item--current').find('.front').is(':visible')) {
        ProximaLetra(letraAnt);
    } else {
        CaminhaMusicas('up');
    }

    audio.classList.add("Utilizando");

    clearTimeout(timeVideo);

    invocation();
}

function ArrowDown() {
    if ($('.flipster__item--current').find('.front').is(':visible')) {
        LetraAnterior(letraAnt);
    } else {
        CaminhaMusicas('down');
    }
    audio.classList.add("Utilizando");

    clearTimeout(timeVideo);

    invocation();
}

function ArrowRight() {
    coverflow.flipster('next');
    audio.classList.add("Utilizando");

    clearTimeout(timeVideo);

    invocation();
}

function ArrowLeft() {
    coverflow.flipster('prev');
    audio.classList.add("Utilizando");

    clearTimeout(timeVideo);

    invocation();
}

function Enter() {
    let flipCurrent = $('.flipster__item--current');

    if (flipCurrent.find('.front').is(':visible')) {
        flipCurrent.trigger('click');
    } else {
        if (currentArtista.find('.item-musica.active').length > 0) {
            selecionaMusica(currentArtista.find('.item-musica.active'));
        } else {
            let tooltips = body.tooltip({
                title: 'Nenhuma musica selecionada.',
                template: '<div class="tooltip tooltip-sem-musica" role="tooltip"><div class="tooltip-inner"></div></div>'
            }).tooltip('show');

            setTimeout(function () {
                tooltips.tooltip('dispose');
            }, 1000);
        }
    }

    audio.classList.add("Utilizando");

    clearTimeout(timeVideo);

    invocation();
}
