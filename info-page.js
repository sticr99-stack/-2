const languageButton = document.querySelector('[data-language-toggle]');

function setInfoLanguage(language) {
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-language]').forEach((element) => {
    element.hidden = element.dataset.language !== language;
  });
  languageButton.textContent = language === 'ar' ? 'English' : 'العربية';
  languageButton.setAttribute('aria-label', language === 'ar' ? 'Switch language to English' : 'تغيير اللغة إلى العربية');
  document.querySelector('#infoNav').setAttribute('aria-label', language === 'ar' ? 'معلومات الموقع' : 'Site information');
  document.querySelector('#infoIndex').setAttribute('aria-label', language === 'ar' ? 'أقسام المعلومات' : 'Information sections');
  document.querySelector('.info-page .brand').setAttribute('aria-label', language === 'ar' ? 'اليماني تك - الصفحة الرئيسية' : 'Al-Yamani Tech home');
  const sectionTitles = {
    about: ['about-title', 'about-title-en'],
    contact: ['contact-title', 'contact-title-en'],
    privacy: ['privacy-title', 'privacy-title-en'],
    terms: ['terms-title', 'terms-title-en']
  };
  Object.entries(sectionTitles).forEach(([sectionId, titles]) => {
    document.querySelector(`#${sectionId}`).setAttribute('aria-labelledby', titles[language === 'ar' ? 0 : 1]);
  });
  window.renderSocialProfiles(language);
}

languageButton.addEventListener('click', () => {
  setInfoLanguage(document.documentElement.lang === 'ar' ? 'en' : 'ar');
});
