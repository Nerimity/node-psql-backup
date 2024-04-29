import process from 'child_process';



async function runAll() {
  console.log("Dumping...")
  const id = await runDump();
  console.log("Uploading...")
  await uploadDump(id);
  console.log("Done!")

}

runAll()



async function runDump() {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 10000000);
    process.exec(`pg_dump -Fc -U postgres postgres -f ${id}.dump`, (err, stdout, stderr) => {
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
    process.exec(`rclone copy /var/lib/postgresql/${id}.dump gdrive:db_backups`, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}