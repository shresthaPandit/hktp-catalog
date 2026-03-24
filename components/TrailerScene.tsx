'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Section { id: number; title: string }
interface Props {
  sections: Section[]
  activeSection: Section | null
  onSectionSelect: (section: Section) => void
}

// ─── Trailer dimensions ────────────────────────────────────────────
const TL = 5.2, TW = 0.90, TH = 1.05, HW = TW / 2

// ─── Material factory ──────────────────────────────────────────────
function mat(color: string, metalness = 0.5, roughness = 0.45, emissiveColor = '#000000') {
  return new THREE.MeshStandardMaterial({
    color, metalness, roughness,
    emissive: new THREE.Color(emissiveColor),
    emissiveIntensity: 0,
  })
}
function box(w: number, h: number, d: number, m: THREE.Material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
}

// ─── Build full trailer ────────────────────────────────────────────
function buildTrailer(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.position.y = 0.55

  // Shared palette — aluminum dry-van style
  const C = {
    alum:    '#cdd2d8',  // main body aluminum
    alumDk:  '#b0b5bb',  // darker aluminum (ribs, headers)
    roof:    '#d8dcdf',  // slightly lighter roof
    roofCap: '#bfc4c9',  // roof cap/flashing
    steel:   '#353a40',  // dark steel structural
    under:   '#1e2126',  // underframe dark
    wheelRb: '#141414',  // tire rubber
    rimSil:  '#5a5f65',  // wheel rim silver
    hubChr:  '#8a9095',  // hub chrome
    redLgt:  '#ff1a1a',  // tail lights
    amberLt: '#ff8800',  // clearance lights
    accent:  '#E31E24',  // HK red accent stripe
    skirt:   '#2a2d33',  // aero skirt
    door:    '#c2c7cc',  // rear doors
    hinge:   '#404650',  // door hardware
  }

  function tagGroup(g: THREE.Group, title: string) {
    g.userData.sectionTitle = title
    g.traverse(o => { if (o instanceof THREE.Mesh) o.userData.sectionTitle = title })
  }

  // ══════════════════════════════════════════
  // SIDE WALL
  // ══════════════════════════════════════════
  const sideWall = new THREE.Group()

  for (const side of [-1, 1]) {
    const z = side * (HW + 0.012)
    // Main panel sheet
    const panel = box(TL, TH, 0.022, mat(C.alum, 0.55, 0.40))
    panel.position.set(0, 0, z)
    sideWall.add(panel)

    // Bottom sill
    const sill = box(TL, 0.05, 0.048, mat(C.steel))
    sill.position.set(0, -TH / 2 + 0.025, z + side * 0.012)
    sideWall.add(sill)

    // Top header rail
    const header = box(TL, 0.05, 0.048, mat(C.alumDk))
    header.position.set(0, TH / 2 - 0.025, z + side * 0.012)
    sideWall.add(header)

    // Vertical ribs (13)
    for (let i = 0; i < 13; i++) {
      const x = -TL / 2 + 0.32 + i * ((TL - 0.64) / 12)
      const rib = box(0.042, TH + 0.01, 0.028, mat(C.alumDk, 0.6, 0.35))
      rib.position.set(x, 0, z + side * 0.018)
      sideWall.add(rib)
    }

    // ── HK red accent stripe along the bottom ──
    const stripe = box(TL - 0.05, 0.06, 0.005, mat(C.accent, 0.3, 0.5))
    stripe.position.set(0, -TH / 2 + 0.12, z + side * 0.025)
    sideWall.add(stripe)

    // Clearance lights (top, 3 per side)
    for (let i = 0; i < 3; i++) {
      const cx = -TL / 2 + 0.4 + i * 0.22
      const cl = box(0.055, 0.035, 0.015, mat(C.amberLt, 0.2, 0.5, C.amberLt))
      ;(cl.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4
      cl.position.set(cx, TH / 2 - 0.035, z + side * 0.025)
      sideWall.add(cl)
    }
  }

  tagGroup(sideWall, 'Side Wall')
  root.add(sideWall)

  // ══════════════════════════════════════════
  // ROOF ASSEMBLY
  // ══════════════════════════════════════════
  const roofGrp = new THREE.Group()

  // Main roof sheet
  const roofSheet = box(TL + 0.07, 0.042, TW + 0.11, mat(C.roof, 0.45, 0.55))
  roofSheet.position.y = TH / 2 + 0.021
  roofGrp.add(roofSheet)

  // Roof cap drip rail
  const cap = box(TL + 0.10, 0.022, TW + 0.14, mat(C.roofCap, 0.6, 0.4))
  cap.position.y = TH / 2 + 0.054
  roofGrp.add(cap)

  // Roof bows (7 cross supports)
  for (let i = 0; i < 7; i++) {
    const x = -TL / 2 + 0.5 + i * ((TL - 1.0) / 6)
    const bow = box(0.038, 0.028, TW + 0.06, mat(C.steel))
    bow.position.set(x, TH / 2 + 0.006, 0)
    roofGrp.add(bow)
  }

  tagGroup(roofGrp, 'Roof Assembly')
  root.add(roofGrp)

  // ══════════════════════════════════════════
  // FRONT WALL
  // ══════════════════════════════════════════
  const frontGrp = new THREE.Group()

  const frontMain = box(0.038, TH, TW, mat(C.alum, 0.55, 0.42))
  frontMain.position.x = -TL / 2
  frontGrp.add(frontMain)

  const frontInner = box(0.022, TH - 0.08, TW - 0.07, mat(C.alumDk, 0.5, 0.5))
  frontInner.position.x = -TL / 2 - 0.012
  frontGrp.add(frontInner)

  // Top marker lights (amber)
  for (const z of [-HW + 0.07, HW - 0.07]) {
    const ml = box(0.05, 0.04, 0.03, mat(C.amberLt, 0.2, 0.5, C.amberLt))
    ;(ml.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5
    ml.position.set(-TL / 2 - 0.02, TH / 2 - 0.07, z)
    frontGrp.add(ml)
  }

  // Vertical structural channels
  for (const z of [-HW + 0.15, 0, HW - 0.15]) {
    const ch = box(0.025, TH - 0.06, 0.05, mat(C.steel))
    ch.position.set(-TL / 2 - 0.01, 0, z)
    frontGrp.add(ch)
  }

  tagGroup(frontGrp, 'Front Wall')
  root.add(frontGrp)

  // ══════════════════════════════════════════
  // REAR FRAME
  // ══════════════════════════════════════════
  const rearGrp = new THREE.Group()

  // Perimeter frame
  const rt = box(0.042, 0.06, TW + 0.045, mat(C.steel))
  rt.position.set(TL / 2, TH / 2 - 0.03, 0); rearGrp.add(rt)
  const rb = box(0.042, 0.06, TW + 0.045, mat(C.steel))
  rb.position.set(TL / 2, -TH / 2 + 0.03, 0); rearGrp.add(rb)
  for (const z of [-HW - 0.01, HW + 0.01]) {
    const rp = box(0.042, TH, 0.055, mat(C.steel))
    rp.position.set(TL / 2, 0, z); rearGrp.add(rp)
  }
  const split = box(0.038, TH, 0.042, mat(C.steel))
  split.position.set(TL / 2, 0, 0); rearGrp.add(split)

  // Door panels
  for (const [zSide, zOff] of [[-1, -HW / 2], [1, HW / 2]] as [number, number][]) {
    const door = box(0.020, TH - 0.13, HW - 0.065, mat(C.door, 0.45, 0.50))
    door.position.set(TL / 2 + 0.021, 0, zOff); rearGrp.add(door)

    // Horizontal stiffener mid-door
    const stiff = box(0.018, 0.04, HW - 0.08, mat(C.alumDk))
    stiff.position.set(TL / 2 + 0.025, 0, zOff); rearGrp.add(stiff)

    // Hinges (3 per door)
    for (const yOff of [-0.32, 0, 0.32]) {
      const hinge = box(0.055, 0.065, 0.038, mat(C.hinge))
      hinge.position.set(TL / 2 + 0.055, yOff, zOff + zSide * (HW / 2 - 0.07))
      rearGrp.add(hinge)
    }

    // Cam lock bar
    const lock = box(0.022, TH - 0.20, 0.022, mat(C.hinge))
    lock.position.set(TL / 2 + 0.042, 0, zOff + zSide * 0.04); rearGrp.add(lock)

    // Lock cam handle
    const cam = box(0.04, 0.04, 0.055, mat(C.hinge))
    cam.position.set(TL / 2 + 0.06, 0, zOff + zSide * 0.04); rearGrp.add(cam)
  }

  // ICC underride guard
  const icc = box(0.055, 0.075, TW - 0.04, mat(C.steel))
  icc.position.set(TL / 2 + 0.025, -TH / 2 + 0.055, 0); rearGrp.add(icc)

  // Tail lights — 4 big red lenses
  for (const z of [-HW + 0.095, -HW + 0.215, HW - 0.095, HW - 0.215]) {
    const tl = box(0.038, 0.075, 0.105, mat(C.redLgt, 0.2, 0.5, C.redLgt))
    ;(tl.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6
    tl.position.set(TL / 2 + 0.01, -TH / 2 + 0.09, z)
    rearGrp.add(tl)
  }

  tagGroup(rearGrp, 'Rear Frame')
  root.add(rearGrp)

  // ══════════════════════════════════════════
  // BASE ASSEMBLY + LANDING GEAR
  // ══════════════════════════════════════════
  const baseGrp = new THREE.Group()

  // Main floor beam
  const floor = box(TL, 0.065, TW - 0.07, mat(C.under, 0.6, 0.5))
  floor.position.y = -TH / 2 + 0.005; baseGrp.add(floor)

  // Long side rails
  for (const z of [-HW + 0.045, HW - 0.045]) {
    const rail = box(TL, 0.058, 0.058, mat(C.steel))
    rail.position.set(0, -TH / 2 + 0.008, z); baseGrp.add(rail)
  }

  // Cross members (9)
  for (let i = 0; i < 9; i++) {
    const x = -TL / 2 + 0.45 + i * ((TL - 0.9) / 8)
    const xm = box(0.052, 0.052, TW - 0.10, mat(C.steel))
    xm.position.set(x, -TH / 2 - 0.015, 0); baseGrp.add(xm)
  }

  // ── Landing gear (X-brace style) ──────────
  const lgX = -TL / 2 + 0.88
  for (const z of [-0.22, 0.22]) {
    // Outer tube
    const tube = box(0.062, 0.58, 0.062, mat(C.steel, 0.7, 0.3))
    tube.position.set(lgX, -TH / 2 - 0.30, z); baseGrp.add(tube)

    // X-braces
    for (const angle of [0.5, -0.5]) {
      const brGeo = new THREE.BoxGeometry(0.046, 0.40, 0.046)
      const br = new THREE.Mesh(brGeo, mat(C.steel))
      br.position.set(lgX + 0.12, -TH / 2 - 0.32, z)
      br.rotation.z = angle; baseGrp.add(br)
    }

    // Foot pad
    const foot = box(0.18, 0.038, 0.18, mat(C.steel))
    foot.position.set(lgX, -TH / 2 - 0.60, z); baseGrp.add(foot)
  }

  // Horizontal cross-brace between legs
  const lgBar = box(0.038, 0.038, 0.44, mat(C.steel))
  lgBar.position.set(lgX, -TH / 2 - 0.32, 0); baseGrp.add(lgBar)

  // Aero skirt panels (both sides)
  for (const side of [-1, 1]) {
    const z = side * (HW + 0.012)
    const sk = box(TL * 0.60, 0.21, 0.022, mat(C.skirt, 0.35, 0.65))
    sk.position.set(-TL / 2 + TL * 0.30 + 0.15, -TH / 2 - 0.16, z + side * 0.008)
    baseGrp.add(sk)
  }

  tagGroup(baseGrp, 'Base Assembly and Landing Gear')
  root.add(baseGrp)

  // ══════════════════════════════════════════
  // AXLE END (tandem axles + dual rear wheels)
  // ══════════════════════════════════════════
  const axleGrp = new THREE.Group()
  const AY = -TH / 2 - 0.435

  for (const axX of [TL / 2 - 0.65, TL / 2 - 1.10]) {
    // Axle beam
    const beam = box(0.075, 0.065, TW + 0.62, mat(C.steel, 0.7, 0.3))
    beam.position.set(axX, AY + 0.065, 0); axleGrp.add(beam)

    // Air bag / suspension housing
    for (const z of [-(HW + 0.09), (HW + 0.09)]) {
      const ab = box(0.13, 0.11, 0.13, mat('#222831', 0.2, 0.85))
      ab.position.set(axX, AY + 0.16, z); axleGrp.add(ab)
    }

    // 4 wheels per axle (dual rear — inner + outer × 2 sides)
    for (const side of [-1, 1]) {
      for (const offset of [0.072, 0.194]) {
        const wz = side * (HW + 0.155 + offset)

        // Tire (black rubber)
        const tireGeo = new THREE.CylinderGeometry(0.225, 0.225, 0.105, 28)
        const tire = new THREE.Mesh(tireGeo, mat(C.wheelRb, 0.15, 0.96))
        tire.rotation.x = Math.PI / 2
        tire.position.set(axX, AY, wz); axleGrp.add(tire)

        // Tire sidewall tread detail (thin ring)
        const treadGeo = new THREE.TorusGeometry(0.21, 0.008, 6, 28)
        const tread = new THREE.Mesh(treadGeo, mat('#1a1a1a', 0.1, 0.99))
        tread.position.set(axX, AY, wz); axleGrp.add(tread)

        // Rim (silver alloy)
        const rimGeo = new THREE.CylinderGeometry(0.148, 0.148, 0.112, 16)
        const rim = new THREE.Mesh(rimGeo, mat(C.rimSil, 0.75, 0.25))
        rim.rotation.x = Math.PI / 2
        rim.position.set(axX, AY, wz); axleGrp.add(rim)

        // Hub cap (chrome center)
        const hubGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.115, 10)
        const hub = new THREE.Mesh(hubGeo, mat(C.hubChr, 0.9, 0.1))
        hub.rotation.x = Math.PI / 2
        hub.position.set(axX, AY, wz); axleGrp.add(hub)
      }
    }

    // Mudflap
    const flap = box(0.018, 0.30, TW + 0.52, mat('#181818', 0.1, 0.95))
    flap.position.set(axX + 0.15, AY, 0); axleGrp.add(flap)
  }

  tagGroup(axleGrp, 'Axle End')
  root.add(axleGrp)

  // ── Structural core (non-interactive shell) ──────────────────────
  const core = box(TL - 0.05, TH - 0.04, TW - 0.04, mat(C.alum, 0.45, 0.5))
  root.add(core)

  scene.add(root)
  return root
}

// ══════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function TrailerScene({ sections, activeSection, onSectionSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef     = useRef<THREE.Scene | null>(null)
  const hoveredRef   = useRef<string | null>(null)
  const animRef      = useRef<number>(0)
  const timeRef      = useRef<number>(0)

  // Update materials when activeSection changes from outside (tab click)
  useEffect(() => {
    if (!sceneRef.current) return
    applyMaterials(sceneRef.current, hoveredRef.current, activeSection?.title ?? null)
  }, [activeSection])

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    // ── Scene ──────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color('#0a0b0d')
    scene.fog = new THREE.FogExp2('#0a0b0d', 0.038)

    // ── Lights ─────────────────────────────────────────────────────
    // Sky/ground hemisphere
    const hemi = new THREE.HemisphereLight('#b0c8e0', '#302015', 0.9)
    scene.add(hemi)

    // Key light (bright white from upper-front-right)
    const key = new THREE.DirectionalLight('#ffffff', 3.2)
    key.position.set(7, 10, 6)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 30
    key.shadow.camera.left = -7; key.shadow.camera.right = 7
    key.shadow.camera.top  =  5; key.shadow.camera.bottom = -5
    key.shadow.bias = -0.001
    scene.add(key)

    // Fill light (cooler blue from left)
    const fill = new THREE.DirectionalLight('#7090c0', 0.8)
    fill.position.set(-8, 3, -3); scene.add(fill)

    // Red accent rim light (HK brand)
    const rim = new THREE.DirectionalLight('#E31E24', 0.35)
    rim.position.set(-4, -3, -8); scene.add(rim)

    // Warm ground bounce
    const bounce = new THREE.DirectionalLight('#c08040', 0.25)
    bounce.position.set(0, -6, 4); scene.add(bounce)

    // ── Ground plane ───────────────────────────────────────────────
    const groundGeo = new THREE.PlaneGeometry(24, 24)
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#0d0e10', metalness: 0.0, roughness: 0.95,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1.0
    ground.receiveShadow = true
    scene.add(ground)

    // Grid overlay (subtle)
    const grid = new THREE.GridHelper(24, 36, '#1a1b1e', '#151618')
    grid.position.y = -0.998
    scene.add(grid)

    // ── Camera ─────────────────────────────────────────────────────
    const w = container.clientWidth || 700
    const h = container.clientHeight || 440
    const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 60)
    camera.position.set(5.0, 2.5, 4.8)
    camera.lookAt(0, 0, 0)

    // ── Renderer ───────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    // ── Build trailer ──────────────────────────────────────────────
    buildTrailer(scene)

    // Collect interactive meshes
    const meshes: THREE.Mesh[] = []
    scene.traverse(o => { if (o instanceof THREE.Mesh && o.userData.sectionTitle) meshes.push(o) })

    // ── OrbitControls ──────────────────────────────────────────────
    let controls: any = null
    import('three/examples/jsm/controls/OrbitControls.js').then(({ OrbitControls }) => {
      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping  = true
      controls.dampingFactor  = 0.055
      controls.autoRotate     = true
      controls.autoRotateSpeed = 0.55
      controls.enableZoom     = true
      controls.minDistance    = 3.5
      controls.maxDistance    = 13
      controls.minPolarAngle  = 0.15
      controls.maxPolarAngle  = Math.PI * 0.78
    })

    // ── Raycasting ─────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const pick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(meshes)
      return hits.length > 0 ? (hits[0].object.userData.sectionTitle as string) : null
    }

    const onMove = (e: MouseEvent) => {
      const s = pick(e)
      if (s === hoveredRef.current) return
      hoveredRef.current = s
      renderer.domElement.style.cursor = s ? 'pointer' : 'grab'
      applyMaterials(scene, s, activeSection?.title ?? null)
    }

    const onClick = (e: MouseEvent) => {
      const title = pick(e)
      if (!title) return
      const sec = sections.find(s => s.title === title)
      if (sec) {
        onSectionSelect(sec)
        if (controls) controls.autoRotate = false
      }
    }

    renderer.domElement.addEventListener('mousemove', onMove)
    renderer.domElement.addEventListener('click', onClick)
    renderer.domElement.style.cursor = 'grab'

    // ── Resize ─────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth, h = container.clientHeight
      camera.aspect = w / h; camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    ro.observe(container)

    // ── Animation loop (with pulse for selected) ───────────────────
    const animate = (time: number) => {
      animRef.current = requestAnimationFrame(animate)
      timeRef.current = time
      controls?.update()

      // Pulse emissive on active section
      const activeTitle = activeSection?.title ?? null  // closure snapshot — updated via ref below
      scene.traverse(o => {
        if (!(o instanceof THREE.Mesh) || !o.userData.sectionTitle) return
        const m = o.material as THREE.MeshStandardMaterial
        const t = o.userData.sectionTitle as string
        if (t === activeTitleRef.current) {
          const pulse = Math.sin(time * 0.003) * 0.12 + 0.28
          m.emissive.set('#E31E24'); m.emissiveIntensity = pulse
        }
      })

      renderer.render(scene, camera)
    }
    animRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
      renderer.domElement.removeEventListener('mousemove', onMove)
      renderer.domElement.removeEventListener('click', onClick)
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      sceneRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep a ref so the animation loop can read current activeSection without stale closure
  const activeTitleRef = useRef<string | null>(null)
  useEffect(() => {
    activeTitleRef.current = activeSection?.title ?? null
    if (!sceneRef.current) return
    applyMaterials(sceneRef.current, hoveredRef.current, activeSection?.title ?? null)
  }, [activeSection])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

// ─── Apply hover / active / idle materials ─────────────────────────
function applyMaterials(scene: THREE.Scene, hovered: string | null, active: string | null) {
  scene.traverse(o => {
    if (!(o instanceof THREE.Mesh) || !o.userData.sectionTitle) return
    const m = o.material as THREE.MeshStandardMaterial
    const t = o.userData.sectionTitle as string

    // Skip lights that always glow
    if (m.emissiveIntensity > 0 && m.color.r > 0.8) return  // tail lights / clearance stay on

    if (t === active) {
      // pulsed in animation loop — just set color here
      m.emissive.set('#E31E24')
    } else if (t === hovered) {
      m.emissive.set('#E31E24'); m.emissiveIntensity = 0.14
    } else {
      m.emissive.set('#000000'); m.emissiveIntensity = 0
    }
  })
}
