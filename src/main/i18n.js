const https = require('https')
const raw = {
  'zh-cn': require('../i18n/简体中文.json'),
  'zh-tw': require('../i18n/繁體中文.json'),
  'de-de': require('../i18n/Deutsch.json'),
  'en-us': require('../i18n/English.json'),
  'es-mx': require('../i18n/Español.json'),
  'fr-fr': require('../i18n/Français.json'),
  'id-id': require('../i18n/Indonesia.json'),
  'it-it': require('../i18n/English.json'),
  'ja-jp': require('../i18n/日本語.json'),
  'ko-kr': require('../i18n/한국어.json'),
  'pt-br': require('../i18n/Português.json'),
  'ru-ru': require('../i18n/Pусский.json'),
  'th-th': require('../i18n/ภาษาไทย.json'),
  'vi-vn': require('../i18n/Tiếng Việt.json')

}
const config = require('./config')
const isPlainObject = require('lodash/isPlainObject')

// --- CDN i18n refresh ---
const I18N_CDN_BASE = 'https://endfield-permit-export.weikuwu.me/i18n/'

const langFileMap = {
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文',
  'de-de': 'Deutsch',
  'en-us': 'English',
  'es-mx': 'Español',
  'fr-fr': 'Français',
  'id-id': 'Indonesia',
  'it-it': 'English',
  'ja-jp': '日本語',
  'ko-kr': '한국어',
  'pt-br': 'Português',
  'ru-ru': 'Pусский',
  'th-th': 'ภาษาไทย',
  'vi-vn': 'Tiếng Việt'
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location).then(resolve, reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

let refreshPromise = null

const refreshI18nFromCDN = () => {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const fetches = Object.entries(langFileMap).map(async ([langCode, fileName]) => {
      try {
        const url = new URL(`${I18N_CDN_BASE}${fileName}.json`)
        const cdnData = await fetchJSON(url.toString())
        if (cdnData && typeof cdnData === 'object') {
          raw[langCode] = assignData(raw[langCode], cdnData)
        }
      } catch (e) {
        // Silently fail — bundled i18n is still available as fallback
      }
    })
    await Promise.all(fetches)
    prepareData()
  })()

  return refreshPromise
}

const waitForRefresh = () => refreshPromise || Promise.resolve()

// --- Core i18n logic ---

const addProp = (obj, key) => {
  if (isPlainObject(obj[key])) {
    return obj[key]
  } else if (typeof obj[key] === 'undefined') {
    let temp = {}
    obj[key] = temp
    return temp
  }
}

const parseData = (data) => {
  const result = {}
  for (let key in data) {
    let temp = result
    const arr = key.split('.')
    arr.forEach((prop, index) => {
      if (index === arr.length - 1) {
        temp[prop] = data[key]
      } else {
        temp = addProp(temp, prop)
      }
    })
  }
  return result
}

const assignData = (objA, objB) => {
  const temp = { ...objA }
  for (let key in objB) {
    if (objB[key]) {
      temp[key] = objB[key]
    }
  }
  return temp
}

const i18nMap = new Map()
const prepareData = () => {
  for (let key in raw) {
    let temp = {}
    if (key === 'zh-tw') {
      temp = assignData(raw['zh-cn'], raw[key])
    } else {
      temp = assignData(raw['zh-cn'], assignData(raw['en-us'], raw[key]))
    }
    i18nMap.set(key, parseData(temp))
  }
}

prepareData()

const parseText = (text, data) => {
  return text.replace(/(\${.+?})/g, function (...args) {
    const key = args[0].slice(2, args[0].length - 1)
    if (data[key]) return data[key]
    return args[0]
  })
}

const mainProps = [
  'symbol', 'ui', 'log', 'excel', 'uigf', 'gacha', 'char', 'wpn'
]

const i18n = new Proxy(raw, {
  get(obj, prop) {
    if (prop === 'refresh') return refreshI18nFromCDN
    if (prop === 'refreshed') return waitForRefresh
    if (prop === 'data') {
      return i18nMap.get(config.lang)
    } else if (mainProps.includes(prop)) {
      const current = i18nMap.get(config.lang)[prop]
      if (current) return current
      return i18nMap.get('en-us')[prop]
    } else if (prop === 'parse') {
      return parseText
    }
    return obj[prop]
  }
})

module.exports = i18n
