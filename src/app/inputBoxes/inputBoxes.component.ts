import { environment } from '../../environments/environment';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppComponent } from '../app.component';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-inputBoxes',
  templateUrl: './inputBoxes.component.html',
  styleUrls: ['./inputBoxes.component.css']
})

export class InputBoxesComponent implements OnInit {
  readonly buzzer: HTMLAudioElement = new Audio();
  listOfSpacers: Array<number> = [];
  inputBoxes: Array<InputBox> = [];
  isLocked: boolean = false;
  showShareButton: boolean = false;
  inputBoxBgColor: string = 'white';

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

        let doesCookieExistForToday: boolean = this.appComponent.doesCookieExistForToday();
        this.isLocked = doesCookieExistForToday;

        if (doesCookieExistForToday) {
          if (parseInt(this.appComponent.getScoreIfItExists()!) > 0) {
            this.inputBoxBgColor = '#9dfab8';
          } else {
            this.inputBoxBgColor = '#fa8f87';
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
  private changeColorBackToWhiteAndUnlock() {
    this.isLocked = false;
    for (let i = 0; i < this.inputBoxes.length; i++) {
      this.inputBoxes[i].value = '';
    }
    this.inputBoxBgColor = 'white';
  }

  setGameOverIfNecessary(gameOver: boolean) {
    if (gameOver) {
      this.showShareButton = true;
      this.filloutSolution();
    } else {
      this.changeColorBackToWhiteAndUnlock()
    }
  }

  processAndJumpIfNecessary(event: KeyboardEvent, index: number) {
    if (!this.isLocked) {
      event.preventDefault();
      if (event.key === 'Enter') {
        this.commitGuess();
      } else if (event.key.length === 1) {
        this.inputBoxes[index].value = event.key;
        if (index < (this.inputBoxes.length - 1)) {
          this.inputBoxes[index + 1].focusOnElement();
        }
      } else if (event.key == 'Backspace') {
        this.inputBoxes[index].value = '';
        if (index > 0) {
          this.inputBoxes[index - 1].focusOnElement();
        }
      }
    }
  }

  commitGuess() {
    let guess: string = '';
    for (let i = 0; i < this.inputBoxes.length; i++) {
      const value: string = this.inputBoxes[i].value!;
      if (value && value.length > 0) {
        guess = guess.concat(value);
      }
    }
    this.http.put(environment.apiUrl + 'word_info?date=' + AppComponent.getDateAsStringPreformatted() + '&guess=' + guess, '', { observe: 'response' })
      .pipe(catchError(async (error) => this.handleError(error)))
      .subscribe((response: any) => {
        this.isLocked = true;
        this.inputBoxBgColor = '#9dfab8';
        this.messageEvent.emit(0);
        this.finish();
      })
  }

  finish() {
    this.showShareButton = true;
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
    this.appComponent.copyShareStringToClipboard();
  }

  private startWrongGuessRoutine() {
    this.isLocked = true;
    this.inputBoxBgColor = '#fa8f87';
    this.buzzer.play()
  }
}

class InputBox {
  private _id: string;
  private _value: string = null!;
  private _needsSpacer: boolean;

  constructor(id: number, needsSpacer: boolean) {
    this._id = 'inputBox' + id.toString();
    this._needsSpacer = needsSpacer;
  }

  needsSpacer(): boolean {
    return this._needsSpacer;
  }

  focusOnElement() {
    (document.getElementById(this._id) as HTMLInputElement).focus();
  }

  get value(): string {
    return this._value;
  }

  set value(value: string) {
    this._value = value.toUpperCase();
  }
}