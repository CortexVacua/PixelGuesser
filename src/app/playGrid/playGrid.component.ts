import { environment } from '../../environments/environment';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppComponent } from '../app.component';
import { InputBoxesComponent } from '../inputBoxes/inputBoxes.component';

@Component({
  selector: 'app-playGrid',
  templateUrl: './playGrid.component.html',
  styleUrls: ['./playGrid.component.css']
})


export class PlayGridComponent implements OnInit {
  @ViewChild('childComponent', { static: false }) inputBoxes!: InputBoxesComponent;
  @ViewChild('playCanvas', { static: true }) playCanvas!: ElementRef;

  static readonly rightGuess: number = 0;
  static readonly wrongGuess: number = 1;
  static readonly wrongGuessOver: number = 2;

  locked: boolean = false;
  shouldScoreBeRed: boolean = false;

  constructor(private http: HttpClient, private appComponent: AppComponent) { };
  context2d: CanvasRenderingContext2D = null!;
  hiddenContext2d: CanvasRenderingContext2D = null!
  readonly popSound: HTMLAudioElement = new Audio();
  readonly correctSound: HTMLAudioElement = new Audio();
  readonly pingSound: HTMLAudioElement = new Audio();
  readonly failSound: HTMLAudioElement = new Audio();

  clicks: number = 0;
  wrongGuesses: number = 0;
  guessedRight: boolean = false;

  setOfPixelElements: Set<PixelElement> = new Set();

  ngOnInit(): void {
    this.popSound.src = 'assets/PopSound.wav';
    this.popSound.load();
    this.correctSound.src = 'assets/Correct.mp3';
    this.correctSound.load();
    this.pingSound.src = 'assets/PingSound.wav';
    this.pingSound.load();
    this.failSound.src = 'assets/FailSound.mp3';
    this.failSound.load();

    const canvas: HTMLCanvasElement = this.playCanvas.nativeElement;
    canvas.addEventListener('click', (e) => {
      this.onClickUnpixelate(canvas, e);
    })
    canvas.addEventListener('mousemove', (e) => {
      canvas.style.cursor = 'crosshair';
      const xAndYCoordinates: Array<number> = this.getCoordinatesOfEventForCanvas(canvas, e);
      this.setOfPixelElements.forEach((pixelElem) => {
        if (pixelElem.isMouseOverElement(xAndYCoordinates)) {
          if (!pixelElem.isSelected) {
            pixelElem.isSelected = true;
            pixelElem.markElement();
          }
        } else if (pixelElem.isSelected) {
          pixelElem.isSelected = false;
          pixelElem.drawPixelElement();
        }
      })
    });

    this.context2d = canvas.getContext('2d')!;
    this.hiddenContext2d = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
    this.hiddenContext2d.canvas.width = 1024;
    this.hiddenContext2d.canvas.height = 1024;

    let image: HTMLImageElement = new Image();
    this.http.get(environment.apiUrl + 'image?date=' + AppComponent.getDateAsStringPreformatted())
      .subscribe((response: any) => {
        const imageDataUrl = 'data:image/jpeg;base64,' + response.image;
        image.src = imageDataUrl;

      })
    image.onload = () => {
      if (AppComponent.wasAlreadyPlayedToday()) {
        this.clicks = parseInt(localStorage.getItem(AppComponent.keyClicks)!);
        this.wrongGuesses = parseInt(localStorage.getItem(AppComponent.keyWrongGuesses)!);
        this.context2d.drawImage(image, 0, 0);
      } else if (AppComponent.isTodaysGameCurrentlyOngoing()) {
        this.hiddenContext2d.drawImage(image, 0, 0);
        this.loadCachedValues();
      } else {
        this.hiddenContext2d.drawImage(image, 0, 0);
        this.setOfPixelElements.add(new PixelElement([1, 8], [9, 16], this.context2d, this.hiddenContext2d));
        this.setOfPixelElements.add(new PixelElement([1, 8], [1, 8], this.context2d, this.hiddenContext2d));
        this.setOfPixelElements.add(new PixelElement([9, 16], [1, 8], this.context2d, this.hiddenContext2d));
        this.setOfPixelElements.add(new PixelElement([9, 16], [9, 16], this.context2d, this.hiddenContext2d));
        this.initializeLocalStorageForToday(canvas);
      }
    };

  }

  private loadCachedValues() {
    this.loadCachedImage();
    const parsedArray: any[] = JSON.parse(localStorage.getItem(AppComponent.keyPixelElems)!);
    this.setOfPixelElements = new Set(parsedArray.map(pe => new PixelElement(pe.xPositionRange, pe.yPositionRange, this.context2d, this.hiddenContext2d)));
    this.clicks = parseInt(localStorage.getItem(AppComponent.keyClicks)!);
    this.wrongGuesses = parseInt(localStorage.getItem(AppComponent.keyWrongGuesses)!);
  }

  private loadCachedImage() {
    const savedImageData: string = localStorage.getItem(AppComponent.keyImgData)!;
    const image = new Image();
    image.src = savedImageData;
    image.onload = () => {
      this.context2d.drawImage(image, 0, 0);
    }
  }

  receiveMessage(event: number) {
    if (event === PlayGridComponent.rightGuess) {
      this.guessedRight = true;
      this.resolve(true);
      localStorage.setItem(AppComponent.keyGuessedRight, 'true');
    } else if (event === PlayGridComponent.wrongGuess) {
      this.wrongGuesses += 1;
      this.shouldScoreBeRed = true;
      this.locked = true;
      localStorage.setItem(AppComponent.keyWrongGuesses, this.wrongGuesses.toString());
    } else if (event === PlayGridComponent.wrongGuessOver) {
      this.shouldScoreBeRed = false;
      this.locked = false;
      if (!this.checkIfGameOver()) {
        this.inputBoxes.changeColorBackToDefaultAndUnlock();
      }
    }
  }

  private deleteImgAndPixelElems() {
    localStorage.removeItem(AppComponent.keyImgData);
    localStorage.removeItem(AppComponent.keyPixelElems);
  }

  private getCoordinatesOfEventForCanvas(canvas: HTMLCanvasElement, e: MouseEvent): Array<number> {
    const rect: DOMRect = canvas.getBoundingClientRect();
    const width: number = rect.right - rect.left;
    const widthOfSubElement = width / 16;
    const xPosition: number = e.clientX - rect.left;
    const yPosition: number = e.clientY - rect.top;
    const xPositionInGrid: number = Math.floor(xPosition / widthOfSubElement + 1);
    const yPositionInGrid: number = Math.floor(yPosition / widthOfSubElement + 1);
    const xAndYCoordinates: Array<number> = [xPositionInGrid, yPositionInGrid];
    return xAndYCoordinates;
  }

  onClickUnpixelate(canvas: HTMLCanvasElement, event: MouseEvent) {
    if (!this.locked) {
      const xAndYCoordinates: Array<number> = this.getCoordinatesOfEventForCanvas(canvas, event);
      const ementsToSubdivideOrSolve: Set<PixelElement> = new Set();
      this.setOfPixelElements.forEach((pixelElem) => {
        if (pixelElem.isMouseOverElement(xAndYCoordinates)) {
          ementsToSubdivideOrSolve.add(pixelElem);
        }
      })
      ementsToSubdivideOrSolve.forEach((pixelElem) => {
        pixelElem.subDivideOrSolve(this.setOfPixelElements)
        this.clicks++;
        localStorage.setItem(AppComponent.keyClicks, this.clicks.toString());
        localStorage.setItem(AppComponent.keyImgData, canvas.toDataURL());
        localStorage.setItem(AppComponent.keyPixelElems, JSON.stringify(Array.from(this.setOfPixelElements)));
        if (!this.checkIfGameOver() && this.appComponent.isVolumeOn()) {
          let clonedAudio: HTMLAudioElement = this.popSound.cloneNode(true) as HTMLAudioElement;
          clonedAudio.play();
        }
      })
    }
  }

  getScore(): string {
    let score: number = (250 - this.clicks - this.wrongGuesses * 25);
    score = score > 0 ? score : 0;
    return score.toString();
  }

  private resolve(correct: boolean) {
    this.setOfPixelElements.clear();
    if (this.appComponent.isVolumeOn()) {
      if (correct) {
        this.correctSound.play();
      } else {
        this.failSound.play();
      }
    }
    this.setGameToFinishedInLocalStorage();
    requestAnimationFrame(() => this.resolveAnimation(0, correct));
  }

  private checkIfGameOver(): boolean {
    if (this.getScore() === '0') {
      this.resolve(false);
      this.inputBoxes.setGameOver();
      localStorage.setItem(AppComponent.keyStillPlaying, 'false');
      this.deleteImgAndPixelElems();
      return true;
    } else {
      return false;
    }
  }

  private resolveAnimation(xCoordinate: number, correct: boolean) {
    if (xCoordinate < 1025) {
      if (xCoordinate > 0) {
        this.context2d.putImageData(this.hiddenContext2d.getImageData(xCoordinate - 16, 0, 16, 1024), xCoordinate - 16, 0);
      }
      this.context2d.fillStyle = '#FFFFFF'
      this.context2d.fillRect(xCoordinate, 0, 8, 1024);
      requestAnimationFrame(() => this.resolveAnimation(xCoordinate + 8, correct));
    } else {
      this.correctSound.pause();
      this.correctSound.currentTime = 0;
      if (correct && this.appComponent.isVolumeOn()) {
        this.pingSound.play();
      }
    }
  }

  private setGameToFinishedInLocalStorage() {
    localStorage.setItem(AppComponent.keyStillPlaying, 'false');
    this.deleteImgAndPixelElems();
  }

  isDarkThemeEnabled(): boolean {
    return this.appComponent.isDarkThemeEnabled();
  }

  getScoreNumberColor(): string {
    if (this.shouldScoreBeRed) {
      return 'red';
    } else if (this.isDarkThemeEnabled()) {
      return '#cecece';
    } else {
      return 'black';
    }
  }

  private initializeLocalStorageForToday(canvas: HTMLCanvasElement) {
    localStorage.setItem(AppComponent.keyDatePlayed, AppComponent.getDateAsStringPreformatted());
    localStorage.setItem(AppComponent.keyStillPlaying, 'true');
    localStorage.setItem(AppComponent.keyClicks, '0');
    localStorage.setItem(AppComponent.keyWrongGuesses, '0');
    localStorage.setItem(AppComponent.keyGuessedRight, 'false');
    localStorage.setItem(AppComponent.keyImgData, canvas.toDataURL());
    localStorage.setItem(AppComponent.keyPixelElems, JSON.stringify(Array.from(this.setOfPixelElements)));
  }
}

class PixelElement {
  static readonly smallestPixelElementWidthInPixels: number = 64;

  static readonly xPositionStartCoordinateKey: string = 'xPositionStartCoordinateKey';
  static readonly yPositionStartCoordinateKey: string = 'yPositionStartCoordinateKey';
  static readonly xFillWidthKey: string = 'xPositionFillCoordinateKey';
  static readonly yFillHeightKey: string = 'yPositionFillCoordinateKey';

  readonly xPositionRange: Array<number>;
  readonly yPositionRange: Array<number>;
  readonly visibleContext2d: CanvasRenderingContext2D;
  readonly hiddenContext2d: CanvasRenderingContext2D;
  readonly mapWithCoordinates: Map<string, number>;
  isSelected: boolean = false;
  fillColor: string;

  constructor(xPositionRange: Array<number>, yPositionRange: Array<number>, visibleContext2d: CanvasRenderingContext2D, hiddenContext2d: CanvasRenderingContext2D) {
    this.xPositionRange = xPositionRange;
    this.yPositionRange = yPositionRange;
    this.visibleContext2d = visibleContext2d;
    this.hiddenContext2d = hiddenContext2d;
    this.mapWithCoordinates = this.calculatePixelPosition();
    this.fillColor = this.getFillColor();
    this.drawPixelElement();
  }

  drawPixelElement() {
    this.visibleContext2d.fillStyle = this.fillColor;
    this.visibleContext2d.fillRect(this.mapWithCoordinates.get(PixelElement.xPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.yPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.xFillWidthKey)!, this.mapWithCoordinates.get(PixelElement.yFillHeightKey)!);
  }

  markElement() {
    this.visibleContext2d.fillStyle = PixelElement.isColorBright(this.fillColor) ? '#000000' : '#FFFFFF';
    this.visibleContext2d.fillRect(this.mapWithCoordinates.get(PixelElement.xPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.yPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.xFillWidthKey)! - 4, 4);
    this.visibleContext2d.fillRect(this.mapWithCoordinates.get(PixelElement.xPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.yPositionStartCoordinateKey)!, 4, this.mapWithCoordinates.get(PixelElement.yFillHeightKey)! - 4);
    this.visibleContext2d.fillRect(this.mapWithCoordinates.get(PixelElement.xPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.yPositionStartCoordinateKey)! + this.mapWithCoordinates.get(PixelElement.yFillHeightKey)! - 4, this.mapWithCoordinates.get(PixelElement.xFillWidthKey)!, 4);
    this.visibleContext2d.fillRect(this.mapWithCoordinates.get(PixelElement.xPositionStartCoordinateKey)! + this.mapWithCoordinates.get(PixelElement.xFillWidthKey)! - 4, this.mapWithCoordinates.get(PixelElement.yPositionStartCoordinateKey)!, 4, this.mapWithCoordinates.get(PixelElement.yFillHeightKey)!);
  }

  private static isColorBright(colorInHex: string): boolean {
    return parseInt(colorInHex.substring(1, 3), 16) > 200 && parseInt(colorInHex.substring(3, 5), 16) > 200 && parseInt(colorInHex.substring(5), 16) > 200;
  }

  private getFillColor(): string {
    let r: number = 0;
    let g: number = 0;
    let b: number = 0;

    const pixelData: Uint8ClampedArray = this.hiddenContext2d.getImageData(this.mapWithCoordinates.get(PixelElement.xPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.yPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.xFillWidthKey)!, this.mapWithCoordinates.get(PixelElement.yFillHeightKey)!).data;
    let countOfPixels: number = 0;
    for (let i = 0; i < pixelData.length; i += 4) {

      r += Math.pow(pixelData[i], 2);
      g += Math.pow(pixelData[i + 1], 2);
      b += Math.pow(pixelData[i + 2], 2);

      countOfPixels++;
    }
    return PixelElement.rgbToHex(PixelElement.averageRgbValues(r, countOfPixels), PixelElement.averageRgbValues(g, countOfPixels), PixelElement.averageRgbValues(b, countOfPixels));
  }

  private static averageRgbValues(rgbSum: number, countOfPixels: number) {
    return Math.round(Math.sqrt((rgbSum / countOfPixels)));
  }

  private static componentToHex(colorValue: number): string {
    const hex: string = colorValue.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  private static rgbToHex(r: number, g: number, b: number): string {
    return "#" + PixelElement.componentToHex(r) + PixelElement.componentToHex(g) + PixelElement.componentToHex(b);
  }

  isMouseOverElement(xAndYCoordinates: Array<number>): boolean {
    const xCoordinatesMatch: boolean = this.xPositionRange[0] <= xAndYCoordinates[0] && xAndYCoordinates[0] <= this.xPositionRange[1];
    const yCoordinatesMatch: boolean = this.yPositionRange[0] <= xAndYCoordinates[1] && xAndYCoordinates[1] <= this.yPositionRange[1];
    return xCoordinatesMatch && yCoordinatesMatch;
  }

  subDivideOrSolve(setOfClickablePixelElements: Set<PixelElement>) {
    if (this.xPositionRange[0] != this.xPositionRange[1]) {
      const xMiddlePosition: number = this.xPositionRange[0] + Math.floor((this.xPositionRange[1] - this.xPositionRange[0]) / 2);
      const yMiddlePosition: number = this.yPositionRange[0] + Math.floor((this.yPositionRange[1] - this.yPositionRange[0]) / 2);
      setOfClickablePixelElements.add(new PixelElement([this.xPositionRange[0], xMiddlePosition], [this.yPositionRange[0], yMiddlePosition], this.visibleContext2d, this.hiddenContext2d));
      setOfClickablePixelElements.add(new PixelElement([this.xPositionRange[0], xMiddlePosition], [yMiddlePosition + 1, this.yPositionRange[1]], this.visibleContext2d, this.hiddenContext2d));
      setOfClickablePixelElements.add(new PixelElement([xMiddlePosition + 1, this.xPositionRange[1]], [yMiddlePosition + 1, this.yPositionRange[1]], this.visibleContext2d, this.hiddenContext2d));
      setOfClickablePixelElements.add(new PixelElement([xMiddlePosition + 1, this.xPositionRange[1]], [this.yPositionRange[0], yMiddlePosition], this.visibleContext2d, this.hiddenContext2d));
      setOfClickablePixelElements.delete(this);
    } else {
      const imageDataToCopy: ImageData = this.hiddenContext2d.getImageData(this.mapWithCoordinates.get(PixelElement.xPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.yPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.xFillWidthKey)!, this.mapWithCoordinates.get(PixelElement.yFillHeightKey)!);
      this.visibleContext2d.putImageData(imageDataToCopy, this.mapWithCoordinates.get(PixelElement.xPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.yPositionStartCoordinateKey)!);
      setOfClickablePixelElements.delete(this);
    }
  }

  private calculatePixelPosition(): Map<string, number> {
    const startPositionX = (this.xPositionRange[0] - 1) * PixelElement.smallestPixelElementWidthInPixels;
    const widthInPixels = (this.xPositionRange[1] - this.xPositionRange[0] + 1) * PixelElement.smallestPixelElementWidthInPixels;
    const startPositionY = (this.yPositionRange[0] - 1) * PixelElement.smallestPixelElementWidthInPixels;
    const heightInPixels = (this.yPositionRange[1] - this.yPositionRange[0] + 1) * PixelElement.smallestPixelElementWidthInPixels;
    return new Map<string, number>([
      [PixelElement.xPositionStartCoordinateKey, startPositionX],
      [PixelElement.xFillWidthKey, widthInPixels],
      [PixelElement.yPositionStartCoordinateKey, startPositionY],
      [PixelElement.yFillHeightKey, heightInPixels]
    ]);;
  }
}


