const moment = require('moment')
const admin = require('firebase-admin')
var serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})
const db = admin.firestore()

const testCollection = db.collection('test')
const math = db.collection('math_rooms')

const readDoc = async () => {
  const ROOM_ID = 'U01892be6d78ff06839fd1ccf8a7d0dfd'
  const MESSAGE_ID = '13818233147794'
  const messageRef = await math
    .doc(ROOM_ID)
    .collection('messages')
    .doc(MESSAGE_ID)
  /**
   * @READ_DOC
   */
  const doc = await messageRef.get()
  console.log('result: ', doc.data())
  // {
  //   modifiedDate: 'Timestamp { _seconds: 1620658522, _nanoseconds: 732000000 }',
  //   roomId: 'U01892be6d78ff06839fd1ccf8a7d0dfd',
  //   messageId: '13818233147794',
  //   source: { userId: '', type: 'user', username: 'bk' },
  //   originalContentUrl:
  //     'https://chat-content.line-scdn.net/bot/U2af921975ad4641d503a635b1aa60293/9Q3x36_JRWn9RXJD3ZZffIKJ41RwbEBebsY_TRO1m8Y9-Sp4CIQrasBolArp67liQBbiBrwjhXEdVoS4ag__y7DC1CE93-4aCcZhZXeJuBIisHsTki54P-Wc8-hNdtf4',
  //   type: 'image',
  // }
}

const readCollection = async () => {
  // const testRef = db.collection('test')
  // const snapshot = await testRef.get()
  // snapshot.forEach((doc) => {
  //   console.log(doc.data())
  // })
  const mathRooms = db.collection('math_rooms')
  const snapshot = await mathRooms.get()
  snapshot.forEach((doc) => {
    console.log(doc.data().username)
  })
}

const writeDoc = async () => {
  const testRef = db.collection('test').doc('test_doc')
  const result = await testRef.set({
    id: '1234',
    timestamp: moment(),
  })
  console.log('result: ', result)
}

const writeBatch = async () => {
  let batch = db.batch()
  // Set the value of 'NYC'
  const nycRef = db.collection('cities').doc('NYC')
  batch.set(nycRef, { name: 'New York City' })
  const sfRef = db.collection('cities').doc('SF')
  batch.set(sfRef, { name: 'San Francisco' })
  // Update the population of 'SF'

  console.log(await batch.commit())
  // await Promise.all(
  //   Array(8)
  //     .fill(0)
  //     .map()
  // )
  let j = 0
  for (const i of Array(8).fill(1)) {
    console.log('i: ', i)
    const testRef = db
      .collection('test')
      .doc('test_doc')
      .collection('messages')
      .doc(`${j + 1}`)
    // const testRef = db.doc(`test/test_doc/messages/${i}`)
    batch.set(testRef, { id: j, text: 'hello' })

    if (i === 4) {
      await batch.commit()
      batch = db.batch()
    }
    j++
  }
}

writeBatch()
