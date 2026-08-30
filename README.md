# Marina Yachting Brasil — Landing Page B2B (Gênova 1878)

Landing Page Institucional desenvolvida para franquia e representação B2B da marca italiana **Marina Yachting Brasil (Since 1878)**, direcionada a proprietários de alfaiatarias, ateliês de alta costura, empresários e lojistas premium.

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

Para definir o número de WhatsApp do franqueado, altere a constante em `js/app.js`:

```javascript
const CONFIG = {
  whatsappNumber: "5511999999999", // DDI + DDD + Número
  representativeName: "Concierge Marina Yachting Brasil",
  defaultLocation: "São Paulo, SP"
};
```
