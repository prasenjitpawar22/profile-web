// The craft experiments live on their own subdomain. In dev, browsers
// resolve *.localhost to 127.0.0.1, so lab.localhost:<port> works out of the box.
// next dev sets PORT to the port it actually bound (3001 if 3000 was taken).
const isDev = process.env.NODE_ENV === 'development'
const devHost = `localhost:${process.env.PORT ?? 3000}`

export const SITE_URL = isDev
  ? `http://${devHost}`
  : 'https://prasenjitpawar.com'

export const LAB_URL = isDev
  ? `http://lab.${devHost}`
  : 'https://lab.prasenjitpawar.com'
