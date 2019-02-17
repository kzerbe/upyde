import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import 'codemirror/mode/python/python';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/markdown/markdown';
import { AppComponent } from './app.component';
import { ConnectDialogComponent} from './connect_dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    ConnectDialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    CodemirrorModule,
    NgbModule
  ],
  providers: [
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    ConnectDialogComponent
  ]
})
export class AppModule { }
