// Dapur Kilat — input.js
// Keyboard and mouse, both: WASD or arrows to walk, E or Space to use a
// station, click a station to walk over and use it, click anywhere else to
// walk there. Every listener funnels into the callbacks the game registers,
// so the game loop never touches the DOM directly.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.onKey = null; // (code) => void — single presses: start, restart, mute, pause
    this.onInteract = null; // () => void — E / Space pressed once
    this.onClick = null; // (x, y) => void — canvas coordinates, 1280x720 space
    this.mouse = { x: 0, y: 0, inside: false };
    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      if ((e.code === 'KeyE' || e.code === 'Space') && this.onInteract) this.onInteract();
      if (this.onKey) this.onKey(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    this.canvas.addEventListener('mousemove', (e) => {
      const p = this._toGame(e);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
      this.mouse.inside = true;
    });
    this.canvas.addEventListener('mouseleave', () => { this.mouse.inside = false; });
    this.canvas.addEventListener('mousedown', (e) => {
      const p = this._toGame(e);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
      if (this.onClick) this.onClick(p.x, p.y);
    });
  }

  /** Browser pixels on the scaled canvas back to the game's 1280x720 space. */
  _toGame(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 1280,
      y: ((e.clientY - r.top) / r.height) * 720,
    };
  }

  /** A unit movement vector from the held movement keys, or null. */
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (x === 0 && y === 0) return null;
    const len = Math.hypot(x, y);
    return { x: x / len, y: y / len };
  }
}
