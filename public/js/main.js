let audio = new Audio();
let listaMusicas;
$.get( "/getList", function(data) {
    listaMusicas = data;

    let list = $('.flip-items');

    $.each(data,function(index){
        list.append('<li data-flip-title="' + index + '"><img src="../public/image/capas/'+index+'.jpg" class="img-capa"></li>');
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

$(document).on('click', '.flipster__item--current', function() {
    let listaMusicaArtista = $('#list'),
        artista = $(this).attr('data-flip-title');

    listaMusicaArtista.empty();

    $.each(listaMusicas[artista], function(index){
        let item = '<li class="list-group-item item-musica" data-artista="'+artista+'" data-musica="'+index+'">' +
                   '   <div class="form-row">' +
                   '        <div class="col">' +
                   '            '+index+
                   '        </div>' +
                   '        <div class="col-auto">' +
                   '            04:32' +
                   '        </div>' +
                   '        <div class="col-1">' +
                   '            <div class="progress" style="height: 5px;margin-top: 10px;">' +
                   '                <div class="progress-bar" role="progressbar" style="width: 15%" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100"></div>' +
                   '                <div class="progress-bar bg-success" role="progressbar" style="width: 30%" aria-valuenow="30" aria-valuemin="0" aria-valuemax="100"></div>' +                   
                   '            </div>' +
                   '        </div>' +
                   '   <div>' +
                   '</li>';

        listaMusicaArtista.append(item);
    });    
});

/**
 * Remove acentos de caracteres
 * @param  {String} stringComAcento [string que contem os acentos]
 * @return {String}                 [string sem acentos]
 */
function removerAcentos(newStringComAcento) {
  var string = newStringComAcento;
  var mapaAcentosHex 	= {
    a : /[\xE0-\xE6]/g,
    A : /[\xC0-\xC6]/g,
    e : /[\xE8-\xEB]/g,
    E : /[\xC8-\xCB]/g,
    i : /[\xEC-\xEF]/g,
    I : /[\xCC-\xCF]/g,
    o : /[\xF2-\xF6]/g,
    O : /[\xD2-\xD6]/g,
    u : /[\xF9-\xFC]/g,
    U : /[\xD9-\xDC]/g,
    c : /\xE7/g,
    C : /\xC7/g,
    n : /\xF1/g,
    N : /\xD1/g,
  };

  for ( var letra in mapaAcentosHex ) {
    var expressaoRegular = mapaAcentosHex[letra];
    string = string.replace( expressaoRegular, letra );
  }

  return string;
}

$(document).on('click', '.item-musica', function () {
    let artista = $(this).attr('data-artista'),
        musica = $(this).attr('data-musica');

    $.get('/playMusic?artista='+artista+'&musica='+musica, function(response){
        var audioSrc = 'data:audio/mp3;base64,' + response.fileContent;

        audio.volume = 0.1

        audio.src = audioSrc;
        audio.load();
        audio.play();
    });
});