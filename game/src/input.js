// The Velvet Vault — input: keyboard and mouse, one shared state.
// One job: turn DOM events into the game's { up, down, left, right,
// sneak } snapshot, plus the edge-triggered presses the game eats
// once per frame. Shift is sampled at press time, because a frame
// can run after the key is already released.

export function freshInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    pressed: new Set(), // keys pressed since the last frame
    pressedShift: new Map(), // whether Shift was held when each key was pressed
    mouse: { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 },
  };
}

const KEY_BINDINGS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};

const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];

function scaleMouse(input, canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

export function wireInput(input, canvas) {
  window.addEventListener('keydown', (e) => {
    if (SCROLL_KEYS.includes(e.code)) e.preventDefault();
    const field = KEY_BINDINGS[e.code];
    if (field) input[field] = true;
    // Record Shift's state at the exact moment of the press: a frame may
    // run after the Shift key is released, and Shift+1 must still mean "buy".
    if (!e.repeat) {
      input.pressed.add(e.code);
      input.pressedShift.set(e.code, !!input.sneak);
    }
  });
  window.addEventListener('keyup', (e) => {
    const field = KEY_BINDINGS[e.code];
    if (field) input[field] = false;
  });
  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = input.sneak = false;
  });
  canvas.addEventListener('mousemove', (e) => {
    const at = scaleMouse(input, canvas, e.clientX, e.clientY);
    input.mouse.x = at.x;
    input.mouse.y = at.y;
  });
  canvas.addEventListener('mousedown', (e) => {
    const at = scaleMouse(input, canvas, e.clientX, e.clientY);
    input.mouse.clickX = at.x;
    input.mouse.clickY = at.y;
    input.mouse.clicked = true;
  });
}

// Call once per frame after the game has read the presses.
export function clearFrameInput(input) {
  input.pressed.clear();
  input.pressedShift.clear();
  input.mouse.clicked = false;
}
