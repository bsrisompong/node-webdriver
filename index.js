const { Builder, By, Capabilities } = require("selenium-webdriver");
const moment = require("moment");
const _ = require("lodash");
const admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const { CHAT_PATH: PATH } = require("./constant");
// const cron = require('node-cron')
const {
  later,
  login,
  scrollToTop,
  scrollToBottom,
  dateCase,
  // textToMoment,
} = require("./utilities");
const {
  store,
  storeMessage,
  // checkIsAlreadyUpdated,
  // getRoomMessages,
} = require("./firestore");
const { forEach } = require("lodash");

const chromeCapabilities = Capabilities.chrome();
chromeCapabilities.set("chromeOptions", { args: ["--headless"] });

async function test() {
  // const driver = new Builder().forBrowser('chrome').build()
  let driver = new Builder()
    .forBrowser("chrome")
    .withCapabilities(chromeCapabilities)
    .build();

  try {
    await driver.get(PATH);

    /**
     * ? LOGIN
     */
    await login(driver, By);

    // ? waiting for changing page and then find a verification code element
    await later(3000, "value");

    /**
     * ? FIND VERFICATION CODE
     */
    let isVerifing = true;
    // https://stackoverflow.com/questions/28636402/how-do-i-catch-selenium-errors-using-webdriverjs
    while (isVerifing) {
      const verificationCode = await driver.findElements(
        By.xpath('//*[@id="app"]/div/div/div/div/div/div[2]/div[1]/p[1]')
      );
      if (verificationCode.length > 0) {
        const verificationCodeText = await verificationCode.pop().getText();
        console.log("verificationCode: ", verificationCodeText);
        isVerifing = false;
      }
    }
    console.log("verified ✅");

    let isFinding = true;
    let i = 0;
    while (isFinding) {
      console.log("seaching...");
      const arr = await driver.findElements(
        By.xpath(
          "//div[@id='content-secondary']//div[contains(concat(' ', @class, ' '), 'overflow')]"
        )
      );
      await later(2000, "value");

      i++;
      if (arr.length > 0 || i > 20) isFinding = false;
    }

    /**
     * * find list-group
     */
    const contentSecondary = await driver.findElement(
      By.xpath("//div[@id='content-secondary']/div/div[2]/div[2]")
    );

    /**
     * ! scroll until ...
     */

    // ! all a tags date div
    // const latestDate = await contentSecondary.findElements(
    //   By.xpath('div/a/div[3]/div[1]')
    // )
    //div[@id='content-secondary']/div/div[2]/div[2]/div/a/div[3]/div[1]
    // const dates = await Promise.all(
    //   latestDate.map(async (date) => {
    //     const dateStr = await date.getText()
    //     console.log('dateStr: ', dateStr)
    //     return textToMoment(dateStr).format()
    //   })
    // )
    // console.log('dates: ', dates)

    // !
    // await scrollToBottom(driver, contentSecondary)

    // ? CHANGE THIS
    let startIndex = 782;

    // ! FIND TARGET ELEMENT
    // const aTags = await contentSecondary.findElements(By.css('a'))

    // all a tags inside #content-secondary
    // const aTags = await contentSecondary.findElements(By.css('a'))

    // for (const a of aTags) {
    let isWorking = true;
    while (isWorking) {
      console.log("startIndex :", startIndex);
      // break
      // ! Try with
      let a = await contentSecondary.findElements(
        By.xpath(`div/a[${startIndex}]`)
      );

      // break
      while (a.length === 0) {
        await scrollToBottom(driver, contentSecondary);
        a = await contentSecondary.findElements(
          By.xpath(`div/a[${startIndex}]`)
        );
        await later(300, "value");
      }
      const pop = a.pop();
      const user = await pop.findElement(By.css("h6"));
      const firstUserName = await user.getText();
      if (["Palm"].includes(firstUserName)) {
        startIndex++;
        continue;
      }
      const latestDate = await (
        await pop.findElement(By.xpath("div[3]/div[1]"))
      ).getText();
      console.log(latestDate);
      /**
       * TODO : latest message
       * //*[@id="content-secondary"]/div/div[2]/div[2]/div/a[1]/div[3]/div[1]
       * ? .getText()
       */

      // open #content-primary
      await user.click();
      await later(2000, "value");

      // get chatroom's id
      const currentUrl = await driver.getCurrentUrl();
      const roomId = currentUrl.split("/").pop();
      console.log("roomId: ", roomId);

      const findPrim = true;
      let operationCounter = 0;
      while (findPrim) {
        const contentPrimary = await driver.findElements(
          By.css("div.p-3.bg-white.flex-fill.overflow-y-auto")
        );
        await later(1000, "value");
        operationCounter++;
        if (contentPrimary.length > 0) break;
        if (operationCounter > 60) break;
      }

      const contentPrimary = await driver.findElement(
        By.css("div.p-3.bg-white.flex-fill.overflow-y-auto")
      );

      // ! STORE LAST MESSAGE
      // let isExisted = false
      // while (isExisted) {
      //   const lastestMessage = await contentPrimary.findElements(
      //     By.xpath(
      //       "//div[contains(@class,'chat ')][last()]//div[@data-id][last()]"
      //     )
      //   )
      //   if (lastestMessage.length > 0) isExisted = true
      // }

      // TODO : Check if already up to date
      // ! STORE LAST MESSAGE
      // const lastestMessage = await contentPrimary.findElement(
      //   By.xpath(
      //     "//div[contains(@class,'chat ')][last()]//div[@data-id][last()]"
      //   )
      // )
      // const lastestMessageId = await lastestMessage.getAttribute('data-id')
      // console.log('lastestMessageId: ', lastestMessageId)
      // const isUpdate = await checkIsAlreadyUpdated({ roomId, lastestMessageId })
      // if (isUpdate) continue

      // await getRoomMessages({ roomId })
      // ! STORE LAST MESSAGE

      let jumpOut = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // find add friend
        const result = await driver.findElements(
          By.xpath('//*[@id="content-primary"]/div[3]/div[2]/div/span')
        );
        console.log("finding first message...");
        await scrollToTop(driver, contentPrimary);
        await later(300, "value");
        jumpOut++;
        console.log("jumpOut: ", jumpOut);
        if (jumpOut >= 200) break;
        if (result.length > 0) break;
      }

      const messages = await contentPrimary.findElements(By.xpath("child::*"));
      let messageCount = messages.length;
      let prevMessageCount = undefined;
      await scrollToTop(driver, contentPrimary);
      await later(2000, "value");
      // eslint-disable-next-line no-constant-condition
      while (true) {
        prevMessageCount = messageCount;
        messageCount = (await contentPrimary.findElements(By.xpath("child::*")))
          .length;
        if (messageCount === prevMessageCount) break;
        await later(500, "value");
        await scrollToTop(driver, contentPrimary);
        await later(500, "value");
        await scrollToTop(driver, contentPrimary);
        console.log("scrolling...");
      }

      await later(2000, "value");
      // find lastest date message
      const lastestChatSys = await contentPrimary.findElement(
        By.xpath(
          "//div[contains(concat(' ', @class, ' '), ' chatsys ')][last()]/div[@class='chatsys-content']"
        )
      );
      let lastestDateText = await lastestChatSys.getText();
      if (lastestDateText.includes("They added you as a friend!")) {
        const first = await contentPrimary.findElement(
          By.xpath(
            "//div[contains(concat(' ', @class, ' '), ' chatsys ')][1]/div[@class='chatsys-content']"
          )
        );
        lastestDateText = await first.getText();
      }

      if (
        lastestDateText.includes("This user has not yet friended your account")
      ) {
        startIndex++;
        continue;
      }
      console.log("lastestDateText: ", lastestDateText);
      const lastestDateObject = await dateCase(lastestDateText);

      console.log("start scraping chat");
      // GET CHATROOM HTML
      const outerHTML = await contentPrimary.getAttribute("outerHTML");
      await store(
        {
          roomId,
          username: firstUserName,
          outerHTML,
          lastestDateObject,
          messageCount,
        },
        db
      );

      const firstChatsys = await contentPrimary.findElement(
        By.xpath('div[@class="chatsys"][1]/div')
      );
      const firstDate = await firstChatsys.getText();
      const caseResult = await dateCase(firstDate);
      let currentDate = caseResult ? caseResult : moment();
      const allMessages = await contentPrimary.findElements(
        By.xpath("child::*")
      );
      // [div.chat]

      // https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
      // * Reading in parallel
      // const allClasses = await Promise.all(
      //   allMessages.map(async (message, index) => {
      //    ...
      //   })
      // )

      // * Reading in sequence

      /**
       * @STORE_EVERY_MESSAGESSSS !!!!
       */

      const messageChunk = _.chunk(allMessages, 250);
      for (const chunk of messageChunk) {
        console.log("chunk", chunk.length);
        const batch = db.batch();
        // let i = 0
        console.log("storing chat message ...");
        for (const message of chunk) {
          const messageClasses = await message.getAttribute("class");

          /**
           * @GET_MESSAGE_TIMESTAMP
           */
          let timestamp = moment(currentDate);
          if (messageClasses.includes("chatsys")) {
            // chat system message
            const dateStr = await message
              .findElement(By.xpath("div"))
              .getText();
            const dateObj = await dateCase(dateStr);
            // update date
            if (dateObj) currentDate = dateObj;
          } else {
            // not chat system message
            const timestampSpan = await message.findElement(
              By.xpath(
                'div[@class="chat-content"]/div[@data-id][last()]//span[last()]'
              )
            );
            const t = await timestampSpan.getText();
            // console.log('timestamp : ', t)
            const [mH, mM] = t.split(":");
            currentDate.set("hour", mH);
            currentDate.set("minute", mM);
            timestamp = moment(currentDate);
            // console.log(
            //   'timestamp : ',
            //   timestamp.format('ddd, MM DD YYYY hh:mm')
            // )
          }

          /**
           * @HANDLE_MESSAGE_BY_TYPE
           */
          switch (true) {
            case messageClasses.includes("chatsys"): {
              // update current date
              const dateStr = await message
                .findElement(By.xpath("div"))
                .getText();
              const dateObj = await dateCase(dateStr);
              if (dateObj) {
                currentDate = dateObj;
              }
              // console.log(
              //   'timestamp : ',
              //   timestamp.format('ddd, MM DD YYYY hh:mm')
              // )
              break;
            }
            case messageClasses.includes("chat-reverse") &&
              messageClasses.includes("chat-secondary"): {
              // Auto-response
              break;
            }
            case messageClasses.includes("chat-reverse chat-success"): {
              /**
               * @ADMIN_MESSAGE
               */
              const children = await message.findElements(
                By.xpath('div[@class="chat-content"]/child::*')
              );

              let adminName = "";
              // [.chat-header .chat-body, ..]
              for (const child of children) {
                const c = await child.getAttribute("class");
                if (c.includes("chat-header")) {
                  adminName = await child.getText();
                }
                if (c.includes("chat-body")) {
                  // TODO : store messageId
                  const messageId = await child.getAttribute("data-id");
                  const item = await child.findElement(By.css(".chat-item"));
                  const itemClass = await item.getAttribute("class");
                  switch (true) {
                    case itemClass.includes("baloon"): {
                      // check element is exist
                      const result = await item.findElements(
                        By.css("div.chat-item-text")
                      );
                      if (result.length === 0) continue;
                      const text = await item
                        .findElement(By.css("div.chat-item-text"))
                        .getText();
                      await storeMessage(
                        {
                          roomId,
                          messageId,
                          source: {
                            type: "admin",
                            username: adminName,
                            userId: "",
                          },
                          type: "text",
                          text,
                          timestamp,
                        },
                        db,
                        batch
                      );
                      break;
                    }
                    case itemClass.includes("rounded"): {
                      const outerHTML = await item.getAttribute("outerHTML");
                      const url = outerHTML
                        .match(new RegExp('(?<=src=")https.*?(?=/preview)'))
                        .shift();
                      await storeMessage(
                        {
                          roomId,
                          messageId,
                          source: {
                            type: "admin",
                            username: adminName,
                            userId: "",
                          },
                          type: "image",
                          originalContentUrl: url,
                          timestamp,
                        },
                        db,
                        batch
                      );
                      break;
                    }
                  }
                }
              }
              break;
            }

            case !messageClasses.includes("chat-reverse") &&
              messageClasses.includes("chat-secondary"): {
              /**
               * @USER_MESSAGE
               */
              const username = await (
                await contentPrimary.findElement(By.xpath("..//h4"))
              ).getText();
              const children = await message.findElements(
                By.xpath('div[@class="chat-content"]/child::*')
              );

              // .chat-body
              for (const child of children) {
                const c = await child.getAttribute("class");
                if (c.includes("chat-body")) {
                  // TODO : store messageId
                  const messageId = await child.getAttribute("data-id");
                  const item = await child.findElement(By.css(".chat-item"));
                  const itemClass = await item.getAttribute("class");
                  switch (true) {
                    case itemClass.includes("baloon"): {
                      /**
                       * @TEXT_MESSAGE
                       */
                      const result = await item.findElements(
                        By.css("div.chat-item-text")
                      );
                      if (result.length === 0) continue;
                      const text = await item
                        .findElement(By.css("div.chat-item-text"))
                        .getText();
                      await storeMessage(
                        {
                          roomId,
                          messageId,
                          source: { type: "user", username, userId: "" },
                          type: "text",
                          text: text,
                          timestamp,
                        },
                        db,
                        batch
                      );

                      break;
                    }
                    case itemClass.includes("rounded"): {
                      /**
                       * @IMAGE_MESSAGE
                       */
                      const outerHTML = await item.getAttribute("outerHTML");
                      console.log(outerHTML);
                      if (!outerHTML) continue;
                      const isSound = outerHTML.includes(
                        "chat-item-voice-control"
                      );
                      if (isSound) {
                        await storeMessage(
                          {
                            roomId,
                            messageId,
                            source: { type: "user", username, userId: "" },
                            type: "sound",
                          },
                          db,
                          batch
                        );
                      } else {
                        const url = outerHTML
                          .match(new RegExp('(?<=src=")https.*?(?=/preview)'))
                          .shift();
                        await storeMessage(
                          {
                            roomId,
                            messageId,
                            source: { type: "user", username, userId: "" },
                            type: "image",
                            originalContentUrl: url,
                          },
                          db,
                          batch
                        );
                      }
                      // user : http
                      // console.log(username, ' : <', url, '>')
                      // console.log(timestamp.format())

                      break;
                    }
                  }
                }
              }
              break;
            }
            default:
              break;
          }
          // i++
        }
        await batch.commit();
      }

      // ! STOP
      // if (startIndex === 800) break
      startIndex++;
    }

    // const pageSource = await driver.getPageSource()
    // console.log('pageSource: ', pageSource)
    // console.log('html: ', html)
  } catch (e) {
    console.error(e);
  } finally {
    await driver.quit();
  }
}

test();
