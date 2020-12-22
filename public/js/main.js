let audio = new Audio(),
    listaMusicas,
    listaProximasMusicas = [],
    coverflow,
    alfabeto = [], 
    letraAnt = '';

jQuery(function () {
    "use strict";
    audio.volume = 0.1;
    $('#ranger-volume').val(audio.volume);

    $('body').loading({
        stoppable: false,
        onStart: function(loading) {
            loading.overlay.slideDown(400);
        },
        onStop: function(loading) {
            loading.overlay.slideUp(400);
        }
    }, 'start');

    $.get("/getList", function (data) {
        listaMusicas = data;

        let list = $('.flip-items');

        alfabeto = Object.keys(data).map(function(artista) {
            return removerAcentos(artista.substr(0, 1));
        }).filter(function(itm, i, a) {
            return i === a.indexOf(itm);
        });

        $.each(data, function (index) {
            switch (index) {
                case 'Youtube':
                case 'TOP':
                case 'Random':
                    list.append(RetornaCapa(index, false));
                    break;
                default:
                    list.append(RetornaCapa(index));
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
    });

    $(document).on('click', '.flipster__item--current', function () {
        let listaMusicaArtista = $(this).find('.back').find('ul'),
            artista = $(this).attr('data-flip-title');

        $(this).find('.front').addClass('d-none').end().find('.back').removeClass('d-none');

        listaMusicaArtista.empty();

        if(artista === "Youtube" || artista === "TOP" || artista === "Random"){
            $.each(listaMusicas[artista], function (index) {

                let  item = RetornaMusica(artista,index);

                listaMusicaArtista.append(item);
            });
        }else{
            $.each(listaMusicas[artista]["Musicas"], function (index,value) {

                let meta = value["Meta"],
                    item = RetornaMusica(artista, value["Musica"],meta["format"]["duration"]);

                listaMusicaArtista.append(item);
            });
        }
    });

    $(document).on('keydown', '#pesquisa-youtube', function () {
        let query = $(this).val();

        $('.item-exclude').remove();

        $.get("/buscaYoutube?busca=" + encodeURI(query), function (retornoLista) {
            $.each(retornoLista, function (index, value) {
                $('#list').append(RetornaMusica('Youtube', value["Titulo"], value["Duracao"], value["IdMusica"], value["Capa"], true));
            })
        });
    });

    $(document).on('click', '.item-musica', function () {
        let artista = $(this).attr('data-artista'),
            musica = $(this).attr('data-musica'),
            duracao = $(this).attr('data-duracao'),
            idMusica = $(this).attr('data-id-musica'),
            imageCapa = $(this).attr('data-capa');

        executaMusica($(this), artista, musica, duracao, imageCapa, idMusica);
    });

    audio.addEventListener('timeupdate', () => {
        $('#music-bar').width(((audio.currentTime * 100) / audio.duration) + '%');
        $('#music-time').html(display(audio.currentTime) + '/' + display(audio.duration));
    });

    audio.addEventListener('ended', () => {
        $('#music-info').addClass('d-none');
        let imageCapa = '../public/image/default/NodeJukebox.png';
        $('.background-image').css('background-image', 'url(' + imageCapa + ')');

        ExecutaProxima();
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

    setInterval(() => {
        if (audio.paused) {
            $.get("/randomMusica?Quantidade=1", function (response) {
                $.each(response, function (index, value) {
                    executaMusica(null, value["Artista"], value["Musica"], null, null, null, null);
                });
            });
        }
    }, 240000);

    document.addEventListener("keydown", (event) => {
        if (event.altKey == true && event.key == "p") Pause();
        if (event.altKey == true && event.key == "n") Next();
        if (event.altKey == true && event.key == ".") MaisVolume();
        if (event.altKey == true && event.key == ",") MenosVolume();
        if (event.altKey == true && event.key == 'ArrowUp') ProximaLetra(letraAnt);
        if (event.altKey == true && event.key == 'ArrowDown') LetraAnterior(letraAnt);
        if (event.altKey == true && event.key == 'ArrowRight') coverflow.flipster('next');
        if (event.altKey == true && event.key == 'ArrowLeft') coverflow.flipster('prev');
    });
});

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

function RetornaCapa(index, capa = true) {
    return '<li data-flip-title="' + index + '" data-letra="' + removerAcentos(index.substr(0, 1)) + '">' +
        '     <div class="flip-content">' +
        '        <div class="front">' +
        '           <img src="' + (capa ? "../public/image/capas/" : "../public/image/default/") + index + '.jpg" class="img-capa" alt="capa">' +
        '        </div>' +
        '        <div class="back img-capa d-none">' +
        '           <div class="card">' +
        '                <div class="card-header">'+index+'</div>' +
        '                   <ul class="list-group list-group-flush list-musicas">' +
        '                   </ul>' +
        '                </div>' +
        '           </div>' +
        '        </div>' +
        '     </div>' +
        '</li>';
}

function Pause() {
    audio.paused ? audio.play() : audio.pause();
};

function Next() {
    audio.currentTime = audio.duration;
};

function MenosVolume() {
    if (audio.volume >= 0.1) {
        audio.volume -= 0.1;
    }

};

function MaisVolume() {
    if (audio.volume < 0.9) {
        audio.volume += 0.1;
    }
};

function RetornaMusica(artista, index, duracao = null, idMusica = null, capa = null, excluir = false) {
    let item = '<li class="list-group-item item-musica ' + (excluir ? 'item-exclude' : '') + '" data-artista="' + artista + '" data-musica="' + index + '" data-id-musica="' + idMusica + '" data-capa="' + capa + '" data-duracao="' + duracao + '">' +
        '   <div class="form-row">' +
        '        <div class="col titulo-musica">';

    switch (artista) {
        case "Youtube":
            item += '            <i class="fab fa-youtube"></i>&nbsp;' + index;
            break;
        case "Random":
            item += '            <i class="fas fa-random"></i>&nbsp;' + index;
            break;
        case "TOP":
            item += '            <i class="fas fa-chevron-circle-up"></i>&nbsp;' + index;
            break;
        default:
            item += '            <i class="fas fa-compact-disc"></i>&nbsp;' + index;
            break;
    }

    item += '        </div>' +
        '        <div class="col-auto">' +
        '            ' + display(duracao) +
        '        </div>';
    if (!excluir) {
        item += '        <div class="col-1">' +
            '            <div class="progress" style="height: 5px;margin-top: 10px;">' +
            '                <div class="progress-bar" role="progressbar" style="width: 15%" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100"></div>' +
            '                <div class="progress-bar bg-success" role="progressbar" style="width: 30%" aria-valuenow="30" aria-valuemin="0" aria-valuemax="100"></div>' +
            '            </div>' +
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
        lista.append(RetornaMusica(value["Artista"], value["Musica"], value["Duracao"], value["IdMusica"], value["ImagemCapa"], value["IdMusica"] !== null));
    });
}

function ItemProximaMusica(artista, musica, duracao, idMusica, imageCapa) {
    return {
        'Artista': artista,
        'Musica': musica,
        'Duracao': duracao,
        'IdMusica': idMusica,
        'ImagemCapa': imageCapa
    };
}

function executaMusica(elemento, artista, musica, duracao, imageCapa, idMusica) {
    let carregando = $('#music-carregando'),
        info = $('#music-info');

    switch (artista) {
        case 'Random': {
            $.get("/randomMusica?Quantidade=" + musica, function (response) {
                $.each(response, function (index, value) {
                    executaMusica(null, value["Artista"], value["Musica"], null, null, null, null);
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
                            audioSrc = 'data:audio/mp3;base64,' + response.fileContent;

                        info.removeClass('d-none');
                        $('.background-image').css('background-image', 'url(' + imageUrl + ')');
                        $('.capa-atual').attr("src", imageUrl);
                        $('#title-musica').html('<i class="fas fa-compact-disc"></i>&nbsp;' + musica);
                        $('#artista-musica').html(artista);

                        audio.src = audioSrc;
                        audio.load();
                        audio.play();
                    } else {
                        ExecutaProxima();
                    }
                });
            } else {
                listaProximasMusicas.push(ItemProximaMusica(artista, musica, duracao, null, null));

                listaProximas();
            }
            break;
    }
}

function ExecutaProxima() {
    if (listaProximasMusicas.length > 0) {
        let proxima = listaProximasMusicas.shift();

        executaMusica(null, proxima["Artista"], proxima["Musica"], proxima["Duracao"], proxima["ImagemCapa"], proxima["IdMusica"]);

        listaProximas();
    }
}

function ProximaLetra(letra) {
    let proxLetra = letra === "" ? alfabeto[1] : alfabeto[alfabeto.indexOf(letra) + 1 >= alfabeto.length ? 0 : alfabeto.indexOf(letra) + 1];
    coverflow.flipster('jump', $('.' + $($('.flip-items').find('[data-letra="'+proxLetra+'"]')[0]).attr('class').split(' ')[3]));
}

function LetraAnterior(letra) {
    let proxLetra = letra === "" ? alfabeto[alfabeto.length - 1] : alfabeto[alfabeto.indexOf(letra) - 1 === -1 ? alfabeto.length - 1 : alfabeto.indexOf(letra) - 1];
    coverflow.flipster('jump', $('.' + $($('.flip-items').find('[data-letra="'+proxLetra +'"]')[0]).attr('class').split(' ')[3]));    
}
