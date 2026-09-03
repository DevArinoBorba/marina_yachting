# Marina Yachting Brasil — Landing Page B2B (Gênova 1878)

Landing Page Institucional desenvolvida para representação B2B da marca italiana **Marina Yachting Brasil (Since 1878)**, direcionada a proprietários de alfaiatarias, ateliês de alta costura, empresários e lojistas premium.

## 🌟 Funcionalidades

- **Design System Quiet Luxury**: Cores e tipografia oficiais baseadas no Manual de Identidade Visual 2026 (*Azul Marinho Profundo, Ouro Antigo, Branco Vela, Areia*).
- **Inscrição Oficial BRASIL**: Logotipo institucional com assinatura nacional centralizada.
- **Tema Claro Minimalista & Tema Noturno**: Alternador dinâmico de temas com persistência no navegador.
- **Roteador WhatsApp Inteligente (Concierge B2B)**: Formulário inteligente que formata a mensagem com perfil do cliente, objetivo e localização antes de abrir o aplicativo.
- **Mostruário Focado em Alfaiataria e Vestuário**: Catálogo de blazers em Lã Fria 110's, Cabans/Peacoats clássicos e trajes de linho nobre, com modal de ficha técnica e consulta direta de lote via WhatsApp.
- **100% Responsivo**: Layout otimizado para desktop, tablets e smartphones.

## 🛠️ Tecnologias

- HTML5 Semântico
- Vanilla CSS3 (Design Tokens & CSS Variables)
- Vanilla JavaScript (ES6+)
- Vetor Oficial SVG
- Google Fonts (*Cormorant Garamond* & *Jost*)

## 📱 Configuração do WhatsApp

Para definir o número de WhatsApp oficial, altere a constante em `js/app.js`:

```javascript
const CONFIG = {
  whatsappNumber: "5561992078544", // (61) 9207-8544 (DDI 55 + DDD 61 + Número)
  representativeName: "Concierge Marina Yachting Brasil",
  defaultLocation: "São Paulo, SP"
};
```

## 📊 Rastreamento — Google Tag Manager (Google Ads / GA4 / Meta Pixel)

Todo o rastreio passa por **um único container do GTM**, carregado por `js/tracking.js`
nas páginas `/` e `/cadastro`. As tags finais (Google Ads, GA4 e Meta Pixel) são criadas
dentro do painel do GTM — não é preciso mexer no código para adicioná-las ou trocá-las.

### 1. Container configurado

Container oficial em produção: **`GTM-P9M8B37Z`**, definido em `js/tracking.js` (linha 18):

```javascript
const GTM_ID = "GTM-P9M8B37Z"; // Container oficial Marina Yachting Brasil
```

O carregamento do container é feito **exclusivamente** por `js/tracking.js` — o snippet
inline do `<head>` não deve ser colado no HTML, sob pena de carregar o container duas vezes.
O `<noscript>` do GTM está no início do `<body>` de `index.html` e `cadastro/index.html`;
ao trocar de container, atualize também esses dois `<iframe>`.

Se o ID for apagado ou ficar num formato inválido, nenhuma tag carrega e um aviso aparece
no console — assim o ambiente de desenvolvimento não polui os dados de produção.

### 2. Eventos disponíveis no dataLayer

| Evento              | Quando dispara                                     | Parâmetros                                              |
|---------------------|----------------------------------------------------|---------------------------------------------------------|
| `generate_lead`     | Ficha de credenciamento B2B enviada (**conversão principal**) | `lead_city`, `lead_uf`, `lead_type`, `content_name`, `utm_*` |
| `lead_b2b_submit`   | Mesmo momento — mantido por compatibilidade        | idênticos ao `generate_lead`                            |
| `whatsapp_click`    | Qualquer clique que leve ao WhatsApp               | `wa_origin`, `wa_label`, `wa_section`, `item_name`      |
| `concierge_submit`  | Envio do formulário Concierge da home              | `lead_role`, `lead_intent`, `lead_city`                 |
| `concierge_start`   | Primeira interação com o Concierge                 | `form_id`, `form_name`                                  |
| `cadastro_start`    | Primeira interação com a ficha de cadastro         | `form_id`, `form_name`                                  |
| `view_item`         | Abertura da ficha técnica no mostruário            | `item_id`, `item_name`, `item_category`                 |
| `catalog_filter`    | Uso dos filtros do mostruário                      | `filter_value`                                          |

Valores de `wa_origin`: `header`, `floating`, `salon`, `cta`, `modal`, `catalogo_lote`,
`cadastro`, `link_direto`.

Todas as páginas também publicam `page_section`, `page_path`, `traffic_source` e
`traffic_campaign` **antes** do container carregar, ficando disponíveis já no primeiro disparo.

### 3. Configurar as tags dentro do GTM

**Google Ads / GA4** — crie a tag de conversão e use um acionador do tipo
*Evento personalizado* com o nome `generate_lead`.

**Meta Pixel** — como o GTM não tem template nativo da Meta, use o template
*Facebook Pixel* da galeria da comunidade ou uma tag **HTML personalizado**:
- Tag base: acionador *All Pages* (inicialização).
- Tag de conversão `Lead`: acionador *Evento personalizado* → `generate_lead`.

> ⚠️ Não crie a tag base do Pixel no GTM **e** no HTML ao mesmo tempo — isso duplicaria
> as conversões. O fallback em `js/lp-revenda.js` já detecta a presença do GTM e se
> desativa sozinho para evitar disparo duplo.

### 4. Atribuição de campanhas

`js/tracking.js` captura `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`,
`utm_term`, `gclid` e `fbclid`, guardando-os em `sessionStorage`. Assim o lead enviado
em `/cadastro` carrega a origem mesmo que o visitante tenha entrado pela home.
A rota `/lp` repassa os parâmetros da URL no redirecionamento para `/cadastro`.

### 5. Validação

Ative o **Modo de Visualização** do GTM e percorra: home → clique em WhatsApp →
abrir ficha técnica → `/cadastro` → enviar a ficha. Cada passo deve acender o evento
correspondente da tabela acima.
