import 'firebase/database';
import * as moment from 'moment';
import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Observable } from 'rxjs';

interface Recording {
  F: number;
  created: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  recordings: Observable<Recording[]>;

  constructor(db: AngularFireDatabase) {
    this.recordings = db.list<Recording>('/recordings', ref => ref.orderByChild('created').limitToLast(1)).valueChanges();
  }

  isStaleRecording(created: number): boolean {
    return moment(created).isBefore(moment().subtract(2, 'minutes'));
  }
}

