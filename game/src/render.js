// The Velvet Vault — rendering: the museum, the cones, the HUD.
// One job: draw the whole frame on one canvas — room, watchers, thief, HUD.

import { VIEW_W, VIEW_H, HUD_H, ROOM, PALETTE, TOOLS } from './config.js';
import { PHASES, exitOpen } from './game.js';
import { TOOL_ORDER, toolButtonRect } from './tools.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, facing, half, range, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - half, facing + half);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  // A brighter rim so the cone's edge reads at a glance.
  ctx.beginPath();
  ctx.arc(x, y, range, facing - half, facing + half);
  ctx.strokeStyle = fill.replace(/[\d.]+\)$/, '0.5)');
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx) {
  // Marble checker.
  const tile = 56;
  for (let y = ROOM.y; y < ROOM.y + ROOM.h; y += tile) {
    for (let x = ROOM.x; x < ROOM.x + ROOM.w; x += tile) {
      const odd = (Math.floor((x - ROOM.x) / tile) + Math.floor((y - ROOM.y) / tile)) % 2 === 0;
      ctx.fillStyle = odd ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let x = ROOM.x; x <= ROOM.x + ROOM.w; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, ROOM.y); ctx.lineTo(x, ROOM.y + ROOM.h); ctx.stroke();
  }
  for (let y = ROOM.y; y <= ROOM.y + ROOM.h; y += tile) {
    ctx.beginPath(); ctx.moveTo(ROOM.x, y); ctx.lineTo(ROOM.x + ROOM.w, y); ctx.stroke();
  }
  // The red carpet runner down the middle — the bold route, fully exposed.
  const carpetY = ROOM.y + ROOM.h / 2 - 46;
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(ROOM.x, carpetY, ROOM.w, 92);
  ctx.fillStyle = PALETTE.carpetEdge;
  ctx.fillRect(ROOM.x, carpetY, ROOM.w, 4);
  ctx.fillRect(ROOM.x, carpetY + 88, ROOM.w, 4);
  // Gold inlay diamonds along the carpet.
  ctx.fillStyle = PALETTE.goldDim;
  for (let x = ROOM.x + 70; x < ROOM.x + ROOM.w; x += 140) {
    ctx.save();
    ctx.translate(x, ROOM.y + ROOM.h / 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
  }
}

function drawWalls(ctx, level) {
  // Outer shell.
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(ROOM.x - 14, ROOM.y - 14, ROOM.w + 28, 14);
  ctx.fillRect(ROOM.x - 14, ROOM.y + ROOM.h, ROOM.w + 28, 14);
  ctx.fillRect(ROOM.x - 14, ROOM.y - 14, 14, ROOM.h + 28);
  ctx.fillRect(ROOM.x + ROOM.w, ROOM.y - 14, 14, ROOM.h + 28);
  ctx.strokeStyle = PALETTE.goldDim;
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x - 14, ROOM.y - 14, ROOM.w + 28, ROOM.h + 28);

  for (const w of level.walls) {
    if (w.kind === 'case') {
      ctx.fillStyle = PALETTE.pedestal;
      roundRect(ctx, w.x, w.y, w.w, w.h, 6);
      ctx.fill();
      ctx.fillStyle = PALETTE.pedestalTop;
      roundRect(ctx, w.x + 5, w.y + 5, w.w - 10, w.h - 10, 4);
      ctx.fill();
      ctx.strokeStyle = PALETTE.goldDim;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (w.kind === 'statue') {
      ctx.fillStyle = '#6d6480';
      ctx.beginPath();
      ctx.ellipse(w.x + w.w / 2, w.y + w.h / 2, w.w / 2 + 3, w.h / 2 + 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.statue;
      ctx.beginPath();
      ctx.ellipse(w.x + w.w / 2, w.y + w.h / 2, w.w / 2 - 4, w.h / 2 - 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b7aed0';
      ctx.beginPath();
      ctx.arc(w.x + w.w / 2 - 6, w.y + w.h / 2 - 8, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (w.kind === 'rope') {
      ctx.strokeStyle = PALETTE.rope;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w.x, w.y + 5);
      ctx.quadraticCurveTo(w.x + w.w / 2, w.y + 16, w.x + w.w, w.y + 5);
      ctx.stroke();
      ctx.fillStyle = PALETTE.gold;
      for (const px of [w.x, w.x + w.w / 2, w.x + w.w]) {
        ctx.beginPath();
        ctx.arc(px, w.y + 5, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawLoot(ctx, game) {
  for (const item of game.loot) {
    if (item.taken) continue;
    const pulse = 0.5 + 0.5 * Math.sin(game.now * 3 + item.x);
    // Glow ring so loot is obvious at a glance.
    ctx.beginPath();
    ctx.arc(item.x, item.y, 26 + pulse * 4, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 215, 106, ${0.35 + pulse * 0.35})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    if (item.kind === 'painting') {
      ctx.fillStyle = '#7a5a28';
      ctx.fillRect(item.x - 34, item.y - 24, 68, 48);
      ctx.fillStyle = '#c9a35c';
      ctx.fillRect(item.x - 29, item.y - 19, 58, 38);
      ctx.fillStyle = '#3d2f1a';
      ctx.beginPath();
      ctx.arc(item.x, item.y + 2, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8d9b0';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('◉', item.x, item.y + 6);
    } else if (item.kind === 'gem') {
      ctx.fillStyle = '#7ec8ff';
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 16);
      ctx.lineTo(item.x + 15, item.y - 2);
      ctx.lineTo(item.x + 9, item.y + 14);
      ctx.lineTo(item.x - 9, item.y + 14);
      ctx.lineTo(item.x - 15, item.y - 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#dff2ff';
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 16);
      ctx.lineTo(item.x + 7, item.y - 2);
      ctx.lineTo(item.x, item.y + 6);
      ctx.lineTo(item.x - 7, item.y - 2);
      ctx.closePath();
      ctx.fill();
    } else if (item.kind === 'scarab') {
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.ellipse(item.x, item.y, 15, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5c430f';
      ctx.beginPath();
      ctx.arc(item.x, item.y - 2, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.kind === 'vase') {
      ctx.fillStyle = '#7fa8c9';
      ctx.beginPath();
      ctx.moveTo(item.x - 6, item.y - 18);
      ctx.quadraticCurveTo(item.x - 15, item.y, item.x - 7, item.y + 15);
      ctx.lineTo(item.x + 7, item.y + 15);
      ctx.quadraticCurveTo(item.x + 15, item.y, item.x + 6, item.y - 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#dfeaf2';
      ctx.fillRect(item.x - 9, item.y - 4, 18, 3);
    } else if (item.kind === 'mask') {
      ctx.fillStyle = '#4fae7d';
      ctx.beginPath();
      ctx.ellipse(item.x, item.y, 14, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#123326';
      ctx.beginPath();
      ctx.ellipse(item.x - 5, item.y - 3, 3, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(item.x + 5, item.y - 3, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Label under the loot.
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.label.toUpperCase(), item.x, item.y + 44);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '10px sans-serif';
    ctx.fillText(`$${item.value.toLocaleString()}`, item.x, item.y + 58);
  }
  for (const c of game.coins) {
    if (c.taken) continue;
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a6a1d';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', c.x, c.y + 3.5);
  }
}

function drawExit(ctx, game) {
  const e = game.level.exit;
  const open = exitOpen(game);
  const glow = open ? 0.55 + 0.45 * Math.sin(game.now * 4) : 0.15;
  ctx.fillStyle = open ? `rgba(126, 224, 129, ${glow})` : 'rgba(120, 120, 120, 0.25)';
  ctx.fillRect(e.x - 6, e.y - 6, e.w + 12, e.h + 12);
  ctx.fillStyle = open ? '#1d5c2a' : '#3a3a3a';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = open ? PALETTE.safe : PALETTE.textDim;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(e.x - 14, e.y + e.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(open ? 'GETAWAY — GO!' : 'GETAWAY (LOCKED)', 0, 0);
  ctx.restore();
}

function drawGuards(ctx, game) {
  for (const g of game.guards) {
    const alert = g.state === 'chase';
    const suspicious = g.state === 'suspicious';
    const fill = alert ? PALETTE.guardConeAlert : suspicious ? 'rgba(255, 160, 60, 0.26)' : PALETTE.guardCone;
    drawCone(ctx, g.x, g.y, g.facing, g.halfAngle, g.range, fill);
  }
  for (const g of game.guards) {
    // Waypoint path, faint, so patrols can be read before moving.
    ctx.strokeStyle = 'rgba(63, 111, 181, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    g.waypoints.forEach((w, i) => {
      if (i === 0) ctx.moveTo(w.x, w.y);
      else ctx.lineTo(w.x, w.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    // Body.
    ctx.fillStyle = g.state === 'chase' ? '#c0392b' : PALETTE.guardBody;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#dfe9ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing tick + cap brim.
    ctx.strokeStyle = '#dfe9ff';
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.facing) * 20, g.y + Math.sin(g.facing) * 20);
    ctx.stroke();
    ctx.fillStyle = '#f2ead8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.name.toUpperCase(), g.x, g.y - 22);
    // Suspicion arc over the head.
    if (g.suspicion > 0.05) {
      ctx.strokeStyle = g.suspicion > 0.8 ? PALETTE.danger : PALETTE.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 21, -Math.PI / 2, -Math.PI / 2 + g.suspicion * Math.PI * 2);
      ctx.stroke();
    }
    if (g.state === 'chase') {
      ctx.fillStyle = PALETTE.danger;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('!', g.x, g.y - 32);
    }
  }
}

function drawCameras(ctx, game) {
  for (const cam of game.cameras) {
    const disabled = game.now < cam.disabledUntil;
    const fill = disabled ? 'rgba(120, 120, 120, 0.08)' : cam.spotting > 0.3 ? PALETTE.cameraConeAlert : PALETTE.cameraCone;
    if (!disabled) drawCone(ctx, cam.x, cam.y, cam.facing, cam.halfAngle, cam.range, fill);
    // Mount on the wall.
    ctx.fillStyle = disabled ? '#555' : '#20242e';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = disabled ? '#888' : cam.spotting > 0.3 ? PALETTE.danger : '#7edcff';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(disabled ? 'CAM OFF' : 'CAM', cam.x, cam.y - 16);
  }
}

function drawThief(ctx, game) {
  const t = game.thief;
  if (game.smokeCloud) {
    ctx.fillStyle = PALETTE.smoke;
    ctx.beginPath();
    ctx.arc(game.smokeCloud.x, game.smokeCloud.y, 64, 0, Math.PI * 2);
    ctx.fill();
  }
  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(t.x, t.y + 9, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: black-clad thief with a gold-trimmed mask.
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.thiefTrim;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Mask band + eyes.
  ctx.fillStyle = PALETTE.thiefTrim;
  ctx.fillRect(t.x - 9, t.y - 4, 18, 6);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(t.x - 4, t.y - 1, 2, 0, Math.PI * 2);
  ctx.arc(t.x + 4, t.y - 1, 2, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick.
  ctx.strokeStyle = PALETTE.thiefTrim;
  ctx.beginPath();
  ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.faceAngle) * 18, t.y + Math.sin(t.faceAngle) * 18);
  ctx.stroke();
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', t.x, t.y - 20);
  if (t.sneaking) {
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAKING', t.x, t.y + 28);
  }
  // Noise ping ripple.
  if (game.noisePing && game.now < game.noisePing.until) {
    const age = 1 - (game.noisePing.until - game.now) / 1.2;
    ctx.strokeStyle = `rgba(255, 214, 90, ${1 - age})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(game.noisePing.x, game.noisePing.y, 12 + age * 46, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(ctx, game) {
  // Bar.
  ctx.fillStyle = '#100d1a';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = PALETTE.goldDim;
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);

  // Title block.
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE VELVET VAULT', 16, 24);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px sans-serif';
  ctx.fillText(game.level ? game.level.name : 'A museum heist in three nights', 16, 44);

  // ALARM meter — the big labelled bar the whole game revolves around.
  const ax = 300;
  const aw = 280;
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax, 22);
  ctx.fillStyle = '#2a2438';
  roundRect(ctx, ax, 28, aw, 18, 4);
  ctx.fill();
  const frac = Math.min(1, game.alarm / 100);
  const alarmColor = game.alarm > 70 ? PALETTE.danger : game.alarm > 40 ? '#ff9f2e' : PALETTE.gold;
  if (frac > 0) {
    ctx.fillStyle = alarmColor;
    roundRect(ctx, ax, 28, aw * frac, 18, 4);
    ctx.fill();
  }
  ctx.strokeStyle = '#f2ead8';
  ctx.lineWidth = 1.5;
  roundRect(ctx, ax, 28, aw, 18, 4);
  ctx.stroke();
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`${Math.round(game.alarm)}%`, ax + aw + 10, 43);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '11px sans-serif';
  ctx.fillText(game.alarm > 70 ? 'LOCKDOWN IMMINENT' : game.alarm > 40 ? 'SPOTTED — HIDE!' : 'unseen', ax, 60);

  // Tool buttons.
  for (let i = 0; i < TOOL_ORDER.length; i++) {
    const kind = TOOL_ORDER[i];
    const def = TOOLS[kind];
    const r = toolButtonRect(kind, i);
    const count = game.thief ? game.thief.tools[kind] : 0;
    ctx.fillStyle = count > 0 ? '#241d33' : '#17131f';
    roundRect(ctx, r.x, r.y, r.w, r.h, 6);
    ctx.fill();
    ctx.strokeStyle = count > 0 ? PALETTE.goldDim : '#3a3348';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = count > 0 ? PALETTE.text : PALETTE.textDim;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`[${def.key}] ${def.name}`, r.x + 8, r.y + 16);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '10px sans-serif';
    ctx.fillText(`x${count}  ·  buy $${def.price} (Shift+${def.key})`, r.x + 8, r.y + 32);
  }

  // Loot, coins, timer — right side.
  const t = game.thief;
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`LOOT $${t ? t.lootValue.toLocaleString() : 0}`, 1230, 24);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '13px sans-serif';
  ctx.fillText(`Coins $${t ? t.coins : 0}   ·   ${t ? t.lootTaken.length : 0}/${game.level ? game.level.requiredLoot : 0} masterpieces`, 1230, 44);
  const mins = Math.floor(game.timeLeft / 60);
  const secs = Math.floor(game.timeLeft % 60);
  ctx.fillStyle = game.timeLeft < 60 ? PALETTE.danger : PALETTE.textDim;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`Cleaner in ${mins}:${String(secs).padStart(2, '0')}`, 1230, 62);
  ctx.textAlign = 'left';

  // Objective + hint line under the room.
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  const hint = game.phase === 'play'
    ? (game.toast && game.now < game.toastUntil ? game.toast : '')
    : '';
  ctx.fillText(hint, VIEW_W / 2, VIEW_H - 8);
}

function drawOverlay(ctx, game) {
  const cx = VIEW_W / 2;
  if (game.phase === 'title') {
    ctx.fillStyle = 'rgba(10, 8, 18, 0.82)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE VELVET VAULT', cx, 190);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px sans-serif';
    ctx.fillText('A museum heist in three nights', cx, 230);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '15px sans-serif';
    ctx.fillText('WASD / arrows to move · Shift to sneak · E to lift loot · 1/2/3 tools · Shift+1/2/3 to buy', cx, 300);
    ctx.fillText('Lift the masterpieces, dodge the cones, and reach the getaway door before the alarm hits 100.', cx, 326);
    ctx.fillText('EMP blinds cameras · Noisemaker lures guards · Smoke hides you — all bought with coins.', cx, 352);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Press ENTER to start the heist', cx, 420);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '13px sans-serif';
    ctx.fillText('An original game — no assets borrowed from any other game.', cx, 470);
    return;
  }
  if (game.phase === 'busted') {
    ctx.fillStyle = 'rgba(40, 4, 8, 0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = PALETTE.danger;
    ctx.font = 'bold 46px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUSTED!', cx, 300);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '18px sans-serif';
    ctx.fillText(game.endReason, cx, 344);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '15px sans-serif';
    ctx.fillText('Press ENTER to retry this night', cx, 400);
    return;
  }
  if (game.phase === 'night-done') {
    ctx.fillStyle = 'rgba(6, 26, 10, 0.82)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = PALETTE.safe;
    ctx.font = 'bold 46px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CLEAN GETAWAY!', cx, 280);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '18px sans-serif';
    ctx.fillText(game.endReason, cx, 324);
    ctx.fillText(`Total score so far: $${game.totalScore.toLocaleString()}`, cx, 356);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(game.nightIndex + 1 < 3 ? 'Press ENTER for the next night' : 'Press ENTER to see the final take', cx, 420);
    return;
  }
  if (game.phase === 'escaped') {
    ctx.fillStyle = 'rgba(10, 8, 18, 0.86)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 46px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE VAULT IS EMPTY', cx, 280);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px sans-serif';
    ctx.fillText(`Three nights, one clean crew. Final take: $${game.totalScore.toLocaleString()}`, cx, 330);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '15px sans-serif';
    ctx.fillText('Press ENTER to run it all again', cx, 390);
  }
}

export function renderGame(ctx, game) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#0d0b14';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (!game.level) {
    // Title screen before any night loads still shows the museum shell.
    drawFloor(ctx);
    drawHud(ctx, game);
    drawOverlay(ctx, game);
    return;
  }
  drawFloor(ctx);
  drawWalls(ctx, game.level);
  drawLoot(ctx, game);
  drawExit(ctx, game);
  drawCameras(ctx, game);
  drawGuards(ctx, game);
  drawThief(ctx, game);
  // Spotted flash: a red vignette when the alarm spikes.
  if (game.spottedFlash > 0) {
    ctx.fillStyle = `rgba(255, 40, 40, ${game.spottedFlash * 0.18})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  drawHud(ctx, game);
  drawOverlay(ctx, game);
}
