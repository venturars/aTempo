import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Ilustración/Tempito'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

// Cada ánimo en su primer fotograma. En la web se mueven: el movimiento está en web/src/student/mascot/Tempito.tsx.
export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Tranquila">
        <svg className="mascot mascot-chill w-40" viewBox="8 0 160 150" fill="none" aria-hidden="true">
          <ellipse className="mascot-shadow" cx="88" cy="138" rx="32" ry="4" opacity="0.2" />
          <g transform="rotate(0 88 130) translate(0 0)">
            <ellipse className="mascot-body" cx="76" cy="124" rx="11" ry="7" />
            <ellipse className="mascot-body" cx="100" cy="124" rx="11" ry="7" />
            <ellipse className="mascot-shade" cx="50" cy="100" rx="7" ry="10" transform="rotate(20 50 100)" />
            <ellipse className="mascot-shade" cx="126" cy="100" rx="7" ry="10" transform="rotate(-20 126 100)" />
            <g transform="rotate(-8 88 42)">
              <path className="mascot-stem" d="M88 42c0-6-1-10-3-14" strokeWidth="4" strokeLinecap="round" />
              <ellipse className="mascot-leaf" cx="74" cy="24" rx="13" ry="8" transform="rotate(-25 74 24)" />
              <ellipse className="mascot-leaf" cx="97" cy="20" rx="13" ry="8" transform="rotate(25 97 20)" />
            </g>
            <path className="mascot-body" d="M88 38c24 0 40 28 40 50 0 20-18 32-40 32s-40-12-40-32c0-22 16-50 40-50z" />
            <ellipse className="mascot-eye" cx="66" cy="54" rx="7" ry="4" opacity="0.22" transform="rotate(-35 66 54)" />
            <path className="mascot-ink-line" d="M84 74h10" strokeWidth="3" strokeLinecap="round" />
            <rect className="mascot-ink" x="63" y="67" width="22" height="14" rx="6" />
            <rect className="mascot-ink" x="93" y="67" width="22" height="14" rx="6" />
            <clipPath id="tempito-lenses">
              <rect x="63" y="67" width="22" height="14" rx="6" />
              <rect x="93" y="67" width="22" height="14" rx="6" />
            </clipPath>
            <g clipPath="url(#tempito-lenses)">
              <path className="mascot-glare" d="M58 60l-10 30" strokeWidth="5" opacity="0.55" />
            </g>
            <ellipse className="mascot-cheek" cx="65" cy="90" rx="6.5" ry="4.5" />
            <ellipse className="mascot-cheek" cx="114" cy="90" rx="6.5" ry="4.5" />
            <path className="mascot-ink-line" d="M81 94q9 7 18 0" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g className="mascot-note" opacity="0" transform="translate(136 64) rotate(-10) scale(1)">
            <ellipse cx="0" cy="0" rx="4.5" ry="3.5" transform="rotate(-20)" stroke="none" />
            <path d="M4 -1V-18l8 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          <g className="mascot-note" opacity="0.8" transform="translate(146 43) rotate(0) scale(0.8)">
            <ellipse cx="0" cy="0" rx="4.5" ry="3.5" transform="rotate(-20)" stroke="none" />
            <path d="M4 -1V-18l8 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        </svg>
      </Section>
      <Section title="Corriendo">
        <svg className="mascot mascot-late w-40" viewBox="8 0 160 150" fill="none" aria-hidden="true">
          <ellipse className="mascot-shadow" cx="88" cy="138" rx="32" ry="4" opacity="0.22" />
          <g className="mascot-trail" strokeWidth="3" strokeLinecap="round">
            <path d="M30 66h18" opacity="0" />
            <path d="M21 82h15.6" opacity="0.36" />
            <path d="M12 98h13.2" opacity="0.43" />
          </g>
          <g transform="translate(0 0) rotate(8 88 124) translate(88 124) scale(1.05 0.93) translate(-88 -124)">
            <ellipse className="mascot-shade" cx="61" cy="124" rx="11" ry="7" />
            <ellipse className="mascot-shade" cx="48" cy="96" rx="7" ry="10" transform="rotate(30 54 90)" />
            <g transform="rotate(-30.02 88 42)">
              <path className="mascot-stem" d="M88 42c0-6-1-10-3-14" strokeWidth="4" strokeLinecap="round" />
              <ellipse className="mascot-leaf" cx="74" cy="24" rx="13" ry="8" transform="rotate(-25 74 24)" />
              <ellipse className="mascot-leaf" cx="97" cy="20" rx="13" ry="8" transform="rotate(25 97 20)" />
            </g>
            <path className="mascot-body" d="M88 38c24 0 40 28 40 50 0 20-18 32-40 32s-40-12-40-32c0-22 16-50 40-50z" />
            <ellipse className="mascot-eye" cx="66" cy="54" rx="7" ry="4" opacity="0.22" transform="rotate(-35 66 54)" />
            <path className="mascot-ink-line" d="M68 63l11-4M97 59l11 4" strokeWidth="2.5" strokeLinecap="round" />
            <g transform="translate(0 75) scale(1 1) translate(0 -75)">
              <circle className="mascot-eye" cx="77" cy="75" r="9" />
              <circle className="mascot-eye" cx="101" cy="75" r="9" />
              <circle className="mascot-iris" cx="79" cy="76" r="6" />
              <circle className="mascot-iris" cx="103" cy="76" r="6" />
              <circle className="mascot-ink" cx="79.5" cy="76.5" r="3.6" />
              <circle className="mascot-ink" cx="103.5" cy="76.5" r="3.6" />
              <circle className="mascot-eye" cx="77.5" cy="74" r="1.6" />
              <circle className="mascot-eye" cx="101.5" cy="74" r="1.6" />
            </g>
            <ellipse className="mascot-ink" cx="90" cy="95" rx="4.5" ry="4" />
            <ellipse className="mascot-cheek" cx="65" cy="90" rx="6.5" ry="4.5" />
            <ellipse className="mascot-cheek" cx="114" cy="90" rx="6.5" ry="4.5" />
            <ellipse className="mascot-body" cx="129" cy="80" rx="7" ry="10" transform="rotate(-40 122 84)" />
            <ellipse className="mascot-body" cx="117" cy="123" rx="11" ry="7" />
          </g>
          <path className="mascot-drop" transform="translate(54 52) scale(0.8)" d="M5 0c0 4-2.7 6-5 6s-5-2-5-6c0-3 5-9 5-9s5 6 5 9z" opacity="0" />
        </svg>
      </Section>
      <Section title="Agobiada">
        <svg className="mascot mascot-stressed w-40" viewBox="8 0 160 150" fill="none" aria-hidden="true">
          <ellipse className="mascot-shadow" cx="88" cy="138" rx="32" ry="4" opacity="0.2" />
          <g transform="translate(0 0)">
            <ellipse className="mascot-body" cx="76" cy="124" rx="11" ry="7" />
            <ellipse className="mascot-body" cx="100" cy="124" rx="11" ry="7" />
            <g transform="rotate(10 88 42)">
              <path className="mascot-stem" d="M88 42c0-6-1-10-3-14" strokeWidth="4" strokeLinecap="round" />
              <ellipse className="mascot-leaf" cx="74" cy="24" rx="13" ry="8" transform="rotate(-25 74 24)" />
              <ellipse className="mascot-leaf" cx="97" cy="20" rx="13" ry="8" transform="rotate(25 97 20)" />
            </g>
            <path className="mascot-body" d="M88 38c24 0 40 28 40 50 0 20-18 32-40 32s-40-12-40-32c0-22 16-50 40-50z" />
            <ellipse className="mascot-eye" cx="66" cy="54" rx="7" ry="4" opacity="0.22" transform="rotate(-35 66 54)" />
            <ellipse className="mascot-body" cx="54" cy="56" rx="7" ry="11" transform="rotate(-55 54 56)" />
            <ellipse className="mascot-body" cx="122" cy="56" rx="7" ry="11" transform="rotate(55 122 56)" />
            <path className="mascot-ink-line" d="M67 66l12-7M97 59l12 7" strokeWidth="2.5" strokeLinecap="round" />
            <circle className="mascot-eye" cx="77" cy="76" r="10" />
            <circle className="mascot-eye" cx="101" cy="76" r="10" />
            <circle className="mascot-ink" cx="77" cy="76" r="2.4" />
            <circle className="mascot-ink" cx="101" cy="76" r="2.4" />
            <ellipse className="mascot-cheek" cx="65" cy="90" rx="6.5" ry="4.5" />
            <ellipse className="mascot-cheek" cx="114" cy="90" rx="6.5" ry="4.5" />
            <path className="mascot-ink-line" d="M79 97l3.5 -3 3.5 3 3.5 -3 3.5 3 3.5 -3 3.5 3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <path className="mascot-drop" transform="translate(43 62) scale(0.85)" d="M5 0c0 4-2.7 6-5 6s-5-2-5-6c0-3 5-9 5-9s5 6 5 9z" opacity="0" />
          <path className="mascot-drop" transform="translate(134 70.5) scale(0.85)" d="M5 0c0 4-2.7 6-5 6s-5-2-5-6c0-3 5-9 5-9s5 6 5 9z" opacity="1" />
        </svg>
      </Section>
      <Section title="A toda prisa">
        <svg className="mascot mascot-rushed w-40" viewBox="8 0 160 150" fill="none" aria-hidden="true">
          <ellipse className="mascot-shadow" cx="88" cy="138" rx="32" ry="4" opacity="0.22" />
          <g className="mascot-trail" strokeWidth="3" strokeLinecap="round">
            <path d="M30 62h18" opacity="0" />
            <path d="M21 74h15.6" opacity="0.36" />
            <path d="M12 86h13.2" opacity="0.43" />
            <path d="M3 98h10.8" opacity="0.14" />
            <path d="M24 110h16.4" opacity="0.26" />
          </g>
          <g transform="translate(0 0) rotate(12 88 124) translate(88 124) scale(1.05 0.93) translate(-88 -124)">
            <ellipse className="mascot-shade" cx="61" cy="124" rx="11" ry="7" />
            <ellipse className="mascot-shade" cx="48" cy="96" rx="7" ry="10" transform="rotate(30 54 90)" />
            <g transform="rotate(-30.02 88 42)">
              <path className="mascot-stem" d="M88 42c0-6-1-10-3-14" strokeWidth="4" strokeLinecap="round" />
              <ellipse className="mascot-leaf" cx="74" cy="24" rx="13" ry="8" transform="rotate(-25 74 24)" />
              <ellipse className="mascot-leaf" cx="97" cy="20" rx="13" ry="8" transform="rotate(25 97 20)" />
            </g>
            <path className="mascot-body" d="M88 38c24 0 40 28 40 50 0 20-18 32-40 32s-40-12-40-32c0-22 16-50 40-50z" />
            <ellipse className="mascot-eye" cx="66" cy="54" rx="7" ry="4" opacity="0.22" transform="rotate(-35 66 54)" />
            <path className="mascot-ink-line" d="M66 64l13-7M97 57l13 7" strokeWidth="2.5" strokeLinecap="round" />
            <g transform="translate(0 75) scale(1 1) translate(0 -75)">
              <circle className="mascot-eye" cx="78" cy="75" r="10" />
              <circle className="mascot-eye" cx="102" cy="75" r="10" />
              <circle className="mascot-ink" cx="82" cy="75" r="3.4" />
              <circle className="mascot-ink" cx="106" cy="75" r="3.4" />
              <circle className="mascot-eye" cx="83" cy="73.8" r="1.1" />
              <circle className="mascot-eye" cx="107" cy="73.8" r="1.1" />
            </g>
            <ellipse className="mascot-ink" cx="92" cy="97" rx="6.5" ry="7" />
            <ellipse className="mascot-tongue" cx="92" cy="101" rx="3.6" ry="2.2" />
            <ellipse className="mascot-cheek" cx="65" cy="90" rx="6.5" ry="4.5" />
            <ellipse className="mascot-cheek" cx="114" cy="90" rx="6.5" ry="4.5" />
            <ellipse className="mascot-body" cx="129" cy="80" rx="7" ry="10" transform="rotate(-40 122 84)" />
            <ellipse className="mascot-body" cx="117" cy="123" rx="11" ry="7" />
          </g>
          <path className="mascot-drop" transform="translate(54 52) scale(0.8)" d="M5 0c0 4-2.7 6-5 6s-5-2-5-6c0-3 5-9 5-9s5 6 5 9z" opacity="0" />
          <path className="mascot-drop" transform="translate(42.67 65.33) scale(0.7)" d="M5 0c0 4-2.7 6-5 6s-5-2-5-6c0-3 5-9 5-9s5 6 5 9z" opacity="0.87" />
          <path className="mascot-drop" transform="translate(31.33 82.67) scale(0.6)" d="M5 0c0 4-2.7 6-5 6s-5-2-5-6c0-3 5-9 5-9s5 6 5 9z" opacity="0.87" />
        </svg>
      </Section>
      <Section title="Contenta">
        <svg className="mascot mascot-happy w-40" viewBox="8 0 160 150" fill="none" aria-hidden="true">
          <ellipse className="mascot-shadow" cx="88" cy="138" rx="32" ry="4" opacity="0.22" />
          <path className="mascot-sparkle" transform="translate(30 54) rotate(0) scale(0.5)" d="M0 -10l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" opacity="0.4" />
          <path className="mascot-sparkle" transform="translate(142 38) rotate(45) scale(0.88)" d="M0 -10l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" opacity="1" />
          <path className="mascot-sparkle" transform="translate(150 96) rotate(22.5) scale(0.55)" d="M0 -10l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" opacity="0.82" />
          <g transform="translate(0 0) translate(88 130) scale(1 1) translate(-88 -130)">
            <ellipse className="mascot-body" cx="76" cy="124" rx="11" ry="7" />
            <ellipse className="mascot-body" cx="100" cy="124" rx="11" ry="7" />
            <ellipse className="mascot-body" cx="46" cy="70" rx="7" ry="11" transform="rotate(-35 54 84)" />
            <ellipse className="mascot-body" cx="130" cy="70" rx="7" ry="11" transform="rotate(35 122 84)" />
            <g transform="rotate(0 88 42)">
              <path className="mascot-stem" d="M88 42c0-6-1-10-3-14" strokeWidth="4" strokeLinecap="round" />
              <ellipse className="mascot-leaf" cx="74" cy="24" rx="13" ry="8" transform="rotate(-25 74 24)" />
              <ellipse className="mascot-leaf" cx="97" cy="20" rx="13" ry="8" transform="rotate(25 97 20)" />
            </g>
            <path className="mascot-body" d="M88 38c24 0 40 28 40 50 0 20-18 32-40 32s-40-12-40-32c0-22 16-50 40-50z" />
            <ellipse className="mascot-eye" cx="66" cy="54" rx="7" ry="4" opacity="0.22" transform="rotate(-35 66 54)" />
            <path className="mascot-ink-line" d="M69 78q8-9 16 0M93 78q8-9 16 0" strokeWidth="3" strokeLinecap="round" />
            <ellipse className="mascot-cheek" cx="65" cy="90" rx="6.5" ry="4.5" />
            <ellipse className="mascot-cheek" cx="114" cy="90" rx="6.5" ry="4.5" />
            <path className="mascot-ink" d="M80 90h20q0 12-10 12t-10-12z" />
            <path className="mascot-tongue" d="M85 98q5-4 10 0q-2 4-5 4t-5-4z" />
          </g>
        </svg>
      </Section>
    </Frame>
  )
}
