let audio = new Audio(),
    listaMusicas,
    listaProximasMusicas = [];

jQuery(function () {
    "use strict";
    $.get("/getList", function (data) {
        listaMusicas = data;

        let list = $('.flip-items');

        $.each(data, function (index) {
            switch (index) {
                case 'Youtube':
                case 'TOP':
                case 'Random':
                    list.append('<li data-flip-title="' + index + '"><img src="../public/image/default/' + index + '.jpg" class="img-capa" alt="capa"></li>');
                    break;
                default:
                    list.append('<li data-flip-title="' + index + '"><img src="../public/image/capas/' + index + '.jpg" class="img-capa" alt="capa"></li>');
                    break;
            }
        });

        let letraAnt = '';
        let coverflow = $("#coverflow").flipster({
            style: 'carousel',
            spacing: -0.15,
            buttons: true,
            loop: true,
            fadeIn: 0,
            start: 0,
            buttonPrev: 'Anterior',
            buttonNext: 'Próxima',
            onItemSwitch: function (currentItem, previousItem) {
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
    });

    $(document).on('click', '.flipster__item--current', function () {
        let listaMusicaArtista = $('#list'),
            artista = $(this).attr('data-flip-title');

        listaMusicaArtista.empty();

        $.each(listaMusicas[artista], function (index) {
            let item = RetornaMusica(artista, index);

            listaMusicaArtista.append(item);
        });
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

        ExecutaProxima();
    });

    audio.addEventListener('volumechange', () => {
        alert(audio.volume);
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

function RetornaMusica(artista, index, duracao = null, idMusica = null, capa = null, excluir = false) {
    let item = '<li class="list-group-item item-musica ' + (excluir ? 'item-exclude' : '') + '" data-artista="' + artista + '" data-musica="' + index + '" data-id-musica="' + idMusica + '" data-capa="' + capa + '" data-duracao="'+duracao+'">' +
        '   <div class="form-row">' +
        '        <div class="col">' +
        '            ' + index +
        '        </div>' +
        '        <div class="col-auto">' +
        '            ' + duracao +
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

    $.each(listaProximasMusicas, function(index, value) {
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
                                return res.blob()
                            })
                            .then(blob => {
                                carregando.addClass('d-none');
                                info.removeClass('d-none');

                                audio.src = URL.createObjectURL(blob);
                                audio.volume = 0.1

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

                        audio.volume = 0.1

                        audio.src = audioSrc;
                        audio.load();
                        audio.play();
                    } else {
                        ExecutaProxima();
                    }
                });
            } else {
                listaProximasMusicas.push(ItemProximaMusica(artista, musica, null, null, null));

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
