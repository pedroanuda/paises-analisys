const tableBody = document.querySelector(".tabela-container > table > tbody");
const feedback = document.querySelector(".feedback");
const dialogo = document.querySelector(".dialogo");
const dialogoTitle = document.querySelector(".dialogo .dialogo__title");
const dialogoContent = document.querySelector(".dialogo .dialogo__conteudo");
const dialogoButton = document.querySelector(".dialogo .fechar-dialogo");
const searchInput = document.getElementById("pesquisa");
const searchFor = document.getElementById("search_for");
const orderBy = document.getElementById("order_by");
let searchTiming = null;
let searchedCountries = null;
let countries = null;

carregarTabela();

dialogoButton.onclick = () => dialogo.close();

searchInput.addEventListener("input", e => {
    if (countries) {
        clearTimeout(searchTiming);
        searchTiming = setTimeout(() => pesquisarPais(searchFor.value, e.target.value), 500);
    }
});

searchFor.addEventListener("change", e => {
    if (searchInput.value.trim() != "" && countries) pesquisarPais(e.target.value, searchInput.value);
});

orderBy.addEventListener("change", e => {
    if (countries) {
        const configuration = e.target.value.split("_");
    
        countries = ordenarPaises(configuration[0], configuration[1], countries);
        if (searchedCountries) {
            searchedCountries = ordenarPaises(configuration[0], configuration[1], searchedCountries);
            atualizarTabela(searchedCountries);
        } else atualizarTabela(countries);
    }
});


async function carregarTabela() {
    feedback.innerHTML = "Carregando..."

    try {
        countries = await (await fetch("https://restcountries.com/v3.1/all")).json();
        feedback.innerHTML = "";
        countries = ordenarPaises("nome", "crescente", countries);
        atualizarTabela(countries);
        feedback.style.display = "none";
    } catch (e) {
        feedback.innerHTML = `Não foi possível carregar os dados.
        <button class="try-again" onclick="carregarTabela()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.99988C16.9706 2.99988 21 7.02931 21 11.9999C21 16.9704 16.9706 20.9999 12 20.9999C7.02944 20.9999 3 16.9704 3 11.9999C3 9.17261 4.30367 6.64983 6.34267 4.99988" stroke="var(--cor-texto, #fff)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
            <path d="M3 4.49988H7V8.49988" stroke="var(--cor-texto, #fff)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
        </svg>
            Tentar Novamente
        </button>`;
    }
}


function atualizarTabela(paises) {
    tableBody.innerHTML = "";

    if (paises) paises.forEach(country => {
        tableBody.innerHTML += `
        <tr>
            <td class="bandeira-tabela"><img alt="${country.flags.alt}" src="${country.flags.svg}"></td>
            <td>${pegarNome(country)}</td>
            <td>${country.capital
                ? country.capital.length > 1
                ? gerarBotaoDialogo("Ver", `Capitais do(a) ${pegarNome(country)}`, listar(country.capital))
                : country.capital[0]
                : "Não há"}</td>
            <td>${country.area.toLocaleString()}km²</td>
            <td>${country.population ? country.population.toLocaleString() : "Não há"}</td>
            <td>${country.currencies 
                ? Object.values(country.currencies).length > 1
                ? gerarBotaoDialogo("Ver", `Moedas do(a) ${pegarNome(country)}`, pegarMoedas(country.currencies).join("<br>"))
                : pegarMoedas(country.currencies)[0]
                : "Não há"}</td>
            <td>${country.continents[0]}</td>
            <td>${country.gini ? Object.values(country.gini)[0].toLocaleString() : "N/A"}</td>
            <td>${country.languages
                ? Object.values(country.languages).length > 1
                ? gerarBotaoDialogo("Ver", `Idiomas do(a) ${pegarNome(country)}`, listar(Object.values(country.languages)))
                : Object.values(country.languages)[0]
                : "Não há"}</td>
            <td>${country.borders
                ? gerarBotaoDialogo("Ver", `Fronteiras do(a) ${pegarNome(country)}`, listar(country.borders, true))
                : "Não há"}</td>
            <td>${country.timezones.length > 1
                ? gerarBotaoDialogo("Ver", `Fuso Horários do(a) ${pegarNome(country)}`, listar(country.timezones))
                : country.timezones[0]}</td>
        </tr>
        `
    })
}


/**
 * Toma o meio de pesquisa e qual será a pesquisa, e assim a faz.
 * Ou seja, faz uma cópia do array de {@link countries} com a pesquisa e atualiza a tabela.
 * 
 * @param {'nome' | 'capital' | 'moeda' | 'continente' | 'idioma' | 'fronteiras'} meioDePesquisa Pelo que será pesquisado.
 * @param {string} pesquisa O que será pesquisado.
 */
function pesquisarPais(meioDePesquisa, pesquisa) {
    let novosPaises = null;
    if (pesquisa.trim() === "") {
        atualizarTabela(countries);
        searchedCountries = null;
        return;
    }

    /**
     * Normaliza e retorna uma string, ou seja, retorna a mesma string sem acentos, minúscula etc.
     * 
     * @param {string} string String a ser normalizada.
     */
    const normalizarString = (string) => {
        return string
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim().toLowerCase();
    }

    switch (meioDePesquisa) {
        case "nome":
            novosPaises = countries.filter(country => 
                normalizarString(pegarNome(country))
                .includes(normalizarString(pesquisa)));
            break;
        case "capital":
            novosPaises = countries.filter(country =>
                country.capital
                ? normalizarString(country.capital[0])
                  .includes(normalizarString(pesquisa))
                : false)
            break;
        case "moeda":
            novosPaises = countries.filter(country =>
            country.currencies
            ? normalizarString(pegarMoedas(country.currencies).join(" "))
              .includes(normalizarString(pesquisa))
            : false)
            break;
        case 'continente':
            novosPaises = countries.filter(country =>
            normalizarString(country.continents[0])
            .includes(normalizarString(pesquisa)))
            break;
        case "idioma":
            novosPaises = countries.filter(country =>
            country.languages
            ? normalizarString(listar(Object.values(country.languages), false, true))
              .includes(normalizarString(pesquisa))
            : false)
            break;
        case "fronteiras":
            novosPaises = countries.filter(country =>
            country.borders
            ? normalizarString(listar(country.borders, true, false))
              .includes(normalizarString(pesquisa))
            : false)
        default:
            break;
    }

    searchedCountries = novosPaises;
    atualizarTabela(novosPaises);
}

/**
 * @param {'nome' | 'area' | 'populacao' | 'gini'} metodo Pelo que será ordenado.
 * @param {'crescente' | 'decrescente'} ordem Como será ordenado.
 * @param {{}} paises Os países que serão ordenados.
 */
function ordenarPaises(metodo, ordem, paises) {
    switch (metodo) {
        case "nome":
            if (ordem === "crescente")
            return paises.sort((a, b) => pegarNome(a).localeCompare(pegarNome(b)));
            else
            return paises.sort((a, b) => pegarNome(b).localeCompare(pegarNome(a)));
        case "area":
            if (ordem === "crescente")
            return paises.sort((a, b) => a.area - b.area);
            else
            return paises.sort((a, b) => b.area - a.area);
        case "populacao":
            if (ordem === "crescente")
            return paises.sort((a, b) => a.population - b.population);
            else
            return paises.sort((a, b) => b.population - a.population);
        case "gini":
            if (ordem === "crescente")
            return paises.sort((a, b) => {
                if (!a.gini) return -1;
                else if (!b.gini) return 1;
                return Object.values(a.gini)[0] - Object.values(b.gini)[0];
            });
            else
            return paises.sort((a, b) => {
                if (!a.gini) return 1;
                else if (!b.gini) return -1;
                return Object.values(b.gini)[0] - Object.values(a.gini)[0];
            });
    }
}


/**
 * Função geral, que recebe um Array e retorna os itens listados.
 * Pode servir para converter siglas cca3 de países etc.
 * Se desejado, a listagem não precisa ter pontuação e retorna os itens apenas com espaços entre eles.
 * 
 * @param {Array<string>} lista A lista que será listada.
 * @param {?boolean} ehFronteiras Por padrão, falso. Se verdadeiro, verifica as siglas cca3 e as converte.
 * @param {?boolean} pontuacao Por padrão, verdadeiro. Quando verdadeiro, coloca vírgulas e um ponto final.
 * 
 * @returns {string} A string contendo a listagem do jeito desejado.
 */
function listar(lista, ehFronteiras, pontuacao) {
    let finalString = "";
    if (ehFronteiras) lista = lista.map(fronteira => pegarNome(fronteira));

    if (pontuacao || Object.is(pontuacao, undefined)) finalString = lista.join(", ") + ".";
    else finalString = lista.join(" ");

    return finalString;
    
}


/**
 * Gera uma string que contém o elemento HTML de um botão, do qual abre um dialogo
 * com a função {@link abrirDialogo}.
 * 
 * @param {string} textoBotao Texto que aparecerá no botão, como "Ver".
 * @param {string} tituloDialogo Titulo do diálogo que aparecerá. Por exemplo, "Fronteiras do Brasil".
 * @param {string} conteudoDialogo O conteúdo principal do diálogo, que é o que interessa ao usuário.
 */
function gerarBotaoDialogo(textoBotao, tituloDialogo, conteudoDialogo) {
    return `<button class="botao-tabela" onclick="abrirDialogo('${tituloDialogo}', '${conteudoDialogo}')">
    ${textoBotao}</button>`
}


function abrirDialogo(titulo, conteudo) {
    dialogoTitle.innerHTML = titulo;
    dialogoContent.innerHTML = conteudo;
    dialogo.showModal();
}


/**
 * Pega o objeto que contém as moedas da api, e separa a informação em strings.
 * Retorna um Array que contém todas as strings, já que nem sempre há apenas uma moeda.
 * 
 * @param {{}} moedasObjeto Objeto contendo as moedas usadas no país.
 * @returns {string[]}
 */
function pegarMoedas(moedasObjeto) {
    let lista = Object.entries(moedasObjeto);
    let novaLista = [];

    lista.forEach(moeda =>
    novaLista.push(`${moeda[0]} - ${moeda[1].name}${moeda[1].symbol ? " (" + moeda[1].symbol + ")" : ""}`));

    return novaLista;
}


/**
 * Pega o objeto de um país ou uma string cca3 e retorna o nome do país especificado em Português.
 * 
 * @param {{cca3: string, translations: {por: {common: string}}} | string} pais String cca3 ou objeto de um país.
 * @returns {string}
 */
function pegarNome(pais) {
    if (pais.length === 3) {
        return countries.find(country => country.cca3 === pais).translations.por.common;
    } else return pais.translations.por.common;
}
