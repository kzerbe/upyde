import {Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef, AfterViewChecked} from '@angular/core';
import { WebREPL } from 'webrepl-client/webrepl.js';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConnectDialogComponent} from './connect_dialog.component';

enum ScanState {
  off,
  expectStart,
  scanChars,
  complete
}

interface Account {
  address: string;
  password: string;
}

const NEW_FILE = 'new_file.py';
const ACCOUNT_STORE = 'credentials';

@Component({
  selector: 'app-root',
  template: `<div class="container-fluid">
    <div class="card">
      <div class="card-header">
        <h3 [innerHTML]="title"></h3>
        <span *ngIf="hasAccount;else noconnection">connected to: {{account.address}}&nbsp;
          <button type="button" class="btn btn-primary btn-sm" (click)="onDisconnect()">Disconnect</button>
        </span>
        <ng-template #noconnection>
          <span >no connection &nbsp; 
            <button type="button" class="btn btn-sm btn-primary" (click)="onConnect()">Connect</button> </span>
        </ng-template>
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
        <textarea #outputpane rows="8" class="form-control" readonly>{{output}}</textarea>
      </div>
    </div>
  </div>
  `,
  styles: ['.editor-fnc {background-color: gray}']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  title = '&#x03BC;PyDE : The easy MicroPython IDE';
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
  account = {address: '', password: ''} as Account;

  @ViewChild('cmd') cmd: ElementRef;
  @ViewChild('outputpane') outputpane: ElementRef;

  constructor(private modalService: NgbModal) {

  }

  get hasAccount() {
    return this.account && !!this.account.address && !!this.account.password;
  }

  ngOnInit(): void {
    this.account = JSON.parse(localStorage.getItem(ACCOUNT_STORE));
    if (this.hasAccount) {
      this.connect(this.account.address, this.account.password);
    }
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

  onConnect() {
    this.modalService.open(ConnectDialogComponent).result.then(connectData => {
      this.connect(connectData.address, connectData.password);
    }, () => {
    });
  }

  onDisconnect() {
    this.repl.disconnect();
    localStorage.removeItem(ACCOUNT_STORE);
    location.reload();
  }

  connect(address: string, password: string) {
    this.repl = new WebREPL({
      ip: address,
      password: password,
      autoConnect: true,
      autoAuth: true,
      timeout: 5000
    });

    this.repl.on('authenticated', () => {
      this.authenticated = true;
      this.account = { address: address, password: password}
      localStorage.setItem(ACCOUNT_STORE, JSON.stringify(this.account));
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
