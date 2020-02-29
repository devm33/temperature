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
  latest$: Observable<Recording>;

  constructor(db: AngularFireDatabase) {
    this.latest$ = db.object<Recording>('/rooms/first/latest').valueChanges();
  }

  isStaleRecording(created: number): boolean {
    return moment(created).isBefore(moment().subtract(2, 'minutes'));
  }
}

