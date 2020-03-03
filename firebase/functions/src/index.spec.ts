import * as setupTests from 'firebase-functions-test';

// Connect to test project. Must run before other imports.
const test = setupTests({
  databaseURL: "https://devm33-temp-test.firebaseio.com",
  projectId: "devm33-temp-test",
}, './service-account-key.json');

import * as admin from 'firebase-admin';
import * as moment from 'moment';

import { addTemperature } from './index';

describe('addTemperature', () => {
  afterAll(() => {
    test.cleanup();
  })

  afterEach(async () => {
    await admin.database().ref().remove();
  })

  it('writes the latest value to latest', async () => {
    const recording = { F: 98.7, created: 123456 };
    const snap = test.database.makeDataSnapshot(recording, '/recordings/1')

    await test.wrap(addTemperature)(snap);

    const latest = await admin.database().ref('/rooms/first/latest')
      .once('value');
    await expect(latest.val()).toEqual(recording);
  });

  it('writes the latest value to seed the rolling average', async () => {
    const recording = { F: 98.7, created: 123456 };
    const snap = test.database.makeDataSnapshot(recording, '/recordings/1')

    await test.wrap(addTemperature)(snap);

    const rolling = await admin.database().ref('/rooms/first/rolling')
      .once('value');
    await expect(rolling.val()).toEqual(recording.F);
  });

  it('updates an existing rolling average with the latest value', async () => {
    const recording = { F: 100, created: 123456 };
    const snap = test.database.makeDataSnapshot(recording, '/recordings/1')
    await admin.database().ref('/rooms/first/rolling').set(50);

    await test.wrap(addTemperature)(snap);

    const newRolling = await admin.database().ref('/rooms/first/rolling')
      .once('value');
    await expect(newRolling.val()).toEqual(55);
  });

  it('does not archive recent recordings', async () => {
    const recording = { F: 100, created: moment().valueOf() };
    const snap = test.database.makeDataSnapshot(recording, '/recordings/1')
    await admin.database().ref('/recordings/1').set(recording);

    await test.wrap(addTemperature)(snap);

    const actual = (await admin.database().ref('/recordings/1').once('value'))
      .val();
    await expect(actual).toEqual(recording);
  });

  it('deletes archived recordings', async () => {
    const recording = {
      F: 100,
      created: moment().subtract(2, 'hours').valueOf(),
    };
    const snap = test.database.makeDataSnapshot(recording, '/recordings/1')
    await admin.database().ref('/recordings/1').set(recording);

    await test.wrap(addTemperature)(snap);

    const actual = await admin.database().ref('/recordings/1').once('value');
    await expect(actual.exists()).toBeFalsy();
  });

  it('archives recordings to an hourly average', async () => {
    const recording = { F: 100, created: 1583204918149 };
    const snap = test.database.makeDataSnapshot(recording, '/recordings/1')
    await admin.database().ref('/recordings/1').set(recording);

    await test.wrap(addTemperature)(snap);

    const actual = (await admin.database().ref('/hourly/first/1583204400000')
      .once('value')).val();
    await expect(actual).toEqual({ average: 100, count: 1 });
  });

  it('adds archived recordings to an existing hourly average', async () => {
    const recording = { F: 100, created: 1583204918149 };
    const snap = test.database.makeDataSnapshot(recording, '/recordings/1')
    await admin.database().ref('/recordings/1').set(recording);
    const hourlyRef = admin.database().ref('/hourly/first/1583204400000');
    await hourlyRef.set({ average: 50, count: 4 })

    await test.wrap(addTemperature)(snap);

    const actual = (await hourlyRef.once('value')).val();
    await expect(actual).toEqual({ average: 60, count: 5 });
  });
});