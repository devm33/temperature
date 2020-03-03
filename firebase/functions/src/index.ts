import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as moment from 'moment';

admin.initializeApp();

// Temperature recordings list: /recordings
interface RecordingList {
  [id: string]: Recording;
}

// Temperature recording: /recordings/{recording}
interface Recording {
  F: number;
  created: number;
}

// Hourly average values /hourly/first/{milliseconds}
interface HourlyAverage {
  average: number;
  count: number;
}

// One hour from the server timestamp of the current recording.
const ONE_HOUR_AGO = moment(admin.database.ServerValue.TIMESTAMP)
  .subtract(1, 'hour');

// Listens for new temperature recordings and updates database accordingly.
export const addTemperature = functions.database.ref('/recordings/{recording}')
  .onCreate(handleNewTemperature);

async function handleNewTemperature(
  snapshot: functions.database.DataSnapshot,
  context: functions.EventContext) {
  const roomRef = admin.database().ref('/rooms/first');
  const latest = <Recording>snapshot.val();
  await roomRef.child('latest').set(latest);
  await updateRollingAverage(latest);
  await archiveOldRecordings();
}

// Updates a rolling average to estimate the average of the last ten values.
async function updateRollingAverage(recording: Recording) {
  const roomRef = admin.database().ref('/rooms/first');
  const rolling = await roomRef.child('rolling').once('value');
  if (!rolling.exists()) {
    await roomRef.child('rolling').set(recording.F);
    return;
  }
  const rollingVal = <number>rolling.val();
  await roomRef.child('rolling')
    .set(rollingVal - (rollingVal / 10) + (recording.F / 10));
}

// Finds any recordings older than an hour, adds them to hourly averages, and
// then deletes them.
async function archiveOldRecordings() {
  const recordingsRef = admin.database().ref('/recordings');
  const recordings = <RecordingList>(await recordingsRef.once('value')).val();
  if (!recordings) {
    return;
  }
  for (const [id, recording] of Object.entries(recordings)) {
    if (shouldBeArchived(recording)) {
      await addToHourlyAverage(recording);
      await deleteRecording(id);
    }
  }
}

// Returns true if the recording is older than an hour ago.
function shouldBeArchived(recording: Recording): boolean {
  return moment(recording.created).isBefore(ONE_HOUR_AGO);
}

// Adds a recording to its hourly average.
async function addToHourlyAverage(recording: Recording) {
  const created = moment(recording.created);
  const hourPath = `/hourly/first/${created.startOf('hour').valueOf()}`;
  const averageRef = admin.database().ref(hourPath);
  const average = await averageRef.once('value');
  if (!average.exists()) {
    await averageRef.set(<HourlyAverage>{ count: 1, average: recording.F });
    return;
  }
  const cur = <HourlyAverage>average.val();
  await averageRef.set(<HourlyAverage>{
    count: cur.count + 1,
    average: (cur.average * cur.count + recording.F) / (cur.count + 1),
  });
}

// Removes a recording from the database.
async function deleteRecording(recordingId: string) {
  await admin.database().ref(`/recordings/${recordingId}`).remove();
}