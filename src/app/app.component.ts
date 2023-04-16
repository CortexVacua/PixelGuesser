import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  static getDateAsStringPreformatted(): string {
    const currentDate: Date = new Date();
    const year: string = currentDate.getFullYear().toString();
    const month: string = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day: string = String(currentDate.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }
}
