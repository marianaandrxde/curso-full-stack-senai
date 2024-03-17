import fs from 'fs';
import cheerio from 'cheerio';

class Buscador {
    constructor(pagina) {
        this.pagina = pagina;
    }

    async pontuacaoLinksHtml() {
        try {
            // Lê o conteúdo do arquivo HTML
            const html = fs.readFileSync(this.pagina, 'utf8');

            // Carrega o conteúdo HTML usando Cheerio
            const $ = cheerio.load(html);

            let count = 0;

            // Seleciona todos os links <a> no documento HTML
            $('a').each(function() {
                const link = $(this).attr('href');
                // Verifica se o link termina com '.html'
                if (link && link.endsWith('.html')) {
                    count++;
                }
            });

            // Retorna a quantidade de links .html encontrados
            return count * 20;
        } catch (error) {
            console.error("Ocorreu um erro ao contar os links:", error);
            return -1; // Retorna -1 em caso de erro
        }
    }


    async contarFrequenciaTermos(termo) {
        try {
            const html = fs.readFileSync(this.pagina, 'utf8');
            const regex = new RegExp(termo, 'gi');
            const matches = html.match(regex);

            // Carrega o conteúdo HTML usando Cheerio
            const $ = cheerio.load(html);

            // Seleciona todos os links <a> no documento HTML
            const urls = [];
            $('a').each(function() {
                const link = $(this).attr('href');
                // Verifica se o link termina com '.html'
                if (link && link.endsWith('.html')) {
                    urls.push(link);
                }
            });

            // Filtra as ocorrências que estão dentro de URLs
            const filteredMatches = matches.filter(match => {
                for (const url of urls) {
                    if (match.includes(url)) {
                        return false;
                    }
                }
                return true;
            });

            const frequencia = filteredMatches ? filteredMatches.length : 0;
            return frequencia * 5; // Multiplicar o valor numérico da frequência pelo fator de multiplicação
        } catch (error) {
            console.error("Ocorreu um erro ao contar a frequência dos termos:", error);
            return 0; // Retorna 0 em caso de erro
        }
    }

    // Outros métodos omitidos para simplificação

    

    async contarFrequenciaTermosEmTags(termo) {
        try {
            const html = fs.readFileSync(this.pagina, 'utf8');
            const $ = cheerio.load(html);
        
            const regex = new RegExp(termo, 'gi');
            const matches = html.match(regex);
            const frequencia = matches ? matches.length : 0;
        
            // Contagem de tags para relevância
            let relevancia = 0;
            relevancia += $('title:contains(' + termo + ')').length * 20;
            relevancia += $('meta[content*=' + termo + ']').length * 20;
            relevancia += $('h1:contains(' + termo + ')').length * 15;
            relevancia += $('h2:contains(' + termo + ')').length * 10;
            relevancia += $('p:contains(' + termo + ')').length * 5;
            relevancia += $('a:contains(' + termo + ')').length * 2;
        
            // Retornando a soma da frequência e da relevância
            return frequencia + relevancia;
        } catch (error) {
            console.error("Ocorreu um erro ao contar a frequência dos termos:", error);
            return -1;
        }
    }

    async contarAutoreferencias() {
        try {
            const html = fs.readFileSync(this.pagina, 'utf8');
            const $ = cheerio.load(html);

            let autoreferencias = 0;

            // Seleciona todos os links <a> no documento HTML
            $('a').each(function() {
                const link = $(this).attr('href');
                // Verifica se o link termina com '.html'
                if (link && link.endsWith('.html')) {
                    // Obtém o nome do arquivo atual
                    const paginaAtual = buscador.pagina.split('/').pop();
                    // Obtém o nome do arquivo vinculado no link
                    const paginaLink = link.split('/').pop();
                    // Verifica autoreferência
                    if (paginaAtual === paginaLink) {
                        autoreferencias++;
                    }
                }
            });

            // Aplica a penalidade
            return autoreferencias * -20;
        } catch (error) {
            console.error("Ocorreu um erro ao contar as autoreferências:", error);
            return -1; // Retorna -1 em caso de erro
        }
    }

    async calcularFrescor() {
        try {
            const html = fs.readFileSync(this.pagina, 'utf8');
            const $ = cheerio.load(html);

            const dataPublicacaoStr = $('time[datetime]').attr('datetime');
            if (!dataPublicacaoStr) {
                console.error("Data de publicação não encontrada.");
                return 0;
            }

            const dataPublicacao = new Date(dataPublicacaoStr);
            const anoAtual = new Date().getFullYear();
            const anoPublicacao = dataPublicacao.getFullYear();
            const diferencaAnos = anoAtual - anoPublicacao;

            let pontosFrescor = 30 - (5 * diferencaAnos);
            return pontosFrescor > 0 ? pontosFrescor : 0;
        } catch (error) {
            console.error("Ocorreu um erro ao calcular os pontos de frescor:", error);
            return 0;
        }
    }
}

// Exemplo de utilização
const buscador = new Buscador('/home/oliveiras/Documentos/Projetoweb/index.html');
buscador.pontuacaoLinksHtml()
    .then(totalLinks => {
        if (totalLinks !== -1) {
            console.log(`Total de links .html recebidos: ${totalLinks}`);
        } else {
            console.log("Erro ao contar os links.");
        }
    });

    buscador.contarFrequenciaTermos('noronha')
    .then(frequencia => {
        console.log(`Frequência do termo:`, frequencia);
    });

    buscador.contarFrequenciaTermosEmTags('noronha')
    .then(frequencia => {
        console.log(`Frequência do termo em tags:`, frequencia);
    });

    buscador.contarAutoreferencias()
    .then(frequencia => {
        console.log(`Autoreferência:`, frequencia);
    });

    buscador.calcularFrescor()
    .then(frequencia => {
        console.log(`Frescor:`, frequencia);
    });