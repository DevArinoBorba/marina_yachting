/**
 * MARINA YACHTING BRASIL (GÊNOVA 1878) — SCRIPT DE CONVERSÃO B2B REVENDA
 * Validação de Formulário, Busca Automática de CEP (ViaCEP), Integração Google Sheets e Roteador de WhatsApp
 */

// ==========================================================================
// 1. CONFIGURAÇÃO OFICIAL
// ==========================================================================
const CONFIG = {
  // Endpoint do Google Apps Script para gravação em tempo real na planilha
  endpointUrl: "https://script.google.com/macros/s/AKfycbw8tgRcKfLjuPfJOqz-t1kZEFIy2zQv5khAeQCv3eQQ_rMiyev81OAAul37kLUMMFhC4g/exec",
  
  // Número comercial de destino: (61) 9 9207-8544 — DDI 55 + DDD 61 + nono dígito.
  // Mantido idêntico ao de js/app.js; sem o nono dígito o link do WhatsApp não abre conversa.
  whatsappNumber: "5561992078544",
  
  // Tolerância máxima de espera para envio à planilha (em milissegundos)
  timeoutMs: 4000,

  // Consulta pública de CNPJ na Receita Federal (BrasilAPI, sem chave de acesso)
  cnpjEndpoint: "https://brasilapi.com.br/api/cnpj/v1/",
  cnpjTimeoutMs: 8000,      // limite da consulta em segundo plano
  cnpjEsperaEnvioMs: 3000,  // quanto o envio aguarda por uma consulta ainda pendente
  
  companyName: "Marina Yachting Brasil",
  conciergeRole: "Concierge B2B de Alfaiataria Italiana"
};

document.addEventListener('DOMContentLoaded', () => {
  initMasks();
  initCepLookup();
  initCnpjLookup();
  initInscricaoEstadualCheckbox();
  initFormSubmission();
  loadSavedLeadData();
});

// ==========================================================================
// 2. MÁSCARAS DE ENTRADA (CNPJ, TELEFONE, CEP)
// ==========================================================================
function initMasks() {
  const cnpjInput = document.getElementById('b2b-cnpj');
  const telInput = document.getElementById('b2b-telefone');
  const cepInput = document.getElementById('b2b-cep');

  // Máscara CNPJ: 00.000.000/0000-00
  if (cnpjInput) {
    cnpjInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 14) v = v.slice(0, 14);

      if (v.length > 12) {
        v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})$/, '$1.$2.$3/$4-$5');
      } else if (v.length > 8) {
        v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})$/, '$1.$2.$3/$4');
      } else if (v.length > 5) {
        v = v.replace(/^(\d{2})(\d{3})(\d{1,3})$/, '$1.$2.$3');
      } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{1,3})$/, '$1.$2');
      }
      e.target.value = v;
    });
  }

  // Máscara Telefone: (00) 00000-0000 ou (00) 0000-0000
  if (telInput) {
    telInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);

      if (v.length > 10) {
        // Celular 9 dígitos: (11) 98765-4321
        v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      } else if (v.length > 6) {
        // Fixo ou digitando: (11) 8765-4321
        v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
      } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
      }
      e.target.value = v;
    });
  }

  // Máscara CEP: 00000-000
  if (cepInput) {
    cepInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 8) v = v.slice(0, 8);
      if (v.length > 5) {
        v = v.replace(/^(\d{5})(\d{1,3})$/, '$1-$2');
      }
      e.target.value = v;
    });
  }
}

// ==========================================================================
// 3. CONSULTA AUTOMÁTICA DE CEP (VIACEP API)
// ==========================================================================
function initCepLookup() {
  const cepInput = document.getElementById('b2b-cep');
  const spinner = document.getElementById('cep-spinner');
  const feedback = document.getElementById('cep-feedback');

  const logradouroInput = document.getElementById('b2b-logradouro');
  const bairroInput = document.getElementById('b2b-bairro');
  const cidadeInput = document.getElementById('b2b-cidade');
  const ufInput = document.getElementById('b2b-uf');
  const numeroInput = document.getElementById('b2b-numero');

  if (!cepInput) return;

  const performLookup = async () => {
    const rawCep = cepInput.value.replace(/\D/g, '');
    if (rawCep.length !== 8) return;

    if (spinner) spinner.classList.add('is-active');
    if (feedback) {
      feedback.textContent = 'Localizando endereço da empresa...';
      feedback.classList.add('is-visible');
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        if (feedback) {
          feedback.textContent = 'CEP não encontrado. Por favor, preencha o endereço manualmente.';
          feedback.style.color = 'var(--c-error)';
        }
      } else {
        if (logradouroInput) logradouroInput.value = data.logradouro || '';
        if (bairroInput) bairroInput.value = data.bairro || '';
        if (cidadeInput) cidadeInput.value = data.localidade || '';
        if (ufInput) ufInput.value = data.uf || '';

        if (feedback) {
          feedback.textContent = `Endereço localizado: ${data.localidade} - ${data.uf}`;
          feedback.style.color = 'var(--c-success)';
        }

        // Foca automaticamente no campo de número
        if (numeroInput && !numeroInput.value) {
          numeroInput.focus();
        }
      }
    } catch (err) {
      console.warn('Falha ao consultar CEP:', err);
      if (feedback) {
        feedback.textContent = 'Não foi possível buscar automaticamente. Preencha manualmente.';
        feedback.style.color = 'var(--c-error)';
      }
    } finally {
      if (spinner) spinner.classList.remove('is-active');
    }
  };

  cepInput.addEventListener('blur', performLookup);
  cepInput.addEventListener('keyup', (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw.length === 8) {
      performLookup();
    }
  });
}

// ==========================================================================
// 3B. CONSULTA DE CNPJ (BRASIL API) — ENRIQUECE O LEAD NA PLANILHA
// A ficha pede só quatro campos; razão social e endereço são buscados na
// Receita em segundo plano, enquanto o visitante termina de preencher.
// ==========================================================================

// Estado compartilhado com o envio do formulário
const CNPJ_STATE = {
  consulta: null,   // Promise em andamento
  dados: null,      // resultado já resolvido
  documento: ''     // CNPJ (só dígitos) que originou a consulta
};

// Dígito verificador: descarta erro de digitação antes de chamar a API
function isCnpjValido(raw) {
  const c = (raw || '').replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;

  const calcularDigito = (base) => {
    let peso = base.length === 12 ? 5 : 6;
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return calcularDigito(c.slice(0, 12)) === Number(c[12]) &&
         calcularDigito(c.slice(0, 13)) === Number(c[13]);
}

async function consultarCnpj(documento) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.cnpjTimeoutMs);

  try {
    const resposta = await fetch(`${CONFIG.cnpjEndpoint}${documento}`, { signal: controller.signal });

    if (resposta.status === 404) return { erro: 'nao_encontrado' };
    if (!resposta.ok) return { erro: 'indisponivel' };

    const dados = await resposta.json();
    const situacao = (dados.descricao_situacao_cadastral || '').toUpperCase();

    return {
      ativa: situacao === 'ATIVA',
      situacao: situacao || 'NAO INFORMADA',
      razao_social: dados.razao_social || '',
      nome_fantasia: dados.nome_fantasia || '',
      cep: dados.cep || '',
      endereco: [dados.descricao_tipo_de_logradouro, dados.logradouro].filter(Boolean).join(' ').trim(),
      numero: dados.numero || '',
      complemento: dados.complemento || '',
      bairro: dados.bairro || '',
      cidade: dados.municipio || '',
      uf: dados.uf || '',
      atividade: dados.cnae_fiscal_descricao || '',
      porte: dados.porte || '',
      abertura: dados.data_inicio_atividade || ''
    };
  } catch (err) {
    // Timeout, offline ou bloqueio: falha técnica nunca reprova o lead
    return { erro: 'indisponivel' };
  } finally {
    clearTimeout(timeout);
  }
}

function initCnpjLookup() {
  const cnpjInput = document.getElementById('b2b-cnpj');
  const spinner = document.getElementById('cnpj-spinner');
  const feedback = document.getElementById('cnpj-feedback');

  if (!cnpjInput) return;

  const mostrar = (texto, cor) => {
    if (!feedback) return;
    feedback.textContent = texto;
    feedback.style.color = cor;
    feedback.classList.toggle('is-visible', !!texto);
  };

  const disparar = () => {
    const documento = cnpjInput.value.replace(/\D/g, '');
    if (documento.length !== 14 || documento === CNPJ_STATE.documento) return;

    if (!isCnpjValido(documento)) {
      CNPJ_STATE.documento = documento;
      CNPJ_STATE.dados = { erro: 'digito_invalido' };
      CNPJ_STATE.consulta = null;
      mostrar('CNPJ inválido. Confira os números digitados.', 'var(--c-error)');
      return;
    }

    CNPJ_STATE.documento = documento;
    CNPJ_STATE.dados = null;
    if (spinner) spinner.classList.add('is-active');
    mostrar('Consultando dados da empresa...', 'var(--c-gold-hover)');

    CNPJ_STATE.consulta = consultarCnpj(documento).then((resultado) => {
      CNPJ_STATE.dados = resultado;
      if (spinner) spinner.classList.remove('is-active');

      if (resultado.erro === 'nao_encontrado') {
        mostrar('CNPJ não localizado na Receita Federal.', 'var(--c-error)');
      } else if (resultado.erro) {
        // Sem conseguir consultar, o cadastro segue normalmente
        mostrar('', '');
      } else if (!resultado.ativa) {
        mostrar(`Situação cadastral: ${resultado.situacao}. É necessário CNPJ ativo.`, 'var(--c-error)');
      } else {
        const nome = resultado.razao_social || resultado.nome_fantasia;
        mostrar(nome ? `${nome} · ${resultado.cidade}/${resultado.uf}` : 'CNPJ ativo confirmado.', 'var(--c-success)');
      }
      return resultado;
    });
  };

  cnpjInput.addEventListener('input', disparar);
  cnpjInput.addEventListener('blur', disparar);
}

// ==========================================================================
// 4. CHECKBOX DE INSCRIÇÃO ESTADUAL ISENTO
// ==========================================================================
function initInscricaoEstadualCheckbox() {
  const checkbox = document.getElementById('b2b-isento');
  const ieInput = document.getElementById('b2b-inscricao');

  if (!checkbox || !ieInput) return;

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      ieInput.value = 'ISENTO';
      ieInput.disabled = true;
      ieInput.classList.remove('is-invalid');
      ieInput.classList.add('is-valid');
    } else {
      ieInput.value = '';
      ieInput.disabled = false;
      ieInput.classList.remove('is-valid');
    }
  });
}

// ==========================================================================
// 5. VALIDAÇÃO, GOOGLE SHEETS E REDIRECIONAMENTO WHATSAPP
// ==========================================================================
function initFormSubmission() {
  const form = document.getElementById('b2b-revenda-form');
  const submitBtn = document.getElementById('btn-submit-step');
  const unlockedCard = document.getElementById('whatsapp-unlocked-card');
  const waDirectBtn = document.getElementById('btn-wa-direct');
  const feedbackMsg = document.getElementById('form-feedback-msg');

  if (!form || !submitBtn) return;

  let isSubmitting = false;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isSubmitting) processForm();
  });

  submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isSubmitting) processForm();
  });

  async function processForm() {
    clearErrors();

    const val = (el) => (el && typeof el.value === 'string') ? el.value.trim() : '';

    const nome = document.getElementById('b2b-nome');
    const telefone = document.getElementById('b2b-telefone');
    const email = document.getElementById('b2b-email');
    const cnpj = document.getElementById('b2b-cnpj');
    const razaoSocial = document.getElementById('b2b-razao');
    const inscricao = document.getElementById('b2b-inscricao');
    const isentoCheckbox = document.getElementById('b2b-isento');
    const cep = document.getElementById('b2b-cep');
    const logradouro = document.getElementById('b2b-logradouro');
    const numero = document.getElementById('b2b-numero');
    const complemento = document.getElementById('b2b-complemento');
    const bairro = document.getElementById('b2b-bairro');
    const cidade = document.getElementById('b2b-cidade');
    const uf = document.getElementById('b2b-uf');

    const isIsento = isentoCheckbox ? isentoCheckbox.checked : false;

    const fieldsToValidate = [
      { el: nome, min: 3, label: 'Nome do Responsável' },
      { el: telefone, min: 10, label: 'Telefone / WhatsApp' },
      { el: email, isEmail: true, label: 'E-mail' },
      { el: cnpj, min: 14, label: 'CNPJ' },
      { el: razaoSocial, min: 3, label: 'Razão Social' },
      { el: inscricao, min: isIsento ? 0 : 2, label: 'Inscrição Estadual', skip: isIsento },
      { el: cep, min: 8, label: 'CEP' },
      { el: logradouro, min: 3, label: 'Endereço (Rua/Av)' },
      { el: numero, min: 1, label: 'Número' },
      { el: cidade, min: 2, label: 'Cidade' },
      { el: uf, min: 2, label: 'Estado (UF)' }
    ];

    let hasError = false;
    let firstErrorElement = null;

    fieldsToValidate.forEach((item) => {
      if (!item.el || item.skip) return;
      const rawVal = item.el.value.trim();
      let isValid = true;

      if (item.isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(rawVal)) isValid = false;
      } else if (item.min) {
        const digitsOrChars = rawVal.replace(/\D/g, '').length || rawVal.length;
        if (rawVal.length < item.min) isValid = false;
      }

      if (!isValid) {
        hasError = true;
        item.el.classList.add('is-invalid');
        item.el.classList.remove('is-valid');
        if (!firstErrorElement) firstErrorElement = item.el;
      } else {
        item.el.classList.remove('is-invalid');
        item.el.classList.add('is-valid');
      }
    });

    if (hasError) {
      if (feedbackMsg) {
        feedbackMsg.textContent = 'Confira os campos destacados para concluir o cadastro.';
        feedbackMsg.classList.add('is-error');
      }
      if (firstErrorElement) {
        firstErrorElement.focus();
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // ========================================================================
    // BLOQUEIO DE CLIQUE DUPLO & FEEDBACK VISUAL
    // ========================================================================
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="lp-btn-spinner"></span>
      <span>Enviando cadastro...</span>
    `;

    // ========================================================================
    // SITUAÇÃO CADASTRAL DO CNPJ (BRASIL API)
    // A consulta costuma já ter terminado enquanto o visitante preenchia os
    // outros campos; se ainda estiver correndo, aguarda um instante por ela.
    // ========================================================================
    const documentoAtual = val(cnpj).replace(/\D/g, '');

    if (CNPJ_STATE.consulta && CNPJ_STATE.documento === documentoAtual && !CNPJ_STATE.dados) {
      await Promise.race([
        CNPJ_STATE.consulta,
        new Promise((resolve) => setTimeout(resolve, CONFIG.cnpjEsperaEnvioMs))
      ]);
    }

    const receita = (CNPJ_STATE.documento === documentoAtual) ? CNPJ_STATE.dados : null;

    // Só reprova quando a Receita respondeu: falha de rede ou consulta pendente
    // jamais barra um lead legítimo.
    const reprovado =
      (!isCnpjValido(documentoAtual) && 'O CNPJ informado é inválido. Confira os números digitados.') ||
      (receita && receita.erro === 'nao_encontrado' && 'CNPJ não localizado na Receita Federal. Confira o número.') ||
      (receita && !receita.erro && !receita.ativa &&
        `Este CNPJ consta como ${receita.situacao} na Receita Federal. O credenciamento exige CNPJ ativo.`);

    if (reprovado) {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>Quero receber a tabela de preços</span>
      `;
      if (feedbackMsg) {
        feedbackMsg.textContent = reprovado;
        feedbackMsg.classList.add('is-error');
      }
      if (cnpj) {
        cnpj.classList.add('is-invalid');
        cnpj.classList.remove('is-valid');
        cnpj.focus();
      }
      return;
    }

    // ========================================================================
    // PREPARAÇÃO DO PAYLOAD CONFORME ESPECIFICAÇÃO
    // ========================================================================
    // A landing de captação pede quatro campos; razão social e endereço vem da
    // consulta a Receita. As chaves seguem completas para preservar as colunas
    // já existentes na planilha do Google Sheets.
    const ieValue = isIsento ? 'ISENTO' : val(inscricao);

    // O campo digitado sempre tem prioridade; a Receita preenche o que ficou vazio
    const daReceita = (receita && !receita.erro) ? receita : {};
    const ou = (digitado, consultado) => digitado || consultado || '';

    const payload = {
      nome: val(nome),
      whatsapp: val(telefone),
      email: val(email),
      cnpj: val(cnpj),
      razao_social: ou(val(razaoSocial), daReceita.razao_social),
      ie: ieValue,
      cep: ou(val(cep), daReceita.cep),
      endereco: ou(val(logradouro), daReceita.endereco),
      numero: ou(val(numero), daReceita.numero),
      complemento: ou(val(complemento), daReceita.complemento),
      bairro: ou(val(bairro), daReceita.bairro),
      cidade: ou(val(cidade), daReceita.cidade),
      uf: ou(val(uf), daReceita.uf)
    };

    // Campos extras da Receita. Só aparecem na planilha depois que as colunas
    // correspondentes forem mapeadas no Apps Script; até lá são ignorados.
    if (daReceita.razao_social) {
      payload.nome_fantasia = daReceita.nome_fantasia || '';
      payload.situacao_cadastral = daReceita.situacao || '';
      payload.atividade_principal = daReceita.atividade || '';
      payload.porte = daReceita.porte || '';
    }

    // Salva localmente em cache para conveniência do usuário
    try {
      localStorage.setItem('marina_b2b_lead', JSON.stringify({
        ...payload,
        razaoSocial: payload.razao_social,
        telefone: payload.whatsapp,
        inscricao: payload.ie,
        logradouro: payload.endereco,
        timestamp: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }

    // ========================================================================
    // MENSAGEM EXECUTIVA PARA O WHATSAPP
    // Monta somente com os campos preenchidos: a landing curta envia três deles,
    // e uma ficha completa continua produzindo a mensagem inteira.
    // ========================================================================
    const SEPARADOR = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    const linhas = ['*CREDENCIAMENTO B2B — MARINA YACHTING BRASIL*', SEPARADOR];

    const add = (rotulo, valor) => {
      if (valor) linhas.push(`${rotulo} ${valor}`);
    };

    add('👤 *Responsável:*', payload.nome);
    add('🏢 *Razão Social:*', payload.razao_social);
    add('📋 *CNPJ:*', payload.cnpj);
    add('📑 *Inscrição Estadual:*', payload.ie);
    add('📞 *WhatsApp:*', payload.whatsapp);
    add('✉️ *E-mail:*', payload.email);

    if (payload.endereco) {
      const numText = payload.numero ? `, nº ${payload.numero}` : '';
      const compText = payload.complemento ? ` (${payload.complemento})` : '';
      const bairroText = payload.bairro ? ` - ${payload.bairro}` : '';
      add('📍 *Endereço:*', `${payload.endereco}${numText}${compText}${bairroText}`);
    }
    if (payload.cidade || payload.uf) {
      const ufText = payload.uf ? `/${payload.uf}` : '';
      const cepText = payload.cep ? ` (CEP: ${payload.cep})` : '';
      add('🏙️ *Cidade/UF:*', `${payload.cidade}${ufText}${cepText}`);
    }

    linhas.push(SEPARADOR);
    linhas.push('Olá! Preenchi a ficha de credenciamento no site e desejo receber a tabela de preços de atacado e o catálogo oficial.');

    const whatsappMessage = linhas.join('\n');

    const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    // ========================================================================
    // DISPARO DA CONVERSÃO PRINCIPAL VIA GOOGLE TAG MANAGER
    // As tags de Google Ads / GA4 / Meta Pixel são acionadas pelo evento
    // "generate_lead" configurado no painel do GTM (ver js/tracking.js).
    // ========================================================================
    const campaign = (window.MYTrack && window.MYTrack.campaign) || {};

    const leadData = {
      lead_city: payload.cidade,
      lead_uf: payload.uf,
      lead_type: 'credenciamento_lojista',
      content_name: 'Credenciamento B2B Alfaiataria',
      content_category: 'Atacado B2B',
      utm_source: campaign.utm_source || null,
      utm_medium: campaign.utm_medium || null,
      utm_campaign: campaign.utm_campaign || null
    };

    if (window.MYTrack && typeof window.MYTrack.push === 'function') {
      window.MYTrack.push('generate_lead', leadData);
      // Mantido por compatibilidade com gatilhos/relatórios já criados no GTM
      window.MYTrack.push('lead_b2b_submit', leadData);
    } else if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: 'generate_lead', ...leadData });
      window.dataLayer.push({ event: 'lead_b2b_submit', ...leadData });
    }

    // Fallback: só dispara direto caso o Pixel exista fora do GTM (evita duplicidade)
    if (typeof window.fbq === 'function' && !window.google_tag_manager) {
      try {
        window.fbq('track', 'Lead', {
          content_name: 'Credenciamento B2B Alfaiataria',
          content_category: 'Atacado B2B',
          status: true
        });
      } catch (err) {
        console.warn('Erro ao disparar Meta Pixel:', err);
      }
    }

    // ========================================================================
    // ENVIO POST GOOGLE APPS SCRIPT COM TIMEOUT RACE (MÁXIMO 4s)
    // ========================================================================
    const sendToGoogleSheets = async () => {
      try {
        await fetch(CONFIG.endpointUrl, {
          method: 'POST',
          mode: 'no-cors', // Obrigatório para evitar bloqueios de CORS no Google Apps Script
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Erro ao enviar dados para a planilha Google:', err);
      }
    };

    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, CONFIG.timeoutMs));

    // Aguarda a gravação no Sheets ou o tempo limite de 4 segundos para não travar a jornada do lead
    await Promise.race([sendToGoogleSheets(), timeoutPromise]);

    // ========================================================================
    // ATUALIZAÇÃO VISUAL E REDIRECIONAMENTO IN-APP
    // ========================================================================
    submitBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>Redirecionando para o WhatsApp...</span>
    `;
    submitBtn.style.background = 'var(--c-success)';
    submitBtn.style.borderColor = 'var(--c-success)';

    if (unlockedCard) {
      unlockedCard.classList.add('is-unlocked');
    }
    if (waDirectBtn) {
      waDirectBtn.href = waUrl;
    }

    // Redirecionamento direto via window.location.href (compatível com navegadores in-app)
    window.location.href = waUrl;
  }

  function clearErrors() {
    if (feedbackMsg) {
      feedbackMsg.textContent = '';
      feedbackMsg.classList.remove('is-error');
    }
  }
}

// ==========================================================================
// 6. RECUPERAÇÃO AUTOMÁTICA DE DADOS PREENCHIDOS ANTERIORMENTE
// ==========================================================================
function loadSavedLeadData() {
  try {
    const raw = localStorage.getItem('marina_b2b_lead');
    if (!raw) return;
    const data = JSON.parse(raw);

    const map = {
      'b2b-nome': data.nome,
      'b2b-telefone': data.whatsapp || data.telefone,
      'b2b-email': data.email,
      'b2b-cnpj': data.cnpj,
      'b2b-razao': data.razao_social || data.razaoSocial,
      'b2b-inscricao': data.ie || data.inscricao,
      'b2b-cep': data.cep,
      'b2b-logradouro': data.endereco || data.logradouro,
      'b2b-numero': data.numero,
      'b2b-complemento': data.complemento,
      'b2b-bairro': data.bairro,
      'b2b-cidade': data.cidade,
      'b2b-uf': data.uf
    };

    Object.keys(map).forEach((id) => {
      const el = document.getElementById(id);
      if (el && data && map[id]) {
        el.value = map[id];
      }
    });

    if (data.ie === 'ISENTO' || data.inscricao === 'ISENTO') {
      const isentoCb = document.getElementById('b2b-isento');
      const ieInput = document.getElementById('b2b-inscricao');
      if (isentoCb) isentoCb.checked = true;
      if (ieInput) {
        ieInput.value = 'ISENTO';
        ieInput.disabled = true;
      }
    }
  } catch (e) {
    // Silencioso em caso de localStorage bloqueado
  }
}
