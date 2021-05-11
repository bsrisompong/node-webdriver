'use strict'

const express = require('express')
const querystring = require('querystring')
const { test } = require('./index')
console.log('test: ', test)

// Constants
const PORT = 8080
const HOST = '0.0.0.0'

// App
const app = express()
app.get('/', async (req, res) => {
  const { start, end } = req.query
  res.send('Hello World')

  try {
    await test({ start, end })
  } catch (e) {
    console.log(e)
  }
})

app.listen(PORT, HOST)
console.log(`Running on http://${HOST}:${PORT}`)
