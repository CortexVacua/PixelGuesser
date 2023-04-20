import { Component } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

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

  shareResults() {
    let shareString = 'Daily PixelGuesser [' + this.cookieService.get(AppComponent.cookieDate) + ']: \n\n';
    let score: string = this.cookieService.get(AppComponent.cookieScore);
    if (parseInt(score) > 0) {
      shareString = shareString.concat('✅[Score]:\t\t' + score + '\n');
    } else {
      shareString = shareString.concat('❌[Score]:\t\t' + score + '\n');
    }
    shareString = shareString.concat('👆[Clicks]:\t\t' + this.cookieService.get(AppComponent.cookieClicks) + '\n');
    shareString = shareString.concat('❔[Guesses]:\t\t' + this.cookieService.get(AppComponent.cookieGuesses) + '\n\n');
    shareString = shareString.concat('If you want to play PixelGuesser, check it out here: ' + document.location.href)


    if (this.isUserOnMobile() && navigator.share) {
      navigator.share({
        title: "PixelGuesser",
        text: shareString
      }).then(() => console.log("Shared result.")).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareString)
        .then(() => {
          console.log('Text copied to clipboard');
          this.informAboutResultsBeingCopiedToClipBoard();
        }).catch(console.error);
    }
  }

  private isUserOnMobile(): boolean {
    if (navigator.userAgent.match(/Android/i)
      || navigator.userAgent.match(/webOS/i)
      || navigator.userAgent.match(/iPhone/i)
      || navigator.userAgent.match(/iPad/i)
      || navigator.userAgent.match(/iPod/i)
      || navigator.userAgent.match(/BlackBerry/i)
      || navigator.userAgent.match(/Windows Phone/i)) {
      return true;
    } else {
      return false;
    }
  }

  informAboutResultsBeingCopiedToClipBoard() {
    const message = document.createElement('div');
    message.textContent = 'YOUR RESULTS WERE COPIED TO YOUR CLIPBOARD!';
    message.style.fontFamily = 'PublicPixel, Arial';
    message.style.position = 'fixed';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.padding = '10px';
    message.style.backgroundColor = '#ccc';
    message.style.borderRadius = '5px';
    message.style.zIndex = '9999';
    document.body.appendChild(message);
    setTimeout(() => {
      document.body.removeChild(message);
    }, 2000);
  }

}
