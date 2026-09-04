/**
 * MARINA YACHTING BRASIL (GÊNOVA 1878) — CAMADA DE RASTREIO
 * Google Tag Manager + dataLayer semântico do funil B2B.
 *
 * O container do GTM é o único script de tag instalado no site.
 * As tags finais (Google Ads / GA4 / Meta Pixel) são criadas dentro do painel
 * do GTM e acionadas pelos eventos publicados abaixo no dataLayer.
 *
 * >>> ÚNICO PONTO DE CONFIGURAÇÃO: a constante GTM_ID logo abaixo. <<<
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. CONFIGURAÇÃO OFICIAL
  // ==========================================================================
  const GTM_ID = "GTM-P9M8B37Z"; // Container oficial Marina Yachting Brasil

  // ==========================================================================
  // 2. BOOTSTRAP DO DATALAYER E DO CONTAINER
  // ==========================================================================
  window.dataLayer = window.dataLayer || [];

  function pushEvent(eventName, params) {
    const payload = { event: eventName };
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== null && value !== undefined && value !== "") {
          payload[key] = value;
        }
      });
    }
    window.dataLayer.push(payload);
    return payload;
  }

  function loadGTM(id) {
    if (!id || id.indexOf("GTM-") !== 0 || id === "GTM-XXXXXXX") {
      console.warn("[Marina Yachting] GTM_ID não configurado em js/tracking.js — nenhuma tag foi carregada.");
      return false;
    }
    if (document.getElementById("mkt-gtm-container")) return true;

    window.dataLayer.push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js"
    });

    const script = document.createElement("script");
    script.id = "mkt-gtm-container";
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(id);
    const first = document.getElementsByTagName("script")[0];
    first.parentNode.insertBefore(script, first);
    return true;
  }

  // ==========================================================================
  // 3. CONTEXTO DA PÁGINA E ORIGEM DE TRÁFEGO PAGO
  // ==========================================================================
  function getPageContext() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    let section = "institucional";
    if (path.indexOf("/cadastro") === 0) section = "cadastro_b2b";
    else if (path.indexOf("/private-label") === 0) section = "private_label";
    else if (path.indexOf("/lp") === 0) section = "lp_redirect";
    return { page_section: section, page_path: path };
  }

  function captureCampaign() {
    const params = new URLSearchParams(window.location.search);
    const fields = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
    let campaign = {};
    let found = false;

    fields.forEach(field => {
      const value = params.get(field);
      if (value) {
        campaign[field] = value;
        found = true;
      }
    });

    // Persiste a origem para atribuir corretamente o lead após a navegação interna
    try {
      if (found) {
        sessionStorage.setItem("my_campaign", JSON.stringify(campaign));
      } else {
        const stored = sessionStorage.getItem("my_campaign");
        if (stored) campaign = JSON.parse(stored);
      }
    } catch (err) {
      /* Navegação anônima ou storage bloqueado — segue sem persistência */
    }

    return campaign;
  }

  // ==========================================================================
  // 4. RASTREIO DE CLIQUES EM WHATSAPP (HEADER, FLUTUANTE, SALÃO, MODAL, CTA)
  // ==========================================================================
  const WA_LABELS = {
    header: "Topbar — Atendimento sob agendamento",
    floating: "Botão flutuante",
    salon: "Salão de atendimento privado",
    cta: "CTA de seção",
    modal: "Modal do mostruário",
    cadastro: "Cadastro B2B — WhatsApp liberado",
    catalogo_lote: "Consulta de lote no mostruário"
  };

  function resolveWhatsAppOrigin(el) {
    const type = el.getAttribute("data-wa-type");
    if (type) return type;
    if (el.id === "modal-whatsapp-cta") return "modal";
    if (el.id === "btn-wa-direct") return "cadastro";
    if (el.closest && el.closest(".catalog-item")) return "catalogo_lote";
    return "link_direto";
  }

  // Só o destino real conta: um link que aponta para /cadastro e rastreado como
  // navegacao, nao como contato por WhatsApp.
  function findWhatsAppTarget(node) {
    while (node && node !== document.body) {
      if (node.nodeType === 1 && node.getAttribute) {
        const href = node.getAttribute("href") || "";
        if (href.indexOf("wa.me") !== -1 || href.indexOf("api.whatsapp.com") !== -1) return node;
      }
      node = node.parentNode;
    }
    return null;
  }

  function initWhatsAppTracking() {
    document.addEventListener("click", (e) => {
      const target = findWhatsAppTarget(e.target);
      if (!target) return;

      const origin = resolveWhatsAppOrigin(target);
      const section = target.closest ? target.closest("section") : null;
      const card = target.closest ? target.closest(".catalog-item") : null;
      const itemName = card ? card.querySelector(".catalog-name") : null;

      pushEvent("whatsapp_click", {
        wa_origin: origin,
        wa_label: WA_LABELS[origin] || "Contato WhatsApp",
        wa_section: (section && section.id) || getPageContext().page_section,
        wa_text: (target.textContent || "").trim().slice(0, 80),
        item_name: itemName ? itemName.textContent.trim() : null
      });
    }, true);
  }

  // ==========================================================================
  // 5. RASTREIO DO FORMULÁRIO DE CREDENCIAMENTO (/cadastro)
  // ==========================================================================
  const FORMS = {
    "b2b-revenda-form": { name: "Ficha de credenciamento B2B", startEvent: "cadastro_start" }
  };

  function initFormTracking() {
    const started = {};

    // Primeira interação real com o formulário — permite medir abandono de funil
    document.addEventListener("focusin", (e) => {
      const form = e.target && e.target.form;
      if (!form || !FORMS[form.id] || started[form.id]) return;
      started[form.id] = true;
      pushEvent(FORMS[form.id].startEvent, {
        form_id: form.id,
        form_name: FORMS[form.id].name
      });
    }, true);
  }

  // ==========================================================================
  // 6. RASTREIO DOS CTAs DE NAVEGACAO (-> /cadastro e -> /private-label)
  // ==========================================================================
  function initCadastroCtaTracking() {
    document.addEventListener("click", (e) => {
      if (!e.target || !e.target.closest) return;

      const link = e.target.closest('a[href*="cadastro"], a[href*="private-label"]');
      if (!link) return;

      // Link de aprofundamento e conversao sao momentos distintos do funil
      const href = link.getAttribute("href") || "";
      const evento = href.indexOf("cadastro") !== -1 ? "cadastro_cta_click" : "private_label_cta_click";

      const section = link.closest("section");
      pushEvent(evento, {
        cta_id: link.getAttribute("data-cta") || link.getAttribute("data-wa-type") || "link",
        cta_section: (section && section.id) || getPageContext().page_section,
        cta_text: (link.textContent || "").trim().slice(0, 80)
      });
    }, true);
  }

  // ==========================================================================
  // 7. RASTREIO DO MOSTRUÁRIO (FILTROS E FICHA TÉCNICA)
  // ==========================================================================
  function initCatalogTracking() {
    document.addEventListener("click", (e) => {
      if (!e.target || !e.target.closest) return;

      const filterBtn = e.target.closest(".filter-btn");
      if (filterBtn) {
        pushEvent("catalog_filter", { filter_value: filterBtn.getAttribute("data-filter") });
        return;
      }

      // Botões que abrem a ficha técnica no modal (js/app.js → initModal)
      const itemTrigger = e.target.closest(".catalog-quick-view, .btn-view-details");
      if (itemTrigger) {
        const card = itemTrigger.closest(".catalog-item");
        const itemName = card ? card.querySelector(".catalog-name") : null;
        pushEvent("view_item", {
          item_id: itemTrigger.getAttribute("data-id"),
          item_name: itemName ? itemName.textContent.trim() : null,
          item_category: card ? card.getAttribute("data-category") : null
        });
      }
    }, true);
  }

  // ==========================================================================
  // 8. API PÚBLICA (consumida por js/lp-revenda.js no envio do lead)
  // ==========================================================================
  window.MYTrack = {
    push: pushEvent,
    campaign: {},
    context: {}
  };

  // ==========================================================================
  // 9. INICIALIZAÇÃO
  // ==========================================================================
  const context = getPageContext();
  const campaign = captureCampaign();

  window.MYTrack.context = context;
  window.MYTrack.campaign = campaign;

  // Contexto publicado ANTES do container para já estar disponível na primeira tag
  window.dataLayer.push({
    page_section: context.page_section,
    page_path: context.page_path,
    traffic_source: campaign.utm_source || null,
    traffic_campaign: campaign.utm_campaign || null
  });

  loadGTM(GTM_ID);

  function initListeners() {
    initWhatsAppTracking();
    initFormTracking();
    initCadastroCtaTracking();
    initCatalogTracking();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initListeners);
  } else {
    initListeners();
  }
})();
