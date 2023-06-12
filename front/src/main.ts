import './assets/base.css'

import { createApp } from 'vue'

import { createI18n } from 'vue-i18n'
import enLang from './locales/en.json'
import frLang from './locales/fr.json'
type MessageSchema = typeof enLang

const i18n = createI18n<[MessageSchema], 'en-US' | 'fr-FR'>({
  legacy: false,
  fallbackLocale: 'en',
  locale: navigator.language.split('-')[0],
  messages: {
    en: enLang,
    fr: frLang
  },
  missingWarn: false,
  fallbackWarn: false
})

import App from './App.vue'

const app = createApp(App)

app.use(i18n)
app.mount('#app')
