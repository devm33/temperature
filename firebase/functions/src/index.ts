import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Listens for new temperature recordings and updates fields accordingly.
export const addTemperature = functions.database.ref('/recordings/{recording}')
  .onCreate(handleNewTemperature);

interface Recording {
  F: number;
  created: number;
}

async function handleNewTemperature(
  snapshot: functions.database.DataSnapshot,
  context: functions.EventContext) {
  const roomRef = admin.database().ref('/rooms/first');
  const recording = <Recording>snapshot.val();

  // Update the latest value.
  await roomRef.child('latest').set(recording);

  // Update the last ten rolling average.
  const rolling = await roomRef.child('rolling').once('value');
  if (!rolling.exists()) {
    await roomRef.child('rolling').set(recording.F);
  } else {
    const rollingVal = <number>rolling.val();
    await roomRef.child('rolling')
      .set(rollingVal - (rollingVal / 10) + (recording.F / 10));
  }

  // TODO group recording data by hour (and then delete).

}