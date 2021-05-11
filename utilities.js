const moment = require('moment')
const later = (delay, value) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(value), delay)
  })

const login = async (driver, By) => {
  // click Log in with LINE account button
  const loginButton = await driver.findElement(By.css('input[type="submit"]'))
  await loginButton.click()

  // login
  const login = await driver.findElement(By.css('input[type="text"]'))
  const password = await driver.findElement(By.css('input[type="password"]'))
  const submit = await driver.findElement(By.css('button[type="submit"]'))
  // ! CHANGE THIS
  await login.sendKeys('bsrisompong@gmail.com')
  // ! CHANGE THIS
  await password.sendKeys('b3649919')
  await submit.click()

  // return currentUrl
}

const scrollToBottom = async (driver, element) => {
  await driver.executeAsyncScript(() => {
    const callback = arguments[arguments.length - 1]
    arguments[0].scrollTo(0, arguments[0].scrollHeight)
    callback()
  }, element)
}

const scrollToTop = async (driver, element) => {
  await driver.executeAsyncScript(() => {
    const callback = arguments[arguments.length - 1]
    arguments[0].scrollTo(0, 0)
    callback()
  }, element)
}

const dateCase = async (str) => {
  console.log('str: ', str)
  switch (true) {
    case /Today/.test(str):
      // return new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })
      return moment()
    case /Yesterday/.test(str): {
      return moment().subtract(1, 'days')
    }
    case /\w{3}, \w{3,4} \d{1,3}/.test(str):
      return moment(str, 'ddd, MMM DD')
    case /\d{1,2}\/\d{2}\/\d{4}/.test(str):
      return moment(str)
    case /\d{1,2}:\d{2}.*/.test(str):
      return undefined
    default:
      return undefined
  }
}

const textToMoment = (date) => {
  console.log('date: ', date)
  let offset = 0
  switch (true) {
    case /\d{1,2}:\d{1,2}/.test(date):
      return moment(date, 'hh:mm')
    case /Yesterday/.test(date):
      return moment().subtract(1, 'days')
    case /Monday/.test(date):
      return moment().startOf('isoWeek')
    case /Tuesday/.test(date):
      offset = 1
      break
    case /Wednesday/.test(date):
      offset = 2
      break
    case /Thursday/.test(date):
      offset = 3
      break
    case /Friday/.test(date):
      offset = 4
      break
    case /Saturday/.test(date):
      offset = 5
      break
    case /Sunday/.test(date):
      offset = 6
      break
  }

  const diff = moment().diff(
    moment().startOf('isoWeek').add(offset, 'days'),
    'days'
  )
  if (diff > 0) {
    return moment().startOf('isoWeek').add(offset, 'days')
  }
  return moment().startOf('isoWeek').subtract(1, 'weeks').add(offset, 'days')
}
module.exports = {
  later,
  login,
  scrollToTop,
  scrollToBottom,
  dateCase,
  textToMoment,
}
