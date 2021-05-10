const { Builder, By, Capabilities } = require('selenium-webdriver')
const moment = require('moment')
const { CHAT_PATH: PATH } = require('./constant')
// const cron = require('node-cron')
const {
  later,
  login,
  scrollToTop,
  scrollToBottom,
  dateCase,
} = require('./utilities')
const {
  store,
  storeMessage,
  checkIsAlreadyUpdated,
  getRoomMessages,
} = require('./firestore')

const chromeCapabilities = Capabilities.chrome()
chromeCapabilities.set('chromeOptions', { args: ['--headless'] })

async function test() {
  // const driver = new Builder().forBrowser('chrome').build()
  let driver = new Builder()
    .forBrowser('chrome')
    .withCapabilities(chromeCapabilities)
    .build()

  try {
    await driver.get(PATH)

    // LOGIN
    await login(driver, By)

    // waiting for changing page and then find a verification code element
    await later(3000, 'value')

    const elements = await driver.findElements(
      By.xpath('//*[@id="app"]/div/div/div/div/div/div[2]/div[1]/p[1]')
    )

    let isVerifing = true
    if (elements.length > 0) {
      const verificationCode = await elements.pop().getText()
      console.log('verificationCode: ', verificationCode)
    } else {
      isVerifing = false
    }

    // check
    // https://stackoverflow.com/questions/28636402/how-do-i-catch-selenium-errors-using-webdriverjs
    while (isVerifing) {
      const found = await driver.findElements(
        By.xpath('//*[@id="app"]/div/div/div/div/div/div[2]/div[1]/p[1]')
      )
      if (found.length === 0) break
      await later(5000, 'value')
    }
    console.log('verified ✅')

    let isFinding = true
    let i = 0
    while (isFinding) {
      console.log('seaching...')
      const arr = await driver.findElements(
        By.xpath(
          "//div[@id='content-secondary']//div[contains(concat(' ', @class, ' '), 'overflow')]"
        )
      )
      await later(2000, 'value')

      i++
      if (arr.length > 0 || i > 20) isFinding = false
    }

    // find list-group
    // const contentSecondary = await driver.findElement(
    //   By.css('div#content-secondary')
    // )
    // const contentSecondary = await contentSecondary.findElement(
    //   By.css('div.flex-fill.overflow-y-auto')
    // )
    const contentSecondary = await driver.findElement(
      By.xpath("//div[@id='content-secondary']/div/div[2]/div[2]")
    )
    // const listGroup = await contentSecondary.findElement(By.css('div.list-group'))

    // all a tags inside #content-secondary
    const aTags = await contentSecondary.findElements(By.css('a'))

    for (const a of aTags) {
      // ! Try with
      const firstUser = await a.findElement(By.css('h6'))
      const firstUserName = await firstUser.getText()
      console.log('username : ', firstUserName)

      await scrollToBottom(driver, contentSecondary)
      await driver.executeAsyncScript(() => {
        const callback = arguments[arguments.length - 1]
        arguments[0].scrollTo(0, arguments[0].scrollHeight)
        callback()
      }, contentSecondary)

      // open #content-primary
      await firstUser.click()
      await later(2000, 'value')

      // get chatroom's id
      const currentUrl = await driver.getCurrentUrl()
      const roomId = currentUrl.split('/').pop()
      console.log('roomId: ', roomId)

      const contentPrimary = await driver.findElement(
        By.css('div.p-3.bg-white.flex-fill.overflow-y-auto')
      )

      // TODO : Check if already up to date
      // ! STORE LAST MESSAGE
      const lastMessage = await contentPrimary.findElement(
        By.xpath(
          "//div[contains(@class,'chat ')][last()]//div[@data-id][last()]"
        )
      )
      const lastMessageId = await lastMessage.getAttribute('data-id')
      console.log('lastMessageId: ', lastMessageId)
      await checkIsAlreadyUpdated({ roomId, lastMessageId })
      await getRoomMessages({ roomId })

      const messages = await contentPrimary.findElements(By.xpath('child::*'))
      let messageCount = messages.length
      let prevMessageCount = undefined
      await scrollToTop(driver, contentPrimary)
      await later(2000, 'value')
      // eslint-disable-next-line no-constant-condition
      while (true) {
        prevMessageCount = messageCount
        messageCount = (await contentPrimary.findElements(By.xpath('child::*')))
          .length
        if (messageCount === prevMessageCount) break
        await later(500, 'value')
        await scrollToTop(driver, contentPrimary)
        await later(500, 'value')
      }

      // find last date message
      const lastChatSys = await contentPrimary.findElement(
        By.xpath(
          "//div[contains(concat(' ', @class, ' '), ' chatsys ')][last()]/div[@class='chatsys-content']"
        )
      )
      let lastDateText = await lastChatSys.getText()
      if (lastDateText.includes('They added you as a friend!')) {
        const first = await contentPrimary.findElement(
          By.xpath(
            "//div[contains(concat(' ', @class, ' '), ' chatsys ')][1]/div[@class='chatsys-content']"
          )
        )
        lastDateText = await first.getText()
      }
      console.log('lastDateText: ', lastDateText)
      const lastDateObject = await dateCase(lastDateText)

      console.log('start scraping chat')
      // GET CHATROOM HTML
      const outerHTML = await contentPrimary.getAttribute('outerHTML')
      await store({
        roomId,
        username: firstUserName,
        outerHTML,
        lastDateObject,
        messageCount,
      })

      const firstChatsys = await contentPrimary.findElement(
        By.xpath('div[@class="chatsys"][1]/div')
      )
      const firstDate = await firstChatsys.getText()
      const caseResult = await dateCase(firstDate)
      let currentDate = caseResult ? caseResult : moment()
      const allMessages = await contentPrimary.findElements(
        By.xpath('child::*')
      )
      // [div.chat]

      // https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
      // * Reading in parallel
      // const allClasses = await Promise.all(
      //   allMessages.map(async (message, index) => {
      //    ...
      //   })
      // )

      // * Reading in sequence
      for (const message of allMessages) {
        const messageClasses = await message.getAttribute('class')

        let timestamp = moment(currentDate)
        if (messageClasses.includes('chatsys')) {
          const dateStr = await message.findElement(By.xpath('div')).getText()
          const dateObj = await dateCase(dateStr)
          // update date
          if (dateObj) currentDate = dateObj
        } else {
          const timestampSpan = await message.findElement(
            By.xpath(
              'div[@class="chat-content"]/div[@data-id][last()]//span[last()]'
            )
          )
          const t = await timestampSpan.getText()
          console.log('t: ', t)
          const [mH, mM] = t.split(':')
          currentDate.set('hour', mH)
          currentDate.set('minute', mM)
          timestamp = moment(currentDate)
          console.log('timestamp : ', timestamp.format('hh:mm'))
        }

        // *
        switch (true) {
          case messageClasses.includes('chatsys'): {
            // update current date
            const dateStr = await message.findElement(By.xpath('div')).getText()
            const dateObj = await dateCase(dateStr)
            if (dateObj) {
              currentDate = dateObj
            }
            // console.log({ currentDate, dateObj, dateStr })
            break
          }
          case messageClasses.includes('chat-reverse') &&
            messageClasses.includes('chat-secondary'): {
            // Auto-response
            break
          }
          case messageClasses.includes('chat-reverse chat-success'): {
            // ! ------- ADMIN ------- ! //
            const children = await message.findElements(
              By.xpath('div[@class="chat-content"]/child::*')
            )

            let adminName = ''
            // [.chat-header .chat-body, ..]
            for (const child of children) {
              const c = await child.getAttribute('class')
              if (c.includes('chat-header')) {
                adminName = await child.getText()
              }
              if (c.includes('chat-body')) {
                // TODO : store messageId
                const messageId = await child.getAttribute('data-id')
                // console.log('messageId: ', messageId)
                const item = await child.findElement(By.css('.chat-item'))
                const itemClass = await item.getAttribute('class')
                switch (true) {
                  case itemClass.includes('baloon'): {
                    const text = await item
                      .findElement(By.css('div.chat-item-text'))
                      .getText()
                    await storeMessage({
                      roomId,
                      messageId,
                      source: {
                        type: 'admin',
                        username: adminName,
                        userId: '',
                      },
                      type: 'text',
                      text,
                      timestamp,
                    })
                    console.log(adminName, '(Admin) : ', text)
                    console.log(timestamp.format('hh:mm'))
                    break
                  }
                  case itemClass.includes('rounded'): {
                    const outerHTML = await item.getAttribute('outerHTML')
                    const url = outerHTML
                      .match(new RegExp('(?<=src=")https.*?(?=/preview)'))
                      .shift()
                    await storeMessage({
                      roomId,
                      messageId,
                      source: {
                        type: 'admin',
                        username: adminName,
                        userId: '',
                      },
                      type: 'image',
                      originalContentUrl: url,
                      timestamp,
                    })
                    console.log(adminName, '(Admin) : ', url)
                    console.log(timestamp.format('hh:mm'))
                    break
                  }
                }
              }
            }
            break
          }

          case !messageClasses.includes('chat-reverse') &&
            messageClasses.includes('chat-secondary'): {
            // ! ------- USER ------- ! //
            const username = await (
              await contentPrimary.findElement(By.xpath('..//h4'))
            ).getText()
            const children = await message.findElements(
              By.xpath('div[@class="chat-content"]/child::*')
            )

            // .chat-body
            for (const child of children) {
              const c = await child.getAttribute('class')
              if (c.includes('chat-body')) {
                // TODO : store messageId
                const messageId = await child.getAttribute('data-id')
                const item = await child.findElement(By.css('.chat-item'))
                const itemClass = await item.getAttribute('class')
                switch (true) {
                  case itemClass.includes('baloon'): {
                    const text = await item
                      .findElement(By.css('div.chat-item-text'))
                      .getText()
                    await storeMessage({
                      roomId,
                      messageId,
                      source: { type: 'user', username, userId: '' },
                      type: 'text',
                      text: text,
                      timestamp,
                    })
                    // user : ข้อนี้ทำยังไงค่ะ
                    console.log(username, ' : ', text)
                    console.log(timestamp.format('hh:mm'))

                    break
                  }
                  case itemClass.includes('rounded'): {
                    const outerHTML = await item.getAttribute('outerHTML')
                    const url = outerHTML
                      .match(new RegExp('(?<=src=")https.*?(?=/preview)'))
                      .shift()
                    await storeMessage({
                      roomId,
                      messageId,
                      source: { type: 'user', username, userId: '' },
                      type: 'image',
                      originalContentUrl: url,
                    })
                    // user : http
                    console.log(username, ' : <', url, '>')
                    console.log(timestamp.format('hh:mm'))

                    break
                  }
                }
              }
            }
            break
          }
          default:
            break
        }
      }
    }

    // console.log('outerHTML: ', outerHTML)
    // console.log('allClasses: ', allClasses)
    // const pageSource = await driver.getPageSource()
    // console.log('pageSource: ', pageSource)
    // console.log('html: ', html)
  } catch (e) {
    console.error(e)
  } finally {
    await driver.quit()
  }
}

test()
