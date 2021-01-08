var pick = array => array[Math.floor(Math.random() * array.length)];

const prettyMessage = result => {
    if (result==='405')
        return pick(['Acabaram os usos diários, sinto muito tente novamente amanha :c',
                     'Sinto muito, acabaram os usos diários... tente novamente amanha :c',
                     'Me usaram de mais hoje 😖 tente me marcar novamente amanha :c']);
    else if (result)
        return pick(['Ta na mão $resultado',
                     'Creio que seja $resultado',
                     'Fontes me dizem q seja $resultado',
                     'Acredito que $resultado',
                     'Se pá que é $resultado',
                     'ui ui $resultado',
                     'Talvez seja $resultado',
                     'Achei essa aq pacero: $resultado',
                     '$resultado eu acho',
                     '$resultado 😳',
                     '$resultado 👉👈',
                     '$resultado 😎',
                     '✨ $resultado ✨',
                     '⚡️ $resultado ⚡️',
                     '🔥👀 $resultado']).replace('$resultado', result);
    else
        return pick(['Não consegui identificar a música :(', 
                     'Desculpa, não encontrei esse audio no banco... 👉👈',
                     'Juro que procurei por 72 milhões de faixas e não encontrei essa :(',
                     'Deu ruim... não encontrei essa musica 🥺',
                     'Falhei em encontrar sua música, por favor me perdoe 😖',
                     'Esta obra de arte está alem do meu conhecimento... :c',
                     'Essa musica aparentemente não está no meu banco :c',
                     'Não consegui reconhecer essa música :c',
                     'Adorei a musica mas infelizmente não sei o nome dela :/',
                     'Uou! essa eu nao conheço 😳',
                     'Nn vou saber te dizer essa, desculpa :/']);
}

module.exports = prettyMessage;