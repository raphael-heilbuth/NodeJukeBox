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
    valorCredito = 0;

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

$('body').loading({
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

function ListaMusicasBanco() {
    $.get("/getList", function (data) {
        $(".text-loading").html("Carregando Musicas...")
        listaMusicas = data["ListaMusica"];
        let parametros = data["Parametros"];

        modoLivre = parametros['modo'] === 'Livre';
        tempoRandom = parametros['timeRandom'];
        valorCredito = parametros['valorCredito'];

        if (modoLivre) {
            $('.jukebox-modo').removeClass('d-none');
        } else {
            $('.div-creditos').removeClass('d-none');
        }

        $('#total-musica').html(data["TotalMusicas"]).countAnimation(data["TotalMusicas"]);
        $('#tocadas').html(data["MusicasTocas"]).countAnimation(data["MusicasTocas"]);
        $('#total-album').html(data["TotalAlbum"]).countAnimation(data["TotalAlbum"]);

        let list = $('.flip-items');

        alfabeto = listaMusicas.map(x => {
            switch (x.name) {
                case 'Youtube':
                case 'TOP':
                case 'Random':
                    list.append(RetornaCapa(x.name, null, x.Musicas.length, false));
                    break;
                default:
                    list.append(RetornaCapa(x.name, 0, x.Musicas.length, true, x.formatos));
                    break;
            }

            return x.name.substr(0, 1)
        }).filter(function (itm, i, a) {
            return i === a.indexOf(itm);
        });

        coverflow = $("#coverflow").flipster({
            style: 'carousel',
            spacing: -0.15,
            buttons: true,
            loop: true,
            fadeIn: 0,
            start: 0,
            keyboard: false,
            scrollwheel: false,
            buttonPrev: 'Anterior',
            buttonNext: 'Próxima',
            onItemSwitch: function (currentItem, previousItem) {
                $(previousItem).find('.front').removeClass('d-none').end().find('.back').addClass('d-none');

                let letra = $(currentItem).attr('data-flip-title').substr(0, 1);
                if (letraAnt !== letra) {
                    letraAnt = letra;
                    toastr.error('',letraAnt, {iconClass:"toast-custom"});
                }
            }
        });

        $('body').loading('stop');

        timeRandomInit();
    });
}

function CaminhaMusicas(tecla) {
    let index = currentArtista.find('.active').index();

    index = (tecla === 'up' ? (index === firstIndex ? lastIndex : index - 1) : (index === lastIndex ? 0 : index + 1));

    currentArtista.find('.active').removeClass('active');
    let itemAtual = currentArtista.find('.list-group-item:eq( ' + index + ' )').addClass('active');
    itemAtual.find('.titulo-musica').addClass('active');

    if (itemAtual.find('#pesquisa-youtube').length > 0) {
        itemAtual.find('#pesquisa-youtube').trigger('focus');
    }

    itemAtual.get(0).scrollIntoView({
        behavior: "smooth", // or "auto" or "instant"
        block: (tecla === 'up' ? "start" : "end") // or "start" or "end"
    });
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
        executaMusica(null, value["Artista"], value["Titulo"], value["Musica"], value["Duracao"], null, null, value["Tipo"]);
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
                listaMusicaArtista.append(RetornaMusica(artista, y.title, y.Musica, (y.Meta !== null ? y.Meta.duration : null), null, null, null, 0, 0, y.Tipo));
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
        if (event.altKey === true && event.key === 'ArrowUp') {
            if ($('.flipster__item--current').find('.front').is(':visible')) {
                ProximaLetra(letraAnt);
            } else {
                CaminhaMusicas('up');
            }

            audio.classList.add("Utilizando");

            clearTimeout(timeVideo);

            invocation();
        }
        if (event.altKey === true && event.key === 'ArrowDown') {
            if ($('.flipster__item--current').find('.front').is(':visible')) {
                LetraAnterior(letraAnt);
            } else {
                CaminhaMusicas('down');
            }
            audio.classList.add("Utilizando");

            clearTimeout(timeVideo);

            invocation();
        }
        if (event.altKey === true && event.key === 'ArrowRight') {
            coverflow.flipster('next');
            audio.classList.add("Utilizando");

            clearTimeout(timeVideo);

            invocation();
        }
        if (event.altKey === true && event.key === 'ArrowLeft') {
            coverflow.flipster('prev');
            audio.classList.add("Utilizando");

            clearTimeout(timeVideo);

            invocation();
        }
        if (event.altKey === true && event.key === 'Enter') {
            let flipCurrent = $('.flipster__item--current');

            if (flipCurrent.find('.front').is(':visible')) {
                flipCurrent.trigger('click');
            } else {
                if (currentArtista.find('.item-musica.active').length > 0) {
                    selecionaMusica(currentArtista.find('.item-musica.active'));
                } else {
                    let tooltips = $('body').tooltip({
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
    });
});

function AbreToastInfo(titulo, valor = '', icon = '') {
    let tooltips = $('#info').tooltip({
        title: titulo + '<div class="msg-info">' +(icon !== '' ? '<i class="'+icon+'"></i>': valor) + '</div>',
        container: '#info',
        html: true,
        template: '<div class="tooltip tooltip-letra" role="tooltip"><div class="tooltip-inner tooltip-inner-info"></div></div>'
    }).tooltip('show');

    setTimeout(function () {
        tooltips.tooltip('dispose');
    }, 1000);
}

function selecionaMusica(elemento) {
    let artista = elemento.attr('data-artista'),
        musica = elemento.attr('data-musica'),
        titulo = elemento.attr('data-titulo'),
        duracao = elemento.attr('data-duracao'),
        idMusica = elemento.attr('data-id-musica'),
        imageCapa = elemento.attr('data-capa'),
        tipo = elemento.attr('data-tipo');

    if (totalCredito > 0) {
        executaMusica(elemento, artista, musica, titulo, duracao, imageCapa, idMusica, tipo);
        totalCredito--;
        credito.text(totalCredito);

        if (totalCredito <= 0) {
            credito.addClass('blink_me');
        }
    } else if (modoLivre) {
        executaMusica(elemento, artista, musica, titulo, duracao, imageCapa, idMusica, tipo);
    } else {
        AbreToastInfo('Favor comprar créditos.')
    }
}

function RetornaCapa(index, popularidade = null, qtdMusica = null, capa = true, tipos = null) {
    let classBar,
        htmlTipos = '';

    switch (true) {
        case (popularidade < 25):
            classBar = 'bg-danger';
            break;
        case (popularidade < 50):
            classBar = 'bg-warning';
            break;
        case (popularidade < 75):
            classBar = 'bg-info';
            break;
        default:
            classBar = 'bg-success';
            break;
    }

    if (Array.isArray(tipos)) {
        htmlTipos = '<div class="tipos-formato">';

        let i = 0;

        tipos.forEach((item) => {
            switch (item.toLowerCase()) {
                case '.mp3':
                    htmlTipos += '<i class="fas fa-music'+ (i > 0 ? " fa-space-left" : "") + '"></i>';
                    break;
                case '.mp4':
                    htmlTipos += '<i class="fas fa-video'+ (i > 0 ? " fa-space-left" : "") + '"></i>';
                    break;
            }
            i++;
        });

        htmlTipos += '</div>';
    }

    return '<li data-flip-title="' + index + '" data-letra="' + index.substr(0, 1) + '">' +
        '     <div class="flip-content">' +
        '        <div class="front">' +
        '           <h1 class="text-center titulo-musica-capa">' + index + '</h1>' +
        htmlTipos +
        '           <div class="qtd-musica">' + qtdMusica + '</div>' +
        '           <img src="' + (capa ? "../public/image/capas/" : "../public/image/default/") + encodeURI(index) + '.jpg" class="img-capa" alt="capa">' +
        '           <div class="progress progress-bar-capa">' +
        '               <div class="progress-bar ' + classBar + '" role="progressbar" aria-valuenow="' + popularidade + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + popularidade + '%;"></div>' +
        '           </div>' +
        '        </div>' +
        '        <div class="back img-capa d-none">' +
        '           <div class="card">' +
        '                <img src="' + (capa ? "../public/image/capas/" : "../public/image/default/") + encodeURI(index) + '.jpg" class="capa-artista-list" alt="capa">' +
        '                <div class="card-header">' +
        '                   <div class="form-row">' +
        '                       <div class="col title-artista">' +
        index +
        '                       </div>' +
        '                       <div class="col-2 padding-top-list-music">' +
        '                           <div class="progress progress-list-music">' +
        '                               <div class="progress-bar ' + classBar + '" role="progressbar" aria-valuenow="' + popularidade + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + popularidade + '%;"></div>' +
        '                           </div>' +
        '                       </div>' +
        '                   </div>' +
        '                </div>' +
        '                <ul class="list-group list-group-flush list-musicas">' +
        '                </ul>' +
        '           </div>' +
        '        </div>' +
        '     </div>' +
        '</li>';
}

function Pause() {
    audio.paused ? AbreToastInfo('Música', '', 'fas fa-play') : AbreToastInfo('Música', '', 'fas fa-pause');
    audio.paused ? audio.play() : audio.pause();
}

function Next() {
    audio.currentTime = audio.duration;
    AbreToastInfo('Música', '', 'fas fa-forward');
}

function MenosVolume() {
    if (audio.volume >= 0.1) {
        audio.volume -= 0.1;
    }
    AbreToastInfo('Volume', Math.round(audio.volume * 10));
}

function MaisVolume() {
    if (audio.volume < 0.9) {
        audio.volume += 0.1;
    }
    AbreToastInfo('Volume', Math.round(audio.volume * 10));
}

function RetornaMusica(artista, nomeArquivo, titulo = null, duracao = null, idMusica = null, capa = null, excluir = false, popularidadeGloba = null, popularidadeArtista = null, tipo = '.mp3') {
    let item = '<li class="list-group-item item-musica ' + (excluir ? 'item-exclude' : '') + '" data-artista="' + artista + '" data-musica="' + nomeArquivo + '" data-titulo="'+ (titulo !== null ? titulo : nomeArquivo)  +'" data-id-musica="' + idMusica + '" data-capa="' + capa + '" data-duracao="' + duracao + '" data-tipo="' + tipo + '">' +
        '   <div class="form-row">' +
        '        <div class="col-auto">';

    switch (artista) {
        case "Youtube":
            item += '            <i class="fab fa-youtube"></i>';
            break;
        case "Random":
            item += '            <i class="fas fa-random"></i>';
            break;
        case "TOP":
            item += '            <i class="fas fa-chevron-circle-up"></i>';
            break;
        default:
            item += '            <i class="fas ' + (tipo === '.mp3' ? 'fa-compact-disc' : 'fa-video') + '"></i>';
            break;
    }

    item += '        </div>';

    item += '        <div class="col titulo-musica">';
    item += '            <span>' + (titulo !== null ? titulo : nomeArquivo) + '</span>';
    item += '        </div>';

    if (popularidadeGloba !== null || popularidadeArtista !== null) {
        item += '        <div class="col-1">' +
            '            <div class="progress" style="height: 5px;margin-top: 10px;">' +
            '                <div class="progress-bar" role="progressbar" style="width: ' + popularidadeGloba + '%" aria-valuenow="' + popularidadeGloba + '" aria-valuemin="0" aria-valuemax="100"></div>' +
            '                <div class="progress-bar bg-success" role="progressbar" style="width: ' + popularidadeArtista + '%" aria-valuenow="' + popularidadeArtista + '" aria-valuemin="0" aria-valuemax="100"></div>' +
            '            </div>' +
            '        </div>';
    }

    if (duracao !== null) {
        item += '        <div class="col-auto">' +
            '            ' + display(duracao) +
            '        </div>';
    }

    item += '   <div>' +
        '</li>';

    return item;
}

function display(seconds) {
    const format = val => `0${Math.floor(val)}`.slice(-2)
    const hours = seconds / 3600
    const minutes = (seconds % 3600) / 60

    return (Math.trunc(hours) > 0 ? [hours, minutes, seconds % 60] : [minutes, seconds % 60]).map(format).join(':')
}

function listaProximas() {
    let lista = $('#listaProximas');

    lista.empty();

    $('#badge-proximas').html(listaProximasMusicas.length);

    $.each(listaProximasMusicas, function (index, value) {
        lista.append(RetornaMusica(value["Artista"], value["Titulo"], value["Musica"], value["Duracao"], value["IdMusica"], value["ImagemCapa"], value["IdMusica"] !== null, null, null, value["Tipo"]));
    });
}

function ItemProximaMusica(artista, nomeArquivo, musica, duracao, idMusica, imageCapa, tipo) {
    return {
        'Artista': artista,
        'Musica': musica,
        'Titulo': nomeArquivo,
        'Duracao': duracao,
        'IdMusica': idMusica,
        'ImagemCapa': imageCapa,
        'Tipo': tipo
    };
}

function executaMusica(elemento, artista, nomeArquivo, musica, duracao, imageCapa, idMusica, tipo, random = false) {
    let carregando = $('#music-carregando'),
        no_music = $('#no-music-info'),
        info = $('#music-info');

    switch (artista) {
        case 'Random': {
            $.get("/randomMusica?Quantidade=" + nomeArquivo, function (response) {
                $.each(response, function (index, value) {
                    executaMusica(null, value["Artista"], value["Titulo"], value["Musica"], value["Duracao"], null, null, value["Tipo"]);
                });
            });
        }
            break;
        case 'TOP': {
            $.get("/topMusica?Quantidade=" + nomeArquivo, function (response) {
                $.each(response, function (index, value) {
                    executaMusica(null, value["Artista"], value["Titulo"],value["Musica"], value["Duracao"], null, null, value["Tipo"]);
                });
            });
        }
            break;
        case 'Youtube':
            switch (nomeArquivo) {
                case 'Pesquisar':
                    if ($('#pesquisa-youtube').length === 0) {
                        elemento.append('<input class="form-control col-auto" id="pesquisa-youtube">');
                        $('#pesquisa-youtube').trigger('focus');
                    }
                    break;
                default:
                    if (audio.paused) {
                        carregando.removeClass('d-none');
                        no_music.addClass('d-none');

                        $('.background-image').css('background-image', 'url(' + imageCapa + ')');

                        fetch("/tocaYoutube?IdMusica=" + encodeURI(idMusica))
                            .then(res => {
                                return res.blob();
                            })
                            .then(blob => {
                                carregando.addClass('d-none');
                                info.removeClass('d-none');
                                $('.capa-atual').attr("src", imageCapa);
                                $('#title-musica').html('<i class="fab fa-youtube"></i>&nbsp;' + nomeArquivo);
                                $('#artista-musica').html(artista);
                                audio.classList.remove("d-none");

                                audio.src = URL.createObjectURL(blob);

                                audio.load();
                                audio.play();

                            })
                    } else {
                        listaProximasMusicas.push(ItemProximaMusica(artista, nomeArquivo, nomeArquivo, duracao, idMusica, imageCapa));

                        listaProximas();
                    }
                    break;
            }
            break;
        default:
            if (audio.paused) {
                carregando.removeClass('d-none');
                no_music.addClass('d-none');

                $.get('/playMusic?artista=' + encodeURIComponent(artista) + '&musica=' + encodeURIComponent(nomeArquivo) + '&random=' + random, function (response) {
                    carregando.addClass('d-none');

                    if (response.success) {
                        let imageUrl = '../public/image/capas/' + encodeURIComponent(artista) + '.jpg',
                            audioSrc = 'data:audio/' + (tipo === null ? 'mp3' : tipo.replace('.', '')) + ';base64,' + response.fileContent;

                        info.removeClass('d-none');
                        $('.background-image').css('background-image', 'url(' + imageUrl + ')');
                        $('.capa-atual').attr("src", imageUrl);
                        $('#title-musica').html('<i class="fas '+ (random ? 'fa-random' : (tipo === '.mp3' ? 'fa-compact-disc' : 'fa-video')) +'"></i>&nbsp;' + musica);
                        $('#artista-musica').html(artista);

                        if (tipo === ".mp4") {
                            audio.classList.remove("d-none");
                        }

                        audio.src = audioSrc;
                        audio.load();
                        audio.play();
                    } else {
                        ExecutaProxima();
                    }
                });
            } else {
                listaProximasMusicas.push(ItemProximaMusica(artista, nomeArquivo, musica, duracao, null, null, tipo));

                listaProximas();
            }
            break;
    }
}

function ExecutaProxima() {
    if (listaProximasMusicas.length > 0) {
        let proxima = listaProximasMusicas.shift();

        executaMusica(null, proxima["Artista"], proxima["Titulo"], proxima["Musica"], proxima["Duracao"], proxima["ImagemCapa"], proxima["IdMusica"], proxima["Tipo"]);

        listaProximas();
    }
}

function ProximaLetra(letra) {
    let proxLetra = letra === "" ? alfabeto[1] : alfabeto[alfabeto.indexOf(letra) + 1 >= alfabeto.length ? 0 : alfabeto.indexOf(letra) + 1];
    coverflow.flipster('jump', $('.' + $($('.flip-items').find('[data-letra="' + proxLetra + '"]')[0]).attr('class').split(' ')[3]));
}

function LetraAnterior(letra) {
    let proxLetra = letra === "" ? alfabeto[alfabeto.length - 1] : alfabeto[alfabeto.indexOf(letra) - 1 === -1 ? alfabeto.length - 1 : alfabeto.indexOf(letra) - 1];
    coverflow.flipster('jump', $('.' + $($('.flip-items').find('[data-letra="' + proxLetra + '"]')[0]).attr('class').split(' ')[3]));
}

function invocation() {
    timeVideo = window.setTimeout(
        function () {
            audio.classList.remove("Utilizando");
        }, 3000);
}

function timeRandomInit() {
    timeRandom = window.setInterval(() => {
        if (audio.paused && (audio.ended || isNaN(audio.duration))) {
            $.get("/randomMusica?Quantidade=1", function (response) {
                $.each(response, function (_index, value) {
                    executaMusica(null, value["Artista"], value["Titulo"], value["Musica"], value["Duracao"], null, null, value["Tipo"], true);
                });
            });
        }
    }, tempoRandom);
}

function timeYoutube(query) {
    timePesquisaYoutube = window.setTimeout(
        function () {
            pesquisaYoutube(query)
        }, 1500);
}

function pesquisaYoutube(query) {
    let list = $('#pesquisa-youtube').offsetParent().offsetParent();

    $('.item-exclude').remove();

    $.get("/buscaYoutube?busca=" + encodeURI(query), function (retornoLista) {
        $.each(retornoLista, function (index, value) {
            list.append(RetornaMusica('Youtube', value["Titulo"], value["Titulo"], value["Duracao"], value["IdMusica"], value["Capa"], true));
        })
        firstIndex = list.find('.item-musica').first().index();
        lastIndex = list.find('.item-musica').last().index();
    });
}

function animationCount(element, valor) {
    element.prop('Counter', 0).animate({
        Counter: valor > 0 ? valor : $(this).text()
    }, {
        duration: 3000,
        easing: 'swing',
        step: function (now) {
            element.text(Math.ceil(now));
        }
    });
}