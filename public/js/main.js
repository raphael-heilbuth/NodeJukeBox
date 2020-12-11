let audio = new Audio();
$.get( "/getList", function( data ) {
  loadFile();
  let list = $('.flip-items');

  $.each(data,function(index, value){
    list.append('<li data-flip-title="' + index + '"><img src="../public/image/capas/'+index+'.jpg" class="img-capa"></li>');
  });

let letraAnt = '';
let coverflow = $("#coverflow").flipster({
  style: 'carousel',    
  spacing: -0.15,
  buttons: true,
  loop: true,
  fadeIn: 0,
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
  alert($(this).attr('data-flip-title'));
});

/**
 * Remove acentos de caracteres
 * @param  {String} stringComAcento [string que contem os acentos]
 * @return {String}                 [string sem acentos]
 */
function removerAcentos( newStringComAcento ) {
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

function loadFile(){
  $.get('/playMusic?artista=Adele&musica=13. Adele - Chasing Pavements.mp3', function(response){
        var audioSrc = 'data:audio/mp3;base64,' + response.fileContent;

        audio.src = audioSrc;
        audio.load();
        audio.play();
    });

}