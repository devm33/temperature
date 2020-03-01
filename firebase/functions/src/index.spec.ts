import "jasmine";

import * as setupTests from 'firebase-functions-test';

// Connect to test project. Must run before other imports.
const test = setupTests({
  databaseURL: "https://devm33-temp-test.firebaseio.com",
  projectId: "devm33-temp-test",
}, './service-account-key.json');

import * as admin from 'firebase-admin';

import { addTemperature } from './index';
import { WrappedFunction } from 'firebase-functions-test/lib/main';


describe('Cloud Functions', () => {

  afterEach(async () => {
    test.cleanup();
    await admin.database().ref().remove();
  })

  describe('addTemperature', () => {
    let wrappedAddTemperature: WrappedFunction;

    beforeAll(() => {
      wrappedAddTemperature = test.wrap(addTemperature);
    })
    it('writes the latest value to latest', async () => {
      const recording = { F: 98.7, created: 123456 };
      const snap = test.database.makeDataSnapshot(recording, '/recordings/1')
      await wrappedAddTemperature(snap);
      const latest = await admin.database().ref('/rooms/first/latest')
        .once('value');
      await expect(latest.val()).toEqual(recording);
    });
  });
});