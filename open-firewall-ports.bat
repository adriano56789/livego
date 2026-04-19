@echo off
echo Abrindo portas necessarias para LiveKit e SRS...

echo.
echo [1/7] Abrindo porta 7880 (LiveKit WebSocket)
netsh advfirewall firewall add rule name="LiveKit-7880" dir=in action=allow protocol=TCP localport=7880

echo [2/7] Abrindo porta 7881 (LiveKit HTTP)
netsh advfirewall firewall add rule name="LiveKit-7881" dir=in action=allow protocol=TCP localport=7881

echo [3/7] Abrindo porta 7882 (LiveKit WebRTC UDP)
netsh advfirewall firewall add rule name="LiveKit-7882" dir=in action=allow protocol=UDP localport=7882

echo [4/7] Abrindo porta 1935 (SRS RTMP)
netsh advfirewall firewall add rule name="SRS-1935" dir=in action=allow protocol=TCP localport=1935

echo [5/7] Abrindo porta 1985 (SRS API)
netsh advfirewall firewall add rule name="SRS-1985" dir=in action=allow protocol=TCP localport=1985

echo [6/7] Abrindo porta 8080 (SRS HLS/FLV)
netsh advfirewall firewall add rule name="SRS-8080" dir=in action=allow protocol=TCP localport=8080

echo [7/7] Abrindo porta 8000 (SRS WebRTC UDP)
netsh advfirewall firewall add rule name="SRS-8000" dir=in action=allow protocol=UDP localport=8000

echo [8/7] Abrindo porta 9000 (SRS API)
netsh advfirewall firewall add rule name="SRS-9000" dir=in action=allow protocol=TCP localport=9000

echo [9/7] Abrindo porta 5060 (SRS API)
netsh advfirewall firewall add rule name="SRS-5060" dir=in action=allow protocol=TCP localport=5060

echo [10/7] Abrindo porta 10080 (SRS WebRTC UDP)
netsh advfirewall firewall add rule name="SRS-10080" dir=in action=allow protocol=UDP localport=10080

echo.
echo Todas as portas foram abertas com sucesso!
echo.
echo Pressione qualquer tecla para continuar...
pause >nul
