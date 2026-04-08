export default async (req, context) => {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  const apiKey     = process.env.GOOGLE_API_KEY

  if (!calendarId || !apiKey) {
    return new Response(JSON.stringify({ items: [], configured: false }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const now = new Date().toISOString()
  const max = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${now}&timeMax=${max}&singleEvents=true&orderBy=startTime&maxResults=50`

  try {
    const res  = await fetch(url)
    const data = await res.json()
    return new Response(JSON.stringify({ items: data.items ?? [], configured: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch {
    return new Response(JSON.stringify({ items: [], configured: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export const config = { path: '/api/calendar' }
