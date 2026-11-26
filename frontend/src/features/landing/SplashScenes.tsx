import type { ReactNode } from "react";
import { Icon } from "../../components/ui";
import { SPLASH_SHOTS, type SplashShot } from "./content";

function ProductWindow({ kind, children }: { kind: string; children: ReactNode }) {
  return (
    <div className={`splash-window splash-window-${kind}`}>
      <div className="splash-window-chrome">
        <span>t.</span><span>TUNIT / {kind.toUpperCase()}</span><i>↗</i>
      </div>
      {children}
    </div>
  );
}

function TasteWindow() {
  return (
    <ProductWindow kind="taste">
      <div className="splash-taste-id">
        <span className="splash-mock-label">MY TASTE PROFILE</span>
        <i className="splash-taste-flower">✳</i>
        <strong>나만의<br /><em>주파수.</em></strong>
        <div className="splash-mock-tags"><span>INDIE</span><span>JAZZ</span><span>몽환적인</span></div>
        <div className="splash-mock-wave"><i /><i /><i /><i /><i /><i /><i /></div>
      </div>
    </ProductWindow>
  );
}

function MusicWindow() {
  return (
    <ProductWindow kind="music">
      <div className="splash-music-library">
        <span className="splash-mock-label">MUSIC DISCOVERY</span>
        <strong>On repeat.</strong>
        <div className="splash-album-grid">
          {["SIDE A", "SIDE B", "SIDE C"].map((side) => (
            <div className="splash-album" key={side}><div><i /><span>↗</span></div><small>{side}</small></div>
          ))}
        </div>
        <div className="splash-mini-player"><Icon name="music" size={18} /><span>YOUR NEXT FAVORITE</span><b>▶</b></div>
        <div className="splash-mock-song"><i /><span>새로운 음악, 새로운 취향.</span><span>＋</span></div>
      </div>
    </ProductWindow>
  );
}

function PeopleWindow() {
  return (
    <ProductWindow kind="people">
      <div className="splash-people-preview">
        <span className="splash-mock-label">MUSIC TWIN</span>
        <strong>같은 음악 속의<br /><em>새로운 우리.</em></strong>
        <div className="splash-profile-pair">
          <div><span><Icon name="headphones" size={32} /></span><b>MY TASTE</b><small>INDIE / JAZZ</small></div>
          <i>✳</i>
          <div><span><Icon name="music" size={32} /></span><b>YOUR TASTE</b><small>JAZZ / SOUL</small></div>
        </div>
        <div className="splash-common-track"><Icon name="music" size={18} /><span>SAME SOUND. NEW CONNECTION.</span></div>
      </div>
    </ProductWindow>
  );
}

function TasteShot() {
  return (
    <>
      <div className="splash-cut-copy"><span>01 / TASTE PROFILE</span><p>Taste<br /><em>yourself.</em></p><small>좋아하는 음악으로, 나를 발견하다.</small></div>
      <div className="splash-cut-art splash-art-taste"><div className="splash-window-back"><MusicWindow /></div><div className="splash-window-front"><TasteWindow /></div><span className="splash-sticker">THE<br />SOUND<br />OF YOU ↗</span></div>
    </>
  );
}

function MusicShot() {
  return (
    <>
      <div className="splash-cut-copy"><span>02 / MUSIC DISCOVERY</span><p>Find<br /><em>your next.</em></p><small>익숙한 재생 목록 밖으로.</small></div>
      <div className="splash-cut-art splash-art-music"><div className="splash-window-back"><TasteWindow /></div><div className="splash-window-front"><MusicWindow /></div><span className="splash-cut-spark">✳</span></div>
    </>
  );
}

function PeopleShot() {
  return (
    <>
      <div className="splash-cut-copy"><span>03 / SAME FREQUENCY</span><p>New<br /><em>people.</em></p><small>같은 음악이, 새로운 연결이 되다.</small></div>
      <div className="splash-cut-art splash-art-people"><div className="splash-window-back"><MusicWindow /></div><div className="splash-window-front"><PeopleWindow /></div><span className="splash-sticker">ME<br />＋<br />YOU</span></div>
    </>
  );
}

function BrandShot() {
  return (
    <div className="splash-brand-finale">
      <div className="splash-brand-echoes"><TasteWindow /><MusicWindow /><PeopleWindow /></div>
      <span className="splash-brand-line">YOUR TASTE. YOUR MUSIC. YOUR PEOPLE.</span>
      <p className="splash-wordmark">{"Tunit.".split("").map((letter, index) => <span key={letter} style={{ animationDelay: `${index * 40}ms` }}>{letter}</span>)}</p>
      <span className="splash-brand-caption">취향이 닿는 순간, 튠잇.</span>
    </div>
  );
}

const visuals: Record<SplashShot, ReactNode> = {
  taste: <TasteShot />,
  music: <MusicShot />,
  people: <PeopleShot />,
  brand: <BrandShot />,
};

export default function SplashScenes({ active }: { active: SplashShot }) {
  return (
    <div className="splash-stage" aria-hidden="true">
      {SPLASH_SHOTS.map(({ id }) => (
        <div className={`splash-cut splash-cut-${id}`} data-splash-scene={id} hidden={active !== id} key={id}>
          {visuals[id]}
        </div>
      ))}
      <span className="splash-preview-label">INTERFACE PREVIEW / 화면 미리보기</span>
    </div>
  );
}
