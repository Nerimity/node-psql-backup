import {spawn, exec} from 'process'
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const password = process.env.PASSWORD;

async function runAll() {
  console.log("Dumping...")
  const id = await runDump();
  console.log("Uploading...")
  await compress(id);
  await uploadDump(`encrypted_${id}`);
  console.log("Removing local dump...")
  await removeDump(id);
  await removeDump(`encrypted_${id}`);
  console.log("Done!")
}

console.log("Cron job running...")
// run every day at 00:00
cron.schedule('0 0 * * *', runAll);


async function runDump() {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 10000000);
    exec(`pg_dump -Fc -U postgres postgres -f ${id}.dump`, (err, stdout, stderr) => {
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
    exec(`rclone copy ${id}.dump gdrive:db_backups`, (err, stdout, stderr) => {
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
    exec(`rm ${id}.dump`, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}


async function compress(id) {
  return new Promise((resolve, reject) => {
    const zip = spawn('zip',['-P', password , `encrypted_${id}.zip`, `${id}.dump`]);
    zip .on('exit', function(code) {
      if (code === 0) {
        resolve(true);
      } else {
        reject(code);
      }
    });
  })
}