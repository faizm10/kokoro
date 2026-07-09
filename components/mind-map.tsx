export function MindMap() {
  return (
    <div className="relative mt-5 h-[240px] overflow-hidden rounded-[10px] border border-[#e4e1d7] bg-[#f2f0e7] sm:h-[270px]">
      <svg
        viewBox="0 0 620 280"
        role="img"
        aria-label="A preview of connected thoughts about making, momentum, and late nights"
        className="h-full w-full"
      >
        <g fill="none" stroke="#b7b3a7" strokeWidth="1">
          <path d="M312 140 C245 123 204 91 151 66" />
          <path d="M312 140 C386 116 421 76 485 61" />
          <path d="M312 140 C380 166 420 205 490 217" />
          <path d="M312 140 C245 167 211 207 151 219" />
          <path d="M151 66 C118 92 103 111 82 134" />
          <path d="M485 61 C529 90 542 111 551 140" />
        </g>
        <g fill="#817e74">
          <circle cx="312" cy="140" r="4" fill="#1b365d" />
          <circle cx="151" cy="66" r="3" />
          <circle cx="485" cy="61" r="3" />
          <circle cx="490" cy="217" r="3" />
          <circle cx="151" cy="219" r="3" />
          <circle cx="82" cy="134" r="2.5" />
          <circle cx="551" cy="140" r="2.5" />
          <circle cx="258" cy="115" r="1.5" opacity=".5" />
          <circle cx="405" cy="127" r="1.5" opacity=".5" />
        </g>
        <g fill="#504e49" fontFamily="var(--font-hand)" fontSize="17">
          <text x="326" y="136">momentum</text>
          <text x="102" y="53">late nights</text>
          <text x="462" y="48">making</text>
          <text x="500" y="225">ideas</text>
          <text x="96" y="240">attention</text>
          <text x="36" y="155">quiet</text>
          <text x="557" y="145">work</text>
        </g>
      </svg>
    </div>
  );
}
