// The Velvet Vault — rendering: the museum, the cones, the HUD.
// One job: paint the whole frame on one canvas — room, watchers,
// thief, HUD. Nothing here changes state; it only reads the game.

import { STAGE_W, STAGE_H, BAR_H, FLOOR, PALETTE, TOOLS } from './config.js';
import { doorOpen } from './game.js';
import { BELT_ORDER, beltButtonRect } from './tools.js';

function roundedRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function paintCone(g, x, y, facing, half, range, fill) {
  g.beginPath();
  g.moveTo(x, y);
  g.arc(x, y, range, facing - half, facing + half);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  // A brighter rim so the cone's edge reads at a glance.
  g.beginPath();
  g.arc(x, y, range, facing - half, facing + half);
  g.strokeStyle = fill.replace(/[\d.]+\)$/, '0.5)');
  g.lineWidth = 1.5;
  g.stroke();
}

function paintFloor(g) {
  // Marble checker.
  const tile = 56;
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.h; y += tile) {
    for (let x = FLOOR.x; x < FLOOR.x + FLOOR.w; x += tile) {
      const odd = (Math.floor((x - FLOOR.x) / tile) + Math.floor((y - FLOOR.y) / tile)) % 2 === 0;
      g.fillStyle = odd ? PALETTE.floorLight : PALETTE.floorDark;
      g.fillRect(x, y, tile, tile);
    }
  }
  g.strokeStyle = PALETTE.floorSeam;
  g.lineWidth = 1;
  for (let x = FLOOR.x; x <= FLOOR.x + FLOOR.w; x += tile) {
    g.beginPath(); g.moveTo(x, FLOOR.y); g.lineTo(x, FLOOR.y + FLOOR.h); g.stroke();
  }
  for (let y = FLOOR.y; y <= FLOOR.y + FLOOR.h; y += tile) {
    g.beginPath(); g.moveTo(FLOOR.x, y); g.lineTo(FLOOR.x + FLOOR.w, y); g.stroke();
  }
  // The red carpet runner down the middle — the bold route, fully exposed.
  const runnerY = FLOOR.y + FLOOR.h / 2 - 46;
  g.fillStyle = PALETTE.runner;
  g.fillRect(FLOOR.x, runnerY, FLOOR.w, 92);
  g.fillStyle = PALETTE.runnerTrim;
  g.fillRect(FLOOR.x, runnerY, FLOOR.w, 4);
  g.fillRect(FLOOR.x, runnerY + 88, FLOOR.w, 4);
  // Gold inlay diamonds along the carpet.
  g.fillStyle = PALETTE.goldSoft;
  for (let x = FLOOR.x + 70; x < FLOOR.x + FLOOR.w; x += 140) {
    g.save();
    g.translate(x, FLOOR.y + FLOOR.h / 2);
    g.rotate(Math.PI / 4);
    g.fillRect(-7, -7, 14, 14);
    g.restore();
  }
}

function paintWalls(g, level) {
  // Outer shell.
  g.fillStyle = PALETTE.wallTrim;
  g.fillRect(FLOOR.x - 14, FLOOR.y - 14, FLOOR.w + 28, 14);
  g.fillRect(FLOOR.x - 14, FLOOR.y + FLOOR.h, FLOOR.w + 28, 14);
  g.fillRect(FLOOR.x - 14, FLOOR.y - 14, 14, FLOOR.h + 28);
  g.fillRect(FLOOR.x + FLOOR.w, FLOOR.y - 14, 14, FLOOR.h + 28);
  g.strokeStyle = PALETTE.goldSoft;
  g.lineWidth = 2;
  g.strokeRect(FLOOR.x - 14, FLOOR.y - 14, FLOOR.w + 28, FLOOR.h + 28);

  for (const w of level.walls) {
    if (w.kind === 'case') {
      g.fillStyle = PALETTE.caseBase;
      roundedRect(g, w.x, w.y, w.w, w.h, 6);
      g.fill();
      g.fillStyle = PALETTE.caseGlass;
      roundedRect(g, w.x + 5, w.y + 5, w.w - 10, w.h - 10, 4);
      g.fill();
      g.strokeStyle = PALETTE.goldSoft;
      g.lineWidth = 1.5;
      g.stroke();
    } else if (w.kind === 'statue') {
      g.fillStyle = '#6d6480';
      g.beginPath();
      g.ellipse(w.x + w.w / 2, w.y + w.h / 2, w.w / 2 + 3, w.h / 2 + 3, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = PALETTE.marble;
      g.beginPath();
      g.ellipse(w.x + w.w / 2, w.y + w.h / 2, w.w / 2 - 4, w.h / 2 - 4, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#b7aed0';
      g.beginPath();
      g.arc(w.x + w.w / 2 - 6, w.y + w.h / 2 - 8, 7, 0, Math.PI * 2);
      g.fill();
    } else if (w.kind === 'rope') {
      g.strokeStyle = PALETTE.ropeLine;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(w.x, w.y + 5);
      g.quadraticCurveTo(w.x + w.w / 2, w.y + 16, w.x + w.w, w.y + 5);
      g.stroke();
      g.fillStyle = PALETTE.goldMain;
      for (const px of [w.x, w.x + w.w / 2, w.x + w.w]) {
        g.beginPath();
        g.arc(px, w.y + 5, 4, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
}

function paintLoot(g, game) {
  for (const item of game.loot) {
    if (item.taken) continue;
    const pulse = 0.5 + 0.5 * Math.sin(game.now * 3 + item.x);
    // Glow ring so loot is obvious at a glance.
    g.beginPath();
    g.arc(item.x, item.y, 26 + pulse * 4, 0, Math.PI * 2);
    g.strokeStyle = `rgba(255, 215, 106, ${0.35 + pulse * 0.35})`;
    g.lineWidth = 2.5;
    g.stroke();
    if (item.kind === 'painting') {
      g.fillStyle = '#7a5a28';
      g.fillRect(item.x - 34, item.y - 24, 68, 48);
      g.fillStyle = '#c9a35c';
      g.fillRect(item.x - 29, item.y - 19, 58, 38);
      g.fillStyle = '#3d2f1a';
      g.beginPath();
      g.arc(item.x, item.y + 2, 11, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#e8d9b0';
      g.font = 'bold 10px sans-serif';
      g.textAlign = 'center';
      g.fillText('◉', item.x, item.y + 6);
    } else if (item.kind === 'gem') {
      g.fillStyle = '#7ec8ff';
      g.beginPath();
      g.moveTo(item.x, item.y - 16);
      g.lineTo(item.x + 15, item.y - 2);
      g.lineTo(item.x + 9, item.y + 14);
      g.lineTo(item.x - 9, item.y + 14);
      g.lineTo(item.x - 15, item.y - 2);
      g.closePath();
      g.fill();
      g.fillStyle = '#dff2ff';
      g.beginPath();
      g.moveTo(item.x, item.y - 16);
      g.lineTo(item.x + 7, item.y - 2);
      g.lineTo(item.x, item.y + 6);
      g.lineTo(item.x - 7, item.y - 2);
      g.closePath();
      g.fill();
    } else if (item.kind === 'scarab') {
      g.fillStyle = PALETTE.goldMain;
      g.beginPath();
      g.ellipse(item.x, item.y, 15, 11, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#5c430f';
      g.beginPath();
      g.arc(item.x, item.y - 2, 5, 0, Math.PI * 2);
      g.fill();
    } else if (item.kind === 'vase') {
      g.fillStyle = '#7fa8c9';
      g.beginPath();
      g.moveTo(item.x - 6, item.y - 18);
      g.quadraticCurveTo(item.x - 15, item.y, item.x - 7, item.y + 15);
      g.lineTo(item.x + 7, item.y + 15);
      g.quadraticCurveTo(item.x + 15, item.y, item.x + 6, item.y - 18);
      g.closePath();
      g.fill();
      g.fillStyle = '#dfeaf2';
      g.fillRect(item.x - 9, item.y - 4, 18, 3);
    } else if (item.kind === 'mask') {
      g.fillStyle = '#4fae7d';
      g.beginPath();
      g.ellipse(item.x, item.y, 14, 17, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#123326';
      g.beginPath();
      g.ellipse(item.x - 5, item.y - 3, 3, 4, 0, 0, Math.PI * 2);
      g.ellipse(item.x + 5, item.y - 3, 3, 4, 0, 0, Math.PI * 2);
      g.fill();
    }
    // Label under the loot.
    g.fillStyle = PALETTE.goldMain;
    g.font = 'bold 11px sans-serif';
    g.textAlign = 'center';
    g.fillText(item.label.toUpperCase(), item.x, item.y + 44);
    g.fillStyle = PALETTE.inkSoft;
    g.font = '10px sans-serif';
    g.fillText(`$${item.value.toLocaleString()}`, item.x, item.y + 58);
  }
  for (const c of game.coins) {
    if (c.taken) continue;
    g.fillStyle = PALETTE.goldMain;
    g.beginPath();
    g.arc(c.x, c.y, 8, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#8a6a1d';
    g.font = 'bold 10px sans-serif';
    g.textAlign = 'center';
    g.fillText('$', c.x, c.y + 3.5);
  }
}

function paintExit(g, game) {
  const e = game.level.exit;
  const open = doorOpen(game);
  const glow = open ? 0.55 + 0.45 * Math.sin(game.now * 4) : 0.15;
  g.fillStyle = open ? `rgba(126, 224, 129, ${glow})` : 'rgba(120, 120, 120, 0.25)';
  g.fillRect(e.x - 6, e.y - 6, e.w + 12, e.h + 12);
  g.fillStyle = open ? '#1d5c2a' : '#3a3a3a';
  g.fillRect(e.x, e.y, e.w, e.h);
  g.fillStyle = open ? PALETTE.goGreen : PALETTE.inkSoft;
  g.font = 'bold 12px sans-serif';
  g.textAlign = 'center';
  g.save();
  g.translate(e.x - 14, e.y + e.h / 2);
  g.rotate(-Math.PI / 2);
  g.fillText(open ? 'GETAWAY — GO!' : 'GETAWAY (LOCKED)', 0, 0);
  g.restore();
}

function paintGuards(g, game) {
  for (const guard of game.guards) {
    const alert = guard.state === 'chase';
    const suspicious = guard.state === 'suspicious';
    const fill = alert ? PALETTE.coneGuardHot : suspicious ? 'rgba(255, 160, 60, 0.26)' : PALETTE.coneGuard;
    paintCone(g, guard.x, guard.y, guard.facing, guard.halfAngle, guard.range, fill);
  }
  for (const guard of game.guards) {
    // Waypoint path, faint, so patrols can be read before moving.
    g.strokeStyle = 'rgba(63, 111, 181, 0.35)';
    g.lineWidth = 1.5;
    g.setLineDash([4, 6]);
    g.beginPath();
    guard.waypoints.forEach((w, i) => {
      if (i === 0) g.moveTo(w.x, w.y);
      else g.lineTo(w.x, w.y);
    });
    g.closePath();
    g.stroke();
    g.setLineDash([]);
    // Body.
    g.fillStyle = guard.state === 'chase' ? '#c0392b' : PALETTE.guardSuit;
    g.beginPath();
    g.arc(guard.x, guard.y, 15, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#dfe9ff';
    g.lineWidth = 2;
    g.stroke();
    // Facing tick + cap brim.
    g.strokeStyle = '#dfe9ff';
    g.beginPath();
    g.moveTo(guard.x, guard.y);
    g.lineTo(guard.x + Math.cos(guard.facing) * 20, guard.y + Math.sin(guard.facing) * 20);
    g.stroke();
    g.fillStyle = '#f2ead8';
    g.font = 'bold 10px sans-serif';
    g.textAlign = 'center';
    g.fillText(guard.name.toUpperCase(), guard.x, guard.y - 22);
    // Suspicion arc over the head.
    if (guard.suspicion > 0.05) {
      g.strokeStyle = guard.suspicion > 0.8 ? PALETTE.alarmRed : PALETTE.goldMain;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(guard.x, guard.y, 21, -Math.PI / 2, -Math.PI / 2 + guard.suspicion * Math.PI * 2);
      g.stroke();
    }
    if (guard.state === 'chase') {
      g.fillStyle = PALETTE.alarmRed;
      g.font = 'bold 13px sans-serif';
      g.fillText('!', guard.x, guard.y - 32);
    }
  }
}

function paintCameras(g, game) {
  for (const cam of game.cameras) {
    const disabled = game.now < cam.disabledUntil;
    const fill = disabled ? 'rgba(120, 120, 120, 0.08)' : cam.spotting > 0.3 ? PALETTE.coneCameraHot : PALETTE.coneCamera;
    if (!disabled) paintCone(g, cam.x, cam.y, cam.facing, cam.halfAngle, cam.range, fill);
    // Mount on the wall.
    g.fillStyle = disabled ? '#555' : '#20242e';
    g.beginPath();
    g.arc(cam.x, cam.y, 11, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = disabled ? '#888' : cam.spotting > 0.3 ? PALETTE.alarmRed : '#7edcff';
    g.beginPath();
    g.arc(cam.x, cam.y, 5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = PALETTE.inkSoft;
    g.font = 'bold 9px sans-serif';
    g.textAlign = 'center';
    g.fillText(disabled ? 'CAM OFF' : 'CAM', cam.x, cam.y - 16);
  }
}

function paintThief(g, game) {
  const t = game.thief;
  if (game.smokeCloud) {
    g.fillStyle = PALETTE.smokePuff;
    g.beginPath();
    g.arc(game.smokeCloud.x, game.smokeCloud.y, 64, 0, Math.PI * 2);
    g.fill();
  }
  // Shadow.
  g.fillStyle = 'rgba(0, 0, 0, 0.4)';
  g.beginPath();
  g.ellipse(t.x, t.y + 9, 14, 6, 0, 0, Math.PI * 2);
  g.fill();
  // Body: black-clad thief with a gold-trimmed mask.
  g.fillStyle = PALETTE.thiefSuit;
  g.beginPath();
  g.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = PALETTE.thiefGold;
  g.lineWidth = 2;
  g.stroke();
  // Mask band + eyes.
  g.fillStyle = PALETTE.thiefGold;
  g.fillRect(t.x - 9, t.y - 4, 18, 6);
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(t.x - 4, t.y - 1, 2, 0, Math.PI * 2);
  g.arc(t.x + 4, t.y - 1, 2, 0, Math.PI * 2);
  g.fill();
  // Facing tick.
  g.strokeStyle = PALETTE.thiefGold;
  g.beginPath();
  g.moveTo(t.x, t.y);
  g.lineTo(t.x + Math.cos(t.faceAngle) * 18, t.y + Math.sin(t.faceAngle) * 18);
  g.stroke();
  g.fillStyle = PALETTE.goldMain;
  g.font = 'bold 10px sans-serif';
  g.textAlign = 'center';
  g.fillText('YOU', t.x, t.y - 20);
  if (t.sneaking) {
    g.fillStyle = PALETTE.inkSoft;
    g.font = 'bold 10px sans-serif';
    g.textAlign = 'center';
    g.fillText('SNEAKING', t.x, t.y + 28);
  }
  // Noise ping ripple.
  if (game.noisePing && game.now < game.noisePing.until) {
    const age = 1 - (game.noisePing.until - game.now) / 1.2;
    g.strokeStyle = `rgba(255, 214, 90, ${1 - age})`;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(game.noisePing.x, game.noisePing.y, 12 + age * 46, 0, Math.PI * 2);
    g.stroke();
  }
}

function paintHud(g, game) {
  // Bar.
  g.fillStyle = '#100d1a';
  g.fillRect(0, 0, STAGE_W, BAR_H);
  g.fillStyle = PALETTE.goldSoft;
  g.fillRect(0, BAR_H - 2, STAGE_W, 2);

  // Title block.
  g.fillStyle = PALETTE.goldMain;
  g.font = 'bold 17px sans-serif';
  g.textAlign = 'left';
  g.fillText('THE VELVET VAULT', 16, 24);
  g.fillStyle = PALETTE.inkSoft;
  g.font = '12px sans-serif';
  g.fillText(game.level ? game.level.name : 'A museum heist in three nights', 16, 44);

  // ALARM meter — the big labelled bar the whole game revolves around.
  const ax = 300;
  const aw = 280;
  g.fillStyle = PALETTE.ink;
  g.font = 'bold 13px sans-serif';
  g.textAlign = 'left';
  g.fillText('ALARM', ax, 22);
  g.fillStyle = '#2a2438';
  roundedRect(g, ax, 28, aw, 18, 4);
  g.fill();
  const frac = Math.min(1, game.alarm / 100);
  const alarmColor = game.alarm > 70 ? PALETTE.alarmRed : game.alarm > 40 ? '#ff9f2e' : PALETTE.goldMain;
  if (frac > 0) {
    g.fillStyle = alarmColor;
    roundedRect(g, ax, 28, aw * frac, 18, 4);
    g.fill();
  }
  g.strokeStyle = '#f2ead8';
  g.lineWidth = 1.5;
  roundedRect(g, ax, 28, aw, 18, 4);
  g.stroke();
  g.fillStyle = PALETTE.ink;
  g.font = 'bold 13px sans-serif';
  g.fillText(`${Math.round(game.alarm)}%`, ax + aw + 10, 43);
  g.fillStyle = PALETTE.inkSoft;
  g.font = '11px sans-serif';
  g.fillText(game.alarm > 70 ? 'LOCKDOWN IMMINENT' : game.alarm > 40 ? 'SPOTTED — HIDE!' : 'unseen', ax, 60);

  // Tool buttons.
  for (let i = 0; i < BELT_ORDER.length; i++) {
    const kind = BELT_ORDER[i];
    const def = TOOLS[kind];
    const r = beltButtonRect(kind, i);
    const count = game.thief ? game.thief.tools[kind] : 0;
    g.fillStyle = count > 0 ? '#241d33' : '#17131f';
    roundedRect(g, r.x, r.y, r.w, r.h, 6);
    g.fill();
    g.strokeStyle = count > 0 ? PALETTE.goldSoft : '#3a3348';
    g.lineWidth = 1.5;
    g.stroke();
    g.fillStyle = count > 0 ? PALETTE.ink : PALETTE.inkSoft;
    g.font = 'bold 11px sans-serif';
    g.textAlign = 'left';
    g.fillText(`[${def.key}] ${def.name}`, r.x + 8, r.y + 16);
    g.fillStyle = PALETTE.inkSoft;
    g.font = '10px sans-serif';
    g.fillText(`x${count}  ·  buy $${def.price} (Shift+${def.key})`, r.x + 8, r.y + 32);
  }

  // Loot, coins, timer — right side.
  const t = game.thief;
  g.textAlign = 'right';
  g.fillStyle = PALETTE.goldMain;
  g.font = 'bold 16px sans-serif';
  g.fillText(`LOOT $${t ? t.lootValue.toLocaleString() : 0}`, 1230, 24);
  g.fillStyle = PALETTE.ink;
  g.font = '13px sans-serif';
  g.fillText(`Coins $${t ? t.coins : 0}   ·   ${t ? t.lootTaken.length : 0}/${game.level ? game.level.requiredLoot : 0} masterpieces`, 1230, 44);
  const mins = Math.floor(game.timeLeft / 60);
  const secs = Math.floor(game.timeLeft % 60);
  g.fillStyle = game.timeLeft < 60 ? PALETTE.alarmRed : PALETTE.inkSoft;
  g.font = 'bold 13px sans-serif';
  g.fillText(`Cleaner in ${mins}:${String(secs).padStart(2, '0')}`, 1230, 62);
  g.textAlign = 'left';

  // Objective + hint line under the room.
  g.fillStyle = PALETTE.inkSoft;
  g.font = '12px sans-serif';
  g.textAlign = 'center';
  const hint = game.phase === 'play'
    ? (game.toast && game.now < game.toastUntil ? game.toast : '')
    : '';
  g.fillText(hint, STAGE_W / 2, STAGE_H - 8);
}

function paintOverlay(g, game) {
  const cx = STAGE_W / 2;
  if (game.phase === 'title') {
    g.fillStyle = 'rgba(10, 8, 18, 0.82)';
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.fillStyle = PALETTE.goldMain;
    g.font = 'bold 54px sans-serif';
    g.textAlign = 'center';
    g.fillText('THE VELVET VAULT', cx, 190);
    g.fillStyle = PALETTE.ink;
    g.font = '20px sans-serif';
    g.fillText('A museum heist in three nights', cx, 230);
    g.fillStyle = PALETTE.inkSoft;
    g.font = '15px sans-serif';
    g.fillText('WASD / arrows to move · Shift to sneak · E to lift loot · 1/2/3 tools · Shift+1/2/3 to buy', cx, 300);
    g.fillText('Lift the masterpieces, dodge the cones, and reach the getaway door before the alarm hits 100.', cx, 326);
    g.fillText('EMP blinds cameras · Noisemaker lures guards · Smoke hides you — all bought with coins.', cx, 352);
    g.fillStyle = PALETTE.goldMain;
    g.font = 'bold 18px sans-serif';
    g.fillText('Press ENTER to start the heist', cx, 420);
    g.fillStyle = PALETTE.inkSoft;
    g.font = '13px sans-serif';
    g.fillText('An original game — no assets borrowed from any other game.', cx, 470);
    return;
  }
  if (game.phase === 'busted') {
    g.fillStyle = 'rgba(40, 4, 8, 0.78)';
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.fillStyle = PALETTE.alarmRed;
    g.font = 'bold 46px sans-serif';
    g.textAlign = 'center';
    g.fillText('BUSTED!', cx, 300);
    g.fillStyle = PALETTE.ink;
    g.font = '18px sans-serif';
    g.fillText(game.endReason, cx, 344);
    g.fillStyle = PALETTE.inkSoft;
    g.font = '15px sans-serif';
    g.fillText('Press ENTER to retry this night', cx, 400);
    return;
  }
  if (game.phase === 'night-done') {
    g.fillStyle = 'rgba(6, 26, 10, 0.82)';
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.fillStyle = PALETTE.goGreen;
    g.font = 'bold 46px sans-serif';
    g.textAlign = 'center';
    g.fillText('CLEAN GETAWAY!', cx, 280);
    g.fillStyle = PALETTE.ink;
    g.font = '18px sans-serif';
    g.fillText(game.endReason, cx, 324);
    g.fillText(`Total score so far: $${game.totalScore.toLocaleString()}`, cx, 356);
    g.fillStyle = PALETTE.goldMain;
    g.font = 'bold 18px sans-serif';
    g.fillText(game.nightIndex + 1 < 3 ? 'Press ENTER for the next night' : 'Press ENTER to see the final take', cx, 420);
    return;
  }
  if (game.phase === 'escaped') {
    g.fillStyle = 'rgba(10, 8, 18, 0.86)';
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.fillStyle = PALETTE.goldMain;
    g.font = 'bold 46px sans-serif';
    g.textAlign = 'center';
    g.fillText('THE VAULT IS EMPTY', cx, 280);
    g.fillStyle = PALETTE.ink;
    g.font = '20px sans-serif';
    g.fillText(`Three nights, one clean crew. Final take: $${game.totalScore.toLocaleString()}`, cx, 330);
    g.fillStyle = PALETTE.inkSoft;
    g.font = '15px sans-serif';
    g.fillText('Press ENTER to run it all again', cx, 390);
  }
}

export function paintGame(g, game) {
  g.clearRect(0, 0, STAGE_W, STAGE_H);
  g.fillStyle = '#0d0b14';
  g.fillRect(0, 0, STAGE_W, STAGE_H);
  if (!game.level) {
    // Title screen before any night loads still shows the museum shell.
    paintFloor(g);
    paintHud(g, game);
    paintOverlay(g, game);
    return;
  }
  paintFloor(g);
  paintWalls(g, game.level);
  paintLoot(g, game);
  paintExit(g, game);
  paintCameras(g, game);
  paintGuards(g, game);
  paintThief(g, game);
  // Spotted flash: a red vignette when the alarm spikes.
  if (game.spottedFlash > 0) {
    g.fillStyle = `rgba(255, 40, 40, ${game.spottedFlash * 0.18})`;
    g.fillRect(0, 0, STAGE_W, STAGE_H);
  }
  paintHud(g, game);
  paintOverlay(g, game);
}
