/** A small living book, drawn for the first-run story. The teacher mark remains the Fidel logo. */
export function NoelGuide({ step }: { step: number }) {
  const mouth = [
    "M126 151c7 8 21 8 28 0",
    "M130 153c6 3 15 3 21 0",
    "M126 146c5 17 24 17 29 0",
    "M125 148c7 11 23 11 30 0",
    "M128 151c9 5 17 5 26 0",
    "M125 146c6 17 24 17 31 0",
  ][step] ?? "M126 151c7 8 21 8 28 0";
  const gaze = step === 1 ? -4 : step === 4 ? 3 : 0;
  return <svg className={`noel-guide noel-guide--${step}`} viewBox="0 0 280 278" role="img" aria-label="Noel, your friendly book guide" fill="none">
    <ellipse className="guide-shadow" cx="140" cy="253" rx="69" ry="9" fill="currentColor" opacity=".13" />
    <g className="guide-figure">
      <path className="guide-leg guide-leg--left" d="M111 219v20m-15 0h21" stroke="#163a30" strokeWidth="10" strokeLinecap="round" />
      <path className="guide-leg guide-leg--right" d="M169 219v20m-6 0h22" stroke="#163a30" strokeWidth="10" strokeLinecap="round" />
      <path className="guide-arm guide-arm--left" d="M70 157c-18 5-26 0-33-12" stroke="#163a30" strokeWidth="11" strokeLinecap="round" />
      <circle className="guide-hand guide-hand--left" cx="36" cy="143" r="9" fill="#e9a332" />
      <path className="guide-arm guide-arm--right" d="M208 157c18-3 27-14 30-26" stroke="#163a30" strokeWidth="11" strokeLinecap="round" />
      <circle className="guide-hand guide-hand--right" cx="239" cy="128" r="9" fill="#e9a332" />
      <rect x="63" y="51" width="154" height="168" rx="56" fill="#163a30" />
      <path d="M87 65c17-10 34-12 51-12h21c23 0 38 8 50 21-33-12-88-12-122-9Z" fill="#2c6048" />
      <path d="M75 183c20 11 43 15 65 15 33 0 58-8 71-18v17c-12 16-37 25-70 25-31 0-55-10-66-25Z" fill="#235744" />
      <g className="guide-face">
        <rect className="guide-eye" x="91" y="88" width="39" height="48" rx="18" fill="#fff9e8" />
        <rect className="guide-eye" x="150" y="88" width="39" height="48" rx="18" fill="#fff9e8" />
        <circle className="guide-pupil" cx={114 + gaze} cy="113" r="8" fill="#173b30" />
        <circle className="guide-pupil" cx={172 + gaze} cy="113" r="8" fill="#173b30" />
        <circle cx={116 + gaze} cy="110" r="2.5" fill="white" />
        <circle cx={174 + gaze} cy="110" r="2.5" fill="white" />
        <path className="guide-mouth" d={mouth} stroke="#f5bd68" strokeWidth="4" strokeLinecap="round" />
        <circle cx="91" cy="143" r="5" fill="#c9804c" opacity=".8" />
        <circle cx="188" cy="143" r="5" fill="#c9804c" opacity=".8" />
      </g>
      <g className="guide-book">
        <path d="M82 171c23-7 42-6 58 6v43c-18-11-37-13-58-7Z" fill="#edaa3d" />
        <path d="M140 177c17-12 36-13 58-6v42c-21-6-40-4-58 7Z" fill="#f4bd61" />
        <path d="M140 177v43" stroke="#9b6029" strokeWidth="3" strokeLinecap="round" />
        <path className="guide-page" d="M148 181c13-7 27-9 42-6" stroke="#b57734" strokeWidth="2" strokeLinecap="round" />
        <path d="M89 179c12-3 23-1 34 3" stroke="#c47c2d" strokeWidth="2" strokeLinecap="round" />
      </g>
      <path className="guide-bookmark" d="M196 171v23l-6-5-6 5v-19" fill="#d3653f" />
    </g>
  </svg>;
}
