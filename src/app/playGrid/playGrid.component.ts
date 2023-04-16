import { environment } from '../../environments/environment';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-playGrid',
  templateUrl: './playGrid.component.html',
  styleUrls: ['./playGrid.component.css']
})


export class PlayGridComponent implements OnInit {
  readonly rightGuess: number = 0;
  readonly wrongGuess: number = 1;
  readonly wrongGuessOver: number = 2;

  constructor(private http: HttpClient) { };
  context2d: CanvasRenderingContext2D = null!;
  hiddenContext2d: CanvasRenderingContext2D = null!
  readonly popSound: HTMLAudioElement = new Audio();
  readonly correctSound: HTMLAudioElement = new Audio();
  readonly pingSound: HTMLAudioElement = new Audio();
  counter: number = 0;
  scoreColor: string = 'black'
  readonly setOfPixelElements: Set<PixelElement> = new Set();

  @ViewChild('playCanvas', { static: true }) playCanvas!: ElementRef;

  ngOnInit(): void {
    this.popSound.src = '../assets/PopSound.wav';
    this.popSound.load();
    this.correctSound.src = '../assets/Correct.mp3';
    this.correctSound.load();
    this.pingSound.src = '../assets/PingSound.wav';
    this.pingSound.load();


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
    this.http.get(environment.apiUrl + 'image?date=' + this.getDateAsStringPreformatted())
      .subscribe((response: any) => {
        const imageDataUrl = 'data:image/jpeg;base64,' + response.image;
        image.src = imageDataUrl;

      })
    image.onload = () => {
      this.hiddenContext2d.drawImage(image, 0, 0);
      this.setOfPixelElements.add(new PixelElement([1, 8], [9, 16], this.context2d, this.hiddenContext2d));
      this.setOfPixelElements.add(new PixelElement([1, 8], [1, 8], this.context2d, this.hiddenContext2d));
      this.setOfPixelElements.add(new PixelElement([9, 16], [1, 8], this.context2d, this.hiddenContext2d));
      this.setOfPixelElements.add(new PixelElement([9, 16], [9, 16], this.context2d, this.hiddenContext2d));
    };

  }

  receiveMessage(event: number) {
    if (event === this.rightGuess) {
      this.resolve();
    } else if (event === this.wrongGuess) {
      this.counter += 25;
      this.scoreColor = 'red';
    } else if (event === this.wrongGuessOver) {
      this.scoreColor = 'black';
    }
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

  private getDateAsStringPreformatted(): string {
    const currentDate: Date = new Date();
    const year: string = currentDate.getFullYear().toString();
    const month: string = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day: string = String(currentDate.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  onClickUnpixelate(canvas: HTMLCanvasElement, event: MouseEvent) {
    const xAndYCoordinates: Array<number> = this.getCoordinatesOfEventForCanvas(canvas, event);
    const ementsToSubdivideOrSolve: Set<PixelElement> = new Set();
    this.setOfPixelElements.forEach((pixelElem) => {
      if (pixelElem.isMouseOverElement(xAndYCoordinates)) {
        ementsToSubdivideOrSolve.add(pixelElem);
      }
    })
    ementsToSubdivideOrSolve.forEach((pixelElem) => {
      if (pixelElem.subDivideOrSolve(this.setOfPixelElements)) {
        this.counter++;
        let clonedAudio: HTMLAudioElement = this.popSound.cloneNode(true) as HTMLAudioElement;
        clonedAudio.play();
      }
    })
  }

  getScore(): String {
    var score: number = (250 - this.counter!);
    score = score > 0 ? score : 0;
    return score.toString();
  }

  resolve() {
    this.setOfPixelElements.clear();
    this.correctSound.play();
    requestAnimationFrame(() => this.resolveAnimation(0));
  }

  resolveAnimation(xCoordinate: number) {
    if (xCoordinate < 1025) {
      if (xCoordinate > 0) {
        this.context2d.putImageData(this.hiddenContext2d.getImageData(xCoordinate - 16, 0, 16, 1024), xCoordinate - 16, 0);
      }
      this.context2d.fillStyle = '#FFFFFF'
      this.context2d.fillRect(xCoordinate, 0, 8, 1024);
      requestAnimationFrame(() => this.resolveAnimation(xCoordinate + 8));
    } else {
      this.correctSound.pause();
      this.correctSound.currentTime = 0;
      this.pingSound.play();
    }

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
  isSelected: Boolean = false;
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
    var mapWithColors: Map<string, number> = new Map();
    var r: number = 0;
    var g: number = 0;
    var b: number = 0;

    const pixelData: Uint8ClampedArray = this.hiddenContext2d.getImageData(this.mapWithCoordinates.get(PixelElement.xPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.yPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.xFillWidthKey)!, this.mapWithCoordinates.get(PixelElement.yFillHeightKey)!).data;
    var countOfPixels: number = 0;
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
    var hex: string = colorValue.toString(16);
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

  subDivideOrSolve(setOfClickablePixelElements: Set<PixelElement>): boolean {
    if (this.xPositionRange[0] != this.xPositionRange[1]) {
      const xMiddlePosition: number = this.xPositionRange[0] + Math.floor((this.xPositionRange[1] - this.xPositionRange[0]) / 2);
      const yMiddlePosition: number = this.yPositionRange[0] + Math.floor((this.yPositionRange[1] - this.yPositionRange[0]) / 2);
      setOfClickablePixelElements.add(new PixelElement([this.xPositionRange[0], xMiddlePosition], [this.yPositionRange[0], yMiddlePosition], this.visibleContext2d, this.hiddenContext2d));
      setOfClickablePixelElements.add(new PixelElement([this.xPositionRange[0], xMiddlePosition], [yMiddlePosition + 1, this.yPositionRange[1]], this.visibleContext2d, this.hiddenContext2d));
      setOfClickablePixelElements.add(new PixelElement([xMiddlePosition + 1, this.xPositionRange[1]], [yMiddlePosition + 1, this.yPositionRange[1]], this.visibleContext2d, this.hiddenContext2d));
      setOfClickablePixelElements.add(new PixelElement([xMiddlePosition + 1, this.xPositionRange[1]], [this.yPositionRange[0], yMiddlePosition], this.visibleContext2d, this.hiddenContext2d));
      setOfClickablePixelElements.delete(this);
      return true;
    } else {
      const imageDataToCopy: ImageData = this.hiddenContext2d.getImageData(this.mapWithCoordinates.get(PixelElement.xPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.yPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.xFillWidthKey)!, this.mapWithCoordinates.get(PixelElement.yFillHeightKey)!);
      this.visibleContext2d.putImageData(imageDataToCopy, this.mapWithCoordinates.get(PixelElement.xPositionStartCoordinateKey)!, this.mapWithCoordinates.get(PixelElement.yPositionStartCoordinateKey)!);
      setOfClickablePixelElements.delete(this);
      return true;
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

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function animateResolving() {
  throw new Error('Function not implemented.');
}
