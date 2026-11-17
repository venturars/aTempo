// Tempito, la mascota de aTempo: la semilla del prototipo (rama design/tempito-ui).
// Cinco ánimos (tempitoMood.ts y homeState.ts deciden cuál):
// - «chill»: con gafas de sol, se balancea al ritmo y le salen notas de música.
// - «late»: corre inclinada, con el brote echado hacia atrás y gotas de sudor.
// - «stressed»: tiembla con las manos en la cabeza, ojos muy abiertos y boca temblorosa.
// - «rushed»: la clase ya empezó; corre aún más deprisa, con cara de pánico, en azul apagado.
// - «happy»: ya registró la entrada; salta con los brazos arriba y chispas.
//
// El movimiento se diseñó y se aprobó en Remotion. Es una función del fotograma, así que aquí
// corre igual, en vivo, con useMotionFrame. Los colores salen de system.css (.mascot): siguen el tema.
// Es un adorno, así que no se lee.
import type { TempitoMood } from './tempitoMood'
import { useMotionFrame } from './useMotionFrame'

const bodyPath = 'M88 38c24 0 40 28 40 50 0 20-18 32-40 32s-40-12-40-32c0-22 16-50 40-50z'
const TAU = Math.PI * 2

// Repite un valor cada `period` fotogramas: va de 0 a 1.
function loop(frame: number, period: number, offset = 0): number {
  return ((((frame + offset) % period) + period) % period) / period
}

// Parpadeo: cada `period` fotogramas los ojos se cierran durante 4.
function blinkScale(frame: number, period = 70): number {
  const t = frame % period
  if (t < 2) return 1 - t * 0.45
  if (t < 4) return 0.1 + (t - 2) * 0.45
  return 1
}

export function Tempito({
  mood = 'late',
  className = 'w-36'
}: {
  mood?: TempitoMood
  className?: string
}): React.JSX.Element {
  const frame = useMotionFrame()
  return (
    <svg
      className={`mascot mascot-${mood} ${className}`}
      viewBox="8 0 160 150"
      fill="none"
      aria-hidden="true"
    >
      {mood === 'chill' ? <Chill frame={frame} /> : null}
      {mood === 'late' ? <Running frame={frame} cycle={14} lean={8} face="hurried" /> : null}
      {mood === 'rushed' ? <Running frame={frame} cycle={9} lean={12} face="panicked" /> : null}
      {mood === 'stressed' ? <Stressed frame={frame} /> : null}
      {mood === 'happy' ? <Happy frame={frame} /> : null}
    </svg>
  )
}

function Shadow({ scale, opacity }: { scale: number; opacity: number }): React.JSX.Element {
  return (
    <ellipse
      className="mascot-shadow"
      cx="88"
      cy="138"
      rx={32 * scale}
      ry={4 * (0.8 + 0.2 * scale)}
      opacity={opacity}
    />
  )
}

function Sprout({ angle }: { angle: number }): React.JSX.Element {
  return (
    <g transform={`rotate(${angle} 88 42)`}>
      <path className="mascot-stem" d="M88 42c0-6-1-10-3-14" strokeWidth="4" strokeLinecap="round" />
      <ellipse className="mascot-leaf" cx="74" cy="24" rx="13" ry="8" transform="rotate(-25 74 24)" />
      <ellipse className="mascot-leaf" cx="97" cy="20" rx="13" ry="8" transform="rotate(25 97 20)" />
    </g>
  )
}

function Shine(): React.JSX.Element {
  return (
    <ellipse
      className="mascot-eye"
      cx="66"
      cy="54"
      rx="7"
      ry="4"
      opacity="0.22"
      transform="rotate(-35 66 54)"
    />
  )
}

function Cheeks(): React.JSX.Element {
  return (
    <>
      <ellipse className="mascot-cheek" cx="65" cy="90" rx="6.5" ry="4.5" />
      <ellipse className="mascot-cheek" cx="114" cy="90" rx="6.5" ry="4.5" />
    </>
  )
}

function Drop({
  x,
  y,
  scale = 1,
  opacity = 1
}: {
  x: number
  y: number
  scale?: number
  opacity?: number
}): React.JSX.Element {
  return (
    <path
      className="mascot-drop"
      transform={`translate(${x} ${y}) scale(${scale})`}
      d="M5 0c0 4-2.7 6-5 6s-5-2-5-6c0-3 5-9 5-9s5 6 5 9z"
      opacity={opacity}
    />
  )
}

// Estela que se desplaza hacia atrás y se desvanece.
function Trail({ frame, speed, lines }: { frame: number; speed: number; lines: number[] }): React.JSX.Element {
  return (
    <g className="mascot-trail" strokeWidth="3" strokeLinecap="round">
      {lines.map((y, index) => {
        const t = loop(frame * speed, 30, index * 9)
        const x = 30 - t * 30
        return <path key={y} d={`M${x} ${y}h${18 - t * 8}`} opacity={0.45 * Math.sin(Math.PI * t)} />
      })}
    </g>
  )
}

// ——— Corriendo («late» y «rushed») ———
// En cada paso se aplasta al pisar y se estira en el aire; los pies van en arco y el brote llega con retraso.
function Running({
  frame,
  cycle,
  lean,
  face
}: {
  frame: number
  cycle: number
  lean: number
  face: 'hurried' | 'panicked'
}): React.JSX.Element {
  const phase = (frame / cycle) * TAU
  const air = Math.abs(Math.sin(phase))
  const bob = -air * 7
  const scaleY = 0.93 + 0.11 * air
  const scaleX = 1.05 - 0.08 * air
  const footFront = { x: 104 + 13 * Math.cos(phase), y: 123 - Math.max(0, Math.sin(phase)) * 9 }
  const footBack = {
    x: 74 + 13 * Math.cos(phase + Math.PI),
    y: 124 - Math.max(0, Math.sin(phase + Math.PI)) * 9
  }
  const armSwing = 30 * Math.sin(phase)
  const sproutAngle = -22 + 9 * Math.sin(phase - 1.1)
  const blink = face === 'hurried' ? blinkScale(frame) : blinkScale(frame, 95)
  const drops = face === 'panicked' ? [0, 6, 12] : [0]
  const body = `translate(0 ${bob}) rotate(${lean} 88 124) translate(88 124) scale(${scaleX} ${scaleY}) translate(-88 -124)`

  return (
    <>
      <Shadow scale={1 - 0.2 * air} opacity={0.22 - 0.08 * air} />
      <Trail
        frame={frame}
        speed={face === 'panicked' ? 2.2 : 1.3}
        lines={face === 'panicked' ? [62, 74, 86, 98, 110] : [66, 82, 98]}
      />
      <g transform={body}>
        <ellipse className="mascot-shade" cx={footBack.x} cy={footBack.y} rx="11" ry="7" />
        <ellipse
          className="mascot-shade"
          cx="48"
          cy="96"
          rx="7"
          ry="10"
          transform={`rotate(${30 - armSwing} 54 90)`}
        />
        <Sprout angle={sproutAngle} />
        <path className="mascot-body" d={bodyPath} />
        <Shine />
        {face === 'hurried' ? (
          <HurriedFace blink={blink} />
        ) : (
          <PanickedFace blink={blink} frame={frame} />
        )}
        <Cheeks />
        <ellipse
          className="mascot-body"
          cx="129"
          cy="80"
          rx="7"
          ry="10"
          transform={`rotate(${-40 + armSwing} 122 84)`}
        />
        <ellipse className="mascot-body" cx={footFront.x} cy={footFront.y} rx="11" ry="7" />
      </g>
      {drops.map((delay, index) => {
        const t = loop(frame, 18, delay)
        return (
          <Drop
            key={delay}
            x={54 - index * 4 - 22 * t}
            y={52 + index * 14 - 8 * t + 18 * t * t + bob * 0.5}
            scale={0.8 - index * 0.1}
            opacity={Math.sin(Math.PI * t)}
          />
        )
      })}
    </>
  )
}

function Eyes({ blink, children }: { blink: number; children: React.ReactNode }): React.JSX.Element {
  return <g transform={`translate(0 75) scale(1 ${blink}) translate(0 -75)`}>{children}</g>
}

function HurriedFace({ blink }: { blink: number }): React.JSX.Element {
  return (
    <>
      <path className="mascot-ink-line" d="M68 63l11-4M97 59l11 4" strokeWidth="2.5" strokeLinecap="round" />
      <Eyes blink={blink}>
        <circle className="mascot-eye" cx="77" cy="75" r="9" />
        <circle className="mascot-eye" cx="101" cy="75" r="9" />
        <circle className="mascot-iris" cx="79" cy="76" r="6" />
        <circle className="mascot-iris" cx="103" cy="76" r="6" />
        <circle className="mascot-ink" cx="79.5" cy="76.5" r="3.6" />
        <circle className="mascot-ink" cx="103.5" cy="76.5" r="3.6" />
        <circle className="mascot-eye" cx="77.5" cy="74" r="1.6" />
        <circle className="mascot-eye" cx="101.5" cy="74" r="1.6" />
      </Eyes>
      <ellipse className="mascot-ink" cx="90" cy="95" rx="4.5" ry="4" />
    </>
  )
}

function PanickedFace({ blink, frame }: { blink: number; frame: number }): React.JSX.Element {
  const shout = 1 + 0.12 * Math.sin(frame * 0.9)
  return (
    <>
      <path className="mascot-ink-line" d="M66 64l13-7M97 57l13 7" strokeWidth="2.5" strokeLinecap="round" />
      <Eyes blink={blink}>
        <circle className="mascot-eye" cx="78" cy="75" r="10" />
        <circle className="mascot-eye" cx="102" cy="75" r="10" />
        <circle className="mascot-ink" cx="82" cy="75" r="3.4" />
        <circle className="mascot-ink" cx="106" cy="75" r="3.4" />
        <circle className="mascot-eye" cx="83" cy="73.8" r="1.1" />
        <circle className="mascot-eye" cx="107" cy="73.8" r="1.1" />
      </Eyes>
      <ellipse className="mascot-ink" cx="92" cy="97" rx="6.5" ry={7 * shout} />
      <ellipse className="mascot-tongue" cx="92" cy={101 + (shout - 1) * 6} rx="3.6" ry="2.2" />
    </>
  )
}

// ——— Tranquila ———
// Se balancea y asiente al ritmo; un brillo cruza las gafas y suben notas de música.
function Chill({ frame }: { frame: number }): React.JSX.Element {
  const beat = loop(frame, 30)
  const sway = 4 * Math.sin(loop(frame, 60) * TAU)
  const nod = -2.5 * Math.abs(Math.sin(beat * Math.PI))
  const glintX = 58 + loop(frame, 90) * 70

  return (
    <>
      <Shadow scale={1} opacity={0.2} />
      <g transform={`rotate(${sway} 88 130) translate(0 ${nod})`}>
        <ellipse className="mascot-body" cx="76" cy="124" rx="11" ry="7" />
        <ellipse className="mascot-body" cx="100" cy="124" rx="11" ry="7" />
        <ellipse className="mascot-shade" cx="50" cy="100" rx="7" ry="10" transform={`rotate(${20 + sway} 50 100)`} />
        <ellipse className="mascot-shade" cx="126" cy="100" rx="7" ry="10" transform={`rotate(${-20 + sway} 126 100)`} />
        <Sprout angle={-8 + sway * 1.6} />
        <path className="mascot-body" d={bodyPath} />
        <Shine />
        <path className="mascot-ink-line" d="M84 74h10" strokeWidth="3" strokeLinecap="round" />
        <rect className="mascot-ink" x="63" y="67" width="22" height="14" rx="6" />
        <rect className="mascot-ink" x="93" y="67" width="22" height="14" rx="6" />
        <clipPath id="tempito-lenses">
          <rect x="63" y="67" width="22" height="14" rx="6" />
          <rect x="93" y="67" width="22" height="14" rx="6" />
        </clipPath>
        <g clipPath="url(#tempito-lenses)">
          <path className="mascot-glare" d={`M${glintX} 60l-10 30`} strokeWidth="5" opacity="0.55" />
        </g>
        <Cheeks />
        <path className="mascot-ink-line" d="M81 94q9 7 18 0" strokeWidth="3" strokeLinecap="round" />
      </g>
      {[0, 30].map((delay, index) => {
        const t = loop(frame, 60, delay)
        const x = 136 + index * 10 + 5 * Math.sin(t * TAU)
        const y = 64 - index * 4 - 34 * t
        return (
          <g
            key={delay}
            className="mascot-note"
            opacity={Math.sin(Math.PI * t) * 0.8}
            transform={`translate(${x} ${y}) rotate(${-10 + 20 * t}) scale(${index === 0 ? 1 : 0.8})`}
          >
            <ellipse cx="0" cy="0" rx="4.5" ry="3.5" transform="rotate(-20)" stroke="none" />
            <path d="M4 -1V-18l8 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        )
      })}
    </>
  )
}

// ——— Agobiada ———
// Tiembla sin ritmo fijo, las pupilas laten, la boca tiembla y el sudor cae por los dos lados.
function Stressed({ frame }: { frame: number }): React.JSX.Element {
  const jitterX = 1.6 * Math.sin(frame * 2.7) + 1.1 * Math.sin(frame * 5.3)
  const jitterY = 0.8 * Math.sin(frame * 3.9)
  const pupil = 2.4 + 0.7 * Math.sin(frame * 0.8)
  const wobble = frame % 6 < 3 ? 1 : -1
  const armShake = 4 * Math.sin(frame * 1.7)
  const mouth = `M79 97l3.5 ${-3 * wobble} 3.5 ${3 * wobble} 3.5 ${-3 * wobble} 3.5 ${3 * wobble} 3.5 ${-3 * wobble} 3.5 ${3 * wobble}`

  return (
    <>
      <Shadow scale={1} opacity={0.2} />
      <g transform={`translate(${jitterX} ${jitterY})`}>
        <ellipse className="mascot-body" cx="76" cy="124" rx="11" ry="7" />
        <ellipse className="mascot-body" cx="100" cy="124" rx="11" ry="7" />
        <Sprout angle={10 + 6 * Math.sin(frame * 1.3)} />
        <path className="mascot-body" d={bodyPath} />
        <Shine />
        <ellipse className="mascot-body" cx="54" cy="56" rx="7" ry="11" transform={`rotate(${-55 + armShake} 54 56)`} />
        <ellipse className="mascot-body" cx="122" cy="56" rx="7" ry="11" transform={`rotate(${55 - armShake} 122 56)`} />
        <path className="mascot-ink-line" d="M67 66l12-7M97 59l12 7" strokeWidth="2.5" strokeLinecap="round" />
        <circle className="mascot-eye" cx="77" cy="76" r="10" />
        <circle className="mascot-eye" cx="101" cy="76" r="10" />
        <circle className="mascot-ink" cx="77" cy="76" r={pupil} />
        <circle className="mascot-ink" cx="101" cy="76" r={pupil} />
        <Cheeks />
        <path className="mascot-ink-line" d={mouth} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {[
        { x: 43, y: 62, delay: 0 },
        { x: 134, y: 66, delay: 12 }
      ].map((drop) => {
        const t = loop(frame, 24, drop.delay)
        return <Drop key={drop.delay} x={drop.x} y={drop.y + 18 * t * t} scale={0.85} opacity={Math.sin(Math.PI * t)} />
      })}
    </>
  )
}

// ——— Contenta ———
// Salta: se agacha, se estira al subir y se aplasta al caer. Mueve los brazos y brillan chispas.
function jumpPose(t: number): { lift: number; scaleX: number; scaleY: number } {
  if (t < 0.2) {
    const k = Math.sin((t / 0.2) * Math.PI)
    return { lift: 0, scaleX: 1 + 0.06 * k, scaleY: 1 - 0.1 * k }
  }
  if (t < 0.8) {
    const k = (t - 0.2) / 0.6
    const stretch = Math.max(0, 1 - Math.abs(k - 0.15) * 4)
    return { lift: Math.sin(k * Math.PI) * 20, scaleX: 1 - 0.05 * stretch, scaleY: 1 + 0.08 * stretch }
  }
  const k = Math.sin(((t - 0.8) / 0.2) * Math.PI)
  return { lift: 0, scaleX: 1 + 0.05 * k, scaleY: 1 - 0.08 * k }
}

const sparkles = [
  { x: 30, y: 54, size: 1, delay: 0 },
  { x: 142, y: 38, size: 0.8, delay: 16 },
  { x: 150, y: 96, size: 0.6, delay: 8 }
]

function Happy({ frame }: { frame: number }): React.JSX.Element {
  const t = loop(frame, 32)
  const { lift, scaleX, scaleY } = jumpPose(t)
  const wave = 18 * Math.sin(loop(frame, 16) * TAU)

  return (
    <>
      <Shadow scale={1 - lift / 60} opacity={0.22 - lift / 200} />
      {sparkles.map((spark) => {
        const k = loop(frame, 32, spark.delay)
        const scale = spark.size * (0.5 + 0.6 * Math.sin(k * Math.PI))
        return (
          <path
            key={spark.delay}
            className="mascot-sparkle"
            transform={`translate(${spark.x} ${spark.y}) rotate(${k * 90}) scale(${scale})`}
            d="M0 -10l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"
            opacity={0.4 + 0.6 * Math.sin(k * Math.PI)}
          />
        )
      })}
      <g transform={`translate(0 ${-lift}) translate(88 130) scale(${scaleX} ${scaleY}) translate(-88 -130)`}>
        <ellipse className="mascot-body" cx="76" cy="124" rx="11" ry="7" />
        <ellipse className="mascot-body" cx="100" cy="124" rx="11" ry="7" />
        <ellipse className="mascot-body" cx="46" cy="70" rx="7" ry="11" transform={`rotate(${-35 + wave} 54 84)`} />
        <ellipse className="mascot-body" cx="130" cy="70" rx="7" ry="11" transform={`rotate(${35 - wave} 122 84)`} />
        <Sprout angle={-6 * Math.sin(t * TAU)} />
        <path className="mascot-body" d={bodyPath} />
        <Shine />
        <path className="mascot-ink-line" d="M69 78q8-9 16 0M93 78q8-9 16 0" strokeWidth="3" strokeLinecap="round" />
        <Cheeks />
        <path className="mascot-ink" d="M80 90h20q0 12-10 12t-10-12z" />
        <path className="mascot-tongue" d="M85 98q5-4 10 0q-2 4-5 4t-5-4z" />
      </g>
    </>
  )
}
