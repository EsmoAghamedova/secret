const $ = (s) => document.querySelector(s);
const sections = [...document.querySelectorAll("main > section")];

/* ================= EDIT YOUR CONTENT HERE ================= */
// [image, title, short text (optional), LONG TEXT shown on the side when you hover]
const why = [
  ["static/image/Screenshot 2026-09-29 224912.png", "My favorite smile", "It makes every day brighter", "Your smile has a special way of making ordinary moments feel warm and unforgettable."],
  ["static/image/Screenshot 2026-10-08 220933.png", "Your kindness", "You care in the little things", "You notice the little details and always know how to make someone feel supported."],
  ["static/image/Screenshot 2026-11-10 215459.png", "Our laughter", "The best kind of memories", "Even simple conversations become fun and meaningful when we share them together."],
  ["static/image/Screenshot 2026-11-10 225534.png", "You understand me", "We can talk about anything", "I can be myself around you, and that is something I truly value."],
  ["static/image/screen248.jpg", "You make me happy", "Just by being you", "You bring comfort, joy and a calm kind of happiness wherever you go."],
  ["static/image/main-bg.jpg", "My safe place", "Friend. brother. everything", "Thank you for being part of my life and making every moment feel more special."],
];
// [image, title, short text, LONG TEXT shown on the side when you hover]
const memories = [
  ["static/image/Screenshot 2026-09-29 224912.png", "Our first memory", "A moment to remember", "This moment is special because it reminds me how beautiful our friendship is."],
  ["static/image/Screenshot 2026-10-08 220933.png", "One of our laughs", "No one makes me laugh like you", "Every silly moment with you turns into a memory I never want to forget."],
  ["static/image/Screenshot 2026-11-10 215459.png", "A good conversation", "Hours felt like minutes", "Talking with you always feels easy, comfortable and meaningful."],
  ["static/image/Screenshot 2026-11-10 225534.png", "Together in memory", "A favorite moment", "No matter where life takes us, I hope we keep making memories like this."],
];
const PUZZLE_SIZE = 3; // 3 = 3x3, 4 = 4x4 ...
/* ========================================================== */

/* ---------- navigation + locks ---------- */
history.scrollRestoration = "manual"; // a refresh always starts at the top
window.scrollTo(0, 0);

let current = 0;
const goTo = (i) => gooTo(i);
// if the window/phone bars resize, snap back to the current section
window.addEventListener("resize", () => sections[current].scrollIntoView());

const downArrow = {};
sections.forEach((sec, i) => {
  const make = (dir, target) => {
    const b = document.createElement("button");
    b.className = `arrow arrow-${dir}`;
    b.textContent = dir === "down" ? "↓" : "↑";
    b.setAttribute("aria-label", dir === "down" ? "Next section" : "Previous section");
    b.onclick = () => goTo(target);
    sec.append(b);
    return b;
  };
  if (i > 0) make("up", i - 1);
  if (i < sections.length - 1) downArrow[sec.id] = make("down", i + 1);
});

// sections after a lock are "inert": no clicking, no Tab key, so nobody can skip a step
const reach = (n) => sections.forEach((s, i) => (s.inert = i > n));
reach(0);
const reachAfter = { hero: 1, cake: 4, puzzle: 5 }; // unlocking X opens up to this section
Object.keys(reachAfter).forEach((id) => {
  downArrow[id].classList.add("locked");
  downArrow[id].disabled = true;
});
const unlock = (id) => {
  downArrow[id].disabled = false;
  downArrow[id].classList.remove("locked");
  reach(reachAfter[id]);
};

/* ---------- 1. gate + typing intro ---------- */
function typeLine(el, speed = 80) {
  return new Promise((resolve) => {
    const chars = Array.from(el.dataset.text);
    let i = 0;
    el.classList.add("is-typing");
    const timer = setInterval(() => {
      el.textContent += chars[i++];
      if (i >= chars.length) {
        clearInterval(timer);
        el.classList.remove("is-typing");
        resolve();
      }
    }, speed);
  });
}
const gateBtn = $("#gateBtn");
gateBtn.onclick = async () => {
  gateBtn.disabled = true; // so the text can't be typed twice
  $("#gate").classList.add("hide");
  document.body.classList.add("go"); // starts the image fade + blur
  await new Promise((r) => setTimeout(r, 3800));
  for (const line of document.querySelectorAll(".typing")) {
    await typeLine(line);
    await new Promise((r) => setTimeout(r, 300));
  }
  unlock("hero");
};

/* ---------- 2. cake ---------- */
function confetti(box) {
  for (let i = 0; i < 50; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.cssText = `--x:${Math.random() * 600 - 300}px;--y:${Math.random() * 500 - 200}px;background:hsl(${200 + Math.random() * 30} 90% ${50 + Math.random() * 35}%)`;
    box.append(c);
    setTimeout(() => c.remove(), 1800);
  }
}
$("#blow").onclick = function () {
  this.disabled = true;
  document.querySelectorAll(".flame").forEach((f) => {
    f.classList.add("out");
    const s = document.createElement("span");
    s.className = "smoke";
    s.style.setProperty("--x", Math.random() * 40 - 20 + "px");
    f.parentElement.append(s);
  });
  confetti($("#cake"));
  $("#dua").textContent = "May Allah accept your dua 🤲✨";
  setTimeout(() => unlock("cake"), 1500);
};

/* ---------- 3 + 4. polaroid cards ---------- */
const polaroid = ([img, title, text, story], i) => `
  <div class="cell"><figure class="polaroid" style="--r:${i % 2 ? 3 : -3}deg">
    <img src="${img}" alt="${title}" onerror="this.onerror=null;this.src='static/image/main-bg.jpg'">
    <figcaption>${title}${text ? `<small>${text}</small>` : ""}</figcaption>
  </figure>${story ? `<aside class="side">${story}</aside>` : ""}</div>`;
$("#whyGrid").innerHTML = why.map(polaroid).join("");
$("#memGrid").innerHTML = memories.map(polaroid).join("");

/* ---------- 5. puzzle (drag & drop + tap to swap) ---------- */
const N = PUZZLE_SIZE;
const board = $("#board");
board.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
let order = [...Array(N * N).keys()];
let selected = null;
do { order.sort(() => Math.random() - 0.5); } while (order.every((v, i) => v === i));

function render() {
  board.innerHTML = "";
  order.forEach((piece, pos) => {
    const t = document.createElement("div");
    t.className = "tile" + (selected === pos ? " sel" : "");
    t.draggable = true;
    t.style.backgroundSize = `${N * 100}% ${N * 100}%`;
    t.style.backgroundPosition = `${(piece % N) * (100 / (N - 1))}% ${Math.floor(piece / N) * (100 / (N - 1))}%`;
    t.ondragstart = (e) => e.dataTransfer.setData("text", pos);
    t.ondragover = (e) => e.preventDefault();
    t.ondrop = (e) => { e.preventDefault(); swap(+e.dataTransfer.getData("text"), pos); };
    t.onclick = () => {
      if (selected === null) selected = pos;
      else if (selected === pos) selected = null;
      else return swap(selected, pos);
      render();
    };
    board.append(t);
  });
}
function swap(a, b) {
  if (a !== b) [order[a], order[b]] = [order[b], order[a]];
  selected = null;
  render();
  if (order.every((v, i) => v === i)) {
    board.classList.add("done");
    $("#puzzle .title").textContent = "Letter unlocked 🔓";
    $("#hint").textContent = "Go to the letter 💌";
    unlock("puzzle");
  }
}
render();

/* ---------- 6. letter ---------- */
$("#env").onclick = () => {
  $("#env").style.display = "none";
  $("#paper").classList.add("open");
};

/* ---------- goo transition between sections ---------- */
const GOO = 9;                 // blobs per layer
const GOO_TIME = 550;          // ms for each phase (cover / reveal)
const GOO_LAYERS = [           // [color, lag in ms]: light blue leads, navy follows
  ["#8ab4f8", 0],
  ["#2b4c9b", 120],
];
document.body.insertAdjacentHTML("beforeend", `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <filter id="goo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="b"/>
      <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -12"/>
    </filter>
  </defs></svg>
  <div class="goo" id="gooLayer"></div>`);
const gooEl = $("#gooLayer");
const blobs = GOO_LAYERS.flatMap(([color, lag]) =>
  Array.from({ length: GOO }, (_, i) => {
    const el = document.createElement("i");
    el.style.left = (i * 100) / (GOO - 1) + "%";
    el.style.background = color;
    gooEl.append(el);
    return { el, lag, y: Math.random() * 20 - 10 };
  })
);

let busy = false;
async function gooTo(i) {
  if (busy || i === current) return;
  busy = true;
  document.activeElement.blur();
  const dir = i > current ? 1 : -1; // down = blobs rise from the bottom, up = fall from the top
  const T = (y, s) => `translate(-50%, calc(-50% + ${y}vh)) scale(${s})`;
  const play = (frames, lagOf) =>
    Promise.all(
      blobs.map((b) =>
        b.el.animate(frames(b), {
          duration: GOO_TIME,
          delay: lagOf(b) + Math.random() * 200,
          easing: "cubic-bezier(.7,0,.3,1)",
          fill: "both",
        }).finished
      )
    );

  gooEl.classList.add("on");
  await play((b) => [{ transform: T(dir * 70, 0) }, { transform: T(b.y, 2.6) }], (b) => b.lag);
  current = i;
  sections[i].scrollIntoView();          // jump while the screen is fully covered
  await play((b) => [{ transform: T(b.y, 2.6) }, { transform: T(-dir * 70, 0) }], (b) => 120 - b.lag);
  blobs.forEach((b) => b.el.getAnimations().forEach((a) => a.cancel()));
  gooEl.classList.remove("on");
  busy = false;
}

/* ---------- hover: card grows, the others fade out ---------- */
const ZOOM_MAX = 1.7; // how big a centered card gets (why section)
function setupZoom(grid, side) {
  const section = grid.closest("section");
  grid.querySelectorAll(".cell").forEach((cell) => {
    const panel = cell.querySelector(".side");
    cell.onmouseenter = () => {
      const g = grid.getBoundingClientRect();
      const S = section.getBoundingClientRect();
      const c = cell.getBoundingClientRect();
      let s, cx, cy, px = 0, py = 0, pw = 0;
      if (!side || !panel) {                 // centered in the grid
        s = Math.min(ZOOM_MAX, (g.width * 0.6) / c.width, (g.height * 0.95) / c.height);
        cx = g.left + g.width / 2; cy = g.top + g.height / 2;
      } else {
        // free space = under the title, above the bottom arrow
        const title = section.querySelector(".title").getBoundingClientRect();
        const top = Math.max(title.bottom, S.top + 70) + 16;
        const bottom = S.bottom - 90;
        const H = bottom - top;
        if (S.width >= 700) {                // card on the left, text on the right
          s = Math.min(2.2, (S.width * 0.34) / c.width, H / c.height);
          cx = S.left + S.width * 0.3; cy = top + H / 2;
          pw = Math.min(S.width * 0.34, 380); px = S.left + S.width * 0.72; py = cy;
        } else {                             // phone: card on top, text under it
          s = Math.min(2.2, (S.width * 0.6) / c.width, (H * 0.56) / c.height);
          cx = S.left + S.width / 2; cy = top + H * 0.29;
          pw = Math.min(S.width * 0.86, 380); px = cx; py = top + H * 0.8;
        }
      }
      const set = (k, v) => cell.style.setProperty(k, v);
      set("--s", s);
      set("--tx", cx - (c.left + c.width / 2) + "px");
      set("--ty", cy - (c.top + c.height / 2) + "px");
      if (side && panel) {
        panel.style.width = pw + "px";
        set("--px", px - c.left + "px");
        set("--py", py - c.top + "px");
        const ph = panel.offsetHeight;
        // invisible bridge so the hover doesn't break between the card and the text
        const L = Math.min(cx - (c.width * s) / 2, px - pw / 2) - 12;
        const R = Math.max(cx + (c.width * s) / 2, px + pw / 2) + 12;
        const T = Math.min(cy - (c.height * s) / 2, py - ph / 2) - 12;
        const B = Math.max(cy + (c.height * s) / 2, py + ph / 2) + 12;
        set("--bx", L - c.left + "px"); set("--by", T - c.top + "px");
        set("--bw", R - L + "px");      set("--bh", B - T + "px");
      }
      cell.classList.add("on");
      grid.classList.add("zooming");
    };
    cell.onmouseleave = () => {
      cell.classList.remove("on");
      grid.classList.remove("zooming");
    };
  });
}
setupZoom($("#whyGrid"), true);  // card on one side + text on the other
setupZoom($("#memGrid"), true);  // card on one side + text on the other
