import {spawn, exec} from 'child_process'
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const password = process.env.PASSWORD;

async function runAll() {
  console.log("Dumping...")
  const postgres_db_id = await runDump("postgres");
  const cdn_db_id = await runDump("nerimity-cdn");
  
  const encryptedZipId = Math.floor(Math.random() * 10000000);
  console.log("Compressing...")
  await compress(encryptedZipId, [postgres_db_id, cdn_db_id]);

  console.log("Uploading...")
  await uploadDump(`encrypted_${encryptedZipId}.zip`);

  console.log("Removing local dump...")
  await removeDump(`${postgres_db_id}.dump`);s
  await removeDump(`${cdn_db_id}.dump`);
  await removeDump(`encrypted_${encryptedZipId}.zip`);
  console.log("Done!")
}

console.log("Cron job running...")
// run every day at 00:00
cron.schedule('0 0 * * *', runAll);

if (process.argv.includes("now")) {
  runAll();
}


async function runDump(dbName) {
  return new Promise((resolve, reject) => {
    const id = dbName + "_" + Math.floor(Math.random() * 10000000);
    exec(`pg_dump -Fc -U postgres ${dbName} -f ${id}.dump`, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(id);
      }
    });
  });
}

async function uploadDump(id) {
  return new Promise((resolve, reject) => {
    exec(`rclone copy ${id} gdrive:db_backups`, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}
async function removeDump(id) {
  return new Promise((resolve, reject) => {
    exec(`rm ${id}`, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}


async function compress(zipId, ids) {
  return new Promise((resolve, reject) => {
    const zip = spawn('zip',['-P', password , `encrypted_${zipId}.zip`, ...ids.map(id => `${id}.dump`)]);
    zip .on('exit', function(code) {
      if (code === 0) {
        resolve(true);
      } else {
        reject(code);
      }
    });
  })
}