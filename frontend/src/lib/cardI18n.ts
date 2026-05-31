export type CardLang = "pt" | "en" | "es";

export const CARD_LANG_STORAGE_KEY = "lumina_card_lang";

const messages = {
  pt: {
    whatsapp: "WhatsApp",
    call: "Ligar",
    saveContact: "Salvar contato",
    schedule: "Agendar",
    email: "E-mail",
    linkedin: "LinkedIn",
    website: "Site",
    downloadProfile: "Baixar perfil",
    leaveContact: "Deixe seu contato",
    name: "Nome",
    emailOrWhatsapp: "E-mail ou WhatsApp — pelo menos um",
    whatsappPhone: "WhatsApp / Telefone",
    company: "Empresa",
    companyOptional: "Empresa · opcional",
    send: "Enviar",
    sending: "Enviando…",
    successMessage: "Obrigado! Entraremos em contato.",
    nameRequired: "Nome é obrigatório.",
    emailOrPhoneRequired: "Informe e-mail ou WhatsApp.",
    submitError: "Não foi possível enviar o formulário.",
    emptyCard: "Adicione telefone, e-mail ou links nas configurações do cartão.",
    whatsappGreeting: (name: string) => `Olá ${name}, recebi seu cartão.`,
    language: "Idioma",
  },
  en: {
    whatsapp: "WhatsApp",
    call: "Call",
    saveContact: "Save contact",
    schedule: "Schedule",
    email: "Email",
    linkedin: "LinkedIn",
    website: "Website",
    downloadProfile: "Download profile",
    leaveContact: "Leave your contact",
    name: "Name",
    emailOrWhatsapp: "Email or WhatsApp — at least one",
    whatsappPhone: "WhatsApp / Phone",
    company: "Company",
    companyOptional: "Company · optional",
    send: "Send",
    sending: "Sending…",
    successMessage: "Thanks! We'll be in touch.",
    nameRequired: "Name is required.",
    emailOrPhoneRequired: "Enter your email or WhatsApp number.",
    submitError: "Could not submit form",
    emptyCard: "Add phone, email or links in the card settings.",
    whatsappGreeting: (name: string) => `Hi ${name}, I got your card.`,
    language: "Language",
  },
  es: {
    whatsapp: "WhatsApp",
    call: "Llamar",
    saveContact: "Guardar contacto",
    schedule: "Agendar",
    email: "Correo",
    linkedin: "LinkedIn",
    website: "Sitio web",
    downloadProfile: "Descargar perfil",
    leaveContact: "Deja tu contacto",
    name: "Nombre",
    emailOrWhatsapp: "Correo o WhatsApp — al menos uno",
    whatsappPhone: "WhatsApp / Teléfono",
    company: "Empresa",
    companyOptional: "Empresa · opcional",
    send: "Enviar",
    sending: "Enviando…",
    successMessage: "¡Gracias! Nos pondremos en contacto.",
    nameRequired: "El nombre es obligatorio.",
    emailOrPhoneRequired: "Ingresa tu correo o número de WhatsApp.",
    submitError: "No se pudo enviar el formulario.",
    emptyCard: "Agrega teléfono, correo o enlaces en la configuración de la tarjeta.",
    whatsappGreeting: (name: string) => `Hola ${name}, recibí tu tarjeta.`,
    language: "Idioma",
  },
} as const;

export type CardMessageKey = keyof (typeof messages)["pt"];

export function parseCardLang(value: string | null | undefined): CardLang {
  const normalized = (value ?? "").toLowerCase().trim();
  if (normalized === "en" || normalized === "es") return normalized;
  return "pt";
}

export function cardT(lang: CardLang, key: CardMessageKey): string {
  const entry = messages[lang][key];
  return typeof entry === "function" ? entry("") : entry;
}

export function cardWhatsAppGreeting(lang: CardLang, name: string): string {
  return messages[lang].whatsappGreeting(name);
}

export const CARD_LANG_OPTIONS: { value: CardLang; label: string }[] = [
  { value: "pt", label: "PT" },
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
];
