@echo off
powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'C:\Program Files\nodejs\node.exe' -ArgumentList 'C:\Users\5toE-0159\Desktop\Alpha_Stock-Inventario-Sistema_WEB\Backend\server.js' -WorkingDirectory 'C:\Users\5toE-0159\Desktop\Alpha_Stock-Inventario-Sistema_WEB\Backend' -WindowStyle Hidden"
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000/login.html --window-size=1200,800
exit
