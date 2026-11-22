// The Velvet Vault — input: keyboard and mouse, one shared state.
// One job: turn DOM events into the game's { up, down, left, right, sneak }
// snapshot plus edge-triggered presses the game consumes each frame.

export function makeInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    pressed: new Set(), // keys pressed since the last frame, consumed by the game
    pressedShift: new Map(), // whether Shift was held at the moment each key was pressed
    mouse: { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 },
  };
}

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};

export function attachInput(input, canvas) {
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    const field = KEYMAP[e.code];
    if (field) input[field] = true;
    // Record Shift's state at the exact moment of the press: a frame may run
    // after the Shift key is released, and Shift+1 must still mean "buy".
    if (!e.repeat) {
      input.pressed.add(e.code);
      input.pressedShift.set(e.code, !!input.sneak);
    }
  });
  window.addEventListener('keyup', (e) => {
    const field = KEYMAP[e.code];
    if (field) input[field] = false;
  });
  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = input.sneak = false;
  });
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    input.mouse.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    input.mouse.clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    input.mouse.clicked = true;
  });
}

// Call once per frame after the game has read the presses.
export function endFrameInput(input) {
  input.pressed.clear();
  input.pressedShift.clear();
  input.mouse.clicked = false;
}
