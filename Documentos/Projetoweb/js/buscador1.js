import fs from 'fs';
import cheerio from 'cheerio';

class PontuacaoPagina {
    constructor() {
        this.pontuacaoTermos = 0;
        this.pontuacaoTags = 0;
        this.pontuacaoLinks = 0;
        this.autoreferencias = 0;
        this.frescor = 0;
    }
}

class Buscador {
    constructor(pagina) {
        this.pagina = pagina;
        this.pontuacaoPagina = new PontuacaoPagina();
    }

    async calcularPontuacaoTermos(termo) {
        try {
            const html = fs.readFileSync(this.pagina, 'utf8');
            const regex = new RegExp(`(?<!href="[^"]*)${termo}(?![^"]*">)`, 'gi');
            const matches = html.match(regex);
    
            const frequencia = matches ? matches.length : 0;
            this.pontuacaoPagina.pontuacaoTermos = frequencia * 5;
        } catch (error) {
            console.error("Ocorreu um erro ao calcular a pontuação dos termos:", error);
        }
    }
    // Outros métodos omitidos para simplificação


    async calcularPontuacaoTags(termo) {
        try {
            const html = fs.readFileSync(this.pagina, 'utf8');
            const $ = cheerio.load(html);

            const regex = new RegExp(termo, 'gi');
            const matches = html.match(regex);
            const frequencia = matches ? matches.length : 0;

            let relevancia = 0;
            relevancia += $('title:contains(' + termo + ')').length * 20;
            relevancia += $('meta[content*=' + termo + ']').length * 20;
            relevancia += $('h1:contains(' + termo + ')').length * 15;
            relevancia += $('h2:contains(' + termo + ')').length * 10;
            relevancia += $('p:contains(' + termo + ')').length * 5;
            relevancia += $('a:contains(' + termo + ')').length * 2;

            this.pontuacaoPagina.pontuacaoTags = frequencia + relevancia;
        } catch (error) {
            console.error("Ocorreu um erro ao calcular a pontuação das tags:", error);
        }
    }

    async calcularPontuacaoLinks() {
        try {
            const html = fs.readFileSync(this.pagina, 'utf8');
            const $ = cheerio.load(html);

            let count = 0;

            $('a').each(function() {
                const link = $(this).attr('href');
                if (link && link.endsWith('.html')) {
                    count++;
                }
            });

            this.pontuacaoPagina.pontuacaoLinks = count * 20;
        } catch (error) {
            console.error("Ocorreu um erro ao calcular a pontuação dos links:", error);
        }
    }

    async contarAutoreferencias() {
        try {
            const html = fs.readFileSync(this.pagina, 'utf8');
            const $ = cheerio.load(html);

            let autoreferencias = 0;
            const paginaAtual = this.pagina.split('/').pop();

            $('a').each(function() {
                const link = $(this).attr('href');
                if (link && link.endsWith('.html')) {
                    const paginaLink = link.split('/').pop();
                    if (paginaAtual === paginaLink) {
                        autoreferencias++;
                    }
                }
            });

            this.pontuacaoPagina.autoreferencias = autoreferencias * -20;
        } catch (error) {
            console.error("Ocorreu um erro ao contar as autoreferências:", error);
        }
    }

    async calcularFrescor() {
        try {
            const html = fs.readFileSync(this.pagina, 'utf8');
            const $ = cheerio.load(html);

            const dataPublicacaoStr = $('time[datetime]').attr('datetime');
            if (!dataPublicacaoStr) {
                console.error("Data de publicação não encontrada.");
                return;
            }

            const dataPublicacao = new Date(dataPublicacaoStr);
            const anoAtual = new Date().getFullYear();
            const anoPublicacao = dataPublicacao.getFullYear();
            const diferencaAnos = anoAtual - anoPublicacao;

            this.pontuacaoPagina.frescor = Math.max(30 - (5 * diferencaAnos), 0);
        } catch (error) {
            console.error("Ocorreu um erro ao calcular os pontos de frescor:", error);
        }
    }

    async calcularPontuacoes(termo) {
        await Promise.all([
            this.calcularPontuacaoTermos(termo),
            this.calcularPontuacaoTags(termo),
            this.calcularPontuacaoLinks(),
            this.contarAutoreferencias(),
            this.calcularFrescor()
        ]);
    }
}

// Exemplo de utilização
const buscador = new Buscador('/home/oliveiras/Documentos/Projetoweb/index.html');
buscador.calcularPontuacoes('noronha')
    .then(() => {
        const pontuacao = buscador.pontuacaoPagina;
        console.log("Pontuação dos termos:", pontuacao.pontuacaoTermos);
        console.log("Pontuação das tags:", pontuacao.pontuacaoTags);
        console.log("Pontuação dos links:", pontuacao.pontuacaoLinks);
        console.log("Autoreferências:", pontuacao.autoreferencias);
        console.log("Pontuação do frescor:", pontuacao.frescor);
    });


    // Funciona perfeito até a questão 2