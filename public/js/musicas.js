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
                    list.append(RetornaCapa(x.name, x.popularidade ?? 0, x.Musicas.length, true, x.formatos));
                    break;
            }

            return x.name.substring(0, 1)
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

                let letra = $(currentItem).attr('data-flip-title').substring(0, 1);
                if (letraAnt !== letra) {
                    letraAnt = letra;
                    toastr.error('',letraAnt, {iconClass:"toast-custom"});
                }
            }
        });

        [...document.querySelectorAll('.img-capa, .capa-artista-list')].forEach((el) => {
            el.addEventListener('error', (event) => { event.target.src = '../public/image/default/CapaPadrao.jpg' });
        });

        body.loading('stop');

        timeRandomInit();
    });
}

function CaminhaMusicas(tecla) {
    let index = currentArtista.find('.active').index(),
        firstItem = (index === firstIndex ? lastIndex : index - 1),
        lastItem = (index === lastIndex ? 0 : index + 1);

    index = (tecla === 'up' ? firstItem : lastItem);

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

function selecionaMusica(elemento) {
    let artista = elemento.attr('data-artista'),
        musica = elemento.attr('data-musica'),
        titulo = elemento.attr('data-titulo'),
        duracao = elemento.attr('data-duracao'),
        idMusica = elemento.attr('data-id-musica'),
        imageCapa = elemento.attr('data-capa'),
        tipo = elemento.attr('data-tipo'),
        presquisaYoutube = (artista === "Youtube" && musica === "Pesquisar");

    if (totalCredito > 0 || presquisaYoutube) {
        executaMusica(artista, musica, titulo, duracao, tipo, {elemento: elemento, imageCapa: imageCapa, idMusica: idMusica});
        if (!presquisaYoutube) {
            totalCredito--;
            credito.text(totalCredito);
        }

        if (totalCredito <= 0) {
            credito.addClass('blink_me');
        }
    } else if (modoLivre) {
        executaMusica(artista, musica, titulo, duracao, tipo, {elemento: elemento, imageCapa: imageCapa, idMusica: idMusica});
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

    return '<li data-flip-title="' + index + '" data-letra="' + index.substring(0, 1) + '">' +
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

function RetornaMusica(artista, nomeArquivo, {titulo = null, duracao = null, idMusica = null, capa = null, excluir = false, popularidadeGloba = null, popularidadeArtista = null, tipo = '.mp3'}) {
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
    item += '            <span>' + (titulo ?? nomeArquivo) + '</span>';
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

function listaProximas() {
    let lista = $('#listaProximas');

    lista.empty();

    $('#badge-tempo-proximas').html(display(listaProximasMusicas.reduce((a, b) => a + +b.Duracao, 0)));
    $('#badge-proximas').html(listaProximasMusicas.length.toString());

    $.each(listaProximasMusicas, function (index, value) {
        lista.append(RetornaMusica(value["Artista"], value["Titulo"], {
            titulo: value["Musica"],
            duracao: value["Duracao"],
            idMusica: value["IdMusica"],
            capa: value["ImagemCapa"],
            excluir: value["IdMusica"] !== null,
            tipo: value["Tipo"]
        }));
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

function ExecutaMusicaYoutube(carregando, imageCapa, idMusica, info, nomeArquivo, artista) {
    carregando.removeClass('d-none');

    $('.background-image').css('background-image', 'url(' + imageCapa + ')');
    iniciandoMusica = true;
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
            audio.play().then(() => {
                iniciandoMusica = false;
            });
        })
}

function ExecutaMusicaLista(carregando, artista, nomeArquivo, random, tipo, info, musica) {
    carregando.removeClass('d-none');

    iniciandoMusica = true;
    $.get('/playMusic?artista=' + encodeURIComponent(artista) + '&musica=' + encodeURIComponent(nomeArquivo) + '&random=' + random, function (response) {
        carregando.addClass('d-none');

        if (response.success) {
            CapaExiste('../public/image/capas/' + encodeURIComponent(artista) + '.jpg').then((imageUrl) => {
                let audioSrc = 'data:audio/' + (tipo === null ? 'mp3' : tipo.replace('.', '')) + ';base64,' + response.fileContent;

                info.removeClass('d-none');
                $('.background-image').css('background-image', 'url(' + imageUrl.background + ')');
                $('.capa-atual').attr("src", imageUrl.case);
                let iconTipo = (tipo === '.mp3' ? 'fa-compact-disc' : 'fa-video');
                $('#title-musica').html('<i class="fas ' + (random ? 'fa-random' : iconTipo) + '"></i>&nbsp;' + musica);
                $('#artista-musica').html(artista);

                if (tipo === ".mp4") {
                    audio.classList.remove("d-none");
                }

                audio.src = audioSrc;
                audio.load();
                audio.play().then(() => {
                    iniciandoMusica = false;
                });
            })
        } else {
            iniciandoMusica = false;
            ExecutaProxima();
        }
    });
}

function executaMusica(artista, nomeArquivo, musica, duracao, tipo, {elemento = null, imageCapa = null, idMusica = null, random = false}) {
    let carregando = $('#music-carregando'),
        no_music = $('#no-music-info'),
        info = $('#music-info'),
        pesquisa_youtube = $('#pesquisa-youtube');

    switch (artista) {
        case 'Random': {
            $.get("/randomMusica?Quantidade=" + nomeArquivo, function (response) {
                $.each(response, function (index, value) {
                    executaMusica(value["Artista"], value["Titulo"], value["Musica"], value["Duracao"], value["Tipo"], {});
                });
            });
        }
            break;
        case 'TOP': {
            $.get("/topMusica?Quantidade=" + nomeArquivo, function (response) {
                $.each(response, function (index, value) {
                    executaMusica(value["Artista"], value["Titulo"],value["Musica"], value["Duracao"],value["Tipo"], {});
                });
            });
        }
            break;
        case 'Youtube':
            if (nomeArquivo === "Pesquisar") {
                if (pesquisa_youtube.length === 0) {
                    elemento.append('<input class="form-control col-auto" id="pesquisa-youtube">').trigger('focus');
                }
            } else {
                if (audio.paused && !iniciandoMusica) {
                    no_music.addClass('d-none');
                    ExecutaMusicaYoutube(carregando, imageCapa, idMusica, info, nomeArquivo, artista);
                } else {
                    listaProximasMusicas.push(ItemProximaMusica(artista, nomeArquivo, nomeArquivo, duracao, idMusica, imageCapa));

                    listaProximas();
                }
            }
            break;
        default:
            if (audio.paused && !iniciandoMusica) {
                no_music.addClass('d-none');
                ExecutaMusicaLista(carregando, artista, nomeArquivo, random, tipo, info, musica);
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

        executaMusica(proxima["Artista"], proxima["Titulo"], proxima["Musica"], proxima["Duracao"], proxima["Tipo"], {imageCapa: proxima["ImagemCapa"], idMusica: proxima["IdMusica"]});

        listaProximas();
    }
}

function pesquisaYoutube(query) {
    let list = $('#pesquisa-youtube').offsetParent().offsetParent();

    list.append(
        '<div id="pesquisa-carregando" class="text-center">\n' +
        '    <div class="spinner-border" role="status">\n' +
        '        <span class="sr-only">Pesquisando...</span>\n' +
        '    </div>\n' +
        '</div>'
    );

    $('.item-exclude').remove();

    $.get("/buscaYoutube?busca=" + encodeURI(query), function (retornoLista) {
        $.each(retornoLista, function (index, value) {
            $('#pesquisa-carregando').remove();
            list.append(RetornaMusica('Youtube', value["Titulo"], {
                titulo: value["Titulo"],
                duracao: value["Duracao"],
                idMusica: value["IdMusica"],
                capa: value["Capa"],
                excluir: true
            }));
        })
        firstIndex = list.find('.item-musica').first().index();
        lastIndex = list.find('.item-musica').last().index();
    });
}
