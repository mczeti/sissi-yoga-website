// Meldet nach jedem Produktions-Deploy alle URLs aus der Sitemap an IndexNow (Bing, Yandex, Seznam, Naver …).
// Fehler brechen den Deploy nie ab, sie werden nur geloggt.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const onSuccess = async ({ inputs, constants }) => {
  if (process.env.CONTEXT !== 'production') {
    console.log('IndexNow: kein Produktions-Deploy, übersprungen')
    return
  }

  const { key, host } = inputs
  try {
    const sitemap = await readFile(join(constants.PUBLISH_DIR, 'sitemap-0.xml'), 'utf8')
    const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList }),
    })
    console.log(`IndexNow: ${urlList.length} URLs gemeldet, Antwort ${res.status}`)
  } catch (err) {
    console.log(`IndexNow: Meldung fehlgeschlagen (${err.message})`)
  }
}
