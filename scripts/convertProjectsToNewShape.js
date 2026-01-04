// scripts/convertProjectsToNewShape.js
// Node script to convert old GeoJSON-style projects into new array shape

const fs = require('fs')
const path = require('path')

// 🔧 Adjust these if your paths are different
const INPUT_PATH = path.join(
  __dirname,
  '..',
  'src',
  'app',
  '(site)',
  'home',
  'projects-old.json'
)

const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'src',
  'app',
  '(site)',
  'home',
  'projects.json' // <= new file (simple array)
)

// 🎯 Category options (array<string>)
const CATEGORY_OPTIONS = [
  'งานโครงการ',
  'นิคม โรงงาน',
  'อาหาร เครื่องดื่ม',
  'โรงแรม รีสอร์ท',
  'เกาะ',
  'เหมืองแร่ พลังงาน',
  'ฟาร์ม เกษตร ปศุสัตว์',
  'วัด โรงเรียน',
  'Dewatering',
]

// 🧩 Helpers
function pickRandomCategories() {
  // You can change this to always 1 if you want
  const shuffled = CATEGORY_OPTIONS.map((value) => ({
    value,
    sort: Math.random(),
  }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)

  const count = Math.random() < 0.6 ? 1 : 2 // 60% = 1 category, 40% = 2
  return shuffled.slice(0, count)
}

function randomYear() {
  const min = 2010
  const max = 2024
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error('❌ INPUT_PATH not found:', INPUT_PATH)
    process.exit(1)
  }

  const raw = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'))

  const features = Array.isArray(raw.features) ? raw.features : []

  const projects = features.map((feature, index) => {
    const coords = feature?.geometry?.coordinates || [0, 0]
    const props = feature?.properties || {}

    const lng = typeof coords[0] === 'number' ? coords[0] : 0
    const lat = typeof coords[1] === 'number' ? coords[1] : 0

    const title =
      typeof props.title === 'string' && props.title.trim().length > 0
        ? props.title.trim()
        : `โครงการหมายเลข ${index + 1}`

    const logoName =
      typeof props.logo === 'string' && props.logo.trim().length > 0
        ? props.logo.trim()
        : 'logo_SGW_white'

    // You can adjust this pattern to match your real image path
    const coverImage = `/images/projects/project-${index + 1}.jpg`

    /** @type {{
     *  _id: number;
     *  title: string;
     *  year: number;
     *  logo: string;
     *  projectType: string;
     *  lat: number;
     *  lng: number;
     *  coverImage: string;
     *  category: string[];
     *  contents: { image: string; text: string }[];
     * }} */
    const project = {
      _id: index + 1,
      title,
      year: randomYear(),
      logo: `/images/logo/${logoName}.svg`,
      projectType:
        typeof props.type === 'string' && props.type.trim().length > 0
          ? props.type.trim()
          : 'project',
      lat,
      lng,
      coverImage,
      category: pickRandomCategories(),
      contents: [
        {
          image: coverImage,
          text: `${title} – รายละเอียดโครงการจะถูกเพิ่มเติมในภายหลัง`,
        },
        {
          image: coverImage,
          text: 'เนื้อหาตัวอย่างสำหรับแสดงรูปและคำอธิบายโครงการ',
        },
      ],
    }

    return project
  })

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(projects, null, 2), 'utf8')
  console.log(`✅ Converted ${projects.length} projects -> ${OUTPUT_PATH}`)
}

main()
