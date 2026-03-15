---
description: How to recover and start MongoDB when it crashes or hangs
---
# MongoDB Recovery and Troubleshooting (TurkAmerica)

When the `npm run dev` server hangs or fails to connect to the database, or when MongoDB crashes unexpectedly, follow this workflow to recover the server.

## 1. Stop Orphaned Node Processes
Sometimes, old nodemon or node processes can hold onto ports or cause conflicts. Kill them first.
// turbo
```powershell
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
```

## 2. Check MongoDB Port Configuration
Check if there is already a process listening on MongoDB's default port (`27017`).
// turbo
```powershell
netstat -ano | findstr ":27017"
```
If you see a listening process but your app still times out, MongoDB might be in a bad state.

## 3. Repair MongoDB Database
If MongoDB crashed without shutting down cleanly, it leaves behind a `mongod.lock` file that prevents it from starting again. You must run a repair.
// turbo
```powershell
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --repair --dbpath "C:\Program Files\MongoDB\Server\7.0\data"
```
*(Verify your `dbpath` in `C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg` if this fails).*

## 4. Remove the Lock File (if repair fails)
If `--repair` fails because the lock file is stubbornly present, delete it manually, then run repair again.
// turbo
```powershell
Remove-Item "C:\Program Files\MongoDB\Server\7.0\data\mongod.lock" -Force -ErrorAction SilentlyContinue
```

## 5. Restart the MongoDB Service
Once repaired, attempt to start the MongoDB background service again using an **Administrator PowerShell**.
// turbo
```powershell
net start MongoDB
```
If access is denied, ensure you are running the terminal as Administrator, or manually start it using Windows Services (`services.msc`).

## 6. Check the Logs
If MongoDB STILL refuses to start, check the tail of its log file for fatal assertions or unhandled exceptions.
// turbo
```powershell
Get-Content -Tail 50 "C:\Program Files\MongoDB\Server\7.0\log\mongod.log"
```

## 7. Verify the App Connects
Finally, test if Node.js can connect properly before restarting `npm run dev`.
// turbo
```powershell
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://127.0.0.1:27017/turkamerica', {family: 4, serverSelectionTimeoutMS: 5000}).then(() => { console.log('Connected successfully!'); process.exit(0); }).catch(e => { console.error('Connection failed:', e); process.exit(1); });"
```

If it connects, you are ready to:
```powershell
npm run dev
```
