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

function display(seconds) {
    const format = val => `0${Math.floor(val)}`.slice(-2)
    const hours = seconds / 3600
    const minutes = (seconds % 3600) / 60

    return (Math.trunc(hours) > 0 ? [hours, minutes, seconds % 60] : [minutes, seconds % 60]).map(format).join(':')
}

const CapaExiste = (capa) => new Promise((sucesso) => {
    $.get(capa, function(retorno) {
        let imagem = retorno.success ? {background: capa, case: capa} : {background: '../public/image/default/FundoPadrao.jpg', case: '../public/image/default/CapaPadrao.jpg'};
        sucesso(imagem)
    });
});

function ProximaLetra(letra) {
    let position = (alfabeto.indexOf(letra) + 1 >= alfabeto.length ? 0 : alfabeto.indexOf(letra) + 1),
        nextLetra = letra === "" ? alfabeto[1] : alfabeto[position];
    coverflow.flipster('jump', $('.' + $($('.flip-items').find('[data-letra="' + nextLetra + '"]')[0]).attr('class').split(' ')[3]));
}

function LetraAnterior(letra) {
    let position = (alfabeto.indexOf(letra) - 1 === -1 ? alfabeto.length - 1 : alfabeto.indexOf(letra) - 1),
        nextLetra = letra === "" ? alfabeto[alfabeto.length - 1] : alfabeto[position];
    coverflow.flipster('jump', $('.' + $($('.flip-items').find('[data-letra="' + nextLetra + '"]')[0]).attr('class').split(' ')[3]));
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
                    executaMusica(value["Artista"], value["Titulo"], value["Musica"], value["Duracao"], value["Tipo"], {random: true});
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
