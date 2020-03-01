import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Listens for new temperature recordings and updates fields accordingly.
export const addTemperature = functions.database.ref('/recordings/{recording}')
  .onCreate(handleNewTemperature);

async function handleNewTemperature(
  snapshot: functions.database.DataSnapshot,
  context: functions.EventContext) {
  const room = admin.database().ref('/rooms/first');
  await room.child('latest').set(snapshot.val());
  // TODO add ten minute average
  // TODO group recording data by hour (and then delete).
}