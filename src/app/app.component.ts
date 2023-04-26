import { Component, OnInit, ViewChild } from '@angular/core';
import { PlayGridComponent } from './playGrid/playGrid.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('playGrid', { static: false }) playGrid!: PlayGridComponent;

  static readonly keyDatePlayed: string = 'PixelGuesserDate';
  static readonly keyClicks: string = 'PixelGuesserClicks';
  static readonly keyWrongGuesses: string = 'PixelGuesserWrongGuesses';
  static readonly keyGuessedRight: string = 'PixelGuesserGuessedRight';
  static readonly keyStillPlaying: string = 'PixelGuesserStillPlaying';
  static readonly keyImgData: string = 'PixelGuesserImgData';
  static readonly keyPixelElems: string = 'PixelGuesserPixelElems';
  static readonly keyDarkTheme: string = 'PixelGuesserDarkTheme';

  static readonly backgroundBright: string = 'background-image';
  static readonly backgroundDark: string = 'background-image-dark';

  private _darkThemeEnabled: boolean = false;
  private _volumeOn: boolean = true;

  constructor(private router: Router) { }

  ngOnInit(): void {
    let cookieDarkTheme: string = localStorage.getItem(AppComponent.keyDarkTheme)!;
    if (cookieDarkTheme) {
      this.setToDarkTheme();
    }

    window.addEventListener('focus', () => {
      // Navigate to the current route again
      this.router.navigate([this.router.url]);
    });
  }

  isDarkThemeEnabled(): boolean {
    return this._darkThemeEnabled;
  }

  changeVolume() {
    this._volumeOn = !this._volumeOn;
  }

  isVolumeOn(): boolean {
    return this._volumeOn;
  }

  static getDateAsStringPreformatted(): string {
    const currentDate: Date = new Date();
    const year: string = currentDate.getFullYear().toString();
    const month: string = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day: string = String(currentDate.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  static wasAlreadyPlayedToday(): boolean {
    let dateLastPlayed: string = localStorage.getItem(AppComponent.keyDatePlayed)!;
    let stillPlayingAsString: string = localStorage.getItem(AppComponent.keyStillPlaying)!;
    if (dateLastPlayed && dateLastPlayed === AppComponent.getDateAsStringPreformatted() && stillPlayingAsString && stillPlayingAsString === 'false' && localStorage.getItem(AppComponent.keyClicks) && localStorage.getItem(AppComponent.keyWrongGuesses) && localStorage.getItem(AppComponent.keyGuessedRight)) {
      return true;
    } else {
      return false;
    }
  }

  static isTodaysGameCurrentlyOngoing(): boolean {
    let dateLastPlayed: string = localStorage.getItem(AppComponent.keyDatePlayed)!;
    let stillPlayingAsString: string = localStorage.getItem(AppComponent.keyStillPlaying)!;
    if (dateLastPlayed && dateLastPlayed === AppComponent.getDateAsStringPreformatted() && stillPlayingAsString && stillPlayingAsString === 'true' && localStorage.getItem(AppComponent.keyClicks) && localStorage.getItem(AppComponent.keyWrongGuesses) && localStorage.getItem(AppComponent.keyImgData) && localStorage.getItem(AppComponent.keyPixelElems)) {
      return true;
    } else {
      return false;
    }
  }

  shareResults() {
    let shareString = 'Daily PixelGuesser [' + localStorage.getItem(AppComponent.keyDatePlayed) + ']: \n\n';
    let score: string = this.playGrid.getScore();
    if (parseInt(score) > 0) {
      shareString = shareString.concat('✅[Score]:\t\t' + score + '\n');
    } else {
      shareString = shareString.concat('❌[Score]:\t\t' + score + '\n');
    }
    shareString = shareString.concat('👆[Clicks]:\t\t' + localStorage.getItem(AppComponent.keyClicks) + '\n');
    shareString = shareString.concat('❔[Guesses]:\t\t' + AppComponent.getTotalGuessesFromLocalStorage().toString() + '\n\n');
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

  changeTheme() {
    if (this._darkThemeEnabled) {
      this.setToBrightTheme();
    } else {
      this.setToDarkTheme();
    }
  }

  private setToDarkTheme() {
    this._darkThemeEnabled = true;
    let body: HTMLBodyElement = document.getElementById('main-body') as HTMLBodyElement;
    if (body && body.classList.contains(AppComponent.backgroundBright)) {
      body.classList.remove(AppComponent.backgroundBright);
      body.classList.add(AppComponent.backgroundDark)
    }
    let localStorageDarkTheme: string = localStorage.getItem(AppComponent.keyDarkTheme)!;
    if (!localStorageDarkTheme) {
      localStorage.setItem(AppComponent.keyDarkTheme, 'true');
    }
  }

  private setToBrightTheme() {
    this._darkThemeEnabled = false;
    let body: HTMLBodyElement = document.getElementById('main-body') as HTMLBodyElement;
    if (body && body.classList.contains(AppComponent.backgroundDark)) {
      body.classList.remove(AppComponent.backgroundDark);
      body.classList.add(AppComponent.backgroundBright)
    }
    let localStorageDarkTheme: string = localStorage.getItem(AppComponent.keyDarkTheme)!;
    if (localStorageDarkTheme) {
      localStorage.removeItem(AppComponent.keyDarkTheme);
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

  private static getDateInAMonth() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
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

  getFilterToWhite(): string {
    return 'invert(81%) sepia(0%) saturate(69%) hue-rotate(144deg) brightness(103%) contrast(91%)';
  }

  private static getTotalGuessesFromLocalStorage(): number {
    let wrongGuesses: number = parseInt(localStorage.getItem(AppComponent.keyWrongGuesses)!);
    if (localStorage.getItem(AppComponent.keyGuessedRight) === 'true') {
      return wrongGuesses + 1;
    } else {
      return wrongGuesses;
    }
  }
}
