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
  
  // Número comercial de destino do WhatsApp
  whatsappNumber: "556192078544",
  
  // Tolerância máxima de espera para envio à planilha (em milissegundos)
  timeoutMs: 4000,
  
  companyName: "Marina Yachting Brasil",
  conciergeRole: "Concierge B2B de Alfaiataria Italiana"
};

document.addEventListener('DOMContentLoaded', () => {
  initMasks();
  initCepLookup();
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
        feedbackMsg.textContent = 'Por favor, preencha todos os campos destacados para liberar o atendimento prioritário.';
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
      <span>Validando dados...</span>
    `;

    // ========================================================================
    // PREPARAÇÃO DO PAYLOAD CONFORME ESPECIFICAÇÃO
    // ========================================================================
    const ieValue = isIsento ? 'ISENTO' : (inscricao ? inscricao.value.trim() : 'ISENTO');

    const payload = {
      nome: nome.value.trim(),
      whatsapp: telefone.value.trim(),
      email: email.value.trim(),
      cnpj: cnpj.value.trim(),
      razao_social: razaoSocial.value.trim(),
      ie: ieValue,
      cep: cep.value.trim(),
      endereco: logradouro.value.trim(),
      numero: numero.value.trim(),
      complemento: complemento ? complemento.value.trim() : '',
      bairro: bairro ? bairro.value.trim() : '',
      cidade: cidade.value.trim(),
      uf: uf.value.trim()
    };

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
    // MENSAGEM PADRÃO CODIFICADA PARA O WHATSAPP
    // ========================================================================
    const whatsappMessage = `Olá! Meu nome é ${payload.nome}, da empresa ${payload.razao_social} (CNPJ: ${payload.cnpj}). Acabei de validar meus dados cadastrais no site e gostaria de atendimento comercial.`;
    const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    // ========================================================================
    // DISPARO DE EVENTOS DE CONVERSÃO (META PIXEL / GOOGLE TAG)
    // ========================================================================
    if (typeof window.fbq === 'function') {
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
    if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: 'lead_b2b_submit',
        lead_city: payload.cidade,
        lead_uf: payload.uf
      });
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
