'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function HeroTextScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    const W = el.clientWidth, H = el.clientHeight

    /* ── renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    /* ── scene / camera ── */
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100)
    camera.position.set(0, 0, 8)

    /* ── lights ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.28))

    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(4, 7, 6)
    scene.add(key)

    const redPt = new THREE.PointLight(0xe31e24, 6, 18)
    redPt.position.set(1, -2.5, 3.5)
    scene.add(redPt)

    const rim = new THREE.DirectionalLight(0x3355cc, 0.9)
    rim.position.set(-6, -3, 1)
    scene.add(rim)

    const topFill = new THREE.PointLight(0xffffff, 1.2, 12)
    topFill.position.set(0, 5, 2)
    scene.add(topFill)

    /* ── material ── */
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x1c2138,
      metalness: 0.96,
      roughness: 0.10,
    })
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xe31e24,
      metalness: 0.75,
      roughness: 0.2,
      emissive: 0xe31e24,
      emissiveIntensity: 0.35,
    })

    /* ── helper: bevelled box ── */
    function bevelBox(w: number, h: number, d: number): THREE.BufferGeometry {
      // Use BoxGeometry — bevel is faked via slightly smaller dims + shininess
      return new THREE.BoxGeometry(w, h, d, 1, 1, 1)
    }

    const S = 0.42   // stroke (bar) thickness
    const LH = 3.8   // letter height
    const D = 0.58   // extrusion depth

    /* ── H letter ── */
    function buildH(mat: THREE.Material): THREE.Group {
      const g = new THREE.Group()
      const LW = 0.58  // letter half-width

      const leftPost  = new THREE.Mesh(bevelBox(S, LH, D), mat)
      leftPost.position.x = -LW
      const rightPost = new THREE.Mesh(bevelBox(S, LH, D), mat)
      rightPost.position.x = LW
      const crossbar  = new THREE.Mesh(bevelBox(LW * 2 + S, S * 0.88, D), mat)

      g.add(leftPost, rightPost, crossbar)
      return g
    }

    /* ── K letter ── */
    function buildK(mat: THREE.Material): THREE.Group {
      const g = new THREE.Group()

      const post = new THREE.Mesh(bevelBox(S, LH, D), mat)
      post.position.x = -0.5

      // Upper arm: diagonal from mid-post to upper-right
      const armLen = 1.52
      const armAngle = Math.PI * 0.215
      const upper = new THREE.Mesh(bevelBox(armLen, S * 0.88, D), mat)
      upper.rotation.z = -armAngle
      upper.position.set(
        -0.5 + Math.cos(armAngle) * armLen * 0.46,
        Math.sin(armAngle) * armLen * 0.46,
        0
      )

      // Lower arm: mirror
      const lower = new THREE.Mesh(bevelBox(armLen, S * 0.88, D), mat)
      lower.rotation.z = armAngle
      lower.position.set(
        -0.5 + Math.cos(armAngle) * armLen * 0.46,
        -Math.sin(armAngle) * armLen * 0.46,
        0
      )

      // Small notch fill at junction to close the gap
      const fill = new THREE.Mesh(bevelBox(S * 0.7, S * 0.88, D), mat)
      fill.position.x = -0.5

      g.add(post, upper, lower, fill)
      return g
    }

    /* ── assemble HK ── */
    const HK = new THREE.Group()

    const letterH = buildH(steelMat)
    letterH.position.x = -1.38

    const letterK = buildK(steelMat)
    letterK.position.x = 1.05

    HK.add(letterH, letterK)
    HK.position.set(0.6, 0.5, 0)
    scene.add(HK)

    /* ── "TRAILER PARTS" canvas label ── */
    const lc = document.createElement('canvas')
    lc.width = 768; lc.height = 80
    const lctx = lc.getContext('2d')!
    lctx.clearRect(0, 0, 768, 80)
    lctx.fillStyle = 'rgba(255,255,255,0.70)'
    lctx.font = '700 32px "Space Grotesk", Arial, sans-serif'
    lctx.textAlign = 'center'
    lctx.textBaseline = 'middle'
    // letter-spacing approximation
    const chars = 'TRAILER  PARTS'.split('')
    let cx2 = 768 / 2 - ((chars.length - 1) * 14) / 2
    chars.forEach(ch => { lctx.fillText(ch, cx2, 40); cx2 += lctx.measureText(ch).width + 5.5 })

    const subTex = new THREE.CanvasTexture(lc)
    const subPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 0.44),
      new THREE.MeshBasicMaterial({ map: subTex, transparent: true, opacity: 0, depthWrite: false })
    )
    subPlane.position.set(0.6, -2.55, 0)
    scene.add(subPlane)

    /* ── red accent line ── */
    const accentLine = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.055, 0.06),
      redMat
    )
    accentLine.position.set(0.6, -2.28, 0)
    accentLine.scale.x = 0
    scene.add(accentLine)

    /* ── particles ── */
    const pCount = 400
    const pPos = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 22
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 18
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 3
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0xe31e24, size: 0.025, transparent: true, opacity: 0.4,
    })))

    /* ── mouse parallax ── */
    const mouse = { x: 0, y: 0 }
    const camShift = { x: 0, y: 0 }
    function onMouse(e: MouseEvent) {
      if (!el) return
      mouse.x = ((e.clientX - el.getBoundingClientRect().left) / el.getBoundingClientRect().width  - 0.5) * 2
      mouse.y = -((e.clientY - el.getBoundingClientRect().top)  / el.getBoundingClientRect().height - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouse)

    /* ── entrance state ── */
    let eT = 0
    const ready = { v: false }
    HK.scale.setScalar(0.001)

    function easeOutBack(x: number) {
      const c1 = 1.70158, c3 = c1 + 1
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
    }

    /* ── render loop ── */
    let raf = 0, t = 0
    function animate() {
      raf = requestAnimationFrame(animate)
      t += 0.016

      // entrance
      if (!ready.v) {
        eT = Math.min(eT + 0.020, 1)
        HK.scale.setScalar(Math.max(0.001, easeOutBack(eT)))
        ;(subPlane.material as THREE.MeshBasicMaterial).opacity = Math.min(eT * 2, 0.70)
        accentLine.scale.x = Math.min(eT * 2.2, 1)
        if (eT >= 1) ready.v = true
      }

      // float
      const floatY = Math.sin(t * 0.45) * 0.10
      HK.position.y    = 0.5 + floatY
      subPlane.position.y = -2.55 + floatY
      accentLine.position.y = -2.28 + floatY

      // mouse parallax (smooth)
      camShift.x += (mouse.x * 0.7 - camShift.x) * 0.045
      camShift.y += (mouse.y * 0.35 - camShift.y) * 0.045
      camera.position.x = camShift.x
      camera.position.y = camShift.y
      camera.lookAt(0, 0, 0)

      // tilt HK toward cursor
      HK.rotation.y = mouse.x * 0.14
      HK.rotation.x = -mouse.y * 0.07

      // red pulse
      redPt.intensity = 5.5 + Math.sin(t * 1.2) * 1.2

      renderer.render(scene, camera)
    }
    animate()

    /* ── resize ── */
    function onResize() {
      if (!el) return
      const w = el.clientWidth, h = el.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
