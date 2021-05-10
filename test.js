let { Builder, By } = require('selenium-webdriver')

async function test() {
  const driver = new Builder().forBrowser('chrome').build()

  try {
    await driver.get(
      'https://askubuntu.com/questions/800/how-to-run-scripts-every-5-seconds'
    )

    const content = await driver.findElement(By.css('div#content'))
    const result = await driver.executeAsyncScript(() => {
      const callback = arguments[arguments.length - 1]
      window.scrollTo(0, arguments[0].scrollHeight)
      console.log(content)
      callback()
    }, content)
    console.log('result: ', result)
  } catch (e) {
    console.log(e)
  }
  // finally {
  //   driver.quit()
  // }
}

test()
