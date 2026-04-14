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

// ─── Specialised material helpers ─────────────────────────────────
// Aluminum mill finish: 6000-series extrusion — bright silver, anisotropic
function millMat(shade = '#b6bcc2') {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(shade), metalness: 1.0, roughness: 0.20,
    envMapIntensity: 1.2,
  })
}
// PVC white finish: clean white, low metalness, slight gloss
function pvcMat(shade = '#f0f0ee') {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(shade), metalness: 0.0, roughness: 0.28,
  })
}
// Roof aluminium grey: corrugated aluminium sheet
function roofMat(shade = '#7e858c') {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(shade), metalness: 0.88, roughness: 0.42,
  })
}
// Dark structural steel: cross members, underbody
function darkMat(shade = '#1c2028') {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(shade), metalness: 0.85, roughness: 0.65,
  })
}

// ─── Build full trailer ────────────────────────────────────────────
function buildTrailer(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.position.y = 0.55

  // ── Palette ────────────────────────────────────────────────────────
  const C = {
    // Body — PVC white panels / aluminum mill rails
    pvcWhite:  '#efefed',   // PVC white side wall panels
    pvcLt:     '#f4f4f2',   // slightly lighter PVC (front panel)
    millAlum:  '#b4babe',   // aluminum mill extrusions (rails, corners)
    millAlumDk:'#9ea4aa',   // darker mill (ribs, secondary extrusions)
    roofGrey:  '#7e858c',   // roof aluminium grey sheet
    roofCap:   '#6c7278',   // roof cap/drip flashing (darker)

    // Structure
    steel:     '#1c2028',   // dark structural steel
    steelLt:   '#2e353d',   // lighter structural steel
    crossMbr:  '#181e25',   // cross members — near black
    under:     '#161b20',   // underframe dark

    // Wheels / suspension
    wheelRb:   '#1a1e24',   // tire rubber
    rimSil:    '#707880',   // wheel rim silver
    rimSpk:    '#8890a0',   // rim spokes
    hubChr:    '#a4aeb6',   // hub chrome
    drumGry:   '#282e34',   // brake drum grey

    // Lights
    redLgt:    '#ff1a1a',
    amberLt:   '#ff8800',
    whiteLt:   '#e8eef5',

    // Brand
    accent:    '#E31E24',
    accentDk:  '#a01218',

    // Skirt — now white (client spec)
    skirt:     '#efefed',   // white aero skirt
    skirtRb:   '#d0d0ce',   // light grey rubber bottom seal

    // Rear doors — whitish
    door:      '#e8ecf0',
    doorDk:    '#d2d8dc',
    hinge:     '#262e38',

    // Reflective tape
    refAmb:    '#ff9900',
    refWht:    '#e8e8e8',

    // Floor
    wood:      '#8B6914',
    woodDk:    '#6B4F10',

    // Other
    kpin:      '#252a30',
    rubber:    '#181818',
    airBag:    '#1c2830',   // air suspension bag
    shockBody: '#28303e',
  }

  function tagGroup(g: THREE.Group, title: string) {
    g.userData.sectionTitle = title
    g.traverse(o => { if (o instanceof THREE.Mesh) o.userData.sectionTitle = title })
  }

  // ══════════════════════════════════════════
  // SIDE WALL  (PVC white panels + aluminum mill rails)
  // ══════════════════════════════════════════
  const sideWall = new THREE.Group()

  for (const side of [-1, 1]) {
    const z = side * (HW + 0.012)

    // Main panel sheet — PVC white, smooth and clean
    const panel = box(TL, TH, 0.018, pvcMat(C.pvcWhite))
    panel.position.set(0, 0, z)
    sideWall.add(panel)

    // Bottom sill rail — aluminum mill extrusion (heavy-gauge L-section)
    const sill = box(TL, 0.055, 0.055, millMat(C.millAlum))
    sill.position.set(0, -TH / 2 + 0.027, z + side * 0.014)
    sideWall.add(sill)

    // Top header rail — aluminum mill extrusion
    const header = box(TL, 0.048, 0.048, millMat(C.millAlum))
    header.position.set(0, TH / 2 - 0.024, z + side * 0.014)
    sideWall.add(header)

    // Corner posts (front + rear) — heavy aluminum mill extrusion
    for (const xEnd of [-TL / 2 + 0.018, TL / 2 - 0.018]) {
      const post = box(0.042, TH + 0.01, 0.065, millMat(C.millAlum))
      post.position.set(xEnd, 0, z + side * 0.022)
      sideWall.add(post)
    }

    // Vertical corrugation ribs (20 — Translead dense pattern)
    for (let i = 0; i < 20; i++) {
      const x = -TL / 2 + 0.28 + i * ((TL - 0.56) / 19)
      const rib = box(0.032, TH + 0.008, 0.020, millMat(C.millAlumDk))
      rib.position.set(x, 0, z + side * 0.015)
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
    canvas.width = 1024; canvas.height = 512
    const ctx = canvas.getContext('2d')!
    // Explicitly clear to transparent (browsers default canvas to opaque white)
    ctx.clearRect(0, 0, 1024, 512)
    ctx.fillStyle = '#0d1320'
    ctx.font = '900 200px "Arial Black", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('HK', 512, 256)

    const tex = new THREE.CanvasTexture(canvas)
    // Disable mipmaps — prevents blurring/transparency bleed at zoom-out
    tex.generateMipmaps = false
    tex.minFilter = THREE.LinearFilter
    const logoMat = new THREE.MeshStandardMaterial({
      map: tex, metalness: 0.02, roughness: 0.55,
      transparent: true, alphaTest: 0.1,
    })
    // Plane 2:1 ratio matching canvas, centered on trailer wall
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.70), logoMat)
    logo.position.set(0, 0, side * (HW + 0.052))
    if (side === -1) logo.rotation.y = Math.PI
    logo.renderOrder = 1
    logo.userData.sectionTitle = 'Side Wall'
    sideWall.add(logo)
  }

  tagGroup(sideWall, 'Side Wall')
  root.add(sideWall)

  // ══════════════════════════════════════════
  // ROOF ASSEMBLY  (aluminium grey mill finish)
  // ══════════════════════════════════════════
  const roofGrp = new THREE.Group()

  // Main roof sheet — aluminium grey
  const roofSheet = box(TL + 0.06, 0.038, TW + 0.10, roofMat(C.roofGrey))
  roofSheet.position.y = TH / 2 + 0.019
  roofGrp.add(roofSheet)

  // Roof cap / drip flashing — darker aluminium grey
  const cap = box(TL + 0.09, 0.018, TW + 0.13, roofMat(C.roofCap))
  cap.position.y = TH / 2 + 0.048
  roofGrp.add(cap)

  // Side drip rails (aluminum mill channels along edges)
  for (const zEdge of [-(TW / 2 + 0.038), (TW / 2 + 0.038)]) {
    const drip = box(TL + 0.08, 0.028, 0.032, millMat(C.millAlumDk))
    drip.position.set(0, TH / 2 + 0.024, zEdge)
    roofGrp.add(drip)
  }

  // Roof bows — 11 cross supports (steel, dark)
  for (let i = 0; i < 11; i++) {
    const x = -TL / 2 + 0.38 + i * ((TL - 0.76) / 10)
    const bow = box(0.032, 0.022, TW + 0.05, darkMat(C.steel))
    bow.position.set(x, TH / 2 + 0.005, 0)
    roofGrp.add(bow)
  }

  // Roof vent / exhaust box (front third)
  const ventBase = box(0.38, 0.030, 0.22, roofMat(C.roofCap))
  ventBase.position.set(-TL / 2 + 1.1, TH / 2 + 0.048, 0)
  roofGrp.add(ventBase)
  const ventRaise = box(0.28, 0.055, 0.15, darkMat(C.steel))
  ventRaise.position.set(-TL / 2 + 1.1, TH / 2 + 0.072, 0)
  roofGrp.add(ventRaise)
  for (let i = 0; i < 4; i++) {
    const vx = -TL / 2 + 0.98 + i * 0.072
    const louver = box(0.048, 0.008, 0.14, darkMat(C.under))
    louver.position.set(vx, TH / 2 + 0.082, 0)
    roofGrp.add(louver)
  }

  tagGroup(roofGrp, 'Roof Assembly')
  root.add(roofGrp)

  // ══════════════════════════════════════════
  // FRONT WALL  (nose end — king pin side)
  // Nose rail + radius corners use aluminum mill (consistent with side rails)
  // ══════════════════════════════════════════
  const frontGrp = new THREE.Group()

  // Main front panel — PVC white
  const frontMain = box(0.042, TH, TW, pvcMat(C.pvcLt))
  frontMain.position.x = -TL / 2
  frontGrp.add(frontMain)

  // Inner recessed panel
  const frontInner = box(0.018, TH - 0.10, TW - 0.08, pvcMat(C.pvcWhite))
  frontInner.position.x = -TL / 2 - 0.015
  frontGrp.add(frontInner)

  // Corner posts — aluminum mill extrusion (radius corners, consistent with side)
  for (const zEdge of [-HW + 0.022, HW - 0.022]) {
    const cp = box(0.052, TH, 0.072, millMat(C.millAlum))
    cp.position.set(-TL / 2 - 0.005, 0, zEdge)
    frontGrp.add(cp)
  }

  // Nose fairing lip (top) — aluminum mill
  const fairingTop = box(0.065, 0.038, TW + 0.02, millMat(C.millAlumDk))
  fairingTop.position.set(-TL / 2 - 0.008, TH / 2 - 0.019, 0)
  frontGrp.add(fairingTop)

  // Nose bottom rail — aluminum mill
  const noseBot = box(0.065, 0.035, TW + 0.02, millMat(C.millAlum))
  noseBot.position.set(-TL / 2 - 0.008, -TH / 2 + 0.018, 0)
  frontGrp.add(noseBot)

  // Vertical structural channels (3) — dark steel
  for (const z of [-HW + 0.15, 0, HW - 0.15]) {
    const ch = box(0.028, TH - 0.08, 0.052, darkMat(C.steel))
    ch.position.set(-TL / 2 - 0.012, 0, z)
    frontGrp.add(ch)
  }

  // Horizontal cross-channel stiffener
  const hStiff = box(0.022, 0.045, TW - 0.06, millMat(C.millAlumDk))
  hStiff.position.set(-TL / 2 - 0.008, 0, 0)
  frontGrp.add(hStiff)

  // Top marker lights (amber, 2)
  for (const z of [-HW + 0.07, HW - 0.07]) {
    const ml = box(0.045, 0.035, 0.028, mat(C.amberLt, 0.2, 0.5, C.amberLt))
    ;(ml.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5
    ml.position.set(-TL / 2 - 0.022, TH / 2 - 0.065, z)
    frontGrp.add(ml)
  }

  // King pin coupling plate
  const kpinPlate = box(0.028, 0.042, 0.55, mat(C.kpin, 0.8, 0.2))
  kpinPlate.position.set(-TL / 2 - 0.002, -TH / 2 + 0.022, 0)
  frontGrp.add(kpinPlate)

  tagGroup(frontGrp, 'Front Wall')
  root.add(frontGrp)

  // ══════════════════════════════════════════
  // REAR FRAME  (swing doors + robust ICC rear bumper)
  // ══════════════════════════════════════════
  const rearGrp = new THREE.Group()

  // Perimeter door frame — aluminum mill
  const rt = box(0.048, 0.065, TW + 0.048, millMat(C.millAlum))
  rt.position.set(TL / 2, TH / 2 - 0.032, 0); rearGrp.add(rt)
  const rb = box(0.048, 0.065, TW + 0.048, millMat(C.millAlum))
  rb.position.set(TL / 2, -TH / 2 + 0.032, 0); rearGrp.add(rb)
  for (const z of [-HW - 0.012, HW + 0.012]) {
    const rp = box(0.048, TH, 0.058, millMat(C.millAlum))
    rp.position.set(TL / 2, 0, z); rearGrp.add(rp)
  }

  // Center door split post — aluminum mill
  const split = box(0.040, TH, 0.044, millMat(C.millAlumDk))
  split.position.set(TL / 2, 0, 0); rearGrp.add(split)

  // Door panels (2) — whitish
  for (const [zSide, zOff] of [[-1, -HW / 2], [1, HW / 2]] as [number, number][]) {
    const door = box(0.022, TH - 0.14, HW - 0.068, pvcMat(C.door))
    door.position.set(TL / 2 + 0.022, 0, zOff); rearGrp.add(door)

    const doorInner = box(0.012, TH - 0.22, HW - 0.16, pvcMat(C.doorDk))
    doorInner.position.set(TL / 2 + 0.028, 0, zOff); rearGrp.add(doorInner)

    // Stiffeners — aluminum mill
    const stiffTop = box(0.020, 0.048, HW - 0.082, millMat(C.millAlumDk))
    stiffTop.position.set(TL / 2 + 0.026, TH / 2 - 0.12, zOff); rearGrp.add(stiffTop)
    const stiffMid = box(0.018, 0.038, HW - 0.082, millMat(C.millAlumDk))
    stiffMid.position.set(TL / 2 + 0.026, 0, zOff); rearGrp.add(stiffMid)
    const stiffBot = box(0.020, 0.048, HW - 0.082, millMat(C.millAlumDk))
    stiffBot.position.set(TL / 2 + 0.026, -TH / 2 + 0.12, zOff); rearGrp.add(stiffBot)

    // Hinges (4 per door)
    for (const yOff of [-TH / 2 + 0.12, -0.16, 0.16, TH / 2 - 0.12]) {
      const hinge = box(0.058, 0.055, 0.042, mat(C.hinge, 0.72, 0.28))
      hinge.position.set(TL / 2 + 0.058, yOff, zOff + zSide * (HW / 2 - 0.072))
      rearGrp.add(hinge)
      const bolt = box(0.065, 0.012, 0.012, mat(C.steelLt, 0.8, 0.2))
      bolt.position.set(TL / 2 + 0.062, yOff, zOff + zSide * (HW / 2 - 0.072))
      rearGrp.add(bolt)
    }

    // Cam lock bar
    const lock = box(0.024, TH - 0.22, 0.024, mat(C.hinge, 0.7, 0.3))
    lock.position.set(TL / 2 + 0.044, 0, zOff + zSide * 0.038); rearGrp.add(lock)
    for (const yLock of [TH / 2 - 0.18, -TH / 2 + 0.18]) {
      const cam = box(0.045, 0.045, 0.062, mat(C.steelLt, 0.78, 0.22))
      cam.position.set(TL / 2 + 0.065, yLock, zOff + zSide * 0.038); rearGrp.add(cam)
    }

    // Reflective amber tape strips (DOT)
    for (const yRef of [-TH / 2 + 0.18, TH / 2 - 0.18]) {
      const tape = box(0.006, 0.028, HW - 0.14, mat(C.refAmb, 0.15, 0.6, C.refAmb))
      ;(tape.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.25
      tape.position.set(TL / 2 + 0.032, yRef, zOff); rearGrp.add(tape)
    }
  }

  // ── ICC / DOT Rear Underride Guard (proper 100x120mm RHS + drop legs) ─────
  // Main horizontal cross-tube (100mm x 120mm rectangular hollow section)
  const iccBar = box(0.10, 0.12, TW - 0.02, darkMat(C.steel))
  iccBar.position.set(TL / 2 + 0.055, -TH / 2 + 0.065, 0); rearGrp.add(iccBar)

  // Drop legs — heavy 80x80mm SHS from frame to bar (2 legs)
  for (const z of [-TW / 2 + 0.14, TW / 2 - 0.14]) {
    // Drop leg body
    const leg = box(0.080, 0.30, 0.080, darkMat(C.steel))
    leg.position.set(TL / 2 + 0.050, -TH / 2 + 0.22, z); rearGrp.add(leg)
    // Upper mount plate welded to frame
    const mntTop = box(0.12, 0.025, 0.10, darkMat(C.steel))
    mntTop.position.set(TL / 2 + 0.045, -TH / 2 + 0.38, z); rearGrp.add(mntTop)
    // Gusset triangles (visual reinforcement)
    const gusset = box(0.08, 0.12, 0.025, darkMat(C.steelLt))
    gusset.rotation.z = 0.5
    gusset.position.set(TL / 2 + 0.042, -TH / 2 + 0.30, z + 0.05); rearGrp.add(gusset)
  }

  // DOT reflective white tape on bumper face
  const bumperTape = box(0.008, 0.032, TW - 0.06, mat(C.refWht, 0.1, 0.5, C.refWht))
  ;(bumperTape.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.15
  bumperTape.position.set(TL / 2 + 0.108, -TH / 2 + 0.065, 0); rearGrp.add(bumperTape)

  // Tail lights — 3 per side
  for (const side of [-1, 1]) {
    const zBase = side * (HW - 0.08)
    for (let i = 0; i < 3; i++) {
      const tl = box(0.040, 0.065, 0.095, mat(C.redLgt, 0.2, 0.5, C.redLgt))
      ;(tl.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.65
      tl.position.set(TL / 2 + 0.012, -TH / 2 + 0.09 + i * 0.092, zBase)
      rearGrp.add(tl)
    }
    const rev = box(0.038, 0.052, 0.072, mat(C.whiteLt, 0.15, 0.55, C.whiteLt))
    ;(rev.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2
    rev.position.set(TL / 2 + 0.012, -TH / 2 + 0.34, zBase)
    rearGrp.add(rev)
    const bezel = box(0.045, 0.32, 0.115, mat(C.hinge, 0.5, 0.4))
    bezel.position.set(TL / 2 + 0.008, -TH / 2 + 0.21, zBase)
    rearGrp.add(bezel)
  }

  tagGroup(rearGrp, 'Rear Frame')
  root.add(rearGrp)

  // ══════════════════════════════════════════
  // BASE ASSEMBLY + LANDING GEAR + WHITE SKIRT
  // ══════════════════════════════════════════
  const baseGrp = new THREE.Group()

  // Main floor deck (hardwood — kept as wood finish per spec)
  const floorDeck = box(TL - 0.04, 0.055, TW - 0.06, mat(C.wood, 0.1, 0.82))
  floorDeck.position.y = -TH / 2 + 0.010; baseGrp.add(floorDeck)

  // Floor plank grooves (8 dark seams)
  for (let i = 0; i < 8; i++) {
    const zGroove = -TW / 2 + 0.1 + i * ((TW - 0.2) / 7)
    const groove = box(TL - 0.06, 0.057, 0.006, mat(C.woodDk, 0.1, 0.9))
    groove.position.set(0, -TH / 2 + 0.010, zGroove); baseGrp.add(groove)
  }

  // Long side rails (C-channel) — dark steel per spec
  for (const z of [-HW + 0.042, HW - 0.042]) {
    const rail = box(TL, 0.062, 0.062, darkMat(C.crossMbr))
    rail.position.set(0, -TH / 2 + 0.006, z); baseGrp.add(rail)
  }

  // Cross members (12) — grey/black per spec
  for (let i = 0; i < 12; i++) {
    const x = -TL / 2 + 0.35 + i * ((TL - 0.70) / 11)
    const xm = box(0.048, 0.055, TW - 0.095, darkMat(C.crossMbr))
    xm.position.set(x, -TH / 2 - 0.018, 0); baseGrp.add(xm)
  }

  // King pin assembly
  const kpinMount = box(0.22, 0.048, 0.55, mat(C.kpin, 0.85, 0.18))
  kpinMount.position.set(-TL / 2 + 0.12, -TH / 2 - 0.002, 0); baseGrp.add(kpinMount)
  const kpin = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.065, 16), mat(C.kpin, 0.9, 0.15))
  kpin.position.set(-TL / 2 + 0.14, -TH / 2 - 0.042, 0); baseGrp.add(kpin)

  // ── Landing gear (Jost-style cranked legs) ──────────────────────
  const lgX = -TL / 2 + 0.90   // front bias (~1.70m from front)
  for (const z of [-0.24, 0.24]) {
    const tube = box(0.065, 0.60, 0.065, darkMat(C.steel))
    tube.position.set(lgX, -TH / 2 - 0.305, z); baseGrp.add(tube)

    const inner = box(0.045, 0.30, 0.045, mat(C.steelLt, 0.68, 0.32))
    inner.position.set(lgX, -TH / 2 - 0.50, z); baseGrp.add(inner)

    const gearbox = box(0.095, 0.085, 0.095, darkMat(C.steel))
    gearbox.position.set(lgX, -TH / 2 - 0.18, z); baseGrp.add(gearbox)

    const crankShaft = box(0.015, 0.015, 0.18, mat(C.steelLt, 0.8, 0.2))
    crankShaft.position.set(lgX, -TH / 2 - 0.18, z + 0.14); baseGrp.add(crankShaft)
    const crankKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.038, 10), mat(C.steelLt, 0.8, 0.2))
    crankKnob.rotation.x = Math.PI / 2
    crankKnob.position.set(lgX, -TH / 2 - 0.18, z + 0.232); baseGrp.add(crankKnob)

    for (const angle of [0.52, -0.52]) {
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.38, 0.042), mat(C.steelLt))
      br.position.set(lgX + 0.10, -TH / 2 - 0.36, z)
      br.rotation.z = angle; baseGrp.add(br)
    }

    const foot = box(0.20, 0.032, 0.20, darkMat(C.steel))
    foot.position.set(lgX, -TH / 2 - 0.618, z); baseGrp.add(foot)
  }

  // Cross-brace connecting legs
  const lgBar = box(0.040, 0.040, 0.48, darkMat(C.steel))
  lgBar.position.set(lgX, -TH / 2 - 0.42, 0); baseGrp.add(lgBar)

  // ── Wing plates at landing gear attachment (real-world detail) ──────────
  // Triangular steel gussets where landing gear bolts to trailer frame
  for (const z of [-0.24, 0.24]) {
    // Main gusset plate (side face)
    const gusset = box(0.22, 0.08, 0.012, darkMat(C.steel))
    gusset.position.set(lgX, -TH / 2 + 0.005, z); baseGrp.add(gusset)
    // Reinforcement rib on gusset
    const rib = box(0.14, 0.012, 0.055, darkMat(C.crossMbr))
    rib.position.set(lgX + 0.03, -TH / 2 - 0.025, z); baseGrp.add(rib)
  }

  // ── Aero skirt — WHITE, positioned BEHIND landing gear ──────────────────
  // Landing gear is at lgX = -1.70 (near front).
  // Skirt starts just after landing gear → runs to near rear
  const skirtStartX = lgX + 0.14                     // ≈ -1.56 (just past landing gear)
  const skirtEndX   = TL / 2 - 0.65 - 0.28          // stops before front face of rear tyre (~1.67)
  const skirtLen    = skirtEndX - skirtStartX         // ≈  3.96m
  const skirtCtrX   = (skirtStartX + skirtEndX) / 2  // ≈  0.42

  for (const side of [-1, 1]) {
    const z = side * (HW + 0.014)

    // Main skirt panel — white
    const sk = box(skirtLen, 0.24, 0.018, pvcMat(C.skirt))
    sk.position.set(skirtCtrX, -TH / 2 - 0.168, z + side * 0.006)
    baseGrp.add(sk)

    // Bottom rubber seal strip — light grey
    const seal = box(skirtLen, 0.018, 0.016, mat(C.skirtRb, 0.12, 0.92))
    seal.position.set(skirtCtrX, -TH / 2 - 0.294, z + side * 0.006)
    baseGrp.add(seal)

    // Mounting brackets (5 evenly spaced along skirt)
    for (let i = 0; i < 5; i++) {
      const bx = skirtStartX + (skirtLen / 4) * i
      const brkt = box(0.018, 0.058, 0.030, darkMat(C.steelLt))
      brkt.position.set(bx, -TH / 2 - 0.062, z + side * 0.018); baseGrp.add(brkt)
    }

    // Skirt-to-frame top rail (aluminum mill channel)
    const topChan = box(skirtLen, 0.022, 0.022, millMat(C.millAlumDk))
    topChan.position.set(skirtCtrX, -TH / 2 - 0.048, z + side * 0.010); baseGrp.add(topChan)
  }

  tagGroup(baseGrp, 'Base Assembly and Landing Gear')
  root.add(baseGrp)

  // ══════════════════════════════════════════
  // AXLE END — Hendrickson VANTRAAX air-ride tandem
  // ══════════════════════════════════════════
  const axleGrp = new THREE.Group()
  const AY = -TH / 2 - 0.435

  // ── VANTRAAX slider subframe (the rail the whole boggie slides on) ─────
  const axleSpread  = 0.47
  const sliderCtrX  = (TL / 2 - 0.65 + TL / 2 - 1.12) / 2   // midpoint of two axle centres
  const sliderHalfLen = axleSpread / 2 + 0.18

  for (const z of [-(HW - 0.10), (HW - 0.10)]) {
    // Outer C-channel rail — heavy dark steel
    const rail = box(axleSpread + 0.36, 0.052, 0.055, darkMat(C.steel))
    rail.position.set(sliderCtrX, AY + 0.27, z); axleGrp.add(rail)
    // Inner slider tube
    const slider = box(axleSpread + 0.22, 0.034, 0.034, mat(C.steelLt, 0.72, 0.30))
    slider.position.set(sliderCtrX, AY + 0.27, z); axleGrp.add(slider)
    // Rail end caps
    for (const xEnd of [-sliderHalfLen, sliderHalfLen]) {
      const cap = box(0.025, 0.055, 0.058, darkMat(C.steel))
      cap.position.set(sliderCtrX + xEnd, AY + 0.27, z); axleGrp.add(cap)
    }
  }

  // Slider cross-member (connects two rails)
  const sliderXmbr = box(0.040, 0.042, TW - 0.22, darkMat(C.steel))
  sliderXmbr.position.set(sliderCtrX, AY + 0.27, 0); axleGrp.add(sliderXmbr)

  // Locking pin assembly
  const pinHousing = box(0.055, 0.055, 0.042, darkMat(C.steel))
  pinHousing.position.set(sliderCtrX + 0.06, AY + 0.31, HW - 0.12); axleGrp.add(pinHousing)
  const pinHandle = box(0.012, 0.12, 0.012, mat(C.steelLt, 0.85, 0.18))
  pinHandle.position.set(sliderCtrX + 0.06, AY + 0.38, HW - 0.12); axleGrp.add(pinHandle)

  // ── VANTRAAX walking / equalizer beam (the key visual feature) ────────
  // Longitudinal beam connecting the two axle suspension pivots
  for (const z of [-(HW - 0.05), (HW - 0.05)]) {
    // Main equalizer beam (heavy box section)
    const eqBeam = box(axleSpread + 0.12, 0.085, 0.068, darkMat(C.steel))
    eqBeam.position.set(sliderCtrX, AY + 0.12, z); axleGrp.add(eqBeam)

    // Beam pivot bushing (centre — thick cylinder)
    const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.075, 12), darkMat(C.steelLt))
    pivot.rotation.x = Math.PI / 2
    pivot.position.set(sliderCtrX, AY + 0.12, z); axleGrp.add(pivot)

    // Axle seat pads (where axle sits on beam — each end)
    for (const xEnd of [-(axleSpread / 2), (axleSpread / 2)]) {
      const seat = box(0.095, 0.042, 0.080, darkMat(C.crossMbr))
      seat.position.set(sliderCtrX + xEnd, AY + 0.17, z); axleGrp.add(seat)
      // U-bolt clamp (over axle tube)
      const uClamp = box(0.018, 0.065, 0.078, mat(C.steelLt, 0.82, 0.22))
      uClamp.position.set(sliderCtrX + xEnd, AY + 0.14, z); axleGrp.add(uClamp)
    }

    // Spring hanger bracket (mounted to slider frame above beam centre)
    const hangerBody = box(0.060, 0.20, 0.055, darkMat(C.steel))
    hangerBody.position.set(sliderCtrX, AY + 0.24, z); axleGrp.add(hangerBody)
    // Hanger pin
    const hangerPin = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.065, 8), mat(C.steelLt, 0.85, 0.18))
    hangerPin.rotation.x = Math.PI / 2
    hangerPin.position.set(sliderCtrX, AY + 0.17, z); axleGrp.add(hangerPin)
  }

  // ── Per-axle components ────────────────────────────────────────────
  for (const axX of [TL / 2 - 0.65, TL / 2 - 1.12]) {

    // Axle beam (hollow I-beam, dark steel)
    const beam = box(0.082, 0.070, TW + 0.65, darkMat(C.steel))
    beam.position.set(axX, AY + 0.068, 0); axleGrp.add(beam)

    // Air-ride suspension bag + upper/lower mount per side
    for (const z of [-(HW + 0.095), (HW + 0.095)]) {
      // Air bag (toroid-ish — use stacked cylinders)
      const bagBase = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 16), mat(C.airBag, 0.2, 0.85))
      bagBase.position.set(axX, AY + 0.14, z); axleGrp.add(bagBase)
      const bagBody = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.068, 0.10, 16), mat(C.airBag, 0.18, 0.90))
      bagBody.position.set(axX, AY + 0.20, z); axleGrp.add(bagBody)
      const bagTop = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.022, 16), mat(C.airBag, 0.2, 0.85))
      bagTop.position.set(axX, AY + 0.26, z); axleGrp.add(bagTop)

      // Upper mount plate
      const plate = box(0.165, 0.028, 0.165, darkMat(C.steel))
      plate.position.set(axX, AY + 0.275, z); axleGrp.add(plate)

      // Height control valve
      const valve = box(0.055, 0.065, 0.038, mat('#1a2030', 0.35, 0.70))
      valve.position.set(axX + 0.08, AY + 0.34, z); axleGrp.add(valve)
      const link = box(0.008, 0.13, 0.008, mat(C.steelLt, 0.75, 0.30))
      link.rotation.z = 0.18
      link.position.set(axX + 0.06, AY + 0.25, z); axleGrp.add(link)
    }

    // Brake chamber (S-cam drum brakes)
    for (const z of [-(HW + 0.05), (HW + 0.05)]) {
      const chamber = box(0.075, 0.075, 0.095, mat('#2a2e34', 0.35, 0.65))
      chamber.position.set(axX - 0.08, AY + 0.11, z); axleGrp.add(chamber)
      // Push rod
      const pushRod = box(0.010, 0.010, 0.14, mat(C.steelLt, 0.80, 0.22))
      pushRod.position.set(axX - 0.11, AY + 0.10, z + (z > 0 ? 0.07 : -0.07)); axleGrp.add(pushRod)
      // Slack adjuster
      const slack = box(0.075, 0.014, 0.018, darkMat(C.steel))
      slack.rotation.z = 0.45
      slack.position.set(axX - 0.08, AY + 0.06, z + (z > 0 ? 0.07 : -0.07)); axleGrp.add(slack)
    }

    // ── Hendrickson shock absorbers (diagonal, per corner) ──
    for (const z of [-(HW + 0.055), (HW + 0.055)]) {
      const shockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.022, 0.20, 10), mat(C.shockBody, 0.55, 0.55))
      shockBody.rotation.z = 0.28
      shockBody.position.set(axX - 0.048, AY + 0.21, z); axleGrp.add(shockBody)
      const shockRod = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.15, 8), mat(C.hubChr, 0.88, 0.10))
      shockRod.rotation.z = 0.28
      shockRod.position.set(axX - 0.012, AY + 0.10, z); axleGrp.add(shockRod)
      const mntTop = box(0.040, 0.022, 0.038, darkMat(C.steel))
      mntTop.position.set(axX - 0.068, AY + 0.31, z); axleGrp.add(mntTop)
      const mntBot = box(0.032, 0.018, 0.030, darkMat(C.steel))
      mntBot.position.set(axX + 0.008, AY + 0.02, z); axleGrp.add(mntBot)
    }

    // Torque rods (upper + lower, angled)
    for (const z of [-(HW - 0.08), (HW - 0.08)]) {
      const rod = box(0.30, 0.030, 0.030, mat(C.steelLt, 0.7, 0.3))
      rod.position.set(axX - 0.15, AY + 0.14, z); axleGrp.add(rod)
      // End bushings
      for (const xOff of [-0.145, 0.145]) {
        const bush = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.035, 8), mat(C.rubber, 0.1, 0.95))
        bush.rotation.x = Math.PI / 2
        bush.position.set(axX - 0.15 + xOff, AY + 0.14, z); axleGrp.add(bush)
      }
    }

    // Air line hoses (per side)
    for (const z of [-(HW - 0.05), (HW - 0.05)]) {
      const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.24, 6), mat('#111520', 0.1, 0.95))
      hose.rotation.z = Math.PI / 2
      hose.position.set(axX - 0.04, AY + 0.36, z); axleGrp.add(hose)
    }

    // ── 4 wheels per axle (dual Michelin 295/75R22.5) ──────────────
    for (const side of [-1, 1]) {
      for (const offset of [0.068, 0.196]) {
        const wz = side * (HW + 0.148 + offset)

        // Tire carcass
        const tireGeo = new THREE.CylinderGeometry(0.228, 0.228, 0.108, 32)
        const tire = new THREE.Mesh(tireGeo, mat(C.wheelRb, 0.12, 0.97))
        tire.rotation.x = Math.PI / 2
        tire.position.set(axX, AY, wz); axleGrp.add(tire)

        // Sidewall shoulder rings (Michelin-style)
        for (const rr of [0.188, 0.205, 0.218]) {
          const treadGeo = new THREE.TorusGeometry(rr, 0.007, 8, 32)
          const tread = new THREE.Mesh(treadGeo, mat('#1e2228', 0.1, 0.98))
          tread.position.set(axX, AY, wz); axleGrp.add(tread)
        }

        // Sidewall lettering band
        const lwGeo = new THREE.TorusGeometry(0.196, 0.012, 6, 32)
        const lw = new THREE.Mesh(lwGeo, mat('#383e48', 0.12, 0.95))
        lw.position.set(axX, AY, wz); axleGrp.add(lw)

        // Brake drum
        const drumGeo = new THREE.CylinderGeometry(0.168, 0.168, 0.095, 20)
        const drum = new THREE.Mesh(drumGeo, mat(C.drumGry, 0.55, 0.55))
        drum.rotation.x = Math.PI / 2
        drum.position.set(axX, AY, wz); axleGrp.add(drum)

        // Brake dust shield (thin disc behind drum)
        const shieldGeo = new THREE.CylinderGeometry(0.172, 0.172, 0.010, 20)
        const shield = new THREE.Mesh(shieldGeo, darkMat(C.steel))
        shield.rotation.x = Math.PI / 2
        shield.position.set(axX, AY, wz - side * 0.055); axleGrp.add(shield)

        // Rim (steel disc wheel, 22.5in)
        const rimGeo = new THREE.CylinderGeometry(0.152, 0.152, 0.115, 20)
        const rim = new THREE.Mesh(rimGeo, mat(C.rimSil, 0.72, 0.28))
        rim.rotation.x = Math.PI / 2
        rim.position.set(axX, AY, wz); axleGrp.add(rim)

        // Rim hand holes (8 slots visual)
        for (let sp = 0; sp < 8; sp++) {
          const angle = (sp / 8) * Math.PI * 2
          const sx = axX + Math.cos(angle) * 0.092
          const sy = AY + Math.sin(angle) * 0.092
          const spoke = box(0.030, 0.030, 0.117, mat(C.rimSpk, 0.7, 0.3))
          spoke.position.set(sx, sy, wz); axleGrp.add(spoke)
        }

        // Hub cap (chrome centre)
        const hubGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.120, 12)
        const hub = new THREE.Mesh(hubGeo, mat(C.hubChr, 0.88, 0.12))
        hub.rotation.x = Math.PI / 2
        hub.position.set(axX, AY, wz); axleGrp.add(hub)

        // Hub cap bolt circle (10-stud pattern)
        for (let b = 0; b < 10; b++) {
          const ba = (b / 10) * Math.PI * 2
          const bx = axX + Math.cos(ba) * 0.040
          const by = AY + Math.sin(ba) * 0.040
          const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.122, 6), mat(C.steelLt, 0.85, 0.15))
          bolt.rotation.x = Math.PI / 2
          bolt.position.set(bx, by, wz); axleGrp.add(bolt)
        }
      }
    }

    // Mudflap (full-width thick rubber)
    const flap = box(0.022, 0.32, TW + 0.55, mat(C.rubber, 0.1, 0.97))
    flap.position.set(axX + 0.16, AY - 0.01, 0); axleGrp.add(flap)

    const hanger = box(0.040, 0.038, TW + 0.54, darkMat(C.steel))
    hanger.position.set(axX + 0.14, AY + 0.16, 0); axleGrp.add(hanger)
  }

  tagGroup(axleGrp, 'Axle End')
  root.add(axleGrp)

  // ── Structural core (interior volume filler — PVC white) ──────────
  const core = box(TL - 0.06, TH - 0.05, TW - 0.05, pvcMat(C.pvcWhite))
  root.add(core)

  scene.add(root)
  return root
}

// ══════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function TrailerScene({ sections, activeSection, onSectionSelect }: Props) {
  const containerRef       = useRef<HTMLDivElement>(null)
  const sceneRef           = useRef<THREE.Scene | null>(null)
  const hoveredRef         = useRef<string | null>(null)
  const animRef            = useRef<number>(0)
  const timeRef            = useRef<number>(0)
  const onSectionSelectRef = useRef(onSectionSelect)
  useEffect(() => { onSectionSelectRef.current = onSectionSelect }, [onSectionSelect])

  useEffect(() => {
    if (!sceneRef.current) return
    applyMaterials(sceneRef.current, hoveredRef.current, activeSection?.title ?? null)
  }, [activeSection])

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    if (container.dataset.glInit === '1') return
    container.dataset.glInit = '1'

    // ── Scene ──────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color('#0a0b0d')
    scene.fog = new THREE.FogExp2('#0a0b0d', 0.038)

    // ── Lights ─────────────────────────────────────────────────────
    const hemi = new THREE.HemisphereLight('#c0d4e8', '#404860', 1.2)
    scene.add(hemi)

    // Key light — brighter to bring out the white/aluminum finish
    const key = new THREE.DirectionalLight('#ffffff', 3.8)
    key.position.set(7, 10, 6)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 30
    key.shadow.camera.left = -7; key.shadow.camera.right = 7
    key.shadow.camera.top  =  5; key.shadow.camera.bottom = -5
    key.shadow.bias = -0.001
    scene.add(key)

    // Fill light (cool blue-white from left)
    const fill = new THREE.DirectionalLight('#9ab0d0', 1.1)
    fill.position.set(-8, 3, -3); scene.add(fill)

    // HK red accent rim
    const rim = new THREE.DirectionalLight('#E31E24', 0.35)
    rim.position.set(-4, -3, -8); scene.add(rim)

    // Ground bounce — warm to complement white body
    const bounce = new THREE.DirectionalLight('#a0a8b8', 0.60)
    bounce.position.set(0, -6, 4); scene.add(bounce)

    // Under-axle fill
    const axleFill = new THREE.PointLight('#6070a0', 1.8, 5)
    axleFill.position.set(2, -0.85, 0); scene.add(axleFill)

    // ── Ground plane ───────────────────────────────────────────────
    const groundGeo = new THREE.PlaneGeometry(24, 24)
    const groundMat = new THREE.MeshStandardMaterial({ color: '#0d0e10', metalness: 0.0, roughness: 0.95 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1.0
    ground.receiveShadow = true
    scene.add(ground)

    const grid = new THREE.GridHelper(24, 36, '#20242e', '#181c24')
    grid.position.y = -0.998
    scene.add(grid)

    // ── Camera ─────────────────────────────────────────────────────
    const w = container.clientWidth || 700
    const h = container.clientHeight || 440
    const camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 60)
    camera.position.set(3.2, 1.6, 3.4)
    camera.lookAt(0, 0, 0)

    // ── Renderer ───────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'default' })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    // ── Build trailer ──────────────────────────────────────────────
    buildTrailer(scene)

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
      controls.minDistance    = 2.5
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
        onSectionSelectRef.current(sec)
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

    // ── Animation loop ─────────────────────────────────────────────
    const animate = (time: number) => {
      animRef.current = requestAnimationFrame(animate)
      timeRef.current = time
      controls?.update()

      scene.traverse(o => {
        if (!(o instanceof THREE.Mesh) || !o.userData.sectionTitle) return
        const m = o.material as THREE.MeshStandardMaterial
        const t = o.userData.sectionTitle as string
        if (t === activeTitleRef.current) {
          const pulse = Math.sin(time * 0.003) * 0.04 + 0.09
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
      scene.traverse(o => {
        if (o instanceof THREE.Mesh) {
          o.geometry?.dispose()
          const m = o.material
          if (Array.isArray(m)) m.forEach(x => x.dispose())
          else m?.dispose()
        }
      })
      renderer.forceContextLoss()
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      delete container.dataset.glInit
      sceneRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    if (m.emissiveIntensity > 0 && m.color.r > 0.8) return

    if (t === active) {
      m.emissive.set('#E31E24')
    } else if (t === hovered) {
      m.emissive.set('#E31E24'); m.emissiveIntensity = 0.07
    } else {
      m.emissive.set('#000000'); m.emissiveIntensity = 0
    }
  })
}
