import Link from 'next/link'
import { getCategoriesWithMeta } from '@/app/actions/products'

// Images sourced from hktrailerparts.com/category — keyed by lowercase category name
const CATEGORY_IMAGES: Record<string, string> = {
  'abs valves & sensors': '',
  'air system & components': 'https://hkmis.ca/web/product-cat-images/f1422b7009861d407f2ef72738a4adf0GeminiGeneratedImagek605h3k605h3k605.png',
  'air fittings': 'https://hkmis.ca/web/product-cat-images/8b2e218a52e19014f4621a69485a69b8GeminiGeneratedImagekxgpoekxgpoekxgp.png',
  'air lines and air brake components': 'https://hkmis.ca/web/product-cat-images/9feee447775d6e2ba064ce7bd3eb50f0GeminiGeneratedImagegdrofugdrofugdro.png',
  'air tanks & accessories': 'https://hkmis.ca/web/product-cat-images/0d493a32e93d9f8c9ead220bb3c7b248GeminiGeneratedImage3sbpfr3sbpfr3sbp.png',
  'air valves': 'https://hkmis.ca/web/product-cat-images/2e6c0afe9ecde09434ddf5d1f8c5d924GeminiGeneratedImagebhr5qmbhr5qmbhr5.png',
  'boggie lock pin, actuators and safety clips': 'https://hkmis.ca/web/product-cat-images/778abadd513725fdb4226a4830846e48GeminiGeneratedImages38z4hs38z4hs38z.png',
  'brake system': 'https://hkmis.ca/web/product-cat-images/4ba1c584fca149878ab7bff39617a4e2GeminiGeneratedImagec0drdhc0drdhc0dr.png',
  'brake chambers & acessories': 'https://hkmis.ca/web/product-cat-images/e718f1119b8fd92d736f916ab0d62908GeminiGeneratedImageys69vzys69vzys69.png',
  'brake chambers & accessories': 'https://hkmis.ca/web/product-cat-images/e718f1119b8fd92d736f916ab0d62908GeminiGeneratedImageys69vzys69vzys69.png',
  'brake shoe, brake pads kits & drums': 'https://hkmis.ca/web/product-cat-images/feff1955be06a703bef11105f68c2f69GeminiGeneratedImagewz0u9owz0u9owz0u.png',
  'caliper & their repair kits': 'https://hkmis.ca/web/product-cat-images/7f04fb5a5c6bd7aea71d28991c014ac9GeminiGeneratedImageb8g335b8g335b8g3.png',
  'rotors and its hardware': 'https://hkmis.ca/web/product-cat-images/9c6b5d877a99645dc195a6e8b823b6b6High-quality-brake-disc-6.webp',
  's-cam/ camshaft repair kit': 'https://hkmis.ca/web/product-cat-images/b09181fb5787221f2666795ce312d4cbGeminiGeneratedImage3lh2xl3lh2xl3lh2.png',
  's-cam/ camshafts': 'https://hkmis.ca/web/product-cat-images/948532434d673ce33ac87e855c0e30efGeminiGeneratedImage9hursg9hursg9hur.png',
  'slack adjusters': 'https://hkmis.ca/web/product-cat-images/ea2f82d61c29b87e94f2d9b9ba156650GeminiGeneratedImagedloo37dloo37dloo.png',
  'bumper, dock bumpers': 'https://hkmis.ca/web/product-cat-images/95c853e79a291ea34e8706d994ee3430GeminiGeneratedImageta2vfjta2vfjta2v.png',
  'clamp': 'https://hkmis.ca/web/product-cat-images/551c6efc41b4480f2148145defbcf463GeminiGeneratedImagek7l4hvk7l4hvk7l41.png',
  'differential': 'https://hkmis.ca/web/product-cat-images/618418151cdd2b5abb140d4027873e40GeminiGeneratedImagejqni9jqni9jqni9j.png',
  'driveline': 'https://hkmis.ca/web/product-cat-images/b8b8c16a4772f3ab664014c5064d5036GeminiGeneratedImageb6fybzb6fybzb6fy.png',
  'electricals': 'https://hkmis.ca/web/product-cat-images/e5ff5eb044efa3fb4178b49b5d6fd721GeminiGeneratedImage1dzw8e1dzw8e1dzw.png',
  'nose box, nose plug, gladhand and accessaries': 'https://hkmis.ca/web/product-cat-images/68af6098c0f311bfabcd160697191336HKLogoRecovered.jpg',
  'nose box, nose plug, gladhand and accessories': 'https://hkmis.ca/web/product-cat-images/68af6098c0f311bfabcd160697191336HKLogoRecovered.jpg',
  'filter': 'https://hkmis.ca/web/product-cat-images/a06503cd5d5cc983a518bdf0d8d769dfGeminiGeneratedImage3rxwp13rxwp13rxw.png',
  'fuel tank, straps, caps and others': 'https://hkmis.ca/web/product-cat-images/d9188277e2662c60d0677b6c92056e69GeminiGeneratedImage1p7qn61p7qn61p7q.png',
  'hardware': 'https://hkmis.ca/web/product-cat-images/8c9d989551600b10f8a8316fe41bfe14GeminiGeneratedImaget49g5xt49g5xt49g.png',
  'hoses': 'https://hkmis.ca/web/product-cat-images/b0734904e9cddf927742e616efc95b76GeminiGeneratedImagenq9josnq9josnq9j.png',
  'hub accessories, wheel stud & wheel components': 'https://hkmis.ca/web/product-cat-images/a1909fc46111e4dfad8468a6fd410532GeminiGeneratedImageejt7ohejt7ohejt7.png',
  'bearing': 'https://hkmis.ca/web/product-cat-images/46dd9927697f0b8c5098bb3bd3322b55GeminiGeneratedImage41lw0m41lw0m41lw.png',
  'hub cap, tiremaxx and accessories': 'https://hkmis.ca/web/product-cat-images/1a8fb32df42ec556b686435ca89c655aGeminiGeneratedImageug9uwhug9uwhug9u.png',
  'hubs': 'https://hkmis.ca/web/product-cat-images/09f9d3648fdb8bf40aacf847bb889b5dGeminiGeneratedImagee3fty5e3fty5e3ft.png',
  'seals': 'https://hkmis.ca/web/product-cat-images/89b54cac226f8ce7ea4f68944fa5d76aGeminiGeneratedImagek8mlljk8mlljk8ml.png',
  'spindle nuts': 'https://hkmis.ca/web/product-cat-images/48009ed5fa1ac0ec518125a49cccf0921215spndlntkt.jpg',
  'insulation, tapes & adhesives': 'https://hkmis.ca/web/product-cat-images/c7ab260a7b271ebfe9273f42a399d20fGeminiGeneratedImagezfjqktzfjqktzfjq-removebg-preview.png',
  'landing gear and accesories': 'https://hkmis.ca/web/product-cat-images/70a93bb30fbd79d558e47d618be3af3aGeminiGeneratedImageld25mbld25mbld25.png',
  'landing gear and accessories': 'https://hkmis.ca/web/product-cat-images/70a93bb30fbd79d558e47d618be3af3aGeminiGeneratedImageld25mbld25mbld25.png',
  'lubricants and chemicals': 'https://hkmis.ca/web/product-cat-images/e8f6ed86fce2558bb1cf07e08899ba61GeminiGeneratedImagebn3hrdbn3hrdbn3h-removebg-preview.png',
  'metal': 'https://hkmis.ca/web/product-cat-images/bd2745d692ff3f02dce8ab82a08af09aGeminiGeneratedImages66jr9s66jr9s66j.png',
  'miscellaneous': 'https://hkmis.ca/web/product-cat-images/8cf5a75191d36926419ff720fc9e44d1GeminiGeneratedImageojpywvojpywvojpy-removebg-preview.png',
  'morgan': 'https://hkmis.ca/web/product-cat-images/17bee30cac5f169e017ed5af8ad904c8GeminiGeneratedImages3qs2rs3qs2rs3qs.png',
  'multivan': 'https://hkmis.ca/web/product-cat-images/2871a138d989c07ffd65a8b87efc0492GeminiGeneratedImagep2jvkbp2jvkbp2jv.png',
  'nox sensor': 'https://hkmis.ca/web/product-cat-images/c2d77826ebcd293ec3912fb12791d9c1GeminiGeneratedImageo5ex3wo5ex3wo5ex.png',
  'nuts': 'https://hkmis.ca/web/product-cat-images/6d33dc8a11d0ee206a8fc5d2bb3fe2aeGeminiGeneratedImagewso811wso811wso8.png',
  'oil pan': 'https://hkmis.ca/web/product-cat-images/94fec4e3dae47027b5b6c790b3c05c01GeminiGeneratedImaget1ca08t1ca08t1ca.png',
  'paint': 'https://hkmis.ca/web/product-cat-images/408b638ac0eebe64e77721bbc28ff0f2GeminiGeneratedImagergedegrgedegrged.png',
  'reman': 'https://hkmis.ca/web/product-cat-images/296d4d62e186ee9c3755ccf7c23bf52fGeminiGeneratedImagesn8cbssn8cbssn8c.png',
  'reservoir': 'https://hkmis.ca/web/product-cat-images/06b93657ea01758d9303cd57c793b239GeminiGeneratedImagemogau4mogau4moga.png',
  'rivets': 'https://hkmis.ca/web/product-cat-images/0f9588766ac9e3762c65bc6cce063252GeminiGeneratedImage54on1754on1754on.png',
  'screws': 'https://hkmis.ca/web/product-cat-images/9ef4b008d29d021212f1f998685a30e5GeminiGeneratedImagek8ggvck8ggvck8gg.png',
  'scuffliner': 'https://hkmis.ca/web/product-cat-images/088d64b7d2f9184210a98c40e7810669GeminiGeneratedImagexsba0wxsba0wxsba.png',
  'sensor': 'https://hkmis.ca/web/product-cat-images/8ea21e9be6d6fb14762edba53aa8cb8eGeminiGeneratedImageh6jag0h6jag0h6ja.png',
  'starter/alternator': 'https://hkmis.ca/web/product-cat-images/07dc647d6d228615574edc04624ca281GeminiGeneratedImageu568iqu568iqu568.png',
  'suspension': 'https://hkmis.ca/web/product-cat-images/ecf741fca045124c20b21bf96a6bd671GeminiGeneratedImagei2mrefi2mrefi2mr.png',
  'air bags, leaf springs & accessories': 'https://hkmis.ca/web/product-cat-images/6f5622307cc11e9f1af34f379e411461GeminiGeneratedImageav4wcaav4wcaav4w.png',
  'bushing kits & accessories': 'https://hkmis.ca/web/product-cat-images/f49afbd2979d70357b0013d0f0c4ea2aGeminiGeneratedImage8rphww8rphww8rph.png',
  'shock absorbers': 'https://hkmis.ca/web/product-cat-images/e9a774ceeffd2b07480e132a6b20e3e7515Wx515H-216837-1.png',
  'suspension hangers': 'https://hkmis.ca/web/product-cat-images/fcb30124654041347e15bc26ad38c5daGeminiGeneratedImagezd5nmizd5nmizd5n.png',
  'torque rods and arms': 'https://hkmis.ca/web/product-cat-images/77c28ef9fdc6b824f7616e44de58a181HKLogoRecovered.jpg',
  'tools': 'https://hkmis.ca/web/product-cat-images/de2ff96997c5cf9a13b38edc717ea7cbGeminiGeneratedImagesvtoy6svtoy6svto1.png',
  'drill bit': 'https://hkmis.ca/web/product-cat-images/3f062d174b639a30361d5e45aa1dd937GeminiGeneratedImagesizy8tsizy8tsizy.png',
  'trailer body parts': 'https://hkmis.ca/web/product-cat-images/cd594171753ca5c23befa007c0ec410cvan-body-parts.png',
  'bottom rail': 'https://hkmis.ca/web/product-cat-images/2bdd32c90f31f5efe7e706d8147b31ffbottomrail.png',
  'cargo control': 'https://hkmis.ca/web/product-cat-images/6e4aeba250214f5e248f26effaee214f1.DSC4531.webp',
  'corner cap': 'https://hkmis.ca/web/product-cat-images/dee3e58815635cba0864e1d1872ca06cGeminiGeneratedImagez0xtbhz0xtbhz0xt.png',
  'di-mond trailer parts': 'https://hkmis.ca/web/product-cat-images/8f666266354556f73196514e2205cd98DIMondTruckSideView-1536x1075.png',
  'door parts': 'https://hkmis.ca/web/product-cat-images/7a3cb2a3d53fc48c0f32a8bd9adcba7apart3.jpg',
  'great dane trailer parts': 'https://hkmis.ca/web/product-cat-images/ddaca9a28d646623d474e23a6064c7bcGeminiGeneratedImageelysocelysocelys.png',
  'hinges': 'https://hkmis.ca/web/product-cat-images/d679862299b67b4072f85d2975b9fe41hinges.png',
  'hyundai trailer parts': 'https://hkmis.ca/web/product-cat-images/e94649c8db7f4d72c5d026b0572adc49hyundai-reefer.jpg',
  'itd trailer parts': 'https://hkmis.ca/web/product-cat-images/64707e968169af20f20491d7a44bd690GeminiGeneratedImagea80ib8a80ib8a80i.png',
  'manac trailer parts': 'https://hkmis.ca/web/product-cat-images/fd5571dc53c310c8f4099adcaa232c1eGeminiGeneratedImage3n34d03n34d03n34.png',
  'nose rail': 'https://hkmis.ca/web/product-cat-images/8c5983ae46373a2fe5499629376ebe68GeminiGeneratedImageujcjixujcjixujcj1.png',
  'radius corner': 'https://hkmis.ca/web/product-cat-images/4b4aee5ad7b161a5118289392198b16cGeminiGeneratedImagey6x9fwy6x9fwy6x91.png',
  'roof bow': 'https://hkmis.ca/web/product-cat-images/fb820ef6c85b40c6f959849da48d567ainterior-roof-bow.jpg',
  'springs': 'https://hkmis.ca/web/product-cat-images/a5dccefd0b02a238b665d82041a689f5springs-image01.webp',
  'stoughton trailer parts': 'https://hkmis.ca/web/product-cat-images/5b2b0e0280a63b23d9bbdcc366cf4496GeminiGeneratedImagecq14nocq14nocq14.png',
  'top rail': 'https://hkmis.ca/web/product-cat-images/a07d7357f325322e7cd797fcbc00d873GeminiGeneratedImagey32y3ny32y3ny32y.png',
  'trailmobile trailer parts': 'https://hkmis.ca/web/product-cat-images/38c4f28a36e8eee147aaf63a959b2921GeminiGeneratedImagewfzbwywfzbwywfzb.png',
  'utility trailer parts': 'https://hkmis.ca/web/product-cat-images/24df6fcb492eba1600cd33b2f6d3b4feGeminiGeneratedImage486qr6486qr6486q-removebg-preview.png',
  'vanguard trailer parts': 'https://hkmis.ca/web/product-cat-images/019936b3d6dac5d9cf2c0ed56b9e3f9eGeminiGeneratedImage9rao539rao539rao.png',
  'wabash trailer parts': 'https://hkmis.ca/web/product-cat-images/e251bb6a198e973d488f6c3c825376f224---2011.jpg',
  'trailer lights': 'https://hkmis.ca/web/product-cat-images/27f2628236f2b10790937efc4aac5299GeminiGeneratedImagey09l81y09l81y09l.png',
  'truck parts': 'https://hkmis.ca/web/product-cat-images/b0fd233d0fa77bec255873b0fde47fe5cluster1.png',
  'brake system for trucks': 'https://hkmis.ca/web/product-cat-images/03e8d618f88556f9666bad0c0298e8abPicture2.webp',
  'engine parts': 'https://hkmis.ca/web/product-cat-images/d860dce4d8521a48e490eef08b30a26distockphoto-622426606-612x612.jpg',
  'fifth wheel rebuild kit, connection kits and accessories': '',
  'latches': 'https://hkmis.ca/web/product-cat-images/c1c0c7f72df5a7ba13fc9f6d097bb2c8GeminiGeneratedImagen39q7n39q7n39q7n.png',
  'mud flap hangers': 'https://hkmis.ca/web/product-cat-images/771862e4bd5f00f7b0210ba107beeae7GeminiGeneratedImagep359bop359bop359.png',
  'truck suspension': 'https://hkmis.ca/web/product-cat-images/13f4c6e64f4667f890bfc02a105e71b1GeminiGeneratedImagetvocjwtvocjwtvoc.png',
  'u-bolts': 'https://hkmis.ca/web/product-cat-images/9613e919c9541db0cd6a8dd973ecde53DFS.jpg',
  'v-band clamp': 'https://hkmis.ca/web/product-cat-images/32d550d5aefee2b2ce7714fe36bcce3171OyVf-3FL.ACUF8941000QL80.jpg',
  'welding supllies': 'https://hkmis.ca/web/product-cat-images/fadb4a9e2e8aef6f226b735c525a63e7GeminiGeneratedImagec8zig8c8zig8c8zi.png',
  'welding supplies': 'https://hkmis.ca/web/product-cat-images/fadb4a9e2e8aef6f226b735c525a63e7GeminiGeneratedImagec8zig8c8zig8c8zi.png',
}

function getCategoryImage(category: string, fallback: string | null): string | null {
  const key = category.toLowerCase().trim()
  const mapped = CATEGORY_IMAGES[key]
  if (mapped !== undefined) return mapped || fallback
  return fallback
}

export default async function CategoriesPage() {
  const categories = await getCategoriesWithMeta()

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--surface-card)', borderBottom: '3px solid #E31E24' }}>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E31E24]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E31E24] mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            Browse
          </p>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
            Categories
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--on-surface-dim)' }}>
            {categories.length} categories · {categories.reduce((s, c) => s + c.count, 0).toLocaleString()} products
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(({ category, count, image }) => {
            const imgSrc = getCategoryImage(category, image)
            return (
              <Link
                key={category}
                href={`/products?category=${encodeURIComponent(category)}`}
                className="group card-3d flex flex-col overflow-hidden"
                style={{ backgroundColor: 'var(--surface-card)' }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden" style={{ backgroundColor: 'var(--surface-raised)' }}>
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={category}
                      className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--border-dim)' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E31E24] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-xs font-black uppercase tracking-tight leading-snug" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
                    {category}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--on-surface-dim)' }}>
                    {count.toLocaleString()} {count === 1 ? 'Product' : 'Products'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
