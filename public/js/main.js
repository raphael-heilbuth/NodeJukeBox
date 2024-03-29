let audio = document.getElementById("myVideo"),
    credito = $('.qtd_credito'),
    listaMusicas,
    listaProximasMusicas = [],
    coverflow,
    alfabeto = [],
    letraAnt = '',
    timeVideo,
    timePesquisaYoutube,
    firstIndex,
    lastIndex,
    currentArtista,
    timeRandom,
    socket = io(),
    modoLivre = false,
    totalCredito = 0,
    tempoRandom = 240000,
    valorCredito = 0,
    iniciandoMusica = false;

toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": true,
    "progressBar": false,
    "positionClass": "toast-top-center",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "1000",
    "hideDuration": "1000",
    "timeOut": "1000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut",
    "target": ".line-cover-flow"
};

$.fn.countAnimation = function (valor) {
    animationCount($(this), valor);
}

jQuery(function () {
    "use strict";

    iniciaJukeBox();

    audio.volume = 0.1;

    socket.on('volume', function (volume) {
        audio.volume = volume;
        AbreToastInfo('Volume', Math.round(audio.volume * 10));
    });

    socket.on('volumeMais', function () {
        MaisVolume();
    });

    socket.on('volumeMenos', function () {
        MenosVolume();
    });

    socket.on('mute', function () {
        audio.volume = 0.0;
        AbreToastInfo('Volume', '', 'fas fa-volume-mute');
    });

    socket.on('pause',function (){
        audio.pause();
        AbreToastInfo('Música', '', 'fas fa-pause');
    });

    socket.on('resume',function (){
        audio.play();
        AbreToastInfo('Música', '', 'fas fa-play');
    });

    socket.on('credito', function (qtd) {
        totalCredito += qtd;
        credito.text(totalCredito);

        if (totalCredito > 0) {
            credito.removeClass('blink_me');
        }

        AbreToastInfo('Crédito', qtd);
    });

    socket.on('musica', function (value) {
        executaMusica(value["Artista"], value["Titulo"], value["Musica"], value["Duracao"], value["Tipo"]);
        AbreToastInfo('Música', '', 'fas fa-plus');
    });

    socket.on('proxima', function() {
        Next();
    });

    $(document).on('click', '.flipster__item--current', function () {
        if (!$(this).find('.back').is(':visible')) {
            let listaMusicaArtista = $(this).find('.back').find('ul'),
                artista = $(this).attr('data-flip-title');

            $(this).find('.front').addClass('d-none').end().find('.back').removeClass('d-none');

            listaMusicaArtista.empty();

            listaMusicas.find(x => x.name === artista).Musicas.map(y => {
                listaMusicaArtista.append(RetornaMusica(artista, y.title, {
                    titulo: y.Musica,
                    duracao: (y.Meta !== null ? y.Meta.duration : null),
                    tipo: y.Tipo,
                    popularidadeArtista: y.popularidadeArtista,
                    popularidadeGloba: y.popularidadeGloba
                }));
            });

            listaMusicaArtista.trigger('focus');

            firstIndex = listaMusicaArtista.find('.item-musica').first().index();
            lastIndex = listaMusicaArtista.find('.item-musica').last().index();

            currentArtista = listaMusicaArtista;
        }
    });

    $(document).on('keydown', '#pesquisa-youtube', function (event) {
        if (event.altKey === false) {
            clearTimeout(timePesquisaYoutube);

            timeYoutube($(this).val());
        }
    });

    $(document).on('click', '.item-musica', function () {
        selecionaMusica($(this));
    });

    document.addEventListener("keydown", (event) => {
        if (event.altKey === true) {
            switch (event.key) {
                case "g":
                    //Todo: Agrupar lista
                    break;
                case "i":
                    iniciaJukeBox(true);
                    break;
                case "n":
                    Next();
                    break;
                case "p":
                    Pause();
                    break;
                case "r":
                    ListaMusicasBanco(true);
                    break;
                case ",":
                    MenosVolume();
                    break;
                case ".":
                    MaisVolume();
                    break;
                case "ArrowUp":
                    ArrowUp();
                    break;
                case "ArrowDown":
                    ArrowDown();
                    break;
                case "ArrowRight":
                    ArrowRight();
                    break;
                case "ArrowLeft":
                    ArrowLeft();
                    break;
                case "Enter":
                    Enter();
                    break;
            }
        }
    });

    audio.addEventListener('timeupdate', () => {
        $('#music-bar').width(((audio.currentTime * 100) / audio.duration) + '%');
        $('#music-time').html(display(audio.currentTime) + '/' + display(audio.duration));
    });

    audio.addEventListener('ended', () => {
        $('#music-info').addClass('d-none');
        $('#no-music-info').removeClass('d-none');
        let imageCapa = '../public/image/default/NodeJukebox.png';
        $('.background-image').css('background-image', 'url(' + imageCapa + ')');

        audio.classList.add("d-none");

        ExecutaProxima();

        clearInterval(timeRandom);
        timeRandomInit();
    });

    audio.onerror = function () {
        iniciandoMusica = false;
        audio.src = '';
        audio.removeAttribute('src');
        audio.dispatchEvent(new Event("ended", {"bubbles": true}));
    }
});
