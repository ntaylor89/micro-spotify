require('dotenv').config()
const querystring = require('querystring')
const axios = require('axios')
const { router, get } = require('microrouter')
const redirect = require('micro-redirect')
const uid = require('uid-promise')

const spotifyURL = 'https://accounts.spotify.com'
const spotifyRedirectURI = `${process.env.NOW_URL}/callback`
const scopes = querystring.stringify(['playlist-modify-private', 'playlist-modify-public', 'user-library-read'].join(' '))
const states = []

const redirectWithQueryString = (res, data) => {
  const location = `${process.env.REDIRECT_URI}?${querystring.stringify(data)}`
  redirect(res, 302, location)
}

const login = async (req, res) => {
  const state = await uid(20)
  states.push(state)
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const queryParams = `client_id=${clientId}&redirect_uri=${spotifyRedirectURI}&scopes=${scopes}&response_type=code&state=${state}`
  redirect(res, 302, `${spotifyURL}/authorize?${queryParams}`)
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
      const { status, data } = await axios({
        method: 'POST',
        url: `${spotifyURL}/api/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: querystring.stringify({
          grant_type: 'authorization_code',
          redirect_uri: spotifyRedirectURI,
          client_id: process.env.SPOTIFY_CLIENT_ID,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET,
          code
        })
      })

      if (status === 200) {
        if (data.error) {
          redirectWithQueryString(res, { error: data.error_description })
        } else {
          redirectWithQueryString(res, { access_token: data.access_token })
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
