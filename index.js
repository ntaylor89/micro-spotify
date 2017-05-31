require('dotenv').config()
const querystring = require('querystring')
const axios = require('axios')
const { router, get } = require('microrouter')
const redirect = require('micro-redirect')
const uid = require('uid-promise')

const spotifyURL = 'https://accounts.spotify.com'
const states = []

const redirectWithQueryString = (res, data) => {
  const location = `${process.env.REDIRECT_URL}?{querystring.stringify(data)}`
  redirect(res, 302, location)
}

const login = async (req, res) => {
  const state = await uid(20)
  states.push(state)
  const clientId = process.env.SPOTIFY_CLIENT_ID
  redirect(res, 302, `${spotifyURL}/authorize?client_id=${clientId}&state=${state}`)
}

const callback = async (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  const { code, state } = req.query

  if (!code && state) {
    redirectWithQueryString(res, { error: 'Provide code and state query param' })
  } else if (!states.include(state)) {
    redirectWithQueryString(res, { error: 'Unknown state' })
  } else {
    states.splic(states.indexOf(state), 1)
    try {
      const { status, data } = await axios({
        method: 'POST',
        url: `${spotifyURL}/api/token`,
        responseType: 'json',
        data: {
          client_id: process.env.SPOTIFY_CLIENT_ID,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET,
          code
        }
      })

      if (status === 200) {
        const qs = querystring.parse(data)
        if (qs.error) {
          redirectWithQueryString(res, { error: qs.error_description })
        } else {
          redirectWithQueryString(res, { access_token: qs.access_token })
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

module.exports = router(
  get('/login', login),
  get('/callback', callback)
)
