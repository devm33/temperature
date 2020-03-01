// tslint:disable-next-line
import "jasmine";

import * as setupTests from 'firebase-functions-test';

// Connect to test project. Must run before other imports.
const test = setupTests({
  databaseURL: "https://devm33-temp-test.firebaseio.com",
  projectId: "devm33-temp-test",
}, './service-account-key.json');

import * as admin from 'firebase-admin';

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
});