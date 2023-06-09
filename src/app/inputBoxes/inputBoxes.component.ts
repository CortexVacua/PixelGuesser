import { environment } from '../../environments/environment';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AppComponent } from '../app.component';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-inputBoxes',
  templateUrl: './inputBoxes.component.html',
  styleUrls: ['./inputBoxes.component.css']
})

export class InputBoxesComponent implements OnInit {
  static readonly pgGreen: string = '#058026';
  static readonly pgRed: string = '#bf1502';
  readonly buzzer: HTMLAudioElement = new Audio();
  listOfSpacers: Array<number> = [];
  inputBoxes: Array<InputBox> = [];
  isLocked: boolean = false;
  showShareButton: boolean = false;
  inputBoxBgColor: string = 'transparent';

  constructor(private http: HttpClient, private appComponent: AppComponent) { }

  @Output() messageEvent = new EventEmitter<number>();

  ngOnInit(): void {
    this.http.get(environment.apiUrl + 'word_info?date=' + AppComponent.getDateAsStringPreformatted())
      .subscribe(async (response: any) => {
        this.listOfSpacers = await response.listOfSpacers as Array<number>;
        const numberOfChars: number = await response.numberOfChars;
        this.inputBoxes = new Array(numberOfChars);
        for (let i = 0; i < numberOfChars; i++) {
          this.inputBoxes[i] = new InputBox(i, this.listOfSpacers.includes(i) ? true : false);
        }

        let wasAlreadyPlayedToday: boolean = AppComponent.wasAlreadyPlayedToday();
        let guessedRight: boolean = localStorage.getItem(AppComponent.keyGuessedRight) === 'true';
        this.isLocked = wasAlreadyPlayedToday;

        if (wasAlreadyPlayedToday) {
          if (guessedRight) {
            this.inputBoxBgColor = InputBoxesComponent.pgGreen;
          } else {
            this.inputBoxBgColor = InputBoxesComponent.pgRed;
          }
          this.showShareButton = true;
          this.filloutSolution();
        }
      })

    this.buzzer.src = 'assets/Buzzer.mp3';
    this.buzzer.load();
    this.buzzer.addEventListener('ended', () => {
      this.messageEvent.emit(2);
    });


  }
  changeColorBackToDefaultAndUnlock() {
    this.isLocked = false;
    for (let inputBox of this.inputBoxes) {
      inputBox.value = '';
    }
    this.inputBoxBgColor = 'transparent';
  }

  isDarkThemeEnabled(): boolean {
    return this.appComponent.isDarkThemeEnabled();
  }

  setGameOver() {
    this.isLocked = true;
    this.inputBoxBgColor = InputBoxesComponent.pgRed;
    this.showShareButton = true;
    this.filloutSolution();
  }

  processEnterAndBackspace(event: KeyboardEvent, index: number) {
    if (!this.isLocked) {
      if (event.key === 'Enter') {
        this.commitGuess();
      } else if (event.key === 'Backspace' && (this.inputBoxes[index].value === '' || this.inputBoxes[index].value === null) && index > 0) {
        event.preventDefault();
        this.inputBoxes[index - 1].value = '';
        this.inputBoxes[index - 1].focusOnElement();
      }
    }
  }

  commitGuess() {
    let guess: string = '';
    for (let inputBox of this.inputBoxes) {
      const value: string = inputBox.value;
      if (value && value.length > 0) {
        guess = guess.concat(value);
      }
    }
    this.http.put(environment.apiUrl + 'word_info?date=' + AppComponent.getDateAsStringPreformatted() + '&guess=' + guess, '', { observe: 'response' })
      .pipe(catchError(async (error) => this.handleError(error)))
      .subscribe((response: any) => {
        this.isLocked = true;
        this.inputBoxBgColor = InputBoxesComponent.pgGreen;
        this.messageEvent.emit(0);
        this.showShareButton = true;
      })
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status == 406) {
      this.messageEvent.emit(1);
      this.startWrongGuessRoutine();
      throw new Error('Wrong Guess!');
    } else {
      console.error(
        'Backend returned code ${error.status}, ' +
        'body was: ${error.error}');
      throwError(() => new Error('Something bad happened; please try again later.'));
    }
  }

  private filloutSolution() {
    this.http.get(environment.apiUrl + 'solution?date=' + AppComponent.getDateAsStringPreformatted())
      .subscribe(async (response: any) => {
        let solution = response.solution as string;
        if (solution) {
          for (let i = 0; i < solution.length; i++) {
            this.inputBoxes[i].value = solution[i];
          }
        }
      })
  }

  shareYourResult() {
    this.appComponent.shareResults();
  }

  private async startWrongGuessRoutine() {
    this.isLocked = true;
    this.inputBoxBgColor = InputBoxesComponent.pgRed;
    if (this.appComponent.isVolumeOn()) {
      this.buzzer.play()
    } else {
      // wait for roughly the same time the buzzer would take and then emit wrongGuessOver message
      await this.delay(500);
      this.messageEvent.emit(2);
    }
  }

  delay(milliseconds: number) {
    return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    });
  }
}

class InputBox {
  private _id: number;
  private _domId: string;
  private _value: string = null!;
  private _needsSpacer: boolean;

  constructor(id: number, needsSpacer: boolean) {
    this._id = id;
    this._domId = 'inputBox' + id.toString();
    this._needsSpacer = needsSpacer;
  }

  needsSpacer(): boolean {
    return this._needsSpacer;
  }

  focusOnElement() {
    (document.getElementById(this._domId) as HTMLInputElement).focus();
  }

  private focusOnNextElemtIfItExists() {
    let inputElement: HTMLInputElement = document.getElementById('inputBox' + (this._id + 1).toString()) as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  }

  get value(): string {
    return this._value;
  }

  set value(value: string) {
    this._value = value.toUpperCase();
    if (value && value.length > 0) {
      this.focusOnNextElemtIfItExists();
    }
  }
}