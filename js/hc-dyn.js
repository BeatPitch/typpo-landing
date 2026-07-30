/* hc-dyn: measured-media timeline generator for the hero.
   Reads duration + aspect from the actual video files and regenerates every
   hero keyframe set from those numbers. The only fixed values left are
   gesture times (rise, wipe, hold) collected in G. */
(function () {
  'use strict';
  var G = {
    intro: 1.5,        // opening track drift
    riseLead: 0.45,    // dwell before the card lifts
    rise: 0.85,        // lift duration
    rate: 0.039,       // typing seconds per character
    sendGap: 0.2,      // send pulse -> box closes
    load: 1.85,        // loading tile (hammer) duration
    wipe: 0.55,        // reveal wipe
    posterHold: 0.7,   // still frame after wipe before playback
    linger: 0.45,      // after the replacement ends
    clearGap: 0.15,
    descend: 0.85,
    descendGap: 0.9,
    travel: 0.6,       // track move to next beat
    travelTail: 0.65
  };
  var SEL = [8, 10, 12, 14];

  function q(s, r) { return (r || document).querySelectorAll(s); }

  function collect() {
    var shells = [].slice.call(q('.hc-track > .hc-shell'));
    if (shells.length !== 24) return null;
    var vids = shells.map(function (s) { return s.querySelector('video'); });
    var afters = SEL.map(function (i) { return shells[i].querySelector('.hc-after'); });
    var lines = [].slice.call(q('.hc-lines .hc-line .t'));
    if (vids.some(function (v) { return !v; }) || afters.some(function (v) { return !v; }) || lines.length !== 4) return null;
    var need = vids.slice(8, 16).concat(afters);
    if (need.some(function (v) { return !(v.readyState >= 1 && v.videoWidth); })) return null;
    var track = document.querySelector('.hc-track');
    var gap = parseFloat(getComputedStyle(track).gap) || 64;
    return {
      shells: shells, vids: vids, afters: afters, track: track, gap: gap,
      AR: vids.slice(8, 16).map(function (v) { return v.videoWidth / v.videoHeight; }),
      before: SEL.map(function (i) { return vids[i].duration; }),
      afterD: afters.map(function (v) { return v.duration; }),
      chars: lines.map(function (t) { return (t.textContent || '').length; }),
      rots: SEL.map(function (i) {
        var m = /rotate\(([-\d.]+)deg\)/.exec(shells[i].getAttribute('style') || '');
        return m ? parseFloat(m[1]) : 0;
      })
    };
  }

  function build(M) {
    var CH = 'var(--chRest,130px)';
    // ---- beat schedule (seconds, relative to cycle start) ----
    var beats = [], t = G.intro;
    for (var k = 0; k < 4; k++) {
      var typeDur = M.chars[k] * G.rate;
      var riseStart = t + G.riseLead, risen = riseStart + G.rise;
      var beforeEnd = risen + M.before[k];
      var typeStart = Math.max(risen + 0.25, beforeEnd - (typeDur + G.sendGap + G.load));
      var typeEnd = typeStart + typeDur;
      var boxClose = typeEnd + G.sendGap;
      var loadEnd = boxClose + G.load;               // reveal starts here
      var posterDrop = loadEnd + G.wipe + G.posterHold;
      var afterEnd = posterDrop + M.afterD[k];
      var clearAt = afterEnd + G.linger;
      var descendStart = clearAt + G.clearGap + 0.1;
      var travelStart = descendStart + G.descendGap;
      var end = travelStart + G.travel + G.travelTail;
      beats.push({ start: t, riseStart: riseStart, risen: risen, typeStart: typeStart,
        typeEnd: typeEnd, boxClose: boxClose, loadEnd: loadEnd, posterDrop: posterDrop,
        afterEnd: afterEnd, clearAt: clearAt, descendStart: descendStart,
        travelStart: travelStart, end: end });
      t = end;
    }
    var CYC = t;
    function pc(x) { return +(x / CYC * 100).toFixed(4) + '%'; }

    // ---- geometry from measured aspect ratios ----
    var pre = [0]; M.AR.forEach(function (a, i) { pre.push(pre[i] + a); });
    function centreK(i) { var u = i % 8, set = Math.floor(i / 8); return { n: set * pre[8] + pre[u] + M.AR[u] / 2, g: M.gap * i }; }
    function off(i, extra) { var c = centreK(i); return 'calc(50vw - ' + c.n.toFixed(4) + '*' + CH + ' - ' + (c.g + (extra || 0)) + 'px)'; }

    var T1 = 'animation-timing-function:cubic-bezier(.22,1,.3,1)';
    var T2 = 'animation-timing-function:cubic-bezier(.5,0,.35,1)';
    var T3 = 'animation-timing-function:cubic-bezier(.25,.9,.3,1)';
    var TT = 'animation-timing-function:cubic-bezier(.33,0,.25,1)';
    var css = '';

    // widths from aspect ratio
    for (var u = 0; u < 8; u++)
      css += '.hc-track>.hc-shell:nth-child(8n+' + (u + 1) + '){width:calc(' + CH + '*' + M.AR[u].toFixed(4) + ')!important}';

    // ---- track ----
    var kf = '@keyframes hcTrack{0%{transform:translateX(' + off(8, 130) + ');' + TT + '}';
    kf += pc(G.intro) + '{transform:translateX(' + off(8) + ');animation-timing-function:linear}';
    for (k = 0; k < 4; k++) {
      var b = beats[k], nxt = k < 3 ? off(SEL[k + 1]) : off(16, -(pre[8] * 0 ) );
      if (k === 3) nxt = 'calc(' + off(8) + ' - ' + (pre[8]).toFixed(4) + '*' + CH + ' - ' + (M.gap * 8) + 'px)';
      kf += pc(b.travelStart) + '{transform:translateX(' + off(SEL[k]) + ');' + TT + '}';
      kf += pc(b.travelStart + G.travel) + (k === 3 ? ',100%' : '') + '{transform:translateX(' + nxt + ')' + (k === 3 ? '' : ';animation-timing-function:linear') + '}';
    }
    css += kf + '}';

    // ---- per-beat sets ----
    var RV = ['--riseT', '--riseT', '--rise2', '--rise3'], SV = ['--scT', '--scT', '--sc2', '--sc3'];
    var LW = ['--lw01', '--lw01', '--lw2', '--lw3'], LH = ['--lh01', '--lh01', '--lh2', '--lh3'];
    var TY = ['--tyA', '--tyA', '--ty2', '--ty3'];
    for (k = 0; k < 4; k++) {
      var bt = beats[k], r = M.rots[k];
      var rest = 'opacity:1;z-index:1;transform:translateY(0) scale(1) rotate(' + r + 'deg)';
      var up = 'opacity:1;z-index:6;transform:translateY(calc(-1 * var(' + RV[k] + '))) scale(var(' + SV[k] + ')) rotate(0deg)';
      css += '@keyframes hcSel' + k + '{0%{' + rest + '}' + pc(bt.riseStart) + '{' + rest + ';' + T1 + '}'
        + pc(bt.risen) + ',' + pc(bt.descendStart) + '{' + up + ';animation-timing-function:cubic-bezier(.55,0,.3,1)}'
        + pc(bt.descendStart + G.descend) + ',100%{' + rest + '}}';
      // typing
      css += '@keyframes hcTxt' + k + '{0%,' + pc(bt.typeStart) + '{clip-path:inset(0 100% 0 0);animation-timing-function:steps(' + M.chars[k] + ',end)}'
        + pc(bt.typeEnd) + ',' + pc(bt.clearAt) + '{clip-path:inset(0 0 0 0)}' + pc(bt.clearAt + 0.02 / CYC * 100) + ',100%{clip-path:inset(0 100% 0 0)}}';
      css += '@keyframes hcCar' + k + '{0%,' + pc(bt.typeStart) + '{left:0;opacity:0;animation-timing-function:steps(' + M.chars[k] + ',end)}'
        + pc(bt.typeStart + 0.03) + '{opacity:1}' + pc(bt.typeEnd) + '{left:100%;opacity:1}' + pc(bt.typeEnd + 0.45) + ',100%{left:100%;opacity:0}}';
      // reveal stack
      css += '@keyframes hcAfter' + k + '{0%,' + pc(bt.loadEnd) + '{opacity:0;clip-path:inset(0 0 100% 0 round 8px)}'
        + pc(bt.loadEnd + 0.03) + '{opacity:1;clip-path:inset(0 0 100% 0 round 8px)}'
        + pc(bt.loadEnd + G.wipe) + '{opacity:1;clip-path:inset(0 0 0 0 round 8px);animation-timing-function:cubic-bezier(.4,0,.2,1)}'
        + pc(bt.clearAt + 0.3) + '{opacity:1;clip-path:inset(0 0 0 0 round 8px)}'
        + pc(bt.clearAt + 0.6) + ',100%{opacity:0;clip-path:inset(0 0 100% 0 round 8px)}}';
      css += '@keyframes hcPost' + k + '{0%,' + pc(bt.posterDrop) + '{opacity:1}' + pc(bt.posterDrop + 0.04) + ',100%{opacity:0}}';
      css += '@keyframes hcFlash' + k + '{0%,' + pc(bt.loadEnd - 0.05) + '{opacity:0}' + pc(bt.loadEnd + 0.15) + '{opacity:.85}' + pc(bt.loadEnd + 0.5) + ',100%{opacity:0}}';
      css += '@keyframes hcSweep' + k + '{0%,' + pc(bt.loadEnd - 0.02) + '{opacity:0;transform:translateY(0)}' + pc(bt.loadEnd + 0.05) + '{opacity:1}'
        + pc(bt.loadEnd + G.wipe) + '{opacity:1;transform:translateY(430%)}' + pc(bt.loadEnd + G.wipe + 0.1) + ',100%{opacity:0;transform:translateY(430%)}}';
      css += '@keyframes hcBlur' + k + '{0%,' + pc(bt.boxClose - 0.1) + '{filter:blur(0) saturate(1);transform:scale(1)}'
        + pc(bt.boxClose + 0.7) + ',' + pc(bt.loadEnd + G.wipe) + '{filter:blur(14px) saturate(.72) contrast(.62) brightness(1.6);transform:scale(1.05);animation-timing-function:cubic-bezier(.3,0,.2,1)}'
        + pc(bt.loadEnd + G.wipe + 0.9) + '{filter:blur(0) saturate(1.06);transform:scale(1)}'
        + pc(bt.loadEnd + G.wipe + 1.15) + ',100%{filter:blur(0) saturate(1);transform:scale(1)}}';
    }

    // dim (non-selected rest opacity) — full opacity per current design, so skip hcDim changes.

    // ---- headline split ----
    function splitStops(name, sign) {
      var s = '@keyframes ' + name + '{0%{transform:translateX(0)}';
      for (var k2 = 0; k2 < 4; k2++) {
        var b2 = beats[k2];
        var d = 'calc(' + (sign < 0 ? '-1 * (' : '(') + 'var(' + SV[k2] + ') * ' + CH + ' * ' + (M.AR[SEL[k2] % 8] / 2).toFixed(4) + ' + var(--gut) - 7px ' + (sign < 0 ? '- var(--kx)' : '+ var(--kx)') + ')' + ')';
        s += pc(b2.riseStart) + '{transform:translateX(0);' + T1 + '}';
        s += pc(b2.risen) + ',' + pc(b2.descendStart) + '{transform:translateX(' + d + ');animation-timing-function:cubic-bezier(.5,0,.3,1)}';
        s += pc(b2.descendStart + G.descend) + '{transform:translateX(0)}';
      }
      return s + '100%{transform:translateX(0)}}';
    }
    css += splitStops('hcSplitL', -1) + splitStops('hcSplitR', 1);

    // ---- prompt box / icon / send ----
    var REST = 'width:110px;height:110px;border-radius:99px;background:rgba(234,234,236,0);box-shadow:0 0 0 0 rgba(28,24,20,0)';
    var OPEN = 'width:var(--pw);height:58px;border-radius:18px;background:rgba(234,234,236,1);box-shadow:0 18px 46px -30px rgba(28,24,20,.5)';
    var TILE = 'width:72px;height:72px;border-radius:99px;background:rgba(234,234,236,0);box-shadow:0 0 0 0 rgba(28,24,20,0)';
    var CEN = 'transform:translate(0px,0px)', LFT = 'transform:translate(calc(55px - var(--pw)/2),0px)';
    var BIG = 'transform:translate(0px,-50%) scale(1)', LEFTP = 'transform:translate(-26px,-50%) scale(.366)', LOADP = 'transform:translate(-19px,-50%) scale(.537)';
    var HUGE = 'clip-path:inset(-600px)';
    var box = '@keyframes hcBox{0%{' + REST + ';' + CEN + '}', lot = '@keyframes hcLotTx{0%{' + BIG + ';' + HUGE + '}', snd = '@keyframes hcSend{0%{opacity:0;transform:scale(.6);background:#1A1A18}';
    for (k = 0; k < 4; k++) {
      var b3 = beats[k];
      var openLead = k === 0 ? b3.typeStart - 0.8 : b3.typeStart - 0.85;
      var CLIP = 'clip-path:inset(calc((207px - var(' + LH[k] + '))/2) calc((82px - var(' + LW[k] + '))/2) round 15px)';
      box += pc(openLead) + '{' + (k === 0 ? REST + ';' + CEN : REST + ';' + LFT) + ';' + T1 + '}'
        + pc(b3.typeStart - 0.05) + ',' + pc(b3.boxClose) + '{' + OPEN + ';' + CEN + ';' + T2 + '}'
        + pc(b3.boxClose + 0.75) + ',' + pc(b3.loadEnd) + '{' + TILE + ';transform:translate(0px,var(' + TY[k] + '));' + T3 + '}'
        + pc(b3.loadEnd + 0.85) + (k === 3 ? ',' + pc(CYC - 0.6) : '') + '{' + REST + ';' + LFT + (k === 3 ? '' : ';' + T1) + '}';
      lot += pc(openLead) + '{' + BIG + ';' + HUGE + ';' + T1 + '}'
        + pc(b3.typeStart - 0.05) + ',' + pc(b3.boxClose) + '{' + LEFTP + ';' + HUGE + ';' + T2 + '}'
        + pc(b3.boxClose + 0.75) + ',' + pc(b3.loadEnd) + '{' + LOADP + ';' + CLIP + ';' + T3 + '}'
        + pc(b3.loadEnd + 0.85) + (k === 3 ? ',' + pc(CYC - 0.6) : '') + '{' + BIG + ';' + HUGE + (k === 3 ? '' : ';' + T1) + '}';
      snd += pc(b3.typeStart - 0.1) + '{opacity:0;transform:scale(.6)}' + pc(b3.typeStart + 0.15) + '{opacity:1;transform:scale(1);background:#1A1A18}'
        + pc(b3.typeEnd) + '{transform:scale(.86);background:#EE7F7B}' + pc(b3.typeEnd + 0.18) + '{transform:scale(1);background:#1A1A18;opacity:1}'
        + pc(b3.boxClose + 0.3) + '{opacity:0;transform:scale(.5)}';
    }
    box += '100%{' + REST + ';' + CEN + '}}'; lot += '100%{' + BIG + ';' + HUGE + '}}'; snd += '100%{opacity:0;transform:scale(.6);background:#1A1A18}}';
    css += box + lot + snd;

    // ---- physics (skew/bob on moves) ----
    var ph = '@keyframes hcPhys{0%{transform:skewX(-1.8deg) translateY(-3.6px)}';
    ph += pc(G.intro) + '{transform:skewX(-1.1deg) translateY(-2.4px)}' + pc(G.intro + 0.5) + '{transform:skewX(1.05deg) translateY(1.4px)}' + pc(G.intro + 0.95) + '{transform:skewX(0deg) translateY(0)}';
    for (k = 0; k < 4; k++) {
      var b4 = beats[k], m0 = b4.travelStart, m1 = b4.travelStart + G.travel;
      ph += pc(m0) + '{transform:skewX(0deg) translateY(0)}' + pc(m0 + G.travel * 0.5) + '{transform:skewX(-2.2deg) translateY(-4.2px)}';
      if (k === 3) { ph += '100%{transform:skewX(-1.8deg) translateY(-3.6px)}'; }
      else ph += pc(m1) + '{transform:skewX(-1.5deg) translateY(-3.2px)}' + pc(m1 + 0.35) + '{transform:skewX(1.15deg) translateY(1.5px)}' + pc(m1 + 0.75) + '{transform:skewX(0deg) translateY(0)}';
    }
    css += ph + '}';

    // durations: one rule overrides every inline 47.85s
    css += '#top [style*="47.85s"]{animation-duration:' + CYC.toFixed(3) + 's!important}';

    return { css: css, CYC: CYC, beats: beats };
  }

  var applied = false;
  function tick() {
    var st = document.getElementById('hc-dyn-style');
    if (!applied || !st) {
      var M = collect();
      if (M) {
        var out = build(M);
        if (!st) { st = document.createElement('style'); st.id = 'hc-dyn-style'; document.head.appendChild(st); }
        st.textContent = out.css;
        window.__hcTL = { cyc: out.CYC, BS: out.beats.map(function (b) { return b.boxClose - 3.2; }), beats: out.beats };
        applied = true;
      }
    }
  }
  setInterval(tick, 500); tick();

  // ---- media seeding: previews restart at rise, replacements at poster drop ----
  var seededB = [0, 0, 0, 0], seededA = [0, 0, 0, 0];
  function seedLoop() {
    try {
      var TL = window.__hcTL;
      var box = document.querySelector('.hc-prompt');
      if (TL && box) {
        var an = box.getAnimations && box.getAnimations()[0];
        if (an && an.currentTime != null) {
          var t = (an.currentTime / 1000) % TL.cyc;
          for (var k = 0; k < 4; k++) {
            var b = TL.beats[k];
            var shells = q('.hc-track > .hc-shell');
            if (shells.length === 24) {
              var bv = shells[SEL[k]].querySelector('video');
              var av = shells[SEL[k]].querySelector('.hc-after');
              if (t >= b.riseStart - 0.05 && t < b.riseStart + 0.5) { if (!seededB[k]) { seededB[k] = 1; try { bv.currentTime = 0; } catch (e) {} } }
              else if (t > b.riseStart + 1 || t < b.riseStart - 1) seededB[k] = 0;
              if (t >= b.posterDrop - 0.08 && t < b.posterDrop + 0.5) { if (!seededA[k]) { seededA[k] = 1; try { av.currentTime = 0; } catch (e) {} } }
              else if (t > b.posterDrop + 1 || t < b.posterDrop - 1) seededA[k] = 0;
            }
          }
        }
      }
    } catch (e) {}
    window.requestAnimationFrame(seedLoop);
  }
  window.requestAnimationFrame(seedLoop);
})();
