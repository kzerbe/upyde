import {Component, OnInit, ViewChild, ElementRef} from '@angular/core';
import { NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

const IP_VALID = /^([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])$/;


@Component({
  selector: 'ngbd-modal-content',
  template: `
    <div class="modal-header">
      <h4 class="modal-title">Connect to Device</h4>
      <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss()">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <form novalidate>
        <div class="form-row">
          <label>device IP address
            <input #address type="text" name="address" [(ngModel)]="ipAddress" (keyup)="checkIp($event.target.value)"
                   class="form-control" placeholder='device IP address'>
          </label>
          <div class="error" *ngIf="hasError">
            IP address should have a format like 192.168.1.123
          </div>
        </div>
        <div class="form-row">
          <label>password
            <input type="password" name="password" [(ngModel)]="password"
                   class="form-control" placeholder="password">
          </label>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-primary" (click)="activeModal.dismiss()">Cancel</button>
      <button type="button" [disabled]="hasError" class="btn btn-primary" (click)="onOkClicked()">OK</button>
    </div>
  `,
  styles: ['.error {color: red}']
})
export class ConnectDialogComponent implements OnInit {
  hasError: boolean;
  ipAddress: string;
  password: string;

  @ViewChild('address') _address: ElementRef;

  constructor(public activeModal: NgbActiveModal) {
  }

  ngOnInit(): void {
    this._address.nativeElement.focus();
  }

  onOkClicked() {
    this.activeModal.close({address: this.ipAddress, password: this.password});
  }

  checkIp(value: string) {
    this.hasError = !value.match(IP_VALID);
  }
}

