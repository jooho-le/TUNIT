/** Independent vector layer so paint and headphones can move at different depths. */
export default function PaintSplash() {
  return (
    <svg
      className="paint-splash"
      viewBox="0 0 1000 800"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="paint-edge" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.028"
            numOctaves="2"
            seed="12"
            result="grain"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale="11"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <g className="paint-body" filter="url(#paint-edge)">
        <path d="M220 390C171 351 200 308 250 297C282 287 259 253 213 222C153 181 168 160 220 180L333 229C368 242 371 206 360 168L345 105C337 66 359 64 377 104L422 201C442 246 475 222 486 184L516 86C530 39 553 50 548 93L539 212C535 253 574 244 604 209L682 118C712 84 731 100 707 140L650 244C628 285 665 286 702 265L794 206C839 178 852 198 810 233L739 295C702 329 715 350 765 343L897 325C954 317 950 344 901 355L779 389C737 401 742 431 786 447L872 480C921 499 909 523 865 511L751 486C704 475 699 505 728 542L805 644C837 685 817 701 786 667L687 567C655 535 628 562 640 603L660 684C673 736 646 739 630 694L589 590C572 546 539 563 529 608L507 716C496 767 471 765 474 710L480 603C482 561 446 556 424 590L361 693C335 738 313 722 337 673L377 582C394 544 364 526 332 548L228 619C183 650 165 629 207 592L291 518C323 489 303 466 263 473L123 498C67 508 65 483 118 465L249 422C275 413 261 413 220 390Z" />
        <path d="M252 300C211 265 165 258 129 232C110 218 93 226 118 245L220 328Z" />
        <path d="M706 521C756 544 804 548 851 578C883 598 889 581 860 561L735 486Z" />
        <path d="M379 225C350 170 315 135 298 90C288 63 271 69 283 103L335 246Z" />
      </g>
      <g className="paint-droplets">
        <ellipse
          cx="123"
          cy="177"
          rx="11"
          ry="22"
          transform="rotate(-44 123 177)"
        />
        <ellipse
          cx="178"
          cy="269"
          rx="8"
          ry="13"
          transform="rotate(-61 178 269)"
        />
        <circle cx="80" cy="393" r="9" />
        <circle cx="146" cy="359" r="6" />
        <ellipse
          cx="94"
          cy="535"
          rx="20"
          ry="8"
          transform="rotate(-19 94 535)"
        />
        <circle cx="171" cy="635" r="10" />
        <circle cx="263" cy="701" r="5" />
        <ellipse
          cx="300"
          cy="56"
          rx="7"
          ry="12"
          transform="rotate(-27 300 56)"
        />
        <circle cx="442" cy="106" r="7" />
        <circle cx="594" cy="61" r="6" />
        <ellipse
          cx="759"
          cy="98"
          rx="8"
          ry="18"
          transform="rotate(42 759 98)"
        />
        <circle cx="817" cy="147" r="6" />
        <circle cx="863" cy="257" r="13" />
        <ellipse
          cx="948"
          cy="392"
          rx="17"
          ry="7"
          transform="rotate(12 948 392)"
        />
        <circle cx="891" cy="551" r="8" />
        <circle cx="911" cy="616" r="5" />
        <ellipse
          cx="754"
          cy="718"
          rx="8"
          ry="17"
          transform="rotate(-38 754 718)"
        />
        <circle cx="590" cy="751" r="8" />
        <circle cx="402" cy="741" r="5" />
      </g>
    </svg>
  );
}
