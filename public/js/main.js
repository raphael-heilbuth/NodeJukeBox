let audio = new Audio();
let listaMusicas;
$.get( "/getList", function(data) {
    listaMusicas = data;

    let list = $('.flip-items');

    $.each(data,function(index){
        switch (index) {
            case 'Youtube':
            case 'TOP':
            case 'Random':
                list.append('<li data-flip-title="' + index + '"><img src="../public/image/default/'+index+'.jpg" class="img-capa" alt="capa"></li>');
                break;
            default:
                list.append('<li data-flip-title="' + index + '"><img src="../public/image/capas/'+index+'.jpg" class="img-capa" alt="capa"></li>');
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
        onItemSwitch: function(currentItem, previousItem) {
            let letra = removerAcentos($(currentItem).attr('data-flip-title').substr(0, 1));
            if (letraAnt !== letra) {
                letraAnt = letra;
                let tooltips = $('.line-cover-flow').tooltip({
                    title: letraAnt,
                    template: '<div class="tooltip tooltip-letra" role="tooltip"><div class="tooltip-inner tooltip-inner-letra"></div></div>'
                }).tooltip('show');

                setTimeout(function() {
                    tooltips.tooltip('dispose');
                }, 1000);
            }
        }
    });
});

function RetornaMusica(artista, index, duracao= null, idMusica = null, capa= null, excluir = false) {
    let item = '<li class="list-group-item item-musica ' + (excluir ? 'item-exclude' : '') + '" data-artista="' + artista + '" data-musica="' + index + '" data-id-musica="' + idMusica + '" data-capa="' + capa + '">' +
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

$(document).on('click', '.flipster__item--current', function() {
    let listaMusicaArtista = $('#list'),
        artista = $(this).attr('data-flip-title');

    listaMusicaArtista.empty();

    $.each(listaMusicas[artista], function(index){
        let item = RetornaMusica(artista, index);

        listaMusicaArtista.append(item);
    });
});

/**
 * Remove acentos de caracteres
 * @return {String}                 [string sem acentos]
 * @param newStringComAcento
 */
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

    for (let letra in mapaAcentosHex ) {
        let expressaoRegular = mapaAcentosHex[letra];
        string = string.replace( expressaoRegular, letra );
    }

    return string;
}

$(document).on('keydown', '#pesquisa-youtube', function() {
    let query = $(this).val();

    $('.item-exclude').remove();

    $.get("/buscaYoutube?busca=" + encodeURI(query),function (retornoLista){
        $.each(retornoLista, function(index, value) {
            $('#list').append(RetornaMusica('Youtube', value["Titulo"], value["Duracao"], value["IdMusica"], value["Capa"], true));
        })
    });
});

$(document).on('click', '.item-musica', function () {
    let artista = $(this).attr('data-artista'),
        musica = $(this).attr('data-musica'),
        idMusica = $(this).attr('data-id-musica'),
        imageCapa = $(this).attr('data-capa'),
        carregando = $('#music-carregando'),
        info = $('#music-info');

    info.addClass('d-none');

    switch(artista) {
        case 'Youtube':
            switch (musica) {
                case 'Pesquisar':
                    if ($('#pesquisa-youtube').length === 0) {
                        $(this).append('<input class="form-control col-auto" id="pesquisa-youtube">');
                    }
                    break;
                default:
                    carregando.removeClass('d-none');
                    info.removeClass('d-none');
                    $('.background-image').css('background-image', 'url(' + imageCapa + ')');

                    fetch("/tocaYoutube?IdMusica=" + encodeURI(idMusica))
                        .then(res => {return res.blob()})
                        .then(blob => {
                            carregando.addClass('d-none');
                            info.removeClass('d-none');

                            audio.src = URL.createObjectURL(blob);
                            audio.volume = 0.1

                            audio.load();
                            audio.play();
                        })
                    break;
            }
            break;
        default:
            $.get('/playMusic?artista='+artista+'&musica='+musica, function(response){
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
                }
            });
            break;
    }
});

audio.addEventListener('timeupdate', () => {
    $('#music-bar').width(((audio.currentTime * 100) / audio.duration) + '%');
    $('#music-time').html(display(audio.currentTime) + '/' + display(audio.duration));
});

audio.addEventListener('ended', () => {
    $('#music-info').addClass('d-none');
});

audio.addEventListener('volumechange', () => {
    alert(audio.volume);
});

function display (seconds) {
    const format = val => `0${Math.floor(val)}`.slice(-2)
    const hours = seconds / 3600
    const minutes = (seconds % 3600) / 60

    return ( Math.trunc(hours) > 0 ? [hours, minutes, seconds % 60] : [minutes, seconds % 60]).map(format).join(':')
  }


        var context = new AudioContext();
        var src = context.createMediaElementSource(audio);
        var analyser = context.createAnalyser();

        var canvas = document.getElementById("canvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        var ctx = canvas.getContext("2d");

        src.connect(analyser);
        analyser.connect(context.destination);

        analyser.fftSize = 256;

        var bufferLength = analyser.frequencyBinCount;
        console.log(bufferLength);

        var dataArray = new Uint8Array(bufferLength);

        var WIDTH = canvas.width;
        var HEIGHT = canvas.height;

        var barWidth = (WIDTH / bufferLength) * 2.5;
        var barHeight;
        var x = 0;

        function renderFrame() {
            requestAnimationFrame(renderFrame);

            x = 0;

            analyser.getByteFrequencyData(dataArray);
            ctx.fillStyle = "rgb(255,255,255)";

            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            for (var i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];

                var r = barHeight + (25 * (i/bufferLength));
                var g = 250 * (i/bufferLength);
                var b = 50;

                ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
                ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        }
        renderFrame();