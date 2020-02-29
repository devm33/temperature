import { database, EventContext } from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Listens for new temperature recordings and updates fields accordingly.
export const addTemperature = database.ref('/recordings/{recording}')
  .onCreate(handleNewTemperature);

async function handleNewTemperature(
  snapshot: database.DataSnapshot,
  context: EventContext) {
  const room = admin.database().ref('/rooms/first');
  await room.child('latest').set(snapshot.val());
  // TODO add ten minute average
  // TODO group recording data by hour (and then delete).
}