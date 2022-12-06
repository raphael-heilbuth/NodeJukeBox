const youtubeSearch = require('youtube-sr');

const retornaMusicaYoutube = (busca) => new Promise((success, reject) => {
    if (!busca) {
        success([]);
        return;
    }

    youtubeSearch.search(busca, {limit: 5})
        .then(x => {

            let listaBuscas = x.map(json => {
                return {
                    'IdMusica': json["id"],
                    'Url': json["url"],
                    'Titulo': json["title"],
                    'Duracao': json["duration"] / 1000,
                    'Capa': json["thumbnail"]["url"]
                }
            });

            success(listaBuscas);
        })
        .catch(err => reject(err));
});

module.exports = {retornaMusicaYoutube}
