const { send } = require('micro')
const { router, get } = require('microrouter')
const redirect = require('micro-redirect')
const fetch = require('node-fetch')
const queryString = require('query-string')
const uid = require('uid-promise')

const spotify = {
  auth_uri: 'https://accounts.spotify.com',
  redirect_uri: `${process.env.NOW_URL}/callback`,
  client_id: process.env.SPOTIFY_CLIENT_ID,
  client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  scopes: queryString.stringify(['playlist-modify-private', 'playlist-modify-public', 'user-library-read'].join(' '))
}
const states = []

const redirectWithQueryString = (res, data, uri = process.env.REDIECT_URI) => {
  const location = `${uri}?${queryString.stringify(data)}`
  redirect(res, 302, location)
}

const fetchToken = async ({ body = {}, headers = {} }) => {
  const response = await fetch(`${spotify.auth_uri}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
    body: queryString.stringify({ ...body })
  })
  const data = await response.json()
  return { status: response.status, data }
}

const login = async (req, res) => {
  const state = await uid(20)
  states.push(state)
  const { scopes, redirect_uri, client_id } = spotify
  const params = { response_type: 'code', scopes, redirect_uri, client_id }

  redirectWithQueryString(res, params, `${spotify.auth_uri}/authorize`)
}

const callback = async (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  const { code, state } = req.query

  if (!code && !state) {
    redirectWithQueryString(res, { error: 'Provide code and state query param' })
  } else if (!states.includes(state)) {
    redirectWithQueryString(res, { error: 'Unknown state' })
  } else {
    states.splice(states.indexOf(state), 1)
    try {
      const { status, data } = await fetchToken({
        body: {
          grant_type: 'authorization_code',
          client_id: spotify.client_id,
          client_secret: spotify.client_secret,
          redirect_uri: spotify.redirect_uri,
          code
        }
      })

      if (status === 200) {
        if (data.error) {
          redirectWithQueryString(res, { error: data.error_description })
        } else {
          redirectWithQueryString(res, data)
        }
      } else {
        redirectWithQueryString(res, { error: 'Spotify server error' })
      }
    } catch (err) {
      const error = 'Either SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET env variables need to be set, or Spotify is down'
      redirectWithQueryString(res, { error })
    }
  }
}

const token = async (req, res) => {
  const auth = Buffer.from(`${spotify.client_id}:${spotify.client_secret}`).toString('base64')
  const { data } = await fetchToken({
    headers: { Authorization: `Basic ${auth}` },
    body: { grant_type: 'client_credentials' }
  })

  send(res, 200, data)
}

module.exports = router(
  get('/login', login),
  get('/callback', callback),
  get('/token', token)
)
