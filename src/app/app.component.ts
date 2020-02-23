import 'firebase/database';

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
    this.recordings = db.list<Recording>('/recordings', ref => ref.orderByChild('created').limitToFirst(1)).valueChanges();
  }
}

