import { Component, EventEmitter, Input, Output } from '@angular/core';

let nextToggleId = 0;

@Component({
  selector: 'app-toggle',
  templateUrl: './toggle.component.html',
  styleUrl: './toggle.component.scss'
})
export class ToggleComponent {
  @Input() label = '';
  @Input() checked = false;
  @Output() changed = new EventEmitter<boolean>();

  readonly id = `app-toggle-${nextToggleId++}`;

  onChange(value: boolean): void {
    this.checked = value;
    this.changed.emit(value);
  }
}
