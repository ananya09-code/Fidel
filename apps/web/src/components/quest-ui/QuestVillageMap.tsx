import { Check, LockKeyhole } from "lucide-react";
import type { QuestItem } from "@/lib/api/quests";

const trees = [
  [290, 110],
  [322, 97],
  [355, 116],
  [385, 128],
  [415, 147],
  [446, 160],
  [258, 125],
  [290, 143],
  [328, 139],
  [365, 158],
  [400, 177],
  [437, 193],
  [205, 152],
  [235, 169],
  [275, 179],
  [316, 179],
  [351, 198],
  [480, 185],
  [512, 201],
  [545, 222],
  [575, 242],
  [588, 273],
  [92, 256],
  [118, 240],
  [142, 224],
  [76, 287],
  [104, 306],
  [83, 375],
  [110, 397],
  [141, 414],
  [177, 431],
  [206, 453],
  [148, 491],
  [183, 511],
  [218, 530],
  [251, 546],
  [312, 478],
  [344, 498],
  [478, 458],
  [509, 440],
  [548, 422],
  [580, 401],
  [605, 374],
];

function Tree({ x, y, index }: { x: number; y: number; index: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${0.8 + (index % 3) * 0.1})`}>
      <ellipse cy="2" rx="17" ry="7" fill="var(--quest-map-shadow)" />
      <path
        d="M0 1v-35"
        stroke="var(--quest-trunk)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {index % 3 === 0 ? (
        <>
          <path
            d="m0-65-21 33h10l-17 23h56L11-32h10Z"
            fill="var(--quest-pine)"
          />
          <path d="M0-65v56h28L11-32h10Z" fill="var(--quest-pine-dark)" />
        </>
      ) : (
        <>
          <path
            d="M-18-19c-19-11-13-32 2-34 0-22 29-26 35-7 23-1 32 28 13 39-3 19-38 23-50 2Z"
            fill="var(--quest-leaf)"
          />
          <path
            d="M3-63c24-10 39 22 25 33 7 16-12 24-25 22 13-15 16-38 0-55Z"
            fill="var(--quest-leaf-dark)"
          />
          <path
            d="M-18-36c-4-9 3-16 9-15m1-7c3-6 10-7 14-3"
            stroke="var(--quest-leaf-light)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
    </g>
  );
}

function House({ cafe = false }: { cafe?: boolean }) {
  return (
    <svg
      className="quest-house-art"
      viewBox="0 0 180 165"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="91"
        cy="145"
        rx="77"
        ry="16"
        fill="var(--quest-map-shadow)"
      />
      <path d="m34 91 67 20v42l-67-22Z" fill="var(--quest-house)" />
      <path d="m101 111 49-29v43l-49 28Z" fill="var(--quest-wall-side)" />
      <path d="m24 91 62-68 73 59-57 34Z" fill="var(--quest-roof)" />
      <path d="m86 23 73 59-57 34Z" fill="var(--quest-roof-side)" />
      <path
        d="m24 91 78 25 57-34M86 23l16 93m-16-86-46 61m47-52L59 96m32-49L78 103m15-51 34 46m-31-61 47 51"
        stroke="var(--quest-roof-line)"
        strokeWidth="1.5"
      />
      <path d="m64 140 .5-24c0-14 18-7 18 6v24Z" fill="var(--ui-ink)" />
      <path
        d="m43 105 12 4v15l-12-4Zm75 9 17-10v14l-17 10Z"
        fill="var(--quest-window)"
        stroke="var(--quest-trunk)"
        strokeWidth="1.5"
      />
      <path
        d="m49 107v15m-6-10 12 4m71-7v14m-8-2 17-10"
        stroke="var(--quest-trunk)"
      />
      <circle cx="78" cy="131" r="1.7" fill="var(--ui-gold)" />
      {cafe && (
        <g
          transform="translate(111 64) rotate(15)"
          stroke="var(--quest-roof-line)"
          strokeWidth="1.6"
        >
          <path
            d="M0 0h19v10c0 10-19 10-19 0ZM19 2h7v8h-7"
            fill="var(--quest-house)"
          />
          <path
            d="M5-5c-5-6 4-7 0-12m8 12c-5-6 4-7 0-12"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}

type Props = {
  quests: QuestItem[];
  onEnter: (quest: QuestItem) => void;
  disabled: boolean;
};
export function QuestVillageMap({ quests, onEnter, disabled }: Props) {
  const trail =
    "M124 473C200 426 115 363 185 310S274 269 330 304 381 407 450 402 506 347 494 332";
  return (
    <div className="quest-map quest-map-static">
      <div className="quest-map-frame">
        <svg
          className="quest-map-landscape"
          viewBox="0 0 680 620"
          preserveAspectRatio="xMidYMid meet"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M28 282 343 113 653 264 668 350 653 435 341 603 28 446 12 363Z"
            fill="var(--quest-map-edge)"
          />
          <path
            d="M28 267 343 98 653 249 668 335 653 420 341 588 28 431 12 348Z"
            fill="var(--quest-meadow)"
          />
          <path
            d="M343 98 653 249 668 335 653 420 341 588 340 414 167 338Z"
            fill="var(--quest-meadow-light)"
          />
          <path
            d="M12 348 28 431 341 588 653 420 668 335"
            stroke="var(--quest-house)"
            strokeWidth="4"
          />
          <path
            d="M530 210c-22 39 26 64 17 94s-42 40-36 75-87 56-91 81-68 43-70 108"
            stroke="var(--quest-river-bank)"
            strokeWidth="25"
          />
          <path
            d="M530 210c-22 39 26 64 17 94s-42 40-36 75-87 56-91 81-68 43-70 108"
            stroke="var(--quest-water)"
            strokeWidth="17"
          />
          <g transform="translate(190 70) scale(.65)">
            <path
              d="M106 253c-15-27 29-63 75-66s105 36 101 72-60 51-107 42-60-23-69-48Z"
              fill="var(--quest-river-bank)"
            />
            <path
              d="M113 251c-11-23 29-54 69-57s96 33 93 62-55 46-98 38-57-19-64-43Z"
              fill="var(--quest-water)"
            />
            <path
              d="m143 239 35-7m35 32 29-8m-87 18 18-4"
              stroke="var(--quest-water-light)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
          {trees.slice(0, 27).map(([x, y], i) => (
            <Tree key={i} x={x} y={y} index={i} />
          ))}
          <path
            d={trail}
            stroke="var(--quest-path)"
            strokeWidth="26"
            strokeLinecap="round"
          />
          <path
            d={trail}
            stroke="var(--quest-trail-mark)"
            strokeWidth="3.5"
            strokeDasharray="7 8"
          />
          <path
            d="M185 310Q170 180 310 170T505 300M185 310Q110 410 255 455T480 480"
            stroke="var(--quest-path)"
            strokeWidth="20"
          />
          <path
            d="M185 310Q170 180 310 170T505 300M185 310Q110 410 255 455T480 480"
            stroke="var(--quest-trail-mark)"
            strokeWidth="3"
            strokeDasharray="6 9"
          />
          <g transform="translate(409 449) rotate(-27)">
            <path d="M-28-13h56v27h-56Z" fill="var(--quest-trunk)" />
            {[-22, -14, -6, 2, 10, 18, 26].map((x) => (
              <path
                key={x}
                d={`M${x}-13v27`}
                stroke="var(--quest-roof)"
                strokeWidth="5"
              />
            ))}
            <path
              d="M-30-17h60m-60 35h60"
              stroke="var(--quest-trunk)"
              strokeWidth="4"
            />
          </g>
          <g transform="translate(112 445)">
            <path
              d="M0 27v-49m48 65V-3"
              stroke="var(--quest-trunk)"
              strokeWidth="5"
            />
            <path d="m-3-22 55 20v24L-3 2Z" fill="var(--ui-ink)" />
            <path
              d="m8-8 29 11m-7-8 9 9-10 2"
              stroke="var(--ui-gold)"
              strokeWidth="3"
            />
          </g>
          {trees.slice(27).map(([x, y], i) => (
            <Tree key={i} x={x} y={y} index={i + 1} />
          ))}
        </svg>
        <p className="quest-map-ribbon">The village trail</p>
        {quests.map((quest, index) => {
          const positions = [
            [2, 27],
            [62, 35],
            [34, 12],
            [18, 59],
            [57, 65],
          ];
          const [left, top] = positions[index] ?? [34, 40];
          const completed = Boolean(quest.state?.completed);
          return (
            <button
              type="button"
              key={quest.id}
              className={`quest-house-stop quest-house-${quest.id} quest-dynamic-house${completed ? " is-done" : quest.locked ? " is-locked" : " is-ready"}`}
              style={{ left: `${left}%`, top: `${top}%`, right: "auto" }}
              onClick={() => onEnter(quest)}
              disabled={disabled || (quest.locked && !completed)}
              aria-label={`Enter ${quest.title}`}
              aria-describedby={`quest-lock-${quest.id}`}
            >
              <House cafe={quest.character === "host"} />
              <span className="quest-house-state">
                {completed ? (
                  <Check size={15} />
                ) : quest.locked ? (
                  <LockKeyhole size={14} />
                ) : (
                  index + 1
                )}
              </span>
              <strong>{quest.title}</strong>
              <span id={`quest-lock-${quest.id}`} className="sr-only">
                {quest.reasons.join(" ")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
