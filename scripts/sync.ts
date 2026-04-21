import axios from "axios";
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);

const FUNDS_MAP: Record<string, string> = {
  UNIT_COST1: "แผนลงทุนพื้นฐานทั่วไป",
  UNIT_COST2: "แผนเชิงรุก 35",
  UNIT_COST3: "แผนตราสารหนี้",
  UNIT_COST4: "แผนเงินฝากและตราสารหนี้ระยะสั้น",
  UNIT_COST5: "แผนเชิงรุก 20* (เป็นส่วนหนึ่งของแผนสมดุลตามอายุ)",
  UNIT_COST6: "แผนเชิงรุก 65",
  UNIT_COST7: "แผนหุ้นไทย",
  UNIT_COST8: "แผนกองทุนอสังหาริมทรัพย์ไทย",
  UNIT_COST9: "แผนหุ้นต่างประเทศ",
  UNIT_COST11: "แผนตราสารหนี้ต่างประเทศ",
  UNIT_COST12: "แผนทองคำ",
  UNIT_COST13: "แผนเชิงรุก 75* (เป็นส่วนหนึ่งของแผนสมดุลตามอายุ)",
  UNIT_COST14: "แผนกองทุนรวมวายุภักษ์",
  UNIT_COST15: "แผนเกษียณสบายใจ 2569",
  UNIT_COST16: "แผนการลงทุนตามหลักชะรีอะฮ์"
};

async function fetchMonthData(monthStr: string, yearStr: string) {
  try {
    const res = await axios.get(`https://www.gpf.or.th/thai2019/About/memberfund-api.php?pageName=NAVBottom_${monthStr}_${yearStr}`, {
        responseType: 'text'
    });
    const cleanData = res.data.replace(/^\\uFEFF/, '').trim();
    return JSON.parse(cleanData);
  } catch(e: any) {
    console.error(`Failed to fetch ${monthStr}_${yearStr}:`, e.message);
    return null;
  }
}

async function processDataAndSaveToFirestore(jsonArray: any[]) {
    let updatedCount = 0;
    for (const item of jsonArray) {
        if (!item.LAUNCH_DATE) continue;
        const [datePart] = item.LAUNCH_DATE.split(' ');
        const [dd, mm, yyyy] = datePart.split('/');
        const stdDate = `${yyyy}-${mm}-${dd}`;
        
        try {
            const docRef = doc(db, 'nav_history', stdDate);
            const docSnap = await getDoc(docRef);
            
            let record: any = { date: stdDate };
            if (docSnap.exists()) {
                record = docSnap.data();
            }
            
            let hasChanges = false;
            for (const [key, name] of Object.entries(FUNDS_MAP)) {
                const nav = item[key];
                if (nav !== null && nav !== undefined) {
                   const parsed = parseFloat(nav);
                   if (record[name] !== parsed) {
                     record[name] = parsed;
                     hasChanges = true;
                   }
                }
            }
            
            if (hasChanges || !docSnap.exists()) {
                await setDoc(docRef, record, { merge: true });
                updatedCount++;
            }
        } catch(e) {
            console.error("Error saving to Firestore:", stdDate, e);
        }
    }
    console.log(`Updated/Created ${updatedCount} records.`);
}

async function run() {
    console.log("Starting GitHub Actions NAV sync...");
    const now = new Date();
    // We fetch current month and previous month just to be safe
    for (let i = 0; i < 2; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const y = d.getFullYear().toString();
        
        console.log(`Fetching ${m}/${y}...`);
        const data = await fetchMonthData(m, y);
        if (data && Array.isArray(data)) {
            await processDataAndSaveToFirestore(data);
        }
    }
    console.log("Sync complete. Exiting.");
    process.exit(0);
}

run();
