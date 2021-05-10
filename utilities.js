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
  await login.sendKeys('bsrisompong@gmail.com')
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
module.exports = { later, login, scrollToTop, scrollToBottom, dateCase }
