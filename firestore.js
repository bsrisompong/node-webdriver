const moment = require('moment')
// const admin = require('firebase-admin')
// var serviceAccount = require('./serviceAccountKey.json')

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// })

// ! CHANGE THIS
const COLLECTION = 'math_rooms'

const store = async (data, db) => {
  const batch = db.batch()

  const {
    roomId,
    username,
    outerHTML,
    lastestDateObject,
    messageCount: latestMessageCount = 0,
  } = data

  const roomRef = db.collection(COLLECTION).doc(roomId)
  // await roomRef.set()
  /**
   ** USE BATCH
   */
  batch.set(roomRef, {
    roomId,
    username,
    outerHTML,
    lastestDateObject,
    latestMessageCount,
  })
  // Commit the batch
  // await batch.commit()
}

const storeMessage = async (data, db, batch) => {
  const { roomId, messageId } = data

  const messagesRef = db
    .collection(COLLECTION)
    .doc(roomId)
    .collection('messages')
    .doc(messageId)
  // await messagesRef.set({ ...data, modifiedDate: moment() })
  batch.set(messagesRef, { ...data, modifiedDate: moment() })
  // Commit the batch
  // await batch.commit()
}

const getRoomMessages = async ({ roomId }, db) => {
  const messagesRef = db
    .collection(COLLECTION)
    .doc(roomId)
    .collection('messages')
  const message = await messagesRef.orderBy('timestamp').limit(1).get()
  if (message.exists) console.log('message: ', message.docs())
  const messages = await messagesRef.orderBy('timestamp').limit(3).get()
  if (message.exists) console.log('messages: ', messages.docs())
}

const checkIsAlreadyUpdated = async (data, db) => {
  const { roomId, lastestMessageId: messageId } = data
  const roomRef = db.collection(COLLECTION).doc(roomId)
  const roomDoc = await roomRef.get()

  if (!roomDoc.exists) {
    return false
  } else {
    // find latest message
    // const messagesRef = db
    //   .collection('math_rooms')
    //   .doc(roomId)
    //   .collection('messages')

    const messageRef = db
      .collection(COLLECTION)
      .doc(roomId)
      .collection('messages')
      .doc(messageId)
    const messageDoc = await messageRef.get()
    if (!messageDoc.exists) {
      // await storeLastMessageId({ roomId, lastestMessageId: messageId })
      return false
    }
    return true
  }
}

const storeLastMessageId = async (data, db, batch) => {
  const { roomId, lastestMessageId } = data

  console.log('store lastestMessageId', data)

  const roomRef = db.collection(COLLECTION).doc(roomId)
  const roomDoc = await roomRef.get()

  if (!roomDoc.exists) {
    console.log('No such document!')
  } else {
    console.log('Document data:', roomDoc.data())
    batch.update(roomRef, { roomId, lastestMessageId })
    // await roomRef.update({
    //   roomId,
    //   lastestMessageId,
    // })
  }
}
module.exports = {
  store,
  storeMessage,
  storeLastMessageId,
  getRoomMessages,
  checkIsAlreadyUpdated,
}
