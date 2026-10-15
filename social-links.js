// Add each verified https profile URL here when the official account is ready.
const socialProfiles = [
  {
    id: 'whatsapp',
    url: '',
    label: { ar: 'واتساب', en: 'WhatsApp' },
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-11.9 6.9L4 20l1.6-3.8A8 8 0 1 1 20 11.5Z"/><path d="M9 8.5c.4 2.5 2 4.1 4.5 5"/></svg>'
  },
  {
    id: 'instagram',
    url: '',
    label: { ar: 'إنستغرام', en: 'Instagram' },
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" class="social-dot"/></svg>'
  },
  {
    id: 'facebook',
    url: '',
    label: { ar: 'فيسبوك', en: 'Facebook' },
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 21v-8h3l.5-3H14V8c0-.9.4-1.5 1.6-1.5H18V4h-2.8C12.5 4 11 5.6 11 8v2H8v3h3v8Z"/></svg>'
  },
  {
    id: 'tiktok',
    url: '',
    label: { ar: 'تيك توك', en: 'TikTok' },
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4v10.2a4.2 4.2 0 1 1-3.5-4.1"/><path d="M14 4c.5 2.8 2.3 4.6 5 5"/></svg>'
  }
];

function renderSocialProfiles(language = document.documentElement.lang || 'ar') {
  document.querySelectorAll('[data-social-links]').forEach((container) => {
    container.setAttribute('aria-label', language === 'ar' ? 'حسابات التواصل الاجتماعي' : 'Social media profiles');
    container.innerHTML = socialProfiles.map((profile) => {
      let url = '';
      try {
        const parsed = new URL(profile.url);
        if (parsed.protocol === 'https:') url = parsed.href;
      } catch {}
      const label = profile.label[language];
      const state = url
        ? (language === 'ar' ? 'زيارة الحساب' : 'Visit profile')
        : (language === 'ar' ? 'قيد الإعداد' : 'Coming soon');
      const tag = url ? 'a' : 'span';
      const destination = url ? `href="${url}" target="_blank" rel="noopener noreferrer"` : 'aria-disabled="true"';
      return `<${tag} class="social-circle${url ? '' : ' is-pending'}" data-platform="${profile.id}" role="listitem" ${destination} aria-label="${label} · ${state}" title="${label} · ${state}">${profile.icon}</${tag}>`;
    }).join('');
  });
}

window.renderSocialProfiles = renderSocialProfiles;
renderSocialProfiles();
