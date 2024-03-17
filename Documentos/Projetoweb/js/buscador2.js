import fs from 'fs';
import cheerio from 'cheerio';
import axios from 'axios';
import urlModule from 'url';

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
    constructor(paginaInicial) {
        this.paginaInicial = paginaInicial;
        this.linksVisitados = [];
        this.pontuacoes = [];
    }

    async buscar(termo) {
        await this.analisarPagina(this.paginaInicial, termo);
        this.pontuacoes.sort(this.compararPontuacoes);
        return this.pontuacoes;
    }

    async analisarPagina(pagina, termo) {
        if (this.linksVisitados.includes(pagina)) {
            return;
        }

        this.linksVisitados.push(pagina); // Adiciona o link visitado ao array
        const pontuacaoPagina = new PontuacaoPagina();

        await this.calcularPontuacoes(pagina, termo, pontuacaoPagina);
        this.pontuacoes.push({ pagina, pontuacaoPagina });

        const links = await this.extrairLinks(pagina);
        for (const link of links) {
            await this.analisarPagina(link, termo);
        }
    }

    async calcularPontuacaoTermos(pagina, termo, pontuacaoPagina) {
        try {
            const html = await fs.promises.readFile(pagina, 'utf8');
            const regex = new RegExp(`(?<!href="[^"]*)${termo}(?![^"]*">)`, 'gi');
            const matches = html.match(regex);
    
            const frequencia = matches ? matches.length : 0;
            pontuacaoPagina.pontuacaoTermos = frequencia * 5;
        } catch (error) {
            console.error("Ocorreu um erro ao calcular a pontuação dos termos:", error);
        }
    }

    async calcularPontuacaoTags(pagina, termo, pontuacaoPagina) {
        try {
            const html = await fs.promises.readFile(pagina, 'utf8');
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

            pontuacaoPagina.pontuacaoTags = frequencia + relevancia;
        } catch (error) {
            console.error("Ocorreu um erro ao calcular a pontuação das tags:", error);
        }
    }

    async calcularPontuacaoLinks(pagina, pontuacaoPagina) {
        try {
            const html = await fs.promises.readFile(pagina, 'utf8');
            const $ = cheerio.load(html);

            let count = 0;

            $('a').each(function() {
                const link = $(this).attr('href');
                if (link && link.endsWith('.html')) {
                    count++;
                }
            });

            pontuacaoPagina.pontuacaoLinks = count * 20;
        } catch (error) {
            console.error("Ocorreu um erro ao calcular a pontuação dos links:", error);
        }
    }

    async contarAutoreferencias(pagina, pontuacaoPagina) {
        try {
            const html = await fs.promises.readFile(pagina, 'utf8');
            const $ = cheerio.load(html);

            let autoreferencias = 0;
            const paginaAtual = pagina.split('/').pop();

            $('a').each(function() {
                const link = $(this).attr('href');
                if (link && link.endsWith('.html')) {
                    const paginaLink = link.split('/').pop();
                    if (paginaAtual === paginaLink) {
                        autoreferencias++;
                    }
                }
            });

            pontuacaoPagina.autoreferencias = autoreferencias * -20;
        } catch (error) {
            console.error("Ocorreu um erro ao contar as autoreferências:", error);
        }
    }

    async calcularFrescor(pagina, pontuacaoPagina) {
        try {
            const html = await fs.promises.readFile(pagina, 'utf8');
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

            pontuacaoPagina.frescor = Math.max(30 - (5 * diferencaAnos), 0);
        } catch (error) {
            console.error("Ocorreu um erro ao calcular os pontos de frescor:", error);
        }
    }

    async extrairLinks(pagina) {
        try {
            const html = await fs.promises.readFile(pagina, 'utf8');
            const $ = cheerio.load(html);
            const links = [];
    
            $('a').each(function() {
                const link = $(this).attr('href');
                if (link) {
                    if (link.startsWith('http')) {
                        links.push(link);
                    } else {
                        const paginaAtual = pagina.split('/').slice(0, -1).join('/');
                        const linkCompleto = urlModule.resolve(paginaAtual, link);
                        links.push(linkCompleto);
                    }
                }
            });
    
            return links;
        } catch (error) {
            console.error("Ocorreu um erro ao extrair os links da página:", error);
            return [];
        }
    }

    async calcularPontuacoes(pagina, termo, pontuacaoPagina) {
        await Promise.all([
            this.calcularPontuacaoTermos(pagina, termo, pontuacaoPagina),
            this.calcularPontuacaoTags(pagina, termo, pontuacaoPagina),
            this.calcularPontuacaoLinks(pagina, pontuacaoPagina),
            this.contarAutoreferencias(pagina, pontuacaoPagina),
            this.calcularFrescor(pagina, pontuacaoPagina)
        ]);
    }

    compararPontuacoes(a, b) {
        if (a.pontuacaoPagina.pontuacaoTermos !== b.pontuacaoPagina.pontuacaoTermos) {
            return b.pontuacaoPagina.pontuacaoTermos - a.pontuacaoPagina.pontuacaoTermos;
        }
        if (a.pontuacaoPagina.frescor !== b.pontuacaoPagina.frescor) {
            return b.pontuacaoPagina.frescor - a.pontuacaoPagina.frescor;
        }
        return b.pontuacaoPagina.pontuacaoLinks - a.pontuacaoPagina.pontuacaoLinks;
    }
}

// Exemplo de utilização
const buscador = new Buscador('/home/oliveiras/Documentos/Projetoweb/index.html');
buscador.buscar('noronha')
    .then(pontuacoes => {
        pontuacoes.forEach(({ pagina, pontuacaoPagina }) => {
            console.log("Página:", pagina);
            console.log("Pontuação dos termos:", pontuacaoPagina.pontuacaoTermos);
            console.log("Pontuação das tags:", pontuacaoPagina.pontuacaoTags);
            console.log("Pontuação dos links:", pontuacaoPagina.pontuacaoLinks);
            console.log("Autoreferências:", pontuacaoPagina.autoreferencias);
            console.log("Pontuação do frescor:", pontuacaoPagina.frescor);
            console.log("-----------------------------------");
        });
    })
    .catch(error => {
        console.error("Ocorreu um erro ao buscar:", error);
    });
