# LMP://sys — portfolio de Lucas Michel Pereira

Site pessoal com tema tech / code / glitch, feito à mão com JavaScript puro, Canvas 2D e WebGL. Não tem build, framework nem dependências: são só arquivos estáticos.

Estudante de Ciência da Computação no Inteli, com projetos em Data Science, Engenharia de Software e Otimização para Banco PAN, Grupo Globo, Suzano e Fadel.

## O que dá para fazer com o mouse

- **Hero:** o nome é feito de pixels que o cursor empurra. Segurar o clique colapsa tudo numa esfera, e soltar explode. O fundo holográfico em WebGL se torce em volta do cursor.
- **Em qualquer lugar:** o cursor rastreia palavras e elementos com caixas azuis, e clicar racha a tela.
- **Whoami:** um terminal de verdade (digite `help`) e um donut 3D em matriz de LEDs que segue a luz do cursor.
- **Stack:** grafo de força ligando tecnologias aos projetos, com sobreposição de rastreamento.
- **Projetos:** cada monitor é uma simulação interativa do problema (k-means, telemetria com detecção de anomalias, Dijkstra até um foco de incêndio, risco de falha com SHAP). Os dados são fictícios, só para ilustrar.
- **Extras:** botão PT/EN, botão para desligar os efeitos e o konami code.

## Estrutura

```
index.html      conteúdo em português
404.html        página de "sinal perdido"
css/style.css   estilos
js/i18n.js      textos em inglês
js/core.js      estado global, loop, decodificação de texto, idioma
js/*.js         um arquivo por efeito ou seção
```

## Rodar localmente

Qualquer servidor estático serve, por exemplo:

```
python -m http.server 5173
```

Depois abra http://localhost:5173.
