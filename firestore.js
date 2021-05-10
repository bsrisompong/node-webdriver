const admin = require('firebase-admin')
const moment = require('moment')
var serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})
const db = admin.firestore()

const store = async (data) => {
  const {
    roomId,
    username,
    outerHTML,
    lastDateObject,
    messageCount: latestMessageCount = 0,
  } = data
  // const roomRef = db.collection('rooms').doc(roomId)
  const roomRef = db.collection('math_rooms').doc(roomId)
  await roomRef.set({
    roomId,
    username,
    outerHTML,
    lastDateObject,
    latestMessageCount,
  })
}

const storeMessage = async (data) => {
  const { roomId, messageId } = data

  const messagesRef = db
    .collection('math_rooms')
    .doc(roomId)
    .collection('messages')
    .doc(messageId)
  await messagesRef.set({ ...data, modifiedDate: moment() })
}

const getRoomMessages = async ({ roomId }) => {
  const messagesRef = db
    .collection('math_rooms')
    .doc(roomId)
    .collection('messages')
  const message = await messagesRef.orderBy('timestamp').limit(1).get()
  console.log('message: ', message)
  const messages = await messagesRef.orderBy('timestamp').limit(3).get()
  console.log('messages: ', messages)
}

const checkIsAlreadyUpdated = async (data) => {
  const { roomId, lastMessageId: messageId } = data
  const roomRef = db.collection('math_rooms').doc(roomId)
  const roomDoc = await roomRef.get()

  if (!roomDoc.exists) {
    return false
  } else {
    const messageRef = db
      .collection('math_rooms')
      .doc(roomId)
      .collection('messages')
      .doc(messageId)
    const messageDoc = await messageRef.get()
    if (!messageDoc.exists) {
      await storeLastMessageId({ roomId, lastMessageId: messageId })
      return false
    }
    return true
  }
}

const storeLastMessageId = async (data) => {
  const { roomId, lastMessageId } = data

  console.log('store lastMessageId', data)

  const roomRef = db.collection('math_rooms').doc(roomId)
  const roomDoc = await roomRef.get()
  // const roomMessagesRef = db
  //   .collection('math_rooms')
  //   .doc(roomId)
  //   .collection('messages')
  // const lastMessage = await roomMessagesRef.orderBy('timestamp').limit(1).get()
  // console.log('lastMessagev: ', lastMessage.date())
  if (!roomDoc.exists) {
    console.log('No such document!')
  } else {
    console.log('Document data:', roomDoc.data())
    await roomRef.update({
      roomId,
      lastMessageId,
    })
  }
}
module.exports = {
  store,
  storeMessage,
  storeLastMessageId,
  getRoomMessages,
  checkIsAlreadyUpdated,
}
