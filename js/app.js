/**
 * MARINA YACHTING BRASIL (GÊNOVA 1878) - SCRIPT PRINCIPAL & ROTEADOR WHATSAPP B2B
 * Franquia & Representação Exclusiva Brasil
 * Tema Claro Minimalista (Default) + Alternador de Tema
 */

// ==========================================================================
// 1. CONFIGURAÇÕES GERAIS
// Altere o número de WhatsApp abaixo para o número oficial do franqueado (DDI + DDD + Número)
// ==========================================================================
const CONFIG = {
  whatsappNumber: "5511999999999", // EX: 5511988887777 (sem espaços, traços ou parênteses)
  representativeName: "Concierge Marina Yachting Brasil",
  defaultLocation: "São Paulo, SP"
};

// ==========================================================================
// 2. DADOS DO MOSTRUÁRIO B2B (COLEÇÃO & ALFAIATARIA)
// ==========================================================================
const CATALOG_ITEMS = [
  {
    id: "blazer-navy-classic",
    name: "Blazer Clássico Náutico Abotoamento Duplo",
    category: "blazers",
    badge: "Lã Fria 110's",
    image: "imgs/3.jpeg",
    ref: "MY-BLZ 04/NV",
    specs: {
      tecido: "100% Lã Fria 110's Italiana (Super 110's)",
      forro: "100% Cupro Bemberg respirável jacquard listrado",
      acabamentos: "Latão naval gravado com âncora clássica",
      corte: "Alfaiataria Italiana Desestruturada, ombro natural",
      disponibilidade: "Pronta-entrega em grade ou lote sob medida"
    },
    shortDesc: "O clássico naval reinterpretado com precisão sartorial italiana. Caimento nobre para ocasiões formais ou uso náutico de prestígio."
  },
  {
    id: "blazer-sand-resort",
    name: "Traje Transpassado Areia de Cabine",
    category: "blazers",
    badge: "Linho & Lã",
    image: "imgs/2.jpeg",
    ref: "MY-TRJ 02/SD",
    specs: {
      tecido: "Mix nobre de Linho Delavé e Lã Virgem Italiana",
      forro: "Meio-forro em seda natural respirável",
      acabamentos: "Madrepérola fosca / Chifre natural",
      corte: "Double-breasted contemporâneo, bolsos com portinhola",
      disponibilidade: "Lotes para alfaiatarias e multimarcas"
    },
    shortDesc: "Elegância diurna e solar com peso leve. Ideal para climas amenos e eventos executivos diurnos."
  },
  {
    id: "smoking-midnight",
    name: "Smoking Gala Noturno Marina Black Tie",
    category: "blazers",
    badge: "Exclusivo",
    image: "imgs/1.jpeg",
    ref: "MY-SMK 01/BK",
    specs: {
      tecido: "Lã Fria Pura com Lapela em Cetim de Seda",
      forro: "Seda pura personalizada Marina Yachting",
      acabamentos: "Acabamentos em cetim artesanal",
      corte: "Smoking Slim Fit estruturado com precisão artesanal",
      disponibilidade: "Mostruário exclusivo para prova no Salão"
    },
    shortDesc: "Sutileza e distinção máxima para jantares de gala, formaturas e celebrações corporativas de alto prestígio."
  },
  {
    id: "caban-peacoat",
    name: "Caban / Peacoat Náutico Italiano Estruturado",
    category: "casacos",
    badge: "Ícone Naval",
    image: "imgs/Captura de tela 2026-08-29 175224.png",
    ref: "MY-CBN 07/NV",
    specs: {
      tecido: "Lã Virgem Encorpada com trama hidrorrepelente",
      forro: "Forro térmico listrado tradicional náutico",
      acabamentos: "Gola reforçada e abotoamento transpassado",
      corte: "Peacoat marítimo atemporal, bolso embutido",
      disponibilidade: "Grade para mostruário e pronta-entrega"
    },
    shortDesc: "O clássico casaco dos oficiais de marina reinterpretado para o homem contemporâneo com tecidos nobres italianos."
  },
  {
    id: "acessorios-nauticos",
    name: "Toalha Náutica & Artigos de Iate",
    category: "acessorios",
    badge: "Lifestyle",
    image: "imgs/Captura de tela 2026-08-29 175334.png",
    ref: "MY-ACS 12/NV",
    specs: {
      tecido: "100% Algodão Egípcio felpudo de alta gramatura",
      detalhes: "Lettering bordado em alto relevo",
      acabamentos: "Bainha dupla com reforço náutico",
      uso: "Equipamento de iates, clubes náuticos e presentes corporativos",
      disponibilidade: "Lotes mínimos sob consulta"
    },
    shortDesc: "A essência marítima original traduzida em peças de lifestyle para decks, marinas e presentes corporativos."
  }
];

// ==========================================================================
// 3. INICIALIZAÇÃO DO DOM & EVENTOS
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initHeaderScroll();
  initMobileMenu();
  initConciergeForm();
  initCatalogFilters();
  initModal();
  initDirectWhatsAppButtons();
});

// --- Alternador de Tema (Claro Minimalista / Escuro) ---
function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle-btn");
  const savedTheme = localStorage.getItem("my_theme") || "light";

  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeButtonUI(savedTheme);

  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("my_theme", newTheme);
    updateThemeButtonUI(newTheme);
  });
}

function updateThemeButtonUI(theme) {
  const toggleBtn = document.getElementById("theme-toggle-btn");
  if (!toggleBtn) return;

  if (theme === "dark") {
    toggleBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
      <span>Tema Claro</span>
    `;
  } else {
    toggleBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      <span>Tema Noturno</span>
    `;
  }
}

// --- Efeito de Scroll no Header ---
function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 30) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
}

// --- Menu Mobile Toggle ---
function initMobileMenu() {
  const menuToggle = document.querySelector(".menu-toggle");
  const navMenu = document.querySelector(".nav-menu");

  if (!menuToggle || !navMenu) return;

  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    const isOpen = navMenu.classList.contains("active");
    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.innerHTML = isOpen ? "✕" : "☰";
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      menuToggle.innerHTML = "☰";
    });
  });
}

// ==========================================================================
// 4. ROTEADOR INTELIGENTE WHATSAPP (CONCIERGE B2B)
// ==========================================================================
function initConciergeForm() {
  const form = document.getElementById("concierge-form");
  const previewBox = document.getElementById("concierge-preview-text");
  
  if (!form || !previewBox) return;

  const roleInputs = form.querySelectorAll('input[name="user_role"]');
  const nameInput = document.getElementById("client_name");
  const companyInput = document.getElementById("client_company");
  const cityInput = document.getElementById("client_city");
  const intentSelect = document.getElementById("client_intent");

  function generateMessage() {
    const selectedRole = form.querySelector('input[name="user_role"]:checked')?.value || "Proprietário de Alfaiataria / Ateliê";
    const name = nameInput.value.trim() || "[Seu Nome]";
    const company = companyInput.value.trim() || "[Nome da Alfaiataria / Empresa]";
    const city = cityInput.value.trim() || "[Cidade / Estado]";
    const intent = intentSelect.value || "Agendar visita privada e apresentação de mostruário";

    let text = `Olá! Gostaria de falar com a representação oficial da Marina Yachting Brasil.\n\n`;
    text += `• Meu Perfil: ${selectedRole}\n`;
    text += `• Nome: ${name}\n`;
    text += `• Empresa / Ateliê: ${company}\n`;
    text += `• Localização: ${city}\n`;
    text += `• Objetivo: ${intent}\n\n`;
    text += `Gostaria de verificar disponibilidade para atendimento B2B.`;

    previewBox.innerText = `"${text.replace(/\n/g, ' ')}"`;
    return text;
  }

  const inputsToListen = [nameInput, companyInput, cityInput, intentSelect, ...roleInputs];
  inputsToListen.forEach(input => {
    if (input) {
      input.addEventListener("input", generateMessage);
      input.addEventListener("change", generateMessage);
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const finalMessage = generateMessage();
    const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(finalMessage)}`;
    window.open(url, "_blank");
  });

  generateMessage();
}

// ==========================================================================
// 5. FILTROS DO MOSTRUÁRIO
// ==========================================================================
function initCatalogFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const items = document.querySelectorAll(".catalog-item");

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filterValue = btn.getAttribute("data-filter");

      items.forEach(item => {
        const itemCategory = item.getAttribute("data-category");
        if (filterValue === "all" || itemCategory === filterValue) {
          item.style.display = "flex";
          setTimeout(() => item.style.opacity = "1", 20);
        } else {
          item.style.opacity = "0";
          setTimeout(() => item.style.display = "none", 150);
        }
      });
    });
  });
}

// ==========================================================================
// 6. MODAL DE FICHA TÉCNICA E DETALHES
// ==========================================================================
function initModal() {
  const modalOverlay = document.getElementById("product-modal");
  const modalClose = document.getElementById("modal-close-btn");
  const quickViewBtns = document.querySelectorAll(".catalog-quick-view, .btn-view-details");

  if (!modalOverlay) return;

  function openModal(itemId) {
    const item = CATALOG_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById("modal-img").src = item.image;
    document.getElementById("modal-img").alt = item.name;
    document.getElementById("modal-category").innerText = item.badge;
    document.getElementById("modal-title").innerText = item.name;
    document.getElementById("modal-ref").innerText = item.ref;
    document.getElementById("modal-desc").innerText = item.shortDesc;
    
    const FALLBACK_SPEC = "Sob consulta";
    document.getElementById("modal-spec-tecido").innerText = item.specs.tecido || FALLBACK_SPEC;
    document.getElementById("modal-spec-forro").innerText = item.specs.forro || FALLBACK_SPEC;
    document.getElementById("modal-spec-acabamentos").innerText = item.specs.acabamentos || FALLBACK_SPEC;
    document.getElementById("modal-spec-corte").innerText = item.specs.corte || FALLBACK_SPEC;
    document.getElementById("modal-spec-disp").innerText = item.specs.disponibilidade || FALLBACK_SPEC;

    const modalWaBtn = document.getElementById("modal-whatsapp-cta");
    if (modalWaBtn) {
      const msg = `Olá! Gostaria de consultar disponibilidade e condições do lote da peça: ${item.name} (${item.ref}) junto à Marina Yachting Brasil.`;
      modalWaBtn.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    }

    modalOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modalOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  quickViewBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const itemId = btn.getAttribute("data-id");
      openModal(itemId);
    });
  });

  if (modalClose) modalClose.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
      closeModal();
    }
  });
}

// ==========================================================================
// 7. BOTÕES DIRETOS DE WHATSAPP (HEADER, CTA, FLOATING)
// ==========================================================================
function initDirectWhatsAppButtons() {
  document.querySelectorAll("[data-wa-type]").forEach(btn => {
    const type = btn.getAttribute("data-wa-type");
    let msg = "Olá! Gostaria de mais informações sobre a representação e mostruário B2B da Marina Yachting Brasil.";

    if (type === "header") {
      msg = "Olá! Gostaria de agendar um atendimento institucional B2B com a Marina Yachting Brasil. Posso detalhar meu perfil (ateliê, marca própria ou boutique) na conversa.";
    } else if (type === "floating") {
      msg = "Olá! Tenho interesse em conhecer a coleção da Marina Yachting Brasil para o meu negócio (ateliê, marca própria ou boutique).";
    } else if (type === "salon") {
      msg = "Olá! Gostaria de solicitar um agendamento privado no salão de atendimento da Marina Yachting Brasil. Posso informar meu perfil (ateliê, marca própria ou boutique) ao confirmar o horário.";
    }

    btn.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    btn.target = "_blank";
    btn.rel = "noopener noreferrer";
  });
}
