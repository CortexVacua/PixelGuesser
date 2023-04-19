import { Component } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  static readonly cookieDate: string = 'PixelGuesserDate';
  static readonly cookieScore: string = 'PixelGuesserScore';
  static readonly cookieClicks: string = 'PixelGuesserClicks';
  static readonly cookieGuesses: string = 'PixelGuesserGuesses';

  constructor(private cookieService: CookieService) { }

  static getDateAsStringPreformatted(): string {
    const currentDate: Date = new Date();
    const year: string = currentDate.getFullYear().toString();
    const month: string = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day: string = String(currentDate.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  doesCookieExistForToday(): boolean {
    let cookieDateValue: string = this.cookieService.get(AppComponent.cookieDate);
    if (cookieDateValue && cookieDateValue === AppComponent.getDateAsStringPreformatted()) {
      return true;
    } else {
      return false;
    }
  }

  getScoreIfItExists(): string | null {
    if (this.doesCookieExistForToday()) {
      let cookieScoreValue: string = this.cookieService.get(AppComponent.cookieScore);
      if (cookieScoreValue) {
        return cookieScoreValue;
      } else {
        return '0';
      }
    } else {
      return null;
    }
  }

  copyShareStringToClipboard() {
    let shareString = 'Daily PixelGuesser [' + this.cookieService.get(AppComponent.cookieDate) + ']: \n\n';
    let score: string = this.cookieService.get(AppComponent.cookieScore);
    if (parseInt(score) > 0) {
      shareString = shareString.concat('✅[Score]:\t\t' + score + '\n');
    } else {
      shareString = shareString.concat('❌[Score]:\t\t' + score + '\n');
    }
    shareString = shareString.concat('👆[Clicks]:\t\t' + this.cookieService.get(AppComponent.cookieClicks) + '\n');
    shareString = shareString.concat('❔[Guesses]:\t\t' + this.cookieService.get(AppComponent.cookieGuesses) + '\n\n');
    shareString = shareString.concat('If you want to play PixelGuesser, check it out here: ' + environment.apiUrl)

    navigator.clipboard.writeText(shareString)
      .then(() => console.log('Text copied to clipboard'))
      .catch((error) => console.error('Error copying text: ', error));
  }

}
