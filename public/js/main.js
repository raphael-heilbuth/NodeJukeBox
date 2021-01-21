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

$('body').loading({
    stoppable: false,
    onStop: function (loading) {
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

    $('#ranger-volume').val(audio.volume);

    socket.on('volume', function (volume) {
        audio.volume = volume;
        AbreToastInfo('Volume', Math.round(audio.volume * 10));
    });

    socket.on('volumeMais', function () {
        MaisVolume();
        AbreToastInfo('Volume', Math.round(audio.volume * 10));
    });

    socket.on('volumeMenos', function () {
        MenosVolume();
        AbreToastInfo('Volume', Math.round(audio.volume * 10));
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
        executaMusica(null, value["Artista"], value["Musica"], value["Duracao"], null, null, value["Tipo"]);
        AbreToastInfo('Música', '', 'fas fa-plus');
    });

    socket.on('proxima', function() {
        Next();
        AbreToastInfo('Música', '', 'fas fa-forward');
    });

    $.get("/getParametro",function (parametro){
        modoLivre = parametro['modo'] === 'Livre';
        tempoRandom = parametro['timeRandom'];
        valorCredito = parametro['valorCredito'];

        if (modoLivre) {
            $('.jukebox-modo').removeClass('d-none');
        } else {
            $('.div-creditos').removeClass('d-none');
        }
    });

    $.get("/getList", function (data) {
        listaMusicas = data["ListaMusica"];

        $('#total-musica').html(data["TotalMusicas"]).countAnimation(data["TotalMusicas"]);
        $('#tocadas').html(data["MusicasTocas"]).countAnimation(data["MusicasTocas"]);
        $('#total-album').html(data["TotalAlbum"]).countAnimation(data["TotalAlbum"]);

        let list = $('.flip-items');

        alfabeto = Object.keys(listaMusicas).map(function (artista) {
            return removerAcentos(artista.substr(0, 1));
        }).filter(function (itm, i, a) {
            return i === a.indexOf(itm);
        });

        $.each(listaMusicas, function (index, value) {
            switch (index) {
                case 'Youtube':
                case 'TOP':
                case 'Random':
                    list.append(RetornaCapa(index, null, value["Musicas"].length, false));
                    break;
                default:
                    list.append(RetornaCapa(index, value["Popularidade"], value["Musicas"].length));
                    break;
            }
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

                let letra = removerAcentos($(currentItem).attr('data-flip-title').substr(0, 1));
                if (letraAnt !== letra) {
                    letraAnt = letra;
                    let tooltips = $('.line-cover-flow').tooltip({
                        title: letraAnt,
                        template: '<div class="tooltip tooltip-letra" role="tooltip"><div class="tooltip-inner tooltip-inner-letra"></div></div>'
                    }).tooltip('show');

                    setTimeout(function () {
                        tooltips.tooltip('dispose');
                    }, 1000);
                }
            }
        });

        $('body').loading('stop');

        timeRandomInit();
    });

    $(document).on('click', '.flipster__item--current', function () {
        if (!$(this).find('.back').is(':visible')) {
            let listaMusicaArtista = $(this).find('.back').find('ul'),
                artista = $(this).attr('data-flip-title');

            $(this).find('.front').addClass('d-none').end().find('.back').removeClass('d-none');

            listaMusicaArtista.empty();

            $.each(listaMusicas[artista]["Musicas"], function (index, value) {

                let meta = value["Meta"],
                    item = RetornaMusica(artista, value["Musica"], (meta !== null ? meta["duration"] : meta), null, null, null, value["PopularidadeGlobal"], value["PopularidadeArtista"], value["Tipo"]);

                listaMusicaArtista.append(item);
            });

            listaMusicaArtista.focus();

            firstIndex = listaMusicaArtista.find('.item-musica').first().index();
            lastIndex = listaMusicaArtista.find('.item-musica').last().index();

            currentArtista = listaMusicaArtista;
        }
    });

    $(document).on('keydown', '#pesquisa-youtube', function () {
        clearTimeout(timePesquisaYoutube);

        timeYoutube($(this).val());
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
        let imageCapa = '../public/image/default/NodeJukebox.png';
        $('.background-image').css('background-image', 'url(' + imageCapa + ')');

        audio.classList.add("d-none");

        ExecutaProxima();

        clearInterval(timeRandom);
        timeRandomInit();
    });

    $("#ranger-volume").on('change', function () {
        audio.volume = $(this).val();
    });

    audio.addEventListener('volumechange', () => {
        $('#ranger-volume').val(audio.volume);
        if (audio.volume === 0) {
            $('.icon-volume').removeClass('fa-volume-down').removeClass('fa-volume-up').addClass('fa-volume-off');
        } else if (audio.volume >= 0.5) {
            $('.icon-volume').removeClass('fa-volume-off').removeClass('fa-volume-down').addClass('fa-volume-up');
        } else {
            $('.icon-volume').removeClass('fa-volume-off').removeClass('fa-volume-up').addClass('fa-volume-down');
        }
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
                let index = currentArtista.find('.active').index();

                index = (index === firstIndex ? lastIndex : index - 1);

                currentArtista[0].scrollIntoView();

                currentArtista.find('.active').removeClass('active');
                let itemAtual = currentArtista.find('.list-group-item:eq( ' + index + ' )').addClass('active');
                itemAtual.find('.titulo-musica').addClass('active');
                itemAtual.get(0).scrollIntoView({
                    behavior: "smooth", // or "auto" or "instant"
                    block: "start" // or "start" or "end"
                });
            }

            audio.classList.add("Utilizando");

            clearTimeout(timeVideo);


            invocation();
        }
        if (event.altKey === true && event.key === 'ArrowDown') {
            if ($('.flipster__item--current').find('.front').is(':visible')) {
                LetraAnterior(letraAnt);
            } else {
                let index = currentArtista.find('.active').index();

                index = (index === lastIndex ? 0 : index + 1);

                currentArtista.find('.active').removeClass('active');
                let itemAtual = currentArtista.find('.list-group-item:eq( ' + index + ' )').addClass('active');
                itemAtual.find('.titulo-musica').addClass('active');
                itemAtual.get(0).scrollIntoView({
                    behavior: "smooth", // or "auto" or "instant"
                    block: "end" // or "end"
                });
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
                if (currentArtista.find('.active').length > 0) {
                    selecionaMusica(currentArtista.find('.active'));
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
        duracao = elemento.attr('data-duracao'),
        idMusica = elemento.attr('data-id-musica'),
        imageCapa = elemento.attr('data-capa'),
        tipo = elemento.attr('data-tipo');

    if (totalCredito > 0) {
        executaMusica(elemento, artista, musica, duracao, imageCapa, idMusica, tipo);
        totalCredito--;
        credito.text(totalCredito);

        if (totalCredito <= 0) {
            credito.addClass('blink_me');
        }
    } else if (modoLivre) {
        executaMusica(elemento, artista, musica, duracao, imageCapa, idMusica, tipo);
    } else {
        AbreToastInfo('Favor comprar créditos.')
    }
}

function removerAcentos(newStringComAcento) {
    let string = newStringComAcento;
    const mapaAcentosHex = {
        a: /[\xE0-\xE6]/g,
        A: /[\xC0-\xC6]/g,
        e: /[\xE8-\xEB]/g,
        E: /[\xC8-\xCB]/g,
        i: /[\xEC-\xEF]/g,
        I: /[\xCC-\xCF]/g,
        o: /[\xF2-\xF6]/g,
        O: /[\xD2-\xD6]/g,
        u: /[\xF9-\xFC]/g,
        U: /[\xD9-\xDC]/g,
        c: /\xE7/g,
        C: /\xC7/g,
        n: /\xF1/g,
        N: /\xD1/g,
    };

    for (let letra in mapaAcentosHex) {
        let expressaoRegular = mapaAcentosHex[letra];
        string = string.replace(expressaoRegular, letra);
    }

    return string;
}

function RetornaCapa(index, popularidade = null, qtdMusica = null, capa = true) {
    let classBar;

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

    return '<li data-flip-title="' + index + '" data-letra="' + removerAcentos(index.substr(0, 1)) + '">' +
        '     <div class="flip-content">' +
        '        <div class="front">' +
        '           <h1 class="text-center titulo-musica-capa">' + index + '</h1>' +
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
    audio.paused ? audio.play() : audio.pause();
}

function Next() {
    audio.currentTime = audio.duration;
}

function MenosVolume() {
    if (audio.volume >= 0.1) {
        audio.volume -= 0.1;
    }
}

function MaisVolume() {
    if (audio.volume < 0.9) {
        audio.volume += 0.1;
    }
}

function RetornaMusica(artista, index, duracao = null, idMusica = null, capa = null, excluir = false, popularidadeGloba = null, popularidadeArtista = null, tipo = '.mp3') {
    let item = '<li class="list-group-item item-musica ' + (excluir ? 'item-exclude' : '') + '" data-artista="' + artista + '" data-musica="' + index + '" data-id-musica="' + idMusica + '" data-capa="' + capa + '" data-duracao="' + duracao + '" data-tipo="' + tipo + '">' +
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
    item += '            <span>' + index + '</span>';
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
        lista.append(RetornaMusica(value["Artista"], value["Musica"], value["Duracao"], value["IdMusica"], value["ImagemCapa"], value["IdMusica"] !== null, null, null, value["Tipo"]));
    });
}

function ItemProximaMusica(artista, musica, duracao, idMusica, imageCapa, tipo) {
    return {
        'Artista': artista,
        'Musica': musica,
        'Duracao': duracao,
        'IdMusica': idMusica,
        'ImagemCapa': imageCapa,
        'Tipo': tipo
    };
}

function executaMusica(elemento, artista, musica, duracao, imageCapa, idMusica, tipo) {
    let carregando = $('#music-carregando'),
        info = $('#music-info');

    switch (artista) {
        case 'Random': {
            $.get("/randomMusica?Quantidade=" + musica, function (response) {
                $.each(response, function (index, value) {
                    executaMusica(null, value["Artista"], value["Musica"], value["Duracao"], null, null, value["Tipo"]);
                });
            });
        }
            break;
        case 'TOP': {
            $.get("/topMusica?Quantidade=" + musica, function (response) {
                $.each(response, function (index, value) {
                    executaMusica(null, value["Artista"], value["Musica"], value["Duracao"], null, null, value["Tipo"]);
                });
            });
        }
            break;
        case 'Youtube':
            switch (musica) {
                case 'Pesquisar':
                    if ($('#pesquisa-youtube').length === 0) {
                        elemento.append('<input class="form-control col-auto" id="pesquisa-youtube">');
                    }
                    break;
                default:
                    if (audio.paused) {
                        carregando.removeClass('d-none');

                        $('.background-image').css('background-image', 'url(' + imageCapa + ')');

                        fetch("/tocaYoutube?IdMusica=" + encodeURI(idMusica))
                            .then(res => {
                                return res.blob();
                            })
                            .then(blob => {
                                carregando.addClass('d-none');
                                info.removeClass('d-none');
                                $('.capa-atual').attr("src", imageCapa);
                                $('#title-musica').html('<i class="fab fa-youtube"></i>&nbsp;' + musica);
                                $('#artista-musica').html(artista);
                                audio.classList.remove("d-none");

                                audio.src = URL.createObjectURL(blob);

                                audio.load();
                                audio.play();

                            })
                    } else {
                        listaProximasMusicas.push(ItemProximaMusica(artista, musica, duracao, idMusica, imageCapa));

                        listaProximas();
                    }
                    break;
            }
            break;
        default:
            if (audio.paused) {
                carregando.removeClass('d-none');

                $.get('/playMusic?artista=' + artista + '&musica=' + musica, function (response) {
                    carregando.addClass('d-none');

                    if (response.success) {
                        let imageUrl = '../public/image/capas/' + encodeURIComponent(artista) + '.jpg',
                            audioSrc = 'data:audio/' + (tipo === null ? 'mp3' : tipo.replace('.', '')) + ';base64,' + response.fileContent;

                        info.removeClass('d-none');
                        $('.background-image').css('background-image', 'url(' + imageUrl + ')');
                        $('.capa-atual').attr("src", imageUrl);
                        $('#title-musica').html('<i class="fas fa-compact-disc"></i>&nbsp;' + musica);
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
                listaProximasMusicas.push(ItemProximaMusica(artista, musica, duracao, null, null, tipo));

                listaProximas();
            }
            break;
    }
}

function ExecutaProxima() {
    if (listaProximasMusicas.length > 0) {
        let proxima = listaProximasMusicas.shift();

        executaMusica(null, proxima["Artista"], proxima["Musica"], proxima["Duracao"], proxima["ImagemCapa"], proxima["IdMusica"], proxima["Tipo"]);

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
        if (audio.paused) {
            $.get("/randomMusica?Quantidade=1", function (response) {
                $.each(response, function (index, value) {
                    executaMusica(null, value["Artista"], value["Musica"], value["Duracao"], null, null, null);
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
    let list = $('#pesquisa-youtube').offsetParent();

    $('.item-exclude').remove();

    $.get("/buscaYoutube?busca=" + encodeURI(query), function (retornoLista) {
        $.each(retornoLista, function (index, value) {
            list.append(RetornaMusica('Youtube', value["Titulo"], value["Duracao"], value["IdMusica"], value["Capa"], true));
        })
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