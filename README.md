# `micro-spotify`

A microservice that makes authentication with Spotify to your application simple.

This app (and this README) is a slightly modified version of [micro-github](https://github.com/mxstbr/micro-github)

## Spotify Authentication

This microserver authenticates to spotify using the [Authorization Code Flow](https://developer.spotify.com/web-api/authorization-guide/#authorization-code-flow), which is outlined in [RFC-6749](https://tools.ietf.org/html/rfc6749#section-4.1).

## Setup

Using `now`:

```
# Deploy this to now.sh
now ntaylor89/micro-spotify -e SPOTIFY_CLIENT_ID=12345 -e SPOTIFY_CLIENT_SECRET=ABCDE -e REDIRECT_URI=https://my-app.com
```

### Environment Variables
You'll need to provide three environment variables when running `micro-spotify`:

```
# Your Spotify application client id
SPOTIFY_CLIENT_ID=12345

# Your Spotify application client secret
SPOTIFY_CLIENT_SECRET=ABCDE

# The URL to redirect the user to once the authentication was successful
REDIRECT_URI=https://my-app.com
```
> Create an application on Spotify [here](https://developer.spotify.com/my-applications) if you haven't done that yet.

When authentication is successful, the user is redirected to the `REDIRECT_URI` with the `access_token`
provided by spotify as a query param. You can then use this token to interact with Spotify.

## Usage

To log people in, provide a link to the url `now` provided with the login path. i.e.

```
https://path-from-now/login
```

When a user follows this link, they'll be sent to spotify to login.

If the user approves the authorizaiton, they will be send back to the `REDIRECT_URI` with the access token from Spotify.

## Error Handling

In case an error happens (either by `micro-spotify` or on Spotify) the user will be redirected to the REDIRECT_URI with the error query param set to a relevant error message.

## License

MIT

### Contributing
1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Added some new feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

Note that this repo follows [JavaScript Standard Style](http://standardjs.com/)

###Acknowledgements

99.99% of this code was copied from [micro-github](https://github.com/mxstbr/micro-github)
