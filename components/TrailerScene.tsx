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

  // Shared palette — Hyundai Translead HT aluminum dry-van
  const C = {
    alum:    '#cdd2d8',  // main body aluminum
    alumDk:  '#a8adb3',  // darker aluminum (ribs, headers)
    alumLt:  '#dde0e4',  // lighter panels
    roof:    '#d4d8db',  // roof sheet
    roofCap: '#bfc4c9',  // roof cap/flashing
    steel:   '#353a40',  // dark steel structural
    steelLt: '#4a5058',  // lighter steel
    baseFrame: '#7e9ab0', // base assembly frame — contrasts with dark floor
    under:   '#1e2126',  // underframe dark
    wheelRb: '#111418',  // tire rubber
    rimSil:  '#6a7078',  // wheel rim silver
    rimSpk:  '#8a9098',  // rim spokes
    hubChr:  '#9aa0a8',  // hub chrome
    drumGry: '#3a3f45',  // brake drum
    redLgt:  '#ff1a1a',  // tail lights
    amberLt: '#ff8800',  // clearance/marker lights
    whiteLt: '#e8eef5',  // reverse lights
    accent:  '#E31E24',  // HK red stripe
    accentDk:'#a01218',  // darker red shadow
    skirt:   '#22262c',  // aero skirt
    skirtRb: '#181b1f',  // skirt rubber seal
    door:    '#c8cdd2',  // rear doors
    doorDk:  '#b0b5ba',  // door shadow panel
    hinge:   '#3a4048',  // door hardware
    refAmb:  '#ff9900',  // reflective amber tape
    refWht:  '#e8e8e8',  // reflective white tape
    wood:    '#8B6914',  // floor wood planks
    woodDk:  '#6B4F10',  // wood groove
    kpin:    '#2a2e34',  // king pin / coupler
    rubber:  '#1a1a1a',  // rubber seals / mud flaps
  }

  function tagGroup(g: THREE.Group, title: string) {
    g.userData.sectionTitle = title
    g.traverse(o => { if (o instanceof THREE.Mesh) o.userData.sectionTitle = title })
  }

  // ══════════════════════════════════════════
  // SIDE WALL  (Hyundai Translead HT corrugated aluminum)
  // ══════════════════════════════════════════
  const sideWall = new THREE.Group()

  for (const side of [-1, 1]) {
    const z = side * (HW + 0.012)

    // Main panel sheet — slightly recessed between ribs
    const panel = box(TL, TH, 0.018, mat(C.alum, 0.50, 0.42))
    panel.position.set(0, 0, z)
    sideWall.add(panel)

    // Bottom sill rail (heavy-gauge)
    const sill = box(TL, 0.055, 0.055, mat(C.steel, 0.75, 0.30))
    sill.position.set(0, -TH / 2 + 0.027, z + side * 0.014)
    sideWall.add(sill)

    // Top header rail
    const header = box(TL, 0.048, 0.048, mat(C.alumDk, 0.6, 0.35))
    header.position.set(0, TH / 2 - 0.024, z + side * 0.014)
    sideWall.add(header)

    // Corner posts (front + rear) — heavy aluminum extrusion
    for (const xEnd of [-TL / 2 + 0.018, TL / 2 - 0.018]) {
      const post = box(0.042, TH + 0.01, 0.065, mat(C.alumDk, 0.65, 0.30))
      post.position.set(xEnd, 0, z + side * 0.022)
      sideWall.add(post)
    }

    // Vertical corrugation ribs (20 — Translead dense pattern)
    for (let i = 0; i < 20; i++) {
      const x = -TL / 2 + 0.28 + i * ((TL - 0.56) / 19)
      const rib = box(0.032, TH + 0.008, 0.024, mat(C.alumDk, 0.65, 0.32))
      rib.position.set(x, 0, z + side * 0.016)
      sideWall.add(rib)
    }

    // Clearance marker lights (top, 5 per side — DOT standard)
    for (let i = 0; i < 5; i++) {
      const cx = -TL / 2 + 0.38 + i * ((TL - 0.76) / 4)
      const cl = box(0.048, 0.028, 0.012, mat(C.amberLt, 0.2, 0.5, C.amberLt))
      ;(cl.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.45
      cl.position.set(cx, TH / 2 - 0.032, z + side * 0.022)
      sideWall.add(cl)
    }

    // Rubber door seal strip at rear edge
    const seal = box(0.012, TH, 0.018, mat(C.rubber, 0.15, 0.95))
    seal.position.set(TL / 2 - 0.008, 0, z + side * 0.018)
    sideWall.add(seal)
  }

  // ── "HK" branding on both sides ──────────────────────────────────
  for (const side of [-1, 1]) {
    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 256
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 512, 256)
    // Background panel (white)
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    if (ctx.roundRect) { ctx.roundRect(12, 12, 488, 232, 18) } else { ctx.rect(12, 12, 488, 232) }
    ctx.fill()
    // Red accent bar on left
    ctx.fillStyle = '#E31E24'
    ctx.fillRect(12, 12, 22, 232)
    // "HK" text
    ctx.fillStyle = '#1a1a2e'
    ctx.font = 'bold 178px "Arial Black", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('HK', 276, 132)
    // Thin underline
    ctx.fillStyle = '#E31E24'
    ctx.fillRect(90, 210, 370, 8)

    const tex = new THREE.CanvasTexture(canvas)
    const logoMat = new THREE.MeshStandardMaterial({
      map: tex, transparent: true, metalness: 0.1, roughness: 0.6,
    })
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.36), logoMat)
    logo.position.set(0, TH / 2 - 0.26, side * (HW + 0.028))
    if (side === -1) logo.rotation.y = Math.PI
    logo.userData.sectionTitle = 'Side Wall'
    sideWall.add(logo)
  }

  tagGroup(sideWall, 'Side Wall')
  root.add(sideWall)

  // ══════════════════════════════════════════
  // ROOF ASSEMBLY
  // ══════════════════════════════════════════
  const roofGrp = new THREE.Group()

  // Main roof sheet (slightly crowned — simulated with scale)
  const roofSheet = box(TL + 0.06, 0.038, TW + 0.10, mat(C.roof, 0.40, 0.58))
  roofSheet.position.y = TH / 2 + 0.019
  roofGrp.add(roofSheet)

  // Roof cap / drip flashing
  const cap = box(TL + 0.09, 0.018, TW + 0.13, mat(C.roofCap, 0.6, 0.38))
  cap.position.y = TH / 2 + 0.048
  roofGrp.add(cap)

  // Side drip rails (channels along edges)
  for (const zEdge of [-(TW / 2 + 0.038), (TW / 2 + 0.038)]) {
    const drip = box(TL + 0.08, 0.028, 0.032, mat(C.alumDk, 0.65, 0.35))
    drip.position.set(0, TH / 2 + 0.024, zEdge)
    roofGrp.add(drip)
  }

  // Roof bows — 11 cross supports (Translead has dense bow spacing)
  for (let i = 0; i < 11; i++) {
    const x = -TL / 2 + 0.38 + i * ((TL - 0.76) / 10)
    const bow = box(0.032, 0.022, TW + 0.05, mat(C.steel))
    bow.position.set(x, TH / 2 + 0.005, 0)
    roofGrp.add(bow)
  }

  // Roof vent / exhaust box (front third)
  const ventBase = box(0.38, 0.030, 0.22, mat(C.alumDk, 0.55, 0.45))
  ventBase.position.set(-TL / 2 + 1.1, TH / 2 + 0.048, 0)
  roofGrp.add(ventBase)
  const ventRaise = box(0.28, 0.055, 0.15, mat(C.steel, 0.6, 0.40))
  ventRaise.position.set(-TL / 2 + 1.1, TH / 2 + 0.072, 0)
  roofGrp.add(ventRaise)
  // Vent louver slits
  for (let i = 0; i < 4; i++) {
    const vx = -TL / 2 + 0.98 + i * 0.072
    const louver = box(0.048, 0.008, 0.14, mat(C.under))
    louver.position.set(vx, TH / 2 + 0.082, 0)
    roofGrp.add(louver)
  }

  tagGroup(roofGrp, 'Roof Assembly')
  root.add(roofGrp)

  // ══════════════════════════════════════════
  // FRONT WALL  (nose end — king pin side)
  // ══════════════════════════════════════════
  const frontGrp = new THREE.Group()

  // Main front panel
  const frontMain = box(0.042, TH, TW, mat(C.alumLt, 0.50, 0.44))
  frontMain.position.x = -TL / 2
  frontGrp.add(frontMain)

  // Inner recessed panel
  const frontInner = box(0.018, TH - 0.10, TW - 0.08, mat(C.alum, 0.48, 0.52))
  frontInner.position.x = -TL / 2 - 0.015
  frontGrp.add(frontInner)

  // Corner posts (heavy extrusions)
  for (const zEdge of [-HW + 0.022, HW - 0.022]) {
    const cp = box(0.052, TH, 0.072, mat(C.steel, 0.72, 0.28))
    cp.position.set(-TL / 2 - 0.005, 0, zEdge)
    frontGrp.add(cp)
  }

  // Nose fairing lip (top)
  const fairingTop = box(0.065, 0.038, TW + 0.02, mat(C.alumDk, 0.6, 0.40))
  fairingTop.position.set(-TL / 2 - 0.008, TH / 2 - 0.019, 0)
  frontGrp.add(fairingTop)

  // Vertical structural channels (3)
  for (const z of [-HW + 0.15, 0, HW - 0.15]) {
    const ch = box(0.028, TH - 0.08, 0.052, mat(C.steel))
    ch.position.set(-TL / 2 - 0.012, 0, z)
    frontGrp.add(ch)
  }

  // Horizontal cross-channel (mid-height stiffener)
  const hStiff = box(0.022, 0.045, TW - 0.06, mat(C.alumDk))
  hStiff.position.set(-TL / 2 - 0.008, 0, 0)
  frontGrp.add(hStiff)

  // Top marker lights (amber, 2)
  for (const z of [-HW + 0.07, HW - 0.07]) {
    const ml = box(0.045, 0.035, 0.028, mat(C.amberLt, 0.2, 0.5, C.amberLt))
    ;(ml.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5
    ml.position.set(-TL / 2 - 0.022, TH / 2 - 0.065, z)
    frontGrp.add(ml)
  }

  // King pin coupling plate (bottom front — the 5th wheel interface)
  const kpinPlate = box(0.028, 0.042, 0.55, mat(C.kpin, 0.8, 0.2))
  kpinPlate.position.set(-TL / 2 - 0.002, -TH / 2 + 0.022, 0)
  frontGrp.add(kpinPlate)

  tagGroup(frontGrp, 'Front Wall')
  root.add(frontGrp)

  // ══════════════════════════════════════════
  // REAR FRAME  (swing doors + ICC guard)
  // ══════════════════════════════════════════
  const rearGrp = new THREE.Group()

  // Perimeter door frame
  const rt = box(0.048, 0.065, TW + 0.048, mat(C.steel, 0.78, 0.28))
  rt.position.set(TL / 2, TH / 2 - 0.032, 0); rearGrp.add(rt)
  const rb = box(0.048, 0.065, TW + 0.048, mat(C.steel, 0.78, 0.28))
  rb.position.set(TL / 2, -TH / 2 + 0.032, 0); rearGrp.add(rb)
  for (const z of [-HW - 0.012, HW + 0.012]) {
    const rp = box(0.048, TH, 0.058, mat(C.steel, 0.78, 0.28))
    rp.position.set(TL / 2, 0, z); rearGrp.add(rp)
  }

  // Center door split post
  const split = box(0.040, TH, 0.044, mat(C.steel))
  split.position.set(TL / 2, 0, 0); rearGrp.add(split)

  // Door panels (2) with upper + lower stiffeners
  for (const [zSide, zOff] of [[-1, -HW / 2], [1, HW / 2]] as [number, number][]) {
    // Main door skin
    const door = box(0.022, TH - 0.14, HW - 0.068, mat(C.door, 0.42, 0.52))
    door.position.set(TL / 2 + 0.022, 0, zOff); rearGrp.add(door)

    // Inner door panel (recessed darker)
    const doorInner = box(0.012, TH - 0.22, HW - 0.16, mat(C.doorDk, 0.38, 0.58))
    doorInner.position.set(TL / 2 + 0.028, 0, zOff); rearGrp.add(doorInner)

    // Upper stiffener
    const stiffTop = box(0.020, 0.048, HW - 0.082, mat(C.alumDk))
    stiffTop.position.set(TL / 2 + 0.026, TH / 2 - 0.12, zOff); rearGrp.add(stiffTop)

    // Mid stiffener
    const stiffMid = box(0.018, 0.038, HW - 0.082, mat(C.alumDk))
    stiffMid.position.set(TL / 2 + 0.026, 0, zOff); rearGrp.add(stiffMid)

    // Lower stiffener
    const stiffBot = box(0.020, 0.048, HW - 0.082, mat(C.alumDk))
    stiffBot.position.set(TL / 2 + 0.026, -TH / 2 + 0.12, zOff); rearGrp.add(stiffBot)

    // Hinges (4 per door — heavy-duty)
    for (const yOff of [-TH / 2 + 0.12, -0.16, 0.16, TH / 2 - 0.12]) {
      const hinge = box(0.058, 0.055, 0.042, mat(C.hinge, 0.72, 0.28))
      hinge.position.set(TL / 2 + 0.058, yOff, zOff + zSide * (HW / 2 - 0.072))
      rearGrp.add(hinge)
      // Hinge bolt detail
      const bolt = box(0.065, 0.012, 0.012, mat(C.steelLt, 0.8, 0.2))
      bolt.position.set(TL / 2 + 0.062, yOff, zOff + zSide * (HW / 2 - 0.072))
      rearGrp.add(bolt)
    }

    // Cam lock bar (full height)
    const lock = box(0.024, TH - 0.22, 0.024, mat(C.hinge, 0.7, 0.3))
    lock.position.set(TL / 2 + 0.044, 0, zOff + zSide * 0.038); rearGrp.add(lock)

    // Lock cam handles (top + bottom)
    for (const yLock of [TH / 2 - 0.18, -TH / 2 + 0.18]) {
      const cam = box(0.045, 0.045, 0.062, mat(C.steelLt, 0.78, 0.22))
      cam.position.set(TL / 2 + 0.065, yLock, zOff + zSide * 0.038); rearGrp.add(cam)
    }

    // Reflective amber tape strips (DOT — 2 per door)
    for (const yRef of [-TH / 2 + 0.18, TH / 2 - 0.18]) {
      const tape = box(0.006, 0.028, HW - 0.14, mat(C.refAmb, 0.15, 0.6, C.refAmb))
      ;(tape.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.25
      tape.position.set(TL / 2 + 0.032, yRef, zOff); rearGrp.add(tape)
    }
  }

  // ICC underride guard (steel bar + braces)
  const icc = box(0.068, 0.085, TW - 0.04, mat(C.steel, 0.72, 0.28))
  icc.position.set(TL / 2 + 0.028, -TH / 2 + 0.058, 0); rearGrp.add(icc)
  // ICC mounting brackets
  for (const z of [-TW / 2 + 0.12, TW / 2 - 0.12]) {
    const brkt = box(0.055, 0.18, 0.038, mat(C.steel))
    brkt.position.set(TL / 2 + 0.022, -TH / 2 + 0.12, z); rearGrp.add(brkt)
  }

  // Tail lights — 3 per side (stop/turn/tail + backup)
  for (const side of [-1, 1]) {
    const zBase = side * (HW - 0.08)
    // Red cluster (3 stacked)
    for (let i = 0; i < 3; i++) {
      const tl = box(0.040, 0.065, 0.095, mat(C.redLgt, 0.2, 0.5, C.redLgt))
      ;(tl.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.65
      tl.position.set(TL / 2 + 0.012, -TH / 2 + 0.09 + i * 0.092, zBase)
      rearGrp.add(tl)
    }
    // White reverse light
    const rev = box(0.038, 0.052, 0.072, mat(C.whiteLt, 0.15, 0.55, C.whiteLt))
    ;(rev.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2
    rev.position.set(TL / 2 + 0.012, -TH / 2 + 0.34, zBase)
    rearGrp.add(rev)
    // Light housing bezel
    const bezel = box(0.045, 0.32, 0.115, mat(C.hinge, 0.5, 0.4))
    bezel.position.set(TL / 2 + 0.008, -TH / 2 + 0.21, zBase)
    rearGrp.add(bezel)
  }

  tagGroup(rearGrp, 'Rear Frame')
  root.add(rearGrp)

  // ══════════════════════════════════════════
  // BASE ASSEMBLY + LANDING GEAR
  // ══════════════════════════════════════════
  const baseGrp = new THREE.Group()

  // Main floor deck (wood plank floor — Translead uses hardwood)
  const floorDeck = box(TL - 0.04, 0.055, TW - 0.06, mat(C.wood, 0.1, 0.82))
  floorDeck.position.y = -TH / 2 + 0.010; baseGrp.add(floorDeck)

  // Floor plank grooves (8 dark seams)
  for (let i = 0; i < 8; i++) {
    const zGroove = -TW / 2 + 0.1 + i * ((TW - 0.2) / 7)
    const groove = box(TL - 0.06, 0.057, 0.006, mat(C.woodDk, 0.1, 0.9))
    groove.position.set(0, -TH / 2 + 0.010, zGroove); baseGrp.add(groove)
  }

  // Long side rails (C-channel steel)
  for (const z of [-HW + 0.042, HW - 0.042]) {
    const rail = box(TL, 0.062, 0.062, mat(C.baseFrame, 0.65, 0.35))
    rail.position.set(0, -TH / 2 + 0.006, z); baseGrp.add(rail)
  }

  // Cross members (12 — Translead dense pattern)
  for (let i = 0; i < 12; i++) {
    const x = -TL / 2 + 0.35 + i * ((TL - 0.70) / 11)
    const xm = box(0.048, 0.055, TW - 0.095, mat(C.baseFrame, 0.62, 0.38))
    xm.position.set(x, -TH / 2 - 0.018, 0); baseGrp.add(xm)
  }

  // King pin assembly (bottom front center)
  const kpinMount = box(0.22, 0.048, 0.55, mat(C.kpin, 0.85, 0.18))
  kpinMount.position.set(-TL / 2 + 0.12, -TH / 2 - 0.002, 0); baseGrp.add(kpinMount)
  const kpin = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.065, 16), mat(C.kpin, 0.9, 0.15))
  kpin.position.set(-TL / 2 + 0.14, -TH / 2 - 0.042, 0); baseGrp.add(kpin)

  // ── Landing gear (Jost-style cranked legs) ──
  const lgX = -TL / 2 + 0.90
  for (const z of [-0.24, 0.24]) {
    // Outer leg tube
    const tube = box(0.065, 0.60, 0.065, mat(C.baseFrame, 0.68, 0.30))
    tube.position.set(lgX, -TH / 2 - 0.305, z); baseGrp.add(tube)

    // Inner leg (slides inside outer)
    const inner = box(0.045, 0.30, 0.045, mat(C.steelLt, 0.68, 0.32))
    inner.position.set(lgX, -TH / 2 - 0.50, z); baseGrp.add(inner)

    // Gearbox housing
    const gearbox = box(0.095, 0.085, 0.095, mat(C.steel, 0.75, 0.25))
    gearbox.position.set(lgX, -TH / 2 - 0.18, z); baseGrp.add(gearbox)

    // Crank handle (extends from gearbox)
    const crankShaft = box(0.015, 0.015, 0.18, mat(C.steelLt, 0.8, 0.2))
    crankShaft.position.set(lgX, -TH / 2 - 0.18, z + 0.14); baseGrp.add(crankShaft)
    const crankKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.038, 10), mat(C.steelLt, 0.8, 0.2))
    crankKnob.rotation.x = Math.PI / 2
    crankKnob.position.set(lgX, -TH / 2 - 0.18, z + 0.232); baseGrp.add(crankKnob)

    // X-brace reinforcement
    for (const angle of [0.52, -0.52]) {
      const brGeo = new THREE.BoxGeometry(0.042, 0.38, 0.042)
      const br = new THREE.Mesh(brGeo, mat(C.steelLt))
      br.position.set(lgX + 0.10, -TH / 2 - 0.36, z)
      br.rotation.z = angle; baseGrp.add(br)
    }

    // Foot pad (wide base plate)
    const foot = box(0.20, 0.032, 0.20, mat(C.steel, 0.75, 0.28))
    foot.position.set(lgX, -TH / 2 - 0.618, z); baseGrp.add(foot)
  }

  // Horizontal cross-brace connecting legs
  const lgBar = box(0.040, 0.040, 0.48, mat(C.steel))
  lgBar.position.set(lgX, -TH / 2 - 0.42, 0); baseGrp.add(lgBar)

  // Aero skirt panels (both sides — longer coverage)
  for (const side of [-1, 1]) {
    const z = side * (HW + 0.014)
    const sk = box(TL * 0.65, 0.22, 0.020, mat(C.skirt, 0.30, 0.70))
    sk.position.set(-TL / 2 + TL * 0.325 + 0.10, -TH / 2 - 0.165, z + side * 0.006)
    baseGrp.add(sk)

    // Skirt rubber bottom seal
    const seal = box(TL * 0.65, 0.018, 0.018, mat(C.skirtRb, 0.12, 0.95))
    seal.position.set(-TL / 2 + TL * 0.325 + 0.10, -TH / 2 - 0.278, z + side * 0.006)
    baseGrp.add(seal)

    // Skirt mounting brackets (every ~0.7m)
    for (let i = 0; i < 5; i++) {
      const bx = -TL / 2 + 0.50 + i * (TL * 0.65 / 4)
      const brkt = box(0.018, 0.058, 0.032, mat(C.steelLt))
      brkt.position.set(bx, -TH / 2 - 0.062, z + side * 0.018); baseGrp.add(brkt)
    }
  }

  tagGroup(baseGrp, 'Base Assembly and Landing Gear')
  root.add(baseGrp)

  // ══════════════════════════════════════════
  // AXLE END — tandem axles + dual Michelin tires
  // ══════════════════════════════════════════
  const axleGrp = new THREE.Group()
  const AY = -TH / 2 - 0.435

  for (const axX of [TL / 2 - 0.65, TL / 2 - 1.12]) {
    // Axle beam (I-beam style)
    const beam = box(0.080, 0.068, TW + 0.65, mat(C.steel, 0.72, 0.28))
    beam.position.set(axX, AY + 0.068, 0); axleGrp.add(beam)

    // Air ride suspension bag
    for (const z of [-(HW + 0.095), (HW + 0.095)]) {
      const bag = box(0.14, 0.12, 0.14, mat('#1e2830', 0.18, 0.88))
      bag.position.set(axX, AY + 0.18, z); axleGrp.add(bag)

      // Upper air bag mount plate
      const plate = box(0.16, 0.025, 0.16, mat(C.steel, 0.75, 0.25))
      plate.position.set(axX, AY + 0.248, z); axleGrp.add(plate)
    }

    // Brake chamber (S-cam drum brakes)
    for (const z of [-(HW + 0.05), (HW + 0.05)]) {
      const chamber = box(0.075, 0.075, 0.095, mat('#2a2e34', 0.35, 0.65))
      chamber.position.set(axX - 0.08, AY + 0.11, z); axleGrp.add(chamber)
    }

    // 4 wheels per axle (dual rear — Michelin 295/75R22.5)
    for (const side of [-1, 1]) {
      for (const offset of [0.068, 0.196]) {
        const wz = side * (HW + 0.148 + offset)

        // Tire carcass (black rubber)
        const tireGeo = new THREE.CylinderGeometry(0.228, 0.228, 0.108, 32)
        const tire = new THREE.Mesh(tireGeo, mat(C.wheelRb, 0.12, 0.97))
        tire.rotation.x = Math.PI / 2
        tire.position.set(axX, AY, wz); axleGrp.add(tire)

        // Michelin-style sidewall shoulder rings (3 rings)
        for (const rr of [0.188, 0.205, 0.218]) {
          const treadGeo = new THREE.TorusGeometry(rr, 0.007, 8, 32)
          const tread = new THREE.Mesh(treadGeo, mat('#1c1c1c', 0.1, 0.98))
          tread.position.set(axX, AY, wz); axleGrp.add(tread)
        }

        // Sidewall lettering band (lighter gray ring)
        const lwGeo = new THREE.TorusGeometry(0.196, 0.012, 6, 32)
        const lw = new THREE.Mesh(lwGeo, mat('#2a2a2a', 0.12, 0.95))
        lw.position.set(axX, AY, wz); axleGrp.add(lw)

        // Brake drum (behind rim)
        const drumGeo = new THREE.CylinderGeometry(0.168, 0.168, 0.095, 20)
        const drum = new THREE.Mesh(drumGeo, mat(C.drumGry, 0.55, 0.55))
        drum.rotation.x = Math.PI / 2
        drum.position.set(axX, AY, wz); axleGrp.add(drum)

        // Rim — steel disc wheel (heavy duty)
        const rimGeo = new THREE.CylinderGeometry(0.152, 0.152, 0.115, 20)
        const rim = new THREE.Mesh(rimGeo, mat(C.rimSil, 0.72, 0.28))
        rim.rotation.x = Math.PI / 2
        rim.position.set(axX, AY, wz); axleGrp.add(rim)

        // Rim spokes (8 slots)
        for (let sp = 0; sp < 8; sp++) {
          const angle = (sp / 8) * Math.PI * 2
          const sx = axX + Math.cos(angle) * 0.09
          const sy = AY + Math.sin(angle) * 0.09
          const spoke = box(0.028, 0.028, 0.116, mat(C.rimSpk, 0.7, 0.3))
          spoke.position.set(sx, sy, wz); axleGrp.add(spoke)
        }

        // Hub cap (chrome, center)
        const hubGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.118, 12)
        const hub = new THREE.Mesh(hubGeo, mat(C.hubChr, 0.88, 0.12))
        hub.rotation.x = Math.PI / 2
        hub.position.set(axX, AY, wz); axleGrp.add(hub)

        // Hub cap bolt circle
        for (let b = 0; b < 8; b++) {
          const ba = (b / 8) * Math.PI * 2
          const bx = axX + Math.cos(ba) * 0.042
          const by = AY + Math.sin(ba) * 0.042
          const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6), mat(C.steelLt, 0.85, 0.15))
          bolt.rotation.x = Math.PI / 2
          bolt.position.set(bx, by, wz); axleGrp.add(bolt)
        }
      }
    }

    // Mudflap (full-width, thick rubber)
    const flap = box(0.022, 0.32, TW + 0.55, mat(C.rubber, 0.1, 0.97))
    flap.position.set(axX + 0.16, AY - 0.01, 0); axleGrp.add(flap)

    // Mudflap hanger bracket
    const hanger = box(0.040, 0.038, TW + 0.54, mat(C.steel))
    hanger.position.set(axX + 0.14, AY + 0.16, 0); axleGrp.add(hanger)
  }

  // Axle torque rod (connecting axle to frame)
  for (const axX of [TL / 2 - 0.65, TL / 2 - 1.12]) {
    for (const z of [-(HW - 0.08), (HW - 0.08)]) {
      const rod = box(0.28, 0.028, 0.028, mat(C.steelLt, 0.7, 0.3))
      rod.position.set(axX - 0.14, AY + 0.14, z); axleGrp.add(rod)
    }
  }

  tagGroup(axleGrp, 'Axle End')
  root.add(axleGrp)

  // ── Structural core (non-interactive interior volume) ─────────────
  const core = box(TL - 0.06, TH - 0.05, TW - 0.05, mat(C.alum, 0.40, 0.55))
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
