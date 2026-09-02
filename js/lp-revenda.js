/**
 * MARINA YACHTING BRASIL (GÊNOVA 1878) — SCRIPT DE CONVERSÃO B2B REVENDA
 * Validação de Formulário, Busca Automática de CEP (ViaCEP) e Roteador de WhatsApp
 */

// ==========================================================================
// 1. CONFIGURAÇÃO OFICIAL
// ==========================================================================
const CONFIG = {
  // Telefone oficial: 61 9207-8544 (DDI 55 + DDD 61 + 9207-8544 -> 5561992078544)
  // Caso a conta esteja sem o 9 extra: "556192078544"
  whatsappNumber: "5561992078544",
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
      ieInput.setAttribute('readonly', 'true');
      ieInput.classList.remove('is-invalid');
      ieInput.classList.add('is-valid');
    } else {
      ieInput.value = '';
      ieInput.removeAttribute('readonly');
      ieInput.classList.remove('is-valid');
    }
  });
}

// ==========================================================================
// 5. VALIDAÇÃO E DESBLOQUEIO DO WHATSAPP
// ==========================================================================
function initFormSubmission() {
  const form = document.getElementById('b2b-revenda-form');
  const submitBtn = document.getElementById('btn-submit-step');
  const unlockedCard = document.getElementById('whatsapp-unlocked-card');
  const waDirectBtn = document.getElementById('btn-wa-direct');
  const feedbackMsg = document.getElementById('form-feedback-msg');

  if (!form || !submitBtn) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    processForm();
  });

  submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    processForm();
  });

  function processForm() {
    clearErrors();

    const nome = document.getElementById('b2b-nome');
    const telefone = document.getElementById('b2b-telefone');
    const email = document.getElementById('b2b-email');
    const cnpj = document.getElementById('b2b-cnpj');
    const razaoSocial = document.getElementById('b2b-razao');
    const inscricao = document.getElementById('b2b-inscricao');
    const cep = document.getElementById('b2b-cep');
    const logradouro = document.getElementById('b2b-logradouro');
    const numero = document.getElementById('b2b-numero');
    const complemento = document.getElementById('b2b-complemento');
    const bairro = document.getElementById('b2b-bairro');
    const cidade = document.getElementById('b2b-cidade');
    const uf = document.getElementById('b2b-uf');

    const fieldsToValidate = [
      { el: nome, min: 3, label: 'Nome do Responsável' },
      { el: telefone, min: 10, label: 'Telefone / WhatsApp' },
      { el: email, isEmail: true, label: 'E-mail' },
      { el: cnpj, min: 14, label: 'CNPJ' },
      { el: razaoSocial, min: 3, label: 'Razão Social' },
      { el: inscricao, min: 2, label: 'Inscrição Estadual' },
      { el: cep, min: 8, label: 'CEP' },
      { el: logradouro, min: 3, label: 'Endereço (Rua/Av)' },
      { el: numero, min: 1, label: 'Número' },
      { el: cidade, min: 2, label: 'Cidade' },
      { el: uf, min: 2, label: 'Estado (UF)' }
    ];

    let hasError = false;
    let firstErrorElement = null;

    fieldsToValidate.forEach((item) => {
      if (!item.el) return;
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

    // Formulário Válido!
    const leadData = {
      nome: nome.value.trim(),
      telefone: telefone.value.trim(),
      email: email.value.trim(),
      cnpj: cnpj.value.trim(),
      razaoSocial: razaoSocial.value.trim(),
      inscricao: inscricao.value.trim(),
      cep: cep.value.trim(),
      logradouro: logradouro.value.trim(),
      numero: numero.value.trim(),
      complemento: complemento ? complemento.value.trim() : '',
      bairro: bairro ? bairro.value.trim() : '',
      cidade: cidade.value.trim(),
      uf: uf.value.trim(),
      timestamp: new Date().toISOString()
    };

    // Salva no localStorage do navegador do lead
    try {
      localStorage.setItem('marina_b2b_lead', JSON.stringify(leadData));
    } catch (e) {
      console.warn('Erro ao salvar localmente:', e);
    }

    // Monta a mensagem executiva para o WhatsApp
    const compText = leadData.complemento ? ` (${leadData.complemento})` : '';
    const bairroText = leadData.bairro ? ` - ${leadData.bairro}` : '';

    const whatsappMessage = 
`*CREDENCIAMENTO B2B — MARINA YACHTING BRASIL*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Responsável:* ${leadData.nome}
🏢 *Razão Social:* ${leadData.razaoSocial}
📋 *CNPJ:* ${leadData.cnpj}
📑 *Inscrição Estadual:* ${leadData.inscricao}
📞 *Telefone/WhatsApp:* ${leadData.telefone}
✉️ *E-mail:* ${leadData.email}
📍 *Endereço:* ${leadData.logradouro}, nº ${leadData.numero}${compText}${bairroText}
🏙️ *Cidade/UF:* ${leadData.cidade}/${leadData.uf} (CEP: ${leadData.cep})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Olá! Preenchi a ficha de revenda no site e desejo receber o catálogo oficial de alfaiataria italiana e a tabela de preços atacado.`;

    const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    // Dispara eventos de Analytics para Tráfego Pago se instalados na página
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', {
        content_name: 'Credenciamento B2B Alfaiataria',
        status: true
      });
    }
    if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: 'lead_b2b_submit',
        lead_city: leadData.cidade,
        lead_uf: leadData.uf
      });
    }

    // 1. Atualiza visual do botão do formulário
    submitBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>Dados Cadastrais Validados com Sucesso</span>
    `;
    submitBtn.style.background = 'var(--c-success)';
    submitBtn.style.borderColor = 'var(--c-success)';

    // 2. Destrava o card exclusivo do WhatsApp com animação
    if (unlockedCard) {
      unlockedCard.classList.add('is-unlocked');
      unlockedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (waDirectBtn) {
      waDirectBtn.href = waUrl;
    }

    // 3. Abre automaticamente o WhatsApp após 800ms
    setTimeout(() => {
      window.open(waUrl, '_blank');
    }, 800);
  }

  function clearErrors() {
    if (feedbackMsg) {
      feedbackMsg.textContent = '';
      feedbackMsg.classList.remove('is-error');
    }
  }
}

// Recupera dados caso o visitante já tenha preenchido anteriormente
function loadSavedLeadData() {
  try {
    const raw = localStorage.getItem('marina_b2b_lead');
    if (!raw) return;
    const data = JSON.parse(raw);

    const map = {
      'b2b-nome': data.nome,
      'b2b-telefone': data.telefone,
      'b2b-email': data.email,
      'b2b-cnpj': data.cnpj,
      'b2b-razao': data.razaoSocial,
      'b2b-inscricao': data.inscricao,
      'b2b-cep': data.cep,
      'b2b-logradouro': data.logradouro,
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
  } catch (e) {
    // Silencioso em caso de localStorage desabilitado
  }
}
