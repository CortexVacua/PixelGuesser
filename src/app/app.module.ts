import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { PlayGridComponent } from './playGrid/playGrid.component';
import { InputBoxesComponent } from './inputBoxes/inputBoxes.component';

@NgModule({
  declarations: [
    AppComponent,
    PlayGridComponent,
    InputBoxesComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
