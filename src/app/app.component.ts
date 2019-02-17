import {Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef, AfterViewChecked} from '@angular/core';
import { WebREPL } from 'webrepl-client/webrepl.js';

enum ScanState {
  off,
  expectStart,
  scanChars,
  complete
}

const NEW_FILE = 'new_file.py';

@Component({
  selector: 'app-root',
  template: `<div class="container-fluid">
    <div class="card">
      <div class="card-header">
        <h3>{{title}}</h3>
      </div>
      <div class="card-body">
        <ul class="list-inline">
          <li class="list-inline-item" *ngFor="let file of fileList" 
             [style.background-color]="file===editFile?'blue':'black'"
             (click)="loadfile($event.target.innerText)">{{file}}</li>
        </ul>
        <ngx-codemirror
            [(ngModel)]="content"
            [options]="{lineNumbers: true, theme: 'material', mode: 'python'}">
        </ngx-codemirror>
        <div class="editor-fnc col-12">
          <button class="btn btn-primary offset-11 col-1" 
                  [disabled]="!editFile" (click)="savefile()">Save</button>
        </div>
        <hr>
        <div class="input-group">
          <input #cmd type="text" class="form-control" [(ngModel)]="command" placeholder="enter Python command"
                 (keydown)="onCmdEnter($event.key)">
          <button type="button" class="btn btn-primary input-group-append"
                  [hidden]="!authenticated" (click)="onExec()">Exec</button>
          <button type="button" class="btn btn-primary input-group-append"
                  (click)="output=''">Clear</button>
          <button type="button" class="btn btn-primary input-group-append"
                  [hidden]="!authenticated" (click)="onStop()">Stop</button>
          <button type="button" class="btn btn-primary input-group-append"
                  [hidden]="!authenticated" (click)="onReset()">Reset</button>
        </div>
        <textarea #outputpane rows="8" class="form-control">{{output}}</textarea>
      </div>
    </div>
  </div>
  `,
  styles: ['.editor-fnc {background-color: gray}']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  title = 'MicroPython IDE';
  content = '# write new Micropython code here';
  repl: WebREPL;
  authenticated = false;
  command: string;
  output: string;
  data: string;
  scanState: ScanState = ScanState.off;
  scannedDir: string;
  fileList: string[] = [];
  editFile = '';

  @ViewChild('cmd') cmd: ElementRef;
  @ViewChild('outputpane') outputpane: ElementRef;

  ngOnInit(): void {
    this.repl = new WebREPL({
      ip: '192.168.1.103',
      password: 'max2day',
      autoConnect: true,
      autoAuth: true,
      timeout: 5000
    });

    this.repl.on('authenticated', () => {
      this.authenticated = true;
      this.getdir();
    });

    this.repl.on('output', (output) => {
      this.output += output;
      this.scrollToBottom();
      if (this.scanState !== ScanState.off) {
        switch (this.scanState) {
          case ScanState.expectStart:
            if (output === '[') {
              this.fileList  = [];
              this.scannedDir = `["${NEW_FILE}",`;
              this.scanState = ScanState.scanChars;
            } else {
              this.scannedDir = '';
            }
            break;
          case ScanState.scanChars:
            if (output === ']') {
              this.scanState = ScanState.complete;
            } else if (output === '\'') {
              output = '"';
            }
            this.scannedDir += output;
            break;
          case ScanState.complete:
            this.fileList = JSON.parse(this.scannedDir);
            this.scanState = ScanState.off;
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authenticated) {
      this.repl.disconnect();
    }
  }

  ngAfterViewInit(): void {
    this.cmd.nativeElement.focus();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  onExec() {
    this.repl.eval(`${this.command}\r`);
  }

  onCmdEnter(key: string) {
    if (key === 'Enter') {
      this.onExec();
    }
  }

  onStop() {
    this.repl.sendStop();
  }

  onReset() {
    this.repl.softReset();
  }

  scrollToBottom() {
    let pane = this.outputpane.nativeElement;
    pane.scrollTop = pane.scrollHeight;
  }

  getdir() {
    this.scanState = ScanState.expectStart;
    this.repl.eval('uos.listdir()\r');
  }

  loadfile(filename: string ) {
    this.editFile = filename;
    if (this.editFile === NEW_FILE) {
      this.content = '';
      return;
    }

    this.repl.loadFile(this.editFile).then((blob) => {
      let decoder = new TextDecoder('utf-8');
      this.content = decoder.decode(blob);
    });
  }

  savefile() {
    let buffer = new TextEncoder().encode(this.content);
    this.repl.sendFile(this.editFile, buffer);
  }

}
