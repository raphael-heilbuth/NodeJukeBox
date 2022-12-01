let body = $('body'),
    audio = document.getElementById("myVideo"),
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

body.loading({
    stoppable: false,
    onStop: function(loading) {
        loading.overlay.slideUp(400);
    },
    overlay: $(".loading"),
    start: true
});

$.fn.countAnimation = function (valor) {
    animationCount($(this), valor);
}

jQuery(function () {
    "use strict";

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
        executaMusica(value["Artista"], value["Titulo"], value["Musica"], value["Duracao"], value["Tipo"], {});
        AbreToastInfo('Música', '', 'fas fa-plus');
    });

    socket.on('proxima', function() {
        Next();
    });

    let textLoading = $(".text-loading");
    textLoading.html("Lendo Musicas...");

    $.get('/getNewMusicas', function (newMusicas) {
        if (newMusicas["ListaMusica"].length > 0) {
            textLoading.html("Adicionado " + newMusicas["TotalMusicas"] + " novas músicas de " + newMusicas["TotalArtistas"] + " artistas");
            $.get('/addMusicasBanco', { novas: newMusicas["ListaMusica"]}, function () {
                ListaMusicasBanco();
            })
        } else {
            ListaMusicasBanco();
        }
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
                    Meta: (y.Meta !== null ? y.Meta.duration : null),
                    Tipo: y.Tipo
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

    document.addEventListener("keydown", (event) => {
        if (event.altKey === true && event.key === "p") Pause();
        if (event.altKey === true && event.key === "n") Next();
        if (event.altKey === true && event.key === ".") MaisVolume();
        if (event.altKey === true && event.key === ",") MenosVolume();
        if (event.altKey === true && event.key === 'ArrowUp') ArrowUp();
        if (event.altKey === true && event.key === 'ArrowDown') ArrowDown();
        if (event.altKey === true && event.key === 'ArrowRight') ArrowRight();
        if (event.altKey === true && event.key === 'ArrowLeft') ArrowLeft();
        if (event.altKey === true && event.key === 'Enter') Enter();
    });
});
