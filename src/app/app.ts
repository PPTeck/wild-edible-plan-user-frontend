import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {

  // Disable right-click
  @HostListener('document:contextmenu', ['$event'])
  disableRightClick(event: MouseEvent): void {
    event.preventDefault();
  }

  // Disable common browser DevTools shortcuts
  @HostListener('document:keydown', ['$event'])
  disableDevToolsShortcuts(event: KeyboardEvent): void {

    // F12
    if (event.key === 'F12') {
      event.preventDefault();
      return;
    }

    // Ctrl + Shift + I
    if (
      event.ctrlKey &&
      event.shiftKey &&
      event.key.toLowerCase() === 'i'
    ) {
      event.preventDefault();
      return;
    }

    // Ctrl + Shift + J
    if (
      event.ctrlKey &&
      event.shiftKey &&
      event.key.toLowerCase() === 'j'
    ) {
      event.preventDefault();
      return;
    }

    // Ctrl + Shift + C
    if (
      event.ctrlKey &&
      event.shiftKey &&
      event.key.toLowerCase() === 'c'
    ) {
      event.preventDefault();
      return;
    }

    // Ctrl + U
    if (
      event.ctrlKey &&
      event.key.toLowerCase() === 'u'
    ) {
      event.preventDefault();
      return;
    }
  }
}